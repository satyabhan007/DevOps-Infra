# 04-remote-state — where the .tfstate file lives in a real team.
#
# Local state (a file on your laptop) breaks the moment a second person
# runs apply: no locking (two applies race and corrupt state), no
# sharing, no history, and secrets sit in plaintext in your repo folder.
#
# A remote backend fixes all four:
#   - S3 / GCS / azurerm / Terraform Cloud store the file centrally
#   - DynamoDB / native locking stops concurrent applies
#   - versioning gives you "undo" for state
#   - encryption at rest protects the secrets state always contains
#
# CI here runs `terraform init -backend=false` so no real bucket is
# touched. To use it for real: create the bucket + lock table first
# (chicken-and-egg: that bootstrap stack itself uses local state, once),
# then `terraform init -migrate-state`.

terraform {
  required_version = ">= 1.4.0"

  # backend "s3" {
  #   bucket         = "acme-tfstate-prod"
  #   key            = "checkout/terraform.tfstate"
  #   region         = "eu-west-1"
  #   dynamodb_table = "acme-tfstate-locks"
  #   encrypt        = true
  # }

  backend "local" {
    path = "terraform.tfstate"
  }

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}
