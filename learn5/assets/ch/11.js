/* DevOps-Infra Learn — Part 5 · Chapter 11: Cost Observability / FinOps for Infrastructure */
window.CH[11] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Most teams learn their cloud bill spiked from finance, a month after the fact, with no way to say which service or team caused it. Cost ' +
      'observability turns "the bill went up" into a real-time, attributable signal — the same discipline as latency or error rate, just for dollars.</p>' +
      '<pre><code>WITHOUT COST OBSERVABILITY   finance emails "the AWS bill is 40% higher" on the 3rd of next month\n' +
      'WITH COST OBSERVABILITY       a Tuesday alert: "team=payments cost/hour up 3x since yesterday\'s deploy"</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A smart utility meter, not a paper bill once a month.</b> A paper bill tells you ' +
      'what you spent 30 days ago, with no way to trace which appliance caused it. A smart meter shows spend per device, in real time — so you catch ' +
      'the space heater left running today, not the surprise bill in a month.</p></div>',
      try: [
        ['📖 FinOps Foundation — what is FinOps', 'https://www.finops.org/introduction/what-is-finops/', 'o'],
        ['🎯 Ch 6 — SLIs, SLOs & error budgets', '#ch6', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># cost attribution starts with tagging/labels — the same discipline as metric labels\n' +
      'resource_tags: { team: "payments", service: "checkout", env: "prod", cost_center: "eng-platform" }\n\n' +
      '# a cost-per-service PromQL-style query, fed by a cost-exporter (e.g. OpenCost/Kubecost) into Prometheus\n' +
      'sum(node_cost_hourly * pod_cpu_request_ratio) by (namespace, team)\n\n' +
      '# showback vs chargeback\n' +
      'SHOWBACK   report cost per team, no money actually moves — visibility first\n' +
      'CHARGEBACK   cost is billed to the team\'s budget — real financial accountability</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The <b>FinOps Foundation</b>\'s framework — Inform, Optimize, Operate — is the ' +
      'industry-standard practice for cloud cost management, and <b>OpenCost</b> (CNCF) is the standard open-source tool for real-time Kubernetes cost ' +
      'allocation, exposing cost as Prometheus metrics so it lives in the same dashboards as everything else in this part.</p></div>',
      try: [
        ['📖 FinOps Foundation — framework', 'https://www.finops.org/framework/', 'o'],
        ['📖 OpenCost — Kubernetes cost monitoring', 'https://www.opencost.io/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A misconfigured autoscaler doubles the bill overnight.</b> A bad deploy sets ' +
      'a pod\'s resource request far above what it actually needs, and the cluster autoscaler dutifully provisions extra nodes to satisfy it — cost per ' +
      'hour for that namespace triples, and nobody notices until the monthly invoice. A cost-per-namespace alert (analogous to an error-rate alert) ' +
      'firing the same day the deploy went out would have caught this in hours instead of weeks, with a direct link back to the offending deploy.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>Observability itself becomes the biggest line item.</b> A team\'s log and ' +
      'trace ingestion volume grows unchecked (Ch 5) until the observability platform costs more than the service it watches. Building a cost ' +
      'dashboard for the observability stack itself — cost per signal, per service — is what makes that visible and defensible: the fix (sampling, ' +
      'retention tiers, DEBUG-off-by-default) is the same content from Ch 4/Ch 5, but cost observability is what proves the problem exists and tracks ' +
      'whether the fix worked.</p></div>' +
      '<p><b>Rule of thumb:</b> if cost cannot be attributed to a specific team/service, nobody actually owns reducing it — attribution (tagging) has ' +
      'to come before optimization, not after.</p>',
      try: [
        ['📖 FinOps Foundation — showback vs chargeback', 'https://www.finops.org/framework/capabilities/showback-chargeback/', 'o'],
        ['📚 Ch 5 — log aggregation, controlling ingestion cost', '#ch5', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'No resource tagging/labels enforced         Enforce tags (team, service, env) at provisioning time via\n' +
      '                                            policy — untagged resources cannot be attributed, ever.\n' +
      'Cost reviewed only monthly, after billing    Real-time cost dashboards + alerts on anomalous spend,\n' +
      '                                            the same cadence as latency/error-rate monitoring.\n' +
      'Optimizing compute while ignoring waste      Idle/oversized resources (unused volumes, overprovisioned\n' +
      '  categories like storage/egress                requests, cross-AZ egress) are frequently the biggest wins.\n' +
      'Showback with no actual incentive to act     Pure visibility without any accountability mechanism rarely\n' +
      '                                            changes behavior — pair with budgets or a review cadence.\n' +
      'One global cost dashboard, no per-team view  Teams need THEIR slice, attributable and actionable — a\n' +
      '                                            global number nobody can act on individually gets ignored.\n' +
      'Reserved/committed spend never revisited     Usage patterns shift; commitments (reserved instances,\n' +
      '                                            savings plans) need periodic re-evaluation against actual usage.</code></pre>' +
      '<p><b>Real test:</b> pick any service and ask "what does this cost per hour, and who owns that number" — if the answer takes more than a ' +
      'dashboard lookup, or nobody is named as the owner, cost observability is not actually operational yet.</p>',
      try: [
        ['📖 FinOps Foundation — cost allocation', 'https://www.finops.org/framework/capabilities/data-ingestion/', 'o'],
        ['💥 Ch 9 — chaos engineering (the cost of over-provisioning for resilience)', '#ch9', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Cost observability succeeds only when it is treated exactly like reliability observability — real-time, attributed, alertable, and owned by ' +
      'the team that can actually act on it, not a finance-only monthly report. The expert move is closing the loop back into engineering practice: ' +
      'cost-per-request becomes a metric next to latency and error rate on the same dashboard, cost anomalies page or ticket the same way an SLO burn ' +
      'does, and capacity/chaos/observability decisions from earlier chapters get explicitly weighed against their cost, not treated as free.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the difference between showback and chargeback?\n' +
      'A: Showback reports cost per team for visibility, with no money actually moving between budgets.\n' +
      '   Chargeback actually bills the cost to the team\'s budget, creating real financial accountability —\n' +
      '   showback is usually the first step before an org is ready for chargeback.\n\n' +
      'Q: Why does cost attribution require tagging discipline before any optimization can happen?\n' +
      'A: Cost that cannot be traced to a specific team or service has no clear owner to act on reducing it —\n' +
      '   enforcing tags (team, service, env) at provisioning time is the prerequisite for any targeted\n' +
      '   optimization work.\n\n' +
      'Q: Why should cost be monitored in real time rather than reviewed only via the monthly bill?\n' +
      'A: A monthly review catches a cost spike weeks after the change that caused it, with the causal trail\n' +
      '   gone cold; real-time dashboards/alerts catch it the same day, linkable directly to the deploy or\n' +
      '   config change responsible.\n\n' +
      'Q: How does cost observability apply to the observability stack itself?\n' +
      'A: Logs, traces, and metrics ingestion can silently become one of the largest cost line items — cost\n' +
      "   dashboards per signal make that visible and let sampling/retention fixes (Ch 4, Ch 5) be measured\n" +
      '   against an actual before/after number.\n\n' +
      'Q: Why is showback alone often insufficient to change behavior?\n' +
      'A: Visibility without accountability rarely drives action — pairing cost dashboards with a review\n' +
      "   cadence, budgets, or chargeback gives teams an actual incentive to act on what they can now see.</code></pre>",
      try: [
        ['📖 FinOps Foundation — FinOps principles', 'https://www.finops.org/framework/principles/', 'o'],
        ['🗺️ Ch 16 — observability platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the key difference between showback and chargeback in FinOps?',
      opts: [
        'They are the same practice with different names',
        'Showback reports cost per team for visibility with no money moving; chargeback actually bills the cost to a team\'s budget, creating direct financial accountability',
        'Chargeback is only used for on-premises infrastructure',
        'Showback requires a dedicated finance team, chargeback does not'],
      ok: 1,
      why: 'Showback is typically the visibility-first step organizations take before moving to the stronger accountability of chargeback.' },
    { q: 'Why is resource tagging a prerequisite for effective cost optimization?',
      opts: [
        'Tags are only needed for security compliance, not cost',
        'Cost that cannot be attributed to a specific team or service has no clear owner to act on reducing it — attribution must exist before targeted optimization is possible',
        'Cloud providers require tags to bill customers at all',
        'Tagging has no real impact on cost management'],
      ok: 1,
      why: 'Without team/service attribution via tags, nobody has a specific, actionable number to own and reduce.' },
    { q: 'Why should cost be monitored in real time rather than only reviewed via the monthly bill?',
      opts: [
        'Real-time monitoring has no advantage over monthly review',
        'A monthly review surfaces a cost spike weeks after the causal change, while real-time dashboards/alerts can catch it the same day and link it directly to the responsible deploy',
        'Cloud providers do not offer monthly billing data',
        'Real-time monitoring is only relevant for on-call engineers, not cost'],
      ok: 1,
      why: 'Fast feedback lets a cost spike be traced to its actual cause while the context is still fresh, the same way fast alerting helps reliability incidents.' }
  ]
};
