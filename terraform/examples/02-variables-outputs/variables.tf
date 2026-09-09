# Inputs. Everything that changes between environments lives here — never
# hard-coded in main.tf. `terraform plan -var-file=prod.tfvars` swaps the
# whole environment without touching resource code.

variable "environment" {
  description = "Deployment environment — drives naming and sizing"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "service_name" {
  description = "Logical service name, used as a resource name prefix"
  type        = string
  default     = "checkout"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,30}$", var.service_name))
    error_message = "service_name must be lowercase kebab-case, 2-31 chars."
  }
}

variable "replicas" {
  description = "Desired instance count — clamped per environment below"
  type        = number
  default     = 2

  validation {
    condition     = var.replicas >= 1 && var.replicas <= 20
    error_message = "replicas must be between 1 and 20."
  }
}

variable "tags" {
  description = "Free-form tags merged onto every resource"
  type        = map(string)
  default     = {}
}
