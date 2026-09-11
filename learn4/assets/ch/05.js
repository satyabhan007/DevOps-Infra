/* DevOps-Infra Learn — Part 4 · Chapter 5: IAM Fundamentals */
window.CH[5] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p><b>IAM (Identity and Access Management)</b> answers two questions for every action in the cloud: <i>who are you</i> (authentication) ' +
      'and <i>are you allowed to do this</i> (authorization). Get IAM wrong and every other control — network, encryption, compliance — becomes ' +
      'decoration around a door that was left unlocked.</p>' +
      '<pre><code>Identity (user, role, service)  --request: "delete this S3 bucket"-->  IAM policy evaluation\n' +
      '                                                                       |\n' +
      '                                                            ALLOW or DENY, checked on EVERY call</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A hotel keycard system, not a master key.</b> Every guest gets a card ' +
      'programmed for exactly their room and the gym — not a master key that opens every door "just in case." <b>Least privilege</b> means every ' +
      'identity — human or service — gets a keycard cut for precisely what it needs to do its job, nothing broader, and the card is deactivated the ' +
      'moment it\'s no longer needed.</p></div>',
      try: [
        ['📖 AWS — Introduction to IAM', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html', 'o'],
        ['🔗 Ch 11 — federating identity instead of creating more IAM users', '#ch11', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>AN ACTUAL LEAST-PRIVILEGE IAM POLICY (read-only access to ONE S3 bucket, not all buckets)\n' +
      '{\n' +
      '  "Version": "2012-10-17",\n' +
      '  "Statement": [{\n' +
      '    "Effect": "Allow",\n' +
      '    "Action": ["s3:GetObject", "s3:ListBucket"],\n' +
      '    "Resource": [\n' +
      '      "arn:aws:s3:::reports-bucket",\n' +
      '      "arn:aws:s3:::reports-bucket/*"\n' +
      '    ],\n' +
      '    "Condition": { "StringEquals": { "aws:PrincipalOrgID": "o-example123" } }\n' +
      '  }]\n' +
      '}\n\n' +
      'KEY CONCEPTS\n' +
      '  Role         an identity assumed temporarily (by a user OR a service) — no long-lived credentials\n' +
      '  Policy       a JSON document listing allowed/denied actions on specific resources\n' +
      '  Trust policy who/what is ALLOWED to assume a role (separate from what the role can then DO)\n' +
      '  Access review  a periodic audit: does every grant still map to an actual, current need?</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Prefer <b>IAM roles assumed temporarily</b> over long-lived access keys wherever ' +
      'possible, and use <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_access-analyzer.html" target="_blank" rel="noopener">' +
      'IAM Access Analyzer</a> (or the cloud-native equivalent) to continuously check policies against actual usage — see AWS\'s own ' +
      '<a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html" target="_blank" rel="noopener">IAM best practices</a>.</p></div>',
      try: [
        ['📖 AWS — IAM policy evaluation logic', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html', 'o'],
        ['📖 AWS — IAM Access Analyzer', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access-analyzer-getting-started.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The wildcard that never got revisited.</b> ' +
      'A CI pipeline needs to deploy to one S3 bucket, and under deadline pressure someone grants <code>s3:*</code> on <code>Resource: "*"</code> ' +
      '"just to unblock the release" — meaning to tighten it later. Eighteen months and one compromised CI token later, an attacker with that token ' +
      'can read, modify, or delete every S3 bucket in the account, not just the one the pipeline actually touches. The fix is always scoping ' +
      'to the specific action and resource ARN at grant time — "temporary" wildcards have a well-documented tendency to become permanent.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The orphaned access nobody revoked.</b> ' +
      'An engineer leaves the company; their SSO account is deactivated, but a long-lived IAM access key they created six months earlier for a side ' +
      'project script still works — access keys aren\'t tied to the SSO lifecycle. It\'s discovered three months later during an access review, by ' +
      'which point nobody can say whether it was ever used maliciously. The fix: eliminate long-lived access keys in favor of roles/federation ' +
      '(Ch 11) wherever possible, and run periodic access reviews that specifically hunt for credentials outside the SSO/HR-linked lifecycle.</p></div>' +
      '<p><b>Rule of thumb:</b> every grant should answer "why does this identity need this, right now" — if nobody can answer that in an access ' +
      'review, revoke it and let it be re-requested if it turns out to be needed.</p>',
      try: [
        ['📖 AWS — IAM security best practices', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html', 'o'],
        ['🔗 Ch 10 — access reviews as a compliance control', '#ch10', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      '"Temporary" wildcard action/resource         Scope every policy to the exact action and resource ARN\n' +
      '  grants to unblock a deadline                at grant time — file a follow-up ticket, don\'t "fix later."\n' +
      'Long-lived IAM access keys for humans         Use SSO/federation (Ch 11) with short-lived, assumed-role\n' +
      '                                            credentials — access keys outlive the SSO account lifecycle.\n' +
      'One shared IAM role for an entire service      One role PER service/workload with only what that\n' +
      '  fleet                                        specific workload needs — a compromise of one stays scoped.\n' +
      'No periodic access review                      Schedule recurring reviews that ask "is this grant still\n' +
      '                                            needed" per identity, not just at onboarding.\n' +
      'Root/admin credentials used for daily work    Reserve root/admin for emergencies only, behind MFA and\n' +
      '                                            logged/alerted on every use; do routine work via least-\n' +
      '                                            privilege roles.</code></pre>' +
      '<p><b>The real test:</b> revoke an identity\'s access and watch what breaks. If you cannot predict the blast radius before revoking, the ' +
      'access was scoped too broadly to have been auditable in the first place.</p>',
      try: [
        ['📖 AWS — Well-Architected security pillar (identity)', 'https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/identity-and-access-management.html', 'o'],
        ['🔗 Ch 14 — rotating every credential after a compromise', '#ch14', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, IAM is the <b>single highest-leverage control</b> in cloud security — most real breaches are a credential or a ' +
      'misconfigured policy, not a zero-day. Expert IAM design treats every grant as a liability with a cost (audit surface, blast radius) that ' +
      'must be justified by a concrete need, continuously re-justified, and automatically flagged when unused.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is the principle of least privilege, and how do you operationalize it (not just define it)?\n' +
      'A: Grant only the specific actions on the specific resources an identity needs, nothing broader. Operationally:\n' +
      '   scope every new policy to exact ARNs/actions at write time, run tools like IAM Access Analyzer that\n' +
      '   compare granted vs. actually-used permissions, and schedule recurring access reviews rather than\n' +
      '   relying on people to remember to tighten "temporary" grants.\n\n' +
      'Q: Why prefer roles (assumed temporarily) over long-lived IAM users/access keys?\n' +
      'A: Assumed-role credentials are short-lived and tied to a session, so a leaked credential has a limited\n' +
      '   window of usefulness and rotates automatically. Long-lived access keys don\'t expire on their own and\n' +
      '   commonly outlive the human/service lifecycle that created them (see the orphaned-key scenario).\n\n' +
      'Q: How would you design IAM for a CI/CD pipeline that deploys to production?\n' +
      'A: A dedicated role scoped to exactly the deploy actions and target resources, assumed via short-lived\n' +
      '   federated credentials from the CI provider (OIDC — see Ch 11), never a static access key stored as a\n' +
      '   CI secret; the trust policy restricts which repo/branch can assume it.\n\n' +
      'Q: A service can call an API it clearly shouldn\'t need. How do you debug and fix this?\n' +
      'A: Check the role\'s attached policies and any resource-based policy on the target for an overly broad\n' +
      '   Allow (wildcard action/resource); check for an inherited/attached policy from a group or a permissions\n' +
      '   boundary that\'s wider than intended; then scope the offending statement down to the specific need.\n\n' +
      'Q: What is a permissions boundary and how does it differ from a regular policy?\n' +
      'A: A permissions boundary sets the MAXIMUM permissions an identity can ever have, regardless of what\n' +
      '   other policies grant it — it\'s a ceiling, not a grant. Used to let teams create their own roles/policies\n' +
      '   safely, since no policy they attach can exceed the boundary.</code></pre>',
      try: [
        ['📖 AWS — permissions boundaries for IAM entities', 'https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html', 'o'],
        ['🔗 Ch 6 — zero-trust: authenticate/authorize every request, not just at login', '#ch6', 'o']
      ] }
  ],

  quiz: [
    { q: 'A CI pipeline is temporarily granted s3:* on Resource: "*" to unblock a release, with a plan to tighten it later. What is the real risk?',
      opts: [
        'None, as long as the pipeline itself only ever calls the actions it needs',
        'A compromised CI credential now has full access to every S3 bucket in the account, not just the one the pipeline actually uses — and "temporary" wildcards commonly never get tightened',
        'It will automatically expire after 90 days',
        'S3 wildcards are blocked by AWS by default'],
      ok: 1,
      why: 'The blast radius of a leaked/compromised credential is defined by what the policy allows, not by what the pipeline intends to do — over-broad grants expand that radius unnecessarily.' },
    { q: 'Why are long-lived IAM access keys for humans considered an anti-pattern compared to SSO/federated role assumption?',
      opts: [
        'Access keys are more expensive',
        'Access keys are not tied to the SSO/HR account lifecycle, so they can keep working after an employee leaves or a review misses them, unlike short-lived assumed-role credentials',
        'Access keys cannot be used for API calls',
        'Access keys only work in one AWS region'],
      ok: 1,
      why: 'Deactivating an SSO account does not revoke a separately-created long-lived access key, creating orphaned credentials that periodic reviews must specifically hunt for.' },
    { q: 'What is a permissions boundary?',
      opts: [
        'A firewall rule for IAM API calls',
        'A ceiling on the maximum permissions an identity can ever have, regardless of what other attached policies grant — used to let teams safely create their own roles',
        'A rate limit on IAM policy evaluation',
        'A synonym for a resource-based policy'],
      ok: 1,
      why: 'A permissions boundary caps the effective permissions no matter how permissive other attached policies are, making it safe to delegate role/policy creation to teams.' }
  ]
};
