# restrict_instance_types.rego — only pre-approved, right-sized
# instance families/sizes may be launched. Keeps a fat-fingered
# "xlarge" typo (or a well-meaning "just make it faster") from turning
# into a five-figure line item.

package main

allowed_instance_types := {
	"t3.micro",
	"t3.small",
	"t3.medium",
	"t3.large",
	"m5.large",
	"m5.xlarge",
}

deny[msg] {
	some name
	instance := input.resource.aws_instance[name]
	not allowed_instance_types[instance.instance_type]
	msg := sprintf("aws_instance.%s: instance_type %q is not in the approved list %v", [name, instance.instance_type, allowed_instance_types])
}

deny[msg] {
	some name
	lt := input.resource.aws_launch_template[name]
	not allowed_instance_types[lt.instance_type]
	msg := sprintf("aws_launch_template.%s: instance_type %q is not in the approved list %v", [name, lt.instance_type, allowed_instance_types])
}
