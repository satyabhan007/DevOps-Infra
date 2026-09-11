/* DevOps-Infra Learn — Part 5 · Chapter 1: The Observability Stack */
window.CH[1] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Part 1 mentioned Prometheus and Grafana in passing. This part builds the whole stack behind them. Three signals, each answering a ' +
      'different question when something breaks — and none of them alone tells the whole story.</p>' +
      '<pre><code>METRICS   numbers over time    "how much / how many / how fast" — cheap, great for alerting\n' +
      'LOGS      timestamped events   "what happened, in detail, right here"\n' +
      'TRACES    one request\'s path   "where did the 900 ms actually go, across 5 services"</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A hospital.</b> Metrics are the vitals monitor — heart rate, a number, always on, ' +
      'beeps past a threshold. Logs are the nurse\'s written notes for one patient. A trace is following ONE patient through admissions → X-ray → ward, ' +
      'timestamping every stop, to see where the delay actually happened.</p></div>',
      try: [
        ['📖 Google SRE Book — Monitoring Distributed Systems', 'https://sre.google/sre-book/monitoring-distributed-systems/', 'o'],
        ['⚙️ Part 1: SRE & production ops', '../learn/#ch8', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>HOW THE SIGNALS CONNECT\n' +
      '  a request gets a trace_id\n' +
      '    -> logs for that request carry the same trace_id       (jump: alert -> logs)\n' +
      '    -> a metric can attach an "exemplar" = a sample trace_id  (jump: dashboard spike -> the exact trace)\n' +
      '    -> the trace shows WHICH span was slow / errored          (jump: span -> that service\'s logs)\n\n' +
      'PICK THE SIGNAL FOR THE QUESTION\n' +
      '  "is something wrong, how bad, alert me"      -> metrics\n' +
      '  "where in this ONE request did it go wrong"   -> traces\n' +
      '  "exact detail at the point of failure"        -> logs\n' +
      '  "which function/kernel is hot"                -> profiles (a 4th signal, Ch 4 territory)\n\n' +
      'STRUCTURED LOGS   JSON / key=value, not prose — "level=error service=api msg=\'db timeout\' trace_id=...\n' +
      '  db=orders" is queryable; "ERROR: something broke in the database" is not.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The vendor-neutral standard for PRODUCING telemetry is <b>OpenTelemetry (OTel)</b> ' +
      '— one SDK, one wire format (OTLP), instrument once. The standard open stack for STORING/VIEWING it: <b>Prometheus</b> (metrics), ' +
      '<b>Loki</b> (logs), <b>Tempo</b>/<b>Jaeger</b> (traces), all viewed in <b>Grafana</b>. Managed equivalents (Datadog, Honeycomb, cloud-native APM) ' +
      'speak the same OTLP. You instrument with OTel and pick a backend — never lock application code to one vendor\'s proprietary agent.</p></div>',
      try: [
        ['📖 OpenTelemetry — observability primer', 'https://opentelemetry.io/docs/concepts/observability-primer/', 'o'],
        ['📖 Grafana — the LGTM stack (Loki, Grafana, Tempo, Mimir)', 'https://grafana.com/oss/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>"The API is slow" with only metrics.</b> ' +
      'A dashboard shows p99 latency doubled at 14:00. Metrics alone cannot say WHY — is it the database, a downstream call, GC pauses? ' +
      'With tracing, an on-call engineer opens a slow exemplar from that exact spike and sees 780 ms of a 900 ms request sitting in a single ' +
      '<code>db.query</code> span — a missing index on a table that just crossed a size threshold. With only metrics, this would have been an hour of ' +
      'guessing and speculative fixes instead of a two-minute trace read.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>One customer, one code path, invisible in the aggregate.</b> ' +
      'Support reports customer <code>acme-corp</code> is seeing timeouts, but the overall error-rate dashboard is flat — their traffic is 0.3% of ' +
      'the total, drowned in the aggregate. Because logs and traces carry a <code>tenant_id</code> attribute, filtering to ' +
      '<code>tenant=acme-corp</code> finds their requests are hitting a code path with an N+1 query that only triggers for accounts with >10,000 ' +
      'items. That question was never going to show up as a pre-aggregated metric — high-cardinality fields on traces/logs are what make it findable.</p></div>' +
      '<p><b>Rule of thumb:</b> metrics for "is something wrong and how bad" (dashboards, alerting, SLOs); traces for "where and why" in one request; ' +
      'logs for "the exact detail at the point of failure."</p>',
      try: [
        ['📖 Honeycomb — observability 101', 'https://www.honeycomb.io/blog/observability-101-terminology-and-concepts', 'o'],
        ['📡 Ch 4 — distributed tracing with OpenTelemetry', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                          FIX\n' +
      'Unstructured log lines ("ERROR: bad")   Structured (JSON/key=value) logs with a trace_id on every\n' +
      '                                       line — queryable, and correlatable with traces.\n' +
      'High-cardinality labels on METRICS       Put user_id / request_id / tenant on traces & logs, NOT\n' +
      '  (user_id, request_id)                  metric labels — it explodes the time-series count.\n' +
      'Averages, or "average of p99"            Never average a percentile. Aggregate from histograms;\n' +
      '                                       report p50/p90/p99 from the merged distribution.\n' +
      'Trace 100% of requests forever            Sample: keep all errors + slow requests, sample the boring\n' +
      '                                       successes (tail-based sampling, Ch 4).\n' +
      'No IDs connecting signals                 Propagate one trace_id everywhere so you can pivot\n' +
      '                                       metric -> trace -> log for the same request.\n' +
      'Dashboards with 60 panels                 Start from golden signals (Ch 3); one screen answers\n' +
      '                                       "is it healthy" in 15 seconds.\n' +
      'Alerting on causes, not symptoms          Alert on what users feel (Ch 7) — CPU at 90% with healthy\n' +
      '                                       latency/errors is not an incident.</code></pre>' +
      '<p><b>Cost reality:</b> observability data frequently costs more than the service it watches. Sample traces, cap log volume, keep metric ' +
      'cardinality low, and set retention per signal (metrics long, traces/logs short) — this is a running theme through the rest of this part.</p>',
      try: [
        ['📖 Prometheus — instrumentation & cardinality best practices', 'https://prometheus.io/docs/practices/naming/', 'o'],
        ['📡 Ch 11 — cost observability / FinOps for infrastructure', '#ch11', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, treat observability data itself as a product with a cost budget: every signal you emit is a decision trading ' +
      '"debuggability later" against "cardinality/volume cost now." The best observability setups are not the ones with the most data — they are the ' +
      'ones where the SPECIFIC data needed to answer "why did this break" is always present, and everything else is aggressively sampled or dropped.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Differentiate monitoring from observability.\n' +
      'A: Monitoring is predefined checks on known failure modes (thresholds, dashboards for things you\n' +
      "   anticipated). Observability is a property of the SYSTEM — rich, correlated telemetry that lets you\n" +
      '   answer NEW questions about novel failures without shipping new code. Monitoring is a subset/outcome\n' +
      '   of good observability.\n\n' +
      'Q: p99 latency spiked. When do you reach for a trace instead of just staring harder at the metric?\n' +
      'A: Immediately — a metric tells you THAT it is bad, a trace tells you WHERE inside a single request the\n' +
      '   time went. Open a slow exemplar from the spike and read the span breakdown.\n\n' +
      'Q: Why not put user_id as a Prometheus metric label?\n' +
      'A: Cardinality explosion — each distinct label VALUE creates a new time series. Millions of users means\n' +
      '   millions of series, and the metrics backend falls over. Put per-user detail on traces/logs instead.\n\n' +
      'Q: A customer reports an issue but the aggregate dashboards look fine. How do you investigate?\n' +
      'A: Filter traces/logs by their tenant_id/customer attribute — a small customer\'s problem is invisible\n' +
      '   in an aggregate metric but immediately visible once you scope to their specific traffic.\n\n' +
      'Q: Your observability bill exceeds your compute bill. What do you cut first?\n' +
      'A: Logs first (highest $/byte) — structure them, drop debug level in prod, sample high-volume lines.\n' +
      '   Then trace sampling: keep 100% of errors and slow requests, sample the rest. Metrics stay (cheap,\n' +
      '   drive SLOs) but audit label cardinality.\n\n' +
      'Q: What are the four golden signals, and why are they the starting point for any dashboard?\n' +
      'A: Latency, traffic, errors, saturation. They answer "is this healthy" in one glance before you need\n' +
      "   any other signal — everything else is the detail you pull once one of these moves.</code></pre>",
      try: [
        ['📖 Google SRE Workbook — implementing SLOs', 'https://sre.google/workbook/implementing-slos/', 'o'],
        ['📡 Ch 16 — the observability platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Which statement best distinguishes monitoring from observability?',
      opts: [
        'They are the same thing with different names',
        'Monitoring is predefined checks on known failure modes; observability is a property of the system — rich, correlated telemetry that lets you answer NEW questions about novel failures',
        'Observability only refers to logs',
        'Monitoring is for production, observability is for staging'],
      ok: 1,
      why: 'Monitoring catches anticipated problems via thresholds and dashboards. Observability is the underlying capability that lets you debug failures nobody predicted.' },
    { q: 'Why is putting user_id or request_id as a Prometheus metric label a bad idea?',
      opts: [
        'Prometheus cannot store string labels',
        'Each distinct label value creates a new time series, so high-cardinality fields explode the series count and can crash the metrics backend — put that detail on traces/logs instead',
        'It is a security violation',
        'Metric labels are limited to 3 characters'],
      ok: 1,
      why: 'High-cardinality dimensions belong on traces and logs (or as exemplars linking a metric to a sample trace), never as metric labels.' },
    { q: 'A customer reports a problem but your aggregate dashboards look completely healthy. What is the most effective next step?',
      opts: [
        'Tell the customer there is no problem',
        'Filter traces and logs by that customer\'s tenant/account attribute — their traffic may be too small a fraction of the total to show up in an aggregate metric',
        'Restart all the services',
        'Wait for more customers to report it'],
      ok: 1,
      why: 'A small-volume customer\'s issue can be completely invisible in an aggregate while being 100% reproducible when you scope your investigation to their specific traffic.' }
  ]
};
