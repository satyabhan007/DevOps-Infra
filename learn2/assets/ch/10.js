/* DevOps-Infra Learn — Part 2 · Chapter 10: Providers & the Registry Ecosystem */
window.CH[10] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Terraform core knows nothing about AWS, GCP, or Kubernetes — it only knows how to build a dependency graph and call plugins. A ' +
      '<b>provider</b> is that plugin: it translates <code>resource "aws_instance" "web" { ... }</code> into real AWS API calls. Terraform is the ' +
      'engine; providers are what make it actually talk to something.</p>' +
      '<pre><code>Terraform core:  "create this resource, in this order, respecting these dependencies"\n' +
      'provider "aws":  translates that into actual AWS SDK/API calls, understands AWS\'s specific resource shapes</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A universal remote vs. its device-specific codes.</b> ' +
      'The remote (Terraform core) knows how to send "power on", "volume up" as abstract commands. Each device profile (provider) translates that ' +
      'into the actual infrared codes a specific TV or receiver brand understands — swap the profile and the same remote controls a different ' +
      'device.</p></div>',
      try: [
        ['📖 Terraform — providers overview', 'https://developer.hashicorp.com/terraform/language/providers', 'o'],
        ['🧩 Ch 1 — modules & composition', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>Pin provider versions explicitly and commit the lock file — an unpinned provider is an unpinned dependency that can change behavior under ' +
      'you overnight:</p>' +
      '<pre><code># versions.tf — root module\n' +
      'terraform {\n' +
      '  required_version = ">= 1.9.0"\n' +
      '  required_providers {\n' +
      '    aws = {\n' +
      '      source  = "hashicorp/aws"\n' +
      '      version = "~> 5.60"        # allows 5.60.x and 5.6x but not 6.0\n' +
      '    }\n' +
      '  }\n' +
      '}\n\n' +
      '$ terraform init          # resolves versions, writes .terraform.lock.hcl\n' +
      '$ git add .terraform.lock.hcl     # COMMIT this — it pins exact provider builds/hashes for every teammate & CI</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The <b>Terraform Registry</b> (registry.terraform.io) hosts both official ' +
      '(HashiCorp-maintained), <b>partner</b> (vendor-maintained, verified), and community providers — check the badge before depending on one in ' +
      'prod. Commit <code>.terraform.lock.hcl</code> to version control (it is NOT the same as <code>.gitignore</code>-d ' +
      '<code>.terraform/</code>) so every apply, everywhere, resolves the exact same provider binary by cryptographic hash.</p></div>',
      try: [
        ['📖 Terraform Registry — providers', 'https://registry.terraform.io/browse/providers', 'o'],
        ['📖 Terraform — the dependency lock file', 'https://developer.hashicorp.com/terraform/language/files/dependency-lock', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The provider upgrade that broke every apply on a Friday.</b> ' +
      'A team has <code>version = ">= 4.0"</code> (unbounded) on the AWS provider. A new major version (5.0) publishes with breaking schema changes ' +
      'to several resource types; the next CI run resolves it automatically, and applies across a dozen root modules start failing simultaneously with ' +
      'confusing schema-validation errors, on a Friday afternoon. Fix: pin with a pessimistic constraint (<code>~> 5.60</code>, allowing patch/minor ' +
      'but not major) and commit the lock file — provider upgrades become a deliberate, scheduled PR (bump the constraint, review the CHANGELOG, test) ' +
      'rather than something that happens silently on the next init.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The community provider that got abandoned.</b> ' +
      'A team depends on a community-maintained provider for a niche SaaS integration. The maintainer stops responding to issues; a bug affecting a ' +
      'commonly-used resource sits open for eight months, and a security-relevant API deprecation on the SaaS side is never patched in the provider, ' +
      'silently breaking applies. Fix: before adopting any non-official/non-partner provider in production, check its maintenance signal (recent ' +
      'commits, issue response time, download count) — and for anything business-critical, be prepared to fork and maintain it yourself, or write a ' +
      'thin internal provider for just the resources you actually need instead of depending on an unmaintained one wholesale.</p></div>',
      try: [
        ['📖 Terraform — provider requirements', 'https://developer.hashicorp.com/terraform/language/providers/requirements', 'o'],
        ['💵 Ch 11 — cost estimation & governance', '#ch11', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Unbounded provider version constraint       Use a pessimistic constraint (~> 5.60) so patch/minor auto-\n' +
      '  (>= 4.0, or none at all)                    update but a breaking major version requires a deliberate bump.\n' +
      '.terraform.lock.hcl not committed            Commit it. Without it, different machines/CI runs can resolve\n' +
      '                                            different provider builds even under the "same" constraint.\n' +
      'Adopting a community provider for a          Check maintenance signal (recent commits, issue response,\n' +
      '  business-critical resource with no          download count) first; have a fallback plan (fork it,\n' +
      '  maintenance-health check                    write a thin internal provider) for critical dependencies.\n' +
      'Provider upgraded the same PR as an          Bump provider versions in their OWN PR, reviewed against the\n' +
      '  unrelated feature change                    CHANGELOG, separate from unrelated infrastructure changes —\n' +
      '                                            so a breaking behavior change is easy to isolate and revert.\n' +
      'Writing a custom provider for something      Check the registry first — a well-maintained official/partner\n' +
      '  the ecosystem already covers well            provider almost always beats a hand-rolled one long-term.\n' +
      'No plan diff review after a provider          A provider upgrade can silently change default values or\n' +
      '  version bump                                resource behavior — always review the plan diff on the bump\n' +
      '                                            PR itself, not just the CHANGELOG text.</code></pre>' +
      '<p><b>The real test:</b> if HashiCorp published a new major version of a provider you depend on tomorrow, would your applies keep working ' +
      'unchanged until YOU decide to upgrade — or would the next CI run silently pick it up?</p>',
      try: [
        ['📖 Terraform — provider version constraints', 'https://developer.hashicorp.com/terraform/language/providers/requirements#version-constraints', 'o'],
        ['🛠️ Ch 14 — Pulumi/CDK & programmable IaC', '#ch14', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, provider management is a <b>supply-chain dependency</b> problem, identical in shape to pinning an npm or pip package: ' +
      'version constraints, lock files, and deliberate upgrade PRs exist because a provider is code you did not write, running with real cloud ' +
      'credentials, that can change behavior out from under you on any <code>init</code> if left unconstrained. Writing your own thin provider is a ' +
      'legitimate move only when the registry genuinely has no good option — it is a maintenance burden you are choosing to own indefinitely.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why pin provider versions with a pessimistic constraint (~> 5.60) instead of leaving them unbounded?\n' +
      "A: An unbounded constraint means the next `terraform init` anywhere (a teammate's laptop, CI) can silently\n" +
      '   pick up a new major version with breaking schema changes, causing applies to fail unpredictably.\n' +
      '   Pinning makes upgrades a deliberate, reviewed PR instead.\n\n' +
      'Q: What does .terraform.lock.hcl do that a version constraint alone does not?\n' +
      'A: The constraint (~> 5.60) allows a RANGE of versions; the lock file pins the EXACT resolved version and\n' +
      '   cryptographic hash, so every machine and CI run gets the identical provider build, not just something\n' +
      '   satisfying the range.\n\n' +
      'Q: How do you evaluate whether to depend on a community (non-official, non-partner) provider in production?\n' +
      'A: Check its maintenance signal — recent commits, issue/PR response time, download count/adoption — and\n' +
      '   for anything business-critical, have a fallback plan (forking it, writing a thin internal replacement)\n' +
      '   since you have no vendor SLA on a community project.\n\n' +
      'Q: When does it make sense to write a custom/internal Terraform provider?\n' +
      "A: Only when the registry genuinely lacks a good option for a resource you need to manage declaratively —\n" +
      '   it is a real, ongoing maintenance commitment (schema updates, API changes), not a decision to make\n' +
      '   lightly when an existing provider mostly covers the need.\n\n' +
      'Q: Why review the plan DIFF on a provider version bump PR, not just the CHANGELOG?\n' +
      'A: A provider upgrade can change computed defaults or resource behavior in ways the CHANGELOG undersells\n' +
      '   or the PR author misses — the plan diff shows the ACTUAL effect on your specific resources, which is\n' +
      '   the only reliable signal before applying.</code></pre>',
      try: [
        ['📖 HashiCorp — provider development program', 'https://developer.hashicorp.com/terraform/plugin', 'o'],
        ['🌐 Ch 5 — multi-environment & multi-cloud patterns', '#ch5', 'o']
      ] }
  ],

  quiz: [
    { q: 'What is the risk of an unbounded (or overly loose) Terraform provider version constraint like `>= 4.0`?',
      opts: [
        'Terraform will refuse to run init at all',
        'A new major version with breaking changes can be silently picked up on the next init/CI run, causing applies to fail unpredictably',
        'It makes plan output larger',
        'It prevents the lock file from being generated'],
      ok: 1,
      why: 'Without an upper bound, init can resolve a new breaking major version automatically, turning a provider release into an unplanned outage risk.' },
    { q: 'What does `.terraform.lock.hcl` provide beyond a version constraint like `~> 5.60`?',
      opts: [
        'It replaces the need for a version constraint entirely',
        'It pins the exact resolved provider version and cryptographic hash, ensuring every machine/CI run gets an identical build rather than just something satisfying the range',
        'It stores the actual provider binary in git',
        'It is only used for module version pinning, not providers'],
      ok: 1,
      why: 'A constraint defines an acceptable range; the lock file records the exact version and hash actually resolved, so everyone gets the identical provider build.' },
    { q: 'What should you check before depending on a community-maintained (non-official, non-partner) Terraform provider in production?',
      opts: [
        'Nothing — all providers on the registry are equally reliable',
        'Its maintenance signal (recent commits, issue response time, adoption) since there is no vendor SLA, and have a fallback plan for critical dependencies',
        'Only the number of GitHub stars it has',
        'Whether it is written in Go'],
      ok: 1,
      why: 'Community providers carry no guaranteed support; assessing maintenance health and having a fallback (fork or internal replacement) matters most for business-critical resources.' }
  ]
};
