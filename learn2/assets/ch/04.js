/* DevOps-Infra Learn — Part 2 · Chapter 4: Policy as Code */
window.CH[4] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>You wrote in the team wiki: "please tag every resource with a cost-center, and never make an S3 bucket public." A new engineer, six months ' +
      'in, has never read that wiki page. Their PR passes code review because the reviewer did not notice a missing tag either. <b>Policy as code</b> ' +
      'turns that wiki paragraph into a machine-checked rule that runs on every single plan, automatically, forever.</p>' +
      '<pre><code>wiki page: "no public S3 buckets, please"   →   policy: deny if aws_s3_bucket.acl == "public-read"\n' +
      '  (works only if everyone reads and remembers it)     (the plan FAILS in CI — nobody has to remember anything)</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A building code inspector vs. a "please build safely" poster.</b> ' +
      'A poster reminding contractors to use fire-rated materials relies on everyone reading and remembering it. A building inspector who checks the ' +
      'blueprints before construction starts and refuses to sign off on a violation catches the mistake mechanically, every time, regardless of who ' +
      'drew the blueprint.</p></div>',
      try: [
        ['📖 Open Policy Agent — overview', 'https://www.openpolicyagent.org/docs/latest/', 'o'],
        ['🧩 Ch 1 — modules & composition', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>The two dominant approaches: <b>OPA/Conftest</b> (open-source, Rego language, works against a <code>terraform show -json</code> plan) and ' +
      '<b>Sentinel</b> (HashiCorp Cloud/Enterprise-only, built into the run pipeline):</p>' +
      '<pre><code># policy/no_public_s3.rego — OPA/Rego, run via Conftest\n' +
      'package main\n\n' +
      'deny[msg] {\n' +
      '  resource := input.resource_changes[_]\n' +
      '  resource.type == "aws_s3_bucket_acl"\n' +
      '  resource.change.after.acl == "public-read"\n' +
      '  msg := sprintf("%s: public-read ACL is not allowed", [resource.address])\n' +
      '}\n\n' +
      '# in CI:\n' +
      '$ terraform show -json tfplan > plan.json\n' +
      '$ conftest test plan.json -p policy/\n' +
      'FAIL - plan.json - main - aws_s3_bucket_acl.public: public-read ACL is not allowed</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Open Policy Agent + Conftest</b> is the vendor-neutral, widely adopted ' +
      'standard — it also powers Kubernetes admission control and CI gates elsewhere in the stack, so the same Rego skill reuses across the whole ' +
      'platform. <b>Sentinel</b> is the equivalent if you are already fully on HCP Terraform/Terraform Enterprise and want policy tightly integrated ' +
      'into the native run pipeline with no extra CI wiring.</p></div>',
      try: [
        ['📖 Conftest — testing structured config', 'https://www.conftest.dev/', 'o'],
        ['📖 HashiCorp — Sentinel', 'https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The policy that was too strict, too fast.</b> ' +
      'A platform team writes a Rego policy denying any instance type outside an approved list and turns it on as a hard-fail gate for every team ' +
      'the same afternoon. Dozens of in-flight PRs across the org start failing CI — including several urgent hotfixes — because nobody had a chance ' +
      'to migrate. Fix: ship new policies in <b>warn/advisory mode</b> first (fail the check visibly but not the merge), give teams a real deadline, ' +
      'then flip to hard-deny — the same rollout discipline you would use for a breaking module change.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The policy that checked the wrong thing.</b> ' +
      'A tagging policy checks that <code>aws_instance</code> resources have a <code>cost_center</code> tag — but the org\'s actual convention ' +
      'inherits tags from a <code>default_tags</code> block on the provider, which never shows up as an explicit tag on the resource\'s own plan diff. ' +
      'Every compliant resource fails the policy; the team disables the check out of frustration, losing the guardrail entirely. Fix: policies must be ' +
      'written and tested against the SAME representation the pipeline actually produces (<code>terraform show -json</code> after provider-level ' +
      'defaults are merged in) — test the policy against a real plan JSON, not an assumed one, before rolling it out.</p></div>',
      try: [
        ['📖 OPA — policy testing', 'https://www.openpolicyagent.org/docs/latest/policy-testing/', 'o'],
        ['🧪 Ch 6 — testing infrastructure code', '#ch6', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'New policy ships as hard-fail on day one    Warn-mode first, announce a deadline, then promote to a\n' +
      '                                            merge-blocking gate — treat it like a breaking module change.\n' +
      'Policy tested only by eyeballing Rego       Write policy unit tests (Conftest supports table-driven tests)\n' +
      '                                            against real captured plan JSON, both pass and fail cases.\n' +
      'One giant policy bundle for everything       Split by concern (security, cost, tagging, naming) so a team\n' +
      '                                            can see exactly which category failed and who owns that rule.\n' +
      'Policy checks the .tf source directly        Check the PLAN (terraform show -json), not raw HCL — the plan\n' +
      '                                            reflects computed values, defaults, and module outputs; source\n' +
      '                                            alone misses drift from variables and provider defaults.\n' +
      'No override / exception path                Provide a documented, audited exception mechanism (e.g. a\n' +
      '                                            reviewed annotation + expiry) — an ungovernable hard-block gets\n' +
      '                                            bypassed by disabling the whole gate during an incident.\n' +
      'Policy owned by no one, drifts stale         Assign an owning team per policy category; review policies on\n' +
      '                                            the same cadence as the infra they gate, or they rot silently.</code></pre>' +
      '<p><b>The real test:</b> when a legitimate, urgent exception is needed at 2am, is there a documented, audited way to get it through — or does ' +
      'the on-call engineer\'s only option become disabling the policy gate entirely?</p>',
      try: [
        ['📖 OPA — Rego style guide', 'https://www.openpolicyagent.org/docs/latest/policy-language/', 'o'],
        ['🔁 Ch 8 — CI/CD for infrastructure', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, policy as code is a <b>governance-as-a-product</b> problem: policies are a public API for "what is and is not allowed", ' +
      'with the same versioning, testing, and rollout discipline as any other shared platform surface (Ch 1). A policy that ships without warn-mode, ' +
      'tests, or an owner is a landmine, not a guardrail — it will eventually block something urgent and get disabled out of frustration, undoing the ' +
      'governance it was meant to provide.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why check the Terraform PLAN (JSON) instead of the raw .tf source for policy enforcement?\n' +
      'A: The plan reflects computed/resolved values — provider defaults, variable interpolation, module\n' +
      '   outputs — that raw source alone does not show. A rule like "no public S3 buckets" needs to see the\n' +
      '   actual resolved ACL value, not a variable reference that might resolve to anything.\n\n' +
      'Q: How do you roll out a new, potentially disruptive policy without breaking every in-flight PR?\n' +
      'A: Ship it in warn/advisory mode first (visible failure, non-blocking), announce a deadline for teams to\n' +
      '   fix violations, then promote it to a hard merge-blocking gate — the same discipline as a breaking\n' +
      '   module version bump.\n\n' +
      'Q: OPA/Conftest vs. Sentinel — how do you choose?\n' +
      'A: OPA/Conftest is open-source, vendor-neutral, and the same Rego skill reuses across Kubernetes\n' +
      '   admission control and other CI gates. Sentinel is the native choice if you are already fully committed\n' +
      '   to HCP Terraform/Terraform Enterprise and want policy wired directly into the run pipeline.\n\n' +
      'Q: What happens when a hard policy gate has no documented exception path?\n' +
      'A: During a real incident that needs an urgent, legitimate exception, the only escape hatch becomes\n' +
      '   disabling the entire gate — which removes the guardrail for everyone, not just the one urgent case.\n' +
      '   A reviewed, audited, time-boxed override mechanism avoids that.\n\n' +
      'Q: How do you test a policy before it ever reaches CI?\n' +
      'A: Capture real `terraform show -json` plan output (both a compliant and a violating example) and write\n' +
      '   table-driven Conftest/Rego unit tests against it — the same way you would unit test application code,\n' +
      '   so the policy itself is verified before it starts blocking other people\'s merges.</code></pre>',
      try: [
        ['📖 HashiCorp — policy as code overview', 'https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement', 'o'],
        ['🧑‍🤝‍🧑 Ch 13 — multi-team ownership boundaries', '#ch13', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why do policy-as-code tools (Conftest/OPA, Sentinel) evaluate the Terraform PLAN rather than the raw .tf source?',
      opts: [
        'The plan is smaller and faster to parse',
        'The plan reflects fully resolved/computed values (provider defaults, variable interpolation, module outputs) that raw source alone does not show',
        '.tf source files cannot be parsed by policy engines',
        'Plans are always written in JSON while source files are not'],
      ok: 1,
      why: 'A rule needs to see the actual resolved value (e.g. a bucket ACL) after variables and defaults are applied — raw source may only show a variable reference.' },
    { q: 'What is the safest way to roll out a new, potentially disruptive org-wide policy?',
      opts: [
        'Turn it on as a hard-blocking gate immediately for everyone, so violations get fixed fast',
        'Ship it in warn/advisory (non-blocking) mode first, give teams a deadline to fix violations, then promote it to a hard gate',
        'Only enable it in production, never in staging or PRs',
        'Email the policy text to every engineer and rely on manual review'],
      ok: 1,
      why: 'A hard-fail rollout on day one can break many in-flight PRs at once, including urgent ones. Warn-mode plus a deadline gives teams time to comply before it becomes blocking.' },
    { q: 'Why should a hard-blocking policy gate have a documented, audited exception path?',
      opts: [
        'To let any engineer skip the policy whenever convenient',
        'Because without one, the only way to handle a legitimate urgent exception (e.g. during an incident) becomes disabling the entire gate, removing the guardrail for everyone',
        'Exceptions are required by the Terraform CLI itself',
        'It has no real benefit and should be avoided'],
      ok: 1,
      why: 'An ungovernable hard block tends to get bypassed entirely under pressure; a reviewed, time-boxed override preserves the guardrail while still unblocking the urgent case.' }
  ]
};
