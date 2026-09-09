# Kubernetes — Production Scenarios (on-call runbooks)

Twelve failures you *will* meet, each as **symptom → diagnose → fix →
prevent**. Written the way a runbook should be: copy-paste commands, a
decision, and a follow-up that stops it recurring.

> Analogy for the whole file: Kubernetes is a hospital with an
> ever-watching charge nurse (the control loop). Most nights it handles
> everything. These scenarios are the cases where the nurse pages the
> doctor — and what the doctor actually does.

---

## 1. CrashLoopBackOff

**Symptom.** `kubectl get pods` shows `CrashLoopBackOff`, restart count
climbing, back-off growing 10s → 20s → 40s → … → 5m.

**Diagnose.**
```bash
kubectl logs <pod> --previous          # logs from the crashed instance
kubectl describe pod <pod>             # exit code, last state, events
```
Common causes: bad/missing env or config, a dependency not reachable at
boot, wrong `command`/`args`, migration failing, file permission
(non-root user, `readOnlyRootFilesystem` with a needed write path),
`OOMKilled` on start.

**Fix.** Address the actual error from `--previous` logs. If it is a
missing dependency at boot, add an `initContainer` that waits, or make
the app retry with backoff instead of exiting.

**Prevent.** Fail fast with a *clear* message on missing config. Don't
put slow dependency checks in the startup path — use `startupProbe` +
retries. Keep a `readinessProbe` so a crashing new version stalls the
rollout instead of replacing healthy Pods.

---

## 2. ImagePullBackOff / ErrImagePull

**Symptom.** Pod stuck `ContainerCreating`, events show
`Failed to pull image ... 401 Unauthorized` or `not found`.

**Diagnose.**
```bash
kubectl describe pod <pod> | grep -A5 Events
```
- `not found` / `manifest unknown` → tag typo, image never pushed, wrong
  registry path.
- `401/403` → missing or wrong `imagePullSecrets`, expired token,
  node's IAM role lacks registry read.
- timeouts → registry unreachable from nodes (network, proxy, private
  endpoint).

**Fix.** Correct the tag; create/attach the pull secret
(`kubectl create secret docker-registry ...` and reference it on the
ServiceAccount or Pod); fix node egress to the registry.

**Prevent.** CI verifies the image exists and is pullable before it
opens the deploy PR. Use immutable tags or digests. Attach pull secrets
at the ServiceAccount level so every Pod inherits them.

---

## 3. Pod stuck `Pending` forever

**Symptom.** `kubectl get pod` → `Pending`, no node assigned.

**Diagnose.** `kubectl describe pod <pod>` — the scheduler writes the
reason verbatim:
- `0/12 nodes available: 8 Insufficient cpu, 4 Insufficient memory` →
  requests don't fit anywhere.
- `node(s) had untolerated taint {dedicated: gpu}` → needs a toleration
  / different node pool.
- `pod has unbound immediate PersistentVolumeClaims` → storage issue
  (see §9).
- `didn't match Pod topology spread constraints` / affinity.

**Fix.** Lower the request if it's oversized; add capacity / let the
Cluster Autoscaler add a node; add the toleration or `nodeSelector`;
relax a too-strict `whenUnsatisfiable: DoNotSchedule`.

**Prevent.** Right-size requests from real usage (VPA in *recommend*
mode). Ensure the autoscaler covers the instance types your requests
need. Keep headroom for failover.

---

## 4. OOMKilled

**Symptom.** Container restarts; `kubectl describe pod` →
`Last State: Terminated, Reason: OOMKilled, Exit Code: 137`. Often under
load, often intermittent.

**Diagnose.** Compare `kubectl top pod` peak vs the memory **limit**.
Check whether the runtime is cgroup-aware (old JVM, Node without
`--max-old-space-size`, Go without `GOMEMLIMIT`). Look for unbounded
caches / large request bodies / whole-file loads.

**Fix.** Make the runtime respect the cgroup limit; raise the limit
**and** the request together if the working set is legitimately that
size; fix the leak or stream instead of buffering.

