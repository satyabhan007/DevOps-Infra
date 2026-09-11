# deny_public_s3.rego — no S3 bucket may be created (or ACL'd) public.
#
# Covers both the legacy inline `acl` argument on aws_s3_bucket and the
# separate aws_s3_bucket_acl resource the AWS provider moved to in v4.

package main

public_acls := {"public-read", "public-read-write", "authenticated-read"}

deny[msg] {
	some name
	bucket := input.resource.aws_s3_bucket[name]
	public_acls[bucket.acl]
	msg := sprintf("aws_s3_bucket.%s: acl %q makes the bucket public — use \"private\" and grant access via bucket policy instead", [name, bucket.acl])
}

deny[msg] {
	some name
	acl := input.resource.aws_s3_bucket_acl[name]
	public_acls[acl.acl]
	msg := sprintf("aws_s3_bucket_acl.%s: acl %q makes the bucket public — use \"private\" and grant access via bucket policy instead", [name, acl.acl])
}
