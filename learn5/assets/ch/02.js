/* DevOps-Infra Learn — Part 5 · Chapter 2: Prometheus & the Pull Model */
window.CH[2] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Most old-school monitoring agents <b>push</b> data at a collector — like a patient mashing the call button every few seconds whether or ' +
      'not anything changed. Prometheus flips that: it <b>pulls</b>. It walks its ward on a schedule and reads the chart itself.</p>' +
      '<pre><code># your service just exposes a /metrics page — plain text, no push logic needed\n' +
      'GET /metrics\n' +
      'http_requests_total{method="GET",status="200"} 18234\n' +
      'http_requests_total{method="GET",status="500"} 12\n' +
      'process_resident_memory_bytes 5.4e+07</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A nurse doing rounds.</b> Every 15 seconds, the nurse (Prometheus) walks to each ' +
      'bed (a target) and reads the vitals monitor herself — she does not wait for the patient to buzz her. If a bed does not answer, she immediately ' +
      'knows something is wrong (the target is down), which is itself useful information a push system never gives you for free.</p></div>',
      try: [
        ['📖 Prometheus — overview', 'https://prometheus.io/docs/introduction/overview/', 'o'],
        ['🔭 Ch 1 — the observability stack', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># PromQL — counters: never read the raw number, always rate() it\n' +
      'rate(http_requests_total{status="500"}[5m])\n\n' +
      '# p99 latency from a histogram — bucket by "le" (less-than-or-equal), aggregate, then quantile\n' +
      'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))\n\n' +
      '# a recording rule — pre-compute an expensive query once, query the cheap result everywhere\n' +
      'groups:\n' +
      '  - name: api.rules\n' +
      '    rules:\n' +
      '      - record: job:http_errors:rate5m\n' +
      "        expr: sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (job)</code></pre>" +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Prometheus</b> is the de facto standard for pull-based metrics in cloud-native ' +
      'infra — a CNCF graduated project, the default metrics backend assumed by nearly every Kubernetes operator and Helm chart. Its query language, ' +
      '<b>PromQL</b>, and its exposition format are what OpenTelemetry metrics also target for interoperability.</p></div>',
      try: [
        ['📖 PromQL — querying basics', 'https://prometheus.io/docs/prometheus/latest/querying/basics/', 'o'],
        ['📖 Prometheus — recording rules', 'https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A target silently stops being scraped.</b> A new pod comes up behind a ' +
      'NetworkPolicy that blocks the Prometheus scrape port, but the pod itself is healthy — so nobody notices for two days, until a real incident has ' +
      'a gap in its dashboard exactly when it mattered. The fix is not "remember to check" — it is <code>up == 0</code> as its own always-on alert, ' +
      'plus Kubernetes service-discovery relabeling so every scrapeable pod is auto-registered and any that go dark are visible immediately, not ' +
      'discovered retroactively.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A dashboard shows negative request counts after a deploy.</b> Someone graphed ' +
      '<code>http_requests_total[5m] - http_requests_total[5m] offset 5m</code> by hand instead of using <code>rate()</code>. Every rolling ' +
      'deploy restarts the process, the counter resets to zero, and the naive subtraction goes negative. <code>rate()</code> and <code>increase()</code> ' +
      'detect counter resets automatically and correct for them — the fix is simply "never subtract a counter manually," full stop.</p></div>' +
      '<p><b>Rule of thumb:</b> counters go through <code>rate()</code>/<code>increase()</code>, gauges are read directly, and any target that can go ' +
      'silent needs an <code>up</code> alert from day one, not after the first blind spot bites you.</p>',
      try: [
        ['📖 Prometheus — Kubernetes service discovery', 'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config', 'o'],
        ['🚨 Ch 7 — symptom-based & burn-rate alerting', '#ch7', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Gauge used for something monotonic         Counters only ever go up (or reset to 0). If the value can\n' +
      '  (e.g. "total_requests" as a gauge)         meaningfully decrease, it is a gauge; total-so-far is a counter.\n' +
      'Raw URL path as a label                    High cardinality kills Prometheus. Template the path\n' +
      '  {path="/users/48219/orders/771"}            ("/users/:id/orders/:id") before it becomes a label.\n' +
      'No "for:" duration on alert rules          A single noisy scrape triggers a page. Add "for: 5m–10m"\n' +
      '  (fires on one bad sample)                   so only a sustained condition pages anyone.\n' +
      'One Prometheus, no remote_write             Local TSDB retention is typically 15d and single-node.\n' +
      '  for long-term storage                       Ship to Thanos/Mimir/Cortex for durable, long-range queries.\n' +
      'Pushgateway for long-running services       Pushgateway is for short-lived batch jobs only — it turns\n' +
      '                                            every long-running service into a stale-metric trap.\n' +
      'Dashboards querying raw counters live       Expensive fan-out queries recomputed on every dashboard\n' +
      '  instead of recording rules                  load. Pre-aggregate hot queries as recording rules.</code></pre>' +
      '<p><b>Real test:</b> kill a scrape target\'s network access for ten minutes during business hours — if nobody gets paged by an <code>up == 0</code> ' +
      'alert before a human notices the dashboard gap, the Prometheus setup is not actually protecting anything yet.</p>',
      try: [
        ['📖 Prometheus — instrumentation naming & cardinality', 'https://prometheus.io/docs/practices/naming/', 'o'],
        ['📖 Prometheus — Pushgateway, when to use it', 'https://prometheus.io/docs/practices/pushing/', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>The pull model is a deliberate operational bet: Prometheus, not the application, owns scrape scheduling, retries, and target health — which ' +
      'means "is this target reachable" becomes a free byproduct (<code>up</code>) instead of a signal you have to build yourself. The cost is that ' +
      'short-lived jobs (a cron that runs for 4 seconds) cannot be scraped mid-execution, which is exactly the one legitimate use case for the ' +
      'Pushgateway — everything else should stay pull. At scale, single-node Prometheus does not horizontally scale storage or query fan-out, which is ' +
      'why production setups federate or remote_write into Thanos/Cortex/Mimir for global query view and long retention.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why does Prometheus pull instead of receiving pushed metrics?\n' +
      'A: Pulling makes target health (up/down) a free side effect of scraping, centralizes scheduling and\n' +
      '   backpressure in one place, and lets you point Prometheus at a target without touching that target\'s\n' +
      '   code — you just add a scrape config or a service-discovery label.\n\n' +
      'Q: When is the Pushgateway actually the right tool?\n' +
      'A: Only for short-lived batch/cron jobs that finish before a scrape could ever catch them running. Using\n' +
      '   it for long-running services causes stale metrics to linger and defeats the up-detection benefit.\n\n' +
      'Q: Why use rate() instead of reading a counter\'s raw value?\n' +
      'A: Counters reset to 0 on restart and are cumulative since start; rate() computes a per-second average\n' +
      '   over a window and correctly handles resets, where a naive subtraction would go negative.\n\n' +
      'Q: A dashboard query is slow and expensive at high traffic. What is the standard fix?\n' +
      'A: Turn the hot query into a recording rule — Prometheus pre-computes it on an interval and every\n' +
      '   dashboard/alert reads the cheap, already-aggregated result instead of recomputing it live.\n\n' +
      'Q: How does Prometheus handle long-term retention and multi-cluster queries at scale?\n' +
      'A: Single-node Prometheus is not built for that — remote_write into Thanos, Cortex, or Mimir gives\n' +
      "   durable long-range storage and a global query view across many Prometheus instances.</code></pre>",
      try: [
        ['📖 Thanos — highly available Prometheus setup', 'https://thanos.io/tip/thanos/getting-started.md/', 'o'],
        ['🗺️ Ch 16 — observability platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why does an up-target check being "free" matter in Prometheus\'s pull model?',
      opts: [
        'It does not matter, push systems have the same property',
        'Because Prometheus initiates every scrape itself, a target that fails to respond is immediately known to be down (up == 0) without any extra instrumentation',
        'Prometheus does not support target health checks',
        'It only works for HTTPS targets'],
      ok: 1,
      why: 'Since Prometheus actively scrapes, a non-responding target is directly observable as up == 0 — no separate heartbeat mechanism is needed.' },
    { q: 'Why should you use rate() or increase() on a Prometheus counter instead of subtracting two raw readings?',
      opts: [
        'Subtraction is not allowed in PromQL',
        'Counters reset to zero on process restart; rate()/increase() detect and correctly handle those resets, while naive subtraction can go negative',
        'rate() is faster to type',
        'Counters cannot be queried directly at all'],
      ok: 1,
      why: 'A rolling deploy restarts processes constantly, resetting counters to 0 — rate()/increase() are reset-aware, manual subtraction is not.' },
    { q: 'When is Prometheus\'s Pushgateway the appropriate tool to use?',
      opts: [
        'For all production services, always',
        'Only for short-lived batch or cron jobs that finish before a normal scrape interval could ever observe them running',
        'As a replacement for Grafana',
        'For high-cardinality label storage'],
      ok: 1,
      why: 'The Pushgateway exists specifically to bridge short-lived jobs into Prometheus; using it for long-running services causes stale, unmanaged metrics.' }
  ]
};
