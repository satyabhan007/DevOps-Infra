# Kubernetes — Deep Dive

The mechanisms behind the objects. Read `BEGINNER_GUIDE.md` first.

---

## 1. The scheduler, precisely

For each unbound Pod, `kube-scheduler` runs two phases:

**Filter (predicates)** — remove nodes that *cannot* run this Pod:
- insufficient allocatable CPU/memory (based on **requests**, not usage)
- node taint the Pod does not tolerate
- `nodeSelector` / required `nodeAffinity` mismatch
- Pod anti-affinity conflict
- no free host port; volume zone conflict

**Score (priorities)** — rank the survivors:
- `NodeResourcesFit` (spread load, or bin-pack, depending on policy)
- `PodTopologySpread` — honour `topologySpreadConstraints`
- `InterPodAffinity`, `ImageLocality` (node already has the image),
  `NodeAffinity` preferred rules

Highest score wins; ties broken randomly. Then **Bind** (write
`Pod.spec.nodeName`). The kubelet on that node takes it from there.

Key consequence: **no requests → the scheduler is blind.** It packs Pods
by requested resources; with none set it assumes ~0 and overcommits the
node until things OOM or throttle.

### Analogy — a restaurant seating host

Filter = "which tables physically fit a party of 6 and are not
reserved?" Score = "of those, which keeps the room balanced and near the
kitchen?" Bind = walking them to the table. The waiter (kubelet) then
serves them.

---

## 2. The Pod lifecycle

```
Pending ─▶ (scheduled) ─▶ ContainerCreating ─▶ Running ─▶ Succeeded / Failed
   │                              │                │
   │ can't schedule               │ image pull     │ liveness fails → restart
   │ (Insufficient cpu,           │ fails          │   (CrashLoopBackOff after
   │  unbound PVC, taints)        │ (ImagePull-    │    repeated restarts:
   │                              │  BackOff)      │    10s,20s,40s…max 5m)
```

- **initContainers** run to completion, in order, before app containers.
- **restartPolicy** `Always` (Deployments) / `OnFailure` / `Never`
  (Jobs).
- **`terminationGracePeriodSeconds`**: on delete, kubelet sends
  `SIGTERM`, runs `preStop`, waits up to the grace period, then
  `SIGKILL`. The Pod is removed from Service Endpoints *at the start* of
  this.

---

## 3. The networking model

Four rules every CNI must satisfy:

1. every Pod gets its own routable IP
2. Pods on a node can reach all Pods on all nodes **without NAT**
3. agents on a node (kubelet) can reach all Pods on that node
4. a Pod sees its own IP as others see it

**Service** types:
- `ClusterIP` — a virtual IP; `kube-proxy` (iptables/IPVS/eBPF) DNATs it
  to a random Ready Pod IP. In-cluster only.
- `NodePort` — plus a port (30000–32767) on *every* node.
- `LoadBalancer` — plus a cloud LB pointing at the NodePorts.
- **headless** (`clusterIP: None`) — no VIP; DNS returns the Pod IPs
  directly. StatefulSets use this for per-Pod names.

**DNS**: CoreDNS gives every Service a name
`<svc>.<ns>.svc.cluster.local`. A Pod's `resolv.conf` search path makes
`curl http://api` work from the same namespace.

**Ingress vs Gateway API**: Ingress is the older HTTP-only object;
Gateway API (`GatewayClass`/`Gateway`/`HTTPRoute`) is the successor —
role-oriented, protocol-aware, the direction of travel.

**Network model gotcha:** `NetworkPolicy` is only enforced if the CNI
supports it (Calico, Cilium, Antrea do; flannel does not). On a
non-enforcing CNI, policies apply cleanly and silently do nothing.

---

## 4. Storage: the CSI lifecycle

```
StorageClass            "what kind of disk" (gp3, ssd, nfs) + provisioner + params
   │
PVC (a claim)   ──────▶  provisioner watches, creates a real disk
   │                     + a PV object, binds PVC ↔ PV
PV (the volume)
   │
Pod mounts the PVC ────▶ CSI driver: ControllerPublish (attach to node)
                                     NodeStage / NodePublish (mount into Pod)
```

