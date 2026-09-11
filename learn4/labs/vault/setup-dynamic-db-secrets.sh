#!/usr/bin/env bash
#
# Walkthrough: configure HashiCorp Vault's database secrets engine to issue
# short-lived, dynamically-generated PostgreSQL credentials instead of a
# static, hand-rotated password baked into an app's config.
#
# This script is a documented reference, not a one-shot installer: read each
# step before running it against a real Vault + Postgres. It assumes:
#   - VAULT_ADDR and VAULT_TOKEN are already exported and the caller has
#     enough privilege to enable/configure secrets engines
#   - a reachable PostgreSQL instance and an admin-capable "vaultadmin" role
#     that Vault will use to create/drop the short-lived app roles
#
# Usage:
#   VAULT_ADDR=https://vault.example.internal:8200 \
#   VAULT_TOKEN=... \
#   PG_HOST=db.example.internal PG_PORT=5432 PG_DATABASE=appdb \
#   PG_ADMIN_USER=vaultadmin PG_ADMIN_PASSWORD=... \
#   ./setup-dynamic-db-secrets.sh

set -euo pipefail

: "${VAULT_ADDR:?set VAULT_ADDR to the Vault API address}"
: "${VAULT_TOKEN:?set VAULT_TOKEN to a token with admin rights on secret/database}"
: "${PG_HOST:?set PG_HOST to the PostgreSQL host}"
: "${PG_PORT:=5432}"
: "${PG_DATABASE:?set PG_DATABASE to the target database name}"
: "${PG_ADMIN_USER:?set PG_ADMIN_USER to the Vault-managing admin role}"
: "${PG_ADMIN_PASSWORD:?set PG_ADMIN_PASSWORD for PG_ADMIN_USER}"

echo "==> 1. Enable the database secrets engine (no-op if already enabled)"
vault secrets enable -path=database database || true

echo "==> 2. Configure the connection Vault uses to manage roles in PostgreSQL"
# allowed_roles restricts which Vault roles (step 3) may use this connection.
# The plugin connects as PG_ADMIN_USER, which needs CREATEROLE in Postgres so
# Vault can create and drop the short-lived app users it issues per-lease.
vault write database/config/appdb \
  plugin_name=postgresql-database-plugin \
  allowed_roles="app-readwrite,app-readonly" \
  connection_url="postgresql://{{username}}:{{password}}@${PG_HOST}:${PG_PORT}/${PG_DATABASE}?sslmode=require" \
  username="${PG_ADMIN_USER}" \
  password="${PG_ADMIN_PASSWORD}"

echo "==> 3. Rotate the root credential Vault just used to connect"
# After the initial config, Vault can rotate PG_ADMIN_USER's own password so
# no human ever needs to know it again — Vault is now the only party that
# knows the current value.
vault write -f database/rotate-root/appdb

echo "==> 4. Define a read-write role: creation SQL + short default TTL"
# creation_statements runs against Postgres every time a lease is requested.
# {{name}}/{{password}}/{{expiration}} are filled in by Vault per-lease.
vault write database/roles/app-readwrite \
  db_name=appdb \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT CONNECT ON DATABASE ${PG_DATABASE} TO \"{{name}}\"; \
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  revocation_statements="REASSIGN OWNED BY \"{{name}}\" TO ${PG_ADMIN_USER}; DROP OWNED BY \"{{name}}\"; DROP ROLE IF EXISTS \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="24h"

echo "==> 5. Define a read-only role for reporting/analytics callers"
vault write database/roles/app-readonly \
  db_name=appdb \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; \
    GRANT CONNECT ON DATABASE ${PG_DATABASE} TO \"{{name}}\"; \
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  revocation_statements="DROP ROLE IF EXISTS \"{{name}}\";" \
  default_ttl="1h" \
  max_ttl="12h"

echo "==> 6. Sanity check: read a fresh lease from each role"
echo "    (each call creates a brand-new Postgres user that Vault will"
echo "     auto-revoke when its lease expires)"
vault read database/creds/app-readwrite
vault read database/creds/app-readonly

echo "==> Done. Point application config at 'vault read database/creds/<role>'"
echo "    (or the Vault Agent template / CSI driver) instead of a static"
echo "    password — every credential issued from here is unique, time-"
echo "    bounded, and individually revocable."
