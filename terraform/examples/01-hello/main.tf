# 01-hello — the smallest useful Terraform stack.
#
# No cloud account needed: the `random` provider is a real provider that
# `terraform init` downloads, but it only touches your machine. Run:
#
#   terraform init
#   terraform plan
#   terraform apply
#   terraform show
#   terraform destroy
#
# Watch `terraform.tfstate` appear after apply — that file is Terraform's
# memory of what it created. Delete it and Terraform forgets (and will
# try to create a second pet). That is why real teams store state
# remotely and locked (see ../04-remote-state).

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

# A "resource" is a thing Terraform owns end to end: it creates it on
# apply, records it in state, and deletes it on destroy.
resource "random_pet" "server" {
  length    = 2
  separator = "-"
}

# Change this to 3 and re-run `terraform plan`: Terraform diffs desired
# vs recorded state and shows `-/+ destroy and then create replacement`.
# The plan is the review artifact — never apply what you did not read.
resource "random_integer" "port" {
  min = 8000
  max = 8999
}

output "server_name" {
  description = "Generated hostname — stable until you change an input"
  value       = random_pet.server.id
}

output "server_port" {
  description = "Generated port"
  value       = random_integer.port.result
}
