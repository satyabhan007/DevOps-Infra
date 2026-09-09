# Terraform — Production Scenarios

Each scenario: **symptom → what is happening → fix → prevention**.
These are the ones that actually page you.

> Analogy: Terraform state is the building's official blueprint. Most of
> these incidents are the moment the blueprint and the actual building
> disagree — someone knocked through a wall (drift), two architects
> edited at once (lock), or the blueprint was left on a park bench with
> the alarm codes on it (secret leak). The fix is always to get the
> blueprint and the building back in sync, deliberately.

---

## Scenario 1 — "Error acquiring the state lock"

**Symptom**
```
Error: Error acquiring the state lock
Lock Info:
  ID:        4f3c...-...
  Who:       jenkins@ci-runner-7
  Created:   2026-09-09 02:14:03 UTC
```

**What is happening.** A previous `apply` (usually CI) was killed —
OOM, spot reclaim, cancelled job — before it could release the
DynamoDB / backend lock. The lock is now stale.

**Fix.**
1. **Confirm nobody is really applying.** Check CI, ask in chat. This is
   the dangerous step — force-unlocking a live apply corrupts state.
2. `terraform force-unlock 4f3c...-...`
3. Run `terraform plan` and read it carefully — the killed apply may
   have half-finished. State is written per-resource, so it is usually
   consistent, but verify.

**Prevention.** Give CI apply jobs a generous timeout and a `trap` that
runs `force-unlock` only on its *own* lock ID. Prefer a runner that
cannot be spot-reclaimed mid-apply for prod.

---

## Scenario 2 — `plan` wants to destroy something you did not touch

**Symptom.** You changed a tag. `plan` shows `-/+ replace` on the RDS
instance or the EKS node group.

**What is happening.** A **ForceNew** attribute is being changed —
directly by you, or indirectly (a `data` source resolved to a new AMI,
a default changed in a new provider version). ForceNew = the API cannot
change it in place, so Terraform destroys and recreates.

**Fix — pick one deliberately.**
- It is genuinely a rename → `moved {}` block or `terraform state mv`.
- The attribute drifted and you do not manage it →
  `lifecycle { ignore_changes = [ami] }`.
- You must change it but cannot afford downtime →
  `lifecycle { create_before_destroy = true }` (needs unique names).
- The provider upgrade changed a default → pin the old provider, do the
  real change through a controlled migration.

**Prevention.** Pin provider versions. Pin AMIs / images to IDs, not
`most_recent`. Read every `-/+` in a plan out loud before applying.

---

## Scenario 3 — drift: the console hotfix

**Symptom.** Nightly drift job alerts: `~ aws_security_group.api` has an
ingress rule Terraform did not add.

**What is happening.** During last week's incident, someone added
`0.0.0.0/0 : 8080` in the console to test something and never removed it.

**Fix.**
- If it was wrong: `terraform apply` reverts it. Done.
- If it was right: add the rule to the `.tf`, PR it, `apply` becomes a
  no-op. Now it is documented.

**Prevention.** Remove console **write** access. Run `terraform plan` on
a schedule (nightly) with alerting on any non-empty diff. Break-glass
console access is time-boxed and auto-revoked.

---

## Scenario 4 — a secret leaked into state / git

**Symptom.** `git grep` finds a database password in `terraform.tfstate`
committed six months ago. Or `terraform show` prints a private key.

**What is happening.** State stores **every** resource attribute,
including sensitive ones, in plaintext. Someone committed the local
state file, or the backend bucket is world-readable.

**Fix.**
1. **Rotate the secret now** — assume it is compromised.
2. Purge it from git history (`git filter-repo`), force-push, rotate any
   deploy keys.
3. Move state to an encrypted, private, versioned backend.
4. `terraform state rm` is *not* enough — the value is still in old
   state versions.

**Prevention.** `.gitignore` `*.tfstate*` from day one (this repo does).
Remote backend with `encrypt = true` and a locked-down bucket policy.
Mark outputs `sensitive = true`. Keep real secrets in a secret manager
and read them via `data`, so they are referenced, not stored by you.

