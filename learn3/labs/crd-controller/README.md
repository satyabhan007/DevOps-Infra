# CRD + controller — EnvironmentClaim

A minimal but complete example of extending the Kubernetes API: a
`CustomResourceDefinition` plus the `controller-runtime` skeleton of the
operator that would reconcile it. See Chapter 6 ("Extending the API: CRDs
and Operators") for the full walkthrough.

The scenario: an internal developer platform lets app teams self-serve
short-lived preview environments by creating an `EnvironmentClaim` instead
of filing a ticket. The controller turns each claim into a `Namespace`, a
sized `ResourceQuota`, and (optionally) a `NetworkPolicy`, and tears the
namespace down again on deletion or TTL expiry.

## Files

- `crd.yaml` — the `CustomResourceDefinition` (`apiextensions.k8s.io/v1`),
  with a full OpenAPI v3 schema (`spec.owner`, `spec.template` enum,
  `spec.ttlHours`, `spec.networkIsolation`, and a `status` subresource with
  `phase`/`namespace`/`expiresAt`/`conditions`), plus `additionalPrinterColumns`
  so `kubectl get environmentclaims` is readable out of the box.
- `sample-environmentclaim.yaml` — a `platform.example.com/v1alpha1
  EnvironmentClaim` instance you can `kubectl apply` once the CRD is
  installed.
- `controller/` — a real `controller-runtime` skeleton. It's illustrative
  (no RBAC/webhook manifests, no tests) but it does actually compile:
  `go build ./...` and `go vet ./...` both pass clean with `go.mod`/`go.sum`
  as committed (verified with Go 1.23).
  - `api/v1alpha1/environmentclaim_types.go` — the Go types + kubebuilder
    markers that `crd.yaml` was hand-derived from.
  - `api/v1alpha1/groupversion_info.go` — scheme registration boilerplate.
  - `api/v1alpha1/zz_generated.deepcopy.go` — the `DeepCopyObject`
    implementations `controller-gen` would normally generate from the
    markers above; hand-written here so the module builds without running
    that tool.
  - `controllers/environmentclaim_controller.go` — the `Reconcile` loop:
    finalizer handling, `CreateOrUpdate` for the owned objects, TTL-aware
    requeueing, and `SetupWithManager` watches on owned resources.
  - `controllers/helpers.go` — small string/quantity helpers used above.
  - `main.go` — the manager entrypoint (leader election, health probes).
  - `go.mod` / `go.sum` — pin `k8s.io/{api,apimachinery,client-go}` v0.30.3
    and `controller-runtime` v0.18.4.

## Try it (schema only — no controller needed to see the CRD work)

```sh
kubectl apply -f crd.yaml
kubectl apply -f sample-environmentclaim.yaml
kubectl get environmentclaims -A   # or: kubectl get ec -A
kubectl get ec pr-4821-preview -n platform-claims -o yaml
```

Try an invalid claim (`template: xlarge`) and watch the API server reject it
with the enum validation error straight from the OpenAPI schema — this is
the payoff of writing a real schema instead of `x-kubernetes-preserve-unknown-fields`.

## What's intentionally left out

RBAC YAML, a `Dockerfile`, and a `kustomization.yaml` for `config/` — all of
which `kubebuilder` scaffolds automatically alongside the Go source already
here. Run `kubebuilder init` locally if you want the full project layout.
