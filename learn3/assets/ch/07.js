/* DevOps-Infra Learn — Part 3 · Chapter 7: Multi-Cluster & Multi-Tenancy */
window.CH[7] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Two teams need to share Kubernetes without stepping on each other. <b>Multi-tenancy</b> is doing that inside ONE cluster (namespaces + quotas ' +
      '+ RBAC as the walls); <b>multi-cluster</b> is giving each team (or region, or environment) its own whole cluster. Neither is free: one cluster ' +
      'per team means N times the control-plane cost and toil; one shared cluster means every tenant\'s isolation is only as strong as your namespace ' +
      'boundaries.</p>' +
      '<pre><code>multi-tenant (1 cluster):   ns-team-a | ns-team-b | ns-team-c   — shared control plane, shared nodes\n' +
      'multi-cluster (N clusters): cluster-a  |  cluster-b  |  cluster-c   — fully separate control planes</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>An apartment building vs. separate houses.</b> Separate houses (multi-cluster) ' +
      'give total isolation — one neighbor\'s plumbing disaster never touches you — at the cost of N roofs, N foundations, N utility bills. An apartment ' +
      'building (multi-tenant cluster) shares infrastructure efficiently, but a bad neighbor\'s noise (noisy-neighbor CPU, a network issue) can still ' +
      'leak through thin walls if the building was not built with real soundproofing (quotas, NetworkPolicy).</p></div>',
      try: [
        ['📖 Kubernetes — Multi-tenancy', 'https://kubernetes.io/docs/concepts/security/multi-tenancy/', 'o'],
        ['☸️ Ch 11 — RBAC and NetworkPolicy are the isolation primitives underneath', '#ch11', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># namespace-based tenant isolation — the standard starting point\n' +
      'apiVersion: v1\n' +
      'kind: ResourceQuota\n' +
      'metadata: { name: team-a-quota, namespace: team-a }\n' +
      'spec:\n' +
      '  hard: { requests.cpu: "20", requests.memory: 40Gi, pods: "100" }\n\n' +
      'apiVersion: v1\n' +
      'kind: LimitRange\n' +
      'metadata: { name: team-a-defaults, namespace: team-a }\n' +
      'spec:\n' +
      '  limits: [{ default: { cpu: 500m, memory: 512Mi }, type: Container }]\n\n' +
      '# RBAC scoping a team to only its own namespace\n' +
      'kind: RoleBinding\n' +
      'metadata: { name: team-a-admin, namespace: team-a }\n' +
      'subjects: [{ kind: Group, name: team-a-engineers }]\n' +
      'roleRef: { kind: ClusterRole, name: admin, apiGroup: rbac.authorization.k8s.io }</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The standard starting isolation stack is <b>namespace + ResourceQuota + ' +
      'LimitRange + RBAC + NetworkPolicy</b> (soft multi-tenancy). For stronger isolation needs (untrusted tenants, compliance boundaries), the ' +
      'standard escalation is a dedicated <b>node pool per tenant</b> with taints/tolerations, or a full separate cluster — vCluster and Kamaji are ' +
      'emerging tools for "virtual clusters" that sit between these extremes.</p></div>',
      try: [
        ['📖 Kubernetes — Resource Quotas', 'https://kubernetes.io/docs/concepts/policy/resource-quotas/', 'o'],
        ['📖 vCluster — Virtual Clusters', 'https://www.vcluster.com/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A noisy-neighbor incident with "isolated" namespaces.</b> ' +
      'Team B\'s batch job floods the shared cluster\'s node CPU; Team A\'s latency-sensitive API — in a totally separate namespace, with its own ' +
      'ResourceQuota — degrades anyway, because ResourceQuota caps total requested CPU but nothing stopped Team B\'s pods from bursting past their ' +
      'limits and starving CPU on shared nodes. Fix: set CPU <b>limits</b> (not just requests) and use <code>PriorityClass</code> so latency-sensitive ' +
      'workloads preempt batch jobs under contention, or move noisy batch workloads to a dedicated, tainted node pool entirely.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>Namespace isolation that forgot the network.</b> ' +
      'Every tenant has its own namespace and RBAC, but no <code>NetworkPolicy</code> exists — any pod in the cluster can reach any other pod\'s ' +
      'Service directly, so a compromised low-trust tenant\'s pod can hit a sensitive internal API in a completely different team\'s namespace. Fix: a ' +
      'default-deny NetworkPolicy per namespace (Ch 11), with explicit allow rules only for legitimate cross-namespace traffic, closes this — RBAC ' +
      'alone only controls the Kubernetes API, never pod-to-pod network traffic.</p></div>' +
      '<p><b>Sizing shared vs. dedicated:</b> start shared with real quotas; graduate a tenant to a dedicated cluster only when you hit a concrete wall — ' +
      'compliance requiring physical isolation, a blast-radius requirement, or genuinely adversarial noisy-neighbor patterns quotas cannot fix.</p>',
      try: [
        ['📖 Kubernetes — Pod Priority and Preemption', 'https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/', 'o'],
        ['☸️ Ch 9 — noisy neighbors also drive autoscaling and node-pool design', '#ch9', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'ResourceQuota with requests set but        Set BOTH requests and limits — quota alone caps what can be\n' +
      '  no limits, or limits with no quota        scheduled, limits cap what a pod can actually burst to use.\n' +
      'Namespace isolation with no                RBAC controls the API only; add default-deny NetworkPolicy\n' +
      '  NetworkPolicy at all                       per namespace so pods cannot reach each other by default.\n' +
      'One shared cluster for tenants with         Untrusted/adversarial tenants need node-level isolation\n' +
      '  genuinely different trust levels            (dedicated node pools, gVisor/Kata, or a separate cluster) —\n' +
      '                                              namespace boundaries alone are not a hard security boundary.\n' +
      'No PriorityClass differentiation             Under contention, the scheduler/kubelet has no way to know\n' +
      '  between latency-sensitive and batch          your latency-sensitive API matters more than a batch job\n' +
      '  workloads                                    without explicit PriorityClass.\n' +
      'Cluster-admin RBAC handed out because       Scope RBAC tightly per tenant namespace from day one — walking\n' +
      '  "it was easier to unblock the team"          back over-broad access later is a much harder conversation.\n' +
      'No per-tenant cost visibility                Without labels + a cost tool (Ch 12), a shared cluster makes\n' +
      '                                              it impossible to tell which tenant is actually driving spend.</code></pre>' +
      '<p><b>The real test:</b> have one tenant deliberately try to exceed its quota and reach another tenant\'s Service. If either succeeds, the ' +
      '"isolation" is namespace-shaped, not isolation-shaped.</p>',
      try: [
        ['📖 Kubernetes — Network Policies', 'https://kubernetes.io/docs/concepts/services-networking/network-policies/', 'o'],
        ['☸️ Ch 8 — admission policy can enforce tenant guardrails automatically', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Multi-tenancy is a spectrum, not a binary: from "soft" (namespace + quota + RBAC, trusted internal teams) through "hard" (dedicated node ' +
      'pools, gVisor/Kata sandboxing, per-tenant NetworkPolicy, strict PSS) to full <b>multi-cluster</b> (separate control planes, often needed for ' +
      'regulatory data-residency or genuinely untrusted tenants). Choosing a point on that spectrum is a cost/isolation trade a platform team makes ' +
      'explicitly, tenant by tenant — not a single cluster-wide policy.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the difference between "soft" and "hard" multi-tenancy in Kubernetes?\n' +
      'A: Soft: namespace + ResourceQuota + RBAC + NetworkPolicy, sufficient for trusted internal teams sharing\n' +
      '   a cluster. Hard: adds node-level isolation (dedicated/tainted node pools, sandboxed runtimes like\n' +
      '   gVisor/Kata) for tenants that are untrusted or need a strict compliance boundary — namespaces alone\n' +
      '   are not considered a hard security boundary against a determined adversary in the same cluster.\n\n' +
      'Q: A tenant has a ResourceQuota but still causes a noisy-neighbor incident. Why, and what fixes it?\n' +
      'A: ResourceQuota caps total REQUESTED resources, not actual usage — pods without LIMITS can still burst\n' +
      '   and starve shared nodes. Fix: set container limits too, and use PriorityClass so critical workloads\n' +
      '   preempt lower-priority ones under real contention.\n\n' +
      'Q: Why is RBAC alone insufficient for tenant isolation?\n' +
      'A: RBAC governs the Kubernetes API (who can create/read/delete objects) — it says nothing about network\n' +
      "   traffic between pods. Without NetworkPolicy, any pod can reach any other pod's Service directly\n" +
      '   regardless of namespace or RBAC boundaries.\n\n' +
      'Q: When does a tenant genuinely need a dedicated cluster instead of a namespace in a shared one?\n' +
      'A: When there is a concrete requirement quotas/NetworkPolicy cannot satisfy — regulatory data residency,\n' +
      '   a hard compliance boundary, or an adversarial trust relationship — not just "this team wants their\n' +
      '   own cluster" as a preference.\n\n' +
      'Q: How would you design a shared cluster to support both a strict-compliance tenant and normal internal\n' +
      '   teams?\n' +
      'A: Put the strict-compliance tenant on a dedicated, tainted node pool (or a separate cluster if required\n' +
      '   by policy), with its own NetworkPolicy default-deny, stricter Pod Security Standard, and RBAC —\n' +
      '   internal teams can share standard soft multi-tenancy on the rest of the cluster.</code></pre>',
      try: [
        ['📖 Kubernetes — Pod Security Standards', 'https://kubernetes.io/docs/concepts/security/pod-security-standards/', 'o'],
        ['☸️ Ch 16 — tenancy model as a core reference-architecture decision', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is a ResourceQuota with requests set but no limits often insufficient to prevent noisy-neighbor problems?',
      opts: [
        'ResourceQuota has no effect on scheduling at all',
        'ResourceQuota caps total requested resources, but without container limits pods can still burst and starve CPU/memory on shared nodes',
        'Limits are automatically inferred from requests',
        'Noisy-neighbor issues only happen across separate clusters, never within one'],
      ok: 1,
      why: 'Requests control what gets scheduled; limits control what a running container can actually consume — both are needed to bound a noisy neighbor\'s impact.' },
    { q: 'Why is RBAC alone not sufficient for isolating tenants sharing a Kubernetes cluster?',
      opts: [
        'RBAC only governs the Kubernetes API surface, not pod-to-pod network traffic — NetworkPolicy is needed to actually restrict which pods can reach which Services',
        'RBAC is deprecated in modern Kubernetes',
        'RBAC only works for cluster-admin users',
        'RBAC automatically implies network isolation'],
      ok: 0,
      why: 'Without NetworkPolicy, any pod can reach any Service regardless of namespace or RBAC — RBAC only controls API object access.' },
    { q: 'When is a fully dedicated cluster (rather than a namespace in a shared cluster) actually justified for a tenant?',
      opts: [
        'Whenever any team simply prefers it',
        'When there is a concrete requirement — regulatory data residency, a hard compliance boundary, or a genuinely adversarial trust relationship — that quotas/NetworkPolicy cannot satisfy',
        'Every tenant should always get a dedicated cluster',
        'Dedicated clusters are never justified'],
      ok: 1,
      why: 'Dedicated clusters carry real operational cost (N control planes); they should be reserved for concrete isolation requirements soft multi-tenancy cannot meet.' }
  ]
};
