# DevOps-Infra

**Infrastructure as Code, Terraform, Docker & Kubernetes — from first
principles, with runnable labs, production scenarios, and SRE playbooks.**

Live site: **https://satyabhan007.github.io/DevOps-Infra/**
Sibling project to [AI-ML](https://github.com/satyabhan007/AI-ML).

---

## What is in here

| Path | Contents |
|------|----------|
| `index.html`, `assets/` | The landing page (dark theme, zero-build static site). |
| `learn/` | Part 1 — an 8-chapter × 5-level interactive course (analogy → expert), progress saved in `localStorage`. |
| `learn2/` | Part 2 — Terraform & IaC at Scale: 16 chapters × 5 levels (modules, remote state, drift, policy as code, multi-cloud, testing, CI/CD for infra, cost governance). |
| `learn3/` | Part 3 — Kubernetes Platform Engineering: 16 chapters × 5 levels (CRDs/operators, Helm, GitOps, service mesh, multi-tenancy, admission control, autoscaling, security). |
| `learn4/` | Part 4 — Cloud Networking, Identity & Security: 16 chapters × 5 levels (VPC design, IAM, zero-trust, Vault, mTLS, compliance, secure landing zones). |
| `learn5/` | Part 5 — Observability & Incident Engineering: 16 chapters × 5 levels (Prometheus, Grafana, OpenTelemetry, SLOs, alerting, chaos engineering, postmortems). |
| `iac/` | IaC fundamentals — `BEGINNER_GUIDE.md` (analogy, drift, state) + `DEEP_DIVE.md` (reconciliation, GitOps, policy). |
| `terraform/` | `BEGINNER_GUIDE.md`, `SCENARIOS.md` (stuck locks, drift, import, secret leaks), and 4 runnable `examples/`. |
| `docker/` | `BEGINNER_GUIDE.md`, `SCENARIOS.md`, and `examples/` — multi-stage, hardened, Compose. |
| `kubernetes/` | `BEGINNER_GUIDE.md`, `DEEP_DIVE.md`, `INTERVIEW.md`, `PROD_SCENARIOS.md` (12 on-call runbooks), `APPLICATIONS.md`, and 10 `manifests/`. |
| `sre/` | `BEGINNER_GUIDE.md` (SLI/SLO/error budget, golden signals), `PROD_CHALLENGES.md` (worked incidents), `INTERVIEW_QA.md`. |
| `lab/` | `validate.py` — zero-dependency structural checks over every lab file. |

Every guide follows the same shape: **an analogy**, the mechanics, and
**production examples / scenarios** (what breaks, how you fix it, how you
prevent it).

---

## Quick start

```bash
git clone https://github.com/satyabhan007/DevOps-Infra.git
cd DevOps-Infra

# 1. structural checks — no dependencies, runs offline
python lab/validate.py

# 2. a real Terraform lab (needs terraform; uses the `random` provider only)
cd terraform/examples/01-hello && terraform init && terraform plan

# 3. a real container build (needs Docker)
docker build -t devops-infra/demo docker/examples/multistage

# 4. validate every manifest (needs kubeconform, or use kubectl)
kubectl apply --dry-run=client -f kubernetes/manifests/
```

---

## CI

`.github/workflows/`:

- **`lab-tests.yml`** — four gates:
  - `validate` — `python lab/validate.py` (the badge)
  - `terraform` — `fmt -check` + `init` + `validate` on every example
  - `docker` — `hadolint` on every Dockerfile + a real multi-stage build
  - `kubernetes` — `kubeconform` (strict) on every manifest
- **`deploy-pages.yml`** — publishes the static site + raw lab sources to
  GitHub Pages on push to `main`.

---

## License

MIT — see `LICENSE`.