- **`accessModes`**: `ReadWriteOnce` (one node — most block storage),
  `ReadWriteMany` (many nodes — needs NFS/CephFS/EFS), `ReadOnlyMany`.
- **`reclaimPolicy`**: `Delete` (PV + disk deleted with the PVC) vs
  `Retain` (disk kept; you clean up manually — safer for databases).
- **`volumeBindingMode: WaitForFirstConsumer`** delays disk creation
  until a Pod is scheduled, so the disk lands in the Pod's zone.
- **StatefulSet `volumeClaimTemplates`** create one PVC per Pod
  (`data-db-0`, `data-db-1`), retained when the Pod is deleted.

---

## 5. RBAC

```
Subject (User | Group | ServiceAccount)
   └── RoleBinding / ClusterRoleBinding ──▶ Role (namespaced) | ClusterRole
                                              rules: [{apiGroups, resources, verbs}]
```

- **Role + RoleBinding** = permissions in one namespace.
- **ClusterRole + ClusterRoleBinding** = cluster-wide, or cluster-scoped
  resources (nodes, PVs, CRDs).
- **ClusterRole + RoleBinding** = reuse a cluster role's rules, scoped to
  one namespace.
- Verbs: `get list watch create update patch delete deletecollection`.
- **ServiceAccounts** are the identity workloads use. Give each workload
  its own, with least privilege. Set
  `automountServiceAccountToken: false` unless the app calls the API.

Debug with `kubectl auth can-i --list --as=system:serviceaccount:ns:sa`.

---

## 6. Admission control

After authn/authz, before persistence, the apiserver runs **admission
plugins** and **webhooks**:

- **Mutating** webhooks change the object: inject a sidecar, add default
  labels, set `imagePullSecrets`. (Istio/Linkerd sidecar injection, for
  example.)
- **Validating** webhooks accept or reject: Kyverno / Gatekeeper (OPA)
  enforcing "no `:latest`", "resource limits required", "no privileged
  Pods", "images only from our registry".
- **Pod Security Admission** (built in): namespace labels select
  `privileged` / `baseline` / `restricted` profiles.

Because this runs at write time, the rules hold even for a human doing
`kubectl apply` — unlike a CI-only check.

---

## 7. Controllers and the Operator pattern

A controller = `informer` (a cached, event-driven watch on the API) +
`workqueue` + `reconcile(key)` function that is **idempotent** and
**level-triggered** (it re-reads full state each call; a missed event is
recovered on the next resync).

An **Operator** is a custom controller + **CRD** that encodes operational
knowledge: "how to take a backup", "how to do a safe Postgres failover",
"how to rotate this certificate". You then `kubectl apply` a
`PostgresCluster` object and the operator runs the database.

```
CRD: kind: PostgresCluster        # extends the API
Operator: watches PostgresCluster ──▶ creates StatefulSet, Services,
          Secrets, PDB, backup CronJob, and handles failover
```

---

## 8. etcd — the thing you must protect

**In production**, most severe cluster incidents trace back here: a full
etcd disk (the API goes read-only until you compact + defrag + disarm the
alarm), a lost quorum after two of three control-plane nodes reboot
together, or an unencrypted etcd backup ending up in object storage with
every Secret in it. Treat etcd like the primary database it is.

- Single source of truth: **every** object and Secret.
- Run 3 or 5 members (odd, for quorum). Losing quorum = API read-only.
- **Encrypt at rest** (`EncryptionConfiguration`) so Secrets are not
  plaintext on disk.
- **Back up** (`etcdctl snapshot save`) on a schedule and test restores.
- Watch disk: a full etcd disk trips a `NOSPACE` alarm and the whole API
  goes read-only until you compact/defrag and disarm it.

---

## 9. Where this shows up

- Scheduling failures → `kubernetes/PROD_SCENARIOS.md` §"Pending"
- Networking / DNS → `PROD_SCENARIOS.md` §"DNS", §"Service has no
  endpoints"
- RBAC / security labs → `kubernetes/manifests/07-rbac.yaml`,
  `08-networkpolicy.yaml`
- Interview framing → `kubernetes/INTERVIEW.md`
