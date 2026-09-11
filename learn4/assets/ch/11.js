/* DevOps-Infra Learn — Part 4 · Chapter 11: Cloud Identity Federation */
window.CH[11] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p><b>Identity federation</b> means one identity provider (IdP) — like Okta, Google Workspace, or Azure AD — is the single source of truth for ' +
      '"who is this person/service," and every other system (AWS console, GitHub, internal apps) trusts that IdP instead of maintaining its own ' +
      'separate username/password table. Log in once; every federated system already knows who you are.</p>' +
      '<pre><code>User logs into IdP once ---> IdP issues a signed token ---> AWS/GitHub/App trusts the IdP\'s\n' +
      '                                                                signature, no separate password needed</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A hotel keycard that also works at the gym and the parking garage</b> ' +
      'because they all trust the front desk\'s signature, rather than you registering a separate password at each door. When you check out (offboard), ' +
      'deactivating ONE keycard at the front desk revokes access everywhere at once — instead of someone having to remember to also change the gym ' +
      'lock and the garage code.</p></div>',
      try: [
        ['📖 OpenID Foundation — how OIDC works', 'https://openid.net/developers/how-connect-works/', 'o'],
        ['🔗 Ch 5 — IAM roles federation actually assumes', '#ch5', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>OIDC FEDERATION FOR A CI PIPELINE (no long-lived cloud credential stored in CI at all)\n' +
      '  # GitHub Actions requests a short-lived OIDC token, exchanges it for temporary AWS credentials:\n' +
      '  - uses: aws-actions/configure-aws-credentials@v4\n' +
      '    with:\n' +
      '      role-to-assume: arn:aws:iam::123456789012:role/gh-actions-deploy\n' +
      '      aws-region: us-east-1\n' +
      '  # the IAM role\'s trust policy restricts this to ONE repo + branch:\n' +
      '  "Condition": { "StringEquals": {\n' +
      '    "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:ref:refs/heads/main" } }\n\n' +
      'SAML VS OIDC\n' +
      '  SAML   XML-based, older, still common for enterprise SSO into consoles/dashboards\n' +
      '  OIDC   JSON/JWT-based, built on OAuth2, standard for modern apps AND machine-to-machine (CI, workloads)</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>OIDC</b> (' +
      '<a href="https://openid.net/developers/how-connect-works/" target="_blank" rel="noopener">spec</a>) is the modern standard, with ' +
      '<a href="https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html" target="_blank" rel="noopener">AWS IAM Identity Center</a> ' +
      '(or Azure AD/Okta) as the standard IdP for human SSO, and ' +
      '<a href="https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect" target="_blank" rel="noopener">' +
      'GitHub Actions OIDC</a> as the standard pattern for CI-to-cloud federation with zero stored credentials.</p></div>',
      try: [
        ['📖 GitHub — OIDC security hardening for deployments', 'https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect', 'o'],
        ['📖 AWS IAM Identity Center — what is it', 'https://docs.aws.amazon.com/singlesignon/latest/userguide/what-is.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The static AWS key stored as a CI secret, replaced.</b> ' +
      'A team stores a long-lived AWS access key as a GitHub Actions secret to deploy to production. The key gets accidentally logged in a debug step ' +
      'and is now sitting in build logs indefinitely. Migrating to GitHub\'s OIDC federation removes the stored credential entirely — GitHub issues a ' +
      'fresh, short-lived token per workflow run that AWS exchanges for temporary credentials scoped to exactly that repo/branch, so there is no ' +
      'static secret left to leak in the first place.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The offboarding gap.</b> ' +
      'Before federation, an engineer\'s access spans five separate systems, each with its own local account. When they leave, HR deactivates the ' +
      'central IdP account, but two of the five systems had accounts created outside the federation flow (a contractor-era GitHub org invite, a ' +
      'directly-created AWS IAM user) that nobody remembers to revoke. Three months later a security review finds both still active. The fix: enforce ' +
      'that EVERY system is reachable only via the federated IdP — no local account creation path left available at all — so deactivating the IdP ' +
      'account is provably sufficient.</p></div>' +
      '<p><b>Rule of thumb:</b> federation\'s security value only holds if it\'s the ONLY path in — any system with a parallel local-account option ' +
      'quietly reintroduces the exact problem federation was meant to solve.</p>',
      try: [
        ['📖 AWS — IAM roles for web identity federation', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html', 'o'],
        ['🔗 Ch 14 — revoking access fast after a compromise', '#ch14', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      'Long-lived cloud credentials stored as        Use OIDC federation — CI/CD gets short-lived, per-run\n' +
      '  CI/CD secrets                                 credentials scoped to a specific repo/branch, nothing stored.\n' +
      'Parallel local-account creation left            Disable local account creation everywhere federation is\n' +
      '  possible alongside federated SSO               adopted — federation must be the ONLY path in.\n' +
      'Federation trust policy scoped too broadly      Scope the OIDC trust condition to exact repo/branch/\n' +
      '  ("any repo in the org can assume this role")   environment — not the whole org, which any repo could abuse.\n' +
      'No monitoring of federated role assumption       Log and alert on every assumption of a sensitive federated\n' +
      '                                                role — it\'s the highest-leverage identity in the system.\n' +
      'SAML/OIDC metadata never rotated/reviewed        Periodically review IdP-to-provider trust configuration —\n' +
      '                                                a stale or overly permissive trust relationship is a\n' +
      '                                                standing risk few teams revisit after initial setup.</code></pre>' +
      '<p><b>The real test:</b> deactivate one identity in the central IdP and verify — across EVERY connected system — that access is actually gone, ' +
      'not just gone from the systems you remembered to check.</p>',
      try: [
        ['📖 AWS — best practices for OIDC federation trust policies', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_oidc.html', 'o'],
        ['🔗 Ch 6 — federation as the identity layer zero trust checks every request against', '#ch6', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, identity federation is the mechanism that makes <b>offboarding a single, provable action</b> instead of a checklist across ' +
      'dozens of systems — which is precisely why the failure mode to eliminate is any parallel path into a system that bypasses the federated IdP. ' +
      'For machine identities (CI, workloads), federation additionally removes an entire category of long-lived-credential-leak incidents by design, ' +
      'not by policy.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Why is OIDC federation for CI/CD strictly better than storing a static cloud credential as a secret?\n' +
      'A: OIDC federation means no long-lived credential exists to leak — the CI provider issues a short-lived\n' +
      '   token per run, exchanged for temporary cloud credentials scoped by a trust policy to exactly that\n' +
      '   repo/branch. A stored static secret is a permanent liability that can leak via logs, a compromised\n' +
      '   dependency, or a misconfigured step, and remains valid until someone manually rotates it.\n\n' +
      'Q: What is the biggest operational risk in a federated identity setup, beyond the federation mechanism\n' +
      '   itself?\n' +
      'A: Any system that still allows local account creation alongside the federated SSO path. Federation\'s\n' +
      '   entire value — "deactivate one IdP account, access is gone everywhere" — breaks if even one connected\n' +
      '   system has a parallel local-account door that isn\'t tied to the IdP lifecycle.\n\n' +
      'Q: How do you scope an OIDC trust policy for GitHub Actions so it can\'t be abused by an unrelated repo\n' +
      '   in the same org?\n' +
      'A: Add a condition on the token\'s `sub` claim matching the exact repo and branch/environment (e.g.\n' +
      '   `repo:my-org/my-repo:ref:refs/heads/main`), not just the issuer — an unscoped trust policy lets any\n' +
      '   repo in the org that can generate a valid OIDC token assume the role.\n\n' +
      'Q: SAML and OIDC solve similar problems — when might you still need SAML?\n' +
      'A: Many enterprise SSO integrations (legacy SaaS consoles, some dashboards) only support SAML; it remains\n' +
      '   common for human browser-based SSO into third-party apps even as OIDC has become the default for new\n' +
      '   integrations and is essentially required for machine-to-machine federation.\n\n' +
      'Q: An offboarded engineer\'s access was found active on two systems three months after their IdP account\n' +
      '   was deactivated. What is the systemic (not one-time) fix?\n' +
      'A: Audit every connected system for a non-federated account-creation path and close it, then add a\n' +
      '   recurring, automated check that flags any active credential/account not traceable to a current IdP\n' +
      '   identity — treating "orphaned from federation" as its own alertable condition.</code></pre>',
      try: [
        ['📖 OWASP — SAML security cheat sheet', 'https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html', 'o'],
        ['🔗 Ch 12 — secure remote access built on the same federated identity', '#ch12', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is OIDC federation for a CI/CD pipeline considered strictly safer than storing a static cloud access key as a CI secret?',
      opts: [
        'OIDC tokens are encrypted while static keys are not',
        'No long-lived credential exists to leak — the CI provider issues a short-lived, per-run token exchanged for temporary cloud credentials scoped by a trust policy to a specific repo/branch',
        'OIDC federation is faster to configure',
        'Static keys cannot be used with GitHub Actions'],
      ok: 1,
      why: 'Federation eliminates the standing secret entirely; a static key remains a leak-able liability until manually rotated, while an OIDC-derived credential is short-lived by design.' },
    { q: 'What breaks the core security value of identity federation ("deactivate one account, access is gone everywhere")?',
      opts: [
        'Using OIDC instead of SAML',
        'Any connected system that still allows a parallel local-account creation path outside the federated IdP, since deactivating the IdP account does not touch that local account',
        'Federating more than 5 systems at once',
        'Using short-lived tokens instead of long-lived ones'],
      ok: 1,
      why: 'Federation only guarantees complete revocation if it is the sole path into every connected system — any bypass reintroduces the offboarding gap federation is meant to close.' },
    { q: 'How should an OIDC trust policy for GitHub Actions be scoped to prevent abuse by unrelated repos in the same org?',
      opts: [
        'It cannot be scoped beyond the organization level',
        'By adding a condition on the token\'s subject claim matching the exact repo and branch/environment, not just trusting the issuer broadly',
        'By rotating the trust policy weekly',
        'By using a static access key instead'],
      ok: 1,
      why: 'Without a condition restricting the `sub` claim to a specific repo/branch, any repo in the org capable of generating a valid OIDC token could assume the same role.' }
  ]
};
