# ---------------------------------------------------------------------------
# 3-tier VPC module: public / private / data subnets across 2-3 AZs.
#
#   public   -> route to Internet Gateway (load balancers, bastion/NAT)
#   private  -> route to NAT Gateway      (application/compute tier)
#   data     -> no internet route         (RDS, ElastiCache, etc.)
# ---------------------------------------------------------------------------

locals {
  az_count = length(var.azs)
  common_tags = merge(
    {
      "Name"      = var.name
      "ManagedBy" = "terraform"
      "Module"    = "learn4-labs-vpc"
    },
    var.tags
  )

  # AZs actually used for NAT: just the first one when single_nat_gateway,
  # otherwise every AZ.
  nat_azs = var.single_nat_gateway ? [var.azs[0]] : var.azs
}

# ---------------------------------------------------------------------------
# VPC + Internet Gateway
# ---------------------------------------------------------------------------

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    "Name" = var.name
  })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    "Name" = "${var.name}-igw"
  })
}

# ---------------------------------------------------------------------------
# Subnets — one of each tier per AZ
# ---------------------------------------------------------------------------

resource "aws_subnet" "public" {
  count = local.az_count

  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.azs[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    "Name" = "${var.name}-public-${var.azs[count.index]}"
    "Tier" = "public"
  })
}

resource "aws_subnet" "private" {
  count = local.az_count

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]

  tags = merge(local.common_tags, {
    "Name" = "${var.name}-private-${var.azs[count.index]}"
    "Tier" = "private"
  })
}

resource "aws_subnet" "data" {
  count = local.az_count

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.data_subnet_cidrs[count.index]
  availability_zone = var.azs[count.index]

  tags = merge(local.common_tags, {
    "Name" = "${var.name}-data-${var.azs[count.index]}"
    "Tier" = "data"
  })
}

# ---------------------------------------------------------------------------
# NAT gateway(s) — one shared (default) or one per AZ
# ---------------------------------------------------------------------------

resource "aws_eip" "nat" {
  for_each = toset(local.nat_azs)

  domain = "vpc"

  tags = merge(local.common_tags, {
    "Name" = "${var.name}-nat-eip-${each.key}"
  })

  depends_on = [aws_internet_gateway.this]
}

resource "aws_nat_gateway" "this" {
  for_each = toset(local.nat_azs)

  allocation_id = aws_eip.nat[each.key].id
  # NAT gateways must live in a public subnet in the same AZ.
  subnet_id = aws_subnet.public[index(var.azs, each.key)].id

  tags = merge(local.common_tags, {
    "Name" = "${var.name}-nat-${each.key}"
  })

  depends_on = [aws_internet_gateway.this]
}

# ---------------------------------------------------------------------------
# Route tables
# ---------------------------------------------------------------------------

# Public: single shared route table -> IGW
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    "Name" = "${var.name}-public-rt"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "public" {
  count = local.az_count

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private: one route table per AZ (each pointed at the AZ's NAT gateway, or
# the single shared one when single_nat_gateway is true) so each AZ can
# still egress even if another AZ's NAT gateway fails.
resource "aws_route_table" "private" {
  count = local.az_count

  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    "Name" = "${var.name}-private-rt-${var.azs[count.index]}"
  })
}

resource "aws_route" "private_nat" {
  count = local.az_count

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[var.single_nat_gateway ? var.azs[0] : var.azs[count.index]].id
}

resource "aws_route_table_association" "private" {
  count = local.az_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Data: same egress pattern as private (needed for patching/metrics), but
# kept in its own route tables so a future change (e.g. removing the
# default route entirely for a fully air-gapped data tier) doesn't touch
# the app tier.
resource "aws_route_table" "data" {
  count = local.az_count

  vpc_id = aws_vpc.this.id

  tags = merge(local.common_tags, {
    "Name" = "${var.name}-data-rt-${var.azs[count.index]}"
  })
}

resource "aws_route" "data_nat" {
  count = local.az_count

  route_table_id         = aws_route_table.data[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[var.single_nat_gateway ? var.azs[0] : var.azs[count.index]].id
}

resource "aws_route_table_association" "data" {
  count = local.az_count

  subnet_id      = aws_subnet.data[count.index].id
  route_table_id = aws_route_table.data[count.index].id
}
