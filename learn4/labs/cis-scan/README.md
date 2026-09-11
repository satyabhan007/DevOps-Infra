# CIS benchmark scan — kube-bench

Runs [aquasecurity/kube-bench](https://github.com/aquasecurity/kube-bench)
as a Kubernetes `Job` to check a cluster node against the CIS Kubernetes
Benchmark — the same checks an auditor or a security team's automated scan
would run.

## Files

- **`kube-bench-job.yaml`** — a `Namespace` (`cis-scan`) plus a `Job` that
  runs kube-bench with `--targets node` against the node it's scheduled on,
  mounting the host paths kube-bench needs read-only access to
  (`/etc/kubernetes`, `/var/lib/kubelet`, `/etc/systemd`, etc.) via
  `hostPath` volumes, and `hostPID: true` so it can inspect running process
  arguments (e.g. the kubelet's actual flags, not just its config file).

## Running it

```sh
kubectl apply -f kube-bench-job.yaml
kubectl logs -n cis-scan job/kube-bench-node
```

This example targets a worker node. For a control-plane node, change
`--targets node` to the master/control-plane target kube-bench reports for
your Kubernetes version (`kube-bench run --targets master` on older
releases; run `kube-bench run --help` against your image tag to see the
current target names), and add a `nodeSelector`/`tolerations` so the pod
actually schedules onto a control-plane node.

To check every node in the cluster, run this as a `DaemonSet` instead of a
`Job` — the container command and volumes stay the same.

## Interpreting findings

kube-bench prints one line per CIS Benchmark check, grouped by section
(e.g. `4.2 Kubelet`), each ending in `[PASS]`, `[FAIL]`, `[WARN]`, or
`[INFO]`:

- **`[FAIL]`** — the check found the setting is not compliant. Read the
  check's "remediation" text in the output — kube-bench prints the exact
  fix (a kubelet flag, a file permission, an API server flag) alongside
  each failure, not just the check id.
- **`[WARN]`** — the check needs a human judgment call kube-bench can't
  make automatically (e.g. "ensure that the --audit-log-path is set" when
  audit logging is an org policy decision, not a hard requirement). Triage
  these against your own security policy rather than treating every WARN
  as an action item.
- **`[PASS]`** — compliant, no action.
- **`[INFO]`** — informational only (e.g. "manual check required" items
  that can't be automated at all, like verifying image provenance).

Prioritize failures by what the check id's section tells you about blast
radius: `1.x` (control-plane component config) and `4.2.x` (kubelet
authn/authz — anonymous-auth, the kubelet API's own authorization mode)
findings generally matter more than `4.1.x` file-permission findings on a
managed/hosted control plane where you don't control those files anyway.
Re-run the scan after each remediation — some fixes (e.g. a kubelet flag)
require restarting the kubelet before the corresponding check flips to
`[PASS]`.

## Note on managed Kubernetes

On EKS/GKE/AKS, control-plane checks (`1.x`) will mostly report
`[INFO]`/`not applicable` — you don't control the control plane, the cloud
provider does, and each has its own CIS benchmark for what they manage.
This job's node-level checks (`4.x` kubelet, `5.x` policies) are what's
still actionable on managed clusters.

## Validate locally

```sh
yamllint kube-bench-job.yaml
kubeconform -ignore-missing-schemas kube-bench-job.yaml
```
