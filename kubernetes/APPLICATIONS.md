# Kubernetes — Deploying Real Applications

Four shapes of workload, each start to finish, mapped to the runnable
manifests in `kubernetes/manifests/`.

> Analogy: think of these as four kinds of tenant in an apartment
> building. Stateless workers are short-stay guests (any room will do,
> swap freely). Databases are long-term residents with their own
> furniture (same room, same stuff, every time). Autoscaled services are
> a hotel that opens more floors on busy weekends. Blue/green is
> renovating the show flat next door and moving everyone across in one
> step.

---

## 1. A stateless web/API service

**Goal:** N interchangeable Pods behind one address, zero-downtime
deploys, self-healing.

**Objects:** `Deployment` + `Service` (+ `Ingress` for external),
`ConfigMap`/`Secret` for config, `HorizontalPodAutoscaler`, `PodDisruption
Budget`. Lab: `manifests/02-deployment-service.yaml`,
`03-config-secret.yaml`, `04-ingress.yaml`.

**Steps.**
1. **Package** the app as an immutable image (`docker/` module), tag by
   git SHA or semver — never `:latest`.
2. **Deployment**: `replicas` ≥ 3, `RollingUpdate` with
   `maxUnavailable: 0, maxSurge: 1`, `revisionHistoryLimit: 5` for
   rollback.
3. **Resources**: set `requests` (scheduler + HPA basis) and `limits`
   (memory ≈ request for Guaranteed; CPU limit optional).
4. **Probes**: `startupProbe` for boot, cheap dependency-free
   `livenessProbe`, dependency-aware `readinessProbe`.
5. **Spread**: `topologySpreadConstraints` across nodes/zones so one
   failure ≠ outage.
6. **Config**: `envFrom` a ConfigMap + Secret; add a `checksum/config`
   annotation so config edits trigger a rollout.
7. **Shutdown**: `preStop` sleep 10s + SIGTERM handling → no 502s on
   rollout.
8. **Service** (`ClusterIP`) → **Ingress** (host/path + TLS via
   cert-manager).
9. **HPA** on CPU/RPS; **PDB** `minAvailable: 80%` so node drains don't
   take you down.

**Verify.**
```bash
kubectl rollout status deploy/checkout
kubectl get hpa,pdb,ingress
kubectl run -it --rm load --image=williamyeh/hey --restart=Never -- -z 60s -c 50 http://checkout
# watch: replicas climb, latency flat, no 5xx during a concurrent `kubectl set image`
```

---

## 2. A stateful service (database, queue, quorum store)

**Goal:** stable identity, durable per-Pod storage, ordered operations.

**Objects:** `StatefulSet` + **headless** `Service` +
`volumeClaimTemplates` + `PodDisruptionBudget`. Ideally a **operator**
(CloudNativePG, Zalando, Strimzi for Kafka) instead of raw YAML. Lab:
`manifests/05-statefulset.yaml`.

**Steps.**
1. **Headless Service** (`clusterIP: None`) → each Pod gets DNS
   `db-0.db.ns.svc.cluster.local`.
2. **StatefulSet**: `serviceName`, `replicas`, `podManagementPolicy:
   OrderedReady`, `updateStrategy: RollingUpdate` (one Pod at a time, in
   reverse ordinal order).
3. **Storage**: `volumeClaimTemplates` → one PVC per Pod
   (`data-db-0`…), StorageClass with `reclaimPolicy: Retain` and a
   zonal `WaitForFirstConsumer` binding.
4. **Anti-affinity**: hard `podAntiAffinity` so `db-0` and `db-1` never
   share a node.
5. **Probes**: readiness = "accepting connections *and* caught up on
   replication"; liveness = process alive only.
6. **PDB** `maxUnavailable: 1` so a drain never breaks quorum.
7. **Backups**: a `CronJob` (or operator) doing `pg_dump` / volume
   snapshots to object storage; **test restores**.
8. **Scaling**: scale-up adds `db-N` and it joins the cluster;
   **scale-down is dangerous** — drain/replicate off the Pod first.

**Reality check.** Running databases on Kubernetes is fine *with an
operator*. Hand-rolled StatefulSet + "hope" is how you lose data during
a failover. If a managed database (RDS, Cloud SQL) is an option for your
primary datastore, that is often the right call; use K8s statefulsets
for things designed for it (Kafka, Elasticsearch, Redis-cluster) via
their operators.

