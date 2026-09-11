/* DevOps-Infra Learn — Part 2 · Chapter 2: Remote State, Locking & Workspaces */
window.CH[2] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Terraform tracks what it created in a <b>state file</b> — a JSON map of "this resource address = this real-world ID". If that file ' +
      'lives on your laptop, only you can apply, and if your laptop dies so does the team\'s only record of what exists. Worse: if two people ' +
      'run <code>apply</code> at the same time against the same state, they can corrupt it.</p>' +
      '<pre><code>local state (terraform.tfstate on your laptop)   →   remote state (S3/GCS/Azure Blob/TF Cloud)\n' +
      '  one person can apply, no history, no lock            everyone applies against the same source of truth, locked</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A shared Google Doc vs. emailing a Word file around.</b> ' +
      'Local state is the Word file — whoever has the latest copy might not be you, and two people editing their own copy at once means someone\'s ' +
      'changes vanish. Remote state with locking is the Google Doc: one shared source of truth, and it politely tells the second editor "someone is ' +
      'already in here" instead of letting them stomp on each other.</p></div>',
      try: [
        ['📖 Terraform — state overview', 'https://developer.hashicorp.com/terraform/language/state', 'o'],
        ['🧩 Ch 1 — modules & composition', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>A remote backend is configured once, per root module, and locking is enabled by the backend itself:</p>' +
      '<pre><code># backend.tf — root module only (modules never configure a backend)\n' +
      'terraform {\n' +
      '  backend "s3" {\n' +
      '    bucket         = "acme-tfstate-prod"\n' +
      '    key            = "networking/vpc/terraform.tfstate"\n' +
      '    region         = "us-east-1"\n' +
      '    dynamodb_table = "acme-tf-locks"   # legacy lock table (pre-1.10)\n' +
      '    encrypt        = true\n' +
      '  }\n' +
      '}\n\n' +
      '# workspaces — one state file per named workspace, SAME backend/key prefix\n' +
      '$ terraform workspace new staging\n' +
      '$ terraform workspace select staging\n' +
      '$ terraform apply   # writes to .../env:/staging/terraform.tfstate</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>As of Terraform 1.10+, <b>S3 supports native state locking</b> ' +
      '(no DynamoDB table needed) via <code>use_lockfile = true</code> on the S3 backend — the DynamoDB-table pattern is still everywhere in ' +
      'production but is now legacy. For teams who do not want to run their own backend infra at all, <b>HCP Terraform / Terraform Cloud</b> gives ' +
      'you remote state, locking, and run history managed for you.</p></div>',
      try: [
        ['📖 Terraform — S3 backend (incl. native locking)', 'https://developer.hashicorp.com/terraform/language/backend/s3', 'o'],
        ['📖 Terraform — workspaces', 'https://developer.hashicorp.com/terraform/language/state/workspaces', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The double-apply that corrupted state.</b> ' +
      'Two engineers, no locking configured, both run <code>terraform apply</code> within a minute of each other against the same local-turned-shared ' +
      'state file on a network drive. Both read the same "before" state, both write their own "after" state — the second write silently clobbers the ' +
      'first engineer\'s newly-created resources out of the state file. Terraform now thinks those resources do not exist; the next ' +
      '<code>apply</code> tries to recreate them and collides with the real, already-existing cloud resources. Fix: a locking backend (S3+DynamoDB, ' +
      'S3 native lockfile, or TF Cloud) — the second <code>apply</code> gets "Error: Error acquiring the state lock" and simply waits its turn.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The workspace mix-up.</b> ' +
      'A team uses <code>terraform workspace select prod</code> / <code>select dev</code> to switch environments from one codebase. An engineer\'s ' +
      'shell script runs a nightly job but forgets to <code>select</code> first — it silently applies against whatever workspace was last active on ' +
      'that CI runner, which happened to be <code>prod</code>, using dev-sized variables. Fix: never rely on workspace selection being "sticky" in ' +
      'CI — pass <code>-var-file</code> AND assert the workspace name in the pipeline (<code>terraform workspace show</code> checked against an ' +
      'expected value before any apply), or better, use separate state files/directories per environment instead of workspaces for anything ' +
      'blast-radius-sensitive.</p></div>',
      try: [
        ['📖 Terraform — state locking', 'https://developer.hashicorp.com/terraform/language/state/locking', 'o'],
        ['🌐 Ch 5 — multi-environment patterns', '#ch5', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                            FIX\n' +
      'terraform.tfstate committed to git        Never. It often contains secrets in plaintext and merge-conflicts\n' +
      '                                          on every concurrent apply. Add it to .gitignore, use a backend.\n' +
      'No locking configured                     Enable DynamoDB locking or S3 native use_lockfile — a lock is\n' +
      '                                          cheap insurance against a corrupted state file.\n' +
      'One state file for the whole org           Split by blast radius (networking / per-service / per-env) so a\n' +
      '                                          bad apply in one area cannot touch or lock out an unrelated one.\n' +
      'Workspaces used for prod vs dev            Workspaces share the same backend/config — a typo in the selected\n' +
      '                                          workspace applies prod-shaped code with dev variables. Prefer\n' +
      '                                          separate root modules/state per environment for anything critical.\n' +
      'Manual state edits via a text editor       Use `terraform state mv/rm/import` (or `moved` blocks) — hand-\n' +
      '                                          editing JSON breaks the resource-address schema silently.\n' +
      'No state file encryption at rest           Set `encrypt = true` (S3) or rely on the backend\'s default\n' +
      '                                          encryption — state can contain passwords, keys, connection strings.\n' +
      'CI runner has stale local .terraform/      Re-run `terraform init` on every CI job; do not cache the backend\n' +
      '  cache across unrelated pipelines          config/lock state between pipelines for different root modules.</code></pre>' +
      '<p><b>The real test:</b> can two engineers safely run <code>apply</code> against the same infrastructure at the same moment — one waits, ' +
      'nobody\'s changes vanish, and it is obvious from the backend config alone which state file any given apply will touch?</p>',
      try: [
        ['📖 Terraform — state: sensitive data', 'https://developer.hashicorp.com/terraform/language/state/sensitive-data', 'o'],
        ['🔑 Ch 7 — secrets & sensitive data in IaC', '#ch7', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, state design is a <b>blast-radius design</b> problem, not a storage-backend choice. The question is never "where does ' +
      'the JSON live" — it is "if this state file gets locked, corrupted, or applied by the wrong person, what is the smallest set of resources that ' +
      'can go wrong?" Split state along team and environment boundaries before you split it along technical convenience.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why not just commit terraform.tfstate to git?\n' +
      'A: State often contains secrets in plaintext (DB passwords, TLS keys as resource attributes) and two\n' +
      '   concurrent applies produce an unresolvable merge conflict — git has no locking primitive to serialize\n' +
      '   applies the way a real backend does.\n\n' +
      'Q: What does a state lock actually prevent?\n' +
      'A: Two concurrent `apply` (or `plan` in some backends) operations from reading the same "before" state and\n' +
      '   writing conflicting "after" states — the second run waits or fails instead of silently overwriting the\n' +
      '   first run\'s changes.\n\n' +
      'Q: Workspaces or separate directories for dev/staging/prod — which and why?\n' +
      'A: Workspaces are convenient for near-identical, low-risk environments sharing one config. For prod\n' +
      '   specifically, separate root modules/state (and often separate backend credentials) are safer — a\n' +
      "   workspace-selection mistake can't apply prod-shaped changes to the wrong account when there's no\n" +
      '   shared codepath to mis-select in the first place.\n\n' +
      'Q: How do you split one giant state file into several smaller ones without downtime?\n' +
      'A: `terraform state mv` (or a `moved` block plus a target backend) to migrate specific resource addresses\n' +
      '   into a new state/backend, run `plan` on both the source and destination afterward to confirm zero\n' +
      '   diffs, then update backend configs. Never delete-and-reimport as the first move.\n\n' +
      'Q: What is state drift with respect to locking, specifically — can a lock prevent drift?\n' +
      'A: No — a lock only serializes Terraform-initiated writes to the state file. It does nothing about someone\n' +
      "   changing the real resource directly in the cloud console; that's drift, a separate problem (see Ch 3).</code></pre>",
      try: [
        ['📖 HashiCorp — remote state', 'https://developer.hashicorp.com/terraform/language/state/remote', 'o'],
        ['🌊 Ch 3 — managing drift at scale', '#ch3', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the primary risk of leaving Terraform state as a local file with no remote backend?',
      opts: [
        'Terraform runs slower with local state',
        'Only one machine has the source of truth, there is no locking, and concurrent applies can corrupt or overwrite each other\'s changes',
        'Local state files cannot store outputs',
        'Terraform refuses to plan without a remote backend'],
      ok: 1,
      why: 'Local state means no shared source of truth and no locking primitive — two people applying near-simultaneously can silently clobber each other\'s state.' },
    { q: 'What does a state lock (e.g. via DynamoDB or S3 native locking) actually protect against?',
      opts: [
        'It prevents anyone from ever changing resources in the cloud console',
        'Two concurrent Terraform apply operations writing conflicting versions of the state file at the same time',
        'It encrypts the state file at rest',
        'It validates that .tf files are syntactically correct'],
      ok: 1,
      why: 'A lock serializes Terraform-initiated writes so a second apply waits instead of racing the first — it says nothing about out-of-band console changes (that\'s drift).' },
    { q: 'Why might a team prefer separate root modules/state per environment over Terraform workspaces for production?',
      opts: [
        'Workspaces are deprecated and no longer supported',
        'Workspaces share the same backend/codepath, so a mis-selected workspace can silently apply prod-shaped config against the wrong environment; separate state removes that shared failure mode',
        'Workspaces cannot store more than one resource',
        'Workspaces do not support variables'],
      ok: 1,
      why: 'Because workspaces share one codebase and backend config, a selection mistake is possible; fully separate root modules/state for prod eliminate that shared codepath entirely.' }
  ]
};
