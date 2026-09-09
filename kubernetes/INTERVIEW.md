# Kubernetes — Interview Module (Q&A by topic)

Grouped questions with **model answers** and the **follow-up** the
interviewer asks next. Say the short answer first, then go deeper only if
they lean in.

Related: `sre/INTERVIEW_QA.md` for SLO/incident questions.

> Framing analogy to keep in your head: Kubernetes is an air-traffic
> control system. The scheduler is the tower assigning runways
> (placement), controllers are the radar loop that keeps every plane on
> its assigned path (reconciliation), and probes are the transponders
> reporting "healthy / in distress". Most interview answers come back to
> one of those three.

---

## A. Architecture & the control plane

**Q1. Walk me through what happens when you run `kubectl apply -f deployment.yaml`.**
apiserver authenticates you, runs authz (RBAC) and admission
(webhooks/PSA), validates the object, writes it to etcd. The Deployment
controller creates a ReplicaSet; the ReplicaSet controller creates Pod
objects. The scheduler filters then scores nodes and binds each Pod. The
target node's kubelet pulls images, starts containers via the CRI
runtime, runs probes, and reports status back up.
*Follow-up:* "Where could this get stuck?" → Pending (scheduler can't
place it), ImagePullBackOff (registry/creds), CrashLoopBackOff (app),
readiness never passing (rollout stalls).

**Q2. What is etcd and why does it matter?**
The consistent key-value store holding all cluster state and Secrets.
Only the apiserver talks to it. Needs odd-member quorum (3/5); losing
quorum makes the API read-only. Must be encrypted at rest and backed up.
*Follow-up:* "How would you back it up and restore?" →
`etcdctl snapshot save`, store off-cluster, test restore into a scratch
cluster; for managed control planes the provider does this.

**Q3. Control plane vs node components — name them and their jobs.**
Control plane: apiserver (front door), etcd (state), scheduler
(placement), controller-manager (loops), cloud-controller-manager.
Node: kubelet (runs/monitors Pods), container runtime (containerd),
kube-proxy (Service routing), CNI (Pod networking).
*Follow-up:* "Which can you lose and stay serving traffic?" → All control
plane components briefly — running Pods keep running and kube-proxy keeps
routing; you just can't schedule, scale, or heal until it's back.

**Q4. Explain the reconciliation / controller pattern.**
A loop: read desired (spec), observe actual (status), take one action to
close the gap, repeat. Level-triggered (re-reads full state, so missed
events self-heal) and idempotent. Self-healing, rollouts and autoscaling
are all this loop.
*Follow-up:* "Edge-triggered vs level-triggered — why does K8s choose
level?" → resilience: a dropped watch event doesn't cause permanent
divergence; the next resync fixes it.

---

## B. Workloads & rollouts

**Q5. Deployment vs StatefulSet vs DaemonSet vs Job/CronJob.**
Deployment: stateless, fungible Pods, rolling updates. StatefulSet:
stable identity + stable per-Pod storage + ordered ops (databases,
quorum systems). DaemonSet: one Pod per node (log/metrics agents, CNI).
Job: run to completion with retries; CronJob: Jobs on a schedule.
*Follow-up:* "You have Redis — which, and why?" → StatefulSet if it's
clustered/persistent (identity + PVC per Pod); a Deployment is fine for a
throwaway cache with no persistence.

**Q6. How does a RollingUpdate work? What do `maxSurge` / `maxUnavailable` do?**
New ReplicaSet scales up while old scales down, gated on new Pods
passing **readiness**. `maxSurge` = how many extra above desired during
the roll; `maxUnavailable` = how many below desired. `0/1` = never lose
capacity, add one at a time.
*Follow-up:* "Your rollout is stuck at 2/5 for 10 minutes — what do you
do?" → describe + logs the new (not-Ready) Pods; it's gated on their
readiness. Find the cause (bad config, failing dependency, wrong port).
`rollout undo` only once you know it's a bad build.

