/* DevOps-Infra Learn — Part 3 · Chapter 12: Cost Optimization on Kubernetes */
window.CH[12] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Kubernetes bills you for the NODES, not the pods — a cluster\'s cost is really just "how many nodes are running, how big are they, and how ' +
      'full are they." Most Kubernetes waste is invisible without a cost tool: a pod requesting 4 CPUs but using 0.2 quietly reserves capacity nobody ' +
      'else can use, and a shared cluster with no per-team attribution makes it impossible to even know WHO is burning the budget.</p>' +
      '<pre><code>requested (reserves capacity, drives cost) vs. actually used (what the workload needs)\n' +
      'over-provisioned pod: requests 4 CPU, uses 0.2  -&gt;  3.8 CPU of capacity wasted, on every replica, all the time</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Reserving a whole conference room for a 2-person call.</b> The building still ' +
      'bills for the room whether 2 or 20 people use it — resource REQUESTS are the reservation, not the headcount. A hundred teams each reserving ' +
      'oversized rooms "just in case" is why a building (cluster) that FEELS empty can still be fully booked (fully allocated) and expensive.</p></div>',
      try: [
        ['📖 OpenCost — Kubernetes cost monitoring', 'https://www.opencost.io/', 'o'],
        ['☸️ Ch 9 — right-sized node pools are the other half of the cost equation', '#ch9', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># the two numbers that actually drive cost — requests, not limits, drive scheduling/billing pressure\n' +
      'resources:\n' +
      '  requests: { cpu: 250m, memory: 256Mi }   # what the scheduler reserves for this pod, on every node\n' +
      '  limits:   { cpu: 500m, memory: 512Mi }   # the ceiling it can burst to\n\n' +
      '# right-sizing from real usage — compare requests against actual observed usage\n' +
      'kubectl top pod -n payments\n' +
      'kubectl top pod -n payments --containers   # per-container, not just per-pod\n\n' +
      '# a per-team chargeback label convention\n' +
      'metadata:\n' +
      '  labels: { team: payments, cost-center: eng-platform }</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>OpenCost</b> (CNCF sandbox, the open-source engine behind Kubecost) is the ' +
      'standard for real-time, per-namespace/per-label cost allocation on Kubernetes — it maps actual cloud billing data down to the pod/label level so ' +
      '"who is spending what" has a real, queryable answer instead of a guess. <b>VPA (Vertical Pod Autoscaler)</b> in recommendation mode is the ' +
      'standard tool for suggesting right-sized requests from real usage history.</p></div>',
      try: [
        ['📖 OpenCost — Getting Started', 'https://www.opencost.io/docs/getting-started/', 'o'],
        ['📖 Kubernetes — Vertical Pod Autoscaler', 'https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>An over-provisioned deployment nobody noticed for months.</b> ' +
      'A service was sized generously "to be safe" during a launch and never revisited — <code>kubectl top</code> shows it using 8% of its requested ' +
      'CPU across every replica, for six months, silently reserving capacity that forced the cluster to run extra nodes. Fix: right-size using ACTUAL ' +
      'p95/p99 usage over a real time window (not a single snapshot — traffic varies by day/hour), leave headroom above p99 rather than above peak-ever, ' +
      'and re-check requests periodically as traffic patterns change, not just once at launch.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A cost spike traced to the WRONG namespace.</b> ' +
      'Finance flags a large month-over-month cost jump; without per-team labels, engineers spend two days manually correlating node-group billing to ' +
      'guess the cause, before finding it was a batch job in a shared namespace with no team label at all. Fix: enforce (via admission policy, Ch 8) that ' +
      'every namespace/workload carries a <code>team</code>/<code>cost-center</code> label BEFORE it can be scheduled — retrofitting labels after the ' +
      'fact is exactly how cost investigations become week-long archaeology.</p></div>' +
      '<p><b>A Kubecost/OpenCost setup in practice:</b> install it once, cluster-wide, feeding real cloud billing data; the immediate value is a ' +
      'dashboard by namespace/label that turns "the cluster is expensive" into "team X\'s namespace Y is 40% of spend and running at 12% utilization."</p>',
      try: [
        ['📖 OpenCost — Allocation API', 'https://www.opencost.io/docs/integrations/allocation-api', 'o'],
        ['☸️ Ch 8 — admission policy can require cost-attribution labels on every workload', '#ch8', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Sizing requests once at launch, never       Re-derive requests from real p95/p99 usage periodically —\n' +
      '  revisited                                   traffic patterns and code paths change; a static request\n' +
      '                                                from a year ago is rarely still correct.\n' +
      'No per-team/namespace cost labels            Enforce labels via admission policy so every cost investigation\n' +
      '  enforced anywhere                            starts from a queryable answer, not manual correlation.\n' +
      'Sizing requests to peak-ever-observed        Peak-ever bakes in a rare spike permanently; size to a\n' +
      '  usage                                        realistic p95/p99 with headroom, and let autoscaling (Ch 9)\n' +
      '                                                absorb genuine rare spikes instead.\n' +
      'Bin-packing ignored — many small,            Fewer, right-sized nodes with good bin-packing (tight pod\n' +
      '  under-packed nodes running                  density per node) directly reduces total node count and cost\n' +
      '                                                versus many mostly-empty nodes.\n' +
      'Dev/staging clusters running 24/7 at         Scale dev/staging to zero or minimal capacity outside working\n' +
      '  production-equivalent size                  hours — non-prod environments rarely need round-the-clock\n' +
      '                                                full capacity.\n' +
      'Treating cost optimization as a one-time     Cost is a continuous discipline — a dashboard reviewed once\n' +
      '  project rather than an ongoing practice      a quarter drifts back to waste within weeks without habit.</code></pre>' +
      '<p><b>The real test:</b> pick any namespace and ask "what would break if every pod\'s request were cut to its p95 usage?" If the honest answer ' +
      'is "probably nothing," that gap between requested and needed is the exact waste a right-sizing pass should recover.</p>',
      try: [
        ['📖 Kubernetes — Assigning CPU/Memory Resources', 'https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/', 'o'],
        ['☸️ Ch 9 — spot capacity and node-pool shape are the other major cost lever', '#ch9', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Expert cost work treats cost as a <b>first-class reliability signal</b>, not a separate finance exercise: chronic over-provisioning hides ' +
      'real capacity headroom that could instead fund genuine growth, and under-provisioning masquerading as "cost savings" produces OOMKills and ' +
      'throttling that show up as reliability incidents, not cost line items. The expert move is a per-team <b>chargeback/showback</b> model tight enough ' +
      'that teams have a direct incentive to right-size their own workloads, closing the loop instead of leaving cost as a platform-team-only concern.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why do resource REQUESTS drive Kubernetes cost more directly than actual usage?\n' +
      "A: The scheduler reserves capacity based on requests, not real-time usage — a pod requesting 4 CPU but\n" +
      '   using 0.2 still blocks that capacity from any other pod, forcing the cluster to run more/bigger nodes\n' +
      '   than actual demand needs. Cost tools bill against what is reserved, not what is consumed.\n\n' +
      'Q: Why size requests to p95/p99 usage rather than peak-ever-observed?\n' +
      'A: Peak-ever bakes a rare spike into permanent, paid-for-24/7 capacity. Sizing to a realistic p95/p99\n' +
      '   with modest headroom, combined with cluster/pod autoscaling for genuine rare spikes, captures far more\n' +
      '   of the savings without materially increasing risk.\n\n' +
      'Q: Why is per-team cost attribution (labels + a tool like OpenCost) a prerequisite for real cost\n' +
      "   optimization, not just a nice-to-have?\n" +
      'A: Without it, a cost spike triggers manual, slow correlation across shared infrastructure with no clear\n' +
      '   owner — teams cannot be held accountable for spend they cannot even see is attributed to them.\n' +
      '   Enforcing labels at admission time makes every future investigation queryable instead of archaeology.\n\n' +
      'Q: How can aggressive cost-cutting itself become a reliability risk?\n' +
      'A: Cutting requests below real need causes CPU throttling and OOMKills under normal load, not just at\n' +
      '   peak — "savings" that show up as incidents are not actually savings; right-sizing must be grounded in\n' +
      '   real usage data, not an arbitrary percentage cut.\n\n' +
      'Q: What is a chargeback/showback model, and why does it change team behavior?\n' +
      "A: Showback surfaces each team's actual cost without billing them directly; chargeback bills it to their\n" +
      '   budget. Either gives teams direct visibility (and in chargeback\'s case, direct incentive) to right-\n' +
      '   size their own workloads, instead of cost optimization being solely a platform team\'s uphill battle.</code></pre>',
      try: [
        ['📖 FinOps Foundation — Kubernetes Cost practices', 'https://www.finops.org/framework/', 'o'],
        ['☸️ Ch 16 — cost as one dimension of the platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why does a pod requesting 4 CPU but actually using 0.2 CPU still cost real money continuously?',
      opts: [
        'It does not — only actual usage is billed',
        'The scheduler reserves capacity based on requests, blocking that capacity from other pods regardless of real usage, effectively forcing more/larger nodes to run',
        'CPU requests are purely informational and have no scheduling effect',
        'Only memory requests affect cost, not CPU'],
      ok: 1,
      why: 'Requests drive scheduling and reserved capacity; unused reserved capacity is real waste even though usage is low.' },
    { q: 'Why should resource requests typically be sized to p95/p99 usage rather than the single highest observed peak?',
      opts: [
        'p95/p99 sizing is always incorrect',
        'Sizing to peak-ever bakes a rare spike into permanent paid capacity; p95/p99 with headroom captures realistic need while autoscaling absorbs genuine rare spikes',
        'Peak-ever sizing is required for compliance',
        'There is no meaningful difference between the two approaches'],
      ok: 1,
      why: 'Peak-ever sizing overprovisions constantly for a rare event; p95/p99 plus autoscaling is a much more cost-efficient way to handle occasional spikes.' },
    { q: 'Why is per-team/namespace cost attribution (e.g. via labels + OpenCost) a prerequisite for effective cost optimization?',
      opts: [
        'It is only useful for finance reporting, not engineering decisions',
        'Without it, a cost spike requires slow manual correlation with no clear owner, whereas labels make spend queryable and attributable so teams can be held accountable',
        'Cost attribution has no effect on team behavior',
        'Kubernetes automatically attributes cost without any configuration'],
      ok: 1,
      why: 'Enforced cost-attribution labels turn cost investigations into a fast query instead of manual archaeology across shared infrastructure.' }
  ]
};
