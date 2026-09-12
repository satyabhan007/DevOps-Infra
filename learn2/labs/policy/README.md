# policy/ — OPA / Conftest policy-as-code

Three Rego policies that run against plain `.tf` files (or a
`terraform show -json` plan — see the note at the bottom) with
[Conftest](https://www.conftest.dev/), a thin CLI over
[Open Policy Agent](https://www.openpolicyagent.org/).

```
policy/
├── policies/
│   ├── deny_public_s3.rego            # no public-read / public-read-write S3 ACLs
│   ├── require_tags.rego               # Owner + Environment tags on every taggable resource
│   └── restrict_instance_types.rego     # only pre-approved EC2 instance types
└── examples/
    ├── bad.tf     # trips all three policies
    └── good.tf    # the compliant rewrite — zero denials
```

## Run it

```sh
cd policy
conftest test --policy policies examples/bad.tf     # 5 failures
conftest test --policy policies examples/good.tf    # 0 failures
```

`bad.tf` fails with:

```
FAIL - examples/bad.tf - main - aws_instance.oversized: instance_type "m5.24xlarge" is not in the approved list {...}
FAIL - examples/bad.tf - main - aws_instance.oversized: missing required tags {"Environment", "Owner"} (no tags block at all)
FAIL - examples/bad.tf - main - aws_s3_bucket.leaky: missing required tags {"Environment", "Owner"} (no tags block at all)
FAIL - examples/bad.tf - main - aws_s3_bucket_acl.leaky: acl "public-read" makes the bucket public — use "private" and grant access via bucket policy instead
FAIL - examples/bad.tf - main - aws_vpc.untagged: missing required tags {"Environment", "Owner"} (no tags block at all)
```

## How each policy reads its input

Conftest's HCL2 parser turns every `.tf` file into one JSON document
shaped like:

```json
{
  "resource": {
    "aws_instance": {
      "oversized": { "instance_type": "m5.24xlarge", "...": "..." }
    }
  }
}
```

— i.e. `input.resource.<type>.<name>.<attribute>`. Each policy is a
`deny` rule in `package main` (Conftest's default namespace) that walks
`input.resource.<type>` and produces a message per violation; any
non-empty `deny` set fails the test.

## Wiring this into CI for real

A real pipeline runs this on the **plan**, not the raw source, so it
also catches values only known after interpolation/modules:

```sh
terraform plan -out=tfplan
terraform show -json tfplan > plan.json
conftest test --policy policy/policies plan.json
```

The plan JSON nests resources under `resource_changes[].change.after`
instead of `resource.<type>.<name>` directly, so policies written
against plan JSON index differently — these three are written against
the simpler raw-HCL shape (`input.resource.*`) so they also work as a
fast pre-commit / pre-plan gate, straight against `.tf` files, before
anyone spends time on a full `plan`.
