/* DevOps-Infra Learn — Part 4 · Chapter 13: Data Encryption — At Rest &amp; In Transit */
window.CH[13] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>Encryption has two distinct states to cover: <b>at rest</b> (data sitting on a disk — a database volume, an S3 object, a backup) and ' +
      '<b>in transit</b> (data moving over a network — an API call, a database connection). Both matter, and confusing "we encrypt in transit" with ' +
      '"our data is encrypted" is one of the most common gaps in a security review.</p>' +
      '<pre><code>AT REST      disk/object storage encrypted so a stolen drive or leaked backup is unreadable\n' +
      'IN TRANSIT   TLS/mTLS on the wire so a network sniffer between two points sees only ciphertext</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A locked safe AND an armored car — you need both.</b> Encryption in transit is ' +
      'the armored car: nobody can read the documents while they\'re being driven between two buildings. Encryption at rest is the safe those ' +
      'documents get locked into once they arrive. An armored car that delivers to an unlocked filing cabinet protects the data for the ' +
      'least-risky part of its life and leaves it exposed for the rest.</p></div>',
      try: [
        ['📖 AWS — KMS overview', 'https://docs.aws.amazon.com/kms/latest/developerguide/overview.html', 'o'],
        ['🔗 Ch 7 — the KMS/Vault mechanics behind encryption keys', '#ch7', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>DEFAULT ENCRYPTION AT REST (enforce it org-wide, not per-resource opt-in)\n' +
      '  aws s3api put-bucket-encryption --bucket my-bucket --server-side-encryption-configuration \'{\n' +
      '    "Rules": [{ "ApplyServerSideEncryptionByDefault": { "SSEAlgorithm": "aws:kms", "KMSMasterKeyID": "alias/data-key" } }]\n' +
      '  }\'\n' +
      '  # an AWS Config rule enforces this account-wide, flagging/blocking any new unencrypted bucket/volume\n\n' +
      'KEY ROTATION\n' +
      '  aws kms enable-key-rotation --key-id alias/data-key   # AWS rotates the underlying key material yearly,\n' +
      '                                                         automatically, with old versions kept to decrypt\n' +
      '                                                         old data — no re-encryption of existing data needed\n\n' +
      'IN TRANSIT: TLS everywhere, including internal hops\n' +
      '  a request that\'s HTTPS from browser to LB but plain HTTP from LB to backend is NOT "encrypted in\n' +
      '  transit" — it\'s encrypted for one hop and not the other.</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p>Cloud-native ' +
      '<a href="https://docs.aws.amazon.com/kms/latest/developerguide/overview.html" target="_blank" rel="noopener">KMS</a> with default encryption ' +
      'enforced account-wide (via <a href="https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html" target="_blank" rel="noopener">' +
      'AWS Config</a> rules or the org-policy equivalent) plus TLS 1.2+ for every network hop — not just the public-facing one — is the standard ' +
      'baseline.</p></div>',
      try: [
        ['📖 AWS — enabling default encryption for new S3 objects', 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-encryption.html', 'o'],
        ['📖 AWS — KMS automatic key rotation', 'https://docs.aws.amazon.com/kms/latest/developerguide/rotate-keys.html', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The "encrypted" backup that wasn\'t.</b> ' +
      'A team enables encryption on their primary database but a nightly export job writes an unencrypted backup to a separate S3 bucket created ' +
      'before org-wide default encryption was enforced. Nobody notices for a year because "we encrypt our data" was true of the primary resource, and ' +
      'nobody re-checked every derivative copy. An audit finds the gap. The fix: enforce default encryption at the ACCOUNT level (new resources ' +
      'inherit it automatically) rather than resource-by-resource, and periodically scan for exceptions rather than trusting they don\'t exist.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The internal hop nobody encrypted.</b> ' +
      'A service diagram shows "HTTPS" at the edge and everyone assumes end-to-end encryption. A network flow-log review during an unrelated ' +
      'investigation finds that traffic between the load balancer and backend, inside the VPC, is plain HTTP — "internal network" was treated as a ' +
      'security boundary instead of just a convenience. Anyone who could get a foothold inside the VPC (a compromised adjacent service) could read ' +
      'that traffic in plaintext. The fix: TLS/mTLS on every hop (Ch 8), not just the internet-facing one.</p></div>' +
      '<p><b>Rule of thumb:</b> "encrypted" is a claim about a SPECIFIC resource and a SPECIFIC hop — it never generalizes to "everything is safe" ' +
      'without explicitly checking every derivative copy and every network segment.</p>',
      try: [
        ['📖 AWS — Well-Architected data protection', 'https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/data-protection.html', 'o'],
        ['🔗 Ch 8 — mTLS for internal hops', '#ch8', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      'Encryption enabled per-resource, opt-in       Enforce default encryption at the account/org level so\n' +
      '                                              every NEW resource inherits it automatically.\n' +
      'TLS only at the internet-facing edge           Encrypt every network hop, including internal service-\n' +
      '                                              to-service traffic — "internal" is not a security boundary.\n' +
      'Derivative copies (backups, exports, logs)     Audit backups/exports/replicas explicitly — encryption on\n' +
      '  left unencrypted                              the primary resource does not automatically cover copies.\n' +
      'Manual/no key rotation                          Enable automatic key rotation; old key versions are kept\n' +
      '                                              to decrypt existing data, so rotation has zero downtime cost.\n' +
      'Encryption used as the ONLY control              Encryption at rest does not stop an attacker with valid\n' +
      '  ("it\'s encrypted so we\'re fine")              application-level access from reading decrypted data —\n' +
      '                                              it protects against a stolen disk/backup, not a live breach.</code></pre>' +
      '<p><b>The real test:</b> pick any data store — including backups, replicas, and logs derived from it — and confirm encryption independently ' +
      'for each, rather than assuming coverage inherited from the primary resource\'s configuration.</p>',
      try: [
        ['📖 AWS — data encryption whitepaper', 'https://docs.aws.amazon.com/whitepapers/latest/logical-separation/encryption-and-key-management.html', 'o'],
        ['🔗 Ch 10 — proving encryption for an audit', '#ch10', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, encryption is understood by <b>what threat it actually defends against</b>, not as a blanket "we\'re secure" checkbox. ' +
      'Encryption at rest defends against a stolen disk or leaked backup; it does nothing against an attacker with valid application-level access, ' +
      'who sees decrypted data the same as a legitimate user. That distinction is exactly why encryption is one layer among many (IAM, network ' +
      'security, zero trust), never a substitute for the others.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What threat does encryption at rest actually defend against, and what does it NOT defend against?\n' +
      'A: It defends against physical/out-of-band exposure — a stolen disk, a leaked backup, a misconfigured\n' +
      '   snapshot shared publicly. It does NOT defend against an attacker who has valid application-level or\n' +
      '   database-level access, since the application decrypts data transparently for any authorized reader —\n' +
      '   that\'s an IAM/access-control problem, not an encryption problem.\n\n' +
      'Q: Why is "HTTPS at the load balancer" not sufficient to claim "encrypted in transit"?\n' +
      'A: Encryption in transit is a claim about every hop the data travels, not just the internet-facing one.\n' +
      '   Traffic from the LB to the backend, or between internal services, must also be encrypted (TLS/mTLS)\n' +
      '   or an attacker with access to the internal network segment can read it in plaintext.\n\n' +
      'Q: How does automatic key rotation work without needing to re-encrypt all existing data?\n' +
      'A: A KMS keeps prior key material versions available for decryption while new encryption operations use\n' +
      '   the newest version — existing ciphertext stays readable under its original key version, so rotation\n' +
      '   has no re-encryption cost or downtime.\n\n' +
      'Q: A team enforces encryption on their primary database but a nightly export to a separate bucket goes\n' +
      '   out unencrypted for a year undetected. What process gap allowed this?\n' +
      'A: Encryption was enforced resource-by-resource rather than as an account/org-wide default that new\n' +
      '   resources automatically inherit, and there was no recurring scan for exceptions — the fix is both an\n' +
      '   org-wide default AND periodic auditing, since defaults alone don\'t catch resources created before the\n' +
      '   policy existed.\n\n' +
      'Q: How would you prove to an auditor that "all data is encrypted" rather than just asserting it?\n' +
      'A: Pull a continuously-generated compliance report (Ch 10\'s Config-rule-style evidence) enumerating every\n' +
      '   storage resource and its encryption status, including backups/replicas/logs, plus evidence that TLS\n' +
      '   is enforced on every network hop (e.g. mesh mTLS coverage metrics) — a query against existing\n' +
      '   evidence, not a one-time manual check performed for the audit.</code></pre>',
      try: [
        ['📖 NIST — guidelines for media sanitization/encryption at rest', 'https://csrc.nist.gov/pubs/sp/800/111/final', 'o'],
        ['🔗 Ch 16 — encryption as one layer of the landing zone', '#ch16', 'o']
      ] }
  ],

  quiz: [
    { q: 'What does encryption at rest actually protect against, and what does it NOT protect against?',
      opts: [
        'It protects against everything, including a live attacker with valid application access',
        'It protects against physical/out-of-band exposure like a stolen disk or leaked backup, but does not protect against an attacker with valid application-level access, who sees decrypted data like any authorized user',
        'It only protects data while it is being transmitted over a network',
        'It has no practical security benefit'],
      ok: 1,
      why: 'Encryption at rest addresses a specific threat model (offline/physical exposure); access control (IAM) is what limits who can read decrypted data through the application.' },
    { q: 'Why is "HTTPS at the load balancer" alone not sufficient to claim data is "encrypted in transit"?',
      opts: [
        'HTTPS at the load balancer is always sufficient',
        'Encryption in transit is a claim about every network hop; if the LB-to-backend or internal service-to-service traffic is plain HTTP, an attacker inside that network segment can read it in plaintext',
        'HTTPS cannot be terminated at a load balancer',
        'Internal network traffic is always encrypted automatically'],
      ok: 1,
      why: 'Treating "internal" as inherently secure and leaving internal hops unencrypted is a common gap — every hop needs its own encryption, as covered in Ch 8\'s mTLS discussion.' },
    { q: 'A database is encrypted, but a nightly export job writes an unencrypted backup to a different bucket. What systemic fix addresses this?',
      opts: [
        'Nothing needed — encrypting the primary database is sufficient for all its data',
        'Enforce default encryption at the account/org level so all new resources inherit it, plus periodic scanning for exceptions on resources created before the policy existed',
        'Delete all backups going forward',
        'Encryption automatically propagates to all derivative copies of a resource'],
      ok: 1,
      why: 'Encryption applied resource-by-resource does not automatically cover derivative copies; an org-wide default plus recurring audits catches gaps like this one.' }
  ]
};
