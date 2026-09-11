/* DevOps-Infra Learn — Part 5 · Chapter 6: SLIs, SLOs & Error Budgets */
window.CH[6] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>"Make it reliable" is not a target — it is a feeling. An SLO turns reliability into a number you can defend, alert on, and spend on ' +
      'purpose, instead of chasing an impossible 100%.</p>' +
      '<pre><code>SLI   the measurement    "% of requests that succeed in under 300ms"\n' +
      'SLO   the target          "99.9% of requests meet that, measured over 30 days"\n' +
      'Error budget              the 0.1% you are ALLOWED to fail — 43 minutes/month at 99.9%</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A household budget, not a savings target of infinity.</b> You do not aim to ' +
      'spend $0 forever — you set a monthly budget and spend it on things that matter. An error budget is the same: 99.9% is not "try to be perfect," ' +
      'it is "you have this much room to ship risky changes, and once it is gone, stop and fix reliability instead."</p></div>',
      try: [
        ['📖 Google SRE Book — Service Level Objectives', 'https://sre.google/sre-book/service-level-objectives/', 'o'],
        ['🔭 Ch 1 — the observability stack', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># the SLI as a PromQL ratio — "good events / total events" over a rolling window\n' +
      'sum(rate(http_requests_total{status!~"5..", route="/checkout"}[30d]))\n' +
      '/\n' +
      'sum(rate(http_requests_total{route="/checkout"}[30d]))\n\n' +
      '# error budget remaining\n' +
      '# target 99.9% over 30d = 43m 12s of allowed downtime/errors\n' +
      'budget_remaining = (1 - target) * total_events - bad_events_so_far</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The <b>Google SRE</b> model is the industry-standard framework: pick a ' +
      'user-facing SLI (availability, latency, freshness — not a proxy like CPU), set an SLO slightly below what you can realistically hit, and use ' +
      'the error budget as the shared decision mechanism between reliability work and feature velocity — not as a vague aspiration nobody enforces.</p></div>',
      try: [
        ['📖 Google SRE Workbook — implementing SLOs', 'https://sre.google/workbook/implementing-slos/', 'o'],
        ['📖 sloth — SLO generator for Prometheus', 'https://sloth.dev/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>An SLO nobody actually enforces.</b> A team sets a 99.95% availability SLO ' +
      'in a wiki doc, burns through the entire monthly error budget by day 10 shipping unvetted changes, and keeps shipping anyway because there is no ' +
      'agreed consequence. The SLO is decoration. The fix is an error-budget policy written down in advance: budget exhausted means a freeze on risky ' +
      'releases until the budget resets, agreed by both the team and their stakeholders before the first violation, not negotiated in the moment.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>An SLO built on the wrong SLI.</b> A team sets an SLO on server-side average ' +
      'latency, which looks perfectly healthy, while their CDN and client-side JS bundle add 4 seconds nobody is measuring — users experience a slow ' +
      'site the SLO insists is fine. Redefining the SLI as a synthetic check measuring real user-perceived page load (Ch 13) instead of a backend-only ' +
      'metric makes the SLO reflect what users actually feel.</p></div>' +
      '<p><b>Rule of thumb:</b> an SLO without an enforced consequence when the budget is spent is not a reliability target — it is a suggestion.</p>',
      try: [
        ['📖 Google SRE Workbook — SLO engineering case studies', 'https://sre.google/workbook/slo-engineering-case-studies/', 'o'],
        ['🌡️ Ch 13 — synthetic monitoring & uptime checks', '#ch13', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'SLO target set to 99.99% "because           Set it just below your realistic current performance —\n' +
      '  reliability sounds important"               an unachievable target trains everyone to ignore it.\n' +
      'SLI is a system metric (CPU, disk)          SLIs must be user-facing: availability, latency, correctness,\n' +
      '  not a user-facing outcome                   freshness — what the USER experiences, not the resource.\n' +
      'No error-budget policy written down          Agree in advance what happens at 100% budget burn (release\n' +
      '                                            freeze, mandatory reliability sprint) — before it happens.\n' +
      'One SLO for a whole multi-endpoint service   Different endpoints have different criticality (checkout\n' +
      '                                            vs. a settings page) — set SLOs per critical user journey.\n' +
      'Measuring the SLO once a quarter              SLOs need continuous rolling-window measurement (28-30d)\n' +
      '                                            to catch budget burn while there is still time to react.\n' +
      'Treating 100% as the real target             100% is the wrong goal for almost any system — it forces\n' +
      '                                            zero velocity and ignores diminishing returns past ~3-4 nines.</code></pre>' +
      '<p><b>Real test:</b> ask any engineer on the team "how much error budget do we have left this month" — if they cannot answer within a few ' +
      'seconds by checking a dashboard, the SLO is not actually operational yet.</p>',
      try: [
        ['📖 Google SRE Book — Embracing Risk (why not 100%)', 'https://sre.google/sre-book/embracing-risk/', 'o'],
        ['🚨 Ch 7 — burn-rate alerting on the error budget', '#ch7', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>The error budget\'s real power is as an organizational contract, not a math exercise: it converts "should we ship this risky change" from ' +
      'a political argument into an objective check against a number both engineering and product agreed on beforehand. Expert SLO design means ' +
      'choosing SLIs that are hard to game (measured as close to the user as possible — synthetic checks, real-user monitoring — not from inside the ' +
      'service that might be lying to itself), setting per-journey targets instead of one blanket number, and pairing the SLO with burn-rate alerting ' +
      '(Ch 7) so budget exhaustion is caught in hours, not discovered retroactively at month-end.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Explain the relationship between SLI, SLO, and error budget.\n' +
      'A: The SLI is the raw measurement (e.g. % successful requests). The SLO is the target for that SLI\n' +
      '   (e.g. 99.9% over 30 days). The error budget is the inverse — the allowed amount of failure (0.1%)\n' +
      '   — spent on risk (deploys, experiments) rather than treated as pure waste to eliminate.\n\n' +
      'Q: Why is targeting 100% reliability almost always wrong?\n' +
      'A: Each additional nine costs exponentially more engineering effort for diminishing user-perceived\n' +
      '   benefit, and 100% leaves zero room to ship changes at all — some failure budget is a deliberate,\n' +
      '   healthy tradeoff, not a shortfall.\n\n' +
      'Q: What makes a good SLI versus a bad one?\n' +
      'A: A good SLI is user-facing and hard to game — measured as close to the real user experience as\n' +
      '   possible (successful requests, latency under threshold). A bad SLI is an internal resource metric\n' +
      "   (CPU%, disk free) that does not directly reflect what the user experiences.\n\n" +
      'Q: What should an error-budget policy specify, and when should it be agreed?\n' +
      'A: What happens when the budget is fully spent — typically a release freeze or mandatory reliability\n' +
      '   work — agreed upfront by both engineering and product stakeholders, before a violation, so it is\n' +
      '   an objective trigger rather than a negotiation in the moment.\n\n' +
      'Q: Why set SLOs per critical user journey instead of one SLO for an entire service?\n' +
      'A: Different endpoints carry different criticality — checkout failing matters far more than a settings\n' +
      "   page failing — and a single blanket SLO can hide a critical journey's problems inside an average.</code></pre>",
      try: [
        ['📖 Google SRE Workbook — alerting on SLOs', 'https://sre.google/workbook/alerting-on-slos/', 'o'],
        ['🚨 Ch 7 — symptom-based & burn-rate alerting', '#ch7', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is an error budget?',
      opts: [
        'The financial cost of an outage',
        'The allowed amount of failure implied by an SLO (e.g. 0.1% at a 99.9% target), spent deliberately on risk like deploys rather than treated purely as waste',
        'A budget for buying more servers',
        'The number of engineers on the on-call rotation'],
      ok: 1,
      why: 'An error budget is the inverse of the SLO target — the room to fail on purpose, used as a shared decision mechanism for release risk.' },
    { q: 'Why is targeting 100% reliability generally the wrong goal?',
      opts: [
        'It is technically impossible to measure',
        'Each additional nine of reliability costs exponentially more effort for diminishing user benefit, and it leaves zero room to ship any changes at all',
        '100% reliability is actually the correct target for all systems',
        'Users prefer systems with occasional downtime'],
      ok: 1,
      why: 'The SRE model treats some budgeted failure as a healthy, deliberate tradeoff that preserves velocity, not a shortfall to eliminate.' },
    { q: 'What distinguishes a good SLI from a bad one?',
      opts: [
        'A good SLI is always CPU utilization',
        'A good SLI reflects what the user actually experiences (success rate, latency); a bad one is an internal resource metric that does not directly map to user-perceived outcomes',
        'There is no meaningful distinction',
        'A good SLI must be measured only once per quarter'],
      ok: 1,
      why: 'SLIs should be user-facing and hard to game — measuring as close to the real user experience as possible, not a proxy resource metric.' }
  ]
};
