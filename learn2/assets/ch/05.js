/* DevOps-Infra Learn — Part 2 · Chapter 5: Multi-Environment & Multi-Cloud Patterns */
window.CH[5] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Every real system needs at least a <code>dev</code> to break things in and a <code>prod</code> to not break — usually a ' +
      '<code>staging</code> in between too. The question is never "should we have environments" but "how do we get the SAME code running in all of ' +
      'them, with only the sizes and secrets different, instead of three codebases slowly drifting apart"?</p>' +
      '<pre><code>dev:      1 small instance, relaxed policy, cheap\n' +
      'staging:  mirrors prod shape at smaller scale, real policy gates\n' +
      'prod:     full scale, strict policy, every change reviewed\n' +
      '  — same modules, same code path, only variables differ</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>One house blueprint, built at three sizes.</b> ' +
      'A model home, a full-size show home, and the real house you live in use the same blueprint with different scale factors — not three ' +
      'independently-drawn blueprints that a change to the plumbing has to be manually re-applied to three times.</p></div>',
      try: [
        ['📖 Terraform — a recommended structure', 'https://developer.hashicorp.com/terraform/language/modules/develop/structure', 'o'],
        ['🧩 Ch 1 — modules & composition', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>The standard pattern is thin per-environment root modules calling the SAME shared modules with different <code>.tfvars</code>:</p>' +
      '<pre><code>envs/\n' +
      '  dev/main.tf        → module "app" { source = "../../modules/app"  instance_count = 1 }\n' +
      '  staging/main.tf    → module "app" { source = "../../modules/app"  instance_count = 2 }\n' +
      '  prod/main.tf       → module "app" { source = "../../modules/app"  instance_count = 6 }\n\n' +
      '# each envs/*/ has ITS OWN backend config = its own state file = its own blast radius\n' +
      '$ terraform -chdir=envs/staging apply -var-file=staging.tfvars\n\n' +
      '# multi-cloud: abstract the difference behind a module interface, not scattered if/else\n' +
      'module "compute" {\n' +
      '  source = var.cloud == "aws" ? "./modules/compute-aws" : "./modules/compute-gcp"\n' +
      '}</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Directories-per-environment</b> (not workspaces) is the standard for ' +
      'anything where prod isolation matters — each environment gets its own state, often its own cloud account/subscription, and CI applies ' +
      'environments in sequence (dev → staging → prod) so a change is proven before it reaches production. See the ' +
      '<b>HashiCorp recommended repository structure</b> for the canonical layout.</p></div>',
      try: [
        ['📖 Terraform — recommended patterns', 'https://developer.hashicorp.com/terraform/tutorials/modules/pattern-module-collection', 'o'],
        ['🔒 Ch 2 — remote state & workspaces', '#ch2', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The environments that quietly diverged.</b> ' +
      'A team starts with identical dev/staging/prod modules, but over 18 months prod gets one-off patches applied directly (a manually added IAM ' +
      'policy, an extra subnet) that never make it back into the shared module or staging. When a real change is finally tested in staging, it passes ' +
      '— and then fails in prod because prod has silently diverged from what staging represents, defeating the entire point of having a staging ' +
      'environment. Fix: EVERY change, including one-off prod patches, goes through the same module/PR path across all environments — if prod needs ' +
      'something staging does not have, that difference belongs in a variable, not an out-of-band edit.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The multi-cloud abstraction that leaked everywhere.</b> ' +
      'A team builds a "cloud-agnostic" module meant to deploy identically to AWS or GCP, hiding provider differences behind a generic interface. Six ' +
      'months in, half the module is <code>if var.cloud == "aws"</code> branches because load balancer health-check semantics, IAM models, and network ' +
      'ACLs are genuinely different between clouds — the abstraction adds a layer of indirection without actually removing the complexity. Fix: ' +
      'abstract only where the underlying concepts really are equivalent (compute instance, object storage); accept and clearly separate ' +
      'cloud-specific modules where they are not — false uniformity is worse than an honest fork.</p></div>',
      try: [
        ['📖 Terraform — testing your module structure', 'https://developer.hashicorp.com/terraform/language/modules/develop/structure', 'o'],
        ['🌊 Ch 3 — managing drift at scale', '#ch3', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                             FIX\n' +
      'Three hand-copied environment codebases    One set of shared modules, thin per-env root modules that only\n' +
      '  that quietly drift apart                  differ in variables — a diff between envs should be a var diff.\n' +
      'Prod gets manual "just this once" fixes     Every change, including urgent prod fixes, goes back through the\n' +
      '  outside the normal module/PR path          same module path so staging keeps meaning something.\n' +
      'One shared state file for all environments  Separate state (and ideally separate cloud accounts) per\n' +
      '                                            environment — a mistake in dev should not be able to touch prod.\n' +
      '"Cloud-agnostic" abstraction over            Abstract only genuinely equivalent concepts; accept honest,\n' +
      '  genuinely different cloud semantics         separate modules where clouds differ (IAM, LB health checks).\n' +
      'No promotion pipeline — prod applied         CI applies dev, then staging, then prod IN ORDER, often with a\n' +
      '  independently/first                         manual approval gate before prod, so nothing reaches prod\n' +
      '                                            un-proven in a lower environment first.\n' +
      'Staging sized so differently from prod       Staging should mirror prod\'s SHAPE (same module graph, same\n' +
      '  that prod-only bugs never surface there     resource types) even if smaller scale — the module structure\n' +
      '                                            is what needs to match, not necessarily the instance count.</code></pre>' +
      '<p><b>The real test:</b> if you diff the staging and prod root modules, is the entire difference a handful of variable values — or is there ' +
      'code, structure, or manually-applied drift that only one of them has?</p>',
      try: [
        ['📖 Terraform — workspaces vs. directories', 'https://developer.hashicorp.com/terraform/language/state/workspaces', 'o'],
        ['🔁 Ch 8 — CI/CD for infrastructure', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, multi-environment design is a <b>promotion pipeline</b> problem, and multi-cloud is a <b>where does abstraction actually ' +
      'pay for itself</b> problem. The goal of staging is not "a smaller prod" — it is "a high-confidence predictor of what will happen in prod", ' +
      'which only holds if the two share the same module graph and go through the same change path. Multi-cloud abstraction is worth it exactly where ' +
      'clouds are conceptually the same and not one line further.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why is "thin root module + shared modules, vars differ per environment" better than copy-pasted env codebases?\n' +
      'A: A bug fix or improvement in a shared module reaches every environment automatically on next apply,\n' +
      "   instead of needing to be manually re-applied N times — and staging genuinely predicts prod because\n" +
      '   they run the same module graph, just different variable values.\n\n' +
      'Q: Why keep separate state (and often separate cloud accounts) per environment?\n' +
      "A: Blast radius. A mistaken apply or a compromised CI credential in dev shouldn't be ABLE to touch prod\n" +
      '   resources — separate state/accounts make that a structural guarantee, not a policy someone has to\n' +
      '   remember.\n\n' +
      'Q: A prod-only manual fix was applied outside the Terraform pipeline. Why is that dangerous even if it fixes\n' +
      '   the immediate problem?\n' +
      'A: It makes prod diverge from what staging represents — the next staging-tested change may pass staging\n' +
      "   and then fail in prod (or vice versa) because they're no longer running equivalent configurations.\n\n" +
      'Q: When does a "cloud-agnostic" abstraction module make sense, and when does it backfire?\n' +
      'A: It works for genuinely equivalent concepts (compute, object storage). It backfires when it tries to\n' +
      '   paper over real semantic differences (IAM models, LB health checks) — the abstraction becomes mostly\n' +
      '   `if cloud == X` branches, adding indirection without removing complexity.\n\n' +
      'Q: How do you structure CI so a change is proven before it reaches production?\n' +
      'A: Apply environments in order — dev, then staging, then prod — often gated by a manual approval before\n' +
      '   the prod stage, so a change that misbehaves is caught in a lower environment first, not in prod.</code></pre>',
      try: [
        ['📖 Google — organizing Terraform for multiple environments', 'https://cloud.google.com/docs/terraform/best-practices/organize-configuration', 'o'],
        ['🔀 Ch 12 — blue/green & zero-downtime infra changes', '#ch12', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the standard way to structure Terraform for dev/staging/prod so environments do not drift apart?',
      opts: [
        'Three completely separate, independently-written codebases, one per environment',
        'Thin per-environment root modules that call the SAME shared modules, differing only in variable values, each with its own state',
        'One giant root module with if/else blocks for every environment inline',
        'A single shared state file with a tag per environment'],
      ok: 1,
      why: 'Shared modules plus thin per-env root modules mean a fix in the module reaches every environment, and staging genuinely predicts prod because both run the same module graph.' },
    { q: 'A team builds a "cloud-agnostic" module for AWS and GCP that ends up half full of `if cloud == "aws"` branches. What does this suggest?',
      opts: [
        'The team should add even more abstraction to hide the branches',
        'They abstracted a concept where the clouds are genuinely semantically different (e.g. IAM, LB health checks) — an honest, separate module per cloud may have been better',
        'GCP support should be dropped entirely',
        'The module needs more input variables'],
      ok: 1,
      why: 'False uniformity over genuinely different cloud semantics adds indirection without removing complexity. Abstraction pays off only where concepts are truly equivalent.' },
    { q: 'Why should prod and staging use separate state files (and ideally separate cloud accounts)?',
      opts: [
        'Terraform requires it technically',
        'To make blast radius a structural guarantee — a mistake or compromised credential in one environment cannot directly touch another',
        'To make applies run faster',
        'It has no real benefit, it is just convention'],
      ok: 1,
      why: 'Separate state/accounts per environment ensure an error in dev or staging cannot reach prod resources at all, rather than relying on everyone remembering to be careful.' }
  ]
};
