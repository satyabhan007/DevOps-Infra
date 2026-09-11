output "vpc_id" {
  description = "ID of the created VPC."
  value       = aws_vpc.this.id
}

output "vpc_cidr" {
  description = "CIDR block of the created VPC."
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets, one per AZ."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private (application) subnets, one per AZ."
  value       = aws_subnet.private[*].id
}

output "data_subnet_ids" {
  description = "IDs of the data subnets, one per AZ."
  value       = aws_subnet.data[*].id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT gateway(s) created (1 if single_nat_gateway, else 1 per AZ)."
  value       = [for ng in aws_nat_gateway.this : ng.id]
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway attached to the VPC."
  value       = aws_internet_gateway.this.id
}

output "public_route_table_id" {
  description = "ID of the shared public route table."
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "IDs of the private route tables, one per AZ."
  value       = aws_route_table.private[*].id
}

output "data_route_table_ids" {
  description = "IDs of the data route tables, one per AZ."
  value       = aws_route_table.data[*].id
}
