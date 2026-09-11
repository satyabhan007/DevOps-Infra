/* DevOps-Infra Learn — Part 3 · Chapter 4: GitOps — Argo CD & Flux */
window.CH[4] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p><b>GitOps</b> flips the deployment model: instead of a pipeline running <code>kubectl apply</code> against the cluster, a ' +
      '<b>controller inside the cluster</b> continuously watches a Git repo and reconciles the cluster to match it. Git becomes the single source of ' +
      'truth; the controller — Argo CD or Flux — is just another reconcile loop (Ch 2), except what it is converging toward lives in Git, not in a CRD ' +
      'spec someone typed once.</p>' +
      '<pre><code>traditional CI/CD:  pipeline --(push, one-shot)--&gt;  cluster\n' +
      'GitOps:             Git repo &lt;--(continuous pull + diff)--  in-cluster controller</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>An architect\'s blueprint that a building inspector re-checks every day.</b> ' +
      'A one-shot deploy is like building once from a blueprint and never checking again. GitOps is an inspector who re-visits the building daily, ' +
      'compares it to the CURRENT blueprint, and fixes any unauthorized change back to match — drift is caught automatically, not discovered.</p></div>',
      try: [
        ['📖 OpenGitOps — Principles', 'https://opengitops.dev/', 'o'],
        ['☸️ Ch 2 — GitOps controllers are reconcile loops', '#ch2', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code># Argo CD Application — points the controller at a Git path\n' +
      'apiVersion: argoproj.io/v1alpha1\n' +
      'kind: Application\n' +
      'metadata: { name: my-app, namespace: argocd }\n' +
      'spec:\n' +
      '  source: { repoURL: https://github.com/org/repo, path: k8s/prod, targetRevision: main }\n' +
      '  destination: { server: https://kubernetes.default.svc, namespace: my-app }\n' +
      '  syncPolicy:\n' +
      '    automated: { prune: true, selfHeal: true }   # prune = delete removed resources, selfHeal = revert drift\n\n' +
      '# checking sync/health state\n' +
      'argocd app get my-app\n' +
      'kubectl get application my-app -n argocd -o jsonpath="{.status.sync.status}"</code></pre>' +
      '<p>Two states matter, and they are independent: <b>Synced/OutOfSync</b> (does live match Git?) and <b>Healthy/Degraded/Progressing</b> ' +
      '(is the app actually working?). A deploy can be Synced but Degraded — YAML applied fine but the pods are crash-looping.</p>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Argo CD</b> and <b>Flux</b> are both CNCF graduated GitOps controllers — Argo CD ' +
      'ships a UI and an <code>Application</code> CRD-per-app model; Flux is more composable/CLI-first with separate source and reconciliation CRDs. ' +
      'Both support Helm and Kustomize as the rendering layer underneath the Git source.</p></div>',
      try: [
        ['📖 Argo CD — Core Concepts', 'https://argo-cd.readthedocs.io/en/stable/core_concepts/', 'o'],
        ['📖 Flux — Get Started', 'https://fluxcd.io/flux/get-started/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>"selfHeal" reverting an emergency hotfix.</b> ' +
      'An on-call engineer <code>kubectl edit</code>s a Deployment directly during an incident to scale it up — thirty seconds later Argo CD\'s ' +
      '<code>selfHeal</code> reverts it back to what Git says, because Git was never updated. Fix: the emergency change belongs in Git (a fast-path ' +
      'PR or a temporary <code>argocd app set --sync-policy none</code> pause on that one Application) — never fight a GitOps controller with kubectl, ' +
      'it will always win eventually.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>A promotion pipeline that is actually just copy-pasted YAML.</b> ' +
      'A team "promotes" dev to prod by manually copying manifests between directories, and prod silently diverges from what was actually tested in ' +
      'staging. Fix: a real GitOps promotion pipeline promotes an <b>image tag or a Git commit SHA</b> through environment-specific overlay branches/ ' +
      'directories (e.g. via a bot PR bumping the tag in <code>k8s/prod/kustomization.yaml</code>) — the same rendered manifests move forward, only the ' +
      'pointer changes, so what ran in staging is provably what reaches prod.</p></div>' +
      '<p><b>"Who deployed this" audit:</b> with GitOps, the answer is always <code>git log</code> on the environment path — every change is a commit ' +
      'with an author, unlike a pipeline log that can be pruned or a manual <code>kubectl apply</code> that leaves no trace at all.</p>',
      try: [
        ['📖 Argo CD — Automated Sync Policy', 'https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/', 'o'],
        ['☸️ Ch 3 — Helm charts are what GitOps controllers usually render', '#ch3', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                             FIX\n' +
      'kubectl-editing a GitOps-managed          Update Git and let the controller apply it — a self-healing\n' +
      '  resource during an incident               controller will always revert an out-of-band change.\n' +
      'One Application/Kustomization per          Split by environment/blast-radius (e.g. one per namespace\n' +
      '  giant monorepo, all-or-nothing sync        or service) so a bad sync in one area does not block others.\n' +
      'No resource pruning enabled                Without prune:true, resources removed from Git stay running\n' +
      '                                            forever — "deleted" in Git silently means "orphaned" in cluster.\n' +
      'Treating "Synced" as "working"             Synced only means live YAML matches Git. Always check Health\n' +
      '                                            too — a Synced-but-Degraded app applied fine but is broken.\n' +
      'Secrets committed in plaintext to the      Use Sealed Secrets / External Secrets Operator / SOPS — the\n' +
      '  GitOps repo                                whole point of Git-as-truth breaks down if it cannot be public.\n' +
      'Promoting by copy-pasting YAML between     Promote a tag/commit SHA through overlay directories — the\n' +
      '  environment directories by hand            same rendered artifact should move forward, not a rewrite.</code></pre>' +
      '<p><b>The real test:</b> delete a resource GitOps manages with plain <code>kubectl delete</code>. A correctly configured setup recreates it ' +
      'within one reconcile interval with no human involved — if it stays deleted, self-heal or the reconcile loop is not actually wired up.</p>',
      try: [
        ['📖 Argo CD — App of Apps pattern', 'https://argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping/', 'o'],
        ['☸️ Ch 8 — admission control gates what a GitOps sync is even allowed to apply', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>Expert GitOps design is really about where you draw <b>Application/Kustomization boundaries</b>: too coarse and one team\'s bad commit ' +
      'blocks everyone\'s sync; too fine and you drown in controller overhead and cross-app dependency ordering. The other expert-level concern is ' +
      '<b>secrets and mutable state</b> — Git is a poor fit for anything that must not be world-readable or that changes outside a deploy (a database ' +
      'password, a horizontal-pod-autoscaler\'s current replica count) — a mature GitOps setup is explicit about what lives in Git vs. what a ' +
      'reconciler is allowed to leave alone.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the core difference between traditional CI/CD "push" deployment and GitOps "pull" reconciliation?\n' +
      'A: Push: a pipeline runs kubectl apply against the cluster once, from outside, with cluster credentials\n' +
      '   in CI. Pull (GitOps): a controller INSIDE the cluster continuously watches Git and reconciles toward\n' +
      '   it — no external system needs cluster-write credentials, and drift is corrected automatically.\n\n' +
      'Q: An Application shows Synced but Degraded. What does that actually tell you?\n' +
      'A: Synced means the live manifests match what Git says to apply — the sync itself succeeded. Degraded\n' +
      '   means the resulting workload is unhealthy (e.g. crash-looping). These are independent axes; a bad\n' +
      '   image tag can be perfectly "synced" while completely broken.\n\n' +
      'Q: How do you do an emergency scale-up without fighting a self-healing GitOps controller?\n' +
      'A: Either commit the change to Git first (fastest safe path), or explicitly pause that one Application\'s\n' +
      "   auto-sync before making an out-of-band change — never just kubectl edit and hope, selfHeal will win.\n\n" +
      'Q: How should a real promotion pipeline move a change from staging to production under GitOps?\n' +
      'A: Promote an immutable pointer — an image tag or commit SHA — through environment-specific overlay\n' +
      '   directories/branches, typically via an automated PR. The same built artifact moves forward; only the\n' +
      '   reference to it changes, so prod runs provably the same thing staging tested.\n\n' +
      'Q: Why is Git a poor fit for secrets, and what is the standard fix?\n' +
      "A: Git history is effectively permanent and often broadly readable — committing plaintext secrets leaks\n" +
      '   them forever, even if later removed. Standard fix: External Secrets Operator (pulls from a real\n' +
      '   secrets manager) or Sealed Secrets/SOPS (encrypts the secret so only the cluster can decrypt it).</code></pre>',
      try: [
        ['📖 Flux — Image Update Automation (tag promotion)', 'https://fluxcd.io/flux/guides/image-update/', 'o'],
        ['☸️ Ch 16 — GitOps as the delivery layer of the reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the fundamental mechanism difference between traditional CI/CD deployment and GitOps?',
      opts: [
        'GitOps does not use Kubernetes',
        'GitOps uses an in-cluster controller that continuously pulls from and reconciles against Git, instead of an external pipeline pushing changes once',
        'GitOps is only for static websites',
        'There is no real difference, just different YAML syntax'],
      ok: 1,
      why: 'GitOps inverts the model to continuous pull-based reconciliation from Git as the source of truth, run by a controller inside the cluster.' },
    { q: 'An Argo CD Application shows status "Synced" but health "Degraded." What does this mean?',
      opts: [
        'The sync itself failed',
        'The live manifests match what Git specifies, but the resulting workload is unhealthy (e.g. crash-looping) — these are independent states',
        'Argo CD is broken and needs a restart',
        'The Git repository is unreachable'],
      ok: 1,
      why: 'Synced/OutOfSync tracks whether live state matches Git; Healthy/Degraded tracks whether the deployed workload is actually functioning — they are independent axes.' },
    { q: 'Why does `kubectl edit`-ing a resource managed by a self-healing GitOps controller usually fail to stick?',
      opts: [
        'kubectl edit is disabled entirely in GitOps clusters',
        'The controller detects the drift from Git and reverts the manual change on its next reconcile — Git must be updated instead',
        'It always succeeds permanently',
        'It requires special GitOps-aware kubectl plugins'],
      ok: 1,
      why: 'With selfHeal enabled, the GitOps controller treats any out-of-band change as drift and reverts it to match Git on the next reconcile.' }
  ]
};
