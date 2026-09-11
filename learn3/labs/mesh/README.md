# Service mesh — Istio canary traffic split

A `VirtualService` + `DestinationRule` pair that canaries a new
`recommendations` version behind a 90/10 weighted split, with an opt-in
header for internal testers. See Chapter 13, "Service Mesh with Istio".

## Files

- `destinationrule.yaml` — defines the `v1`/`v2` subsets (selected by the
  `version` Pod label), a bounded connection pool, and outlier detection
  that ejects a pod for 30s after 5 consecutive 5xx responses.
- `virtualservice.yaml` — two route rules evaluated in order:
  1. Requests carrying `x-canary: true` always go to `v2` — lets the
     owning team validate the canary directly, at any traffic weight.
  2. Everything else splits 90/10 between `v1` and `v2`, with a 2s
     timeout and two retries on `5xx`/`reset`/`connect-failure`.

## Try it

```sh
kubectl apply -f destinationrule.yaml -f virtualservice.yaml

# watch the split in action
for i in $(seq 1 20); do
  kubectl exec deploy/sleep -c sleep -- \
    curl -s -o /dev/null -w "%{http_code} " http://recommendations.storefront.svc.cluster.local/version
done

# force the canary regardless of weight
kubectl exec deploy/sleep -c sleep -- \
  curl -s -H 'x-canary: true' http://recommendations.storefront.svc.cluster.local/version
```

## Rolling the split forward

Bump `weight` in `virtualservice.yaml` (90/10 -> 50/50 -> 0/100) as the
canary earns confidence, then delete the `v1` subset and Deployment once
`v2` is fully promoted. A progressive-delivery controller (Flagger, Argo
Rollouts) automates exactly this loop, gated on the error/latency metrics
Istio's sidecars already emit.
