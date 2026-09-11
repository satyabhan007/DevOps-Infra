/* DevOps-Infra Learn — Part 2 · Chapter 13: Multi-Team Terraform: Ownership Boundaries */
window.CH[13] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>One team, one AWS account, one Terraform repo works fine for a while. Forty engineers across six teams sharing that same account and repo ' +
      'is a different problem entirely: who can apply to prod, who owns the networking module everyone depends on, and what happens when two teams\' ' +
      'changes touch overlapping resources in the same apply? Ownership boundaries are the answer to "whose change was that, and who had the right to ' +
      'make it".</p>' +
      '<pre><code>one team, one repo:      anyone can change anything, fine at small scale\n' +
      'six teams, one repo:      who owns modules/networking/? who can approve a prod apply? who gets paged\n' +
      '                          when it breaks? — needs explicit answers, not implicit trust</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>An apartment building\'s shared vs. private spaces.</b> ' +
      'Your own unit, you renovate freely. The building\'s electrical system, elevators, and lobby need a super/HOA with clear authority — not every ' +
      'resident individually deciding to rewire the shared panel because their unit needed more power.</p></div>',
      try: [
        ['📖 HashiCorp — team management guide', 'https://developer.hashicorp.com/terraform/cloud-docs/users-teams-organizations/teams', 'o'],
        ['🧩 Ch 1 — modules & composition', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>Enforce ownership with a CODEOWNERS-driven review requirement plus scoped, role-based CI credentials — not just a wiki page saying who owns ' +
      'what:</p>' +
      '<pre><code># .github/CODEOWNERS — REQUIRES the owning team\'s approval on any PR touching their path\n' +
      'modules/networking/   @platform-team\n' +
      'modules/database/     @data-platform-team\n' +
      'teams/checkout/       @checkout-team\n' +
      'teams/payments/       @payments-team\n\n' +
      '# CI: each team\'s pipeline assumes a role scoped ONLY to their account/prefix\n' +
      '# checkout-team\'s CI role can apply to teams/checkout/* state, nothing else\n' +
      'role_arn = "arn:aws:iam::111111111111:role/tf-apply-checkout"</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>The standard pattern is a <b>platform team</b> owning shared, foundational ' +
      'modules (networking, IAM baseline, the CI pipeline templates themselves) published to an internal registry with semver (Ch 1), while product ' +
      'teams own their own root modules/state and apply independently within a scoped account or namespace — GitHub/GitLab <b>CODEOWNERS</b> enforces ' +
      'the review boundary; cloud IAM enforces the apply boundary.</p></div>',
      try: [
        ['📖 GitHub — CODEOWNERS', 'https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners', 'o'],
        ['🏬 Ch 10 — providers & the registry ecosystem', '#ch10', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The "who broke prod" hunt that took three hours.</b> ' +
      'A production incident traces to a security group rule change. The team investigating has to manually dig through a shared repo\'s full commit ' +
      'history across dozens of unrelated PRs to find who touched that resource and when, because the module lives in a shared, general-purpose repo ' +
      'with no per-path ownership and no scoped CI identity — every apply runs as one shared "terraform-ci" account, so even CloudTrail cannot ' +
      'distinguish which team\'s pipeline actually ran it. Fix: CODEOWNERS on the shared module path plus a PER-TEAM scoped CI role means both the PR ' +
      'history AND the cloud audit log (CloudTrail) immediately show which team\'s pipeline, and which reviewer, touched the resource — cutting the ' +
      'hunt from hours to minutes.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The platform module that became a bottleneck.</b> ' +
      'Every team depends on the platform team\'s shared networking module, but the platform team is three people reviewing every downstream PR that ' +
      'touches shared infra — they become a queue, and teams start routing around them with copy-pasted, unreviewed workarounds to ship faster. Fix: ' +
      'shift the platform team from "reviews every use" to "publishes a versioned, well-tested module (Ch 1, Ch 6) that teams consume independently" — ' +
      'ownership of the MODULE\'s correctness stays centralized, but ownership of WHEN/HOW to consume a given version moves to each team, removing the ' +
      'bottleneck without losing the shared-quality bar.</p></div>',
      try: [
        ['🧪 Ch 6 — testing infrastructure code', '#ch6', 'o'],
        ['🔁 Ch 8 — CI/CD for infrastructure', '#ch8', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'One shared CI identity for all teams        Scope a CI role per team/account boundary — the audit log\n' +
      '  applies                                    (CloudTrail, plan/apply history) should show WHO ran WHAT.\n' +
      'No CODEOWNERS on shared module paths         Require the owning team\'s review on any change to their\n' +
      '                                            module/path — enforced by the tool, not by a wiki convention.\n' +
      'Platform team reviews every consumer PR      Publish shared modules with versioning + tests; teams consume\n' +
      '  that touches shared infra                   independently — review the MODULE, not every USE of it.\n' +
      'Ownership documented only in a wiki page      Encode it where it is enforced: CODEOWNERS for review, IAM\n' +
      '  that goes stale                              policy for apply scope — a stale wiki page is not a boundary.\n' +
      'No clear "who gets paged" mapping per         Tie module/resource ownership directly to an on-call rotation\n' +
      '  shared resource                              — an incident in a resource with no clear owner burns time\n' +
      '                                            just finding who to escalate to.\n' +
      'Teams bypass shared modules with copy-        A bottlenecked platform team causes exactly this — fix the\n' +
      '  pasted, unreviewed workarounds               bottleneck (self-serve versioned modules) rather than\n' +
      '                                            accepting the workaround as inevitable.</code></pre>' +
      '<p><b>The real test:</b> for any given resource in prod, can you answer "which team owns this, who can approve a change to it, and who gets ' +
      'paged if it breaks" in under a minute — without asking around?</p>',
      try: [
        ['📖 HashiCorp — organizing workspaces by team', 'https://developer.hashicorp.com/terraform/cloud-docs/workspaces/organize-workspaces', 'o'],
        ['🔀 Ch 12 — blue/green & zero-downtime infra changes', '#ch12', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, multi-team Terraform ownership is an <b>organizational design</b> problem wearing an infrastructure costume: the technical ' +
      'mechanisms (CODEOWNERS, scoped IAM roles, per-team state) only work if they mirror a real decision that was made about who is accountable for ' +
      'what — enforcing a boundary nobody actually agreed to just relocates the conflict from "whose PR is this" to "why is CI blocking my ' +
      'apply".</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why use per-team scoped CI credentials instead of one shared "terraform-ci" identity for the whole org?\n' +
      'A: A shared identity makes the cloud audit log (CloudTrail etc.) unable to distinguish which team\'s\n' +
      '   pipeline made a given change — incident investigation and accountability both require the audit trail\n' +
      "   to show WHO, which a shared identity erases.\n\n" +
      'Q: How should a platform team scale module ownership without becoming a review bottleneck for every team?\n' +
      "A: Shift from reviewing every consumer's use of a shared module to publishing a versioned, well-tested\n" +
      '   module that teams consume independently (Ch 1, Ch 6) — ownership of correctness stays centralized,\n' +
      '   ownership of adoption timing moves to each consuming team.\n\n' +
      'Q: Why enforce ownership boundaries with CODEOWNERS + IAM policy rather than a wiki page?\n' +
      "A: A wiki page relies on everyone reading and remembering it, and goes stale as teams reorganize.\n" +
      '   CODEOWNERS mechanically blocks a merge without the right review; IAM policy mechanically blocks an\n' +
      '   apply outside a team\'s scope — both are enforced regardless of whether anyone remembers the convention.\n\n' +
      'Q: What happens when a platform team becomes a bottleneck for shared infrastructure changes?\n' +
      'A: Teams route around it with unreviewed, copy-pasted workarounds to keep shipping — which defeats the\n' +
      '   quality/consistency goal the centralized review was meant to provide in the first place. The fix is\n' +
      '   removing the bottleneck, not accepting the workaround.\n\n' +
      'Q: What is the real test of a well-designed ownership boundary?\n' +
      'A: For any resource, you can immediately answer who owns it, who can approve a change, and who gets\n' +
      '   paged if it breaks — without having to ask around. If that takes investigation, the boundary is not\n' +
      '   actually encoded anywhere enforceable.</code></pre>',
      try: [
        ['📖 Team Topologies — platform teams', 'https://teamtopologies.com/key-concepts', 'o'],
        ['🗺️ Ch 16 — IaC platform reference architecture', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why should each team\'s CI pipeline use a scoped, per-team cloud IAM role instead of one shared "terraform-ci" identity for the whole org?',
      opts: [
        'Scoped roles make Terraform apply faster',
        'A shared identity prevents the cloud audit log from distinguishing which team\'s pipeline made a given change, hurting both accountability and incident investigation',
        'Terraform requires a unique role per state file technically',
        'It has no real benefit beyond convention'],
      ok: 1,
      why: 'A shared CI identity erases the "who" from the audit trail — scoped roles let CloudTrail (or equivalent) show exactly which team\'s pipeline performed a given change.' },
    { q: 'How should a platform team scale ownership of a widely-used shared module without becoming a review bottleneck?',
      opts: [
        'Review every single consumer PR that uses the module, no matter how many teams depend on it',
        'Publish a versioned, well-tested module that teams consume independently — owning the module\'s correctness centrally while consuming teams control their own adoption timing',
        'Give up ownership of the module entirely and let any team edit it freely',
        'Require all teams to funnel infra changes through one central repo'],
      ok: 1,
      why: 'Shifting from per-use review to publishing a versioned, tested module removes the platform team as a bottleneck while retaining centralized quality control over the module itself.' },
    { q: 'Why is a wiki page documenting ownership boundaries insufficient compared to CODEOWNERS + scoped IAM policy?',
      opts: [
        'Wiki pages cannot be edited by more than one person',
        'A wiki page relies on people reading and remembering it and goes stale, while CODEOWNERS and IAM policy are mechanically enforced regardless of memory or reorganization',
        'CODEOWNERS is required by GitHub for all repositories',
        'Wiki pages are slower to load than code-based enforcement'],
      ok: 1,
      why: 'Mechanically-enforced boundaries (blocked merges, blocked applies) hold even as teams reorganize or people forget conventions; documentation alone does not.' }
  ]
};
