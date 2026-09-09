# lab/ — the validator

`validate.py` is a **pure standard-library** Python script (no `pip
install`, runs offline) that checks the *shape* of every lab file in this
repo:

- repo skeleton (all the expected pages, guides, workflows exist)
- `learn/assets/course-data.js` — 8 chapters × 5 levels, each with a quiz
- every `*.md` guide carries an analogy **and** a production/real-world
  section, and is substantive
- Terraform examples — balanced braces, no tabs, a `terraform {}` block,
  pinned `required_version`, the module example actually calls a module,
  the remote-state example shows a backend
- Dockerfiles — a `FROM`, no `:latest`, no tabs; the multi-stage one uses
  `AS`, `--from=`, and a non-root `USER`; Compose defines a healthcheck
- Kubernetes manifests — every document has `apiVersion` / `kind` /
  `metadata` / a `name`; the full set of expected `kind`s is present;
  probes, resource requests+limits, and a `securityContext` are all
  demonstrated
- the landing page links into every topic directory

It is the source of truth for the green badge. The heavyweight tools —
`terraform validate`, `hadolint`, `kubeconform`, a real `docker build` —
run as separate jobs in `.github/workflows/lab-tests.yml`.

```bash
python lab/validate.py
```

Exit code `0` = all green, `1` = at least one check failed (the failing
labels are printed).
