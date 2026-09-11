output "alb_dns_name" {
  description = "Public DNS name of the load balancer"
  value       = aws_lb.app.dns_name
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.app.arn
}

output "autoscaling_group_name" {
  description = "Name of the app autoscaling group"
  value       = aws_autoscaling_group.app.name
}

output "app_security_group_id" {
  description = "Security group ID attached to app instances"
  value       = aws_security_group.app.id
}
