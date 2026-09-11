variable "name" {
  description = "Name prefix applied to every resource created by this module."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC, e.g. 10.0.0.0/16."
  type        = string

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid IPv4 CIDR block."
  }
}

variable "azs" {
  description = "Availability zones to spread the 3-tier subnets across (2-3 recommended)."
  type        = list(string)

  validation {
    condition     = length(var.azs) >= 2 && length(var.azs) <= 3
    error_message = "Provide 2 or 3 availability zones for a resilient 3-tier layout."
  }
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for the public (internet-facing) subnets, one per AZ, same order as var.azs."
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for the private (application) subnets, one per AZ, same order as var.azs."
  type        = list(string)
}

variable "data_subnet_cidrs" {
  description = "CIDR blocks for the data (database) subnets, one per AZ, same order as var.azs. No route to the internet."
  type        = list(string)
}

variable "single_nat_gateway" {
  description = "If true, create one NAT gateway (in the first AZ) shared by every private/data subnet — cheaper, single point of failure. If false, create one NAT gateway per AZ for full AZ isolation."
  type        = bool
  default     = true
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Extra tags merged into every resource."
  type        = map(string)
  default     = {}
}
