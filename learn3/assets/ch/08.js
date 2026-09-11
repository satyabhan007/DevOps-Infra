/* DevOps-Infra Learn — Part 3 · Chapter 8: Admission Control — OPA Gatekeeper & Kyverno */
window.CH[8] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>RBAC controls WHO can create a resource; <b>admission control</b> controls WHAT they are allowed to create, at the moment it is submitted — ' +
      'before it is ever stored. A validating admission webhook can reject "this pod has no resource limits" or "this pod requests a privileged ' +
      'container" outright, with a clear error, instead of letting it in and hoping someone notices later.</p>' +
      '<pre><code>kubectl apply -&gt; API server -&gt; [admission webhooks: mutate, then validate] -&gt; etcd (stored)\n' +
      '                                          ^ reject here = never gets stored at all</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Airport security vs. an ID checkpoint.</b> RBAC is the ID checkpoint — it ' +
      'confirms who you are and whether you are allowed past this point at all. Admission control is the security scanner AFTER that — even an ' +
      'authorized passenger gets stopped if their bag (pod spec) contains something not allowed (no seatbelt sign equivalent: no resource limits, ' +
      'privileged mode, the "latest" tag), no exceptions, every single time.</p></div>',
      try: [
        ['📖 Kubernetes — Admission Controllers', 'https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/', 'o'],
        ['☸️ Ch 1 — CRD instances are exactly what admission webhooks validate', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># Kyverno — block :latest tag, require resource limits (declarative YAML policy)\n' +
      'apiVersion: kyverno.io/v1\n' +
      'kind: ClusterPolicy\n' +
      'metadata: { name: require-limits-no-latest }\n' +
      'spec:\n' +
      '  validationFailureAction: Enforce\n' +
      '  rules:\n' +
      '  - name: no-latest-tag\n' +
      '    match: { any: [{ resources: { kinds: [Pod] } }] }\n' +
      '    validate:\n' +
      '      message: "Image tag :latest is not allowed"\n' +
      '      pattern: { spec: { containers: [{ image: "!*:latest" }] } }\n\n' +
      '# OPA Gatekeeper — same idea, policy written in Rego via a ConstraintTemplate + Constraint\n' +
      'apiVersion: constraints.gatekeeper.sh/v1beta1\n' +
      'kind: K8sRequiredLabels\n' +
      'metadata: { name: require-team-label }\n' +
      'spec: { match: { kinds: [{ apiGroups: [""], kinds: [Pod] }] }, parameters: { labels: ["team"] } }</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>OPA Gatekeeper</b> (policy in <b>Rego</b>, the general-purpose Open Policy Agent ' +
      'language) and <b>Kyverno</b> (policy in plain Kubernetes-native YAML, no new language to learn) are the two CNCF policy engines in wide ' +
      'production use. Kyverno has become the more common default for teams without existing Rego investment, purely for the lower authoring barrier.</p></div>',
      try: [
        ['📖 Kyverno — Policies', 'https://kyverno.io/docs/writing-policies/', 'o'],
        ['📖 OPA Gatekeeper — Documentation', 'https://open-policy-agent.github.io/gatekeeper/website/docs/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A policy rollout that blocks every deploy cluster-wide, at once.</b> ' +
      'A platform team enables a "must have resource limits" policy in <code>Enforce</code> mode directly, cluster-wide — every team\'s next deploy ' +
      'that lacks limits starts failing simultaneously, with no warning, mid-incident-response for one of them. Fix: roll new policies out in ' +
      '<code>Audit</code>/<code>validationFailureAction: Audit</code> mode first, review violations for a week, notify affected teams, THEN flip to ' +
      'Enforce — policy engines should never go straight to blocking in a shared cluster.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>An admission webhook that becomes a single point of failure.</b> ' +
      'The Gatekeeper/Kyverno webhook pod itself crashes or is unreachable — with <code>failurePolicy: Fail</code> (the safer default for enforcing ' +
      'policy), this means <b>every</b> API write cluster-wide starts failing, including totally unrelated ones, because the API server cannot reach the ' +
      'webhook to ask permission. Fix: run the policy engine with real replica counts and a PodDisruptionBudget, and understand ' +
      '<code>failurePolicy: Fail</code> vs. <code>Ignore</code> is a deliberate security/availability trade-off, not a default to leave unexamined.</p></div>' +
      '<p><b>An exception workflow that scales:</b> use policy-native exclusions (namespace/label-based exemptions in the policy itself, reviewed and ' +
      'time-boxed) rather than ad hoc "just disable the policy for now" — an untracked exception is a policy hole nobody remembers to close.</p>',
      try: [
        ['📖 Kyverno — Background Scans &amp; Audit mode', 'https://kyverno.io/docs/policy-reports/', 'o'],
        ['☸️ Ch 11 — Pod Security Standards are themselves admission-controlled', '#ch11', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'New policy shipped straight to             Ship in Audit/dry-run mode first, review real violations,\n' +
      '  Enforce mode cluster-wide                  notify affected teams, THEN switch to Enforce.\n' +
      'Policy engine webhook as a single           Run &gt;=2 replicas with a PodDisruptionBudget; a webhook\n' +
      '  point of failure with failurePolicy: Fail   outage with Fail policy blocks ALL cluster writes, not just\n' +
      '                                              policy-violating ones.\n' +
      'Ad hoc, untracked policy exceptions          Use policy-native, reviewed, time-boxed exemptions (namespace\n' +
      '  ("just disable it for now")                 /label exclusions) — untracked exceptions never get revisited.\n' +
      'No exemption for system/kube-system         Overly broad policies can accidentally block essential\n' +
      '  namespaces on cluster-wide policies         platform components; scope match rules carefully.\n' +
      'Mutating AND validating in the same         Keep mutation (e.g. auto-injecting a default limit) and\n' +
      '  policy with unclear intent                  validation (rejecting a bad spec) conceptually separate —\n' +
      '                                              conflating them makes failures hard to reason about.\n' +
      'No policy testing before merge               Test policies against known-good and known-bad manifests in\n' +
      '                                              CI (Kyverno CLI / conftest) before they ever reach a cluster.</code></pre>' +
      '<p><b>The real test:</b> submit a manifest you KNOW violates every active policy. Each violation should produce a clear, specific rejection ' +
      'message naming the exact rule and field — a policy engine returning a generic "denied" with no explanation will get bypassed via workarounds ' +
      'nobody can safely audit.</p>',
      try: [
        ['📖 Kyverno CLI — Testing Policies', 'https://kyverno.io/docs/kyverno-cli/', 'o'],
        ['☸️ Ch 14 — admission control also catches deprecated APIs before an upgrade', '#ch14', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Admission control is where a platform team\'s policy becomes <b>executable and unavoidable</b> rather than a wiki page nobody reads. The ' +
      'expert-level design question is not "what should we block" but "what is our rollout and exception discipline" — a policy engine with no audit ' +
      'trail, no staged rollout process, and no clear exception path becomes either a rubber stamp (everything exempted) or a productivity tax (teams ' +
      'route around it). The engine itself (Gatekeeper vs. Kyverno) matters far less than the operating discipline wrapped around it.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the difference between what RBAC and admission control each enforce?\n' +
      'A: RBAC governs WHO can perform WHICH verb on WHICH resource type/namespace. Admission control governs\n' +
      '   WHAT the actual content of a request must look like to be accepted — e.g. a user may be authorized\n' +
      "   (RBAC) to create Pods, but admission control can still reject THIS pod for lacking resource limits.\n\n" +
      'Q: Why must a new cluster-wide policy be rolled out in Audit mode before Enforce?\n' +
      'A: Enforce mode immediately blocks any non-compliant request. Rolling straight to Enforce on an\n' +
      '   established cluster can break every team\'s in-flight deploys simultaneously with no warning; Audit\n' +
      '   mode surfaces real violations first so teams can fix them ahead of a scheduled enforcement date.\n\n' +
      'Q: What does `failurePolicy: Fail` on an admission webhook mean for cluster availability if that webhook\n' +
      '   pod goes down?\n' +
      'A: With Fail, the API server refuses ANY write it cannot get a decision on from the webhook — a webhook\n' +
      '   outage becomes a cluster-wide write outage, not just a policy-violation block. This is why the policy\n' +
      "   engine's own availability (replicas, PDB) is itself a production concern.\n\n" +
      'Q: How should policy exceptions be handled so they do not silently accumulate?\n' +
      'A: Native, declarative exemptions (namespace/label-scoped) tracked in the policy repo itself, reviewed on\n' +
      '   a cadence, ideally time-boxed — never an informal "we turned enforcement off for now" with no owner\n' +
      '   or expiry.\n\n' +
      'Q: How would you test a new admission policy before it ever reaches a real cluster?\n' +
      'A: Run it in CI against a corpus of known-good and known-bad manifests with the engine\'s own CLI (Kyverno\n' +
      '   CLI / conftest for OPA), asserting expected allow/deny outcomes — catch regressions before merge, not\n' +
      '   after teams start hitting them live.</code></pre>',
      try: [
        ['📖 OPA Gatekeeper — Audit and Policy Library', 'https://open-policy-agent.github.io/gatekeeper-library/website/', 'o'],
        ['☸️ Ch 16 — admission control as the governance layer of the reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the key difference between what RBAC controls versus what admission control (OPA Gatekeeper/Kyverno) controls?',
      opts: [
        'They are the same mechanism with different names',
        'RBAC governs who can perform which action on which resource type; admission control governs whether the actual content of a specific request is allowed',
        'RBAC only applies to CRDs, admission control only applies to built-in types',
        'Admission control replaces RBAC entirely'],
      ok: 1,
      why: 'RBAC is about authorization (who/what verb); admission control validates/mutates the actual submitted object content before it is persisted.' },
    { q: 'Why should a new cluster-wide policy be rolled out in Audit mode before switching to Enforce?',
      opts: [
        'Audit mode is required by Kubernetes',
        'Enforce mode immediately blocks non-compliant requests cluster-wide with no warning; Audit mode surfaces real violations first so teams can fix them ahead of time',
        'Audit mode is faster to execute',
        'There is no practical difference between the two modes'],
      ok: 1,
      why: 'Jumping straight to Enforce can simultaneously break every non-compliant team\'s deploys; Audit mode gives visibility and a grace period first.' },
    { q: 'A policy engine\'s admission webhook is configured with `failurePolicy: Fail` and the webhook pod crashes. What happens?',
      opts: [
        'Nothing — the cluster continues operating normally',
        'The API server refuses any write it cannot get a decision on from the webhook, turning a webhook outage into a cluster-wide write outage',
        'Only policy-violating requests are affected',
        'The webhook automatically restarts with no impact'],
      ok: 1,
      why: 'With failurePolicy: Fail, an unreachable webhook blocks ALL writes needing its decision, not just non-compliant ones — making the policy engine\'s own availability a production concern.' }
  ]
};
