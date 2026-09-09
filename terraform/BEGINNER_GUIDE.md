# Terraform — The Beginner's Guide

> Terraform has exactly one job: make the real world match your `.tf`
> files, and remember what it did. Everything else is detail.

Runnable labs live in `terraform/examples/`. They use the `random` and
built-in providers only — **no cloud account needed**.

---

## 1. The core loop

```bash
terraform init      # download providers + configure the backend
terraform fmt       # canonical formatting (CI checks this)
terraform validate  # syntax + type checks, offline
terraform plan      # compute and SHOW the diff — the review artifact
terraform apply     # execute exactly that diff, then update state
terraform destroy   # remove everything this configuration owns
```

You will run `plan` a hundred times a day and `apply` after reading it.

### Analogy — the contractor's quote

`plan` is the quote: *"I will knock down this wall, keep the kitchen,
add two power sockets, total 3 changes."* You approve the **quote**, not
a vague notion of "renovate the house." `apply` does precisely what the
quote said — no more.

---

## 2. HCL in five minutes

```hcl
terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = "eu-west-1"
}

variable "instance_count" {
  type    = number
  default = 2
}

locals {
  name_prefix = "checkout-${terraform.workspace}"
}

resource "aws_instance" "web" {
  count         = var.instance_count
  ami           = data.aws_ami.al2023.id
  instance_type = "t3.small"
  tags          = { Name = "${local.name_prefix}-${count.index}" }
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter { name = "name", values = ["al2023-ami-*-x86_64"] }
}

output "web_ips" {
  value = aws_instance.web[*].private_ip
}
```

- **`resource`** — something Terraform creates, owns, and destroys.
- **`data`** — something Terraform only *reads* (an existing AMI, a
  secret, another stack's output).
- **`variable`** — an input. **`output`** — a return value.
- **`locals`** — computed values, the place for expressions and DRY.
- **`count` / `for_each`** — make many of a resource.

---

## 3. Providers

A **provider** is a plugin translating HCL into API calls: `aws`,
`google`, `azurerm`, `kubernetes`, `helm`, `github`, `cloudflare`,
`datadog` — thousands on the registry.

- **Pin versions** (`~> 5.0` = ">=5.0.0, <6.0.0"). An unpinned provider
  means a colleague's `init` next month behaves differently from yours
  today.
- `.terraform.lock.hcl` locks exact versions + checksums — **commit it**.
- One stack often uses several providers: `aws` to build the EKS cluster,
  then `kubernetes` + `helm` to deploy onto it, then `github` to store
  the kubeconfig as an Actions secret. Terraform builds one dependency
  graph across all of them.

---

## 4. The state file, up close

After `apply`, look at `terraform.tfstate`:

```json
{
  "resources": [{
    "type": "random_pet", "name": "server",
    "instances": [{ "attributes": { "id": "helpful-mongoose", "length": 2 }}]
  }]
}
```

It maps **`random_pet.server` in your code ↔ `helpful-mongoose` in the
real world**, and caches every attribute.

Rules that keep you out of trouble:

1. **Never commit state to git.** It holds secrets in plaintext.
2. **Never hand-edit state.** Use `terraform state` subcommands.
3. **Use a remote backend** in any team (next section).
4. **One state per environment.** A prod plan should never be able to
   touch dev.

---

## 5. Remote backends and locking

```hcl
terraform {
  backend "s3" {
    bucket         = "acme-tfstate-prod"
    key            = "checkout/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "acme-tfstate-locks"   # the lock
    encrypt        = true
  }
}
```

What each part buys you:

| Feature | Without it |
|---------|-----------|
| Central storage (S3/GCS/TFC) | State on one laptop; nobody else can apply |
| Locking (DynamoDB / native) | Two `apply`s race → corrupted state |
| Versioning (S3 versioning) | No undo when state goes wrong |
| Encryption at rest | Secrets readable by anyone with bucket access |

Bootstrapping is a chicken-and-egg: the stack that *creates* the bucket
and lock table uses **local** state, once. Everything else uses the
bucket.

See `terraform/examples/04-remote-state/`.

---

## 6. Modules — infrastructure functions

A **module** is a directory of `.tf` you call with inputs:

```hcl
module "service" {
  source   = "./modules/service"          # or a registry / git URL
  for_each = {
    api    = { replicas = 3, port = 8080 }
    worker = { replicas = 2, port = 0 }
  }
  name     = each.key
  replicas = each.value.replicas
  port     = each.value.port
}

output "endpoints" {
  value = { for k, m in module.service : k => m.endpoint }
}
```

A good module:

- **small input surface** — few, well-named variables with `validation`
- **sensible defaults** — the common case needs almost no inputs
- **declares provider *requirements*, never provider *config*** — the
  root module configures providers
- **outputs what callers need** — IDs, endpoints, ARNs

Runnable: `terraform/examples/03-module/`.

### Analogy — the IKEA flat-pack

The assembly instructions (module code) are written once. You build the
same wardrobe in ten bedrooms by changing only the size and colour on the
box (the input variables).

---

## 7. Workspaces vs directories

- **Workspaces** (`terraform workspace new staging`) give you multiple
  state files for one configuration. Fine for ephemeral/preview
  environments; risky for prod (one wrong `workspace select` and you
  apply dev config to prod).
- **Separate directories/repos per environment**, each with its own
  backend key, is the safer default for dev/staging/prod. Share code via
  modules, not workspaces.

---

## 8. Production examples

**Example: a new microservice.** The platform team ships a `service`
module (namespace, deployment, HPA, ingress, DB, alerts). A product team
adds 15 lines calling it, opens a PR, `plan` shows `+22 resources`, it is
reviewed and merged. The service is live with monitoring in an hour.

**Example: rotating a database password.** The password is a
`random_password` resource written to AWS Secrets Manager; the app reads
it from there. Rotation = `terraform apply -replace=random_password.db`.
`plan` shows one resource replaced; the app picks up the new value on its
next restart.

**Example: adopting hand-built infra.** A load balancer was created in
the console two years ago. `terraform import aws_lb.legacy arn:...` pulls
it into state; you then write matching HCL until `plan` shows "no
changes". Now it is code.

**Example: a scary plan.** `plan` shows `-/+ replace` on the RDS
instance because someone changed `engine_version` in a way that forces
new. You stop, check: it is actually an in-place upgrade the provider
mishandles — you add `lifecycle { ignore_changes = [engine_version] }`
and do the upgrade through a controlled path instead.

---

## 9. Next

- **`terraform/SCENARIOS.md`** — stuck locks, drift, `import`, `moved`,
  secret leaks, blast-radius incidents, with fixes.
- **`iac/DEEP_DIVE.md`** — the reconciliation model, GitOps, policy.
- The labs: `terraform/examples/01-hello` → `04-remote-state`.
