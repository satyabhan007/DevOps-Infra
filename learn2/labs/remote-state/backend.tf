# remote-state/backend.tf — the backend block a real team's stack
# (e.g. the terraform/ stack next door) would carry instead of local
# state. Copy this block into that stack's versions.tf once the bucket
# and lock table below exist.
#
# S3 stores the state file centrally; DynamoDB provides locking so two
# `terraform apply` runs can't race and corrupt state. Both the bucket
# and the table must exist *before* this block is active — that's what
# bootstrap.tf provisions (see the chicken-and-egg note there).

terraform {
  required_version = ">= 1.5.0"

  backend "s3" {
    bucket         = "acme-tfstate-prod"
    key            = "part2-lab/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "acme-tfstate-locks"
    encrypt        = true
  }
}
