# 02-variables-outputs — parameterise a stack the way real teams do.
#
#   terraform apply                          # uses defaults (dev)
#   terraform apply -var environment=prod    # prod sizing + naming
#   terraform apply -var-file=prod.tfvars    # or a whole file of vars
#
# `locals` are computed values — the place for conditionals and the DRY
# "compute once, use everywhere" naming rules.

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

locals {
  # Per-environment overrides without duplicating resource blocks.
  sizing = {
    dev     = { replicas = 1, spot = true }
    staging = { replicas = 2, spot = true }
    prod    = { replicas = max(var.replicas, 3), spot = false }
  }

  effective   = local.sizing[var.environment]
  name_prefix = "${var.service_name}-${var.environment}"

  common_tags = merge(
    {
      Service     = var.service_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

# One "instance id" per replica — stands in for a VM / task / pod.
resource "random_id" "instance" {
  count       = local.effective.replicas
  byte_length = 4
  keepers = {
    # Changing the prefix forces new ids; changing tags does not.
    name = local.name_prefix
  }
}

output "instance_names" {
  description = "One name per replica"
  value       = [for r in random_id.instance : "${local.name_prefix}-${r.hex}"]
}

output "resolved_sizing" {
  description = "What the environment actually resolved to"
  value       = local.effective
}

output "tags" {
  description = "Tags that would be applied to every resource"
  value       = local.common_tags
}
