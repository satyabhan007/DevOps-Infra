# Kyverno — policy as code

Three `ClusterPolicy` admission policies, each paired with a sample Pod that
passes and one (or more) that fails it. See Chapter 11, "Policy as Code
with Kyverno".

## Policies

| File | Requires | Failure mode it catches |
|---|---|---|
| `policy-require-resource-limits.yaml` | CPU + memory requests and limits on every container | A Pod with no `resources` block that can starve its node |
| `policy-disallow-latest-tag.yaml` | An explicit, non-`:latest` image tag | A floating tag that makes redeploys non-reproducible |
| `policy-require-labels.yaml` | `app.kubernetes.io/name` and `team` labels | A Pod nobody can attribute cost or paging to |

All three use `validationFailureAction: Enforce` (block at admission) with
`background: true` (also flag pre-existing violations via the
PolicyReport). Switch to `Audit` while rolling a new policy out to see
matches without blocking anyone.

## Samples

- `samples/pod-pass.yaml` — satisfies all three policies.
- `samples/pod-fail-missing-limits.yaml` — fails `require-resource-limits` only.
- `samples/pod-fail-latest-tag.yaml` — fails `disallow-latest-tag` only.
- `samples/pod-fail-missing-labels.yaml` — fails `require-labels` only.

## Try it

```sh
# install Kyverno once: kubectl create -f https://github.com/kyverno/kyverno/releases/latest/download/install.yaml
kubectl apply -f policy-require-resource-limits.yaml -f policy-disallow-latest-tag.yaml -f policy-require-labels.yaml

kubectl apply -f samples/pod-pass.yaml                  # created
kubectl apply -f samples/pod-fail-missing-limits.yaml    # admission denied
kubectl apply -f samples/pod-fail-latest-tag.yaml        # admission denied
kubectl apply -f samples/pod-fail-missing-labels.yaml    # admission denied

# offline, no cluster needed:
kyverno apply policy-require-resource-limits.yaml policy-disallow-latest-tag.yaml policy-require-labels.yaml \
  --resource samples/pod-pass.yaml \
  --resource samples/pod-fail-missing-limits.yaml \
  --resource samples/pod-fail-latest-tag.yaml \
  --resource samples/pod-fail-missing-labels.yaml
```
