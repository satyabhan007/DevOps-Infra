/* DevOps-Infra Learn — Part 3 · Chapter 14: Kubernetes Upgrades & Cluster Lifecycle */
window.CH[14] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Kubernetes ships a new minor version roughly every four months, and <b>each one removes APIs</b> that were deprecated a year or more earlier. ' +
      'An upgrade is not optional maintenance you can defer indefinitely — skip enough versions and a routine upgrade becomes "half my manifests use an ' +
      'API that no longer exists," discovered the moment the cluster is upgraded, not before.</p>' +
      '<pre><code>v1.24: Ingress networking.k8s.io/v1beta1 REMOVED (deprecated back in v1.19 — years of warning)\n' +
      'v1.25: PodSecurityPolicy REMOVED entirely (replaced by Pod Security Standards, Ch 11)</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>Building code updates on an old house.</b> Skipping one code update is fine. ' +
      'Skip ten years of them and the plumbing (deprecated APIs) that worked yesterday can be flatly illegal to keep using the day the inspector ' +
      '(the upgraded API server) shows up — and now you are re-plumbing the whole house under emergency pressure instead of one fixture at a time.</p></div>',
      try: [
        ['📖 Kubernetes — Version Skew Policy', 'https://kubernetes.io/releases/version-skew-policy/', 'o'],
        ['☸️ Ch 8 — admission policy can flag deprecated API usage before an upgrade', '#ch8', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># catching deprecated API usage BEFORE upgrading — the standard first step\n' +
      'kubectl-convert   # part of krew; or:\n' +
      'pluto detect-helm -owide   # scans cluster + Helm releases for deprecated/removed APIs\n' +
      'kubent   # "kube-no-trouble" — another standard deprecated-API scanner\n\n' +
      '# the control-plane-first, one-minor-version-at-a-time order\n' +
      'kubeadm upgrade plan\n' +
      'kubeadm upgrade apply v1.29.4        # control plane, one MINOR version at a time — never skip a minor\n' +
      'kubectl drain node-1 --ignore-daemonsets\n' +
      'kubeadm upgrade node                  # then each node, drained first\n' +
      'kubectl uncordon node-1</code></pre>' +
      '<p>Kubernetes only supports upgrading <b>one minor version at a time</b> (1.28 -&gt; 1.29 -&gt; 1.30, never 1.28 -&gt; 1.30 directly) — this is a ' +
      'hard constraint, not a recommendation.</p>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Managed offerings (EKS/GKE/AKS) handle the control plane upgrade for you but ' +
      'NEVER auto-upgrade nodes without opt-in, and never auto-fix deprecated API usage in your own manifests. <b>Pluto</b> and <b>kubent</b> are the ' +
      'standard tools for scanning a cluster/repo for deprecated APIs ahead of any upgrade — run them in CI, not just before a scheduled upgrade window.</p></div>',
      try: [
        ['📖 Pluto — deprecated API scanner', 'https://pluto.docs.fairwinds.com/', 'o'],
        ['📖 Kubernetes — Deprecated API Migration Guide', 'https://kubernetes.io/docs/reference/using-api/deprecation-guide/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A deprecated-API panic discovered mid-upgrade.</b> ' +
      'A platform team upgrades the control plane straight from v1.24 to v1.25 (skipping the recommended incremental path is blocked, but they upgrade ' +
      'once and only THEN discover PodSecurityPolicy was removed) — every workload relying on it fails validation instantly, cluster-wide, during a ' +
      'maintenance window with no rollback plan. Fix: run a deprecated-API scan (Pluto/kubent) against the CURRENT cluster before ANY upgrade is ' +
      'scheduled, fix every hit, and only then proceed — discovering removed APIs live, during the upgrade, is the exact failure this scan prevents.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A node upgrade that drops in-flight connections.</b> ' +
      'A node is upgraded without being drained first — pods are killed abruptly mid-request instead of gracefully rescheduled, and users see real ' +
      'errors during what was supposed to be routine maintenance. Fix: always <code>kubectl drain --ignore-daemonsets</code> BEFORE touching a node ' +
      '(cordons it so no new pods land there, then evicts existing pods with respect for PodDisruptionBudgets), never upgrade or reboot a node with ' +
      'workloads still actively running on it.</p></div>' +
      '<p><b>A version-upgrade runbook, condensed:</b> scan for deprecated APIs -&gt; fix them -&gt; back up etcd -&gt; upgrade control plane one minor ' +
      'at a time -&gt; drain, upgrade, uncordon each node -&gt; verify workload health at each step, never batch multiple minors or skip verification.</p>',
      try: [
        ['📖 Kubernetes — Draining Nodes', 'https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/', 'o'],
        ['☸️ Ch 10 — stateful workloads need extra care during node drains', '#ch10', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Skipping multiple minor versions at        Kubernetes only supports one-minor-at-a-time upgrades — skipping\n' +
      '  once ("we\'ll catch up eventually")         is unsupported and accumulates deprecated-API risk silently.\n' +
      'Upgrading nodes without draining first     Always cordon + drain before touching a node — abrupt kills\n' +
      '                                              drop in-flight requests that a graceful eviction would avoid.\n' +
      'No deprecated-API scan before an           Run Pluto/kubent in CI continuously, not just right before a\n' +
      '  upgrade window                             scheduled upgrade — surprises found the week of an upgrade\n' +
      '                                              window are far more disruptive than caught months earlier.\n' +
      'No etcd backup immediately before a        A failed control-plane upgrade with no recent backup turns a\n' +
      '  control-plane upgrade                      bad upgrade into a full cluster-state-loss incident.\n' +
      'Upgrading dev/staging and prod on the      Prod should upgrade LAST, after real workload validation on\n' +
      '  same day with no soak time between          lower environments has had time to surface real issues.\n' +
      'No documented rollback plan for a          A control-plane upgrade should have a tested path back to the\n' +
      '  control-plane upgrade                      previous version if it goes badly, not just a plan to go forward.</code></pre>' +
      '<p><b>The real test:</b> before a real upgrade, run the deprecated-API scanner against a dry-run of the TARGET version\'s manifests. If it finds ' +
      'zero hits and etcd has a fresh backup, the upgrade is ready; if it finds any hits, fixing them is the actual blocking work, not the upgrade itself.</p>',
      try: [
        ['📖 Kubernetes — Backing up an etcd cluster', 'https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/', 'o'],
        ['☸️ Ch 4 — a GitOps-managed manifest repo makes "fix every deprecated API" a trackable PR, not a scramble', '#ch4', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Expert cluster lifecycle management treats upgrades as <b>routine, continuous, low-drama events</b> rather than rare, high-risk projects — ' +
      'the difference is almost entirely process: continuous deprecated-API scanning in CI (never a pre-upgrade scramble), automated node draining as ' +
      'part of infrastructure-as-code rather than a manual runbook step, and either in-place rolling upgrades or a <b>blue/green cluster migration</b> ' +
      '(stand up the new-version cluster fully, migrate workloads via GitOps/DNS cutover, decommission the old one) for organizations where an in-place ' +
      'upgrade\'s risk is unacceptable.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why can\'t you upgrade a Kubernetes cluster from v1.26 directly to v1.29?\n' +
      "A: Kubernetes only officially supports upgrading one minor version at a time — the control plane's\n" +
      '   version-skew guarantees (and kubeadm itself) assume sequential minor upgrades. Skipping versions is\n' +
      '   unsupported and risks undefined behavior from components with incompatible assumptions about each other.\n\n' +
      'Q: What is the single most important step BEFORE scheduling any cluster upgrade?\n' +
      'A: Scan for deprecated/removed API usage against the TARGET version (Pluto/kubent) and fix every hit —\n' +
      '   discovering a removed API mid-upgrade, cluster-wide, is far more disruptive than fixing it calmly\n' +
      '   ahead of time as a normal PR.\n\n' +
      'Q: Why must a node always be drained before being upgraded or rebooted?\n' +
      "A: Draining cordons the node (no new pods scheduled) and evicts existing pods gracefully, respecting\n" +
      '   PodDisruptionBudgets — an un-drained node upgrade kills pods abruptly, dropping in-flight requests\n' +
      '   instead of letting Kubernetes reschedule them cleanly elsewhere first.\n\n' +
      'Q: When would you choose a blue/green cluster migration over an in-place upgrade?\n' +
      'A: When in-place upgrade risk is unacceptable — e.g. a very old cluster with heavy deprecated-API debt,\n' +
      '   or a compliance requirement for a fully tested new environment before cutover. Stand up the new\n' +
      '   cluster fully, migrate workloads via GitOps/DNS cutover, validate, then decommission the old cluster.\n\n' +
      'Q: How do you keep upgrades "routine" instead of a rare, high-risk event?\n' +
      'A: Continuous deprecated-API scanning in CI (not a pre-upgrade scramble), automated draining/upgrade\n' +
      '   steps as code rather than manual runbooks, and a regular upgrade cadence so the org stays close to\n' +
      '   current versions instead of accumulating multiple versions of technical debt at once.</code></pre>',
      try: [
        ['📖 Kubernetes — kubeadm Upgrade guide', 'https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/', 'o'],
        ['☸️ Ch 16 — upgrade cadence as an operational commitment in the reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why does Kubernetes only support upgrading one minor version at a time (e.g. 1.28 -> 1.29, never 1.28 -> 1.30)?',
      opts: [
        'It is just a suggestion for convenience',
        'The version-skew guarantees between control-plane components and upgrade tooling assume sequential minor upgrades — skipping versions is unsupported and risks undefined behavior',
        'Skipping versions is always faster and equally safe',
        'This restriction only applies to managed cloud offerings'],
      ok: 1,
      why: 'Kubernetes\'s supported upgrade path and version-skew policy are built around sequential one-minor-at-a-time upgrades; skipping is an unsupported configuration.' },
    { q: 'What is the single most important step to take BEFORE scheduling a cluster upgrade?',
      opts: [
        'Immediately start the upgrade to minimize downtime',
        'Scan for deprecated/removed API usage against the target version (e.g. with Pluto or kubent) and fix every finding ahead of time',
        'Disable all admission controllers during the upgrade',
        'Upgrade production first to validate the process'],
      ok: 1,
      why: 'Discovering removed API usage mid-upgrade, cluster-wide, is far more disruptive than finding and fixing it calmly beforehand via a deprecated-API scan.' },
    { q: 'Why must a node always be drained before being upgraded or rebooted?',
      opts: [
        'Draining is optional and has no real effect',
        'Draining cordons the node and gracefully evicts pods respecting PodDisruptionBudgets, avoiding the abrupt pod kills and dropped in-flight requests an un-drained upgrade would cause',
        'Draining only matters for StatefulSets',
        'Draining automatically upgrades the node\'s Kubernetes version'],
      ok: 1,
      why: 'Skipping drain means pods are killed abruptly rather than gracefully rescheduled, causing real user-facing disruption during what should be routine maintenance.' }
  ]
};