---

## Scenario 5 — the monolith state, slow and scary

**Symptom.** `terraform plan` takes 9 minutes. Every engineer is afraid
to run `apply` because it "could touch anything."

**What is happening.** One state file holds the VPC, the cluster, DNS,
and 40 services. `refresh` hits thousands of APIs; the blast radius is
the entire company.

**Fix (incremental).**
1. Carve out the least-coupled piece (say, one app) into its own state.
2. `terraform state mv` those resources into the new state, or
   `import` them fresh and `state rm` from the monolith.
3. Wire the dependency with `terraform_remote_state` or a data source.
4. Repeat, prioritising the pieces that change most often.

**Prevention.** Design state layout by **ownership + blast radius** up
front: `network/`, `platform/`, `app/<name>/`, each per environment. See
`iac/DEEP_DIVE.md` §7.

---

## Scenario 6 — `import` an existing resource

**Symptom.** A load balancer, DNS zone, or IAM role was created by hand.
You want it in Terraform without downtime.

**Fix.**
```hcl
# 1. write a resource block (can be near-empty at first)
resource "aws_lb" "legacy" {
  name = "acme-legacy-alb"
  # ... fill in as plan tells you what is missing
}
```
```bash
# 2. link code ↔ real resource
terraform import aws_lb.legacy arn:aws:elasticloadbalancing:...:loadbalancer/app/acme-legacy-alb/abc123

# 3. loop: terraform plan → copy real values into HCL → repeat
#    until plan says "No changes."
```
Terraform ≥ 1.5 can also do this declaratively with an `import {}` block
committed to the repo, so the import is reviewed and reproducible.

**Prevention.** Ban console creation. If an emergency forces it, file a
follow-up to import within the week, while you still remember the config.

---

## Scenario 7 — provider upgrade breaks the plan

**Symptom.** After `terraform init -upgrade`, `plan` shows dozens of
spurious changes or errors on attributes that were fine yesterday.

**What is happening.** A major provider version changed defaults,
renamed attributes, or split a resource (e.g. inline rules → separate
resources).

**Fix.**
1. Read the provider's **upgrade guide** — they publish one per major.
2. Upgrade **one major at a time**, never skip.
3. Expect to run `state mv` / `moved` for split resources.
4. Do it in a low-traffic window with a reviewed plan; keep the old
   `.terraform.lock.hcl` handy to roll back.

**Prevention.** Pin `~>` to a major. Upgrade on a schedule (quarterly),
not reactively. Test the upgrade in dev/staging first.

---

## Scenario 8 — CI applied a stale plan

**Symptom.** CI ran `plan` on the PR, then `apply` after merge — but
`main` moved in between, and `apply` did something unexpected.

**Fix / correct pattern.** Use the **saved plan file**:
```bash
terraform plan -out=tfplan        # on the merge commit
terraform apply tfplan            # applies EXACTLY that plan, or errors if state moved
```
Tools like Atlantis, Spacelift and TFC enforce plan-then-apply on the
same commit and serialise applies per state.

**Prevention.** Never `apply` without a saved plan in automation. One
apply at a time per state (the lock enforces it, but queue jobs so they
do not pile up).

---

## Quick reference — the commands that save you

```bash
terraform plan -out=tfplan && terraform apply tfplan   # review-exact apply
terraform state list                                   # what do I manage?
terraform state show aws_instance.web                   # inspect one
terraform state mv  A  B                                # rename in state
terraform state rm  aws_instance.gone                   # stop managing (does NOT destroy)
terraform import   aws_lb.legacy  arn:...               # adopt existing
terraform force-unlock <LOCK_ID>                        # after confirming nobody applies
terraform apply -replace=aws_instance.web               # recreate one resource
terraform plan -refresh-only                            # show drift, change nothing
terraform console                                       # try expressions interactively
```
