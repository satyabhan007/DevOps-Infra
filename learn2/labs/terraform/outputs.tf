output "vpc_id" {
  description = "ID of the stack's VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "alb_dns_name" {
  description = "Public DNS name of the app load balancer"
  value       = module.app.alb_dns_name
}

output "autoscaling_group_name" {
  description = "Name of the app autoscaling group"
  value       = module.app.autoscaling_group_name
}
