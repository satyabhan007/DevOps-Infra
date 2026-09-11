/* DevOps-Infra Learn — Part 5 · Chapter 3: Grafana Dashboards That Get Read */
window.CH[3] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A dashboard with 60 panels is not more useful than one with 6 — it is a wall nobody reads at 3 a.m. Grafana is the tool; the skill is ' +
      'deciding what earns a spot above the fold.</p>' +
      '<pre><code>TOP ROW (glance, 5 seconds)     latency · traffic · errors · saturation — the four golden signals\n' +
      'BELOW THE FOLD (drill-in)        per-endpoint breakdowns, dependency health, resource detail</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A car dashboard, not a cockpit.</b> A car shows you speed, fuel, and a warning ' +
      'light — enough to know if something is wrong right now. It does not show you cylinder-by-cylinder combustion timing on the main dash; that ' +
      'detail exists, but behind a mechanic\'s diagnostic tool you reach for only once the warning light is on.</p></div>',
      try: [
        ['📖 Grafana — dashboard best practices', 'https://grafana.com/docs/grafana/latest/best-practices/best-practices-for-managing-dashboards/', 'o'],
        ['🔭 Ch 1 — the observability stack', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>LAYOUT THAT WORKS\n' +
      '  Row 1  Golden signals for THIS service (4 panels: p50/p99 latency, req/s, error rate, saturation)\n' +
      '  Row 2  Top dependencies (DB, cache, downstream APIs) — is the problem here or one hop away\n' +
      '  Row 3+  Drill-in: per-route latency, per-status-code breakdown, resource usage, queue depth\n\n' +
      '# dashboards as code — a JSON model checked into git, not hand-edited in the UI\n' +
      '{\n' +
      '  "title": "checkout-service — overview",\n' +
      '  "panels": [{ "title": "p99 latency", "targets": [{ "expr":\n' +
      '    "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job=\\"checkout\\"}[5m])) by (le))" }] }]\n' +
      '}</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Grafana</b> is the standard visualization layer across the open observability ' +
      'stack — one UI over Prometheus, Loki, and Tempo/Jaeger alike. For anything beyond a handful of dashboards, manage them as code ' +
      '(<b>Grafonnet</b>/jsonnet, or the Grafana Terraform provider) and provision via version control — hand-edited dashboards drift and nobody ' +
      'remembers why a panel query changed.</p></div>',
      try: [
        ['📖 Grafana — provisioning dashboards', 'https://grafana.com/docs/grafana/latest/administration/provisioning/', 'o'],
        ['📖 Grafana — Grafonnet (dashboards as code)', 'https://grafana.github.io/grafonnet/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The "wall of panels" dashboard nobody opens during an incident.</b> A team\'s ' +
      'main dashboard has 45 panels across 9 rows, built up one ad-hoc addition at a time over two years. During an actual outage, on-call scrolls for ' +
      '90 seconds trying to find the panel that matters while the incident channel fills up. The fix is a hard rebuild: four golden-signal panels on ' +
      'row one, everything else demoted to drill-in rows below, and the old dashboard archived, not merely duplicated.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A dashboard panel that quietly lies.</b> A latency panel uses ' +
      '<code>avg(rate(...))</code> instead of a percentile from the histogram. Average latency looks flat and healthy while p99 has actually tripled — ' +
      'the average is dragged down by the 95% of fast requests, hiding the slow tail that is exactly what users experience as "the site is slow." ' +
      'Switching every latency panel to <code>histogram_quantile</code> at p50/p90/p99 surfaces the real problem immediately.</p></div>' +
      '<p><b>Rule of thumb:</b> if a panel would not change what an on-call engineer does in the next 60 seconds, it belongs below the fold or in a ' +
      'separate drill-in dashboard, not on the page people open first.</p>',
      try: [
        ['📖 Google SRE Workbook — monitoring dashboards', 'https://sre.google/workbook/monitoring/', 'o'],
        ['📐 Ch 2 — Prometheus & the pull model', '#ch2', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Averaging percentiles across panels        Aggregate from the raw histogram with histogram_quantile;\n' +
      '                                            never average a pre-computed p99 from multiple instances.\n' +
      'One mega-dashboard, everything on it        Golden signals up top, service-specific drill-in below,\n' +
      '                                            separate dashboards per dependency — not one infinite scroll.\n' +
      'Hand-edited dashboards in the Grafana UI    Provision from JSON/Grafonnet in git — reviewable diffs,\n' +
      '  with no source of truth                    rollback, and no "who changed this panel and why."\n' +
      'Fixed Y-axis / no units on panels           Auto-scale axes and set units (ms, %, req/s) explicitly —\n' +
      '                                            an unlabeled graph is not diagnosable under pressure.\n' +
      'No links from panel to logs/traces           Wire data links / exemplars so a latency spike click-throughs\n' +
      '                                            straight into a trace, not a manual copy-paste of a time range.\n' +
      'Dashboards with no owner or review cadence  Assign an owner; stale panels referencing removed metrics\n' +
      '                                            accumulate silently otherwise.</code></pre>' +
      '<p><b>Real test:</b> hand a brand-new on-call engineer the primary dashboard during a simulated incident with no context — if they cannot say ' +
      '"is this healthy" within 15 seconds, the dashboard has failed its one job.</p>',
      try: [
        ['📖 Prometheus — histogram_quantile function', 'https://prometheus.io/docs/prometheus/latest/querying/functions/#histogram_quantile', 'o'],
        ['📊 Ch 4 — distributed tracing with OpenTelemetry', '#ch4', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Treat dashboards as a UI product with a specific user (a stressed engineer at 3 a.m.), not a data dump. The expert discipline is ' +
      'subtractive: every panel added should force a conversation about which panel it displaces from the primary view, and dashboards-as-code turns ' +
      'that discipline into something reviewable in a pull request instead of an ungoverned UI edit. At platform scale, a shared dashboard template ' +
      '(one golden-signal row, parameterized by service/job) applied uniformly across dozens of services means every on-call engineer already knows ' +
      'where to look on a service they have never touched before.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why should a service\'s primary dashboard have roughly 4-8 panels, not 40?\n' +
      'A: During an incident, someone under time pressure needs to answer "is it healthy and what is wrong" in\n' +
      '   seconds. More panels means more scanning time; golden signals (latency, traffic, errors, saturation)\n' +
      '   answer that question, everything else is drill-in detail for once you know where to look.\n\n' +
      'Q: Why is averaging p99 latency across dashboard panels wrong?\n' +
      'A: A percentile is not a linear quantity — you cannot average pre-computed p99s from N instances and get\n' +
      "   a meaningful system-wide p99. Aggregate the raw histogram buckets first, then take the quantile once.\n\n" +
      'Q: What is the advantage of managing dashboards as code (Grafonnet/Terraform) over the Grafana UI?\n' +
      'A: Git history gives you reviewable diffs, rollback, and a source of truth — hand-edited dashboards drift\n' +
      '   silently, and nobody can say why a panel query changed six months ago.\n\n' +
      'Q: How do exemplars/data links improve a dashboard beyond just showing numbers?\n' +
      'A: They wire a metric spike directly to a sample trace_id, so clicking a latency spike jumps straight\n' +
      '   into the trace that caused it instead of manually correlating timestamps across three separate tools.\n\n' +
      'Q: How do you keep dozens of service dashboards consistent as an org scales?\n' +
      'A: A shared golden-signal template parameterized by service/job label, provisioned as code, applied\n' +
      "   uniformly — so any on-call engineer already knows the layout on a service they\'ve never opened.</code></pre>",
      try: [
        ['📖 Grafana — exemplars', 'https://grafana.com/docs/grafana/latest/fundamentals/exemplars/', 'o'],
        ['🗺️ Ch 16 — observability platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What should occupy the top row of a service\'s primary Grafana dashboard?',
      opts: [
        'Every metric the service exposes, sorted alphabetically',
        'The four golden signals for that service — latency, traffic, errors, saturation — so health is assessable in seconds',
        'Raw log lines',
        'Only infrastructure CPU/memory graphs'],
      ok: 1,
      why: 'Golden signals answer "is this healthy" at a glance; everything else belongs in drill-in rows below the fold.' },
    { q: 'Why is averaging pre-computed p99 latency values across instances a mistake?',
      opts: [
        'Grafana cannot plot averages',
        'A percentile is not linear — averaging p99s from multiple instances does not yield a valid system-wide p99; aggregate the underlying histogram first',
        'p99 values are always identical across instances',
        'It is not a mistake, it is the recommended approach'],
      ok: 1,
      why: 'Correct percentile math requires aggregating histogram buckets with histogram_quantile, not averaging already-computed percentiles.' },
    { q: 'What is the main benefit of managing dashboards as code (e.g. Grafonnet, Terraform) instead of editing them in the Grafana UI?',
      opts: [
        'It makes panels load faster',
        'Reviewable diffs, rollback, and a git-based source of truth, preventing silent drift from ungoverned UI edits',
        'It is required for Grafana to function at all',
        'It removes the need for golden signals'],
      ok: 1,
      why: 'Dashboards-as-code brings the same review/rollback discipline used for application code to dashboard definitions.' }
  ]
};
