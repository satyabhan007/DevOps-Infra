# Part 4 · labs — runnable configs

> Standard tools, at production depth. Every file here is validated in CI
> (`.github/workflows/lab-tests.yml`).

Landing alongside chapters 2–16:

| Lab                          | What it is                                                                 |
|-------------------------------|------------------------------------------------------------------------------|
| [`vpc/`](vpc/)                 | A real 3-tier VPC Terraform module — public/private/data subnets across 2-3 AZs, route tables, NAT gateway, Internet Gateway. |
| [`iam/`](iam/)                 | A least-privilege IAM policy scoped to one S3 prefix + one DynamoDB table, next to a "bad" wildcard policy for comparison, with a README walking through why each statement is scoped the way it is. |
| [`vault/`](vault/)              | A documented shell walkthrough configuring Vault's database secrets engine for dynamic, short-lived PostgreSQL credentials, plus a sample least-privilege Vault ACL policy. |
| [`cert-manager/`](cert-manager/) | A `ClusterIssuer` (ACME/Let's Encrypt) + `Certificate` resource pair for automated, auto-renewing TLS. |
| [`cis-scan/`](cis-scan/)        | A `kube-bench` Job manifest for running the CIS Kubernetes Benchmark against a node, with a README on how to read and prioritize its findings. |

Each subdirectory has its own README with usage instructions and the
reasoning behind the choices made in that example.
