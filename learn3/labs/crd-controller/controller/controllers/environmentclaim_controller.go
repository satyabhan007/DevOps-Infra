// Package controllers holds the reconcile loop for EnvironmentClaim.
//
// This is a structural skeleton meant to be read, not built as-is: it shows
// the controller-runtime idioms (Reconciler struct, owned-object watches,
// finalizers, status subresource updates) that back Chapter 6's discussion
// of the operator pattern. A real implementation would also generate RBAC
// and webhook manifests via `make manifests` and vendor the platform.example.com
// API group from api/v1alpha1.
package controllers

import (
	"context"
	"fmt"
	"time"

	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	"sigs.k8s.io/controller-runtime/pkg/log"

	platformv1alpha1 "example.com/environmentclaim-controller/api/v1alpha1"
)

const environmentClaimFinalizer = "platform.example.com/environmentclaim-finalizer"

// sizePresets maps the spec.template enum to ResourceQuota hard limits.
var sizePresets = map[string]corev1.ResourceList{
	"small": {
		corev1.ResourceRequestsCPU:    mustQuantity("2"),
		corev1.ResourceRequestsMemory: mustQuantity("4Gi"),
	},
	"medium": {
		corev1.ResourceRequestsCPU:    mustQuantity("8"),
		corev1.ResourceRequestsMemory: mustQuantity("16Gi"),
	},
	"large": {
		corev1.ResourceRequestsCPU:    mustQuantity("16"),
		corev1.ResourceRequestsMemory: mustQuantity("32Gi"),
	},
}

// EnvironmentClaimReconciler reconciles an EnvironmentClaim object.
type EnvironmentClaimReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=platform.example.com,resources=environmentclaims,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=platform.example.com,resources=environmentclaims/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=platform.example.com,resources=environmentclaims/finalizers,verbs=update
// +kubebuilder:rbac:groups="",resources=namespaces,verbs=get;list;watch;create;delete
// +kubebuilder:rbac:groups="",resources=resourcequotas,verbs=get;list;watch;create;update
// +kubebuilder:rbac:groups=networking.k8s.io,resources=networkpolicies,verbs=get;list;watch;create;update

// Reconcile drives an EnvironmentClaim toward its desired state: a
// namespace, a sized ResourceQuota, and (optionally) an isolating
// NetworkPolicy, torn down again once the claim expires or is deleted.
func (r *EnvironmentClaimReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	logger := log.FromContext(ctx)

	var claim platformv1alpha1.EnvironmentClaim
	if err := r.Get(ctx, req.NamespacedName, &claim); err != nil {
		if apierrors.IsNotFound(err) {
			return ctrl.Result{}, nil
		}
		return ctrl.Result{}, fmt.Errorf("fetching EnvironmentClaim: %w", err)
	}

	// Handle deletion: release the provisioned namespace before letting the
	// object itself go away.
	if !claim.DeletionTimestamp.IsZero() {
		return r.finalize(ctx, &claim)
	}

	if !controllerutil.ContainsFinalizer(&claim, environmentClaimFinalizer) {
		controllerutil.AddFinalizer(&claim, environmentClaimFinalizer)
		if err := r.Update(ctx, &claim); err != nil {
			return ctrl.Result{}, fmt.Errorf("adding finalizer: %w", err)
		}
	}

	targetNS := claim.Status.Namespace
	if targetNS == "" {
		targetNS = generateNamespaceName(&claim)
	}

	if err := r.ensureNamespace(ctx, targetNS, &claim); err != nil {
		return ctrl.Result{}, fmt.Errorf("ensuring namespace: %w", err)
	}
	if err := r.ensureResourceQuota(ctx, targetNS, claim.Spec.Template); err != nil {
		return ctrl.Result{}, fmt.Errorf("ensuring resource quota: %w", err)
	}
	if claim.Spec.NetworkIsolation {
		if err := r.ensureNetworkPolicy(ctx, targetNS); err != nil {
			return ctrl.Result{}, fmt.Errorf("ensuring network policy: %w", err)
		}
	}

	ttl := claim.Spec.TTLHours
	if ttl == 0 {
		ttl = 48
	}
	expiresAt := metav1.NewTime(claim.CreationTimestamp.Add(time.Duration(ttl) * time.Hour))

	claim.Status.Phase = platformv1alpha1.PhaseReady
	claim.Status.Namespace = targetNS
	claim.Status.ExpiresAt = &expiresAt
	if err := r.Status().Update(ctx, &claim); err != nil {
		return ctrl.Result{}, fmt.Errorf("updating status: %w", err)
	}

	// Re-check well before expiry so PhaseExpiring / teardown fire on time.
	requeueAfter := time.Until(expiresAt.Time) / 2
	if requeueAfter <= 0 {
		requeueAfter = time.Minute
	}
	logger.Info("reconciled EnvironmentClaim", "namespace", targetNS, "expiresAt", expiresAt)
	return ctrl.Result{RequeueAfter: requeueAfter}, nil
}

