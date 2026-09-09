# How an SRE Tackles & Resolves Production Challenges

Worked incidents. Each one shows the **thought process** — what an SRE
looks at, in what order, and why — not just the fix.

> Analogy: an SRE in an incident is a pilot with an engine warning. The
> instinct isn't to open the engine cowling mid-flight (root cause) —
> it's to run the checklist: fly the plane (keep the service up), pick
> the nearest runway (mitigate), *then* have engineering inspect the
> engine on the ground (postmortem).

---

## The general method (applies to all of them)

```
1. Is it real?        symptom alert or user report → check the golden
                       signals for the affected service. Trust users.
2. Blast radius?      one endpoint? one region? one customer? all?
                       → sets severity and who to pull in.
3. What changed?      deploys, config, feature flags, infra changes,
                       traffic, a dependency, a cert expiry, a cron.
                       ~70% of incidents trace to a recent change.
4. Mitigate.          roll back / flag off / fail over / shed load /
                       scale out — restore users FIRST.
5. Confirm recovery.  SLIs back to normal, and staying there.
6. Root cause + fix.  now, calmly. Then a blameless postmortem with
                       owned, dated action items.
```

The single most useful question in the first five minutes: **"what
changed in the last hour?"**

---

## Challenge 1 — latency spike after a deploy

**Page:** `checkout p99 latency > 1.2s (SLO 400ms), 12 min`.

**SRE's move.**
- Golden signals: latency up 4×, **errors flat**, traffic flat,
  saturation — CPU pinned at the limit on the new Pods.
- "What changed?" — a deploy 15 minutes ago.
- Quick check: `kubectl exec` → `cpu.stat` shows `nr_throttled` climbing.
  The new build is CPU-heavier and is hitting its **CPU limit** →
  throttled → slow. Not an outage, a regression.

**Mitigation:** `kubectl rollout undo deploy/checkout`. p99 recovers in
3 minutes. Total user impact ~18 min, well within budget.

**Root cause:** a new JSON serialiser doing 2× the CPU per request; the
Pod's CPU limit was sized for the old code.

**Fix / action items:**
- (done) rollback.
- @dev: profile and optimise the serialiser, or accept the cost and
  raise the CPU limit + request; re-benchmark. Due in 1 week.
- @sre: add a **canary** stage (5% for 15 min) to the deploy pipeline
  with an automatic p99 gate. Due in 2 weeks.
- @sre: dashboard CPU throttling next to latency for every service.

---

## Challenge 2 — "the site is down" but dashboards are green

**Report:** support is flooded; the status dashboard shows all SLOs
healthy.

**SRE's move.**
- Trust the users. Reproduce from outside: `curl` the public URL from a
  laptop / a different network / a synthetic prober → TLS handshake
  hangs.
- Golden signals are green because the monitoring probes run **inside**
  the cluster and never traverse the broken component.
- "What changed?" — cert-manager renewed the edge certificate 40 min
  ago; the new cert's chain is missing an intermediate. Internal clients
  have it cached; external clients don't.

**Mitigation:** roll the Ingress back to the previous cert Secret
(kept as a versioned object). External traffic recovers.

**Root cause:** cert-manager issued from a new intermediate not yet in
the bundle served to clients.

**Fix / action items:**
- @sre: add an **external** blackbox prober (from outside the VPC) for
  every public endpoint, alerting on cert validity + full-chain
  verification, cert **expiry < 20 days**, and end-to-end 200.
- @platform: pin the issuer chain; add a staging cert-renewal test.
- Postmortem highlight: *"monitoring that shares a failure domain with
  the thing it monitors is not monitoring."*

---

## Challenge 3 — cascading failure from a slow dependency

**Page:** multiple services error-spiking at once; on-call for three
teams paged within a minute.

**SRE's move.**
- Pattern recognition: simultaneous, multi-service → a **shared
  dependency**. Check the dependency graph: all the affected services
  call `pricing-svc`.
- `pricing-svc`: p99 went from 40ms to 9s; its own dependency (a
  third-party FX rate API) is timing out. Upstream callers have no
  timeout / no circuit breaker, so their threads pile up waiting →
  their own latency explodes → **cascading failure**.

**Mitigation (in order):**
1. `pricing-svc`: serve a **stale cached** rate (feature flag) instead
   of calling the FX API. Immediately un-sticks it.
2. Callers: the flag to use `pricing-svc`'s cached endpoint / a
   fallback price.
3. Scale `pricing-svc` back to normal once queues drain.

**Root cause:** no timeout + no circuit breaker + no fallback on a
third-party call; one slow external API took down the checkout path.

**Fix / action items:**
- @dev(pricing): hard timeout (250ms) + circuit breaker + always-have-a-
  cached-fallback for the FX call.
- @sre: standard **resilience defaults** in the shared client library —
  timeouts, retries with jittered backoff + budget, circuit breakers.
- @sre: a **dependency SLO** and dashboard; load-test the checkout path
  with `pricing-svc` artificially slow (a GameDay).

---

## Challenge 4 — database connection pool exhaustion

**Page:** `api 5xx ratio 6%`, climbing. Errors are
`could not get connection from pool`.

