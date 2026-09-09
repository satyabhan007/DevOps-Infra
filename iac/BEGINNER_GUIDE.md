# Infrastructure as Code — The Beginner's Guide

> The server you cannot rebuild from a file is a liability, not an asset.
> This module is about turning infrastructure into something you can
> review, test, diff, and recreate.

---

## 1. The problem IaC solves

Before IaC, infrastructure was built by **clicking** (a cloud console) or
**SSH-ing** (running commands by hand). Three things go wrong, always:

| Failure | What it looks like |
|---------|--------------------|
| **Snowflakes** | Every server is subtly different. Nobody knows why prod has that one extra firewall rule. |
| **No history** | "Who opened port 22 to the world, and when?" — no answer. |
| **No recovery** | The region goes down. Rebuilding by memory takes three days. |

IaC fixes all three by making the infrastructure a **text file in git**:

- the file is reviewed in a pull request before it takes effect
- `git log` is the complete history of every change, with author and reason
- `terraform apply` in a fresh region rebuilds everything in minutes

### Analogy — pets vs cattle

A **pet** server has a name (`webserver-prod-01`), you know its quirks, and
when it gets sick you stay up all night nursing it back to health.

**Cattle** have ear tags (`i-0a1b2c3d`). They are identical. If one is
sick, you shoot it and the herd replaces it automatically. You never log
in to a single animal.

IaC is the shift from pets to cattle. The description lives in the file;
any instance built from that file is disposable and replaceable.

---

## 2. Declarative vs imperative

**Imperative** = a list of steps. "Create a VM. Attach a 50 GB disk.
Install nginx. Copy this config. Restart nginx."

**Declarative** = a description of the destination. "There is a VM with a
50 GB disk running nginx with this config." The tool computes the steps.

```
imperative (a script):              declarative (a description):
  create_vm web                       resource "vm" "web" {
  attach_disk web 50                    disk_gb = 50
  run "apt install nginx"               package = "nginx"
  run "systemctl restart nginx"         config  = file("nginx.conf")
                                      }
```

Why declarative wins:

- **Idempotent** — run it twice, the second run changes nothing. The
  imperative script would try to create a *second* VM, or fail on
  "already exists".
- **Convergent** — if reality drifts (someone stopped nginx), the next
  apply notices and fixes just that.
- **Reviewable** — the diff of a declarative file *is* the change. A diff
  of an imperative script tells you the steps changed, not the outcome.

### Analogy — thermostat vs stopwatch

You do not tell a furnace "burn for 8 minutes" (imperative, and wrong the
moment the weather changes). You set **21°C** (declarative). The system
measures the gap and closes it, continuously, forever.

---

## 3. Desired state, actual state, and the plan

Every IaC tool juggles three pictures of the world:

```
DESIRED   what the code says        →  resource "db" { size = "large" }
STATE     what the tool last built  →  db = id:pg-42, size:"small"
ACTUAL    what is really running    →  pg-42 is "small"

plan = diff(DESIRED, STATE, ACTUAL)  →  "~ resize pg-42: small → large"
```

The **plan** is the single most important artifact in IaC. It is what you
review. Never run `apply` on a plan you have not read — that is how a
one-character typo destroys a production database.

---

## 4. What a "state file" is, and why it bites

Terraform records what it built in `terraform.tfstate` — a JSON file
mapping *code resource* ↔ *real resource ID*, plus a cached copy of every
resource's attributes.

Without state, the tool cannot tell **"create a new database"** from
**"update the existing one"** — they look identical in the code.

Two ways it bites beginners:

1. **You delete the state file.** Terraform now thinks nothing exists.
   Next `apply` tries to build a *second* copy of everything — a second
   database, a second load balancer, duplicate DNS.
2. **You commit the state file to git.** It contains every resource
   attribute, including database passwords and private keys, in
   plaintext, forever, in your history.

The fix real teams use: a **remote backend** (an S3 bucket or equivalent)
with a **lock** (so two people cannot `apply` at once) and **encryption
at rest**. See `terraform/BEGINNER_GUIDE.md`.

---

## 5. Drift

**Drift** is when the real world stops matching the code:

- someone clicked "add rule" in the console during an incident
- an autoscaler created resources the code does not know about
- a hotfix was applied live and never back-ported to the repo

`terraform plan` is a **drift detector**. It re-reads the real world and
shows you every difference. You then decide, per change:

- **adopt it** — write it into the code (it was a good change)
- **revert it** — let `apply` put reality back (it was unauthorized)

Mature teams run a **scheduled drift plan** (nightly) that alerts if
anything diverged, so console clicks cannot hide.

### Analogy — the master document

Drift is edits scribbled on printed handouts while the master file on the
server stays untouched. `plan` is turning on *track changes*: every
scribble is surfaced so you choose to merge it into the master or discard
it.

---

## 6. A day in the life (production examples)

**Example: Black Friday scale-out.** Traffic forecast says 6×. You bump
`min_instances = 20 → 120` in one file, open a PR, the `plan` shows
`+100 instances`, a teammate approves, CI applies it. After the weekend
the revert PR scales back down. Every number is in git history for next
year's capacity planning.

**Example: a region outage.** `us-east-1` is down. You already have the
whole stack as code. `terraform workspace new dr-uswest`, point the
provider at `us-west-2`, `apply`. Thirty minutes later DNS is cut over.
This only works because *nothing* was built by hand.

**Example: the audit.** A compliance auditor asks "prove no S3 bucket is
public." You point at a `conftest`/OPA policy in CI that fails any plan
containing a public ACL, plus the git history showing it has been
enforced for 14 months. No screenshots, no spreadsheets.

**Example: onboarding.** A new hire ships an infra change on day two —
they open a PR, the `plan` output is the review, nobody has to grant them
console access. Least privilege by default.

---

## 7. Where to go next

- **`iac/DEEP_DIVE.md`** — reconciliation internals, push vs pull,
  immutable infrastructure, policy as code, GitOps.
- **`terraform/BEGINNER_GUIDE.md`** — the most common IaC tool, hands on.
- **`terraform/examples/01-hello/`** — a runnable stack; watch state
  appear.

The one sentence to remember: **the infrastructure is the file; the cloud
is just a slow, expensive cache of it.**
