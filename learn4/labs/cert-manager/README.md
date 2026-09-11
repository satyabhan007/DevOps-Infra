# cert-manager — automated ACME certificates

A `ClusterIssuer` + `Certificate` pair showing the standard cert-manager
shape for getting a publicly-trusted TLS certificate from Let's Encrypt via
the ACME HTTP-01 challenge, auto-renewed forever.

## Files

- **`cluster-issuer.yaml`** — a cluster-wide `ClusterIssuer` registering an
  ACME account with Let's Encrypt's production endpoint and solving
  challenges via HTTP-01 through an `nginx` ingress class.
- **`certificate.yaml`** — a `Certificate` requesting `app.example.com` /
  `www.app.example.com` from that issuer, written to the
  `app-example-com-tls` Secret.

## How it fits together

```
ClusterIssuer (letsencrypt-prod)
        │ issuerRef
        ▼
Certificate (app-example-com-tls)
        │ cert-manager solves an HTTP-01 challenge, then writes:
        ▼
Secret (app-example-com-tls: tls.crt, tls.key)
        │ referenced by
        ▼
Ingress  spec.tls[].secretName: app-example-com-tls
```

Apply the issuer once per cluster, then one `Certificate` per hostname (or
let cert-manager's ingress-shim annotate an `Ingress` directly and skip
writing `Certificate` resources by hand — this example shows the explicit
form because it's what you debug against when auto-issuance isn't working).

## Before using this in a real cluster

1. Install cert-manager's CRDs and controller first — these two resources
   assume the `cert-manager.io/v1` API is already registered.
2. Change `spec.acme.email` in `cluster-issuer.yaml` to a real mailbox —
   Let's Encrypt sends expiry warnings there if renewal ever fails.
3. Point at the **staging** ACME server
   (`https://acme-staging-v02.api.letsencrypt.org/directory`) while testing.
   Production has a rate limit of 5 duplicate certificates per week per
   exact domain set — easy to hit while iterating on a Certificate spec.
4. Confirm `ingressClassName: nginx` matches the ingress controller actually
   running in the cluster; HTTP-01 requires that controller to be reachable
   on port 80 from the public internet for the challenge to resolve.

## Validate locally

```sh
yamllint cluster-issuer.yaml certificate.yaml
kubeconform -ignore-missing-schemas cluster-issuer.yaml certificate.yaml
```

`-ignore-missing-schemas` is required because cert-manager's CRDs
(`ClusterIssuer`, `Certificate`) aren't in kubeconform's default
built-in Kubernetes schema set.
