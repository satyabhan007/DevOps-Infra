# Site Reliability Engineering — The Beginner's Guide

> SRE is what you get when you ask a software engineer to run operations.
> Instead of "keep it up by working harder", you define reliability as a
> number, budget for failure, and automate the manual work away.

---

## 1. The core idea: reliability is a number you choose

100% reliability is the wrong target — it costs infinitely more than
99.9%, and your users can't tell the difference (their wifi drops more
than that). So you **pick** a target and engineer to it.

- **SLI** (Service Level *Indicator*) — a measurement of one aspect of
  health, as a ratio of good to total.
  `good requests / total requests`, `requests under 300ms / total`.
- **SLO** (Service Level *Objective*) — the target for an SLI over a
  window. "99.9% of requests succeed, measured over 28 rolling days."
- **SLA** (Service Level *Agreement*) — a contract with money attached if
  you miss it. Your SLO should be **stricter** than your SLA (miss the
  SLO, you get an internal warning; miss the SLA, you pay).
- **Error budget** — `1 − SLO`. If the SLO is 99.9%, the budget is 0.1%
  ≈ **43 minutes of failure per 30 days**. That budget is *yours to
  spend* on risk: releases, migrations, experiments.

### Analogy — a monthly data allowance

Your phone plan has, say, 40 GB. Early in the month you stream freely.
Near the limit you switch to wifi and ration. Blow the cap and you're
throttled until the reset.

The error budget works the same: **budget healthy → ship features fast,
take risks. Budget exhausted → feature freeze, everyone works on
reliability until it recovers.** It turns "how safe should we be?" from
an argument into arithmetic.

---

## 2. The four golden signals

If you can only instrument four things per service, instrument these:

| Signal | What it means | Example metric |
|--------|---------------|----------------|
| **Latency** | How long requests take. **Split success vs error latency** — fast failures can hide in an average. | p50 / p95 / p99 request duration |
| **Traffic** | How much demand. | requests/sec, messages/sec |
| **Errors** | Rate of failed requests (and *which*). | 5xx ratio, exceptions/sec |
| **Saturation** | How "full" the system is — the resource closest to its limit. | CPU %, memory %, queue depth, connection-pool usage, disk I/O |

Everything else (dashboards with 90 panels) is for *diagnosis after*
these four tell you something is wrong.

---

## 3. Alert on symptoms, not causes

**Bad alert:** "node CPU > 85% for 5 min." Pages you at 3 a.m. while
every user is perfectly happy. Alert fatigue. People start ignoring the
pager.

**Good alert:** "checkout success rate < 99.5% over 10 min" or
"error-budget burn rate > 14× over 1h." Pages you only when users are
actually hurt.

Rule of thumb: **page a human only for problems that are (a)
user-visible or imminently will be, (b) actionable now, and (c) not
already auto-remediating.** Everything else is a ticket or a dashboard.

**Multi-window burn-rate alerting** is the standard pattern:
- *fast burn* (e.g. 14.4× budget over 1h **and** 5m) → page now, big
  fire.
- *slow burn* (e.g. 3× over 6h **and** 30m) → ticket, something is
  degrading.

---

## 4. Toil, and why you fight it

**Toil** = manual, repetitive, automatable work that scales linearly
with the service and has no lasting value. Restarting a stuck service by
hand every week is toil. Fixing it so it self-heals is engineering.

Google's guidance: **cap toil at ~50%** of an SRE's time. If it's
higher, the team is a help desk and the automation never gets built.
Track it; make "reduce toil X" an explicit project.

---

## 5. On-call, from scratch

A sane on-call setup:

- **Rotation**: enough people that each person is on call ≤ 1 week in 4–6.
  Primary + secondary (escalation) + a manager escalation.
- **Every alert links a runbook** — symptom, dashboards, diagnosis
  steps, mitigations, escalation path. An alert with no runbook is a bug.
- **Sustainable load**: ≤ ~2 pages per on-call *shift*. More than that
  and you fix the alerting or the reliability, not the human.
- **Handoff**: end-of-shift summary of what's ongoing / fragile.
- **Comp / time back** for out-of-hours pages. Burnout is an outage
  cause.

---

## 6. Incident response in one page

1. **Detect** — an alert, or a human report. Trust user reports even if
   dashboards look green (your monitoring might be the thing that's
   broken).
2. **Declare** — name it, open a dedicated channel + a running doc, set a
   severity. Declaring early is free; un-declaring is easy.
3. **Assign roles** —
   - **Incident Commander (IC):** runs the response, makes decisions,
     owns comms cadence. *Does not* type fixes.
   - **Ops/Responder:** hands on keyboard.
   - **Comms/Scribe:** updates stakeholders + status page, keeps the
     timeline.
4. **Mitigate before diagnosing** — roll back, fail over, shed load,
   disable the feature flag, scale up. Stop the user pain first.
5. **Diagnose** — now that it's stable, find root cause.
6. **Resolve & monitor** — confirm SLIs recovered, keep watching.
7. **Blameless postmortem** — see §7.

### Analogy — ER triage

A trauma patient: you stop the bleeding and stabilise vitals
(**mitigate**) *before* you order the full-body MRI (**root cause**).
Root-causing a bleeding patient on the table wastes the minutes that
decide the outcome.

---

## 7. Blameless postmortems

Written for **every** significant incident, within a few days, while
memory is fresh. Blameless = the writeup assumes competent people made
reasonable decisions with the information they had; it targets **systems
and processes**, not individuals. (If naming a person feels necessary,
the sentence is wrong — rephrase to the system that let it happen.)

Contents:
- **Timeline** — detection → mitigation → resolution, with timestamps.
- **Impact** — who/what, how many users, how long, budget spent, £ if
  known.
- **Root cause(s)** — the "5 whys", ending at a systemic cause not
  "human error".
- **What went well / what was luck** — luck is a risk you haven't paid
  for yet.
- **Action items** — each **specific, owned, and dated**. "Add an
  alert on replication lag > 30s — @alice, by 2026-09-20." Not "be more
  careful."

Track action items to completion. An incident with no completed action
items will recur.

---

## 8. Production examples

**Example: the release that ate the budget.** A Tuesday deploy caused a
0.4% error rate for 90 minutes before rollback — that's ~2× the monthly
budget in one go. Per policy, the team enters a **release freeze**: only
reliability work and P1 fixes ship until the 28-day window heals. This
isn't punishment; it's the budget doing its job of rebalancing
speed vs safety.

**Example: the alert nobody trusted.** "DB connections > 80%" paged
3–4× a week and was always fine by the time someone looked. The team
replaced it with "checkout p99 > 800ms for 10m" (a symptom) plus a
non-paging dashboard alert on the connection pool. Pages dropped 70%;
the real incident it would've caught (pool exhaustion) now pages via the
latency symptom *and* has a runbook.

**Example: capacity for a launch.** Marketing forecasts 5× traffic for a
campaign. SRE models it: current p99 headroom, HPA `maxReplicas`, node
group ceiling, and — the usual real bottleneck — the database connection
limit and a third-party API's rate limit. They pre-scale the DB, raise
the API quota, bump `maxReplicas`, and run a load test at 6×. The launch
is a non-event. That's the goal.

---

## 9. Next

- **`sre/PROD_CHALLENGES.md`** — worked incidents: how an SRE actually
  tackles and resolves them, step by step.
- **`sre/INTERVIEW_QA.md`** — SRE interview questions with model answers
  and system-design prompts.
- **`kubernetes/PROD_SCENARIOS.md`** — the platform-level failures
  underneath many incidents.
