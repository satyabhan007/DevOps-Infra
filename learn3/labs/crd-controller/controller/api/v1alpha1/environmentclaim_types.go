// Package v1alpha1 contains the API Schema for the platform.example.com
// v1alpha1 API group. It mirrors ../../crd.yaml field-for-field: this file
// is what you'd run `controller-gen` against to regenerate that CRD.
package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// EnvironmentClaimSpec is the desired state of an EnvironmentClaim.
type EnvironmentClaimSpec struct {
	// Owner is the Slack handle or email of the requester.
	// +kubebuilder:validation:MinLength=1
	Owner string `json:"owner"`

	// Template selects the ResourceQuota sizing preset.
	// +kubebuilder:validation:Enum=small;medium;large
	Template string `json:"template"`

	// TTLHours is how long the environment lives before automatic teardown.
	// +kubebuilder:validation:Minimum=1
	// +kubebuilder:validation:Maximum=720
	// +kubebuilder:default=48
	TTLHours int32 `json:"ttlHours,omitempty"`

	// NamespaceSuffix is appended to "env-<owner>-" for the generated namespace.
	// +optional
	NamespaceSuffix string `json:"namespaceSuffix,omitempty"`

	// NetworkIsolation, when true, denies cross-namespace traffic via a
	// NetworkPolicy the controller creates alongside the namespace.
	// +kubebuilder:default=true
	NetworkIsolation bool `json:"networkIsolation,omitempty"`
}

// EnvironmentClaimPhase is the coarse-grained lifecycle state of a claim.
type EnvironmentClaimPhase string

const (
	PhasePending      EnvironmentClaimPhase = "Pending"
	PhaseProvisioning EnvironmentClaimPhase = "Provisioning"
	PhaseReady        EnvironmentClaimPhase = "Ready"
	PhaseExpiring     EnvironmentClaimPhase = "Expiring"
	PhaseTerminated   EnvironmentClaimPhase = "Terminated"
	PhaseFailed       EnvironmentClaimPhase = "Failed"
)

// EnvironmentClaimStatus is the observed state of an EnvironmentClaim.
type EnvironmentClaimStatus struct {
	Phase      EnvironmentClaimPhase `json:"phase,omitempty"`
	Namespace  string                `json:"namespace,omitempty"`
	ExpiresAt  *metav1.Time          `json:"expiresAt,omitempty"`
	Conditions []metav1.Condition    `json:"conditions,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status
// +kubebuilder:printcolumn:name="Template",type=string,JSONPath=`.spec.template`
// +kubebuilder:printcolumn:name="Phase",type=string,JSONPath=`.status.phase`
// +kubebuilder:printcolumn:name="Expires",type=string,JSONPath=`.status.expiresAt`
// +kubebuilder:resource:shortName=envclaim;ec

// EnvironmentClaim is the Schema for the environmentclaims API.
type EnvironmentClaim struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   EnvironmentClaimSpec   `json:"spec,omitempty"`
	Status EnvironmentClaimStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// EnvironmentClaimList contains a list of EnvironmentClaim.
type EnvironmentClaimList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []EnvironmentClaim `json:"items"`
}
