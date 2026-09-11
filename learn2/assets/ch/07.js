/* DevOps-Infra Learn — Part 2 · Chapter 7: Secrets & Sensitive Data in IaC */
window.CH[7] = {
  levels: [
    /* ---------- L1 · Amateur ---------- */
    { html:
      '<p>You need Terraform to set a database password. The tempting shortcut — <code>variable "db_password" { default = "hunter2" }</code> — puts ' +
      'that password in plaintext in your <code>.tf</code> file, your git history forever, AND the state file. A secret in IaC has to travel through ' +
      'the pipeline without ever resting in any of those places unencrypted.</p>' +
      '<pre><code>bad:   variable "db_password" { default = "hunter2" }        # in git, forever, even after you "fix" it\n' +
      'good:  data "vault_generic_secret" "db" { path = "secret/db" }  # fetched at apply time, never committed</code></pre>' +
      '<div class="analogy"><span class="lbl">🎯 Analogy</span><p><b>A hotel safe vs. writing your PIN on a sticky note taped to the door.</b> ' +
      'A secret manager (Vault, KMS, SSM Parameter Store) hands out the secret only to something that proves it is authorized, at the moment it is ' +
      'needed. Writing it directly into your Terraform config is the sticky note — visible to anyone who walks past, and it stays there in git history ' +
      'even after you peel it off.</p></div>',
      try: [
        ['📖 Terraform — sensitive data in state', 'https://developer.hashicorp.com/terraform/language/state/sensitive-data', 'o'],
        ['🔒 Ch 2 — remote state & locking', '#ch2', 'o']
      ] },

    /* ---------- L2 · Beginner ---------- */
    { html:
      '<p>Fetch secrets at apply time from a real secret manager, and mark sensitive values so Terraform redacts them from CLI/log output:</p>' +
      '<pre><code># pull a secret from Vault at apply time — never stored in .tf or committed anywhere\n' +
      'data "vault_generic_secret" "db" {\n' +
      '  path = "secret/data/prod/db"\n' +
      '}\n\n' +
      'resource "aws_db_instance" "main" {\n' +
      '  password = data.vault_generic_secret.db.data["password"]\n' +
      '}\n\n' +
      '# mark a variable/output sensitive — Terraform redacts it from plan/apply CLI output\n' +
      'variable "api_key" {\n' +
      '  type      = string\n' +
      '  sensitive = true\n' +
      '}\n' +
      'output "connection_string" {\n' +
      '  value     = "postgres://...${var.api_key}..."\n' +
      '  sensitive = true\n' +
      '}</code></pre>' +
      '<div class="standard"><span class="lbl">🔧 Standard</span><p><b>HashiCorp Vault</b> is the widely-adopted, cloud-agnostic standard for ' +
      'dynamic secrets; cloud-native equivalents (AWS Secrets Manager/SSM Parameter Store, Azure Key Vault, GCP Secret Manager) are the standard when ' +
      'you are fully committed to one cloud. Critically: <code>sensitive = true</code> hides a value from CLI OUTPUT only — it is still stored ' +
      'in plaintext inside the state file, so state encryption (Ch 2) is not optional once secrets are involved.</p></div>',
      try: [
        ['📖 HashiCorp Vault — Terraform provider', 'https://registry.terraform.io/providers/hashicorp/vault/latest/docs', 'o'],
        ['📖 Terraform — sensitive input variables', 'https://developer.hashicorp.com/terraform/language/values/variables#suppressing-values-in-cli-output', 'o']
      ] },

    /* ---------- L3 · Builder ---------- */
    { html:
      '<div class="reallife"><span class="lbl">🏭 Scenario A</span><p><b>The leaked state file.</b> ' +
      'A team correctly marks a database password variable <code>sensitive = true</code> so it never shows up in CI logs — but the state file, which ' +
      'stores the same password in plaintext regardless of the sensitive flag, is later exposed when a misconfigured S3 bucket policy briefly makes ' +
      'the state bucket public. Every secret ever applied through that state file needs rotation, not just the one that leaked. Fix: encrypt state at ' +
      'rest AND in the backend\'s access policy (least-privilege bucket policy, private-only access), treat the state file itself as a secret-bearing ' +
      'artifact requiring the same access controls as a secrets manager — and rotate secrets on a schedule regardless, so any single leak has a short ' +
      'shelf life.</p></div>' +
      '<div class="reallife"><span class="lbl">🏭 Scenario B</span><p><b>The secret-scanning gate that caught it — barely.</b> ' +
      'An engineer, testing locally, hardcodes an API key into a <code>.tf</code> file "just to get it working," intending to remove it before ' +
      'committing — and forgets. A pre-commit/pre-push <code>gitleaks</code> or <code>trufflehog</code> scan in CI catches the pattern and fails the ' +
      'push before it reaches the shared branch, but the key was still briefly in a local commit. Fix: the same secret scanner should run as a local ' +
      'pre-commit hook (not just CI) so the leak is caught before ANY commit is made, and any credential that did touch a commit — even one that never ' +
      'reached the remote — is treated as compromised and rotated, since local git history is not a trust boundary.</p></div>',
      try: [
        ['📖 gitleaks — secret scanning', 'https://github.com/gitleaks/gitleaks', 'o'],
        ['📜 Ch 4 — policy as code', '#ch4', 'o']
      ] },

    /* ---------- L4 · Advanced ---------- */
    { html:
      '<pre><code>ANTI-PATTERN                              FIX\n' +
      'Secret as a plaintext default value        Fetch from a secret manager (Vault, Secrets Manager, SSM) at\n' +
      '                                            apply time — never write the value into .tf at all.\n' +
      'Assuming sensitive=true protects state       sensitive=true redacts CLI/log OUTPUT only. The value is still\n' +
      '                                            plaintext in the state file — encrypt state at rest regardless.\n' +
      'Secrets passed via -var on the CLI           Shell history and process lists can capture CLI args. Use\n' +
      '                                            -var-file with a gitignored file, or better, a secret-manager\n' +
      '                                            data source that never touches the shell at all.\n' +
      'No secret rotation after a suspected leak    Any credential that touched a local commit, a log, or an\n' +
      '                                            exposed state file is compromised — rotate it, do not just\n' +
      '                                            delete the artifact that exposed it.\n' +
      'Secret scanning only runs in CI               Run gitleaks/trufflehog as a pre-commit hook too, so a leak is\n' +
      '                                            caught before it ever enters local git history, not just before\n' +
      '                                            it reaches the remote.\n' +
      'Static, long-lived credentials for            Prefer dynamic, short-lived secrets (Vault dynamic DB creds,\n' +
      '  Terraform\'s own cloud access                 OIDC federation for CI cloud auth) over a long-lived static\n' +
      '                                            access key sitting in a CI secret store indefinitely.</code></pre>' +
      '<p><b>The real test:</b> if your state file leaked today, do you know exactly which secrets it contains and can you rotate all of them within ' +
      'hours — or would you first have to figure out what was even in there?</p>',
      try: [
        ['📖 Terraform — Vault provider dynamic secrets', 'https://registry.terraform.io/providers/hashicorp/vault/latest/docs/guides/using-vault-with-terraform', 'o'],
        ['🔁 Ch 8 — CI/CD for infrastructure', '#ch8', 'o']
      ] },

    /* ---------- L5 · Expert ---------- */
    { html:
      '<p>At expert level, secrets in IaC is a <b>trust chain</b> problem end to end: the CI runner\'s own identity (ideally short-lived, OIDC-federated, ' +
      'not a static key), the secret manager\'s access policy, the state backend\'s encryption and access policy, and CLI/log redaction are all links in ' +
      'one chain — and the chain is only as strong as its weakest link. A perfectly configured Vault integration is undone by an unencrypted, ' +
      'publicly-readable state bucket.</p>' +
      '<p><b>🎯 Interview drill</b></p>' +
      '<pre><code>Q: Does marking a Terraform variable `sensitive = true` keep it out of the state file?\n' +
      'A: No. It only redacts the value from CLI/log OUTPUT during plan/apply. The value is still stored in\n' +
      "   plaintext inside the state file itself — state encryption at rest is required regardless of the flag.\n\n" +
      'Q: Why prefer a data source pulling from Vault/Secrets Manager over a Terraform variable with a secret value?\n' +
      "A: The variable's value has to originate somewhere — a .tfvars file, a CLI flag, or shell env — all of\n" +
      '   which risk being committed, logged, or captured in shell history. A data source fetches the secret at\n' +
      '   apply time directly from the secret manager, so the plaintext value never has to exist as a file or arg.\n\n' +
      'Q: A secret was briefly committed locally but never pushed to the remote. Is it still compromised?\n' +
      "A: Treat it as compromised and rotate it. Local git history isn't a trust boundary — it can be pushed\n" +
      '   later by accident, synced by a backup tool, or read by anything with local filesystem access.\n\n' +
      'Q: How should Terraform itself authenticate to the cloud provider in CI, ideally?\n' +
      'A: Short-lived, OIDC-federated credentials (e.g. GitHub Actions OIDC → AWS IAM role) rather than a static,\n' +
      '   long-lived access key stored as a CI secret — federation means no long-lived credential exists to leak\n' +
      '   in the first place.\n\n' +
      'Q: If a state file is discovered to have leaked, what is the correct response?\n' +
      'A: Treat every secret referenced anywhere in that state file as compromised and rotate all of them —\n' +
      "   not just ones you can confirm were viewed — since you generally can't prove what an attacker did or\n" +
      "   didn't read.</code></pre>",
      try: [
        ['📖 HashiCorp — secrets management overview', 'https://developer.hashicorp.com/vault/docs/use-cases/secrets-management', 'o'],
        ['🔀 Ch 12 — blue/green & zero-downtime infra changes', '#ch12', 'o']
      ] }
  ],

  quiz: [
    { q: 'What does setting `sensitive = true` on a Terraform variable actually protect against?',
      opts: [
        'It removes the value from the state file entirely',
        'It redacts the value from CLI/log output during plan and apply, but the value is still stored in plaintext in the state file',
        'It automatically encrypts the value in transit to the provider API',
        'It prevents the variable from being referenced by any resource'],
      ok: 1,
      why: 'sensitive=true is output redaction only. The state file still contains the plaintext value, so state encryption at rest remains necessary.' },
    { q: 'Why is fetching a secret via a Vault/Secrets Manager data source at apply time preferred over a hardcoded variable default?',
      opts: [
        'It makes Terraform apply run faster',
        'The plaintext value never needs to exist as a committed file or CLI argument, closing off the git-history and shell-history leak paths entirely',
        'Data sources are required by Terraform for all string values',
        'It removes the need for state file encryption'],
      ok: 1,
      why: 'A hardcoded default or CLI-passed variable requires the plaintext to exist somewhere (a file, shell history); a secret-manager data source fetches it directly at apply time without that exposure.' },
    { q: 'A database credential was briefly committed to a local git branch but never pushed to the remote. What is the correct response?',
      opts: [
        'No action needed since it never left the local machine',
        'Treat it as compromised and rotate it — local git history is not a reliable trust boundary',
        'Just delete the local branch and move on',
        'Only rotate it if CI logs also show the value'],
      ok: 1,
      why: 'Local commits can be pushed later by accident, synced elsewhere, or read by anything with filesystem access — any credential that touched a commit should be rotated.' }
  ]
};
