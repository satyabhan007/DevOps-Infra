# Consuming another stack's outputs — the clean alternative to one giant
# root module. The network team owns the VPC stack; you read its outputs
# read-only. No shared blast radius.
#
#   data "terraform_remote_state" "network" {
#     backend = "s3"
#     config = {
#       bucket = "acme-tfstate-prod"
#       key    = "network/terraform.tfstate"
#       region = "eu-west-1"
#     }
#   }
#
#   resource "aws_instance" "app" {
#     subnet_id = data.terraform_remote_state.network.outputs.private_subnet_ids[0]
#   }
#
# Below is a runnable stand-in so `terraform validate` passes offline.

resource "random_pet" "release" {
  length = 3
}

# `terraform_data` is a built-in resource (no provider) — handy for
# triggering replacements and holding computed values in examples.
resource "terraform_data" "deploy_marker" {
  input = {
    release  = random_pet.release.id
    deployed = "would-be-timestamp"
  }
}

output "release" {
  value = random_pet.release.id
}

output "deploy_marker" {
  value = terraform_data.deploy_marker.output
}
