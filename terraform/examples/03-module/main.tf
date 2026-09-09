# 03-module — stop copy-pasting. A module is a folder of .tf you call
# with inputs, like a function. Here the root calls one local module
# three times with `for_each` — add a key, get a whole new service.
#
#   terraform init      # also wires up the local module
#   terraform apply
#   terraform state list

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

variable "environment" {
  type    = string
  default = "dev"
}

locals {
  # port = 0 means "no ingress" — the module makes the endpoint null.
  services = {
    api    = { replicas = 3, port = 8080 }
    worker = { replicas = 2, port = 0 }
    cron   = { replicas = 1, port = 0 }
  }
}

module "service" {
  source   = "./modules/service"
  for_each = local.services

  name        = each.key
  environment = var.environment
  replicas    = each.value.replicas
  port        = each.value.port
}

output "endpoints" {
  description = "Only services that requested a port get an endpoint"
  value       = { for k, m in module.service : k => m.endpoint if m.endpoint != null }
}

output "all_instances" {
  value = { for k, m in module.service : k => m.instance_names }
}
