# Cluster autoscaling — Karpenter vs. Cluster Autoscaler

Two ways to answer "a pod is unschedulable, get it a node": provision a
right-sized node on demand (Karpenter), or scale a pre-defined group of
identical nodes (Cluster Autoscaler). See Chapter 15 for the full
tradeoff discussion; the short version is below.

## Files

- `karpenter-nodepool.yaml` — a `NodePool` (instance family/generation
  constraints, spot-or-on-demand, a 720h `expireAfter` for AMI drift, and
  consolidation of underutilized nodes) plus the AWS-specific
  `EC2NodeClass` it references (AMI family, subnets/security groups by
  discovery tag, encrypted gp3 root volume).
- `cluster-autoscaler-deployment.yaml` — the CA controller `Deployment`,
  configured with `--expander=least-waste`, `--balance-similar-node-groups`,
  and ASG auto-discovery by tag — the classic EKS managed-node-group setup.

## The tradeoff, briefly

| | Karpenter | Cluster Autoscaler |
|---|---|---|
| Unit of scaling | Individual node, sized to the pending pod(s) | A whole ASG/node-group, pre-defined instance type(s) |
| Bin-packing | Chooses from ~any instance type matching `requirements` | Limited to whatever node-groups you've created |
| Setup | One `NodePool` + `EC2NodeClass`; no ASGs to manage | ASGs/node-groups must exist first, with min/max sizes |
| Best fit | Heterogeneous, bursty, cost-sensitive workloads | Simpler estates already standardized on a few instance types, or non-AWS clouds where Karpenter's provider support is thinner |
| Scale-down | `consolidationPolicy: WhenEmptyOrUnderutilized` actively repacks | Waits out `--scale-down-unneeded-time`, evicts, doesn't repack |

In practice: start with Cluster Autoscaler if you already have node-groups
and want the smallest possible change; move to Karpenter when instance-type
sprawl or bin-packing waste starts showing up in the AWS bill.

## Try it

```sh
kubectl apply -f karpenter-nodepool.yaml          # requires the Karpenter controller installed
kubectl apply -f cluster-autoscaler-deployment.yaml  # requires the CA RBAC (ServiceAccount/ClusterRole) applied first
```
