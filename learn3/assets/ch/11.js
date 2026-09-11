/* DevOps-Infra Learn — Part 3 · Chapter 11: Kubernetes Security */
window.CH[11] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Kubernetes security is fundamentally about <b>blast radius</b>: if one pod is compromised (a bad dependency, an RCE in your app), what can ' +
      'the attacker actually reach from there? By default the answer is "a lot" — any pod can talk to any other pod\'s network, and a pod\'s ' +
      'ServiceAccount often has more API permissions than it needs. RBAC, NetworkPolicy, and Pod Security Standards are the three tools that shrink that ' +
      'blast radius down to "only what this specific workload actually needs."</p>' +
      '<pre><code>no hardening:  compromised pod -&gt; reach any pod on the network -&gt; read any API object its SA allows\n' +
      'hardened:      compromised pod -&gt; NetworkPolicy blocks most reach -&gt; RBAC limits what it can even ask for</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Fire doors in a building.</b> An open floor plan lets a fire (a compromise) spread ' +
      'everywhere instantly. Fire doors (NetworkPolicy) and key-card zones (RBAC) do not prevent the fire from starting, but they contain it to the room ' +
      'it started in — the goal of hardening is never "never breached," it is "a breach in one place stays in one place."</p></div>',
      try: [
        ['📖 Kubernetes — Securing a Cluster', 'https://kubernetes.io/docs/tasks/administer-cluster/securing-a-cluster/', 'o'],
        ['☸️ Ch 7 — tenant isolation relies on these exact same primitives', '#ch7', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># least-privilege ServiceAccount — scoped Role, not ClusterRole/cluster-admin\n' +
      'apiVersion: rbac.authorization.k8s.io/v1\n' +
      'kind: Role\n' +
      'metadata: { name: pod-reader, namespace: payments }\n' +
      'rules: [{ apiGroups: [""], resources: [pods], verbs: [get, list, watch] }]\n\n' +
      '# default-deny NetworkPolicy — the standard starting point for every namespace\n' +
      'apiVersion: networking.k8s.io/v1\n' +
      'kind: NetworkPolicy\n' +
      'metadata: { name: default-deny, namespace: payments }\n' +
      'spec: { podSelector: {}, policyTypes: [Ingress, Egress] }   # empty selector = applies to ALL pods, denies all traffic\n\n' +
      '# Pod Security Standard enforced at the namespace level\n' +
      'kubectl label namespace payments pod-security.kubernetes.io/enforce=restricted</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Pod Security Standards (PSS)</b> — <code>privileged</code>/<code>baseline</code>/ ' +
      '<code>restricted</code> — replaced the deprecated PodSecurityPolicy as the built-in standard; enforced via a namespace label, no extra controller ' +
      'needed. For anything PSS cannot express, <b>OPA Gatekeeper/Kyverno</b> (Ch 8) fill the gap. NetworkPolicy enforcement itself requires a CNI that ' +
      'implements it (Calico, Cilium) — installing the YAML alone does nothing without a compatible CNI.</p></div>',
      try: [
        ['📖 Kubernetes — Pod Security Standards', 'https://kubernetes.io/docs/concepts/security/pod-security-standards/', 'o'],
        ['📖 Kubernetes — Network Policies', 'https://kubernetes.io/docs/concepts/services-networking/network-policies/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A default-deny NetworkPolicy that silently breaks DNS.</b> ' +
      'A team applies a default-deny egress policy and every pod immediately starts failing to resolve DNS — default-deny blocks ALL egress, including ' +
      'the traffic to <code>kube-dns</code>/CoreDNS that every pod needs just to look up a Service name. Fix: default-deny policies must always be ' +
      'paired with an explicit allow rule for DNS (UDP/TCP 53 to the <code>kube-system</code> DNS pods) — this is the single most common NetworkPolicy ' +
      'rollout mistake.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A Pod Security Standard rollout that breaks a legitimate workload.</b> ' +
      'Enforcing <code>restricted</code> cluster-wide in one shot breaks a monitoring DaemonSet that legitimately needs host network access — ' +
      '<code>restricted</code> forbids <code>hostNetwork</code>/<code>hostPID</code>/privileged escalation by design. Fix: roll PSS out namespace by ' +
      'namespace, starting with <code>warn</code>/<code>audit</code> modes (both can be set alongside <code>enforce</code>) to see what would break BEFORE ' +
      'enforcing, and give legitimately privileged workloads (CNI/monitoring DaemonSets) their own less-restricted namespace rather than a global exception.</p></div>' +
      '<p><b>A least-privilege ServiceAccount checklist:</b> never use the <code>default</code> ServiceAccount for anything with real permissions, set ' +
      '<code>automountServiceAccountToken: false</code> on pods that never call the API at all, and scope every Role to exactly the verbs/resources that ' +
      'workload actually calls — check with <code>kubectl auth can-i --list --as=system:serviceaccount:ns:name</code>.</p>',
      try: [
        ['📖 Kubernetes — Configure a Security Context for a Pod', 'https://kubernetes.io/docs/tasks/configure-pod-container/security-context/', 'o'],
        ['☸️ Ch 8 — admission control can enforce PSS-style rules with finer-grained logic too', '#ch8', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Default-deny egress with no DNS           Always pair default-deny with an explicit allow to CoreDNS/\n' +
      '  allow rule                                 kube-dns — otherwise every pod breaks immediately.\n' +
      'Cluster-wide PSS enforcement in one         Roll out namespace by namespace, starting in audit/warn mode\n' +
      '  shot, straight to "restricted"              to see real breakage before flipping to enforce.\n' +
      'ServiceAccount tokens auto-mounted into     Set automountServiceAccountToken: false on any pod that never\n' +
      '  pods that never call the API                calls the Kubernetes API — an unused token is pure attack surface.\n' +
      'Secrets mounted as env vars                 Prefer mounting Secrets as files (env vars leak more easily via\n' +
      '                                              process listings, crash dumps, child-process inheritance).\n' +
      'RBAC granted at the ClusterRole level        Scope to a namespaced Role wherever possible — a ClusterRole\n' +
      '  "because it was simpler"                    binding is cluster-wide even if you only meant one namespace.\n' +
      'No image scanning / no admission            An unscanned image with known CVEs, or a container running as\n' +
      '  policy against running as root               root with no restriction, both directly increase blast radius\n' +
      '                                              of any single-container compromise.</code></pre>' +
      '<p><b>The real test:</b> pick a real pod, run <code>kubectl auth can-i --list --as=system:serviceaccount:&lt;ns&gt;:&lt;sa&gt;</code>. If the list ' +
      'includes verbs/resources that pod never actually calls, RBAC is not least-privilege yet — trim it and re-test the workload still functions.</p>',
      try: [
        ['📖 Kubernetes — RBAC Authorization', 'https://kubernetes.io/docs/reference/access-authn-authz/rbac/', 'o'],
        ['☸️ Ch 9 — a compromised pod scaling resource usage is itself a signal to watch', '#ch9', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Expert Kubernetes security assumes <b>defense in depth</b>, not a single silver bullet: RBAC (API-layer), NetworkPolicy (network-layer), Pod ' +
      'Security Standards + admission policy (workload-spec-layer), and image/supply-chain scanning (build-time layer) each stop a different class of ' +
      'attack, and a determined attacker only needs the ONE layer you skipped. The expert question for every new workload is not "is this compliant" but ' +
      '"if this exact pod is compromised right now, what is the actual reachable blast radius" — walked through concretely, layer by layer.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why does a default-deny egress NetworkPolicy commonly break DNS resolution, and how do you avoid it?\n' +
      "A: Default-deny blocks ALL egress by default, including the traffic every pod needs to reach CoreDNS/\n" +
      "   kube-dns just to resolve a Service name. Always pair default-deny with an explicit allow rule to the\n" +
      '   DNS pods/port before rolling it out — otherwise the cluster looks completely broken immediately.\n\n' +
      'Q: How should a Pod Security Standard rollout be sequenced on an existing production cluster?\n' +
      'A: Namespace by namespace, starting in audit/warn mode to surface real violations without blocking\n' +
      '   anything, then enforce once violations are fixed or the namespace is confirmed clean — never flip\n' +
      '   restricted cluster-wide in one shot.\n\n' +
      'Q: Why should Secrets be mounted as files rather than environment variables where possible?\n' +
      'A: Env vars are more easily leaked — via process listing tools, crash/core dumps, logging middleware that\n' +
      '   dumps environment, or inheritance by child processes. A mounted file is a narrower, more controllable\n' +
      '   surface.\n\n' +
      'Q: What is the practical difference RBAC, NetworkPolicy, and Pod Security Standards each protect against?\n' +
      'A: RBAC limits what the Kubernetes API will let a compromised identity DO. NetworkPolicy limits what a\n' +
      '   compromised POD can REACH over the network. PSS/admission policy limits what a pod is even ALLOWED TO\n' +
      "   RUN AS (privileged, hostNetwork, etc.) in the first place. They are independent layers — none of them\n" +
      '   substitutes for the others.\n\n' +
      'Q: For a specific workload, how do you concretely verify it is running least-privilege?\n' +
      'A: `kubectl auth can-i --list --as=system:serviceaccount:&lt;ns&gt;:&lt;sa&gt;` to see exactly what its identity can\n' +
      '   do, cross-checked against what the code actually calls; disable automountServiceAccountToken if it\n' +
      '   never calls the API at all; confirm its securityContext forbids privilege escalation and root where\n' +
      '   not explicitly required.</code></pre>',
      try: [
        ['📖 CNCF — Kubernetes Security Whitepaper', 'https://github.com/cncf/tag-security/blob/main/security-whitepaper/v2/kubernetes-security-whitepaper.md', 'o'],
        ['☸️ Ch 16 — security as a cross-cutting layer of the reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'A team applies a default-deny NetworkPolicy and every pod immediately fails to resolve DNS. Why?',
      opts: [
        'NetworkPolicy has no effect on DNS',
        'Default-deny blocks ALL egress by default, including traffic to CoreDNS/kube-dns — an explicit allow rule for DNS must be added alongside it',
        'DNS runs outside the cluster and is unaffected by NetworkPolicy',
        'This only happens if the CNI does not support NetworkPolicy at all'],
      ok: 1,
      why: 'This is the most common NetworkPolicy rollout mistake: default-deny egress cuts off DNS resolution unless an explicit allow rule for CoreDNS is added.' },
    { q: 'How should a Pod Security Standard (PSS) rollout to "restricted" be sequenced on an existing production cluster?',
      opts: [
        'Enforce restricted cluster-wide in one shot for consistency',
        'Roll out namespace by namespace, starting in audit/warn mode to surface violations before switching to enforce',
        'PSS cannot be rolled out incrementally',
        'Apply it only to new namespaces, never existing ones'],
      ok: 1,
      why: 'A cluster-wide, immediate enforce can break legitimate workloads (e.g. privileged monitoring DaemonSets); audit/warn mode first reveals real impact safely.' },
    { q: 'Why are RBAC, NetworkPolicy, and Pod Security Standards each necessary, rather than any one being sufficient alone?',
      opts: [
        'They are redundant and only one is needed',
        'They protect different layers — RBAC limits API actions, NetworkPolicy limits network reachability, and PSS limits what a pod is allowed to run as — none substitutes for the others',
        'Only RBAC matters in a properly configured cluster',
        'NetworkPolicy alone covers all three concerns'],
      ok: 1,
      why: 'Defense in depth requires each layer since a determined attacker only needs to exploit the one layer that was skipped.' }
  ]
};
