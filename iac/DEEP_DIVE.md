# Infrastructure as Code — Deep Dive

For readers who have run `terraform apply` a few times and want the
model underneath.

---

## 1. Reconciliation is the whole game

Every serious infra system — Terraform, Kubernetes controllers, Argo CD,
Crossplane — is a **reconciliation loop**:

```
loop forever:
    desired = read_config()          # git, CRD, HCL
    actual  = observe_world()        # cloud APIs, kubelet
    diff    = desired - actual
    if diff: act(diff)               # create / update / delete
    wait()
```

Two properties matter:

- **Level-triggered**, not edge-triggered. The loop does not react to
  "an event"; it re-reads the whole desired and actual state each pass.
  A missed event is harmless — the next sweep catches it. This is why
  Kubernetes self-heals after a network partition.
- **Idempotent `act`**. Applying the same diff twice must be safe. This
  is what makes retries, crashes mid-apply, and scheduled re-applies
  non-destructive.

Terraform runs the loop **once per invocation** (you trigger it).
Kubernetes runs it **continuously** (controllers). GitOps tools bridge
the two: they run Terraform/Kubernetes apply continuously, driven by git.

### Analogy — a ship's autopilot

It does not steer based on "the wave that just hit." Every fraction of a
second it reads *heading now* vs *heading wanted* and nudges the rudder.
Miss a reading and the next one still corrects. That is level-triggered
reconciliation.

---

## 2. The plan/apply split, precisely

```
terraform plan:
  1. refresh   — for every resource in state, call the cloud API,
                 update the cached attributes (this is drift detection)
  2. graph     — build a DAG from resource references
  3. diff      — desired (config) vs refreshed state, per resource
  4. output    — + create   ~ update   -/+ replace   - destroy

terraform apply:
  5. walk the DAG in dependency order, parallelised where independent
  6. call provider CRUD for each node
  7. write new state after EACH resource (crash-safe)
```

`-/+ replace` is the dangerous one: destroy then create. It happens when
a **ForceNew** attribute changes (e.g. an AWS instance's AZ). Catch these
in review. Mitigate with `create_before_destroy`, a `moved` block (if
it is really a rename), or `ignore_changes`.

---

## 3. Provisioning vs configuration management

| | Provisioning | Config management |
|---|---|---|
| Question | "What resources exist?" | "What is installed *inside* a machine?" |
| Tools | Terraform, Pulumi, CloudFormation, Bicep, Crossplane | Ansible, Chef, Puppet, Salt |
| Model | Declarative, state-based | Mostly imperative-ish, often agent-based |
| Trend | Growing | Shrinking — replaced by immutable images |

**Immutable infrastructure** collapses the second column: instead of
mutating a running box with Ansible, you **bake an image** (Packer,
`docker build`) with everything pre-installed, and to change anything you
**replace the box**. No in-place drift is possible because nothing is
ever changed in place.

```
mutable:    launch VM → ansible-playbook (install, configure, patch) → repeat forever
immutable:  packer build AMI → terraform apply (replace ASG) → old VMs terminated
```

Containers are immutable infrastructure taken to its conclusion: the
image is read-only, and "patching" means building a new image and rolling
Pods.

---

## 4. Push vs pull delivery

**Push** (classic CI/CD): a pipeline runs `terraform apply` /
`kubectl apply` from outside the target.

- Simple. The pipeline needs **credentials into** every environment
  (a juicy target).
- The target does not self-correct between pipeline runs.

**Pull** (GitOps): an agent **inside** the target (Argo CD, Flux) watches
git and applies changes itself.

- Credentials stay inside the cluster; nothing external holds prod keys.
- The agent **continuously reconciles** — console drift is reverted
  within minutes automatically.
- Rollback = `git revert`.

Most Kubernetes shops are moving to pull for app delivery; Terraform for
cloud resources is still mostly push (Atlantis, Spacelift, TFC), though
Terraform-in-GitOps (via Crossplane or the TF controller) exists.

---

## 5. Policy as code

Reviews miss things. Encode the rules so CI enforces them:

```
# OPA / Rego, run by conftest against the terraform plan JSON
deny[msg] {
    r := input.resource_changes[_]
    r.type == "aws_s3_bucket"
    r.change.after.acl == "public-read"
    msg := sprintf("public bucket: %s", [r.address])
}
```

- **Terraform**: `conftest`/OPA on `terraform show -json tfplan`, or
  Sentinel (TFC), or `tflint` + `checkov`/`tfsec` for security rules.
- **Kubernetes**: Kyverno or Gatekeeper (OPA) as **admission webhooks** —
  the API server rejects a non-compliant object at write time, so the
  rule holds even for `kubectl apply` by hand.

Typical guardrails: no public storage, encryption required, mandatory
tags/labels, no `:latest` images, resource limits required, no
cluster-admin bindings.

---

## 6. Testing infrastructure code

| Level | Tooling | Catches |
|-------|---------|---------|
| Lint / static | `tflint`, `tfsec`, `checkov`, `hadolint`, `kubeconform` | Bad syntax, insecure defaults, deprecated APIs |
| Policy | `conftest`/OPA, Kyverno | Org rules (tags, public access) |
| Unit | Terraform `test` blocks, `terratest` (plan assertions) | "This module outputs the right subnet count" |
| Integration | `terratest` real apply in a sandbox → assert → destroy | "The LB actually serves 200" |
| Drift | scheduled `plan` with alerting | Console changes |

This repo's `lab/validate.py` is the lint level: fast, offline,
zero-dependency, and the source of the green badge. The CI workflow adds
the real tools on top.

---

## 7. Blast radius and state layout

One giant state file for the whole company is a single point of failure:
a bad `apply` can touch everything, and every plan is slow.

Split by **blast radius and ownership**:

```
state/
  org/            # accounts, SSO, org-wide guardrails — changes rarely
  network/prod/   # VPC, subnets, peering — the network team owns it
  platform/prod/  # cluster, ingress, DNS — the platform team
  app/checkout/prod/   # one service — that service's team
```

Downstream stacks read upstream outputs read-only via
`terraform_remote_state` (or better, a data source / SSM parameter). A
mistake in `app/checkout` cannot delete the VPC because it does not have
the VPC in its state.

---

## 8. GitOps end-to-end (a production reference)

```
developer ──PR──▶ repo ──▶ CI: fmt, lint, tfsec, conftest, `plan` comment
                              │
                        human approve + merge
                              │
   ┌──────────────────────────┴───────────────────────────┐
   ▼ (cloud resources)                                     ▼ (k8s apps)
 Atlantis/Spacelift runs `terraform apply`         Argo CD detects git change,
 with an OIDC-federated role (no static keys)      syncs manifests into the cluster,
   │                                               continuously reverts drift
   ▼
 nightly drift job re-plans, alerts on divergence
```

No human has standing write access to prod. The audit trail is the git
history. Rollback is `git revert` + auto-sync.

---

## 9. Further reading

- Terraform: `terraform/BEGINNER_GUIDE.md`, `terraform/SCENARIOS.md`
- The reconciliation pattern in Kubernetes: `kubernetes/DEEP_DIVE.md`
- Running all of it in production: `sre/BEGINNER_GUIDE.md`
