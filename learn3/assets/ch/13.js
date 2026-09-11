/* DevOps-Infra Learn — Part 3 · Chapter 13: Custom Schedulers & Scheduling Constraints */
window.CH[13] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>The default scheduler picks a node for every pod using a reasonable general-purpose algorithm — but "reasonable general-purpose" is not ' +
      '"what THIS workload needs." <b>Affinity, taints/tolerations, and topology spread</b> are the knobs that tell the scheduler your actual ' +
      'constraints: "never put two replicas on the same node," "only GPU nodes," "spread evenly across zones so one zone outage does not take ' +
      'everything down."</p>' +
      '<pre><code>default scheduler: "any node with enough free CPU/memory works"\n' +
      'with constraints:  "any node with enough free CPU/memory, that has a GPU, is not zone-a, and has no other replica of me on it"</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Seating a wedding, not just filling empty chairs.</b> A generic seating rule ' +
      '("fill any empty seat") ignores that some guests need to be near an outlet (a GPU node), some must NOT sit together (anti-affinity), and the ' +
      'whole room should not empty from one side if a door blocks (zone spread). Scheduling constraints are the seating chart, not a first-empty-seat rule.</p></div>',
      try: [
        ['📖 Kubernetes — Assigning Pods to Nodes', 'https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/', 'o'],
        ['☸️ Ch 9 — the scheduler and the cluster autoscaler are in constant conversation', '#ch9', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># spreading replicas across zones — the standard HA pattern\n' +
      'topologySpreadConstraints:\n' +
      '- maxSkew: 1\n' +
      '  topologyKey: topology.kubernetes.io/zone\n' +
      '  whenUnsatisfiable: DoNotSchedule\n' +
      '  labelSelector: { matchLabels: { app: payments } }\n\n' +
      '# GPU-aware scheduling — taint the node, tolerate it only on GPU workloads\n' +
      'kubectl taint nodes gpu-node-1 dedicated=gpu:NoSchedule\n' +
      'spec:\n' +
      '  tolerations: [{ key: dedicated, operator: Equal, value: gpu, effect: NoSchedule }]\n' +
      '  nodeSelector: { nvidia.com/gpu: "true" }   # or nodeAffinity for OR/AND logic across labels\n\n' +
      '# pod anti-affinity — never co-locate two replicas of the same app on one node\n' +
      'affinity:\n' +
      '  podAntiAffinity:\n' +
      '    requiredDuringSchedulingIgnoredDuringExecution:\n' +
      '    - topologyKey: kubernetes.io/hostname\n' +
      '      labelSelector: { matchLabels: { app: payments } }</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Taints + tolerations</b> answer "which pods are ALLOWED on this node" (a node ' +
      'opts pods in); <b>affinity/anti-affinity</b> answers "which nodes does THIS pod prefer/require" (a pod opts itself in/out); ' +
      '<b>topologySpreadConstraints</b> is the standard modern replacement for hand-rolled anti-affinity when the goal is even spread rather than strict ' +
      'exclusion. Use <code>preferredDuringScheduling...</code> over <code>required...</code> unless a violation is genuinely unacceptable — required ' +
      'constraints can leave pods permanently Pending if unsatisfiable.</p></div>',
      try: [
        ['📖 Kubernetes — Taints and Tolerations', 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/', 'o'],
        ['📖 Kubernetes — Pod Topology Spread Constraints', 'https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A "required" anti-affinity rule that deadlocks a deploy.</b> ' +
      'A 5-replica deployment uses <code>requiredDuringScheduling</code> anti-affinity (one pod per node) on a 4-node cluster — the 5th pod stays ' +
      'Pending forever, no matter how long you wait, because the constraint is mathematically unsatisfiable. Fix: either add a node, reduce replicas, or ' +
      'switch to <code>preferredDuringScheduling</code> if strict one-per-node is a preference, not a hard requirement — always sanity-check a required ' +
      'constraint against actual node count before shipping it.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>An entire zone outage taking down a "highly available" app.</b> ' +
      'A team runs 6 replicas with no topology spread at all — by chance (or a scheduler bin-packing decision) 5 of the 6 end up in a single zone. That ' +
      'zone has a real cloud-provider outage, and the "HA" app loses 80% of capacity at once. Fix: a <code>topologySpreadConstraints</code> rule with ' +
      '<code>maxSkew: 1</code> across zones is standard for anything claiming multi-zone HA — replica COUNT alone does not guarantee spread, only an ' +
      'explicit constraint does.</p></div>' +
      '<p><b>A custom scheduler for a niche workload:</b> reserved for genuinely unusual requirements (bin-packing for cost, batch/ML job co-scheduling) — ' +
      'run it alongside the default scheduler via <code>schedulerName</code> on specific pods, never as a wholesale replacement, since the default ' +
      'scheduler is heavily battle-tested for the general case.</p>',
      try: [
        ['📖 Kubernetes — Scheduler Configuration', 'https://kubernetes.io/docs/reference/scheduling/config/', 'o'],
        ['☸️ Ch 9 — Pending pods from unsatisfiable constraints vs. genuine capacity shortage', '#ch9', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'requiredDuringScheduling constraints        Sanity-check against real node/zone count first, or use\n' +
      '  that are mathematically unsatisfiable        preferred... if strict enforcement is not truly required.\n' +
      'High replica count assumed to imply HA,      Add explicit topologySpreadConstraints across zones — the\n' +
      '  with no topology spread at all               scheduler has no inherent reason to spread evenly otherwise.\n' +
      'GPU nodes with no taint                      Untainted GPU nodes silently accept non-GPU pods, wasting\n' +
      '                                               expensive capacity on workloads that did not need it.\n' +
      'A custom scheduler replacing the default      Run a custom scheduler ALONGSIDE the default via schedulerName\n' +
      '  entirely for the whole cluster                for the specific workloads that need it — do not lose the\n' +
      '                                                default scheduler\'s battle-tested general-case behavior.\n' +
      'No PriorityClass on latency-critical           Under real contention, the scheduler has no signal that one\n' +
      '  workloads sharing a cluster with batch jobs   pod matters more than another without explicit priority.\n' +
      'Affinity rules referencing labels that          A typo\'d label selector in an affinity rule fails silently —\n' +
      '  do not actually exist on any node               the pod just stays Pending with a confusing reason.</code></pre>' +
      '<p><b>The real test:</b> take down (cordon/drain) an entire zone in a test cluster. A properly spread "HA" workload should keep serving at ' +
      'reduced capacity, not drop entirely — if it drops entirely, the spread constraint was aspirational, not enforced.</p>',
      try: [
        ['📖 Kubernetes — Scheduling Framework (for custom schedulers)', 'https://kubernetes.io/docs/concepts/scheduling-eviction/scheduling-framework/', 'o'],
        ['☸️ Ch 7 — dedicated tainted node pools are also a tenancy-isolation tool', '#ch7', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Expert scheduling design treats constraints as a <b>trade-off surface</b>, not a checklist: every <code>required</code> constraint is a ' +
      'promise the cluster might not be able to keep under future conditions (fewer nodes, a zone outage, a burst of replicas), while every ' +
      '<code>preferred</code> constraint is a best-effort hint the scheduler can and will violate under pressure. The real skill is choosing, per ' +
      'workload, which failure mode is worse — a pod stuck Pending (required, too strict) or a pod scheduled somewhere suboptimal (preferred, too loose) — ' +
      'and building the constraint accordingly, with topology spread\'s <code>whenUnsatisfiable</code> giving a middle ground.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the practical difference between "required" and "preferred" scheduling constraints?\n' +
      "A: required (requiredDuringSchedulingIgnoredDuringExecution) is a hard constraint — the scheduler will\n" +
      "   leave a pod Pending forever rather than violate it. preferred is a soft hint — the scheduler tries to\n" +
      '   honor it but will still schedule the pod elsewhere if no matching node is free. Choosing wrong turns\n' +
      '   either into a stuck deploy or a silently-ignored intent.\n\n' +
      'Q: A 5-replica deployment with strict one-pod-per-node anti-affinity has a pod stuck Pending on a 4-node\n' +
      '   cluster. What is happening and how do you fix it?\n' +
      'A: The constraint is mathematically unsatisfiable — a 5th replica cannot get a unique node from only 4.\n' +
      '   Fix by adding a node, reducing replicas, or relaxing the constraint to preferred if strict exclusivity\n' +
      "   is not truly required.\n\n" +
      'Q: Why does replica count alone not guarantee high availability across zones?\n' +
      'A: With no topologySpreadConstraints, the scheduler has no inherent bias toward even zone distribution —\n' +
      '   bin-packing or chance can land most replicas in one zone, so a single zone outage can still take out\n' +
      '   most or all capacity despite a seemingly healthy replica count.\n\n' +
      'Q: When is writing a custom scheduler actually justified, versus using constraints on the default one?\n' +
      'A: Only for genuinely unusual requirements the default scheduler\'s extension points cannot express —\n' +
      '   custom bin-packing for cost, gang/co-scheduling for ML training jobs. It should run ALONGSIDE the\n' +
      '   default scheduler for the specific workloads that need it, not replace it cluster-wide.\n\n' +
      'Q: How do taints/tolerations and node affinity differ in who controls the decision?\n' +
      'A: A taint is set on the NODE and opts pods IN only if they have a matching toleration — the node\n' +
      "   controls exclusion. Affinity is set on the POD and expresses which nodes it prefers or requires — the\n" +
      '   pod controls its own placement preference. They compose: taints keep unwanted pods OFF, affinity pulls\n' +
      '   wanted pods TOWARD specific nodes.</code></pre>',
      try: [
        ['📖 Kubernetes — Priority and Preemption', 'https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/', 'o'],
        ['☸️ Ch 16 — scheduling policy as part of the platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the key practical difference between a "required" and a "preferred" scheduling constraint?',
      opts: [
        'They behave identically in practice',
        'Required constraints leave a pod Pending forever if unsatisfiable; preferred constraints are best-effort and the pod schedules elsewhere if no match is found',
        'Preferred constraints always take priority over required ones',
        'Required constraints only apply to StatefulSets'],
      ok: 1,
      why: 'requiredDuringScheduling is a hard constraint the scheduler will not violate even if that means the pod stays unscheduled; preferred is a soft hint.' },
    { q: 'A 6-replica "highly available" deployment has no topologySpreadConstraints. Why can a single zone outage still take down most of its capacity?',
      opts: [
        'Replica count alone guarantees even zone distribution',
        'Without an explicit spread constraint, the scheduler has no inherent bias toward even zone distribution — bin-packing or chance can concentrate replicas in one zone',
        'Kubernetes always spreads replicas evenly by default with no configuration needed',
        'This scenario cannot happen in Kubernetes'],
      ok: 1,
      why: 'High availability across zones requires an explicit topologySpreadConstraints rule; replica count by itself says nothing about placement distribution.' },
    { q: 'When is writing a custom scheduler actually justified?',
      opts: [
        'For every cluster, as a best practice',
        'Only for genuinely unusual requirements the default scheduler cannot express, and it should run alongside the default scheduler for just the workloads that need it',
        'Whenever taints and tolerations are used',
        'Custom schedulers should always fully replace the default scheduler'],
      ok: 1,
      why: 'The default scheduler is heavily battle-tested for the general case; a custom scheduler is reserved for niche needs and typically coexists via schedulerName.' }
  ]
};
