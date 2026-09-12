# modules/app — an ALB in front of an autoscaling group of app instances.
#
# The instance role is scoped to nothing (no inline policy attached) —
# in a real stack you'd attach exactly the managed/inline policies the
# app needs and nothing more. Left as a TODO marker below.

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}

locals {
  base_tags = merge(var.tags, {
    Module = "app"
    Name   = var.name
  })
}

resource "aws_security_group" "alb" {
  name        = "${var.name}-alb"
  description = "Allow inbound HTTP(S) to the load balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from the internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.base_tags, {
    Name = "${var.name}-alb-sg"
  })
}

resource "aws_security_group" "app" {
  name        = "${var.name}-app"
  description = "Allow inbound app traffic from the ALB only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "App port from the ALB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.base_tags, {
    Name = "${var.name}-app-sg"
  })
}

resource "aws_iam_role" "instance" {
  name = "${var.name}-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.base_tags
}

# TODO: attach the least-privilege managed/inline policies this app
# actually needs (e.g. CloudWatch Logs, S3 read on its config bucket).
resource "aws_iam_instance_profile" "instance" {
  name = "${var.name}-instance-profile"
  role = aws_iam_role.instance.name
}

resource "aws_launch_template" "app" {
  name_prefix   = "${var.name}-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.instance.name
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  metadata_options {
    http_tokens   = "required" # IMDSv2 only
    http_endpoint = "enabled"
  }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.base_tags, {
      Name = "${var.name}-instance"
    })
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "app" {
  name_prefix         = "${var.name}-"
  vpc_zone_identifier = var.private_subnet_ids
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.min_size
  target_group_arns   = [aws_lb_target_group.app.arn]

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  health_check_type         = "ELB"
  health_check_grace_period = 60

  dynamic "tag" {
    for_each = merge(local.base_tags, { Name = "${var.name}-asg" })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb" "app" {
  name               = "${var.name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  tags = merge(local.base_tags, {
    Name = "${var.name}-alb"
  })
}

resource "aws_lb_target_group" "app" {
  name     = "${var.name}-tg"
  port     = var.app_port
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/healthz"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 15
    timeout             = 5
  }

  tags = local.base_tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
