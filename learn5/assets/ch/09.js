/* DevOps-Infra Learn — Part 5 · Chapter 9: Chaos Engineering */
window.CH[9] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Every system has untested assumptions — "the retry logic will handle that," "we\'ll fail over automatically." Chaos engineering finds them ' +
      'on a Tuesday afternoon with everyone watching, instead of at 2 a.m. during a real outage.</p>' +
      '<pre><code>WITHOUT CHAOS TESTING   the failover path is untested until the day it is needed for real\n' +
      'WITH CHAOS TESTING       kill the primary on purpose, in a controlled window, and watch what actually happens</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A fire drill, not a fire.</b> You do not wait for a real fire to discover the ' +
      'exit door is chained shut. A scheduled fire drill — announced, low-stakes, everyone briefed — finds that broken exit while there is no actual ' +
      'fire, so it gets fixed before it ever matters.</p></div>',
      try: [
        ['📖 Principles of Chaos Engineering', 'https://principlesofchaos.org/', 'o'],
        ['📟 Ch 8 — on-call & incident command', '#ch8', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>THE CHAOS EXPERIMENT LOOP\n' +
      '  1. Define "steady state" — a measurable normal (e.g. p99 < 300ms, error rate < 0.1%)\n' +
      '  2. Hypothesize — "if we kill one replica, steady state holds because of X"\n' +
      '  3. Inject a real-world failure — kill a pod, add network latency, exhaust a resource\n' +
      '  4. Measure — did steady state actually hold? If not, you just found a real gap.\n' +
      '  5. Fix, and shrink the "blast radius" as confidence grows — one pod, then one AZ, then...\n\n' +
      '# example: kill a pod on purpose via a chaos tool\n' +
      'kubectl delete pod orders-service-7d9f8 --grace-period=0   # simplest possible chaos experiment</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Purpose-built chaos tools — <b>Chaos Mesh</b> and <b>LitmusChaos</b> for ' +
      'Kubernetes, or Netflix\'s original <b>Chaos Monkey</b> — inject controlled failure (pod kills, network partitions, latency, resource exhaustion) ' +
      'with guardrails: scoped blast radius, automatic abort conditions, and full observability wired in so every experiment is measured, not just run.</p></div>',
      try: [
        ['📖 LitmusChaos — Kubernetes chaos engineering', 'https://litmuschaos.io/', 'o'],
        ['📖 Chaos Mesh — chaos engineering platform', 'https://chaos-mesh.org/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A "highly available" database that was not.</b> A team assumes their managed ' +
      'database\'s automatic failover takes a few seconds, because that is what the documentation says. A chaos experiment that kills the primary node ' +
      'in a staging environment reveals failover actually takes 90 seconds under real load — the connection pool\'s retry/backoff settings amplify the ' +
      'outage instead of riding it out. That gap gets fixed with tuned pool settings and a circuit breaker, discovered on a Tuesday game day instead ' +
      'of during an actual regional database event.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A chaos experiment with no blast-radius control causes a real outage.</b> An ' +
      'early, overeager chaos test injects latency across an entire production network segment instead of one scoped service, cascading into a ' +
      'genuine customer-facing outage with no abort switch defined. The fix is process, not abandoning chaos testing: always start in staging, define ' +
      'an automatic abort condition (e.g. error rate exceeds X, kill the experiment immediately), and expand blast radius only after smaller ' +
      'experiments build confidence.</p></div>' +
      '<p><b>Rule of thumb:</b> an assumption about resilience that has never been deliberately tested is not a fact — it is a hope, and hope is not a ' +
      'strategy for the day it matters.</p>',
      try: [
        ['📖 Netflix — Chaos Monkey', 'https://netflix.github.io/chaosmonkey/', 'o'],
        ['📏 Ch 10 — capacity planning & load testing', '#ch10', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Running chaos experiments directly          Start in staging, validate the hypothesis and the abort\n' +
      '  in prod with no prior staging test          path work correctly, THEN graduate to a scoped prod run.\n' +
      'No defined abort condition                  Set an automatic stop (error rate/latency threshold) that\n' +
      '                                            halts the experiment immediately if steady state breaks badly.\n' +
      'No steady-state hypothesis before starting   "Let\'s just break stuff and see" is not an experiment —\n' +
      '                                            define the measurable "normal" you expect to hold, first.\n' +
      'Unscoped blast radius (whole cluster/region) Start with the smallest meaningful scope (one pod, one\n' +
      '                                            replica) and expand only as confidence is earned.\n' +
      'One-off chaos day, never repeated            Regressions creep back in — schedule recurring game days,\n' +
      '                                            not a single one-time exercise treated as "done forever."\n' +
      'Nobody outside the chaos team knows it       Announce the window to on-call/stakeholders (unless\n' +
      '  is happening                                 explicitly testing alerting itself) — surprise chaos erodes trust.</code></pre>' +
      '<p><b>Real test:</b> after a chaos experiment, ask "did our alerting/dashboards actually notice this failure, and did the runbook work as ' +
      'written" — if either answer is no, the experiment found a second gap on top of the one it was designed to find.</p>',
      try: [
        ['📖 Gremlin — chaos engineering fundamentals', 'https://www.gremlin.com/chaos-engineering', 'o'],
        ['🤖 Ch 14 — runbooks & automated remediation', '#ch14', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Chaos engineering is applied skepticism toward your own architecture diagrams — the box labeled "auto-failover" on a whiteboard is a claim, ' +
      'not a verified property, until something has actually tried to break it under controlled conditions. Mature programs treat it as continuous, ' +
      'not a one-time confidence exercise: automated game days run on a schedule, blast radius expands as a deliberate curve from single-pod to ' +
      'multi-region, and every experiment feeds back into both the runbook library (fixes for what was found) and the alerting/dashboard suite ' +
      '(did observability even notice the injected failure).</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the steady-state hypothesis, and why does every chaos experiment need one?\n' +
      'A: It is a measurable definition of "normal" (e.g. p99 < 300ms, error rate < 0.1%) that you expect to\n' +
      '   hold even under the injected failure. Without it, "we broke something and watched" is not a\n' +
      "   scientific test — you can't tell if the system actually degraded or not.\n\n" +
      'Q: Why does blast radius need to start small and expand gradually?\n' +
      'A: An unscoped experiment (e.g. cluster-wide network latency) can cause a genuine customer-facing\n' +
      '   outage before you have confidence in the failure mode — start with one pod/replica and expand only\n' +
      '   as each smaller experiment succeeds.\n\n' +
      'Q: What is an abort condition and why is it non-negotiable?\n' +
      'A: An automatic threshold (e.g. error rate spikes past X) that immediately halts the experiment —\n' +
      '   without it, a chaos test can turn into an uncontrolled real outage instead of a controlled learning\n' +
      '   exercise.\n\n' +
      'Q: How does chaos engineering relate to incident response and runbooks?\n' +
      'A: A chaos experiment is also a test of whether alerting/dashboards notice the injected failure and\n' +
      '   whether the runbook for that failure mode actually works — gaps found feed directly back into Ch 7\n' +
      '   alerting and Ch 14 runbooks.\n\n' +
      'Q: Why run chaos experiments on a recurring schedule instead of once?\n' +
      "A: Architecture and dependencies change constantly; a resilience property verified once can silently\n" +
      "   regress (a config change removes a retry, a new dependency has no timeout) — recurring game days\n" +
      "   catch that drift before a real incident does.</code></pre>",
      try: [
        ['📖 Principles of Chaos Engineering', 'https://principlesofchaos.org/', 'o'],
        ['🗺️ Ch 16 — observability platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is a "steady-state hypothesis" in a chaos engineering experiment?',
      opts: [
        'A guess about which team caused the last outage',
        'A measurable definition of normal system behavior (e.g. p99 latency, error rate) that you expect to hold even while the failure is injected — without it there is no way to tell if the system actually degraded',
        'A description of the chaos tool\'s configuration file',
        'The final report written after the experiment'],
      ok: 1,
      why: 'The steady-state hypothesis is what turns "break something and watch" into an actual measurable experiment.' },
    { q: 'Why should chaos experiments start with a small blast radius and expand gradually?',
      opts: [
        'Small experiments are easier to schedule',
        'An unscoped experiment (e.g. whole-cluster network latency) risks causing a real customer-facing outage before confidence in the failure mode is established',
        'Blast radius has no effect on experiment safety',
        'Kubernetes does not support targeting a single pod'],
      ok: 1,
      why: 'Starting small (one pod/replica) and expanding only as confidence grows keeps chaos experiments controlled rather than accidentally destructive.' },
    { q: 'Besides the resilience gap itself, what else does a chaos experiment commonly reveal?',
      opts: [
        'Nothing else — it only tests the specific failure injected',
        'Whether alerting/dashboards actually noticed the injected failure and whether the relevant runbook works as written',
        'The exact financial cost of a future outage',
        'The identity of who is responsible for the bug'],
      ok: 1,
      why: 'A well-run chaos experiment doubles as a test of the observability and runbook response to that failure mode, not just the failure mode itself.' }
  ]
};
