/* DevOps-Infra Learn — Part 5 · Chapter 7: Alerting — Symptom-Based & Burn-Rate */
window.CH[7] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>"CPU is at 92%" is not an incident. "Checkout is failing for real users" is. The difference between paging on a <b>cause</b> versus a ' +
      '<b>symptom</b> is the single biggest lever on whether on-call trusts the pager or silences it.</p>' +
      '<pre><code>CAUSE-BASED (noisy)      CPU > 90%, disk > 80%, memory > 85% ... fires constantly, healthy or not\n' +
      'SYMPTOM-BASED (trusted)   error rate > 1% for 5 minutes   <- users are actually affected right now</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A smoke alarm, not a thermometer alarm.</b> A thermometer alarm blaring every ' +
      'time the kitchen hits 90°F because someone is cooking is an alarm nobody trusts and everyone disables. A smoke alarm — tuned to the actual ' +
      'symptom of danger — is the one you evacuate for immediately, precisely because it does not cry wolf.</p></div>',
      try: [
        ['📖 Google SRE Book — Practical Alerting', 'https://sre.google/sre-book/practical-alerting/', 'o'],
        ['🎯 Ch 6 — SLIs, SLOs & error budgets', '#ch6', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># a Prometheus alerting rule — symptom-based, with "for:" to avoid flapping on one bad sample\n' +
      '- alert: CheckoutHighErrorRate\n' +
      '  expr: sum(rate(http_requests_total{route="/checkout",status=~"5.."}[5m]))\n' +
      '      / sum(rate(http_requests_total{route="/checkout"}[5m])) > 0.01\n' +
      '  for: 5m\n' +
      '  labels: { severity: page }\n\n' +
      '# multi-window burn-rate alert — fast AND slow window must BOTH agree, cuts false positives hard\n' +
      '- alert: ErrorBudgetBurnFast\n' +
      '  expr: (burn_rate_1h > 14.4) and (burn_rate_5m > 14.4)   # ~2% of a 30d budget in 1h = page now</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The <b>Google SRE multi-window, multi-burn-rate</b> method is the industry-standard ' +
      'alerting model for SLO-backed services: a fast window (e.g. 5m/1h) catches severe fast burns that need a page NOW, a slow window (e.g. 6h/3d) ' +
      'catches slow leaks that only need a ticket — both computed against the SAME error budget, never against raw resource thresholds.</p></div>',
      try: [
        ['📖 Google SRE Workbook — alerting on SLOs', 'https://sre.google/workbook/alerting-on-slos/', 'o'],
        ['📖 Prometheus — alerting rules', 'https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>Alert fatigue from cause-based paging.</b> An on-call engineer gets paged 14 ' +
      'times overnight for "CPU > 90%" on an autoscaling group that is, correctly, running hot before it scales out — latency and error rate never ' +
      'moved. By morning they have muted the pager entirely, which means the ONE real incident that night — a genuine error-rate spike — was missed. ' +
      'Deleting the CPU-threshold alert and replacing it with a symptom-based error-rate/latency alert would have paged zero times that night and ' +
      'still caught the real incident.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A single-window burn-rate alert flaps.</b> An alert fires on any 5-minute ' +
      'window where burn rate exceeds a threshold, and a brief deploy-related blip trips it every single rollout, training the team to ignore it ' +
      'within a week. Requiring the fast AND slow window to BOTH exceed threshold (multi-window) means a five-minute blip that self-resolves never ' +
      'pages, while a burn that is still bad an hour later reliably does.</p></div>' +
      '<p><b>Rule of thumb:</b> if an alert fires and the on-call engineer\'s first reaction is "yeah, that\'s normal, ignore it" more than once, the ' +
      'alert is wrong, not the engineer\'s judgment.</p>',
      try: [
        ['📖 Google SRE Book — Being On-Call', 'https://sre.google/sre-book/being-on-call/', 'o'],
        ['📟 Ch 8 — on-call & incident command', '#ch8', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Paging on resource thresholds               Page on symptoms (error rate, latency, availability) that\n' +
      '  (CPU/disk/memory alone)                     users actually feel — resource alerts become tickets, not pages.\n' +
      'Single-window burn-rate alerts               Multi-window (e.g. 5m+1h fast, 6h+3d slow) so a blip does\n' +
      '  (flap on brief spikes)                       not page while a sustained burn reliably does.\n' +
      'No "for:" duration, fires on one sample     Require the condition to hold for several minutes before\n' +
      '                                            paging — a single noisy scrape should never wake anyone.\n' +
      'Every alert has the same severity             Split page (wake someone now) vs. ticket (look tomorrow) —\n' +
      '                                            treating everything as urgent trains people to ignore urgency.\n' +
      'Alerts with no runbook link                  Every page links straight to a runbook (Ch 14) — a 3am\n' +
      '                                            page with no next step wastes the most expensive minutes.\n' +
      'No regular alert review/pruning               Dead or noisy alerts accumulate forever unless someone\n' +
      '                                            owns a recurring "delete alerts nobody acted on" review.</code></pre>' +
      '<p><b>Real test:</b> pull last month\'s page history — if more than 10-20% of pages had no real user impact and required no action, the alert ' +
      'set has a noise problem, not an on-call-discipline problem.</p>',
      try: [
        ['📖 PagerDuty — incident response guide', 'https://response.pagerduty.com/', 'o'],
        ['🤖 Ch 14 — runbooks & automated remediation', '#ch14', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Alerting design is a trust budget, not a coverage exercise — every alert that pages without requiring action spends down the team\'s ' +
      'willingness to treat the NEXT page as real, and that erosion compounds until a genuinely critical page gets a groggy, delayed response. ' +
      'Multi-window burn-rate alerting is the mature endpoint of this discipline: it ties paging directly to the SLO\'s error budget (Ch 6) rather than ' +
      'an arbitrary threshold, so the alert set naturally scales with what actually matters to users, and a low-severity slow burn correctly becomes a ' +
      'ticket instead of a 3 a.m. wake-up.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why is symptom-based alerting preferred over cause-based (resource threshold) alerting?\n' +
      'A: Resource thresholds fire regardless of user impact (high CPU can be healthy autoscaling behavior),\n' +
      '   causing noise and alert fatigue. Symptom-based alerts (error rate, latency) fire only when users\n' +
      '   are actually affected, which is what on-call should be woken up for.\n\n' +
      'Q: Explain multi-window, multi-burn-rate alerting and why it beats a single-window threshold.\n' +
      'A: It requires both a fast window (e.g. 5m/1h) and a slow window (e.g. 6h/3d) to agree the error\n' +
      '   budget is burning too fast before paging — a brief self-resolving blip trips only the fast window\n' +
      "   and doesn't page, while a sustained burn trips both and reliably does.\n\n" +
      'Q: Why does every page need a linked runbook?\n' +
      'A: The first minutes of an incident are the most valuable and the most impaired (someone just woke\n' +
      '   up) — a runbook gives an immediate, known-good first action instead of the responder improvising\n' +
      '   diagnosis from scratch under pressure.\n\n' +
      'Q: How should alert severity be split, and why does treating everything as equally urgent backfire?\n' +
      'A: Split into page (wake someone now, user-impacting) vs. ticket (address during business hours,\n' +
      '   no immediate user impact). Treating every alert as equally urgent teaches responders that "urgent"\n' +
      '   is meaningless, degrading response to real pages too.\n\n' +
      'Q: How do you know if an alert set has a noise problem?\n' +
      "A: Audit page history for a recent period — if a large fraction of pages resulted in no action and\n" +
      "   no real user impact, those alerts should be deleted or converted to tickets, not tolerated as \"just how it is.\"</code></pre>",
      try: [
        ['📖 Google SRE Book — Monitoring Distributed Systems', 'https://sre.google/sre-book/monitoring-distributed-systems/', 'o'],
        ['📟 Ch 8 — on-call & incident command', '#ch8', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is alerting on a resource metric like "CPU > 90%" generally considered an anti-pattern?',
      opts: [
        'CPU metrics are impossible to collect reliably',
        'High CPU can be normal, healthy behavior (e.g. before autoscaling kicks in) with zero user impact — paging on it independent of user-facing symptoms causes noise and alert fatigue',
        'Prometheus cannot alert on gauges',
        'CPU alerts are always accurate and should be the primary page trigger'],
      ok: 1,
      why: 'Symptom-based alerts (error rate, latency) reflect actual user impact; resource thresholds often do not and create noisy, untrusted pages.' },
    { q: 'What problem does multi-window, multi-burn-rate alerting solve?',
      opts: [
        'It makes dashboards load faster',
        'It prevents a brief, self-resolving spike from paging by requiring both a fast and a slow window to agree the error budget is burning too quickly, while still catching genuine sustained burns fast',
        'It replaces the need for an SLO',
        'It eliminates the need for the "for:" duration on alert rules'],
      ok: 1,
      why: 'Requiring agreement across two time windows filters out brief blips while still catching real, sustained budget burn promptly.' },
    { q: 'Why should every page-worthy alert link directly to a runbook?',
      opts: [
        'It is a nice-to-have with no real operational value',
        'The first minutes of an incident are the most valuable and most impaired (a responder just woke up) — a runbook gives an immediate known-good first action instead of improvised diagnosis',
        'Runbooks are only useful for chaos engineering',
        'It removes the need for an incident commander'],
      ok: 1,
      why: 'A direct runbook link turns a stressful 3am page into an executable first step rather than cold-start investigation.' }
  ]
};
