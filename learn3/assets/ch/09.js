/* DevOps-Infra Learn — Part 3 · Chapter 9: Cluster Autoscaling & Node Pools */
window.CH[9] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>The Horizontal Pod Autoscaler adds more PODS; it does nothing if there is no room left on any node to schedule them. A ' +
      '<b>cluster autoscaler</b> — Cluster Autoscaler or Karpenter — watches for pods stuck <code>Pending</code> because nothing fits, and adds a whole ' +
      'new NODE to make room, then removes it later when it is no longer needed. Two different autoscalers, two different layers, and you usually need ' +
      'both.</p>' +
      '<pre><code>HPA:                more traffic  -&gt;  more pod replicas\n' +
      'Cluster Autoscaler: no room for those pods  -&gt;  add a node  -&gt;  now the pods can schedule</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Adding cashiers vs. opening a new checkout lane.</b> HPA is calling in more ' +
      'cashiers (pods) as the line grows. But if every checkout lane (node) is already staffed and full, calling in more cashiers does nothing — someone ' +
      'has to open lane 9 (a new node) first. Cluster autoscaling is opening and closing lanes as demand rises and falls.</p></div>',
      try: [
        ['📖 Kubernetes — Cluster Autoscaler', 'https://kubernetes.io/docs/concepts/cluster-administration/cluster-autoscaling/', 'o'],
        ['☸️ Ch 13 — scheduling constraints decide WHERE those new pods can land', '#ch13', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># a Karpenter NodePool — provisions right-sized nodes on demand\n' +
      'apiVersion: karpenter.sh/v1\n' +
      'kind: NodePool\n' +
      'metadata: { name: default }\n' +
      'spec:\n' +
      '  template:\n' +
      '    spec:\n' +
      '      requirements:\n' +
      '        - { key: karpenter.sh/capacity-type, operator: In, values: [spot, on-demand] }\n' +
      '        - { key: kubernetes.io/arch, operator: In, values: [amd64] }\n' +
      '      nodeClassRef: { name: default }\n' +
      '  limits: { cpu: "1000" }\n' +
      '  disruption: { consolidationPolicy: WhenEmptyOrUnderutilized }\n\n' +
      '# why a pod is stuck Pending — always check this first\n' +
      'kubectl describe pod my-pod | grep -A5 Events\n' +
      '# "0/8 nodes available: insufficient cpu" -&gt; autoscaler should add a node; check its logs if it does not</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Classic <b>Cluster Autoscaler</b> scales predefined, fixed-shape node groups (ASGs/ ' +
      'MIGs). <b>Karpenter</b> (increasingly the standard on AWS, expanding elsewhere) provisions right-sized nodes directly from a flexible set of ' +
      'instance types per pending-pod requirements — no pre-defined node group shapes needed, faster scale-up, and tighter bin-packing.</p></div>',
      try: [
        ['📖 Karpenter — Documentation', 'https://karpenter.sh/docs/', 'o'],
        ['📖 Kubernetes — Cluster Autoscaler FAQ', 'https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>Pods stuck Pending despite the autoscaler being healthy.</b> ' +
      'A new node group is added but pods still will not schedule onto it — <code>kubectl describe pod</code> shows ' +
      '"0/12 nodes available: node(s) had taint {dedicated: gpu} that the pod didn\'t tolerate," because the new nodes are tainted for GPU workloads and ' +
      'the pending pod has no matching toleration. Fix: the autoscaler correctly refused to scale up a node group that would not actually help — always ' +
      'read the FULL scheduling failure reason, not just "Pending," before assuming the autoscaler is broken.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A spiky workload that "scaled" but the bill tripled.</b> ' +
      'A team sizes node pools for average load; a daily traffic spike triggers rapid scale-up on expensive on-demand instances, then scale-down, then ' +
      'scale-up again a few hours later — thrashing that maximizes cost. Fix: mix spot/on-demand capacity types with Karpenter, set sensible ' +
      'consolidation/disruption budgets to avoid premature scale-down right before the next spike, and use predictive baseline capacity for known daily ' +
      'patterns rather than reacting purely to Pending pods every time.</p></div>' +
      '<p><b>Debugging a stuck scale-up fast:</b> the autoscaler\'s own logs (<code>kubectl logs -n kube-system deploy/cluster-autoscaler</code>) ' +
      'usually explain exactly why a scale-up did not happen — quota limits, no matching instance type, or a taint no pending pod tolerates.</p>',
      try: [
        ['📖 Cluster Autoscaler — Scale-up events explained', 'https://github.com/kubernetes/autoscaler/blob/master/cluster-autoscaler/FAQ.md#i-have-a-couple-of-pending-pods-but-there-was-no-scale-up', 'o'],
        ['☸️ Ch 12 — spot/on-demand mix is also a cost-optimization lever', '#ch12', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Sizing node pools for average load          Size for realistic PEAK with headroom; spiky workloads need\n' +
      '  on a spiky workload                         fast scale-up capacity (Karpenter) or pre-provisioned buffer.\n' +
      'Assuming a Pending pod means the             Read the FULL event reason — taints/tolerations, affinity,\n' +
      '  autoscaler is broken                        PVC zone mismatch, or quota limits can all block scale-up\n' +
      '                                              even when the autoscaler is working correctly.\n' +
      'No PodDisruptionBudget on workloads         Aggressive node consolidation/scale-down can evict pods faster\n' +
      '  that get scaled-down nodes                  than they can be safely rescheduled without a PDB.\n' +
      'All on-demand, no spot capacity              Fault-tolerant/batch workloads on spot instances cut cost\n' +
      '  for cost-insensitive/batch work              significantly; reserve on-demand for latency-critical paths.\n' +
      'One giant node pool for every workload       Separate pools (general, memory-optimized, GPU, spot) let the\n' +
      '  shape                                        autoscaler pick the right-sized node instead of over-provisioning.\n' +
      'No cluster-autoscaler resource limits/       An unconstrained autoscaler can scale to a runaway node count\n' +
      '  max node count set                           on a bug (e.g. a CrashLoop pod spawning endless Pending copies).</code></pre>' +
      '<p><b>The real test:</b> deliberately submit a pod requesting more CPU than any node in any pool has. It should stay Pending with a clear ' +
      '"no node type can satisfy this" reason — if the autoscaler instead scales up nodes forever trying to fit it, your limits are not actually set.</p>',
      try: [
        ['📖 Karpenter — Disruption &amp; Consolidation', 'https://karpenter.sh/docs/concepts/disruption/', 'o'],
        ['☸️ Ch 13 — taints/tolerations and topology spread interact directly with autoscaling', '#ch13', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Expert autoscaler design treats node-pool shape as a <b>direct lever on both reliability and cost</b>: too few, too-generic pools mean slow, ' +
      'expensive scale-up for spiky workloads and poor bin-packing; too many hyper-specific pools mean fragmented capacity where a pod can be Pending ' +
      'even though the cluster has plenty of total slack, just not in the right shape. Karpenter\'s move away from fixed node-group shapes toward ' +
      'per-pod, just-in-time instance selection is precisely a response to that fragmentation problem.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why do you usually need BOTH the Horizontal Pod Autoscaler and a cluster autoscaler, not just one?\n' +
      "A: HPA adds pod replicas to handle more traffic, but if the cluster's nodes are already full, those new\n" +
      "   pods just sit Pending — there's no compute to run them on. A cluster autoscaler adds/removes actual\n" +
      '   nodes so HPA\'s new pods have somewhere to schedule.\n\n' +
      'Q: A pod is stuck Pending and the cluster autoscaler is healthy. What do you check before assuming the\n' +
      '   autoscaler is broken?\n' +
      'A: The FULL scheduling failure reason on the pod\'s events — taints/tolerations mismatch, node affinity/\n' +
      '   anti-affinity, a PVC pinned to a different zone, or hitting the autoscaler\'s own max-node/quota limit\n' +
      '   can all correctly prevent scale-up even when the autoscaler itself is working as designed.\n\n' +
      'Q: How does Karpenter differ architecturally from classic Cluster Autoscaler?\n' +
      'A: Classic Cluster Autoscaler scales predefined, fixed-shape node groups up/down. Karpenter provisions\n' +
      '   right-sized nodes directly from a flexible instance-type pool based on actual pending-pod\n' +
      '   requirements — no pre-defined group shapes, generally faster and tighter bin-packing.\n\n' +
      'Q: Why can too many narrow, hyper-specific node pools hurt more than too few?\n' +
      "A: Capacity gets fragmented — a cluster can have plenty of total idle capacity but a pending pod still\n" +
      "   can't schedule because none of the specific pools match its exact requirements. Broader, well-chosen\n" +
      '   pools (or Karpenter\'s flexible selection) avoid this trap.\n\n' +
      'Q: How do you keep an autoscaler from becoming a cost runaway on a bug?\n' +
      'A: Set hard limits (max CPU/node count per NodePool) so a bug generating endless Pending pods (e.g. a\n' +
      '   CrashLoop with a job controller retrying) cannot scale the cluster without bound.</code></pre>',
      try: [
        ['📖 Kubernetes — Autoscaling FAQ (HPA vs Cluster Autoscaler)', 'https://kubernetes.io/docs/concepts/workloads/autoscaling/', 'o'],
        ['☸️ Ch 16 — autoscaling strategy as one axis of the reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is the Horizontal Pod Autoscaler alone insufficient to handle a traffic spike on a fully-packed cluster?',
      opts: [
        'HPA is deprecated',
        'HPA only adds pod replicas; if no node has room to schedule them, the new pods just stay Pending — a cluster autoscaler is needed to add nodes',
        'HPA automatically adds nodes too',
        'HPA only works with StatefulSets'],
      ok: 1,
      why: 'HPA and cluster autoscaling operate at different layers — pods vs. nodes — and a spiky workload typically needs both working together.' },
    { q: 'A pod is stuck Pending even though the cluster autoscaler is healthy and has room to add nodes. What should you check first?',
      opts: [
        'Restart the autoscaler immediately',
        'The full scheduling failure reason on the pod\'s events — taints/tolerations, affinity rules, PVC zone constraints, or autoscaler limits can all correctly block scheduling',
        'Delete and recreate the pod repeatedly',
        'Assume it is always a quota problem'],
      ok: 1,
      why: 'A Pending pod can be correctly blocked by many factors besides raw capacity; the event reason usually pinpoints the actual cause.' },
    { q: 'How does Karpenter differ from classic Cluster Autoscaler in how it provisions nodes?',
      opts: [
        'Karpenter cannot scale down, only up',
        'Karpenter provisions right-sized nodes directly from a flexible instance-type pool based on pending-pod requirements, rather than scaling predefined fixed-shape node groups',
        'Karpenter only works with GPU workloads',
        'There is no practical difference between the two'],
      ok: 1,
      why: 'Karpenter selects instance types just-in-time per pending pod requirements instead of relying on pre-defined node group shapes, generally enabling faster scale-up and tighter bin-packing.' }
  ]
};
