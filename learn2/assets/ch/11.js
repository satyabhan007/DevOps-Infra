/* DevOps-Infra Learn — Part 2 · Chapter 11: Cost Estimation & Governance */
window.CH[11] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A PR changes <code>instance_type = "m5.large"</code> to <code>instance_type = "m5.24xlarge"</code> — a one-character-looking diff that is a ' +
      '~50x cost jump. Nothing about <code>terraform plan</code> tells a reviewer that; it just shows an in-place update. Cost estimation in IaC means ' +
      'the DOLLAR impact of a change is visible at review time, not discovered on next month\'s cloud bill.</p>' +
      '<pre><code>plan says:      ~ update in-place\n' +
      '                    ~ instance_type = "m5.large" -> "m5.24xlarge"\n' +
      'cost tool adds: +$3,214/month  ← the number a reviewer actually needs to see</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A price tag vs. an ingredient list with no total.</b> ' +
      'A recipe that lists ingredients without prices lets you accidentally buy the $200 truffle instead of the $2 mushroom — both are "one ' +
      'ingredient" in the list. A price tag on the receipt at checkout (a cost estimate in the PR) makes the impact impossible to miss before you ' +
      'commit to buying it.</p></div>',
      try: [
        ['📖 Infracost — overview', 'https://www.infracost.io/docs/', 'o'],
        ['🔁 Ch 8 — CI/CD for infrastructure', '#ch8', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>Run a cost-diff tool against the plan in CI and post it as a PR comment, the same way you would post a policy-as-code result:</p>' +
      '<pre><code># CI step, after terraform plan\n' +
      '$ infracost breakdown --path tfplan.json --format json --out-file infracost.json\n' +
      '$ infracost comment github --path infracost.json --repo $REPO --pull-request $PR --github-token $TOKEN\n\n' +
      '# PR comment produced:\n' +
      '# Monthly cost estimate: +$3,214.08  (was $612.40, now $3,826.48)\n' +
      '#   aws_instance.app   m5.large -> m5.24xlarge     +$3,102.00\n' +
      '#   aws_ebs_volume.app gp3 100GB -> gp3 500GB       +$112.08</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>Infracost</b> is the widely-adopted standard for Terraform cost diffs — open ' +
      'source, plugs into the same <code>terraform plan</code> JSON as policy-as-code tools, and integrates directly as a PR comment bot across ' +
      'GitHub/GitLab/Bitbucket. Cloud-native cost tools (AWS Cost Explorer, GCP Cost Management) are complementary for AFTER-the-fact spend analysis ' +
      'but do not give you a pre-merge diff the way Infracost does.</p></div>',
      try: [
        ['📖 Infracost — CI/CD integration', 'https://www.infracost.io/docs/integrations/cicd/', 'o'],
        ['📜 Ch 4 — policy as code', '#ch4', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The $30k/month typo that almost shipped.</b> ' +
      'An engineer copy-pastes a module call and forgets to change <code>node_count</code> from a load-testing value of 200 down to the intended 5 ' +
      'for a new environment. <code>terraform plan</code> shows a clean, valid diff — 200 nodes is a perfectly valid number, just the wrong one. An ' +
      'Infracost comment on the PR flags "+$31,400/month" in bright red, which is what actually catches the reviewer\'s eye and gets the PR sent back ' +
      'for a second look, not the plan output itself. Fix: cost estimation catches VALID-but-wrong changes that policy-as-code and plan review both ' +
      'miss, because "200 nodes" fails no validation rule — it is just expensive.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The budget policy with no teeth.</b> ' +
      'A team sets a "soft" per-team monthly cloud budget in a spreadsheet, reviewed manually at the end of each month. By the time anyone notices a ' +
      'team is 3x over budget, the overspend has been happening for six weeks and is now politically awkward to walk back. Fix: turn the budget into ' +
      'an actual <b>policy-as-code gate</b> (Ch 4) — a Conftest/OPA rule that fails a plan if the cumulative cost-diff would push a team\'s tagged ' +
      'spend over its budget threshold, catching the overspend in the SAME PR that would have caused it, not six weeks into a bill cycle.</p></div>',
      try: [
        ['📖 Infracost — cost policies (OPA)', 'https://www.infracost.io/docs/features/cost_policies/', 'o'],
        ['📜 Ch 4 — policy as code', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Cost only reviewed after the monthly        Post a cost DIFF on every PR (Infracost or equivalent) so the\n' +
      '  cloud bill arrives                          impact is visible before merge, not weeks later.\n' +
      'Budget enforced as a spreadsheet nobody      Turn budgets into a policy-as-code gate that fails a plan\n' +
      '  checks in real time                          exceeding a threshold — enforcement, not just visibility.\n' +
      'Cost estimate ignored because it is          Show the DELTA prominently (this PR: +$X/month), not just an\n' +
      '  buried in a wall of absolute numbers         absolute total nobody has time to parse during review.\n' +
      'No tagging strategy tying cost to a team      Cost governance is only actionable if spend can be attributed\n' +
      '                                            — enforce mandatory cost-center/team tags via policy (Ch 4) so\n' +
      '                                            a cost overage has an obvious owner to talk to.\n' +
      'Reserved/committed-use discounts not          A static per-resource cost estimate can overstate real cost if\n' +
      '  reflected in estimates                       your org has Reserved Instances/Savings Plans — calibrate\n' +
      '                                            the tool\'s pricing source or treat estimates as directional.\n' +
      'Cost gate blocks ALL increases, even          Gate on magnitude/threshold, not "any increase" — a policy\n' +
      '  a justified +$40/month change                that blocks every cost increase gets bypassed or ignored fast.</code></pre>' +
      '<p><b>The real test:</b> when a PR would meaningfully increase monthly spend, does a REVIEWER see that number before approving — or does ' +
      'finance find out first?</p>',
      try: [
        ['📖 Infracost — usage-based cost estimates', 'https://www.infracost.io/docs/features/usage_based_resources/', 'o'],
        ['🧑‍🤝‍🧑 Ch 13 — multi-team ownership boundaries', '#ch13', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, cost governance is a <b>visibility-plus-enforcement</b> system, and the two halves fail independently: visibility alone ' +
      '(a PR comment nobody reads) does not stop an overspend, and enforcement alone (a hard budget gate with no attribution) blocks legitimate work ' +
      'without telling anyone why. The mature version ties cost to an owning team via tagging policy, surfaces the delta prominently at review time, ' +
      'and gates only on a meaningful threshold — the same layered-governance shape as policy as code generally (Ch 4).</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why does a plain `terraform plan` fail to surface a dangerous cost change like an instance-type upgrade?\n' +
      'A: A plan shows the CONFIGURATION diff (instance_type changed from X to Y) — both values are equally\n' +
      '   "valid" to Terraform. It has no concept of dollar cost, so a 50x price jump looks the same as any\n' +
      '   other in-place attribute update.\n\n' +
      'Q: How does cost estimation catch mistakes that policy-as-code (Ch 4) does not?\n' +
      "A: A policy rule checks against explicit constraints (an approved instance-type allowlist); a plain typo\n" +
      '   that stays within otherwise-valid values (200 nodes instead of 5) passes every policy check but is\n' +
      '   still expensive — only a cost-diff surfaces that.\n\n' +
      'Q: Why enforce a cloud budget as a policy-as-code gate rather than a manually-reviewed spreadsheet?\n' +
      'A: A spreadsheet reviewed monthly catches overspend weeks after it started, once it is politically\n' +
      '   awkward to reverse. A policy gate catches it in the SAME PR that would have caused it — before any\n' +
      '   spend actually happens.\n\n' +
      'Q: Why does cost governance require a tagging strategy?\n' +
      'A: Cost attribution to a specific team/owner is what makes an overage actionable — an aggregate cost\n' +
      '   number with no owner just becomes a hard-to-action finance report; per-team tags let a budget policy\n' +
      '   (and a conversation) target the actual source.\n\n' +
      'Q: Why gate on a cost THRESHOLD rather than blocking any cost increase at all?\n' +
      'A: Blocking every increase, including small justified ones, trains engineers to route around or ignore\n' +
      '   the gate — a threshold tuned to genuinely significant changes keeps the gate meaningful and respected.</code></pre>',
      try: [
        ['📖 FinOps Foundation — principles', 'https://www.finops.org/framework/principles/', 'o'],
        ['🔀 Ch 12 — blue/green & zero-downtime infra changes', '#ch12', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why does `terraform plan` alone fail to catch a dangerous cost increase like changing an instance type from m5.large to m5.24xlarge?',
      opts: [
        'Terraform blocks large instance types by default',
        'Plan shows a configuration diff, and both instance types are equally valid to Terraform — it has no concept of dollar cost to flag the jump',
        'Plan only works for resource creation, not updates',
        'This kind of change never appears in plan output'],
      ok: 1,
      why: 'Plan output reflects config attribute changes, not cost. A 50x price jump looks identical in structure to any other in-place attribute update.' },
    { q: 'How does a cost-diff tool like Infracost catch mistakes that policy-as-code (OPA/Sentinel) rules typically miss?',
      opts: [
        'Cost tools replace the need for policy as code entirely',
        'A value can be entirely valid against every policy rule (e.g. within an allowed range) and still be an expensive mistake — cost estimation flags the dollar impact directly regardless of policy compliance',
        'Policy engines cannot evaluate numeric values',
        'Cost tools and policy tools check exactly the same things'],
      ok: 1,
      why: 'A typo like 200 nodes instead of 5 can pass every explicit policy rule while still being a costly mistake — only a cost-diff surfaces the dollar impact directly.' },
    { q: 'Why is enforcing a cloud budget as a policy-as-code gate generally better than a manually-reviewed spreadsheet?',
      opts: [
        'Spreadsheets cannot track dollar amounts',
        'A policy gate catches an overage in the same PR that would cause it, before any spend happens, rather than discovering it weeks into a bill cycle',
        'Policy gates are required by cloud providers',
        'There is no real difference between the two approaches'],
      ok: 1,
      why: 'A gate integrated into the plan/PR workflow catches overspend before it starts, while a periodically-reviewed spreadsheet only surfaces it well after the fact.' }
  ]
};
