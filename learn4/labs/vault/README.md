# Vault — dynamic database secrets

Replaces a static, long-lived database password with short-lived,
per-request credentials that Vault generates and automatically revokes.

## Files

- **`setup-dynamic-db-secrets.sh`** — documented walkthrough that enables
  Vault's `database` secrets engine, configures a connection to PostgreSQL,
  and defines two roles (`app-readwrite`, `app-readonly`) with their own
  creation/revocation SQL and TTLs.
- **`app-readwrite-policy.hcl`** — a sample Vault ACL policy scoped to
  exactly what an application using `app-readwrite` needs: read (i.e.
  generate) credentials from that one role, renew/revoke its own leases,
  and read its own static secrets — nothing else.

## Why dynamic secrets

A static database password shared across every app instance has to be
rotated manually, is usually over-scoped because rotating it is painful, and
if it leaks it's valid until someone notices and rotates it by hand. Dynamic
secrets flip that:

- every credential is unique to the process that requested it (traceable to
  exactly one lease, so "who used this login" is answerable)
- every credential expires on its own (`default_ttl` / `max_ttl` in the role)
  even if nobody explicitly revokes it
- revoking one lease (`vault lease revoke <id>`) never affects any other
  caller, unlike rotating a shared static password

## Walkthrough

```sh
export VAULT_ADDR=https://vault.example.internal:8200
export VAULT_TOKEN=...   # a token with admin rights on secret/database
export PG_HOST=db.example.internal
export PG_DATABASE=appdb
export PG_ADMIN_USER=vaultadmin
export PG_ADMIN_PASSWORD=...

./setup-dynamic-db-secrets.sh
```

The script walks through, in order: enabling the engine, configuring the
Postgres connection, rotating the root credential Vault used to connect (so
no human retains it), defining the `app-readwrite` and `app-readonly` roles,
and reading one lease from each as a sanity check.

Then scope what the application itself can do with:

```sh
vault policy write app-readwrite app-readwrite-policy.hcl
```

## Validate locally

```sh
bash -n setup-dynamic-db-secrets.sh
shellcheck setup-dynamic-db-secrets.sh
```

(`app-readwrite-policy.hcl` is Vault's own HCL policy syntax — validated by
`vault policy write` / `vault policy fmt` against a running Vault, not by a
standalone linter.)
