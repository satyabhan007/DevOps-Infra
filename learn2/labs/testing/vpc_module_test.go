// Package testing exercises the terraform/modules/vpc module with
// Terratest: apply it for real against a live AWS account, assert on
// its outputs, then destroy it. This is the "does it actually work"
// layer that `terraform validate` (structural, offline) can't give
// you — it needs real AWS credentials and costs a few cents per run,
// so it's not part of the offline CI gate for this repo; run it by
// hand or from a scheduled/nightly job with credentials wired in.
//
//	cd learn2/labs/testing
//	go test -v -timeout 30m -run TestVpcModuleCreatesExpectedSubnets
package testing

import (
	"fmt"
	"strings"
	"testing"

	"github.com/gruntwork-io/terratest/modules/aws"
	"github.com/gruntwork-io/terratest/modules/random"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestVpcModuleCreatesExpectedSubnets applies terraform/modules/vpc
// standalone (via a generated root that just calls the module — see
// the -var overrides below), then checks that:
//   - the VPC exists with the CIDR block we asked for
//   - it created exactly as many public and private subnets as AZs given
//   - the NAT gateway output is populated when enable_nat_gateway=true
func TestVpcModuleCreatesExpectedSubnets(t *testing.T) {
	t.Parallel()

	awsRegion := "eu-west-1"
	azs := []string{"eu-west-1a", "eu-west-1b"}

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../terraform/modules/vpc",
		Vars: map[string]interface{}{
			"name":                 fmt.Sprintf("terratest-vpc-%s", strings.ToLower(random.UniqueId())),
			"cidr_block":           "10.99.0.0/16",
			"azs":                  azs,
			"public_subnet_cidrs":  []string{"10.99.0.0/24", "10.99.1.0/24"},
			"private_subnet_cidrs": []string{"10.99.10.0/24", "10.99.11.0/24"},
			"enable_nat_gateway":   true,
		},
		EnvVars: map[string]string{
			"AWS_DEFAULT_REGION": awsRegion,
		},
	})

	// Always destroy, even if an assertion below fails.
	defer terraform.Destroy(t, terraformOptions)

	terraform.InitAndApply(t, terraformOptions)

	vpcID := terraform.Output(t, terraformOptions, "vpc_id")
	require.NotEmpty(t, vpcID, "vpc_id output must not be empty")

	publicSubnetIDs := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
	privateSubnetIDs := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
	natGatewayIDs := terraform.OutputList(t, terraformOptions, "nat_gateway_ids")

	assert.Len(t, publicSubnetIDs, len(azs), "expected one public subnet per AZ")
	assert.Len(t, privateSubnetIDs, len(azs), "expected one private subnet per AZ")
	assert.Len(t, natGatewayIDs, 1, "expected exactly one NAT gateway")

	// Cross-check against the real VPC via the AWS SDK wrapper, not
	// just the terraform outputs — catches drift between what
	// terraform *thinks* it created and what's actually in AWS.
	actualVpc := aws.GetVpcById(t, vpcID, awsRegion)
	assert.Equal(t, "10.99.0.0/16", *actualVpc.CidrBlock)

	for _, subnetID := range publicSubnetIDs {
		tags := aws.GetTagsForSubnet(t, subnetID, awsRegion)
		assert.Equal(t, "public", tags["Tier"], "public subnet %s should be tagged Tier=public", subnetID)
	}
	for _, subnetID := range privateSubnetIDs {
		tags := aws.GetTagsForSubnet(t, subnetID, awsRegion)
		assert.Equal(t, "private", tags["Tier"], "private subnet %s should be tagged Tier=private", subnetID)
	}
}

// TestVpcModuleWithoutNatGateway checks the enable_nat_gateway=false
// path: the module must skip the NAT gateway and EIP entirely rather
// than creating one with a null allocation.
func TestVpcModuleWithoutNatGateway(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: "../terraform/modules/vpc",
		Vars: map[string]interface{}{
			"name":                 fmt.Sprintf("terratest-vpc-nonat-%s", strings.ToLower(random.UniqueId())),
			"cidr_block":           "10.98.0.0/16",
			"azs":                  []string{"eu-west-1a", "eu-west-1b"},
			"public_subnet_cidrs":  []string{"10.98.0.0/24", "10.98.1.0/24"},
			"private_subnet_cidrs": []string{"10.98.10.0/24", "10.98.11.0/24"},
			"enable_nat_gateway":   false,
		},
	})

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	natGatewayIDs := terraform.OutputList(t, terraformOptions, "nat_gateway_ids")
	assert.Empty(t, natGatewayIDs, "no NAT gateway should be created when enable_nat_gateway=false")
}
