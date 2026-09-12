# Part 3 · labs — runnable configs

> Standard tools, at production depth. Every file here is validated in CI
> (`.github/workflows/lab-tests.yml`).

Landing alongside chapters 2–16:

- [`crd-controller/`](crd-controller/) — a minimal `CustomResourceDefinition`
  (`EnvironmentClaim`, with a full OpenAPI v3 schema) plus a
  `controller-runtime` operator skeleton and a sample Custom Resource.
- [`gitops/`](gitops/) — an Argo CD `Application` pointed at a Kustomize
  base/overlay pair (`base/` + `overlays/prod/`), with a real Deployment
  and Service in the base.
- [`kyverno/`](kyverno/) — three `ClusterPolicy` manifests (require
  resource limits, disallow `:latest` tags, require ownership labels)
  with sample Pods that pass or fail each one.
- [`mesh/`](mesh/) — an Istio `VirtualService` + `DestinationRule` canarying
  a service 90/10 between two subsets.
- [`autoscaling/`](autoscaling/) — a Karpenter `NodePool`/`EC2NodeClass`
  and a Cluster Autoscaler deployment, with a short tradeoff writeup.

Each subdirectory has its own README with a "try it" section. Nothing here
needs a live cluster to read or lint; several examples (`kyverno apply`,
`kubectl kustomize`) can also be exercised entirely offline.
