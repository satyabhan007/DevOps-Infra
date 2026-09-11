/* DevOps-Infra Learn — Part 5 · Chapter 13: Synthetic Monitoring & Uptime Checks */
window.CH[13] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Real-user metrics only tell you about the requests that actually arrived. If checkout is broken for everyone in a region and nobody has ' +
      'tried to buy anything in the last five minutes, your dashboards can look perfectly healthy while the site is completely down.</p>' +
      '<pre><code>REAL-USER MONITORING    waits for a real user to hit the broken path, then reports it\n' +
      'SYNTHETIC MONITORING     a robot user hits the same path every minute, from outside, whether or not anyone else does</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A mystery shopper, not just the cash register till count.</b> The till tells you ' +
      'how much was sold today — nothing if the store never opened. A mystery shopper walks in and tries to buy something on a schedule, every hour, ' +
      'catching "the door is locked" before a single real customer does.</p></div>',
      try: [
        ['📖 Grafana Cloud — Synthetic Monitoring', 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/', 'o'],
        ['🎯 Ch 6 — SLIs, SLOs & error budgets', '#ch6', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>// a synthetic checkout-flow check using Playwright — scripted like a real user, run on a schedule\n' +
      'test("checkout flow", async ({ page }) =&gt; {\n' +
      '  await page.goto("https://example.com");\n' +
      '  await page.click("text=Add to cart");\n' +
      '  await page.click("text=Checkout");\n' +
      '  await expect(page.locator("text=Order confirmed")).toBeVisible({ timeout: 5000 });\n' +
      '});\n\n' +
      '# a simple uptime check — cheap, runs every 30-60s from multiple regions\n' +
      'GET https://example.com/healthz  -&gt;  expect 200 within 2s, from us-east, eu-west, ap-south</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Playwright</b> is the standard tool for scripting realistic multi-step ' +
      'synthetic flows (login, add-to-cart, checkout), while dedicated synthetic platforms (Grafana Synthetic Monitoring, or a simple multi-region ' +
      'uptime checker) handle scheduling, geographic distribution, and alerting on top of the script.</p></div>',
      try: [
        ['📖 Playwright — end-to-end testing', 'https://playwright.dev/docs/intro', 'o'],
        ['📖 Grafana — multi-http and browser checks', 'https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/create-checks/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>An outage nobody\'s dashboards catch.</b> A DNS misconfiguration makes the ' +
      'site unreachable from one geographic region only. Real-user metrics from that region simply go to zero — which, on an aggregate global ' +
      'dashboard, looks identical to "that region just has low traffic right now," not "that region is down." A synthetic check running from that ' +
      'specific region on a fixed schedule fails immediately and unambiguously, catching the outage in under a minute instead of waiting for enough ' +
      'support tickets to form a pattern.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A synthetic check that only tests the homepage misses the actual break.</b> ' +
      'A team\'s only synthetic monitor is "GET / returns 200," which stays green while the payment provider integration on the checkout page is ' +
      'silently failing for every real transaction. Building a full-flow synthetic test — add to cart, enter payment, confirm order — that exercises ' +
      'the exact critical path revenue depends on is what actually catches this class of failure before customers do.</p></div>' +
      '<p><b>Rule of thumb:</b> a synthetic check is only as good as how closely it mirrors the critical user journey — a homepage ping proves the ' +
      'server is up, not that the business actually works.</p>',
      try: [
        ['📖 Google SRE Book — Monitoring Distributed Systems (black-box monitoring)', 'https://sre.google/sre-book/monitoring-distributed-systems/', 'o'],
        ['🎯 Ch 6 — SLIs, SLOs & error budgets', '#ch6', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Only checking "GET / returns 200"           Script the actual critical user journey (login, add-to-cart,\n' +
      '                                            checkout) — a homepage ping proves far less than it seems to.\n' +
      'Checking from one region/one location        Run from multiple geographic regions — a regional DNS/CDN/\n' +
      '                                            network issue is invisible from a single vantage point.\n' +
      'Synthetic checks alerting the same as         A single synthetic failure can be a transient blip; require\n' +
      '  a single real-user error                    N consecutive failures or agreement across regions before paging.\n' +
      'No correlation between synthetic failure      Wire the synthetic check\'s failure into the same trace/log\n' +
      '  and real telemetry                           pipeline (Ch 4/5) so a failure is immediately debuggable, not just "it\'s down."\n' +
      'Checks running too infrequently                A 15-minute check interval means up to 15 minutes of\n' +
      '  (e.g. every 15+ minutes)                     undetected downtime — critical paths deserve 30-60s intervals.\n' +
      'Synthetic monitoring treated as separate        Feed synthetic-check results into the same SLO/error-budget\n' +
      '  from the SLO                                   calculation as real traffic for the paths it covers.</code></pre>' +
      '<p><b>Real test:</b> deliberately break the checkout flow in staging (or a canary) and time how long until a synthetic check fails and pages — ' +
      'if it is slower than your real-user-based alerting would have been, the synthetic check is not adding coverage, just noise.</p>',
      try: [
        ['📖 Playwright — trace viewer (debugging a failed synthetic run)', 'https://playwright.dev/docs/trace-viewer', 'o'],
        ['🚨 Ch 7 — symptom-based & burn-rate alerting', '#ch7', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Synthetic monitoring\'s real value is independence from real traffic — it is the one signal that keeps working even when real users have ' +
      'stopped arriving, which is exactly the condition (total outage, regional blackhole, broken funnel) where every traffic-dependent metric goes ' +
      'silent instead of alarming. The expert discipline is treating synthetic checks as a first-class SLI input, not a separate side system: ' +
      'multi-region, scripted as the real critical journey, correlated into the same trace/log pipeline on failure so a synthetic alert comes with an ' +
      'immediately actionable trace rather than just a red status.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why can a total outage be invisible on real-user-metric dashboards?\n' +
      'A: Real-user metrics only report on requests that actually arrive — if nobody can reach the site at\n' +
      '   all (DNS failure, regional blackhole), traffic simply drops to zero, which can look identical to\n' +
      '   "naturally low traffic" on an aggregate dashboard rather than an obvious alarm.\n\n' +
      'Q: Why is a homepage-only uptime check insufficient for most services?\n' +
      'A: It proves the server responds, not that the business-critical path (checkout, login, search) works —\n' +
      "   a payment integration can fail completely while the homepage stays a clean 200.\n\n" +
      'Q: Why run synthetic checks from multiple geographic regions?\n' +
      'A: A single-region check cannot detect a regional DNS, CDN, or network issue that only affects users\n' +
      '   in that geography — multi-region checks are the only way to catch a partial, geography-scoped outage.\n\n' +
      'Q: How should synthetic check results feed into SLOs?\n' +
      'A: They should count as first-class SLI inputs for the journeys they cover, not a separate side system —\n' +
      '   a synthetic failure represents real, would-be user impact even when no real user happened to try.\n\n' +
      'Q: Why require multiple consecutive failures (or cross-region agreement) before paging on a synthetic check?\n' +
      "A: A single transient blip (a flaky network hop, one probe location's hiccup) can false-positive; requiring\n" +
      "   a pattern before paging keeps the signal trustworthy the same way \"for:\" durations do for metric alerts.</code></pre>",
      try: [
        ['📖 Google SRE Book — Monitoring Distributed Systems', 'https://sre.google/sre-book/monitoring-distributed-systems/', 'o'],
        ['🧵 Ch 4 — distributed tracing with OpenTelemetry', '#ch4', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why can a real total outage sometimes fail to trigger real-user-metric-based alerts?',
      opts: [
        'Real-user metrics are always more sensitive than synthetic checks',
        'If nobody can reach the site at all, real traffic simply drops to zero, which can look like naturally low traffic on an aggregate dashboard rather than an obvious alarm',
        'Real-user metrics only work for mobile apps',
        'This scenario cannot actually happen'],
      ok: 1,
      why: 'Synthetic monitoring exists precisely to keep testing the system independent of whether any real user traffic is arriving.' },
    { q: 'Why is a synthetic check that only tests "GET / returns 200" often insufficient?',
      opts: [
        'HTTP GET requests are unreliable for testing',
        'It proves the server is responding, not that the actual business-critical journey (e.g. checkout, payment) works — those can fail while the homepage stays healthy',
        'Homepage checks are more expensive to run than full-flow checks',
        'It is actually sufficient for all services'],
      ok: 1,
      why: 'A synthetic check needs to mirror the real critical user journey to catch the failures that actually matter to the business.' },
    { q: 'Why should synthetic monitoring run from multiple geographic regions?',
      opts: [
        'It is required by most cloud providers',
        'A single-vantage-point check cannot detect a regional DNS, CDN, or network issue that only affects users in one geography',
        'Multi-region checks are cheaper to operate than single-region ones',
        'It has no effect on detection capability'],
      ok: 1,
      why: 'Regional outages are invisible to a check running from just one location — geographic distribution is what catches them.' }
  ]
};