**Q7. Blue/green vs canary — trade-offs.**
Blue/green: two full environments, instant switch and instant rollback,
2× resource cost, no partial exposure. Canary: shift a small % of
traffic, watch SLOs, ramp or auto-abort — cheaper, catches issues on
real traffic, slower and needs traffic-splitting (mesh/Ingress/Argo
Rollouts).
*Follow-up:* "Do it with plain K8s, no mesh." → two Deployments
(`slot: blue/green`), one Service; flip the selector to cut over
(`kubectl patch service`). See `manifests/10-blue-green.yaml`.

**Q8. What actually happens on `kubectl delete pod`?**
Pod removed from Service Endpoints immediately; kubelet sends SIGTERM,
runs `preStop`, waits up to `terminationGracePeriodSeconds`, then
SIGKILL. Its controller (ReplicaSet) notices the shortfall and creates a
replacement.
*Follow-up:* "How do you get zero-dropped-requests on rollout?" → handle
SIGTERM (stop accepting, drain in-flight), add a `preStop` sleep (~5–15s)
so the LB stops routing before the process exits, set an adequate grace
period.

---

## C. Networking & Services

**Q9. How does a `ClusterIP` Service actually route traffic?**
It's a virtual IP with no process behind it. `kube-proxy` programs the
node (iptables/IPVS/eBPF) to DNAT the ClusterIP to a random **Ready**
Pod IP from the Service's `Endpoints` (recomputed continuously from the
label selector + readiness).
*Follow-up:* "Service exists but connections hang — where do you look?"
→ `kubectl get endpoints <svc>` (empty = selector mismatch or all Pods
not Ready), then Pod readiness, then NetworkPolicy, then `targetPort`
vs container port.

**Q10. `kubectl exec` into a Pod, `curl http://api` fails. Debug order.**
`nslookup api` (DNS/CoreDNS working? right namespace?), `kubectl get svc
api` and `get endpoints api` (backends present?), check the Pod's
readiness, check NetworkPolicy (default-deny without a DNS egress rule
breaks *all* name resolution), check `targetPort`.
*Follow-up:* "DNS resolves but intermittently fails under load." →
classic CoreDNS/`conntrack` + NAT race, or CoreDNS under-scaled; fix
with NodeLocal DNSCache, more CoreDNS replicas, `ndots:2`, or
`conntrack` tuning.

**Q11. ClusterIP vs NodePort vs LoadBalancer vs Ingress.**
ClusterIP: in-cluster only. NodePort: + a port on every node.
LoadBalancer: + a cloud LB → NodePorts. Ingress: L7 host/path routing +
TLS for many Services behind one LB, implemented by an Ingress
controller.
*Follow-up:* "Why not a LoadBalancer per service?" → cost and IP sprawl;
Ingress (or Gateway API) consolidates onto one LB with routing rules.

**Q12. What is a headless Service and when do you need one?**
`clusterIP: None` — DNS returns Pod IPs directly instead of a VIP.
Needed for StatefulSets (per-Pod DNS `pod-0.svc...`) and clients that do
their own load balancing / need to address individual Pods (databases,
Kafka).

---

## D. Config, storage & security

**Q13. Is a Secret encrypted? How do you actually protect secrets?**
No — base64 in etcd. Protect with: encryption-at-rest for etcd, tight
RBAC on `get secret`, and an external manager (External Secrets
Operator, Vault, cloud secret store) syncing values in. Don't commit
manifests with real secret values.
*Follow-up:* "Rotate a DB password with zero downtime." → write new
secret version, roll the consumers (or use a sidecar/agent that reloads),
then retire the old credential once nothing uses it.

**Q14. You edited a ConfigMap and nothing changed. Why?**
Env-var injection happens once at container start. Editing the ConfigMap
doesn't restart Pods. Fix: `kubectl rollout restart`, or mount the
ConfigMap as a volume (updates in place after a kubelet sync delay), or
set a `checksum/config` annotation (Helm/Kustomize) so config changes
trigger a rollout.

**Q15. PV vs PVC vs StorageClass. What is `reclaimPolicy`?**
StorageClass = a template for provisioning disks. PVC = a request. PV =
the provisioned volume, bound to the PVC. `reclaimPolicy: Retain` keeps
the disk when the PVC is deleted (safe for data); `Delete` removes it.
*Follow-up:* "PVC stuck `Pending`." → no matching StorageClass / default
class, `WaitForFirstConsumer` and no Pod yet, or a zone mismatch between
the disk and where the Pod can schedule.

