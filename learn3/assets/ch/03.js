/* DevOps-Infra Learn — Part 3 · Chapter 3: Helm at Scale */
window.CH[3] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p><b>Helm</b> packages a set of Kubernetes manifests into a reusable, versioned unit — a <b>chart</b> — with a single knob file, ' +
      '<code>values.yaml</code>, that customizes it per environment. "It works on my cluster" is a pile of YAML you hand-edited; a reusable chart is ' +
      'the same YAML with the environment-specific bits templated out, installable with one command anywhere.</p>' +
      '<pre><code>helm install my-app ./chart --values prod-values.yaml\n' +
      'helm upgrade my-app ./chart --values prod-values.yaml   # same chart, new values or new version</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A furniture kit vs. a custom-built shelf.</b> A custom-built shelf works great ' +
      'once, in one room. A flat-pack kit (the chart) plus a "options sheet" (values.yaml — color, width, shelf count) can be assembled the same way ' +
      'in any room, by anyone, repeatably — and re-assembled identically if it breaks.</p></div>',
      try: [
        ['📖 Helm — Quickstart Guide', 'https://helm.sh/docs/intro/quickstart/', 'o'],
        ['☸️ Ch 1 — CRDs are frequently installed as part of a chart', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># chart layout\n' +
      'mychart/\n' +
      '  Chart.yaml          # name, version, appVersion\n' +
      '  values.yaml         # defaults — every templated value has one here\n' +
      '  templates/\n' +
      '    deployment.yaml   # Go template referencing .Values.*\n' +
      '    _helpers.tpl      # shared named templates (labels, fullname)\n\n' +
      '# templates/deployment.yaml (excerpt)\n' +
      'spec:\n' +
      '  replicas: {{ .Values.replicaCount }}\n' +
      '  template:\n' +
      '    spec:\n' +
      '      containers:\n' +
      '        - image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"\n\n' +
      '# per-environment override\n' +
      'helm upgrade my-app ./mychart -f values.yaml -f values-prod.yaml --set replicaCount=5</code></pre>' +
      '<p><code>helm template</code> renders the final YAML locally with no cluster contact — always run it before <code>upgrade</code> on anything ' +
      'unfamiliar. <code>helm diff</code> (plugin) shows exactly what an upgrade will change against the live cluster.</p>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Helm</b> is the CNCF-graduated standard for Kubernetes package management; ' +
      '<b>Artifact Hub</b> is the de-facto public registry for finding maintained charts (nginx-ingress, cert-manager, Prometheus) before writing your ' +
      'own. OCI registries (<code>helm push</code> to an OCI-compliant registry) are now the standard chart distribution mechanism, replacing the old ' +
      'chart-repository index format.</p></div>',
      try: [
        ['📖 Helm — Chart Template Guide', 'https://helm.sh/docs/chart_template_guide/getting_started/', 'o'],
        ['📖 Artifact Hub', 'https://artifacthub.io/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>A failed helm upgrade leaves the release stuck.</b> ' +
      'An upgrade fails partway (a bad image tag causes a readiness probe failure, and Helm\'s own timeout expires) and the release is left in ' +
      '<code>pending-upgrade</code> state — the next <code>helm upgrade</code> refuses to run. Fix: <code>helm rollback my-app &lt;prior-revision&gt;</code> ' +
      'returns it to the last good state; <code>helm history my-app</code> shows every revision to pick the right one. Always set ' +
      '<code>--atomic</code> on upgrades so a failed release auto-rolls-back instead of leaving this half-applied stuck state.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The chart that "works" but silently drops a field on upgrade.</b> ' +
      'A team hand-edits a resource that Helm manages (patches a Service directly with kubectl) to fix an urgent issue; the next ' +
      '<code>helm upgrade</code> silently reverts the hand-edit because Helm reconciles the live object back to exactly what the chart+values ' +
      'render. Lesson: never hand-edit a Helm-managed resource — change values.yaml or the template, or the next deploy erases the fix without warning.</p></div>' +
      '<p><b>Templating for 3 environments cleanly:</b> keep one <code>values.yaml</code> with sane defaults, then a thin ' +
      '<code>values-{dev,staging,prod}.yaml</code> per environment overriding only what differs (replica count, resource limits, ingress host) — ' +
      'never duplicate the whole chart per environment.</p>',
      try: [
        ['📖 Helm — Chart Best Practices Guide', 'https://helm.sh/docs/chart_best_practices/', 'o'],
        ['☸️ Ch 4 — GitOps tools like Argo CD render Helm charts declaratively', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                             FIX\n' +
      'Hand-editing a Helm-managed live object    Change values.yaml/templates instead — Helm will silently\n' +
      '                                            revert manual edits on the next upgrade.\n' +
      'One giant values.yaml with everything       Layer defaults + a thin per-environment override file;\n' +
      '  duplicated per environment                 duplicated full copies drift and disagree over time.\n' +
      'No --atomic / --wait on upgrades             A failed upgrade leaves a half-applied release stuck in\n' +
      '                                            pending-upgrade; --atomic auto-rolls-back on failure.\n' +
      'Templating secrets directly into values.yaml A committed values.yaml with plaintext secrets is a leak;\n' +
      '  in plaintext                                 use Sealed Secrets, External Secrets Operator, or SOPS.\n' +
      'Skipping "helm template" / "helm diff"       Always dry-render or diff before applying an unfamiliar\n' +
      '  before an unfamiliar upgrade                 upgrade — surprises in rendered YAML are cheap to catch.\n' +
      'A chart with no resource requests/limits     Ship sane defaults in values.yaml; a chart installed by 50\n' +
      '  set in defaults                              teams with no defaults means 50 unbounded workloads.</code></pre>' +
      '<p><b>The real test:</b> can a teammate who has never seen your chart install it in a fresh namespace with one <code>-f</code> override file ' +
      'and get a working, correctly-sized deployment? If not, too much is assumed rather than templated or defaulted.</p>',
      try: [
        ['📖 Helm — Values Files', 'https://helm.sh/docs/chart_template_guide/values_files/', 'o'],
        ['☸️ Ch 8 — admission policy can enforce "no chart installs without limits"', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At scale, Helm charts are a platform team\'s API surface to the rest of the org: <code>values.yaml</code> is the contract, and every ' +
      'field you expose is a promise to keep working. Expert chart design means aggressively minimizing that surface — sane, safe defaults for ' +
      'everything, exposing only what teams actually need to vary — and treating chart version bumps with the same discipline as an API version bump, ' +
      'because dozens of consuming teams may pin to an old chart version indefinitely.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: A "helm upgrade" fails and the release is stuck in pending-upgrade. What do you do, and how do you\n' +
      '   prevent it next time?\n' +
      'A: `helm rollback` to the last good revision to unstick it now. Prevent it with `--atomic` (auto-rollback\n' +
      '   on failure) and `--wait` (block until resources are actually healthy) on every upgrade going forward.\n\n' +
      'Q: Why should you never hand-edit a live resource that Helm manages?\n' +
      "A: Helm's job is to make the live object match the rendered chart+values exactly. A manual kubectl edit\n" +
      '   is not tracked anywhere in the chart, so the next helm upgrade silently reverts it with no warning —\n' +
      "   fix the root cause in values.yaml or the template instead.\n\n" +
      'Q: How do you avoid duplicating an entire chart per environment (dev/staging/prod)?\n' +
      'A: One base values.yaml with safe defaults, then a thin values-&lt;env&gt;.yaml per environment overriding\n' +
      '   only what differs (replicas, limits, hostnames) — layered with -f, not copy-pasted wholesale.\n\n' +
      'Q: How should secrets be handled in a Helm chart meant for a Git repo?\n' +
      'A: Never as plaintext in values.yaml committed to Git. Use External Secrets Operator, Sealed Secrets, or\n' +
      '   SOPS-encrypted values so the chart references a secret name, not the secret\'s contents.\n\n' +
      'Q: What makes a chart "reusable" across many consuming teams versus just "works for one team"?\n' +
      'A: A minimal, well-defaulted values.yaml surface, semantic versioning on chart changes so consumers can\n' +
      "   pin safely, and templates that don't assume any one team's specific naming/namespace conventions.</code></pre>",
      try: [
        ['📖 Helm — Chart Versioning (SemVer)', 'https://helm.sh/docs/topics/charts/#charts-and-versioning', 'o'],
        ['☸️ Ch 16 — Helm as one layer of the platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'A teammate hand-edits a Service that Helm manages to fix an urgent issue. What happens on the next `helm upgrade`?',
      opts: [
        'Helm detects and preserves the manual change automatically',
        'Helm silently reverts the manual edit, because it reconciles the live object back to exactly what the chart + values render',
        'The upgrade fails with a conflict error',
        'Nothing — Helm never touches resources after install'],
      ok: 1,
      why: 'Helm treats the chart + values as the source of truth; hand-edits to a managed live object get overwritten with no warning on the next upgrade.' },
    { q: 'What does `--atomic` do on a `helm upgrade`?',
      opts: [
        'Speeds up the upgrade',
        'Automatically rolls back to the previous release if the upgrade fails, avoiding a stuck pending-upgrade state',
        'Encrypts the release secrets',
        'Skips running any hooks'],
      ok: 1,
      why: 'Without --atomic, a failed upgrade can leave the release stuck in pending-upgrade, blocking further helm upgrade calls until manually rolled back.' },
    { q: 'For a chart deployed to dev, staging, and prod, what is the recommended values-file strategy?',
      opts: [
        'Three fully separate copies of the whole chart, one per environment',
        'A base values.yaml with safe defaults, layered with a thin values-&lt;env&gt;.yaml overriding only what differs per environment',
        'One values.yaml with every environment\'s settings behind if/else logic in every template',
        'Hardcode environment differences directly into templates'],
      ok: 1,
      why: 'Layering a small per-environment override file over shared defaults avoids duplication and drift while keeping environment-specific values explicit.' }
  ]
};
