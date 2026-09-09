# Kubernetes — The Beginner's Guide

> Kubernetes is one idea repeated everywhere: **you declare what you
> want, and a control loop makes reality match, forever.** Learn the
> loop and the rest is vocabulary.

Runnable manifests: `kubernetes/manifests/01`…`10`.

---

## 1. The control loop

```
        ┌─────────────────────────────────────────┐
        ▼                                         │
  read DESIRED state (your YAML in etcd)          │
        │                                         │
  observe ACTUAL state (what is running)          │
        │                                         │
  actual == desired ?  ──yes──▶ do nothing ───────┘
        │ no
  take one action to close the gap ───────────────┘
```

A Pod crashes → actual (2 running) ≠ desired (3) → controller creates
one. You change the image → the Deployment controller rolls Pods to
match. Everything — scaling, healing, rollouts — is this loop with a
different `spec`.

### Analogy — cruise control

You set 110 km/h (**desired**). The car reads current speed (**actual**)
and feeds or eases the throttle to close the gap. It does not care *why*
you slowed — a hill, a headwind, a crash — it just keeps closing the
gap. Kubernetes controllers are cruise control for infrastructure.

---

## 2. The parts

**Control plane** (the brain — run it HA, 3 or 5 nodes):

| Component | Job |
|-----------|-----|
| `kube-apiserver` | The only door. Validates and serves all reads/writes. Everything talks to this, nothing else. |
| `etcd` | The database. Every object, every Secret, all cluster state. Back it up. Encrypt it. |
| `kube-scheduler` | Decides which node each new Pod runs on. |
| `kube-controller-manager` | Runs the built-in control loops (Deployment, ReplicaSet, Node, Job, …). |
| `cloud-controller-manager` | Talks to the cloud for LoadBalancers, node lifecycle, routes. |

**Every node** (the muscle):

| Component | Job |
|-----------|-----|
| `kubelet` | Talks to the container runtime; starts/stops containers; runs probes; reports status. |
| container runtime | `containerd` / CRI-O — actually runs containers. |
| `kube-proxy` | Programs the node so `Service` virtual IPs route to Pod IPs (iptables/IPVS/eBPF). |
| CNI plugin | Gives each Pod an IP and wires Pod-to-Pod networking (Calico, Cilium, …). |

---

## 3. What happens on `kubectl apply -f deploy.yaml`

```
you ──▶ apiserver: validate, authn/authz, admission webhooks, write to etcd
                     │
   Deployment controller sees a new Deployment ──▶ creates a ReplicaSet
                     │
   ReplicaSet controller sees replicas:3, 0 exist ──▶ creates 3 Pod objects
                     │
   scheduler sees 3 unbound Pods ──▶ for each: FILTER nodes (fits? taints?
                     │                          tolerations? affinity?)
                     │                        SCORE survivors (spread, load)
                     │                        BIND Pod → best node
                     │
   that node's kubelet sees "a Pod for me" ──▶ pull images, create
                     │                          containers, run probes
                     │
   kubelet ──▶ apiserver: Pod status = Running, Ready
```

`kubectl get events --sort-by=.lastTimestamp` shows this narrative,
including *why* something is stuck (`0/12 nodes available: 3 Insufficient
cpu, 9 node(s) had untolerated taint`).

---

## 4. Objects — all the same shape

```yaml
apiVersion: apps/v1     # which API group + version
kind: Deployment        # what kind of thing
metadata:
  name: checkout        # its name (+ labels, annotations, namespace)
spec:                   # DESIRED state — you write this
  replicas: 3
  ...
status:                 # OBSERVED state — the controller writes this
  readyReplicas: 3
```

Controllers own the gap between `spec` and `status`. You almost never
write `status`.

The objects you meet first:

- **Pod** — one or more containers that share a network namespace and can
  share volumes. The unit of scheduling. You rarely create one directly.
- **ReplicaSet** — keeps N identical Pods alive. Usually created *for*
  you by a Deployment.
- **Deployment** — manages ReplicaSets to give you rolling updates and
  rollback. Your default for stateless apps.
- **Service** — a stable virtual IP + DNS name in front of a changing set
  of Pods, selected **by label**.
- **ConfigMap / Secret** — configuration and credentials, kept out of the
  image.
- **Ingress** — HTTP host/path routing + TLS in front of Services.
- **Namespace** — a scope for names + a boundary for quota and RBAC.

---

## 5. Labels and selectors — the glue

Kubernetes wires things together by **label query**, never by name or IP.

```yaml
# Pods carry labels
metadata:
  labels: { app: checkout, version: v2 }
---
# a Service selects them
spec:
  selector: { app: checkout }     # → routes to every Ready Pod with app=checkout
```

The Service's `Endpoints` object is recomputed continuously: it is
"every Pod matching the selector that is currently **Ready**". A
readiness probe that fails removes a Pod from that list — no traffic, no
restart.

---

## 6. `kubectl` — the ten commands you will actually use

```bash
kubectl get pods -o wide                 # what is running, on which node
kubectl describe pod <p>                 # events + why it is unhappy
kubectl logs <p> -f                      # stream logs   (--previous for a crashed one)
kubectl get events --sort-by=.lastTimestamp
kubectl exec -it <p> -- sh               # shell inside
kubectl rollout status deploy/<d>        # is the deploy done?
kubectl rollout undo   deploy/<d>        # back to the previous ReplicaSet
kubectl top pod / kubectl top node       # live CPU/memory (needs metrics-server)
kubectl apply -f <dir/>                  # declarative create/update
kubectl diff  -f <file>                  # what would apply change?
```

---

## 7. Production examples

**Example: a node dies at 3 a.m.** No page. The node controller marks it
`NotReady`, its Pods are rescheduled onto healthy nodes by their
ReplicaSets, the Service Endpoints update, traffic shifts. You read about
it in the morning. That is the control loop earning its keep.

**Example: a bad deploy.** New image `:v9` has a config bug; its Pods
fail the readiness probe. The RollingUpdate **stalls** at 1/5 updated
instead of taking the service down, because it waits for readiness before
retiring old Pods. You `kubectl logs` the new Pod, see the bug,
`kubectl rollout undo`, and no user ever noticed.

**Example: traffic triples.** The HPA sees CPU cross 65% of requests and
scales `checkout` from 4 → 18 Pods over two minutes. Those Pods do not
fit, so the Cluster Autoscaler adds 3 nodes. After the spike, both scale
back down (slowly, to avoid thrash).

**Example: "it works in staging".** It does, because staging and prod are
the same manifests with a different Kustomize overlay — same image, same
probes, same resource ratios. The only differences are replica counts
and hostnames, and those are in version control.

---

## 8. Next

- **`kubernetes/DEEP_DIVE.md`** — scheduler internals, the networking
  model, CSI, RBAC, admission, operators.
- **`kubernetes/APPLICATIONS.md`** — deploying stateless, stateful,
  autoscaled and blue/green workloads, step by step.
- **`kubernetes/PROD_SCENARIOS.md`** — the 12 failures you will debug.
- **`kubernetes/INTERVIEW.md`** — grouped Q&A with follow-ups.
