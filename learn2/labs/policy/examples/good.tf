# examples/good.tf — the compliant version of bad.tf. Run
# `conftest test good.tf` from this directory: zero denials.

resource "aws_s3_bucket" "private" {
  bucket = "acme-app-data"

  tags = {
    Owner       = "platform-team"
    Environment = "prod"
  }
}

resource "aws_s3_bucket_acl" "private" {
  bucket = aws_s3_bucket.private.id
  acl    = "private"
}

resource "aws_instance" "right_sized" {
  ami           = "ami-0123456789abcdef0"
  instance_type = "t3.medium"

  tags = {
    Owner       = "platform-team"
    Environment = "prod"
  }
}

resource "aws_vpc" "tagged" {
  cidr_block = "10.1.0.0/16"

  tags = {
    Owner       = "platform-team"
    Environment = "prod"
  }
}