**SRE's move.**
- Saturation signal: DB `connections` at 100/100. Latency up, errors up,
  traffic **normal**.
- "What changed?" — an HPA scaled `api` from 6 → 20 Pods during a minor
  traffic bump. Each Pod opens a pool of 10 → 200 connections requested
  against a DB max of 100.
- Autoscaling the stateless tier without accounting for the **stateful**
  tier's limits.

**Mitigation:**
1. Lower `api` `maxReplicas` to a number whose total pool ≤ DB max, and
   scale in now.
2. Or raise the DB `max_connections` if it has headroom (RAM) — usually
   it doesn't, much.
3. Best: put **PgBouncer** (transaction pooling) in front so 20 Pods ×
   10 share ~40 real connections.

**Fix / action items:**
- @sre: PgBouncer sidecar/deployment as the standard DB access path.
- @sre: HPA `maxReplicas` chosen from `(DB_max_conns − headroom) /
  per_pod_pool`; document the formula.
- @sre: alert on DB connections > 80% *before* it's an outage.

---

## Challenge 5 — noisy neighbour / missing resource requests

**Page:** `batch-worker` OOMKilled repeatedly; also `api` on the same
nodes is slow.

**SRE's move.**
- `batch-worker` has **no resource requests**. The scheduler packed many
  onto each node assuming ~0 cost; a big job ran, consumed the node's
  memory, the kernel OOM-killed processes — including `api` containers
  (BestEffort/Burstable get evicted first).
- Classic "no requests" failure: the scheduler was blind, the node
  overcommitted, everyone on that node suffered.

**Mitigation:**
1. Add memory `requests` + `limits` to `batch-worker` reflecting real
   peak; it now schedules honestly and can't exceed its ceiling.
2. Add requests to `api` too (Guaranteed QoS for the latency-critical
   path).
3. Optionally taint a node pool for batch so it can't co-locate with
   `api` at all.

**Fix / action items:**
- @sre: an **admission policy** (Kyverno) that rejects any Pod without
  resource requests. No more blind scheduling.
- @sre: VPA in *recommend* mode to right-size requests from history.
- @sre: `LimitRange` per namespace as a default floor.

---

## Challenge 6 — a runaway CronJob / retry storm

**Page:** third-party partner API returning 429 to us; our error rate up;
their account manager emails.

**SRE's move.**
- A nightly reconciliation `CronJob` failed at 02:00. `concurrency
  Policy: Allow` (default) + `backoffLimit: 6` + no jitter → six retries
  plus the *next* scheduled run all hammering the partner API in
  parallel → we tripped their rate limit → cascading 429s into the app
  paths that also use that API.

**Mitigation:**
1. Suspend the CronJob (`kubectl patch cronjob x -p
   '{"spec":{"suspend":true}}'`).
2. Kill the running Jobs. Confirm 429s stop.
3. Re-run once, manually, rate-limited.

**Fix / action items:**
- @dev: `concurrencyPolicy: Forbid`, sane `backoffLimit`, exponential
  backoff **with jitter**, and a client-side rate limiter for the
  partner API.
- @dev: `startingDeadlineSeconds` so a missed run doesn't stampede.
- @sre: alert on CronJob `last_successful_time` age, not just failures.

---

## Challenge 7 — region / zone outage

**Page:** cloud provider status: `eu-west-1a` degraded. ~1/3 of Pods
`NotReady`, error rate up ~15%.

**SRE's move.**
- Blast radius: one AZ. Services with `topologySpreadConstraints` across
  3 AZs degrade ~33% and self-heal as Pods reschedule to the healthy
  AZs; services pinned to one AZ (or a StatefulSet with all volumes in
  1a) are down.
- Check the stateful tier first — that's where single-AZ assumptions
  hide.

**Mitigation:**
1. Cordon the bad AZ's nodes so nothing new schedules there.
2. Let ReplicaSets reschedule stateless Pods to 1b/1c; scale up if
   headroom is tight (this is why you keep N+1).
3. Stateful: promote a replica in a healthy AZ; if the DB primary was in
   1a and has no cross-AZ standby — that's the postmortem.

**Fix / action items:**
- @sre: enforce 3-AZ spread (`whenUnsatisfiable: DoNotSchedule` for
  critical services) via policy.
- @platform: every stateful system has a synchronous or fast-async
  standby in another AZ; test failover quarterly.
- @sre: capacity model assumes "lose one AZ and still serve peak."

---

## Patterns across all seven

1. **~70% of incidents follow a change.** "What changed in the last
   hour" beats deep debugging early on.
2. **Mitigate with a switch, not a fix.** Rollback, feature flag,
   failover, cached fallback, scale, shed load. A code fix under
   pressure adds risk.
3. **Simultaneous multi-service failure = shared dependency.** Go
   straight to the dependency graph.
4. **"Green dashboards + user reports" = your monitoring is in the
   blast radius.** Probe from outside.
5. **The fix is a system change, not a person.** Every incident ends
   with an owned, dated action item that makes that class of failure
   impossible or self-healing.
6. **Resilience defaults belong in shared libraries and admission
   policies**, so the next service gets them for free.
