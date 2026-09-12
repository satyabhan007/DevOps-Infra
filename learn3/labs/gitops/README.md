# GitOps — Argo CD + Kustomize

An `Application` pointed at a Kustomize base/overlay pair, in the file
layout Chapter 9 walks through: Git holds the desired state, Argo CD's
controller continuously reconciles the live cluster to match it and
self-heals any manual `kubectl` drift.

## Files

- `application.yaml` — the Argo CD `Application`. Points at
  `overlays/prod`, with `syncPolicy.automated.selfHeal: true` and
  `prune: true` so it's a real declaration of "Git wins", plus a bounded
  retry/backoff for transient apply failures.
- `base/` — the environment-agnostic resources:
  - `deployment.yaml` — a `platform-api` Deployment with resource
    requests/limits, readiness + liveness probes, and a restrictive
    `securityContext` (non-root, dropped capabilities, read-only root fs).
  - `service.yaml` — a ClusterIP `Service` fronting it.
  - `kustomization.yaml` — lists the two resources and stamps a shared
    `app.kubernetes.io/part-of` label.
- `overlays/prod/kustomization.yaml` — references `../../base`, sets the
  `platform-api-prod` namespace, bumps `replicas` to 5, pins the image tag,
  and applies a strategic-merge-free JSON6902 patch bumping the memory
  limit — showing both the declarative (`replicas:`, `images:`) and patch
  based Kustomize customization styles in one file.

## Try it

```sh
kubectl kustomize overlays/prod        # render what Argo CD would apply
kubectl apply -k overlays/prod         # apply directly, no Argo CD needed
argocd app create -f application.yaml  # or let Argo CD manage it
```

## Why base/overlay instead of Helm here

Kustomize needs no templating language — `base/` is plain, valid Kubernetes
YAML you can `kubectl apply -f` on its own. Overlays are patches, so
`git diff` between environments shows you exactly what's different (5
replicas and a memory bump, here) instead of hiding it behind `{{ if }}`
blocks in a values file.
