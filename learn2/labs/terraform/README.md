# terraform/ — a multi-module stack

A root module that calls two reusable child modules, the shape a real
team's Terraform grows into once a single `main.tf` stops scaling:

```
terraform/
├── main.tf          # wires modules/vpc + modules/app together
├── variables.tf      # stack-level inputs, with defaults
├── outputs.tf         # stack-level outputs
├── versions.tf         # terraform + provider version pins
└── modules/
    ├── vpc/            # 2-tier VPC: public+private subnets, IGW, NAT, route tables
    └── app/            # ALB + autoscaling group + launch template + IAM instance role
```

`main.tf` calls `module "vpc"` then feeds its subnet outputs straight into
`module "app"` — the same dependency chain you'd see in a real
network-then-workload stack.

## Run it

```sh
terraform init
terraform validate
terraform plan -var="ami_id=ami-xxxxxxxx"   # pick a real AMI for your region
```

`terraform validate` only needs the provider *schema*, not AWS
credentials or a real account — that's what CI runs
(`terraform init -backend=false && terraform validate`), so this passes
offline. Actually applying it needs a valid `ami_id` for your region and
real AWS credentials.

## What to notice

- **Thin root, fat modules.** `main.tf` has no resources of its own —
  it only calls modules and wires their inputs/outputs together.
- **Each module declares its own `required_providers`.** The provider
  *configuration* (region, credentials) lives only in the root module —
  a module should never hardcode a provider block.
- **Outputs chain.** `module.vpc.vpc_id` and `module.vpc.private_subnet_ids`
  flow directly into `module.app`'s inputs — that dependency is what
  makes `terraform graph` useful on a real stack.
- **`lifecycle { create_before_destroy = true }`** on the launch template
  and autoscaling group, so a change to the AMI or instance type rolls
  instances without a capacity gap.
- **IMDSv2 is enforced** (`http_tokens = "required"`) on the launch
  template, and every taggable resource gets `var.tags` merged in — see
  `../policy/` for Conftest rules that guard the tagging and
  instance-type conventions this module follows.
