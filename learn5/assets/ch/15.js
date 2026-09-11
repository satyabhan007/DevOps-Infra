/* DevOps-Infra Learn — Part 5 · Chapter 15: Debugging a Production Incident — a Live Walkthrough */
window.CH[15] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>This chapter is a single incident, read start to finish, using every signal from this part in the order a real responder actually reaches ' +
      'for them. No new concepts — just watching the whole stack work together under pressure.</p>' +
      '<pre><code>14:03  page fires: CheckoutBurnRateFast (Ch 6/7)\n' +
      '14:04  IC claimed, incident channel opened (Ch 8)\n' +
      '14:06  dashboard (Ch 3) shows p99 latency spike on /checkout, error rate 4%\n' +
      '14:08  exemplar click -&gt; trace (Ch 4) shows 1.8s stuck in payments-gateway span\n' +
      '14:10  logs (Ch 5) filtered by that trace_id: "connection pool exhausted, waiting for slot"</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Following a single ER admission chart end to end.</b> This is not a lecture on ' +
      'vitals monitors, nurse\'s notes, and patient-tracking systems separately — it is one patient\'s actual chart, read top to bottom, showing how ' +
      'those three things combined to find the diagnosis in minutes instead of hours.</p></div>',
      try: [
        ['🔭 Ch 1 — the observability stack', '#ch1', 'o'],
        ['📖 Google SRE Book — Managing Incidents', 'https://sre.google/sre-book/managing-incidents/', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># the burn-rate alert that fired\n' +
      '- alert: CheckoutBurnRateFast\n' +
      '  expr: (checkout_burn_rate_1h &gt; 14.4) and (checkout_burn_rate_5m &gt; 14.4)\n' +
      '  annotations: { runbook: "https://runbooks/checkout-high-error-rate" }\n\n' +
      '# the runbook\'s step 1 (Ch 14), followed live\n' +
      '## Alert: CheckoutBurnRateFast\n' +
      '1. Open the linked exemplar trace -&gt; identify the failing span\n' +
      '2. If failing service = payments-gateway: check connection pool metrics\n' +
      '3. If pool exhausted: check for a stuck/slow downstream call holding connections\n\n' +
      '# the pool metric that confirmed it\n' +
      'payments_gateway_db_pool_active / payments_gateway_db_pool_max  == 1.0   # fully saturated since 13:58</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Every signal here follows this part\'s standard tooling: <b>Prometheus</b> alert, ' +
      '<b>Grafana</b> dashboard, <b>OpenTelemetry</b>/Jaeger trace, <b>Loki</b> logs, correlated by one <b>trace_id</b> — the exact stack from Ch 1-5, ' +
      'used exactly as designed.</p></div>',
      try: [
        ['📐 Ch 2 — Prometheus & the pull model', '#ch2', 'o'],
        ['🤖 Ch 14 — runbooks & automated remediation', '#ch14', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The root cause: a slow downstream call holding connections open.</b> The ' +
      'trace shows <code>payments-gateway</code> calling a third-party fraud-check API that started responding in 4s instead of its usual 200ms ' +
      'starting at 13:58 — every request holds a database connection open for the full 4s wait, and the pool (sized for 200ms calls) saturates within ' +
      'minutes. The IC assigns the ops lead to enable a circuit breaker around the fraud-check call (already built for exactly this, per Ch 14\'s ' +
      '"known, bounded failure mode" principle) while comms lead posts a 15-minute-cadence update (Ch 8) to the status page.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The mitigation, and what the postmortem found.</b> The circuit breaker trips ' +
      'at 14:14, checkout error rate drops to baseline by 14:17, and the incident is downgraded. The blameless postmortem (Ch 12) finds the systemic ' +
      'gap was not the third-party slowdown itself — it was that the connection pool had no per-call timeout independent of the pool\'s own limits, so ' +
      'one slow dependency could saturate a shared resource. The action item: a hard per-call timeout on all downstream calls, tracked with an owner ' +
      'and due date, not "investigate timeouts" left vague.</p></div>' +
      '<p><b>Rule of thumb:</b> a real incident is rarely one signal — it is metrics saying something is wrong, a trace saying where, logs saying the ' +
      'exact detail, and a runbook turning "where" into an immediate, correct action.</p>',
      try: [
        ['📝 Ch 12 — postmortems & blameless culture', '#ch12', 'o'],
        ['🧵 Ch 4 — distributed tracing with OpenTelemetry', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>WHAT WORKED                                WHAT ALMOST WENT WRONG\n' +
      'Burn-rate alert paged in minutes,           An earlier CPU-threshold alert (deprecated in Ch 7\'s\n' +
      '  not after user complaints piled up          rework) would NOT have caught this — CPU was never high.\n' +
      'Exemplar -&gt; trace -&gt; logs took under          Without trace_id correlation (Ch 4/5), someone would have\n' +
      '  5 minutes to find root cause                been grepping raw logs across 6 services by hand.\n' +
      'IC delegated instead of debugging (Ch 8)    An earlier incident (referenced in this org\'s postmortem\n' +
      '                                            archive) show the IC debugging personally delayed comms by 40min.\n' +
      'Circuit breaker was pre-built, known,        This was possible only because the failure mode had been\n' +
      '  bounded automation (Ch 14)                  seen before and deliberately automated, not improvised live.\n' +
      'Postmortem action item was specific           A vague "investigate timeouts" item from a similar 2023\n' +
      '  and owned (Ch 12)                            incident was never done — this is why the pool had no per-call timeout at all.</code></pre>' +
      '<p><b>Real test:</b> this incident resolved in 14 minutes because every chapter in this part had already been implemented before it happened — ' +
      'the walkthrough is the payoff for that investment, not a substitute for it.</p>',
      try: [
        ['🚨 Ch 7 — symptom-based & burn-rate alerting', '#ch7', 'o'],
        ['📟 Ch 8 — on-call & incident command', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>The lesson of this walkthrough is not the specific bug (a missing per-call timeout) — it is that every fast, calm resolution is downstream ' +
      'of infrastructure built and rehearsed before the incident: a symptom-based alert tuned to page on real user impact, a trace pipeline with ' +
      'unbroken propagation, structured logs correlated by the same ID, a rehearsed IC role that delegates instead of debugging, and a bounded, ' +
      'pre-built automation for a known failure mode. Remove any one layer and this same incident stretches from 14 minutes to hours — the walkthrough ' +
      'is a demonstration that observability and incident engineering are a single connected system, not a shelf of independent tools.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Walk through this incident\'s signal chain from alert to root cause.\n' +
      'A: A multi-window burn-rate alert on the checkout SLO fired within minutes of real impact. The linked\n' +
      "   exemplar jumped straight to a trace showing time stuck in a payments-gateway span. Logs filtered by\n" +
      '   that trace_id showed "connection pool exhausted." The runbook\'s branching steps led directly to\n' +
      '   checking pool saturation metrics, confirming a slow downstream dependency as the cause.\n\n' +
      'Q: Why did this incident resolve in 14 minutes instead of hours?\n' +
      'A: Because every layer was pre-built: a trustworthy symptom-based alert, unbroken trace/log\n' +
      '   correlation, a rehearsed IC who delegated rather than debugged, and a pre-existing circuit breaker\n' +
      '   for a known failure class — none of that was improvised during the incident itself.\n\n' +
      'Q: What was the actual systemic root cause, versus the immediate trigger?\n' +
      "A: The immediate trigger was a third-party API slowdown. The systemic root cause was the absence of\n" +
      '   a per-call timeout independent of the pool\'s own limits — a single slow dependency should never be\n' +
      '   able to saturate a shared connection pool.\n\n' +
      'Q: Why did a previous, similar incident\'s action item ("investigate timeouts") fail to prevent this one?\n' +
      'A: It was vague and unowned (Ch 12\'s core lesson) — a specific, owned, tracked action item ("add a\n' +
      '   per-call timeout, owner X, due date Y") would have closed this exact gap before it recurred.\n\n' +
      'Q: What would have happened if the alert had still been CPU-threshold-based instead of symptom-based?\n' +
      'A: It likely would not have fired at all — CPU never spiked during this incident, only latency and\n' +
      "   error rate did, which is exactly why Ch 7 argues for paging on symptoms users feel, not resource proxies.</code></pre>",
      try: [
        ['🗺️ Ch 16 — observability platform reference architecture', '#ch16', 'o'],
        ['📖 Google SRE Book — Managing Incidents', 'https://sre.google/sre-book/managing-incidents/', 'o']
      ] }
  ],

  quiz: [
    { q: 'In the walkthrough, what led the responder from the alert to the root cause fastest?',
      opts: [
        'Manually reading logs across every service one at a time',
        'Clicking an exemplar from the burn-rate alert straight into a trace, then filtering correlated logs by that trace_id',
        'Restarting every service until the error rate dropped',
        'Waiting for a customer support ticket to describe the problem'],
      ok: 1,
      why: 'The metric-to-trace-to-log correlation chain (exemplars and trace_id) is what let the responder go from symptom to root cause in minutes.' },
    { q: 'What was the actual systemic root cause the postmortem identified, as opposed to the immediate trigger?',
      opts: [
        'The on-call engineer made a mistake',
        'The connection pool had no per-call timeout independent of its own limits, letting one slow downstream dependency saturate a shared resource',
        'The alert was misconfigured and should not have fired',
        'There was no real systemic cause, it was just bad luck'],
      ok: 1,
      why: 'The third-party slowdown was the trigger; the systemic gap that allowed it to cause an outage was the missing per-call timeout.' },
    { q: 'Why did a previous, similar incident not prevent this one from happening?',
      opts: [
        'It was impossible to have prevented it',
        'Its postmortem action item ("investigate timeouts") was vague and unowned, so it was never actually completed — illustrating Ch 12\'s point about specific, owned action items',
        'The previous incident was unrelated to this one',
        'The team decided not to write a postmortem for it'],
      ok: 1,
      why: 'A vague, unowned action item is effectively decorative — it does not get done and does not prevent recurrence.' }
  ]
};
