variable "name" {
  description = "Name prefix for all resources this module creates"
  type        = string
}

variable "vpc_id" {
  description = "VPC to launch the app into"
  type        = string
}

variable "public_subnet_ids" {
  description = "Subnets for the load balancer"
  type        = list(string)
}

variable "private_subnet_ids" {
  description = "Subnets for the application instances"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type for the autoscaling group"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum autoscaling group size"
  type        = number
  default     = 2
}

variable "max_size" {
  description = "Maximum autoscaling group size"
  type        = number
  default     = 4
}

variable "app_port" {
  description = "Port the application listens on"
  type        = number
  default     = 8080
}

variable "ami_id" {
  description = "AMI to boot instances from"
  type        = string
}

variable "tags" {
  description = "Tags applied to every resource this module creates"
  type        = map(string)
  default     = {}
}