---

## 3. An autoscaled, bursty workload

**Goal:** follow a spiky traffic or queue-depth curve; cost-efficient at
rest.

**Objects:** `Deployment` + `HorizontalPodAutoscaler` (v2, with
`behavior`) + Cluster Autoscaler / Karpenter at the node layer; **KEDA**
if scaling on a queue/stream. Lab: `manifests/06-hpa.yaml`.

**Steps.**
1. **Requests are mandatory** — HPA target utilisation is a % of the
   request. No request → no scaling.
2. **HPA v2**: `minReplicas` sized for baseline + failover headroom;
   `maxReplicas` sized for the worst realistic spike **and** node
   capacity.
3. **`behavior`**: scale **up** fast (`stabilizationWindowSeconds: 0`,
   allow +100%/30s), scale **down** slow (`stabilizationWindowSeconds:
   300`, ≤10%/min) so a brief dip doesn't thrash.
4. **Custom/external metrics**: RPS via Prometheus Adapter, or queue
   depth via KEDA `ScaledObject` (scales to zero when idle).
5. **Node layer**: Cluster Autoscaler / Karpenter must have node types
   that fit the Pod requests; keep a small "warm" overprovision
   (pause-Pod trick) so scale-up isn't gated on a 2-minute node boot.
6. **Startup**: fast, dependency-light boot + `startupProbe`, or scale-up
   is useless during the spike.
7. **Downstream**: make sure the database / third-party API can take
   40 Pods before you let HPA reach 40.

**Verify.**
```bash
kubectl get hpa checkout -w
# drive load, watch REPLICAS ramp, nodes get added, then both settle after cooldown
kubectl describe hpa checkout    # "desired replicas" reasoning + events
```

---

## 4. Blue/green (and canary) release

**Goal:** ship a risky version with an instant, tested cutover and an
instant rollback.

**Objects (plain K8s):** two `Deployment`s (`slot: blue` / `slot:
green`) + one `Service` whose selector is the switch. Lab:
`manifests/10-blue-green.yaml`. For weighted canary: Argo Rollouts, a
service mesh, or Ingress canary annotations.

**Blue/green steps.**
1. `blue` (v1) is live: `Service.selector = {app: frontend, slot: blue}`.
2. Deploy `green` (v2) at full replica count. It gets **no** production
   traffic (selector doesn't match it).
3. Test `green` internally: `kubectl port-forward deploy/frontend-green`,
   run smoke tests / synthetic checks, watch its dashboards.
4. **Cut over** — atomic:
   ```bash
   kubectl patch service frontend -p \
     '{"spec":{"selector":{"app":"frontend","slot":"green"}}}'
   ```
5. Watch SLOs for 10–15 min. **Rollback** is the same patch back to
   `blue`.
6. Once confident, scale `blue` to 0 (keep the manifest for the next
   release).

**Trade-off:** 2× Pods during the window. **Canary** trades that for a
slower ramp (1% → 10% → 50% → 100%, auto-halt on SLO regression) and
needs traffic splitting.

**Gotchas for both:** database migrations must be **backwards
compatible** (both versions run at once during cutover/ramp) — expand
then contract. Session stickiness / caches may need warming. Feature
flags let you separate "deploy" from "release" entirely.

---

## Cross-cutting checklist (every workload)

- [ ] Immutable image tag (SHA/semver), scanned in CI
- [ ] `requests` and `limits` set from real data
- [ ] `startup` / `liveness` (dependency-free) / `readiness` probes
- [ ] `securityContext`: non-root, RO root FS, drop ALL caps, seccomp
- [ ] Own `ServiceAccount`, least-privilege RBAC (or token disabled)
- [ ] `topologySpreadConstraints` / anti-affinity
- [ ] `PodDisruptionBudget`
- [ ] `preStop` + SIGTERM handling; sane `terminationGracePeriodSeconds`
- [ ] `NetworkPolicy` (default-deny + explicit allows), verified
- [ ] Config in ConfigMap/Secret, `checksum/config` rollout trigger
- [ ] Dashboards for the four golden signals; alerts on symptoms
- [ ] Runbook link in the alert
