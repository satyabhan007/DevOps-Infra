# testing/ — Terratest against the vpc module

`terraform validate` (in `../terraform/`) only checks that the config
is *structurally* correct — it never calls AWS. Terratest is the next
rung up: it runs `terraform apply` for real, asserts against the
actual infrastructure, then tears it down.

```
testing/
├── go.mod
└── vpc_module_test.go   # exercises ../terraform/modules/vpc
```

## What it does

`vpc_module_test.go` has two tests:

- **`TestVpcModuleCreatesExpectedSubnets`** — applies `modules/vpc` with
  `enable_nat_gateway = true`, then asserts: the VPC exists with the
  requested CIDR (checked via `aws.GetVpcById`, not just the terraform
  output — catching drift between "terraform thinks it created this"
  and "AWS actually has this"), exactly one public + one private subnet
  per AZ, exactly one NAT gateway, and each subnet carries the
  `Tier=public`/`Tier=private` tag the module sets.
- **`TestVpcModuleWithoutNatGateway`** — same module with
  `enable_nat_gateway = false`, asserting the `nat_gateway_ids` output
  comes back empty rather than a NAT gateway with a dangling EIP.

Both `defer terraform.Destroy(...)` immediately after creating
`terraformOptions`, so a failed assertion still tears the stack down.

## Run it

This needs real AWS credentials and creates (then destroys) real
resources — it is **not** part of the offline CI gate that validates
this repo (that's `terraform validate`, which needs no credentials).
Run it by hand, or from a scheduled job that has credentials:

```sh
cd testing
go mod tidy        # first run only
go test -v -timeout 30m ./...
```

## Verifying this file without running it

`go vet ./...` and `gofmt -l .` were both run against the real
`github.com/gruntwork-io/terratest` and `github.com/stretchr/testify`
APIs while writing this file (`go mod tidy` pulled the real
dependency graph) — both pass clean, so every `terraform.*` / `aws.*`
call here is a real, correctly-typed Terratest API call, not just
plausible-looking Go.
