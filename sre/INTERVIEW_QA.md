# SRE Interview — Q&A and System-Design Prompts

Model answers. Lead with the two-sentence version; expand on the
follow-up. Interviewers are checking whether you think in **systems,
trade-offs, and numbers** — not whether you memorised definitions.

Pairs with `kubernetes/INTERVIEW.md` (platform-level questions).

> Analogy to anchor your answers: reliability engineering is fire safety
> for a building. SLOs are the code you build to, the error budget is
> how much smoke is tolerable before you evacuate, alerting is the
> detector placement, incident response is the drill, and the
> postmortem is the fire marshal's report — about the sprinkler layout,
> never about "someone lit a candle".

---

## Part 1 — Reliability fundamentals

**Q1. SLI, SLO, SLA — define and relate them.**
SLI = a measured ratio of good events to total (e.g. successful
requests / all requests). SLO = the target for that SLI over a window
(99.9% over 28 days). SLA = a customer contract with financial penalties
for missing it. Your SLO is set *stricter* than the SLA so you get an
internal signal before you owe anyone money.
*Follow-up: "How do you pick the SLO number?"* Start from what users
actually need and what you can currently sustain; look at historical
performance; don't promise 99.99% if you've been doing 99.5%. It's a
negotiation between product (wants features) and reliability, and the
error budget makes the trade explicit.

**Q2. What is an error budget and how is it used?**
`1 − SLO`. A 99.9% SLO = 0.1% ≈ 43 min/month of allowed unreliability.
It's spent on risk: releases, migrations, experiments. Policy: budget
healthy → ship fast; budget exhausted → feature freeze until the rolling
window recovers. It aligns dev and SRE incentives — both now care about
the same number.
*Follow-up: "A team keeps blowing its budget. What do you do?"* Look at
where it's going (bad releases? a flaky dependency? under-provisioned?).
If releases: add canarying + automated rollback gates. If a dependency:
add resilience (timeouts, fallback) or renegotiate its SLO. The freeze
buys time to fix the cause, not to punish.

**Q3. The four golden signals?**
Latency (split success vs error), Traffic, Errors, Saturation. They're
the minimum set that tells you *whether* something's wrong; deeper
metrics tell you *why*.
*Follow-up: "RED vs USE?"* RED (Rate, Errors, Duration) is
request-centric — good for services. USE (Utilisation, Saturation,
Errors) is resource-centric — good for infrastructure (CPU, disk,
network). Golden signals ≈ RED + saturation.

**Q4. How do you decide what should page a human?**
Page only if it's (a) user-impacting or imminently will be, (b)
actionable right now, and (c) not already auto-remediating. Alert on
symptoms (SLO burn rate, error ratio, latency) not causes (CPU 90%).
Everything else is a ticket or a dashboard.
*Follow-up: "Explain multi-window burn-rate alerting."* Alert when
you're burning budget fast over both a long and a short window (e.g.
14.4× over 1h AND 5m) → page. A gentler rate over a longer window (3×
over 6h) → ticket. Two windows prevent both false pages (short spike)
and slow-burn blindness.

**Q5. What is toil? How much is acceptable?**
Manual, repetitive, automatable, no-lasting-value work that scales with
the service. Cap it around 50% of an SRE's time; above that, the team
becomes a help desk and never builds the automation that would end the
toil. Track it explicitly and fund reduction projects.

---

## Part 2 — Incident response

**Q6. Walk me through how you run an incident.**
Detect → declare early (channel + doc + severity) → assign roles
(Incident Commander decides & owns comms, Ops types, Scribe/Comms keeps
timeline and updates the status page) → **mitigate before diagnosing**
(rollback, failover, flag off, shed load) → confirm SLIs recovered →
blameless postmortem with owned, dated action items.
*Follow-up: "Why separate the IC from the person fixing it?"* The fixer
is head-down in logs; someone needs altitude — deciding when to
escalate, when to call it, keeping stakeholders informed, preventing
tunnel vision and conflicting changes.

**Q7. First five minutes of a Sev-1 — what do you actually do?**
Confirm it's real (golden signals + reproduce from outside; trust user
reports). Establish blast radius (one endpoint/region/customer or all).
Ask "what changed in the last hour" — deploys, config, flags, infra,
traffic, a dependency, a cert. Start mitigation on the most likely
change while diagnosis continues in parallel.

**Q8. Dashboards are green but users say it's down. What now?**
Believe the users. Reproduce externally (curl from outside the VPC, a
synthetic prober, a different network). Green dashboards usually mean the
monitoring path doesn't traverse the broken component — the monitor
shares, or doesn't share, the failure domain in a way that hides it.
Then treat the monitoring gap as a postmortem action item (external
blackbox probing).

**Q9. What makes a postmortem "blameless" and useful?**
It assumes competent people acted reasonably on the information they
had, and targets systems/processes, not individuals. Useful = concrete
timeline, quantified impact, root cause via 5-whys ending at a systemic
cause, "what went well / what was luck", and action items that are
**specific, owned, and dated** — then tracked to done.
*Follow-up: "Give an example of a bad action item vs a good one."* Bad:
"be more careful during migrations." Good: "add a pre-migration check
that fails the pipeline if the target table has > 1M rows without a
batching plan — @bob, 2026-10-01."

---

## Part 3 — Rollouts, capacity, resilience

