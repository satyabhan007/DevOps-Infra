/* DevOps-Infra Learn — Part 4 · Chapter 7: Secrets Management — Vault &amp; Cloud KMS */
window.CH[7] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>A <b>secret</b> is anything that grants access if leaked — a database password, an API key, a TLS private key. The single biggest upgrade ' +
      'a team can make is getting secrets OUT of config files and source code and into a system built specifically to store, rotate, and audit them: ' +
      'a secrets manager like <b>HashiCorp Vault</b> or a cloud <b>KMS (Key Management Service)</b>.</p>' +
      '<pre><code>BAD    password = "hunter2"   committed straight into config.yaml, visible in git history forever\n' +
      'GOOD   app asks Vault for a fresh DB credential at startup; Vault generates one that expires in 1 hour</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A hotel safe instead of writing the combination on a sticky note.</b> A password ' +
      'in a config file is a sticky note taped to the desk — anyone who walks by (or clones the repo) reads it. A secrets manager is the in-room safe: ' +
      'you request access, it\'s logged who opened it and when, and the "combination" (a dynamic credential) can be changed automatically without ' +
      'reprinting a single sticky note.</p></div>',
      try: [
        ['📖 HashiCorp Vault — what is Vault', 'https://developer.hashicorp.com/vault/docs/what-is-vault', 'o'],
        ['📖 AWS KMS — overview', 'https://docs.aws.amazon.com/kms/latest/developerguide/overview.html', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<pre><code>DYNAMIC SECRETS (the Vault feature that changes everything)\n' +
      '  vault write database/config/my-postgres \\\n' +
      '    plugin_name=postgresql-database-plugin \\\n' +
      '    connection_url="postgresql://{{username}}:{{password}}@db:5432/app" \\\n' +
      '    allowed_roles="app-role"\n' +
      '  vault write database/roles/app-role \\\n' +
      '    db_name=my-postgres \\\n' +
      '    creation_statements="CREATE ROLE \\"{{name}}\\" WITH LOGIN PASSWORD \\"{{password}}\\" VALID UNTIL \\"{{expiration}}\\";" \\\n' +
      '    default_ttl="1h" max_ttl="24h"\n' +
      '  # every app instance gets its OWN unique, auto-expiring DB credential — nothing to rotate manually,\n' +
      '  # nothing shared across instances, and a leaked credential is useless within the hour.\n\n' +
      'ENVELOPE ENCRYPTION (how KMS protects data without KMS touching the data itself)\n' +
      '  1. KMS generates a data key (DEK) and hands you BOTH the plaintext DEK and an encrypted copy\n' +
      '  2. you encrypt your actual data with the plaintext DEK locally, then discard the plaintext DEK\n' +
      '  3. store the ENCRYPTED DEK alongside the encrypted data; to decrypt, ask KMS to decrypt the DEK first</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><a href="https://developer.hashicorp.com/vault/docs" target="_blank" rel="noopener">' +
      'HashiCorp Vault</a> is the industry-standard secrets manager for dynamic secrets across multiple backends (databases, cloud IAM, PKI); ' +
      'for encryption keys specifically, cloud-native <a href="https://docs.aws.amazon.com/kms/latest/developerguide/overview.html" target="_blank" rel="noopener">' +
      'AWS KMS</a> (or GCP/Azure Key Management) is standard for envelope encryption integrated with the rest of the cloud platform.</p></div>',
      try: [
        ['📖 Vault — dynamic secrets for databases', 'https://developer.hashicorp.com/vault/docs/secrets/databases', 'o'],
        ['📖 AWS — envelope encryption concepts', 'https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html#enveloping', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The credential rotation that used to take a maintenance window.</b> ' +
      'Before Vault, rotating a shared database password meant coordinating a deploy across every service that used it, in the right order, during a ' +
      'maintenance window, because the password was baked into each service\'s config at deploy time. After migrating to Vault dynamic secrets, each ' +
      'service requests its own short-lived credential independently — rotating "the" credential is meaningless because there is no longer one shared ' +
      'credential to rotate, only ephemeral ones that expire on their own. What was a risky, planned event becomes a non-event.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The leaked credential with no expiration.</b> ' +
      'A static API key is committed to a public GitHub repo by accident. Because it was a long-lived credential with no built-in expiry, it remains ' +
      'valid until someone notices — in this case, three weeks, during which automated scanners had already found and used it. Had the key been ' +
      'a Vault-issued dynamic credential with a 1-hour TTL, the leak would have self-remediated within the hour with zero manual response needed. ' +
      'The incident response afterward: rotate everything (Ch 14), and migrate that integration to short-lived credentials.</p></div>' +
      '<p><b>Rule of thumb:</b> the best secret rotation policy is one where "rotation" is just "expiration" — nothing to remember, nothing to ' +
      'coordinate.</p>',
      try: [
        ['📖 Vault — secrets engines overview', 'https://developer.hashicorp.com/vault/docs/secrets', 'o'],
        ['🔗 Ch 14 — rotating every credential after a breach', '#ch14', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                               FIX\n' +
      'Secrets committed to source control          Use a secrets manager; add pre-commit/CI secret scanning\n' +
      '                                            (e.g. gitleaks) as a backstop, not the primary control.\n' +
      'Long-lived, shared static credentials         Dynamic, per-instance secrets with short TTLs (Vault\n' +
      '                                            database/cloud secrets engines) — nothing shared to leak.\n' +
      'Encryption keys hard-coded or self-managed    Use a managed KMS; let it handle key storage, rotation,\n' +
      '                                            and access logging instead of homegrown key handling.\n' +
      'Secrets passed as plain environment variables  Prefer secrets injected at runtime (e.g. Vault Agent,\n' +
      '  visible in process listings/logs               CSI driver) over env vars dumped in crash logs/`ps`.\n' +
      'No audit trail for who accessed which secret   Use a secrets manager\'s built-in audit log — "who read\n' +
      '                                            this credential and when" must be answerable after an incident.</code></pre>' +
      '<p><b>The real test:</b> leak a non-production credential on purpose during a game day. If the blast radius is "it expired before anyone ' +
      'could misuse it," your secrets architecture is working; if it\'s "we had to scramble to rotate it everywhere," it isn\'t.</p>',
      try: [
        ['📖 Vault — audit devices', 'https://developer.hashicorp.com/vault/docs/audit', 'o'],
        ['🔗 Ch 13 — encryption at rest built on the same KMS', '#ch13', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, secrets management is about shrinking the <b>window of usefulness</b> of any credential that leaks, rather than trying ' +
      'to prevent every possible leak (which is impossible at scale). Dynamic, short-TTL secrets plus envelope encryption plus a complete audit trail ' +
      'together mean a leak is a logged, bounded, self-healing event instead of an open-ended emergency.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: What is a dynamic secret and why is it strictly better than a rotated static one?\n' +
      'A: A dynamic secret is generated on-demand, per consumer, with a built-in TTL — e.g. a fresh database\n' +
      '   user Vault creates when an app starts and destroys when the lease expires. A "rotated" static secret\n' +
      '   is still shared and still valid until someone manually rotates it; a dynamic secret is unique per\n' +
      '   consumer and expires automatically, shrinking blast radius without any manual rotation step.\n\n' +
      'Q: Explain envelope encryption and why you don\'t just send all your data to KMS to encrypt directly.\n' +
      'A: KMS generates a data encryption key (DEK), giving you the plaintext DEK plus an encrypted copy. You\n' +
      '   encrypt data locally with the plaintext DEK (fast, no size limits, no network round trip per byte)\n' +
      '   then discard the plaintext DEK and store only the encrypted one — KMS never sees or transmits your\n' +
      '   actual bulk data, only ever handles the small key.\n\n' +
      'Q: A static API key was committed to a public repo and used by scanners for 3 weeks before detection.\n' +
      '   What two independent fixes address this?\n' +
      'A: (1) Secret scanning in CI/pre-commit to catch the leak fast; (2) migrate that integration to short-\n' +
      '   lived dynamic credentials so even an undetected leak self-remediates within the TTL instead of staying\n' +
      '   valid indefinitely.\n\n' +
      'Q: Why avoid passing secrets as plain environment variables to a container?\n' +
      'A: Env vars are visible via process inspection (/proc, `docker inspect`, crash dumps) and often get\n' +
      '   accidentally logged by frameworks that dump environment on startup — prefer a secrets manager\n' +
      '   injecting via a file/agent sidecar with tighter access controls and no accidental logging path.\n\n' +
      'Q: How does a secrets manager\'s audit log change incident response?\n' +
      'A: It turns "which credentials might this compromised host have touched" from a guess into a query —\n' +
      '   you can enumerate exactly which secrets were read by which identity and when, scoping the rotation\n' +
      '   effort in Ch 14 to what actually needs rotating instead of rotating everything blind.</code></pre>',
      try: [
        ['📖 Vault — dynamic secrets concept overview', 'https://developer.hashicorp.com/vault/docs/secrets/databases', 'o'],
        ['🔗 Ch 8 — Vault as a PKI/certificate authority too', '#ch8', 'o']
      ] }
  ],

  quiz: [
    { q: 'Why is a Vault dynamic database credential strictly better than a rotated static password?',
      opts: [
        'Dynamic credentials are always free while static ones cost money',
        'It is unique per consumer and expires automatically via a TTL, shrinking blast radius without any manual rotation step, unlike a static credential that stays valid (shared) until someone manually rotates it',
        'Dynamic credentials do not require a database connection',
        'There is no real difference'],
      ok: 1,
      why: 'Dynamic secrets are generated per-consumer with a built-in expiration, so a leak self-remediates and nothing is shared across instances to begin with.' },
    { q: 'In envelope encryption, why is data encrypted locally with a data key rather than sent to KMS directly?',
      opts: [
        'KMS cannot encrypt any data at all',
        'KMS generates and returns the data encryption key (DEK); encrypting bulk data locally avoids network round-trips and size limits, while KMS never has to see or transmit the actual bulk data',
        'Local encryption is required by law',
        'KMS only supports encrypting text, not binary data'],
      ok: 1,
      why: 'Envelope encryption keeps the (small) key exchange with KMS separate from (potentially large) bulk data encryption, which happens locally with the plaintext DEK before it is discarded.' },
    { q: 'Why avoid passing secrets as plain environment variables into a container?',
      opts: [
        'Environment variables have a size limit of 4 bytes',
        'They are visible via process inspection and commonly get accidentally logged by frameworks that dump environment on startup or crash',
        'Containers cannot read environment variables',
        'It violates the OCI image spec'],
      ok: 1,
      why: 'Env vars are readable via /proc, `docker inspect`, and crash dumps, and are a common source of accidental secret leakage into logs.' }
  ]
};
