# VPC — 3-tier network module

A reusable Terraform module for the 3-tier network from Part 4's networking
chapters: **public** (internet-facing), **private** (application), and
**data** (database) subnets spread across 2-3 availability zones.

## Layout

| Tier    | Reachability                          | Typical use                     |
|---------|----------------------------------------|----------------------------------|
| public  | route to an Internet Gateway           | load balancers, bastion, NAT     |
| private | route to a NAT Gateway (outbound only) | application/compute instances    |
| data    | route to a NAT Gateway (outbound only) | RDS, ElastiCache, internal data  |

Public and private/data subnets are deliberately routed differently even
though private and data share the same egress pattern here: keeping data's
route tables separate means a later change (e.g. dropping the default
route to make the data tier fully private) touches only `aws_route_table.data`
and `aws_route.data_nat`, never the application tier.

## Usage

```hcl
module "vpc" {
  source = "./labs/vpc"

  name     = "demo"
  vpc_cidr = "10.0.0.0/16"
  azs      = ["us-east-1a", "us-east-1b", "us-east-1c"]

  public_subnet_cidrs  = ["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]
  data_subnet_cidrs    = ["10.0.20.0/24", "10.0.21.0/24", "10.0.22.0/24"]

  single_nat_gateway = true # false = one NAT gateway per AZ, full isolation
}
```

## Cost vs. resilience trade-off

`single_nat_gateway = true` (the default) creates **one** NAT Gateway in the
first AZ, shared by every private/data route table — cheapest, but that AZ's
NAT Gateway becomes a single point of failure for outbound traffic from
every other AZ. Set it to `false` in production to get one NAT Gateway per
AZ (and per-AZ egress isolation) at roughly 2-3x the NAT Gateway cost.

## Validate locally

```sh
terraform fmt -check -recursive .
terraform init -backend=false
terraform validate
```

No `terraform plan`/`apply` is run in CI — this module is validated
structurally (`fmt` + `validate`), not against a live AWS account.
