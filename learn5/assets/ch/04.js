/* DevOps-Infra Learn — Part 5 · Chapter 4: Distributed Tracing — OpenTelemetry & Jaeger */
window.CH[4] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>One user click can fan out across five services before a response comes back. A trace follows that single request end-to-end, timestamping ' +
      'every stop along the way, so "where did the 900ms go" has an actual answer instead of a guess.</p>' +
      '<pre><code>TRACE (one request, id: 7f3a...)\n' +
      '  SPAN api-gateway        [====] 40ms\n' +
      '  SPAN auth-service         [==] 20ms\n' +
      '  SPAN orders-service          [==========================] 780ms  <- here\n' +
      '  SPAN notify-service                                          [=] 15ms</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A relay race with a stopwatch at every handoff.</b> Each runner (service) gets ' +
      'timed individually, and the baton pass (context propagation) carries a shared race number (trace_id) so you can reconstruct exactly which leg ' +
      'of the race ate the extra 30 seconds — instead of only knowing the team\'s total time was slow.</p></div>',
      try: [
        ['📖 OpenTelemetry — traces concept', 'https://opentelemetry.io/docs/concepts/signals/traces/', 'o'],
        ['🔭 Ch 1 — the observability stack', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># a span, conceptually — one timed unit of work with attributes\n' +
      'span: orders-service.db.query\n' +
      '  trace_id: 7f3a9c...          <- same across every span in this request\n' +
      '  span_id: b21f                 parent_span_id: a190   <- builds the call tree\n' +
      '  start: 14:02:03.102   duration: 780ms\n' +
      '  attributes: { db.statement: "SELECT * FROM orders WHERE...", tenant_id: "acme-corp" }\n\n' +
      '# context propagation — the W3C Trace Context header carried on every outbound call\n' +
      'traceparent: 00-7f3a9c...-b21f...-01</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>OpenTelemetry</b> is the vendor-neutral standard for producing traces — one ' +
      'SDK auto-instruments HTTP/gRPC/DB clients, propagates <b>W3C Trace Context</b> headers automatically, and exports over <b>OTLP</b> to any ' +
      'compatible backend (Jaeger, Tempo, or a commercial APM) without changing application code.</p></div>',
      try: [
        ['📖 OpenTelemetry — instrumentation by language', 'https://opentelemetry.io/docs/languages/', 'o'],
        ['📖 Jaeger — tracing backend', 'https://www.jaegertracing.io/docs/latest/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A broken trace with a missing hop.</b> A trace shows the request entering ' +
      '<code>api-gateway</code> and then reappearing at <code>notify-service</code> with a mysterious 200ms gap and no span for ' +
      '<code>orders-service</code> in between — because that service calls out over a message queue and nobody propagated the trace context into the ' +
      'queue message headers. The fix is instrumenting the queue producer/consumer to carry and continue the same trace_id, closing the gap so the ' +
      'async hop shows up as a proper span instead of a black hole.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>Tracing 100% of traffic bankrupts the observability budget.</b> A team turns ' +
      'on OTel tracing for every request at a service doing 50,000 req/s and the tracing backend falls over under ingest volume within a day, while ' +
      'the vast majority of traces are unremarkable 20ms successes nobody will ever look at. Tail-based sampling — keep 100% of errors and slow ' +
      'requests, sample a small percentage of the fast successful ones — cuts volume by 95%+ while keeping every trace anyone would actually want.</p></div>' +
      '<p><b>Rule of thumb:</b> a trace is only as good as its weakest propagation hop — queues, background jobs, and cron triggers need explicit ' +
      'context propagation just as much as synchronous HTTP calls do.</p>',
      try: [
        ['📖 OpenTelemetry — sampling', 'https://opentelemetry.io/docs/concepts/sampling/', 'o'],
        ['📚 Ch 5 — log aggregation, correlating logs by trace_id', '#ch5', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Head-based sampling only (sample at        Combine with tail-based sampling downstream so the decision\n' +
      '  request start, before outcome known)       can account for "this one turned out to be an error/slow."\n' +
      'Trace context dropped across a queue        Explicitly inject/extract trace headers into message\n' +
      '  or async boundary                           metadata — async hops are the #1 place traces break.\n' +
      'Spans with no useful attributes             Attach db.statement, http.route, tenant_id — an unlabeled\n' +
      '  (just a name and a duration)                span tells you THAT something was slow, not why.\n' +
      'Manually instrumenting every function        Start with auto-instrumentation (HTTP/DB/RPC clients) —\n' +
      '                                            hand-instrument only the business-logic spans that matter.\n' +
      'Tracing backend with no retention policy   Traces are high-volume; set short retention (days, not\n' +
      '                                            months) and rely on metrics/logs for the long view.\n' +
      'One giant span for the whole request         Break work into meaningful child spans (db call, cache\n' +
      '                                            lookup, downstream RPC) or the trace is as useless as a log line.</code></pre>' +
      '<p><b>Real test:</b> pick last week\'s worst p99 outlier from a metrics dashboard and try to find its exact trace — if that takes more than a ' +
      'couple of clicks via an exemplar link, the metrics-to-traces wiring is not actually done yet.</p>',
      try: [
        ['📖 OpenTelemetry — context propagation', 'https://opentelemetry.io/docs/concepts/context-propagation/', 'o'],
        ['📐 Ch 2 — Prometheus & the pull model (exemplars)', '#ch2', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, tracing is a graph-reconstruction problem: every span is a fragment, and the whole value only materializes if propagation ' +
      'is unbroken across every boundary the request crosses — sync, async, batch, and cross-team. The hard part is rarely the tracing library; it is ' +
      'organizational — getting every team\'s service, queue consumer, and cron job to propagate the same context format. Sampling strategy is the ' +
      'second axis: naive uniform sampling optimizes for the wrong thing (keeping the boring 99%), where tail-based sampling optimizes for what you\'d ' +
      'actually reach for during an incident — errors and outliers, kept at effectively 100%.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What problem does distributed tracing solve that metrics and logs individually cannot?\n' +
      'A: It reconstructs the full path and timing of ONE request across every service it touches, showing\n' +
      '   exactly which hop consumed the time — metrics show aggregate "is it slow," logs show isolated\n' +
      '   events, neither shows causality across service boundaries the way a trace does.\n\n' +
      'Q: Why do traces commonly break across a message queue?\n' +
      'A: Context propagation relies on headers carried through the call; a queue message has no implicit\n' +
      "   header channel unless the producer/consumer explicitly inject/extract the trace context into the\n" +
      '   message metadata — it is the most commonly missed propagation boundary.\n\n' +
      'Q: Explain tail-based sampling and why it beats simple head-based uniform sampling.\n' +
      'A: Tail-based sampling defers the keep/drop decision until the request completes, so it can keep\n' +
      '   100% of errors and slow requests while dropping most boring successes — head-based sampling must\n' +
      '   decide upfront, blind to outcome, and either over-collects or discards interesting traces.\n\n' +
      'Q: What is an exemplar and why does it matter?\n' +
      'A: An exemplar attaches a sample trace_id to a metric data point (e.g. a histogram bucket), so a\n' +
      '   dashboard spike links directly to a real trace from that exact moment instead of requiring manual\n' +
      '   timestamp correlation across tools.\n\n' +
      'Q: Why start with auto-instrumentation instead of hand-writing every span?\n' +
      'A: Auto-instrumentation covers HTTP/DB/RPC boundaries for free with correct propagation baked in;\n' +
      '   hand-instrumenting is reserved for business-logic spans where you need domain-specific attributes\n' +
      "   the auto-instrumentation can't know about.</code></pre>",
      try: [
        ['📖 OpenTelemetry — collector (processing/export pipeline)', 'https://opentelemetry.io/docs/collector/', 'o'],
        ['🚑 Ch 15 — debugging a production incident, live walkthrough', '#ch15', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the single most common place a distributed trace breaks and loses continuity?',
      opts: [
        'Inside a single function call',
        'Across an async boundary like a message queue, where trace context headers are not explicitly propagated into the message metadata',
        'At the load balancer',
        'Traces never break once instrumented'],
      ok: 1,
      why: 'Synchronous HTTP/RPC calls usually get context propagation for free from auto-instrumentation; queues and background jobs need it wired explicitly.' },
    { q: 'Why is tail-based sampling generally preferred over simple uniform head-based sampling?',
      opts: [
        'It is cheaper to implement',
        'It defers the sampling decision until the request completes, so it can keep effectively 100% of errors and slow requests while dropping most uninteresting successes',
        'It removes the need for a trace_id',
        'It only works with Jaeger'],
      ok: 1,
      why: 'Head-based sampling decides blind to outcome; tail-based sampling can specifically preserve the traces an incident responder would actually want.' },
    { q: 'What does an "exemplar" link on a Prometheus histogram enable?',
      opts: [
        'Faster PromQL query execution',
        'Jumping directly from a metric spike (like a latency histogram bucket) to a real sample trace_id from that exact moment, without manual timestamp correlation',
        'Automatic log rotation',
        'It converts metrics into traces'],
      ok: 1,
      why: 'An exemplar attaches a sample trace_id to a metric data point, wiring the metric directly to a concrete trace for one-click investigation.' }
  ]
};
