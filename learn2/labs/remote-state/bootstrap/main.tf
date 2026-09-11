# remote-state/bootstrap/main.tf — provisions the S3 bucket + DynamoDB
# table that ../backend.tf points at.
#
# Chicken-and-egg: the stack that creates your remote state backend
# can't itself use that backend yet, so this bootstrap stack keeps its
# *own* state local (see the `backend "local"` block below) and is
# normally applied exactly once, by hand, before anything else — a
# separate directory (and separate state) from ../backend.tf on purpose,
# since a directory can only carry one backend configuration.
#
#   terraform init
#   terraform apply
#   # then copy ../backend.tf's `backend "s3" {}` block into every other
#   # stack and `terraform init -migrate-state` there.

terraform {
  required_version = ">= 1.5.0"

  backend "local" {
    path = "bootstrap.tfstate"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}

provider "aws" {
  region = "eu-west-1"
}

resource "aws_s3_bucket" "tfstate" {
  bucket = "acme-tfstate-prod"

  # Guard rail: `terraform destroy` on the bootstrap stack won't
  # silently delete every team's state file.
  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Purpose   = "terraform-remote-state"
    ManagedBy = "terraform"
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "tfstate_locks" {
  name         = "acme-tfstate-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Purpose   = "terraform-state-locking"
    ManagedBy = "terraform"
  }
}
