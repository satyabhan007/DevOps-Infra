/* DevOps-Infra Learn — Part 2 · Chapter 8: CI/CD for Infrastructure */
window.CH[8] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Application code gets a pipeline: PR opens, tests run, a human reviews, merge triggers deploy. Infrastructure code, for a surprisingly long ' +
      'time at most companies, gets: someone runs <code>terraform apply</code> from their own laptop, using whatever local state and provider version ' +
      'happened to be installed. CI/CD for infrastructure means the plan and apply for infra get the same rigor as a code deploy.</p>' +
      '<pre><code>laptop apply:  "works on my machine", whoever has credentials can apply directly, no review of the ACTUAL plan\n' +
      'CI/CD:         PR opens → plan runs, posted for review → human approves the PLAN → merge triggers apply</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A building permit review vs. just start pouring concrete.</b> ' +
      'A permit process reviews the actual blueprint before anything is built and requires sign-off. Applying straight from a laptop is starting ' +
      'construction based on whatever plan happens to be in the contractor\'s head that morning — nobody else ever saw or approved it.</p></div>',
      try: [
        ['📖 HashiCorp — Terraform in CI/CD', 'https://developer.hashicorp.com/terraform/tutorials/automation/automate-terraform', 'o'],
        ['🔒 Ch 2 — remote state & locking', '#ch2', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>The standard pipeline shape — plan on PR, apply on merge, with a human gate in between:</p>' +
      '<pre><code># .github/workflows/terraform.yml (shape, not exhaustive)\n' +
      'on: [pull_request, push]\n' +
      'jobs:\n' +
      '  plan:\n' +
      '    if: github.event_name == \'pull_request\'\n' +
      '    steps:\n' +
      '      - run: terraform init\n' +
      '      - run: terraform plan -out=tfplan\n' +
      '      - run: terraform show -json tfplan > plan.json   # feeds policy-as-code (Ch 4)\n' +
      '      - uses: actions/github-script  # post plan as a PR comment for human review\n\n' +
      '  apply:\n' +
      '    if: github.ref == \'refs/heads/main\'   # only after merge\n' +
      '    environment: production                # requires a configured GitHub environment approval\n' +
      '    steps:\n' +
      '      - run: terraform init\n' +
      '      - run: terraform apply -auto-approve tfplan   # applies the EXACT plan reviewed, not a fresh one</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Apply the <b>saved plan artifact</b> from the PR (<code>-out=tfplan</code>), not ' +
      'a freshly regenerated plan at apply time — infrastructure or a dependency could have changed between review and merge, and applying a ' +
      'different plan than what was reviewed defeats the review entirely. <b>Atlantis</b> and <b>HCP Terraform</b> are the standard off-the-shelf ' +
      'tools that implement this plan/approve/apply pattern without hand-rolling it in raw CI YAML.</p></div>',
      try: [
        ['📖 Atlantis — Terraform pull request automation', 'https://www.runatlantis.io/', 'o'],
        ['📖 HCP Terraform — run workflow', 'https://developer.hashicorp.com/terraform/cloud-docs/run/ui', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The apply that was not the plan anyone reviewed.</b> ' +
      'A team\'s pipeline runs <code>terraform plan</code> in the PR for review, then a SEPARATE, fresh <code>terraform plan</code> followed by ' +
      '<code>apply</code> after merge — not the same saved plan. Between PR approval and merge, another team\'s unrelated change to a shared module\'s ' +
      'default value lands, and the post-merge plan differs from what was reviewed. The apply proceeds anyway since it was "just a plan" step that ' +
      'nobody re-reviewed, and an unexpected resource gets recreated in prod. Fix: save the plan as a CI artifact at PR time (' +
      '<code>terraform plan -out=tfplan</code>) and apply that EXACT artifact after merge — if it is stale (the underlying state changed), re-plan and ' +
      'route back through review rather than silently applying something new.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The pipeline credential with god-mode access.</b> ' +
      'A CI service account used for <code>terraform apply</code> has full <code>AdministratorAccess</code> on the AWS account "to avoid permission ' +
      'errors blocking pipelines." A compromised CI secret (leaked through a misconfigured third-party action) gives an attacker the same god-mode ' +
      'access to production, not just the ability to run Terraform. Fix: scope the CI credential to exactly what Terraform in this pipeline needs ' +
      '(least privilege, ideally OIDC-federated and short-lived per Ch 7), and use a break-glass, separately-audited credential for the rare case ' +
      'that genuinely needs broader access.</p></div>',
      try: [
        ['🔑 Ch 7 — secrets & sensitive data in IaC', '#ch7', 'o'],
        ['📖 GitHub — OIDC for cloud providers', 'https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Applying straight from a laptop             Every apply goes through CI, using the same plan a human\n' +
      '                                            approved — a laptop apply cannot be reviewed or audited.\n' +
      'Fresh plan generated after merge,           Save the PR-time plan as an artifact (-out=tfplan) and apply\n' +
      '  different from the one reviewed            THAT — a changed plan after approval should trigger re-review.\n' +
      'One CI credential with admin access          Scope pipeline credentials to least privilege, ideally short-\n' +
      '  for every pipeline                          lived/OIDC-federated — a leaked CI secret should not mean\n' +
      '                                            full account compromise.\n' +
      'No approval gate before prod apply           Require a human (or a policy-as-code pass, Ch 4) approval\n' +
      '                                            step between plan and apply for anything prod-bound.\n' +
      'Pipeline has no idea if state is locked      Surface lock-acquisition failures clearly in CI output — a\n' +
      '  and just hangs or fails opaquely             hung pipeline step with no explanation wastes an on-call hour.\n' +
      'Rollback means "figure it out manually"      Plan for rollback explicitly: keep the previous plan artifact/\n' +
      '                                            module version pinned so `apply` of the prior known-good state\n' +
      '                                            is a defined, tested pipeline action, not an improvisation.</code></pre>' +
      '<p><b>The real test:</b> if you had to prove, after the fact, exactly who approved a specific production infrastructure change and what plan ' +
      'they actually looked at — can your pipeline produce that audit trail today?</p>',
      try: [
        ['📖 HashiCorp — recommended CI/CD workflow', 'https://developer.hashicorp.com/terraform/tutorials/automation/automate-terraform', 'o'],
        ['🧑‍🤝‍🧑 Ch 13 — multi-team ownership boundaries', '#ch13', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, infra CI/CD is an <b>audit trail and blast-radius control system</b> as much as an automation convenience: the goal is ' +
      'that every production change has a reviewed plan, a scoped credential that could not have done more damage than intended, and a defined ' +
      'rollback path — before automation ever entered the picture, none of those three were guaranteed by a laptop apply.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why apply a SAVED plan artifact from the PR instead of re-planning right before apply?\n' +
      'A: Infrastructure or shared modules can change between PR approval and merge. Applying a freshly generated\n' +
      "   plan means the apply may not match what a human actually reviewed — the review's guarantee is only as\n" +
      '   good as "this exact plan was approved," which requires applying that exact artifact.\n\n' +
      'Q: Why should the CI service account running `apply` NOT have broad admin access?\n' +
      'A: Least privilege limits blast radius if the CI secret leaks — a scoped credential means a compromised\n' +
      '   pipeline can only do what Terraform in that pipeline legitimately needs to do, not everything in the\n' +
      '   account.\n\n' +
      'Q: What is the role of a human approval gate between plan and apply for production changes?\n' +
      'A: It creates an accountable checkpoint and audit trail — someone specific reviewed this specific plan\n' +
      '   and approved it — which policy-as-code (Ch 4) complements but does not fully replace for high-risk\n' +
      '   changes that need human judgment, not just rule-checking.\n\n' +
      'Q: How should a pipeline handle a failed state-lock acquisition?\n' +
      'A: Surface it clearly (which run holds the lock, since when) rather than hanging or failing opaquely —\n' +
      '   an on-call engineer needs to immediately know whether to wait, investigate a stuck prior run, or force-\n' +
      '   unlock deliberately.\n\n' +
      'Q: What does "plan for rollback" mean concretely in an infra CI/CD pipeline?\n' +
      'A: Keeping the previous known-good plan/module version reachable and applying it is a DEFINED, tested\n' +
      '   pipeline action (not manual improvisation under pressure) — the same discipline as an app deploy\n' +
      "   rollback, applied to infrastructure changes.</code></pre>",
      try: [
        ['📖 HashiCorp — Sentinel/OPA in the run pipeline', 'https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement', 'o'],
        ['🩹 Ch 9 — import, refactor & state surgery', '#ch9', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why should a CI/CD pipeline apply the SAME saved plan artifact from the PR, rather than generating a fresh plan right before apply?',
      opts: [
        'Saved plans apply faster than fresh ones',
        'Infrastructure or shared modules can change between PR approval and merge, so a fresh plan may differ from what a human actually reviewed and approved',
        'Terraform cannot generate a plan outside of a pull request',
        'It reduces the number of API calls to the state backend'],
      ok: 1,
      why: 'Reviewing a plan only provides a real guarantee if the exact plan reviewed is what gets applied — a re-generated plan could differ from what was approved.' },
    { q: 'Why should the CI credential used for `terraform apply` be scoped to least privilege rather than given broad admin access?',
      opts: [
        'Broad access makes Terraform run faster',
        'It limits blast radius if the CI secret leaks — a compromised pipeline should only be able to do what Terraform legitimately needs, not everything in the account',
        'Terraform requires admin access to function at all',
        'Least privilege is only relevant for application code, not infrastructure code'],
      ok: 1,
      why: 'A leaked, over-privileged CI credential grants an attacker far more than infrastructure-management access; least privilege caps the damage possible.' },
    { q: 'What is a defined rollback path in infra CI/CD, and why does it matter?',
      opts: [
        'A manual, improvised process figured out during the incident',
        'Keeping a prior known-good plan/module version reachable so applying it is a tested, defined pipeline action — the same discipline as an app deploy rollback',
        'Deleting the state file and starting over',
        'It does not matter since Terraform changes are always safely reversible automatically'],
      ok: 1,
      why: 'Without a defined rollback action, recovering from a bad infra change under pressure becomes improvisation, increasing risk and time-to-recovery.' }
  ]
};
