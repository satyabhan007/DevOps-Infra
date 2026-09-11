/* DevOps-Infra Learn — Part 2 · Chapter 6: Testing Infrastructure Code */
window.CH[6] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Application code has unit tests that run in seconds. Infrastructure code\'s "test" has historically been: run <code>terraform apply</code> ' +
      'against real cloud resources and see what breaks — slow, costly, and sometimes destructive. Testing IaC means catching a bad module BEFORE it ' +
      'ever touches a real account, the same way a unit test catches a bug before it ships.</p>' +
      '<pre><code>old way:  write module → apply to real AWS → discover the security group is wrong → tear down, fix, repeat\n' +
      'tested:   write module → static checks + a real (disposable) apply in CI → confident before anyone hand-applies it</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A flight simulator vs. learning to fly by crashing real planes.</b> ' +
      'A simulator (static analysis, plan review) catches most mistakes cheaply. A real test flight in a controlled setting (an ephemeral test ' +
      'environment) catches what the simulator cannot — but you still would not want every lesson to be a real, uncontrolled flight with passengers ' +
      'aboard (a hand-applied change straight to prod).</p></div>',
      try: [
        ['📖 Terraform — testing overview', 'https://developer.hashicorp.com/terraform/language/tests', 'o'],
        ['📜 Ch 4 — policy as code', '#ch4', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>Layer the checks from cheapest/fastest to most expensive/thorough:</p>' +
      '<pre><code># 1. terraform fmt/validate — syntax + internal consistency, no cloud calls, milliseconds\n' +
      '$ terraform fmt -check -recursive && terraform validate\n\n' +
      '# 2. checkov / tfsec — static security & best-practice scanning, no cloud calls, seconds\n' +
      '$ checkov -d modules/vpc\n\n' +
      '# 3. terraform test — native since 1.6, runs REAL plans (and optionally applies) against a module\n' +
      '# tests/vpc.tftest.hcl\n' +
      'run "creates_expected_subnet_count" {\n' +
      '  command = plan\n' +
      '  variables { az_count = 3 }\n' +
      '  assert {\n' +
      '    condition     = length(aws_subnet.private) == 3\n' +
      '    error_message = "expected 3 private subnets"\n' +
      '  }\n' +
      '}\n\n' +
      '# 4. Terratest (Go) — full apply against a REAL, disposable environment, then destroy</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Terraform\'s built-in <b>terraform test</b> framework (native ' +
      '<code>.tftest.hcl</code> files, since v1.6) is now the standard starting point for module tests since it needs no extra tooling; ' +
      '<b>Terratest</b> (Gruntwork, Go-based) remains the standard for deeper, full-apply integration tests against real infrastructure.</p></div>',
      try: [
        ['📖 Terraform — the `test` command', 'https://developer.hashicorp.com/terraform/cli/commands/test', 'o'],
        ['📖 Terratest', 'https://terratest.gruntwork.io/', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The module that passed every plan-time check and still broke prod.</b> ' +
      'A "database" module passes <code>validate</code>, <code>checkov</code>, and a native <code>terraform test</code> plan-only assertion — all of ' +
      'which only check the PLAN, never a real apply. In production, the actual RDS engine version specified does not support the chosen instance ' +
      'class, an error only AWS\'s API can return, and the apply fails halfway through, leaving a partially-created resource. Fix: for modules with ' +
      'meaningful cloud-API-level risk, add a <code>command = apply</code> test tier (native <code>terraform test</code> supports this) that ' +
      'actually applies to a disposable test account and destroys afterward — plan-only tests catch config mistakes, not API-level ' +
      'incompatibilities.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The flaky, expensive test suite nobody trusted.</b> ' +
      'A team\'s Terratest suite applies real infrastructure for every PR, takes 25 minutes, and fails intermittently due to cloud API rate limits and ' +
      'eventual-consistency races — engineers start merging with "tests failed, but probably fine" as a habit, defeating the entire purpose. Fix: keep ' +
      'the fast, deterministic layer (fmt/validate/checkov/plan-tests) as a REQUIRED gate on every PR, and move the slow, real-apply integration tests ' +
      'to a scheduled/nightly run (or a manually-triggered label) rather than blocking every single PR — reserve real-apply tests for the modules that ' +
      'actually need that level of confidence.</p></div>',
      try: [
        ['📖 checkov — static analysis for IaC', 'https://www.checkov.io/', 'o'],
        ['🔁 Ch 8 — CI/CD for infrastructure', '#ch8', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                             FIX\n' +
      'Only testing by hand-applying to prod       Layer fmt/validate → static scan (checkov/tfsec) → native\n' +
      '                                            terraform test (plan) → Terratest/apply-tier — cheap gates first.\n' +
      'Real-apply integration tests block          Keep fast, deterministic checks required on every PR; run slow,\n' +
      '  every single PR                            real-apply tests nightly/scheduled or on-demand.\n' +
      'No test for the FAILURE path                 Test that invalid input (bad CIDR, missing required var) is\n' +
      '  (only "does it apply cleanly")              REJECTED with a clear error, not just that valid input works.\n' +
      'Static scanners left at default severity     Tune checkov/tfsec rule sets to your org\'s actual policy (Ch 4)\n' +
      '  with no customization                       — default rule sets flag things your org may deliberately allow.\n' +
      'Test infra never torn down                   Every real-apply test tier MUST destroy what it created, even\n' +
      '                                            on failure (use a deferred/`defer`-style teardown in Terratest).\n' +
      'One test suite shared across all modules      Each module owns its own tests, versioned alongside it — a\n' +
      '  in a central repo, disconnected from code    shared test repo drifts out of sync with the module it tests.</code></pre>' +
      '<p><b>The real test:</b> if a teammate submits a module change that plans cleanly but is subtly wrong, does ANY layer of your test suite ' +
      'actually catch it before a human has to hand-apply it to find out?</p>',
      try: [
        ['📖 Terraform — write tests tutorial', 'https://developer.hashicorp.com/terraform/tutorials/configuration-language/test', 'o'],
        ['🩹 Ch 9 — import, refactor & state surgery', '#ch9', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, testing IaC is a <b>cost/confidence tradeoff curve</b>, not a single tool choice: static checks are nearly free and catch ' +
      'syntax/policy mistakes; plan-tests are cheap and catch logic mistakes; real-apply tests are expensive (time, cloud spend, flakiness) and catch ' +
      'the API-level mistakes nothing else can. The skill is deciding, per module, how far up that curve the module\'s blast radius justifies going — ' +
      'not applying the same test tier uniformly everywhere.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What can a real-apply test (Terratest, terraform test with command=apply) catch that a plan-only test cannot?\n' +
      'A: Cloud-API-level failures — invalid combinations only the provider API rejects (e.g. an unsupported\n' +
      '   engine/instance-class pairing), eventual-consistency issues, and whether resources actually come up\n' +
      "   healthy. A plan only validates config logic against the provider's schema, not real API behavior.\n\n" +
      'Q: Why not run full real-apply integration tests on every single PR?\n' +
      'A: They are slow, cost real cloud spend, and are prone to flakiness (rate limits, eventual consistency) —\n' +
      "   run them nightly/scheduled or on-demand, and keep the deterministic static layer as the fast, required\n" +
      '   gate on every PR so merges are not blocked by infrastructure flakiness.\n\n' +
      'Q: What should a module test suite verify besides "does a valid config apply cleanly"?\n' +
      'A: That INVALID input is rejected with a clear, actionable error — a missing required variable or an\n' +
      '   out-of-range value should fail fast and legibly, not produce a confusing downstream provider error.\n\n' +
      'Q: How do static scanners like checkov/tfsec differ from terraform validate?\n' +
      'A: `validate` checks internal consistency against the provider schema (types, required args). Static\n' +
      '   scanners check for known security/best-practice anti-patterns (public buckets, missing encryption)\n' +
      "   against a rule database — they catch DIFFERENT classes of mistakes and are complementary, not redundant.\n\n" +
      'Q: How do you decide which modules deserve expensive real-apply test coverage?\n' +
      'A: By blast radius and change frequency — a foundational, widely-reused module (networking, IAM baseline)\n' +
      '   justifies the cost; a rarely-changed, narrowly-scoped module may only need the cheap static layer.</code></pre>',
      try: [
        ['📖 Gruntwork — testing Terraform code', 'https://blog.gruntwork.io/open-sourcing-terratest-a-swiss-army-knife-for-testing-infrastructure-code-5d883336fcd5', 'o'],
        ['💵 Ch 11 — cost estimation & governance', '#ch11', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why layer IaC testing (fmt/validate → static scan → plan-test → real-apply test) instead of relying on one method?',
      opts: [
        'Because Terraform requires all four to be configured before it will apply',
        'Each layer is progressively more expensive/slower but catches a different class of mistake — cheap checks run on every PR, expensive real-apply tests are reserved for what only they can catch',
        'Static scanners replace the need for terraform validate entirely',
        'It is purely a stylistic convention with no functional difference'],
      ok: 1,
      why: 'Cheap static/plan checks catch syntax and logic mistakes fast and can run on every PR; expensive real-apply tests catch cloud-API-level issues but are slower and costlier, so they are used more selectively.' },
    { q: 'What can a real-apply test catch that a plan-only test (terraform test with command=plan) cannot?',
      opts: [
        'Typos in variable names',
        'Cloud-API-level failures, like an invalid instance-class/engine-version combination that only the real provider API rejects',
        'Whether the HCL syntax is valid',
        'Whether a module has documentation'],
      ok: 1,
      why: 'A plan validates config against the provider schema, but some invalid combinations are only rejected by the real cloud API during an actual apply.' },
    { q: 'Why should slow, real-apply integration test suites typically NOT block every single PR?',
      opts: [
        'Because they are never useful and should be avoided entirely',
        'They are slow, cost real cloud spend, and can be flaky (rate limits, eventual consistency) — better run on a schedule or on-demand, with fast deterministic checks required on every PR instead',
        'Because Terraform does not support running tests in CI',
        'Because real-apply tests cannot be automated'],
      ok: 1,
      why: 'Blocking every PR on a slow, flaky test suite erodes trust in it (engineers start merging past failures). Keeping fast checks required and slow ones scheduled preserves both velocity and signal.' }
  ]
};
