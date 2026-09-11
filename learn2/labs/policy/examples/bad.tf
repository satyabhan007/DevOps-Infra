# examples/bad.tf — deliberately violates all three policies in
# ../policies/. Run `conftest test bad.tf` from this directory to see
# each denial.

resource "aws_s3_bucket" "leaky" {
  bucket = "acme-public-dumps"
}

resource "aws_s3_bucket_acl" "leaky" {
  bucket = aws_s3_bucket.leaky.id
  acl    = "public-read"
}

resource "aws_instance" "oversized" {
  ami           = "ami-0123456789abcdef0"
  instance_type = "m5.24xlarge"
}

resource "aws_vpc" "untagged" {
  cidr_block = "10.1.0.0/16"
}
