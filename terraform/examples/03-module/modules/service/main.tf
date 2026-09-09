# The reusable unit. A good module: small surface (few inputs), sane
# defaults, validated inputs, and outputs the caller actually needs.
# It declares its own provider *requirements* but never a provider
# *config* — that is the root module's job.

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

variable "name" {
  description = "Service name"
  type        = string
}

variable "environment" {
  description = "dev | staging | prod"
  type        = string
}

variable "replicas" {
  description = "Instance count"
  type        = number
  default     = 1

  validation {
    condition     = var.replicas >= 1
    error_message = "replicas must be >= 1."
  }
}

variable "port" {
  description = "Ingress port, or 0 for no public endpoint"
  type        = number
  default     = 0
}

locals {
  fqdn = "${var.name}.${var.environment}.svc.example.internal"
}

resource "random_id" "instance" {
  count       = var.replicas
  byte_length = 3
  keepers = {
    name = "${var.name}-${var.environment}"
  }
}

output "instance_names" {
  value = [for r in random_id.instance : "${var.name}-${r.hex}"]
}

output "endpoint" {
  description = "null when the service opted out of ingress"
  value       = var.port > 0 ? "${local.fqdn}:${var.port}" : null
}