**Q16. How do you lock down a workload?**
Own ServiceAccount with least-privilege RBAC (or no token). `security
Context`: `runAsNonRoot`, `readOnlyRootFilesystem`, drop ALL
capabilities, `seccompProfile: RuntimeDefault`, no privilege escalation.
Pod Security Admission `restricted`. NetworkPolicy default-deny + explicit
allows. Signed images enforced by an admission policy.

---

## E. Scheduling, scaling & self-healing

**Q17. requests vs limits. What happens at each ceiling?**
Requests = what the scheduler reserves and the basis for HPA %. Limits =
hard ceiling. Over memory limit → **OOMKilled** (exit 137). Over CPU
limit → **throttled** (slower, not killed) — frequently misdiagnosed as
a slow app.
*Follow-up:* "Latency is up and CPU is at the limit — add replicas?" →
first check `container_cpu_cfs_throttled_seconds`; if it's throttling,
**raise the CPU limit** (or remove it), because more replicas each still
hit the same per-Pod ceiling.

**Q18. Explain QoS classes and eviction order.**
`Guaranteed` (requests == limits for all resources), `Burstable` (some
requests), `BestEffort` (none). Under node memory pressure the kubelet
evicts BestEffort first, then Burstable over its requests, Guaranteed
last. Setting requests keeps you off the top of the hit list.

**Q19. The three probes — what is each for, and a probe that caused an outage?**
startup: "still booting" — holds off the others. liveness: "wedged →
restart me" — keep it cheap and **dependency-free**. readiness: "route to
me?" — may check dependencies; failing it just removes traffic.
*War story:* a liveness probe that queried the database. DB blipped →
every Pod failed liveness → every Pod restarted simultaneously →
thundering herd kept the DB down. Fix: liveness checks only the process;
dependency checks go in readiness.

**Q20. HPA isn't scaling. Root causes, in order of likelihood.**
(1) No resource **requests** set → no utilisation ratio to compute.
(2) metrics-server not installed / not ready. (3) Already at
`maxReplicas`. (4) Custom metric adapter misconfigured. (5) `behavior`
scale-up stabilization/policies too conservative.

**Q21. Node goes `NotReady`. What does Kubernetes do, and what do you do?**
Control plane: after `node-monitor-grace-period` the node is `NotReady`;
after the eviction timeout, Pods are marked for deletion and recreated
elsewhere by their controllers (respecting PDBs). You: check
`kubectl describe node` (DiskPressure? MemoryPressure? kubelet down?),
check the node itself (kubelet/containerd logs, disk), cordon +
drain if it's flapping, replace it if it's an immutable node group.

---

## F. Troubleshooting rapid-fire

| Symptom | First check |
|---------|-------------|
| Pod `Pending` | `kubectl describe pod` → scheduler message (Insufficient cpu / taints / unbound PVC) |
| `ImagePullBackOff` | image name/tag typo; registry auth (`imagePullSecrets`); private registry reachable |
| `CrashLoopBackOff` | `kubectl logs --previous`; bad config/env; missing dependency; wrong command |
| `OOMKilled` (137) | memory limit too low or a leak; runtime not cgroup-aware |
| Rollout stuck | new Pods failing readiness → `describe` + `logs` the new Pod |
| Service hangs | `kubectl get endpoints` empty → selector/readiness/targetPort |
| DNS flaky | CoreDNS replicas/scaling; NodeLocal DNSCache; NetworkPolicy blocking :53 |
| PVC `Pending` | no default StorageClass; `WaitForFirstConsumer`; zone mismatch |
| `Terminating` forever | finalizer stuck; node gone; `kubectl delete --grace-period=0 --force` as last resort |
| Everything slow after deploy | CPU throttling (check cfs_throttled); missing HPA; noisy neighbour (no requests) |

*Follow-up they always ask:* "How would you have **prevented** this?" —
have a real answer: resource requests everywhere, readiness that reflects
real health, PodDisruptionBudgets, NetworkPolicies tested with a real
blocked call, image tags pinned, config-change → rollout wired up,
alerting on symptoms not causes.
