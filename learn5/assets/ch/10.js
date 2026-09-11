/* DevOps-Infra Learn — Part 5 · Chapter 10: Capacity Planning & Load Testing */
window.CH[10] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>"Will it hold on Black Friday" is a question everyone asks and few actually answer with a number. Capacity planning turns a guess into a ' +
      'measured limit, and load testing proves it before real traffic finds out the hard way.</p>' +
      '<pre><code>GUESSING     "we handled last year fine, should be OK"   <- no number, no margin, no test\n' +
      'PLANNED      "we tested to 4x normal peak, it holds at p99 &lt; 300ms, here is the bottleneck at 5x"</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Load-testing a bridge before opening it, not after cars fall through.</b> ' +
      'Engineers do not open a new bridge and hope it holds — they calculate and test the load limit, post the rating, and know exactly where it fails ' +
      'before the first truck crosses. Capacity planning is the same discipline applied to a service.</p></div>',
      try: [
        ['📖 Grafana k6 — load testing overview', 'https://k6.io/docs/', 'o'],
        ['🎯 Ch 6 — SLIs, SLOs & error budgets', '#ch6', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>// k6 load test — ramp traffic up, hold, ramp down, assert on SLO thresholds\n' +
      'import http from "k6/http";\n' +
      'export const options = {\n' +
      '  stages: [ { duration: "5m", target: 500 }, { duration: "10m", target: 500 }, { duration: "5m", target: 0 } ],\n' +
      '  thresholds: { http_req_duration: ["p(99)<300"], http_req_failed: ["rate<0.01"] }\n' +
      '};\n' +
      'export default function () { http.get("https://staging.example.com/checkout"); }</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>k6</b> (Grafana Labs) is a widely used standard for scriptable load testing — ' +
      'traffic profiles as code, thresholds that fail a CI pipeline the same way a unit test would, and native integration with Prometheus/Grafana for ' +
      'watching system behavior under load in real time, not just after the run finishes.</p></div>',
      try: [
        ['📖 k6 — thresholds', 'https://k6.io/docs/using-k6/thresholds/', 'o'],
        ['📖 k6 — test types (smoke, load, stress, soak)', 'https://k6.io/docs/test-types/introduction/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A launch that "should be fine" is not.</b> A product team plans a marketing ' +
      'push expecting 3x normal traffic and skips a load test because "we handled a similar spike before." At the real event, the connection pool to ' +
      'the database — sized for 1x, never revisited — saturates at 1.8x, and the whole checkout flow queues up and times out well before the ' +
      'marketing-predicted peak is even reached. A load test beforehand would have found the pool-size ceiling as a specific, fixable number instead ' +
      'of a live-fire surprise.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A load test that passes but does not mean what the team thinks.</b> A test ' +
      'runs a 10-minute burst at target load and passes cleanly — but a real event lasts 4 hours, and a slow memory leak that only surfaces after 90 ' +
      'minutes brings the service down mid-event. A <b>soak test</b> (sustained load over hours, not minutes) is the specific test type that catches ' +
      'this class of problem; a short burst test cannot, no matter how high the traffic target is.</p></div>' +
      '<p><b>Rule of thumb:</b> a load test\'s value comes from matching its shape (burst vs. sustained, ramp speed, traffic mix) to how the real event ' +
      'will actually behave — a technically-passing test of the wrong shape is a false sense of security.</p>',
      try: [
        ['📖 k6 — soak testing', 'https://k6.io/docs/test-types/soak-testing/', 'o'],
        ['📊 Ch 3 — Grafana dashboards during a load test', '#ch3', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Load testing only the happy path            Include realistic traffic mix — auth, search, checkout,\n' +
      '  (one endpoint, no realistic mix)             admin — proportional to real usage, not a single URL hammered.\n' +
      'Short burst test standing in for a           Match test duration/shape to the real event: soak tests for\n' +
      '  multi-hour sustained event                   sustained load, spike tests for sudden bursts.\n' +
      'Testing against staging sized                Staging capacity/config must mirror production ratios, or\n' +
      '  differently from production                  the test measures the wrong bottleneck entirely.\n' +
      'No visibility into WHERE it broke            Watch dashboards (Ch 3) and traces (Ch 4) live during the\n' +
      '  ("it just failed at 4x")                     test — the bottleneck (DB pool, a downstream API, GC) is the finding.\n' +
      'Capacity planned from CPU/memory alone       Model the actual constraining resource — often a connection\n' +
      '                                            pool, a rate limit, or a downstream dependency, not raw compute.\n' +
      'Load test run once before a big launch,      Bottlenecks shift as the system changes — recurring load\n' +
      '  never repeated                               tests catch regressions the same way recurring chaos days do.</code></pre>' +
      '<p><b>Real test:</b> after a load test finds the breaking point, the real deliverable is not "it held at 4x" — it is a named, specific ' +
      'bottleneck ("connection pool saturates at 4.2x") that engineering can fix or capacity-plan around before the real event.</p>',
      try: [
        ['📖 k6 — Grafana integration for live test observability', 'https://k6.io/docs/results-output/real-time/grafana-dashboards/', 'o'],
        ['📐 Ch 2 — Prometheus & the pull model', '#ch2', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Capacity planning is not a single load test before a launch — it is turning "will it hold" into a standing, quantified model: known ' +
      'headroom per critical dependency, a known scaling curve (what breaks first as traffic grows, and at what multiple), and a load-testing cadence ' +
      'that catches capacity regressions as normal engineering changes shift the bottleneck around. The expert move is correlating the load test with ' +
      'full observability (Ch 2-4) live, so the output is not a pass/fail but a specific, actionable finding — which exact resource saturates first, ' +
      'and by how much margin does that miss the real target.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the difference between a load test, a stress test, and a soak test?\n' +
      'A: A load test validates expected peak traffic behaves within SLO. A stress test pushes past expected\n' +
      '   peak to find the actual breaking point. A soak test sustains moderate load for hours to catch\n' +
      '   slow-building problems (memory leaks, connection exhaustion) that a short burst test cannot.\n\n' +
      'Q: Why can a load test that technically "passes" still give a false sense of security?\n' +
      'A: If its shape (duration, ramp, traffic mix) does not match the real event it is meant to predict —\n' +
      '   e.g. a 10-minute burst standing in for a 4-hour sustained event — it can miss the exact failure\n' +
      '   mode (a slow leak) the real event will trigger.\n\n' +
      'Q: Why is watching dashboards/traces live during a load test more valuable than just the pass/fail result?\n' +
      'A: The pass/fail threshold tells you IF it broke; live observability tells you WHERE — which specific\n' +
      '   resource (DB pool, downstream API, GC pauses) saturated first, which is the actionable finding.\n\n' +
      'Q: Why must staging mirror production ratios for a load test to be meaningful?\n' +
      'A: If staging is sized or configured differently (smaller DB, different connection pool limits), the\n' +
      "   test measures staging's bottleneck, not production's — the result does not transfer.\n\n" +
      'Q: How does capacity planning connect to SLOs and error budgets?\n' +
      "A: Capacity headroom is what keeps the SLO holding under real traffic growth — a capacity plan\n" +
      "   without an SLO target has no defensible threshold for \"is this enough,\" and an SLO without\n" +
      "   capacity planning behind it is just an aspiration.</code></pre>",
      try: [
        ['📖 Google SRE Book — software engineering in SRE (capacity planning themes)', 'https://sre.google/sre-book/software-engineering-in-sre/', 'o'],
        ['💵 Ch 11 — cost observability / FinOps for infrastructure', '#ch11', 'o']
      ] }
  ],

  quiz: [
    { q: 'What distinguishes a soak test from a standard load test?',
      opts: [
        'A soak test uses fewer virtual users',
        'A soak test sustains moderate load for a long duration (hours) to catch slow-building problems like memory leaks or connection exhaustion that a short burst test cannot find',
        'Soak tests only run against staging, never production-like environments',
        'There is no meaningful difference'],
      ok: 1,
      why: 'Soak tests are specifically designed to surface issues that only manifest after sustained load over time, unlike a short burst load test.' },
    { q: 'Why is watching dashboards and traces live during a load test more valuable than the final pass/fail result alone?',
      opts: [
        'It has no additional value beyond the pass/fail result',
        'Live observability reveals WHERE the system broke — the specific saturating resource (e.g. a connection pool) — turning the test into an actionable finding instead of just a verdict',
        'It makes the test run faster',
        'It replaces the need for thresholds in the test script'],
      ok: 1,
      why: 'The real deliverable of a load test is a specific bottleneck to fix, which live observability during the run is what surfaces.' },
    { q: 'Why must a load test\'s staging environment mirror production configuration/ratios?',
      opts: [
        'It does not matter, results always transfer directly',
        'If staging is sized or configured differently, the test measures staging\'s bottleneck rather than production\'s, and the result will not accurately predict production behavior',
        'k6 requires identical environments to run at all',
        'Production environments cannot be load tested under any circumstances'],
      ok: 1,
      why: 'A load test is only predictive of production behavior if the environment under test reflects production\'s actual constraints.' }
  ]
};
