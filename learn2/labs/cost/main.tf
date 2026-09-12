# cost/main.tf — a small, self-contained stack (not wired to the
# modules/ layout next door) sized specifically to produce an
# interesting Infracost diff: an oversized instance type, a second
# environment's worth of compute, and a chunk of provisioned storage.
#
# Deliberately NOT `terraform init`-connected to any real backend or
# credentials here — this file exists to be read by `infracost
# breakdown`, which parses HCL statically and never calls `terraform
# plan` or touches AWS.

terraform {
  required_version = ">= 1.5.0"

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

resource "aws_instance" "app" {
  count = 3

  ami           = "ami-0123456789abcdef0"
  instance_type = "m5.2xlarge"

  root_block_device {
    volume_type = "gp3"
    volume_size = 100
  }

  tags = {
    Owner       = "platform-team"
    Environment = "prod"
  }
}

resource "aws_db_instance" "primary" {
  identifier        = "app-primary"
  engine            = "postgres"
  engine_version    = "16.3"
  instance_class    = "db.r6g.xlarge"
  allocated_storage = 200
  storage_type      = "gp3"
  multi_az          = true

  db_name  = "app"
  username = "app_admin"
  password = "changeme-in-a-real-stack" # tfsec/infracost don't care; a real stack pulls this from a secrets manager

  skip_final_snapshot = true

  tags = {
    Owner       = "platform-team"
    Environment = "prod"
  }
}

resource "aws_ebs_volume" "app_data" {
  availability_zone = "eu-west-1a"
  size              = 500
  type              = "gp3"

  tags = {
    Owner       = "platform-team"
    Environment = "prod"
  }
}
