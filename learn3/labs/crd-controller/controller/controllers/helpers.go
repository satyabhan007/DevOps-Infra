package controllers

import (
	"regexp"
	"strings"

	"k8s.io/apimachinery/pkg/api/resource"
)

// mustQuantity panics on an invalid literal; only ever called with the
// hard-coded strings in sizePresets above, so a panic here means a typo
// caught at controller startup, not at request time.
func mustQuantity(s string) resource.Quantity {
	q, err := resource.ParseQuantity(s)
	if err != nil {
		panic(err)
	}
	return q
}

var invalidDNSLabelChars = regexp.MustCompile(`[^a-z0-9-]+`)

// sanitize turns an owner string (often an email address) into something
// that's a legal DNS label component for use in a generated namespace name.
func sanitize(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, "@", "-at-")
	s = strings.ReplaceAll(s, ".", "-")
	s = invalidDNSLabelChars.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}