**Q10. Compare deployment strategies.**
Recreate (downtime, simplest). Rolling (gradual, default, gated on
readiness). Blue/green (instant switch + rollback, 2× cost, no partial
exposure). Canary (small % first, watch SLOs, ramp or auto-abort;
cheaper, catches real-traffic issues, needs traffic splitting).
Feature flags on top separate "deploy" from "release."
*Follow-up: "Where do DB migrations fit?"* Expand/contract:
backwards-compatible schema change first (add column, dual-write),
deploy code that uses it, then a later cleanup migration — so old and
new code run simultaneously during the rollout without breaking.

**Q11. How do you plan capacity for a known traffic event (product launch)?**
Forecast the multiple (marketing's number × a safety factor). Identify
the binding constraint — it's rarely the stateless tier; usually the
database (connections, IOPS, CPU), a cache, or a third-party rate limit.
Pre-scale those, raise HPA `maxReplicas` and confirm the node pool can
back it, raise external quotas, then **load-test at ~1.2× the forecast**.
Have a load-shedding plan for beyond that.
*Follow-up: "What's your headroom policy day-to-day?"* Enough to lose
one failure domain (AZ) and still serve peak (N+1), plus room for the
autoscaler's reaction time (warm capacity / overprovisioned pause Pods).

**Q12. A single slow dependency is causing a cascading failure. Prevent it.**
Every remote call gets: a hard timeout (well below the caller's own
SLO), retries with jittered exponential backoff **and a retry budget**,
a circuit breaker, a bulkhead (bounded concurrency / connection pool),
and a fallback (cached/stale/degraded response). Put these defaults in
the shared client library so every service inherits them. Load-test with
the dependency artificially slow (GameDay).

**Q13. Design an alerting/paging strategy for a new service.**
- Define 2–3 SLIs (availability, latency, maybe freshness) and SLOs.
- Page on **SLO burn rate**, multi-window (fast → page, slow → ticket).
- Page on hard-down symptoms (health check failing across all replicas,
  error ratio > X).
- Non-paging alerts (dashboards/tickets) for saturation approaching
  limits (pool 80%, disk 80%, HPA at max), cert expiry < 20d, backup
  age.
- Every paging alert links a runbook. Review alert noise monthly; delete
  or downgrade anything that pages and turns out fine.

**Q14. What are DORA metrics and why track them?**
Deployment frequency, lead time for changes, change failure rate, time
to restore (MTTR). They measure delivery performance and correlate with
org outcomes. High performers deploy often, with small changes, low
failure rate, and fast recovery — reliability and velocity together, not
a trade-off, when the practices (small batches, automation, good
rollback) are in place.

---

## Part 4 — System-design prompts (practice out loud)

For each: clarify scope → SLIs/SLOs → happy path → failure modes →
scaling → rollout/ops → cost. Say your assumptions.

1. **Design a URL shortener that must sustain 100k redirects/sec at
   99.99% availability.** (Read-heavy; CDN + cache in front; ID
   generation without coordination; datastore choice and replication;
   what breaks at 10×; how you deploy a schema change.)

2. **Design the deployment pipeline and rollout strategy for a
   payments service.** (Progressive delivery; automated SLO gates;
   database migration safety; rollback in < 2 min; audit trail; blast
   radius isolation; how a bad deploy is *impossible* to fully release.)

3. **You're handed a service doing 99.5% availability and asked to get
   it to 99.9%.** (Where's the 0.5% going — measure first; is it
   deploys, a dependency, single-AZ, capacity, slow recovery? Prioritise
   by budget spent. What's the cheapest 0.3%?)

4. **Design on-call for a 6-person team owning 12 services.** (Rotation
   math; primary/secondary/escalation; runbook coverage; alert budget
   per shift; what you automate first; how you measure on-call health;
   comp policy.)

5. **A third-party API you depend on has no SLA and occasionally goes
   dark for 30 minutes. Your product must stay up.** (Timeout/circuit
   breaker/fallback; cache TTLs and staleness tolerance; async vs sync
   coupling; graceful degradation UX; how you alert on *its* health
   without paging for *its* outage.)

6. **Design multi-region active-active for a stateful service.**
(Data replication and conflict handling; consistency vs availability
choice and why; traffic routing and failover; how you test it; the
split-brain scenario; cost vs a simpler active-passive.)

---

## Part 5 — Rapid-fire

| Question | One-line answer |
|----------|-----------------|
| p50 vs p99 — which for an SLO? | p99 (sometimes p99.9) — averages and p50 hide the tail users feel. |
| Retry a failed write? | Only if idempotent (idempotency key), with backoff + jitter + a budget; never a tight loop. |
| MTTR vs MTBF — which to optimise? | Usually MTTR — you can't prevent all failures, so recover fast (fast rollback, good runbooks, practiced incident response). |
| Cache stampede fix? | Request coalescing / single-flight, jittered TTLs, stale-while-revalidate, a lock on refresh. |
| Health check that's too smart? | A `/health` that checks every dependency → one dependency blip marks the whole fleet unhealthy. Keep liveness shallow; put dependency checks in readiness. |
| "It's always DNS" — why? | Shared, cached, silent failures, TTLs, and under-provisioned resolvers under load. NodeLocal DNSCache + more CoreDNS + lower `ndots`. |
| Thundering herd on restart? | Staggered restarts, jittered reconnect backoff, connection limits, and warm-up (readiness gates traffic until caches/pools are ready). |
| Backups you don't test are…? | Not backups. Restore drills on a schedule, measured against an RTO/RPO. |
