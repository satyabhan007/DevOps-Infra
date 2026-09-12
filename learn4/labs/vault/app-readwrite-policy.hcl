# Sample Vault ACL policy for an application that needs read-write
# dynamic database credentials from the "app-readwrite" role configured
# by setup-dynamic-db-secrets.sh, plus read access to its own static
# secrets under secret/data/app/.
#
# Apply with:
#   vault policy write app-readwrite app-readwrite-policy.hcl
#
# Then attach it to the app's auth method (e.g. a Kubernetes auth role):
#   vault write auth/kubernetes/role/app \
#     bound_service_account_names=app \
#     bound_service_account_namespaces=default \
#     policies=app-readwrite \
#     ttl=1h

# Issue fresh dynamic DB credentials from the app-readwrite role.
# Read-only, because "read" on database/creds/* is what *generates* a new
# lease — the app never needs to write or delete roles here.
path "database/creds/app-readwrite" {
  capabilities = ["read"]
}

# Let the app renew and revoke the leases it holds, but not manage anyone
# else's leases or the lease system in general.
path "sys/leases/renew" {
  capabilities = ["update"]
}

path "sys/leases/revoke" {
  capabilities = ["update"]
}

# Static application secrets (API keys, third-party tokens) live under
# secret/data/app/ — read-only, no list, so the app can't enumerate what
# other secrets exist alongside its own.
path "secret/data/app/*" {
  capabilities = ["read"]
}

# Explicitly no access to any other database role, any other app's secrets,
# or Vault's own configuration/policy/auth endpoints. Everything not
# listed above is denied by default — Vault policies are deny-by-default,
# so this file is the complete grant, not an example subset.
