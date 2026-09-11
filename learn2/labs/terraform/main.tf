# Root module — wires the reusable modules/vpc and modules/app together
# into one stack. This is the layout a real team scales with: root
# modules stay thin (call modules, pass variables), the reusable logic
# lives under modules/.
#
#   terraform init
#   terraform validate
#   terraform plan -var="ami_id=ami-xxxxxxxx"

provider "aws" {
  region = var.region

  default_tags {
    tags = local.common_tags
  }
}

locals {
  common_tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
    Stack       = var.name
  }
}

module "vpc" {
  source = "./modules/vpc"

  name                 = "${var.name}-${var.environment}"
  cidr_block           = var.vpc_cidr
  azs                  = var.azs
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway   = true
  tags                 = local.common_tags
}

module "app" {
  source = "./modules/app"

  name               = "${var.name}-${var.environment}"
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_type      = var.instance_type
  ami_id             = var.ami_id
  tags               = local.common_tags
}
