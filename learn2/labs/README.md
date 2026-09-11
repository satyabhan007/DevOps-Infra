# Part 2 · labs — runnable configs

> Standard tools, at production depth. Every file here is validated in CI
> (`.github/workflows/lab-tests.yml`).

Landing alongside chapters 2–16: a multi-module Terraform layout (root + reusable
modules), a remote-state backend example, an OPA/Conftest policy set, a
Terratest suite, and an Infracost-annotated PR example.

| Lab | Stands up | Validated with |
|---|---|---|
| [`terraform/`](terraform/) | a root module calling two reusable child modules (`modules/vpc`, `modules/app`) — a 2-tier VPC and an ALB + autoscaling group, real `aws_*` resource types throughout | `terraform fmt -check -recursive`, `terraform init -backend=false && terraform validate` |
| [`remote-state/`](remote-state/) | an S3 + DynamoDB `backend "s3" {}` block, plus a `bootstrap/` stack that provisions the bucket and lock table it points at | `terraform fmt -check -recursive`, `terraform validate` (both directories) |
| [`policy/`](policy/) | 3 Conftest/OPA policies (deny public S3 ACLs, require `Owner`/`Environment` tags, restrict EC2 instance types) plus `examples/bad.tf` and `examples/good.tf` to run them against | `conftest test --policy policies examples/*.tf` |
| [`testing/`](testing/) | a Terratest suite (`vpc_module_test.go`) that applies `terraform/modules/vpc` for real, asserts against the live VPC via the AWS SDK, then destroys it | `gofmt -l .`, `go vet ./...` (both run clean against the real Terratest API — see its README) |
| [`cost/`](cost/) | a deliberately pricey sample stack (3× `m5.2xlarge`, a Multi-AZ RDS instance, a 500 GB EBS volume) plus a sample Infracost breakdown and PR comment | `terraform fmt -check -recursive`, `terraform validate`, `python -m json.tool` on the JSON sample |

Each subdirectory has its own README with the exact commands to run it
locally.
