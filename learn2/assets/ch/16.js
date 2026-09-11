/* DevOps-Infra Learn — Part 2 · Chapter 16: The IaC Platform — Reference Architecture */
window.CH[16] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Fifteen chapters, each solving one piece — modules, state, drift, policy, environments, testing, secrets, CI/CD, state surgery, providers, ' +
      'cost, zero-downtime, ownership, and the programmable alternative. None of them work in isolation: a policy gate needs CI/CD to run in; CI/CD ' +
      'needs scoped credentials from ownership boundaries; ownership boundaries need versioned modules to divide along. This chapter is the one ' +
      'diagram all of that assembles into.</p>' +
      '<pre><code>PR opens → plan (Ch 1 modules resolve) → static/policy checks (Ch 4,6) → cost diff (Ch 11)\n' +
      '  → human review of THE SAME saved plan (Ch 8) → merge → scoped-credential apply (Ch 13)\n' +
      '  → drift + cost monitored continuously (Ch 3, 11) → state stays locked, remote, per-env (Ch 2, 5)</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>An orchestra, not fifteen solo instruments.</b> ' +
      'Each musician (each chapter\'s practice) is competent alone, but a symphony only happens when they play from the same score, in time with each ' +
      'other — a platform is the score that makes fifteen independently-correct practices function as one coherent system.</p></div>',
      try: [
        ['⚙️ Part 1: the plan/apply lifecycle', '../learn/#ch2', 'o'],
        ['🧩 Ch 1 — modules & composition', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>The reference architecture, as a request\'s actual path through the platform:</p>' +
      '<pre><code>1. ENGINEER opens a PR against a thin root module (Ch 5) calling versioned shared modules (Ch 1)\n' +
      '2. CI: terraform fmt/validate → checkov/tfsec → terraform test (Ch 6) → terraform plan -out=tfplan\n' +
      '3. CI: terraform show -json tfplan → Conftest/OPA policy gate (Ch 4) + Infracost cost diff (Ch 11)\n' +
      '4. Both posted to the PR; CODEOWNERS (Ch 13) requires the owning team\'s human approval on the SAME plan\n' +
      '5. Merge → apply job runs the EXACT saved tfplan artifact (Ch 8), using a role scoped to that team/env (Ch 13)\n' +
      '6. State: remote backend, locked, one file per env (Ch 2) — secrets pulled from Vault at apply time (Ch 7)\n' +
      '7. Ongoing: scheduled drift detection (Ch 3) + cost monitoring (Ch 11) run independent of any PR</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>This shape — <b>plan → policy/cost gate → human review of the exact reviewed ' +
      'plan → scoped apply → continuous drift/cost monitoring</b> — is what tools like <b>Atlantis</b> and <b>HCP Terraform</b> implement ' +
      'out-of-the-box; hand-rolling it in raw CI YAML (as shown here) is equally valid but means you own keeping every piece wired together ' +
      'correctly.</p></div>',
      try: [
        ['📖 Atlantis — Terraform pull request automation', 'https://www.runatlantis.io/', 'o'],
        ['🔁 Ch 8 — CI/CD for infrastructure', '#ch8', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The platform that had every piece, individually correct, and still failed.</b> ' +
      'An org has excellent modules (Ch 1), a solid policy gate (Ch 4), and good cost visibility (Ch 11) — but the policy gate evaluates the plan ' +
      'BEFORE the cost check, and both run as SEPARATE, unordered CI jobs that can post their PR comments in either order or even race each other. A ' +
      'reviewer approves based on seeing only the policy comment, misses the cost comment that posted ninety seconds later, and a $12k/month mistake ' +
      'ships. Fix: the pieces are not just individually necessary, they need an explicit, deterministic ORDER and a single combined review surface — a ' +
      'platform is judged by whether its parts compose into one coherent gate, not by whether each part exists somewhere in CI.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The reference architecture that was never load-tested against an incident.</b> ' +
      'A team builds all fifteen pieces well, but has never actually rehearsed what Ch 15\'s "broken apply" scenario looks like against THEIR specific ' +
      'combination of scoped IAM roles (Ch 13), locked state (Ch 2), and policy gates (Ch 4) — the first time a real partial-apply incident happens, ' +
      'the on-call engineer discovers the scoped CI role cannot run the diagnostic AWS CLI commands needed, because it was scoped ONLY for ' +
      '<code>terraform apply</code>, not read-level debugging access. Fix: a reference architecture is not finished until it has been rehearsed against ' +
      'a realistic failure (a game day, a deliberately-broken staging apply) — the individually-correct pieces (least-privilege roles, locking, policy) ' +
      'can combine to make even routine debugging harder unless that\'s explicitly designed for too.</p></div>',
      try: [
        ['🚑 Ch 15 — debugging a broken apply', '#ch15', 'o'],
        ['🧑‍🤝‍🧑 Ch 13 — multi-team ownership boundaries', '#ch13', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Each Ch 1-15 practice implemented           Design the ORDER and combination explicitly — a policy gate,\n' +
      '  independently with no defined interaction   a cost gate, and human review need to compose into ONE\n' +
      '                                            coherent, ordered decision point, not race each other.\n' +
      'Scoped least-privilege roles (Ch 13) that    Least privilege for APPLY does not mean zero access for\n' +
      '  block legitimate incident debugging          DEBUGGING — design a separate, audited read-only role for\n' +
      '                                            on-call diagnosis (Ch 15) alongside the narrow apply role.\n' +
      'Never rehearsing a failure against the       Run a game day: deliberately break a staging apply and see\n' +
      '  full, assembled platform                    whether the assembled pieces (locking, policy, ownership,\n' +
      '                                            CI/CD) help or hinder actual recovery.\n' +
      'Policy/cost/security checks as unordered,    Sequence them deliberately and surface results on ONE combined\n' +
      '  independent CI jobs                          PR check, so a reviewer cannot approve having seen only one\n' +
      '                                            of several required signals.\n' +
      'Treating this reference architecture as a    Revisit it as the org and cloud footprint grow — a platform\n' +
      '  one-time build                               sized for 6 teams needs re-tuning (ownership boundaries,\n' +
      '                                            state splitting) well before it reaches 40.\n' +
      'No single owner for the PLATFORM itself      Someone (usually the platform team, Ch 13) needs to own the\n' +
      '  (only individual pieces owned separately)    end-to-end pipeline\'s coherence, not just each Ch 1-15\n' +
      '                                            practice in isolation.</code></pre>' +
      '<p><b>The real test:</b> pick any one chapter\'s practice in isolation and ask "does this actually help during a real incident, or does it just ' +
      'look correct in a design doc?" — the answer should hold up under Ch 15\'s exact pressure, not just in a calm PR review.</p>',
      try: [
        ['📖 HashiCorp — platform team reference architecture', 'https://developer.hashicorp.com/well-architected-framework', 'o'],
        ['🚑 Ch 15 — debugging a broken apply', '#ch15', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, the reference architecture is not a checklist of fifteen independently-good practices — it is the claim that they COMPOSE: ' +
      'that a reviewer approving a PR is seeing one coherent signal (policy + cost + a specific reviewed plan), that a scoped credential which limits ' +
      'blast radius during a routine apply does not also cripple an on-call engineer\'s ability to diagnose an incident, and that the whole system has ' +
      'actually been exercised under failure, not just assembled and assumed to work. This is the same "walk me through your Terraform setup" ' +
      'interview question this course opened with — the honest answer is a system, not a list.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Walk me through what happens from a PR opening to a change reaching production, end to end.\n' +
      'A: A thin root module (Ch 5) calling versioned shared modules (Ch 1) opens a PR. CI runs fmt/validate,\n' +
      '   static/policy checks (Ch 4, 6), and a cost diff (Ch 11) against a saved plan; the owning team (Ch 13)\n' +
      '   reviews that SAME plan and approves. Merge triggers an apply of the exact saved plan (Ch 8) using a\n' +
      '   scoped credential (Ch 13) against locked, remote, per-environment state (Ch 2), pulling secrets from\n' +
      '   Vault at apply time (Ch 7). Drift and cost are then monitored continuously, independent of any PR\n' +
      '   (Ch 3, Ch 11).\n\n' +
      'Q: Why does having each individual practice (Ch 1-14) implemented well not guarantee a good platform?\n' +
      "A: The practices have to COMPOSE — an unordered race between a policy check and a cost check can let a\n" +
      '   reviewer approve having seen only one signal; a least-privilege apply role that also blocks read-only\n' +
      '   incident debugging optimizes one concern (blast radius) at the expense of another (recoverability).\n\n' +
      'Q: How do you validate that a reference architecture like this actually works, not just that it was built?\n' +
      'A: Rehearse it against a realistic failure — a game day, a deliberately broken staging apply (Ch 15\'s\n' +
      '   scenario) — and confirm the assembled pieces (locking, scoped roles, policy gates) help recovery\n' +
      '   rather than obstruct it.\n\n' +
      'Q: Who owns the coherence of the end-to-end platform, as opposed to any single practice within it?\n' +
      'A: Typically the platform team (Ch 13) — individual teams own their own modules and applies, but someone\n' +
      "   has to own whether the PIPELINE as a whole (ordering, combined review surface, incident readiness)\n" +
      '   still makes sense as the org and cloud footprint grow.\n\n' +
      'Q: What is the difference between this reference architecture and simply following every chapter\'s advice individually?\n' +
      'A: Following each chapter individually gives you fifteen correct pieces; the reference architecture is\n' +
      '   the explicit design of how they interact — sequencing, shared review surfaces, and rehearsed failure\n' +
      '   modes — which is where most of the real-world risk in a large IaC platform actually lives.</code></pre>',
      try: [
        ['📖 Terraform — Well-Architected Framework', 'https://developer.hashicorp.com/well-architected-framework', 'o'],
        ['🧩 Part 3 — Kubernetes platform engineering', '../learn3/#ch1', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is having each of Chapters 1-14\'s practices implemented well not sufficient for a good IaC platform?',
      opts: [
        'It is sufficient — nothing more is needed once every individual practice is in place',
        'The practices need to COMPOSE correctly — e.g. policy and cost checks need deterministic ordering onto one combined review surface, or a reviewer may approve having seen only partial signal',
        'Terraform automatically composes any set of correctly configured practices',
        'Only Chapters 1-5 matter; the rest are optional extras'],
      ok: 1,
      why: 'Individually correct practices can still fail to compose — e.g. unordered, racing CI checks can let a reviewer approve without seeing every required signal.' },
    { q: 'Why might a least-privilege, narrowly-scoped CI apply role (from Ch 13) actually hurt incident response?',
      opts: [
        'Scoped roles always improve incident response with no downside',
        'If scoped only for `apply` with no read-level debugging access, it can prevent an on-call engineer from running the diagnostic commands needed during a real incident (as in Ch 15)',
        'Scoped roles cannot be used in CI pipelines at all',
        'It has no effect on incident response either way'],
      ok: 1,
      why: 'Least privilege for the routine apply path is good, but if it leaves no separate read-only diagnostic access, it can block the exact debugging steps needed during a real incident.' },
    { q: 'What is the best way to validate that an assembled IaC reference architecture actually works under failure, not just in design?',
      opts: [
        'Review the architecture diagram carefully one more time',
        'Rehearse it against a realistic failure — a game day or a deliberately broken staging apply — to confirm the assembled pieces help rather than hinder recovery',
        'Wait for a real production incident to find out',
        'Add more documentation describing each individual practice'],
      ok: 1,
      why: 'A design review confirms the pieces exist; only rehearsing an actual failure (a game day) confirms they compose to help during a real incident rather than obstruct it.' }
  ]
};
