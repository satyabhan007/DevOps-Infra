# require_tags.rego — every taggable resource must carry at least the
# Owner and Environment tags, so cost and incidents can be attributed.

package main

taggable_types := {
	"aws_instance",
	"aws_vpc",
	"aws_subnet",
	"aws_s3_bucket",
	"aws_lb",
	"aws_db_instance",
	"aws_dynamodb_table",
	"aws_autoscaling_group",
}

required_tags := {"Owner", "Environment"}

deny[msg] {
	some resource_type
	taggable_types[resource_type]
	some name
	resource := input.resource[resource_type][name]
	not resource.tags
	msg := sprintf("%s.%s: missing required tags %v (no tags block at all)", [resource_type, name, required_tags])
}

deny[msg] {
	some resource_type
	taggable_types[resource_type]
	some name
	resource := input.resource[resource_type][name]
	resource.tags
	some tag
	required_tags[tag]
	not resource.tags[tag]
	msg := sprintf("%s.%s: missing required tag %q", [resource_type, name, tag])
}
