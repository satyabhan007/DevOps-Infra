variable "name" {
  description = "Name prefix for all resources this module creates"
  type        = string
}

variable "cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "azs" {
  description = "Availability zones to spread subnets across"
  type        = list(string)

  validation {
    condition     = length(var.azs) >= 2
    error_message = "Provide at least 2 AZs for a highly-available layout."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets, one per AZ"
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets, one per AZ"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Whether to create a NAT gateway so private subnets get outbound internet"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to every resource this module creates"
  type        = map(string)
  default     = {}
}
