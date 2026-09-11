/* DevOps-Infra Learn — Part 3 · Chapter 16: The Platform Team's Kubernetes — Reference Architecture */
window.CH[16] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Every chapter in this part was one piece of a single machine. Put together, a real platform team\'s Kubernetes setup is: CRDs and operators ' +
      '(Ch 1-2) as the extension mechanism, Helm and GitOps (Ch 3-4) as how anything gets deployed, a mesh and ingress (Ch 5-6) as how traffic moves, ' +
      'tenancy and admission control (Ch 7-8) as the guardrails, autoscaling/storage/scheduling (Ch 9-10, 13) as capacity management, and security/cost/ ' +
      'upgrades (Ch 11-12, 14) as ongoing operation. None of these pieces work well in isolation — this chapter is the diagram that shows how they fit.</p>' +
      '<pre><code>Git repo (source of truth) -&gt; Argo CD/Flux -&gt; Helm-rendered manifests -&gt; admission control gate -&gt; cluster\n' +
      '                                                                                         |\n' +
      '                                          mesh + ingress route traffic, autoscaler adds capacity, RBAC/NetworkPolicy contain blast radius</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A city, not a building.</b> Chapter 1 was one building (a CRD). A platform team ' +
      'runs a whole city: roads (ingress/mesh), zoning laws (admission control/tenancy), utilities that scale with demand (autoscaling), a fire code ' +
      '(security), and a permit office that records every change (GitOps) — a city works because these systems were designed to interlock, not because ' +
      'any single building is impressive alone.</p></div>',
      try: [
        ['📖 CNCF — Cloud Native Landscape', 'https://landscape.cncf.io/', 'o'],
        ['☸️ Ch 1 — the foundational mechanism everything else in this part builds on', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># the reference stack, layer by layer — what a typical platform team actually runs\n' +
      'Delivery:     Git repo of Helm charts  -&gt;  Argo CD (Ch 3, 4)\n' +
      'Extension:    CRDs + operators for anything not built-in  (Ch 1, 2)\n' +
      'Traffic:      Gateway API + Istio/Linkerd  (Ch 5, 6)\n' +
      'Governance:   Kyverno/OPA Gatekeeper + namespace-based tenancy  (Ch 7, 8)\n' +
      'Capacity:     Karpenter/Cluster Autoscaler + CSI storage + topology spread  (Ch 9, 10, 13)\n' +
      'Security:     RBAC + NetworkPolicy + Pod Security Standards  (Ch 11)\n' +
      'Operations:   OpenCost for spend, a deprecated-API scanner ahead of every upgrade  (Ch 12, 14)</code></pre>' +
      '<p>No production platform runs ALL of these from day one — this is a target state, adopted incrementally in roughly the order above: delivery ' +
      'and extension mechanisms first (nothing else matters if you cannot ship), governance and security next (before scale makes retrofitting painful), ' +
      'capacity and cost tooling last (once there is enough real usage data to optimize against).</p>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The <b>CNCF Cloud Native Landscape</b> is the standard map of which tools exist in ' +
      'each category; a platform team rarely builds custom tooling for any of these layers — the job is mostly integration and policy, choosing and ' +
      'wiring together well-maintained CNCF projects rather than reinventing them.</p></div>',
      try: [
        ['📖 CNCF — Platforms Whitepaper', 'https://tag-app-delivery.cncf.io/whitepapers/platforms/', 'o'],
        ['☸️ Ch 4 — GitOps is the backbone every other layer\'s config flows through', '#ch4', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>Designing your platform\'s Kubernetes setup from scratch.</b> ' +
      'A new platform team is handed a blank cluster and six app teams waiting to deploy. The trap: trying to stand up every layer (mesh, full GitOps, ' +
      'OPA policy library, cost dashboards) before anyone ships a single workload — six months later, nothing is in production and the app teams have ' +
      'built workarounds. Fix: sequence it — GitOps + a Helm chart template + baseline RBAC/quotas gets teams shipping safely in week one; mesh, ' +
      'fine-grained policy, and cost tooling arrive in later phases once there is a real platform to observe and real usage data to inform them.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The "walk me through your cluster" interview question.</b> ' +
      'A candidate is asked to describe a Kubernetes platform they built; a weak answer lists tool names ("we used Argo CD, Istio, Kyverno"). A strong ' +
      'answer explains the INTERLOCK: "GitOps was the single path to production so every change was auditable; admission policy gated what GitOps was ' +
      'even allowed to apply; the mesh gave us mTLS without touching app code, which mattered because our compliance requirement was encryption in ' +
      'transit specifically." Interviewers are testing whether you understand WHY each piece exists together, not whether you can name tools.</p></div>' +
      '<p><b>A platform RFC, condensed:</b> state the problem (what app teams cannot do today), propose the minimum layer that solves it, name the ' +
      'concrete trade-off accepted (operational complexity, cost), and define what "done" looks like — a platform RFC that does not name a trade-off has ' +
      'not actually made a decision.</p>',
      try: [
        ['☸️ Ch 7 — the tenancy model is usually the first real platform RFC a new team writes', '#ch7', 'o'],
        ['📖 CNCF — TAG App Delivery', 'https://tag-app-delivery.cncf.io/', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Standing up every layer before any app     Sequence by what unblocks teams fastest: GitOps + chart\n' +
      '  team can ship anything                     template + baseline RBAC/quotas first; mesh/fine policy/cost\n' +
      '                                              tooling in later phases once real usage exists to inform them.\n' +
      'Adopting a tool per layer with no shared    Standardize on ONE GitOps tool, ONE policy engine, ONE mesh —\n' +
      '  convention across teams                    a platform with 3 different "standards" per layer is not\n' +
      '                                              actually standardized, it is just more surface to maintain.\n' +
      'Treating each chapter\'s tool as               Design admission policy that gates GitOps syncs; design\n' +
      '  independent, with no integration              tenancy to align with cost-attribution labels; the value is\n' +
      '                                                in the layers reinforcing each other, not standing alone.\n' +
      'No clear owner for the platform itself       "The platform" needs a team accountable for its reliability\n' +
      '                                              and roadmap, same as any product — otherwise every layer\n' +
      '                                              rots independently with no one responsible for the whole.\n' +
      'Copying another company\'s reference           A reference architecture is a STARTING POINT reflecting their\n' +
      '  architecture wholesale with no adaptation    constraints (team size, compliance, scale) — adopt the\n' +
      '                                                pattern, not the exact tool list, without justifying each choice.</code></pre>' +
      '<p><b>The real test:</b> can you point to any single layer in your platform and explain what specifically breaks for app teams if it were removed ' +
      'tomorrow? If a layer exists but nobody can articulate its concrete value, it is accumulated complexity, not a deliberate architectural choice.</p>',
      try: [
        ['📖 CNCF — TAG App Delivery Platforms Whitepaper', 'https://tag-app-delivery.cncf.io/whitepapers/platforms/', 'o'],
        ['☸️ Ch 8 — admission control is the clearest example of one layer gating another', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>The expert synthesis of this entire part: a Kubernetes "platform" is not a tool list, it is a set of <b>deliberate, interlocking trade-offs</b> ' +
      'made explicit — GitOps trades deploy speed for auditability; a mesh trades operational complexity for network-layer security/observability for ' +
      'free; admission control trades some team autonomy for guaranteed guardrails. A platform team\'s real job is not implementing every chapter in this ' +
      'part, it is deciding WHICH trade-offs this specific organization, at this specific scale and risk tolerance, should actually make — and being able ' +
      'to defend each one on its own terms.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Walk me through your cluster/platform design, end to end.\n' +
      'A: Start from the problem the platform solves (safe, fast, auditable delivery for N app teams), then the\n' +
      '   layers in dependency order — GitOps as the single path to production, admission policy gating what\n' +
      '   GitOps can apply, a mesh/ingress layer for traffic, tenancy/RBAC/NetworkPolicy for isolation, autoscaling\n' +
      '   and storage for capacity — explaining WHY each exists and what concretely breaks without it, not just\n' +
      '   naming the tools.\n\n' +
      'Q: How do you decide the ORDER to adopt these layers in a brand-new platform?\n' +
      'A: Whatever unblocks app teams fastest and safest first — usually GitOps + a chart template + baseline\n' +
      '   RBAC/quotas. Governance (admission policy) and security follow before scale makes retrofitting painful.\n' +
      '   Capacity/cost tooling comes last, once there is real usage data to optimize against rather than guesses.\n\n' +
      'Q: What is the real cost of adopting a full service mesh, and when do you decide it is worth paying?\n' +
      'A: Real operational complexity and per-pod resource overhead. Worth it when the org genuinely needs\n' +
      '   several of its capabilities together (mTLS + retries + fine traffic control + observability) — if only\n' +
      '   one is needed, a narrower tool (cert-manager, app-level retries) is usually the better trade.\n\n' +
      'Q: How do you keep a reference architecture from becoming stale accumulated complexity?\n' +
      "A: Every layer should have a named owner and a concrete answer to \"what breaks for app teams if this is\n" +
      '   removed.\" Periodically re-justify each layer against current scale/requirements rather than assuming\n' +
      '   past decisions are still correct as the organization changes.\n\n' +
      'Q: What is the difference between copying a reference architecture and actually designing a platform?\n' +
      "A: A reference architecture reflects someone ELSE's constraints — team size, compliance regime, scale.\n" +
      "   Designing a platform means adopting the PATTERN (GitOps, layered guardrails, capacity management) and\n" +
      '   independently justifying each specific tool choice against your own constraints, not copying their\n' +
      '   tool list wholesale.</code></pre>',
      try: [
        ['📖 CNCF — Cloud Native Landscape (full tool map)', 'https://landscape.cncf.io/', 'o'],
        ['☸️ Ch 1 — the mechanism that made every other chapter in this part possible', '#ch1', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the recommended sequencing when a new platform team adopts the layers covered across this part?',
      opts: [
        'Every layer should be stood up simultaneously before any app team deploys anything',
        'Delivery/extension mechanisms (GitOps, charts, baseline RBAC/quotas) first to unblock teams safely; governance and security next; capacity/cost tooling once real usage data exists',
        'Cost optimization tooling should always be adopted first',
        'The order does not matter at all'],
      ok: 1,
      why: 'Sequencing by what unblocks app teams fastest and safest avoids the trap of a fully-built platform with nothing actually in production.' },
    { q: 'In a "walk me through your cluster" interview, what distinguishes a strong answer from a weak one?',
      opts: [
        'A strong answer lists as many tool names as possible',
        'A strong answer explains why each layer exists and how they interlock (e.g. admission policy gating what GitOps applies), not just naming tools used',
        'A strong answer avoids mentioning trade-offs',
        'Tool names are irrelevant to a strong answer'],
      ok: 1,
      why: 'Interviewers are testing understanding of why the pieces fit together and what concrete problem each solves, not memorized tool names.' },
    { q: 'Why is copying another company\'s Kubernetes reference architecture wholesale considered an anti-pattern?',
      opts: [
        'Reference architectures should never be looked at',
        'A reference architecture reflects someone else\'s specific constraints (team size, compliance, scale) — the pattern should be adopted and each tool choice independently justified against your own constraints',
        'All reference architectures are identical anyway',
        'It is always correct to copy exactly since Kubernetes tooling is universal'],
      ok: 1,
      why: 'A platform design should reflect the adopting organization\'s own constraints and trade-offs, not blindly replicate another org\'s specific tool choices.' }
  ]
};
