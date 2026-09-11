/* DevOps-Infra Learn — Part 4 · Chapter 16: The Secure Cloud Landing Zone — Reference Architecture */
window.CH[16] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>This closing chapter assembles every piece of Part 4 into one picture: a <b>landing zone</b> — the standardized, pre-secured foundation ' +
      'every new account/environment is built from, so "how do we securely stand up a new environment" is answered once, correctly, instead of ' +
      'reinvented (and re-risked) by every team that needs one.</p>' +
      '<pre><code>Org root\n' +
      '  ├─ Security account    (centralized logging, GuardDuty/threat detection, audit tooling)\n' +
      '  ├─ Shared services      (Vault, CI/CD, DNS, the transit gateway hub)\n' +
      '  ├─ Prod account(s)      VPC (Ch1) + IAM (Ch5) + encryption (Ch13) + compliance controls (Ch10)\n' +
      '  └─ Dev/staging account(s)  same pattern, isolated from prod by account boundary, not just IAM</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A building code, not a custom-built house every time.</b> Without a landing ' +
      'zone, every new team "builds their own house" — some remember fire exits (encryption), some don\'t; some wire the alarm system (logging) ' +
      'correctly, some skip it under deadline pressure. A landing zone is the building code baked into a template: every new structure inherits smoke ' +
      'detectors, marked exits, and code-compliant wiring automatically, because those aren\'t optional decisions left to each builder anymore.</p></div>',
      try: [
        ['📖 AWS — what is AWS Control Tower (landing zone automation)', 'https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html', 'o'],
        ['🔗 Ch 1 — the VPC pattern every account in this zone uses', '#ch1', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>WHAT A LANDING ZONE ACTUALLY BAKES IN, PER NEW ACCOUNT (every earlier chapter, automated)\n' +
      '  Networking (Ch1, Ch4)     a 3-tier VPC from the standard module, auto-attached to the transit gateway\n' +
      '  Identity (Ch5, Ch11)      federated SSO only — no local IAM users createable by default\n' +
      '  Secrets (Ch7)             Vault namespace provisioned, KMS keys created with rotation on by default\n' +
      '  Certificates (Ch8)        cert-manager pre-installed, pointed at the org\'s internal CA\n' +
      '  Network security (Ch9)    baseline security groups + a default-deny NetworkPolicy in every namespace\n' +
      '  Compliance (Ch10)         CIS benchmark Config rules attached automatically, reporting to Security Hub\n' +
      '  Logging                   CloudTrail + VPC Flow Logs shipped to the central Security account by default\n\n' +
      '  # a new account is provisioned via Terraform/Control Tower from this template — a team asks for an\n' +
      '  # account and gets ALL of the above already wired, not a checklist to complete themselves.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>' +
      '<a href="https://docs.aws.amazon.com/controltower/latest/userguide/what-is-control-tower.html" target="_blank" rel="noopener">AWS Control Tower</a> ' +
      '(or an equivalent Landing Zone Accelerator / GCP organization policy set) is the standard automation for provisioning new accounts pre-wired ' +
      'with exactly this baseline, enforced by <a href="https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html" target="_blank" rel="noopener">' +
      'Service Control Policies</a> that make the guardrails non-optional, not just default.</p></div>',
      try: [
        ['📖 AWS — Landing Zone Accelerator', 'https://aws.amazon.com/solutions/implementations/landing-zone-accelerator-on-aws/', 'o'],
        ['📖 AWS — Service Control Policies (org-wide guardrails)', 'https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>Before the landing zone: 40 accounts, 40 different foundations.</b> ' +
      'A company grows to 40 AWS accounts, each created ad hoc by whichever team needed one, following whatever that team happened to know about ' +
      'security at the time. A security review finds wildly inconsistent baselines: some accounts have no centralized logging at all, some allow ' +
      'local IAM users to bypass SSO, encryption defaults vary account to account. Standardizing after the fact means auditing and fixing 40 separate ' +
      'snowflakes instead of enforcing one template — the exact expensive rework Ch 1 warned about for VPC CIDRs, playing out at the org level.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The landing zone that made a real acquisition tractable.</b> ' +
      'A company with a mature landing zone acquires a smaller company with its own, inconsistent cloud footprint. Instead of manually reviewing and ' +
      'patching the acquired company\'s security posture account by account, the integration plan is: migrate workloads into freshly-provisioned ' +
      'landing-zone accounts that already have every Part 4 control baked in, rather than trying to retrofit security onto infrastructure whose ' +
      'history and assumptions nobody on the receiving team fully understands. The landing zone turns "audit and fix someone else\'s ad hoc setup" ' +
      'into "deploy into our known-good template."</p></div>' +
      '<p><b>Rule of thumb:</b> a landing zone\'s value compounds — the 40th account benefits as much from the standard template as the 1st, while ad ' +
      'hoc account creation gets more expensive to unwind with every account added.</p>',
      try: [
        ['📖 AWS — multi-account strategy whitepaper', 'https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/organizing-your-aws-environment.html', 'o'],
        ['🔗 Ch 4 — the transit gateway hub every landing-zone account attaches to', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      'Ad hoc account creation, security            Provision every account from a landing-zone template\n' +
      '  baseline left to each team                    (Control Tower/Landing Zone Accelerator or equivalent IaC).\n' +
      'Guardrails that are defaults (can be           Enforce guardrails as Service Control Policies — a\n' +
      '  turned off) rather than enforced               non-optional org-level boundary, not a default a team\n' +
      '                                                can quietly disable.\n' +
      'Retrofitting security onto existing            Prefer migrating workloads INTO fresh landing-zone\n' +
      '  accounts after the fact                        accounts over patching an ad hoc account\'s history.\n' +
      'One security review catching drift once        Continuous compliance (Ch10) across every account in\n' +
      '  a year, per account                            the landing zone, reporting centrally, always current.\n' +
      'Logging/audit trail scattered per account       Centralize logging (CloudTrail, VPC Flow Logs, app logs)\n' +
      '                                                to one Security account by default — an incident\n' +
      '                                                responder should never need per-account log-access setup.</code></pre>' +
      '<p><b>The real test:</b> provision a brand-new account through the landing zone and, with zero manual setup, confirm it already has ' +
      'network segmentation, federated-only identity, default encryption, baseline compliance checks, and centralized logging — if any of those need ' +
      'a manual step, the landing zone isn\'t actually done.</p>',
      try: [
        ['📖 AWS — Control Tower guardrails reference', 'https://docs.aws.amazon.com/controltower/latest/userguide/controls.html', 'o'],
        ['🔗 Ch 10 — continuous compliance across the whole landing zone', '#ch10', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, a landing zone is the organizational answer to every failure mode this part walked through individually: the CIDR that ' +
      'ran out (Ch1) because there was no allocation plan, the wildcard IAM grant that never got tightened (Ch5), the manually-issued cert that ' +
      'expired (Ch8), the 0.0.0.0/0 rule nobody remembered to close (Ch9), the 40 accounts with inconsistent baselines (this chapter). A landing zone ' +
      'doesn\'t eliminate any single mistake — it changes the unit of enforcement from "every engineer remembers every rule" to "the template makes ' +
      'the secure path the only path."</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What problem does a landing zone actually solve that individual security controls (IAM, encryption,\n' +
      '   network security) don\'t solve on their own?\n' +
      'A: Individual controls only help if every team applies them correctly and consistently. A landing zone\n' +
      '   moves that from "every engineer remembers every control" to "the account template enforces it\n' +
      '   automatically," which is the only way consistency holds at the scale of dozens or hundreds of accounts.\n\n' +
      'Q: Why use Service Control Policies rather than just documenting the landing zone\'s intended defaults?\n' +
      'A: Defaults can be silently changed by a team under pressure (see Ch1\'s CIDR shortcuts, Ch5\'s wildcard\n' +
      '   grants). SCPs enforce a hard boundary at the organization level that no account-level admin can\n' +
      '   override, making the guardrail non-optional rather than merely recommended.\n\n' +
      'Q: Design the landing zone template for a new prod account from scratch, citing what each part solves.\n' +
      'A: A 3-tier VPC (Ch1) attached to the org transit gateway (Ch4); federated-SSO-only identity with no\n' +
      '   local IAM users (Ch5, Ch11); Vault namespace + auto-rotating KMS keys (Ch7); cert-manager against the\n' +
      '   internal CA (Ch8); default-deny NetworkPolicies and baseline security groups (Ch9); CIS Config rules\n' +
      '   reporting to central Security Hub (Ch10); default encryption everywhere (Ch13); CloudTrail/Flow Logs\n' +
      '   shipped centrally for incident response (Ch14).\n\n' +
      'Q: An acquired company has 40 accounts with inconsistent security baselines. Why migrate into a landing\n' +
      '   zone rather than retrofit each account?\n' +
      'A: Retrofitting requires understanding and safely patching 40 different, undocumented historical\n' +
      '   configurations — high risk, high effort, and error-prone. Migrating workloads into fresh, known-good\n' +
      '   landing-zone accounts gets a consistent, audited baseline immediately, at the cost of a migration\n' +
      '   instead of a series of risky in-place fixes.\n\n' +
      'Q: How do you prove a landing zone is actually enforcing its guardrails, not just documenting them?\n' +
      'A: Provision a fresh account through it and verify, with zero manual steps, that every guardrail (network\n' +
      '   segmentation, federated-only identity, default encryption, compliance rules, centralized logging) is\n' +
      '   already active — any guardrail requiring a manual follow-up step is one that will eventually be\n' +
      '   skipped under deadline pressure, recreating the exact problem the landing zone exists to prevent.</code></pre>',
      try: [
        ['📖 AWS — Well-Architected security pillar (full framework)', 'https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html', 'o'],
        ['🔗 Ch 1 — where this part started: one VPC, sized right the first time', '#ch1', 'o']
      ] }
  ],

  quiz: [
    { q: 'What core problem does a landing zone solve that individual security controls (IAM, encryption, etc.) do not solve by themselves?',
      opts: [
        'It makes individual controls unnecessary',
        'It moves consistency from "every engineer must remember every control" to "the account template enforces it automatically," which is the only way it holds at scale',
        'It removes the need for a VPC',
        'It is purely a cost-optimization mechanism'],
      ok: 1,
      why: 'Individual controls only work if consistently applied; a landing zone bakes them into the provisioning template so consistency does not depend on individual memory or diligence.' },
    { q: 'Why use Service Control Policies (SCPs) rather than relying on documented default configurations for a landing zone\'s guardrails?',
      opts: [
        'SCPs are required by AWS for all accounts',
        'SCPs enforce a hard boundary at the organization level that no account-level admin can override, making guardrails non-optional rather than defaults that can be silently changed under pressure',
        'Documented defaults are always sufficient and SCPs add no value',
        'SCPs only apply to billing configuration'],
      ok: 1,
      why: 'A documented default can still be changed by an individual team; an SCP is an enforced organizational boundary that prevents that, closing exactly the kind of gap seen in earlier chapters\' scenarios.' },
    { q: 'Why is migrating an acquired company\'s 40 inconsistent accounts into a landing zone often preferred over retrofitting each one?',
      opts: [
        'Retrofitting is always faster',
        'Retrofitting requires understanding and safely patching many different undocumented historical configurations, while migrating into fresh landing-zone accounts gets a consistent, audited baseline immediately',
        'Migration is required by cloud providers after an acquisition',
        'Retrofitting is not technically possible'],
      ok: 1,
      why: 'A fresh, known-good landing-zone account sidesteps the risk and effort of reverse-engineering and fixing each of many inconsistent, undocumented existing accounts.' }
  ]
};
