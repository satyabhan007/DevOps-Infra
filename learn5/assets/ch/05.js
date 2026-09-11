/* DevOps-Infra Learn — Part 5 · Chapter 5: Log Aggregation — Loki & the ELK Stack */
window.CH[5] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>With one server, "check the logs" means SSH in and <code>tail -f</code>. With 200 pods across 30 nodes, that same instinct means logging ' +
      'into 30 boxes to grep for one error. Log aggregation is the fix: ship every log line to one searchable place.</p>' +
      '<pre><code>WITHOUT AGGREGATION     ssh box1 && grep ERROR ...   ssh box2 && grep ERROR ...   x30\n' +
      'WITH AGGREGATION        one query: {app="checkout"} |= "ERROR" | json | trace_id="7f3a..."</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A hospital\'s central records system, not 30 filing cabinets.</b> Instead of ' +
      'walking to each ward\'s cabinet to find one patient\'s notes, every note gets filed centrally the moment it is written, indexed by patient ID — ' +
      'you search once, from one desk, no matter which ward the note came from.</p></div>',
      try: [
        ['📖 Grafana Loki — overview', 'https://grafana.com/docs/loki/latest/get-started/', 'o'],
        ['🔭 Ch 1 — the observability stack (structured logs)', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># LogQL (Loki) — a label selector, then a filter/parse pipeline\n' +
      '{app="checkout", env="prod"} |= "timeout" | json | duration_ms > 500\n\n' +
      '# structured log line, one JSON object per line — this is what makes the above query possible\n' +
      '{"level":"error","service":"checkout","trace_id":"7f3a9c...","msg":"db timeout","duration_ms":812}\n\n' +
      '# Elasticsearch/ELK equivalent — a query DSL over a fully-indexed document store\n' +
      'GET checkout-logs-*/_search\n' +
      '{ "query": { "bool": { "must": [{ "match": { "level": "error" }}, { "range": { "duration_ms": { "gt": 500 }}}] } } }</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Two dominant approaches: <b>Loki</b> indexes only labels (service, env) and keeps ' +
      'log bodies unindexed/compressed — cheap, fast to operate, pairs natively with Grafana and Prometheus-style labels. The <b>ELK/Elastic Stack</b> ' +
      '(Elasticsearch, Logstash/Beats, Kibana) fully indexes log content — powerful free-text search, but far more expensive to store and operate at ' +
      'the same volume. Pick Loki when your logs are already structured and correlated by label; pick ELK when you need deep full-text search.</p></div>',
      try: [
        ['📖 Grafana Loki — LogQL', 'https://grafana.com/docs/loki/latest/query/', 'o'],
        ['📖 Elastic — Elasticsearch overview', 'https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The log bill triples in a month with no traffic change.</b> A team adds ' +
      '<code>DEBUG</code>-level request/response body logging "temporarily" for a bug hunt and forgets to remove it. Ingestion volume triples, storage ' +
      'cost follows, and query latency on the log backend degrades for everyone. The fix is a log-level policy enforced at the source (DEBUG never ' +
      'ships from prod by default, toggled per-service only when actively debugging) plus a retention tier — hot/searchable for 7 days, cold/cheap ' +
      'archive beyond that.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>An incident where logs exist but cannot be found.</b> A trace shows an error ' +
      'in <code>orders-service</code> at 14:02:07, but that service\'s logs are unstructured prose ("Error processing order, something went wrong") ' +
      'with no trace_id and no order_id — the exact log line that explains the failure is unfindable in a sea of identical-looking error messages. ' +
      'Migrating to structured JSON logs with trace_id on every line makes the same search a single LogQL/DSL query instead of an eyeball scan.</p></div>' +
      '<p><b>Rule of thumb:</b> a log line without a trace_id (or equivalent correlation ID) is a dead end the moment you need to connect it back to a ' +
      'specific request — structure logs and stamp the ID before you need it, not after.</p>',
      try: [
        ['📖 Grafana Loki — Promtail (log shipping)', 'https://grafana.com/docs/loki/latest/send-data/promtail/', 'o'],
        ['🧵 Ch 4 — distributed tracing (correlating by trace_id)', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Unstructured prose log lines                Structured JSON/key=value, one object per line, with a\n' +
      '                                            trace_id/request_id field on every line without exception.\n' +
      'Full-text indexing everything (ELK          Index only what you filter on (labels); keep the message\n' +
      '  default) at high volume                    body compressed/unindexed (Loki-style) unless you need it.\n' +
      'DEBUG level logging left on in prod          Default to INFO/WARN in prod; DEBUG is opt-in per-service\n' +
      '                                            for active investigations, then turned back off.\n' +
      'One retention tier for all logs              Hot/searchable for days, cold/cheap archive for compliance\n' +
      '                                            windows — most log lines are never read again after day 3.\n' +
      'Logging secrets/PII in request bodies        Scrub at the source (logging middleware) — a log pipeline\n' +
      '                                            is a compliance surface, not just a debugging tool.\n' +
      'No sampling on high-volume noisy endpoints  Health-check and polling-endpoint logs at 1000s/sec drown\n' +
      '                                            the signal — sample or drop routine 200s, keep all errors.</code></pre>' +
      '<p><b>Real test:</b> during a real incident, time how long it takes to go from "an alert fired" to "the exact log line explaining the failure ' +
      'is on screen" — if that is more than a couple of minutes, the logging pipeline\'s structure/correlation is the bottleneck, not the search tool.</p>',
      try: [
        ['📖 Loki — retention & storage', 'https://grafana.com/docs/loki/latest/operations/storage/', 'o'],
        ['💵 Ch 11 — cost observability / FinOps for infrastructure', '#ch11', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Log aggregation is the signal most likely to blow the observability budget, because it is the easiest to over-collect — "just log ' +
      'everything" costs nothing to write and everything to store and index. The expert move is architectural: decide what gets indexed (searchable ' +
      'labels) versus stored (compressed body), decide retention per tier before volume forces the decision under pressure, and enforce structure and ' +
      'correlation IDs at the logging-library level so every service emits the same shape without each team reinventing it. Loki versus ELK is really ' +
      'a bet on your query pattern: label-first structured search scales far cheaper than full-text-everything.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the core architectural difference between Loki and Elasticsearch/ELK for logs?\n' +
      'A: Loki indexes only labels and stores log bodies compressed/unindexed, making it cheap at high volume\n' +
      '   but limited to label + grep-style filtering. Elasticsearch fully indexes log content for powerful\n' +
      '   free-text search, at substantially higher storage and operational cost.\n\n' +
      'Q: Why is "just log everything at DEBUG in prod" a bad default?\n' +
      'A: Ingestion and storage cost scale directly with volume, and most DEBUG lines are never read — it\n' +
      "   should be opt-in per-service during an active investigation, not a standing default.\n\n" +
      'Q: What single change makes logs most useful during an incident?\n' +
      'A: Structured (JSON/key=value) logging with a trace_id/request_id on every line — it turns "search\n' +
      '   through prose" into a precise query that correlates directly with a specific trace or request.\n\n' +
      'Q: How should log retention be tiered, and why?\n' +
      'A: Hot/searchable storage for a short window (days) where most investigation happens, then cheap cold\n' +
      '   archive for any compliance-driven longer retention — keeping everything hot forever is needlessly expensive.\n\n' +
      'Q: Why is a logging pipeline also a compliance/security surface, not just a debugging tool?\n' +
      'A: Request bodies and error messages can leak secrets or PII into logs that then sit in a searchable\n' +
      "   store accessible to many engineers — scrubbing must happen at the source, not after ingestion.</code></pre>",
      try: [
        ['📖 CNCF — observability whitepaper', 'https://github.com/cncf/tag-observability/blob/main/whitepaper.md', 'o'],
        ['📚 Ch 11 — cost observability / FinOps', '#ch11', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the main architectural tradeoff between Grafana Loki and the Elasticsearch/ELK stack for log storage?',
      opts: [
        'They are functionally identical, only the UI differs',
        'Loki indexes only labels and keeps log bodies compressed/unindexed (cheaper, label-first search); Elasticsearch fully indexes content (powerful full-text search, higher cost)',
        'ELK cannot be used with Grafana',
        'Loki only works with Kubernetes'],
      ok: 1,
      why: 'Loki trades full-text indexing for cost efficiency at high volume by indexing only labels; ELK indexes everything for richer search at higher cost.' },
    { q: 'Why is structured (JSON) logging with a trace_id on every line considered essential?',
      opts: [
        'It makes log files smaller',
        'It lets logs be precisely queried and correlated with a specific request/trace, instead of requiring a manual eyeball scan of unstructured prose',
        'It is required by all logging libraries',
        'It removes the need for a log aggregator entirely'],
      ok: 1,
      why: 'Structured logs with a correlation ID turn debugging into a direct query rather than a search-and-guess exercise.' },
    { q: 'Why should log retention typically be tiered (hot/searchable for days, cold archive beyond that) rather than uniform?',
      opts: [
        'Tiering is not actually possible with modern log backends',
        'Most log lines are only useful in the first few days after being written; keeping everything hot/searchable indefinitely is far more expensive than the value it provides',
        'It has no cost or performance impact',
        'Regulations forbid keeping logs longer than a week'],
      ok: 1,
      why: 'Hot storage for active investigation windows plus cheap cold archive for compliance balances cost against the rarely-needed long tail.' }
  ]
};