**Prevent.** Load-test with the production limit set. Alert on
`working_set / limit > 0.9`. For latency-critical services set
`requests == limits` for memory (Guaranteed QoS) so they're evicted
last.

---

## 5. CPU throttling that looks like a slow app

**Symptom.** p99 latency doubled. CPU sits pinned at the limit. No
errors, no restarts. Adding replicas barely helps.

**Diagnose.**
```bash
kubectl exec <pod> -- cat /sys/fs/cgroup/cpu.stat   # nr_throttled, throttled_usec
```
Rising `throttled_usec` = the kernel is pausing your process every CFS
period because it hit the CPU limit.

**Fix.** Raise or remove the CPU **limit** (many shops set CPU requests
but no CPU limit deliberately, to allow bursting). Note: more replicas
doesn't fix it because each replica still hits the same per-Pod ceiling.

**Prevent.** Dashboard throttling next to latency. Be deliberate about
CPU limits — they trade predictability for tail latency.

---

## 6. Rollout stuck / bad deploy

**Symptom.** `kubectl rollout status deploy/x` hangs.
`kubectl get rs` shows the new ReplicaSet at 1–2 Pods, none Ready.

**Diagnose.** `kubectl describe pod <new-pod>` + `kubectl logs
<new-pod>`. Usual causes: readiness endpoint wrong/failing, new config
key missing, DB migration not run, wrong port, image needs a secret it
doesn't have.

**Fix.** Fix forward if it's trivial and safe; otherwise
`kubectl rollout undo deploy/x` (reverts to the previous ReplicaSet in
seconds). The RollingUpdate design already protected you — old Pods were
never retired.

**Prevent.** `maxUnavailable: 0`. A readiness probe that genuinely
reflects "can serve". Run migrations as a separate gated step, not in
the app's boot path. Canary the first 5% and watch SLOs.

---

## 7. Service has no endpoints / traffic blackholes

**Symptom.** `curl` to the Service name hangs or connection-refused,
even though Pods are `Running`.

**Diagnose.**
```bash
kubectl get endpoints <svc> -o wide     # empty? then the Service selects nothing Ready
kubectl get pods -l <selector> -o wide   # do these Pods exist and are they Ready?
```
Causes: selector typo (Service `app: checkout`, Pods `app: checkout-api`),
all Pods failing readiness, `targetPort` doesn't match the container
port, `Service.spec.ports.name` mismatch with a named port.

**Fix.** Align labels/selector; fix readiness; fix `targetPort`.

**Prevent.** Generate Service + Deployment from one template so labels
can't drift. `kubectl diff` in CI. A synthetic probe hitting the Service.

---

## 8. DNS resolution is flaky under load

**Symptom.** Intermittent `Name or service not known` /
`Temporary failure in name resolution`, worse during traffic spikes.

**Diagnose.** `kubectl -n kube-system get pods -l k8s-app=kube-dns` —
CoreDNS replica count vs cluster size, CoreDNS CPU/throttling, restarts.
Check for a NetworkPolicy that forgot to allow egress UDP/TCP :53.
Classic root cause: `conntrack` races on DNAT for parallel DNS lookups.

**Fix.** Deploy **NodeLocal DNSCache**. Scale CoreDNS (or enable its
HPA). Reduce `ndots` (default 5 → many wasted lookups); set
`ndots:2` via `dnsConfig`. Add the `:53` egress rule to policies.

**Prevent.** NodeLocal DNSCache as a standard add-on. Alert on CoreDNS
error rate and latency. Test NetworkPolicies with a real cross-namespace
lookup.

---

## 9. PVC stuck `Pending`

**Symptom.** `kubectl get pvc` → `Pending`; the Pod that needs it is also
`Pending`.

**Diagnose.** `kubectl describe pvc <pvc>`:
- `no persistent volumes available ... no storage class` → no default
  StorageClass, or the named class doesn't exist.
