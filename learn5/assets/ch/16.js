/* DevOps-Infra Learn — Part 5 · Chapter 16: The Observability Platform — Reference Architecture */
window.CH[16] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Fifteen chapters, one diagram. Every piece of this part — metrics, traces, logs, SLOs, alerting, on-call — is one connected system, not a ' +
      'shelf of separate tools you happen to have all installed.</p>' +
      '<pre><code>PRODUCE          your services, instrumented once with OpenTelemetry (Ch 4)\n' +
      'COLLECT/STORE     Prometheus (metrics, Ch 2) + Loki (logs, Ch 5) + Tempo/Jaeger (traces, Ch 4)\n' +
      'VIEW               Grafana, golden signals up top (Ch 3)\n' +
      'DECIDE             SLOs + error budgets (Ch 6) drive burn-rate alerts (Ch 7)\n' +
      'RESPOND             on-call + IC (Ch 8), runbooks (Ch 14), postmortems (Ch 12)</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A hospital\'s full operating system, not just one department.</b> Vitals monitors, ' +
      'patient charts, the nurse call system, the triage protocol, and the incident debrief after a bad outcome are not independent — they are one ' +
      'designed system where each part exists because of how it feeds the next.</p></div>',
      try: [
        ['🔭 Ch 1 — the observability stack', '#ch1', 'o'],
        ['📖 CNCF — observability whitepaper', 'https://github.com/cncf/tag-observability/blob/main/whitepaper.md', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># the reference pipeline, end to end — one request\'s journey through the whole platform\n' +
      'service code\n' +
      '  -&gt; OTel SDK  (auto-instrumented HTTP/DB/RPC, Ch 4)  -&gt;  OTel Collector  (batches, routes, Ch 4)\n' +
      '      -&gt; Prometheus  (metrics + recording rules, Ch 2)\n' +
      '      -&gt; Loki        (structured logs, trace_id-correlated, Ch 5)\n' +
      '      -&gt; Tempo/Jaeger (traces, sampled, Ch 4)\n' +
      '  -&gt; Grafana         (dashboards, Ch 3; exemplars link all three)\n' +
      '  -&gt; SLO burn-rate rules (Ch 6/7)  -&gt;  Alertmanager  -&gt;  pager  -&gt;  on-call + IC (Ch 8)\n' +
      '  -&gt; incident resolved  -&gt;  postmortem (Ch 12)  -&gt;  action items feed back into every layer above</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>This is the open-source <b>LGTM stack</b> (Loki, Grafana, Tempo, Mimir/Prometheus) ' +
      'plus <b>OpenTelemetry</b> for instrumentation — the same shape as most managed observability platforms (Datadog, Honeycomb, New Relic), which ' +
      'increasingly speak OTLP too. The architecture is the durable knowledge; the specific vendor is a swappable implementation detail.</p></div>',
      try: [
        ['📖 Grafana — the LGTM stack', 'https://grafana.com/oss/', 'o'],
        ['📖 OpenTelemetry — collector architecture', 'https://opentelemetry.io/docs/collector/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>Designing this platform for a 40-service org from scratch.</b> Start with ' +
      'instrumentation (OTel SDK as a shared library every team imports, Ch 4) before anything else — without consistent trace_id propagation, every ' +
      'other layer is weaker. Next, one shared dashboard template (Ch 3) applied to all 40 services so on-call never starts cold on an unfamiliar ' +
      'service. Only then layer on SLOs (Ch 6) for the handful of genuinely critical user journeys, burn-rate alerts (Ch 7) tied to those SLOs, and a ' +
      'runbook (Ch 14) for every alert before it ships — in that order, not alerting-first with instrumentation as an afterthought.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The platform-RFC interview question: "walk me through an incident."</b> A ' +
      'strong answer does not describe tools in isolation ("we use Prometheus, we use Grafana") — it walks the signal chain the way Ch 15 did: a ' +
      'symptom-based alert fires from an SLO burn rate, an exemplar jumps to a trace, correlated logs give the exact detail, an IC coordinates while a ' +
      'runbook drives the fix, and a blameless postmortem closes the loop with an owned action item. That end-to-end fluency is what separates ' +
      '"I\'ve heard of these tools" from "I\'ve operated this system."</p></div>' +
      '<p><b>Rule of thumb:</b> build this platform in the order a request actually flows — instrumentation first, storage/viewing second, ' +
      'decision-making (SLOs/alerts) third, response process last — because each layer is load-bearing for the one after it.</p>',
      try: [
        ['🎯 Ch 6 — SLIs, SLOs & error budgets', '#ch6', 'o'],
        ['🚑 Ch 15 — debugging a production incident, live walkthrough', '#ch15', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Buying a platform before instrumenting      Instrumentation (OTel, consistent trace_id/labels) is the\n' +
      '  consistently                                 foundation — the best backend cannot fix inconsistent producers.\n' +
      'Building alerting before SLOs exist          Alerts without an SLO backing them lack a defensible\n' +
      '                                            threshold — define the SLO (Ch 6) first, alert on its burn rate second.\n' +
      'Every team builds its own observability      Fragmentation means no org-wide incident fluency and no\n' +
      '  stack independently                          shared dashboard template — standardize the platform, not each team\'s taste.\n' +
      'Treating cost as an afterthought               Cost observability (Ch 11) needs to be designed in from the\n' +
      '                                            start, not bolted on after the first shocking bill.\n' +
      'No feedback loop from postmortems back        Action items that do not change the platform (new alert, new\n' +
      '  into the platform                             runbook, new dashboard panel) mean the same class of incident recurs.\n' +
      'Platform designed for the current org size    A platform sized for 40 services breaks at 400 without\n' +
      '  only, no growth path                          multi-tenant Prometheus (Thanos/Mimir/Cortex) and log retention tiers planned in.</code></pre>' +
      '<p><b>Real test:</b> hand a new engineer this reference architecture diagram and one real incident to trace through it end to end — if they can ' +
      'point to exactly which layer produced each piece of information the responder used, the architecture is coherent, not just a list of tools.</p>',
      try: [
        ['📐 Ch 2 — Prometheus & the pull model', '#ch2', 'o'],
        ['💵 Ch 11 — cost observability / FinOps for infrastructure', '#ch11', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>The reference architecture\'s real insight is that observability and incident engineering are a closed loop, not a pipeline with an end: ' +
      'postmortem action items feed back into instrumentation, dashboards, SLOs, alerts, and runbooks, which is what makes the SAME class of incident ' +
      'progressively rarer over time rather than a permanent recurring cost. At platform-owner scale, the job is not choosing tools — it is designing ' +
      'the org-wide defaults (a shared OTel SDK wrapper, a shared dashboard template, a shared SLO/alerting library, a shared runbook format) that make ' +
      'the "right way" also the "easy way" for every team building on top of the platform, so consistency does not depend on every team independently ' +
      'reading these 16 chapters.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Describe the reference observability platform architecture end to end.\n' +
      'A: Services instrument once with OpenTelemetry; a collector routes signals to Prometheus (metrics),\n' +
      "   Loki (logs), and Tempo/Jaeger (traces); Grafana visualizes them with exemplars linking all three;\n" +
      '   SLO burn-rate rules trigger symptom-based alerts; on-call/IC respond using runbooks; postmortems\n' +
      '   close the loop by feeding fixes back into every earlier layer.\n\n' +
      'Q: In what order should an org build this platform, and why does order matter?\n' +
      'A: Instrumentation first (nothing else works without consistent trace_id/labels), then storage/viewing,\n' +
      '   then SLOs and alerting (which need reliable data to be meaningful), then response process — each\n' +
      '   layer depends on the one before it being solid.\n\n' +
      'Q: Why is a closed feedback loop from postmortems back into the platform essential?\n' +
      'A: Without it, postmortem action items are one-off fixes for a single incident; with it, each incident\n' +
      '   systematically improves instrumentation, dashboards, alerts, and runbooks, making the whole platform\n' +
      '   better at catching the next issue faster.\n\n' +
      'Q: Why standardize the observability platform across teams instead of letting each team choose independently?\n' +
      'A: Fragmentation means no org-wide incident fluency — an engineer moving between services faces a\n' +
      '   different dashboard shape and alerting convention each time, which is exactly the friction golden-signal\n' +
      "   dashboards and shared SLO tooling are meant to eliminate.\n\n" +
      'Q: What breaks in this architecture as an org scales from 40 services to 400?\n' +
      "A: Single-node Prometheus and unmanaged log retention stop scaling — this is where Thanos/Mimir/Cortex\n" +
      "   for federated long-range metrics and tiered log retention (Ch 5, Ch 11) become load-bearing, not optional.</code></pre>",
      try: [
        ['📖 CNCF — observability whitepaper', 'https://github.com/cncf/tag-observability/blob/main/whitepaper.md', 'o'],
        ['🔭 Ch 1 — the observability stack', '#ch1', 'o']
      ] }
  ],

  quiz: [
    { q: 'In what order should an organization build out this reference observability platform, and why?',
      opts: [
        'Alerting first, since paging is the most urgent concern',
        'Instrumentation first (consistent OpenTelemetry/trace_id across services), then storage/viewing, then SLOs and alerting, then response process — each layer depends on the one before it',
        'It does not matter what order the layers are built in',
        'Postmortems first, before any tooling exists'],
      ok: 1,
      why: 'Every later layer (SLOs, alerts, dashboards) depends on consistent, high-quality instrumentation existing first — building alerting before reliable data exists produces untrustworthy alerts.' },
    { q: 'Why is a closed feedback loop from postmortems back into the platform (new alerts, dashboards, runbooks) essential?',
      opts: [
        'It is optional documentation with no functional impact',
        'Without it, postmortem fixes are one-off; with it, each incident systematically improves the platform, making the same class of incident progressively rarer',
        'Postmortems should never result in platform changes',
        'It only matters for SEV1 incidents'],
      ok: 1,
      why: 'The loop is what turns individual incidents into compounding platform improvements rather than isolated, non-cumulative fixes.' },
    { q: 'What typically breaks in this architecture as an organization scales from tens to hundreds of services?',
      opts: [
        'Nothing changes regardless of scale',
        'Single-node Prometheus storage and unmanaged log retention stop scaling, requiring federated solutions like Thanos/Mimir/Cortex and tiered log retention',
        'OpenTelemetry stops working above a certain service count',
        'Grafana can no longer display any dashboards'],
      ok: 1,
      why: 'Single-node metrics storage and uncontrolled log volume are the parts of this architecture that need deliberate scaling solutions as an org grows.' }
  ]
};