func (r *EnvironmentClaimReconciler) finalize(ctx context.Context, claim *platformv1alpha1.EnvironmentClaim) (ctrl.Result, error) {
	if controllerutil.ContainsFinalizer(claim, environmentClaimFinalizer) {
		if claim.Status.Namespace != "" {
			ns := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: claim.Status.Namespace}}
			if err := r.Delete(ctx, ns); err != nil && !apierrors.IsNotFound(err) {
				return ctrl.Result{}, fmt.Errorf("deleting namespace %s: %w", claim.Status.Namespace, err)
			}
		}
		controllerutil.RemoveFinalizer(claim, environmentClaimFinalizer)
		if err := r.Update(ctx, claim); err != nil {
			return ctrl.Result{}, fmt.Errorf("removing finalizer: %w", err)
		}
	}
	return ctrl.Result{}, nil
}

func (r *EnvironmentClaimReconciler) ensureNamespace(ctx context.Context, name string, owner *platformv1alpha1.EnvironmentClaim) error {
	ns := &corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: name}}
	_, err := controllerutil.CreateOrUpdate(ctx, r.Client, ns, func() error {
		if ns.Labels == nil {
			ns.Labels = map[string]string{}
		}
		ns.Labels["platform.example.com/owner"] = owner.Spec.Owner
		ns.Labels["platform.example.com/claim"] = owner.Name
		return nil
	})
	return err
}

func (r *EnvironmentClaimReconciler) ensureResourceQuota(ctx context.Context, namespace, template string) error {
	hard, ok := sizePresets[template]
	if !ok {
		return fmt.Errorf("unknown template %q", template)
	}
	rq := &corev1.ResourceQuota{ObjectMeta: metav1.ObjectMeta{Name: "environment-claim", Namespace: namespace}}
	_, err := controllerutil.CreateOrUpdate(ctx, r.Client, rq, func() error {
		rq.Spec.Hard = hard
		return nil
	})
	return err
}

func (r *EnvironmentClaimReconciler) ensureNetworkPolicy(ctx context.Context, namespace string) error {
	np := &networkingv1.NetworkPolicy{ObjectMeta: metav1.ObjectMeta{Name: "deny-cross-namespace", Namespace: namespace}}
	_, err := controllerutil.CreateOrUpdate(ctx, r.Client, np, func() error {
		np.Spec = networkingv1.NetworkPolicySpec{
			PodSelector: metav1.LabelSelector{},
			PolicyTypes: []networkingv1.PolicyType{networkingv1.PolicyTypeIngress},
			Ingress: []networkingv1.NetworkPolicyIngressRule{{
				From: []networkingv1.NetworkPolicyPeer{{
					NamespaceSelector: &metav1.LabelSelector{
						MatchLabels: map[string]string{"kubernetes.io/metadata.name": namespace},
					},
				}},
			}},
		}
		return nil
	})
	return err
}

func generateNamespaceName(claim *platformv1alpha1.EnvironmentClaim) string {
	suffix := claim.Spec.NamespaceSuffix
	if suffix == "" {
		suffix = claim.Name
	}
	return fmt.Sprintf("env-%s-%s", sanitize(claim.Spec.Owner), suffix)
}

// SetupWithManager wires the reconciler into the manager and registers
// watches for the objects it owns, so edits to a generated namespace or
// quota trigger a re-reconcile of the owning claim.
func (r *EnvironmentClaimReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&platformv1alpha1.EnvironmentClaim{}).
		Owns(&corev1.ResourceQuota{}).
		Owns(&networkingv1.NetworkPolicy{}).
		Complete(r)
}