- `waiting for first consumer` → `volumeBindingMode:
  WaitForFirstConsumer` — normal until a Pod is scheduled; if the Pod is
  *also* stuck, it's a scheduling problem, not storage.
- zone mismatch → the disk can only attach in zone A, the Pod can only
  schedule in zone B.

**Fix.** Set/annotate a default StorageClass; use the correct class name;
align zones (topology-aware provisioning + spread).

**Prevent.** Exactly one default StorageClass. `WaitForFirstConsumer`
for zonal disks. Document which classes exist and their `reclaimPolicy`.

---

## 10. Namespace / Pod stuck `Terminating`

**Symptom.** `kubectl delete` returns, but the object sits `Terminating`
for minutes/forever.

**Diagnose.** `kubectl get <obj> -o yaml | grep -A5 finalizers`. A
controller that owns a finalizer is down or wedged, so cleanup never
completes. For namespaces it's usually an APIService (aggregated API)
that's unavailable.
```bash
kubectl get apiservices | grep -v True     # broken aggregated APIs block namespace deletion
```

**Fix.** Restore/repair the controller behind the finalizer. Last
resort (understand the consequence — you're skipping cleanup):
`kubectl patch <obj> -p '{"metadata":{"finalizers":[]}}' --type=merge`
or `kubectl delete pod <p> --grace-period=0 --force`.

**Prevent.** Monitor `apiservices` health. Don't force-remove finalizers
as a habit — you can orphan cloud resources (load balancers, disks).

---

## 11. Node `NotReady` / `DiskPressure`

**Symptom.** `kubectl get nodes` → one/many `NotReady`. Pods on it go
`Terminating`/`Unknown` then reschedule.

**Diagnose.** `kubectl describe node <n>` conditions:
`DiskPressure`/`MemoryPressure`/`PIDPressure`, or kubelet not posting
status (kubelet/containerd crashed, network to apiserver lost).
DiskPressure is usually image sprawl + unrotated container logs.

**Fix.** `kubectl cordon <n>` then `kubectl drain <n> --ignore-daemonsets
--delete-emptydir-data` (respects PDBs). Clean disk / restart kubelet, or
terminate the node and let the node group replace it.

**Prevent.** Kubelet image GC thresholds + log rotation. Alert on node
disk > 80%, memory > 85%. Immutable node groups so "replace" is the
default repair.

---

## 12. 502 / dropped connections during every deploy

**Symptom.** Each rollout produces a burst of 502/504 or connection
resets at the load balancer, for a few seconds.

**Diagnose.** Timeline the 502s against Pod termination. The gap:
Kubernetes removes the Pod from Endpoints *and* sends SIGTERM at the same
moment, but the external LB / Ingress takes a beat to stop routing — so
requests land on a process that's already shutting down. Also check the
app actually handles SIGTERM (see `docker/SCENARIOS.md` §3).

**Fix.**
```yaml
lifecycle:
  preStop:
    exec: { command: ["sh", "-c", "sleep 10"] }   # keep serving while the LB drains
terminationGracePeriodSeconds: 40
```
and make the app: on SIGTERM → stop accepting new, finish in-flight,
close pools, exit 0.

**Prevent.** Standardise `preStop` sleep + SIGTERM handling in the base
image / Helm chart. Readiness that flips to not-ready on shutdown.
Connection draining enabled on the LB.

---

## The command belt

```bash
kubectl get events --sort-by=.lastTimestamp -A | tail -40
kubectl describe pod <p>
kubectl logs <p> --previous --timestamps
kubectl get pod <p> -o jsonpath='{.status.containerStatuses[*].lastState}'
kubectl top pod --containers ; kubectl top node
kubectl get endpoints <svc> -o wide
kubectl rollout history deploy/<d> ; kubectl rollout undo deploy/<d>
kubectl debug -it <p> --image=nicolaka/netshoot --target=<container>   # network toolbox
kubectl get --raw /healthz?verbose                                     # apiserver health
```

Golden habit: after every incident, **one owned, dated fix that makes
this exact failure impossible or self-healing** — not "be careful".
