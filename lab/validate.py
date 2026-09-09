#!/usr/bin/env python3
"""
DevOps-Infra lab validator — pure standard library, zero dependencies.

This is the source of truth for the "checks passing" badge. It does NOT
need terraform, docker or kubectl installed: it validates the *shape* of
every lab file (balanced blocks, required keys, no tabs, expected
resources present) so a broken example fails CI immediately and offline.

The heavyweight tools (terraform validate, hadolint, kubeconform) run as
separate jobs in .github/workflows/lab-tests.yml.

Run:  python lab/validate.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PASS = "\033[32m[ok]\033[0m" if sys.stdout.isatty() else "PASS"
FAIL = "\033[31m[XX]\033[0m" if sys.stdout.isatty() else "FAIL"

results: list[tuple[bool, str]] = []


def check(cond: bool, label: str) -> None:
    results.append((bool(cond), label))


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def exists(rel: str) -> bool:
    return (ROOT / rel).exists()


# --------------------------------------------------------------------------
# 1. Repo skeleton
# --------------------------------------------------------------------------
for f in [
    "index.html", "404.html", "README.md", "LICENSE",
    "assets/css/style.css", "assets/js/main.js", "assets/favicon.svg",
    "learn/index.html", "learn/assets/course-data.js",
    "learn/assets/course.js", "learn/assets/course.css",
    ".github/workflows/deploy-pages.yml", ".github/workflows/lab-tests.yml",
]:
    check(exists(f), f"skeleton: {f} present")

for topic in ["iac", "terraform", "docker", "kubernetes", "sre"]:
    check(exists(f"{topic}/BEGINNER_GUIDE.md"),
          f"skeleton: {topic}/BEGINNER_GUIDE.md present")


# --------------------------------------------------------------------------
# 2. Course data — 8 chapters x 5 levels, each with a quiz
# --------------------------------------------------------------------------
cd = read("learn/assets/course-data.js")
check("window.CHAPTERS" in cd, "course: exposes window.CHAPTERS")
n_chapters = len(re.findall(r"\bnum:\s*\d+", cd))
check(n_chapters == 8, f"course: 8 chapters (found {n_chapters})")
n_quiz = cd.count("quiz:")
check(n_quiz == 8, f"course: every chapter has a quiz block (found {n_quiz})")
for kw in ["analogy", "reallife", "IaC", "Terraform", "Docker",
           "Kubernetes", "SRE", "error budget"]:
    check(kw.lower() in cd.lower(), f"course: mentions '{kw}'")


# --------------------------------------------------------------------------
# 3. Markdown guides — must carry an analogy + a production section
# --------------------------------------------------------------------------
GUIDES = [
    "iac/BEGINNER_GUIDE.md", "iac/DEEP_DIVE.md",
    "terraform/BEGINNER_GUIDE.md", "terraform/SCENARIOS.md",
    "docker/BEGINNER_GUIDE.md", "docker/SCENARIOS.md",
    "kubernetes/BEGINNER_GUIDE.md", "kubernetes/DEEP_DIVE.md",
    "kubernetes/INTERVIEW.md", "kubernetes/PROD_SCENARIOS.md",
    "kubernetes/APPLICATIONS.md",
    "sre/BEGINNER_GUIDE.md", "sre/PROD_CHALLENGES.md", "sre/INTERVIEW_QA.md",
]
for g in GUIDES:
    check(exists(g), f"guide: {g} present")
    if not exists(g):
        continue
    body = read(g).lower()
    check("analog" in body, f"guide: {g} contains an analogy")
    check(any(w in body for w in ("production", "prod ", "3am", "3 a.m", "incident",
             "postmortem", "post-mortem", "real-world")),
          f"guide: {g} contains a production/real-world section")
    check(len(read(g)) > 1500, f"guide: {g} is substantive (>1.5 KB)")


# --------------------------------------------------------------------------
# 4. Terraform examples — balanced braces, no tabs, a terraform{} block
# --------------------------------------------------------------------------
tf_dirs = sorted(p for p in (ROOT / "terraform/examples").iterdir() if p.is_dir())
check(len(tf_dirs) >= 4, f"terraform: >=4 example stacks (found {len(tf_dirs)})")
for d in tf_dirs:
    tf_files = list(d.rglob("*.tf"))
    rel = d.relative_to(ROOT)
    check(bool(tf_files), f"terraform: {rel} has at least one .tf file")
    blob = "\n".join(f.read_text(encoding="utf-8") for f in tf_files)
    check("\t" not in blob, f"terraform: {rel} uses spaces, not tabs")
    check(blob.count("{") == blob.count("}"),
          f"terraform: {rel} has balanced braces")
    check(re.search(r"terraform\s*{", blob) is not None,
          f"terraform: {rel} declares a terraform {{}} block")
    check('required_version' in blob,
          f"terraform: {rel} pins required_version")

# the module example must actually call a module
mod = read("terraform/examples/03-module/main.tf")
check('module "' in mod, "terraform: 03-module calls a module block")
check(exists("terraform/examples/03-module/modules/service/main.tf"),
      "terraform: 03-module ships a local module")
# remote-state example must show a backend
rs = "\n".join(f.read_text(encoding="utf-8")
               for f in (ROOT / "terraform/examples/04-remote-state").glob("*.tf"))
check("backend " in rs, "terraform: 04-remote-state shows a backend block")


# --------------------------------------------------------------------------
# 5. Dockerfiles — FROM present, multistage uses AS + copies --from
# --------------------------------------------------------------------------
dockerfiles = sorted((ROOT / "docker/examples").rglob("Dockerfile"))
check(len(dockerfiles) >= 3, f"docker: >=3 Dockerfiles (found {len(dockerfiles)})")
for df in dockerfiles:
    rel = df.relative_to(ROOT)
    txt = df.read_text(encoding="utf-8")
    check(re.search(r"(?im)^\s*FROM\s+\S+", txt) is not None,
          f"docker: {rel} has a FROM instruction")
    check("\t" not in txt, f"docker: {rel} uses spaces, not tabs")
    check(":latest" not in txt, f"docker: {rel} pins image tags (no :latest)")

ms = read("docker/examples/multistage/Dockerfile")
check(len(re.findall(r"(?im)^\s*FROM\s.+\sAS\s", ms)) >= 1,
      "docker: multistage names a build stage with AS")
check("--from=" in ms, "docker: multistage copies artifacts with --from=")
check("USER " in ms, "docker: multistage drops root with USER")
check(exists("docker/examples/compose/docker-compose.yml"),
      "docker: compose example present")
check("healthcheck" in read("docker/examples/compose/docker-compose.yml").lower(),
      "docker: compose defines a healthcheck")


# --------------------------------------------------------------------------
# 6. Kubernetes manifests — required keys, no tabs, expected kinds present
# --------------------------------------------------------------------------
manifests = sorted((ROOT / "kubernetes/manifests").glob("*.y*ml"))
check(len(manifests) >= 9, f"k8s: >=9 manifest files (found {len(manifests)})")
seen_kinds: set[str] = set()
for m in manifests:
    rel = m.relative_to(ROOT)
    txt = m.read_text(encoding="utf-8")
    check("\t" not in txt, f"k8s: {rel} uses spaces, not tabs")
    # Split on YAML doc separators; keep only chunks that are real
    # manifests (a leading comment block before the first --- is not one).
    docs = [d for d in re.split(r"(?m)^---\s*$", txt) if "kind:" in d]
    check(bool(docs), f"k8s: {rel} has at least one document")
    for doc in docs:
        for key in ("apiVersion:", "kind:", "metadata:"):
            check(key in doc, f"k8s: {rel} document declares {key}")
        km = re.search(r"(?m)^kind:\s*([A-Za-z0-9]+)", doc)
        if km:
            seen_kinds.add(km.group(1))
        nm = re.search(r"(?m)^\s+name:\s*\S+", doc)
        check(nm is not None, f"k8s: {rel} document names its resource")

for kind in ["Pod", "Deployment", "Service", "ConfigMap", "Secret", "Ingress",
             "StatefulSet", "HorizontalPodAutoscaler", "Role", "RoleBinding",
             "NetworkPolicy", "PodDisruptionBudget"]:
    check(kind in seen_kinds, f"k8s: a {kind} manifest exists")

# probes + resource limits must appear somewhere in the workload manifests
allk8s = "\n".join(m.read_text(encoding="utf-8") for m in manifests)
check("livenessProbe" in allk8s and "readinessProbe" in allk8s,
      "k8s: liveness + readiness probes demonstrated")
check("resources:" in allk8s and "limits:" in allk8s and "requests:" in allk8s,
      "k8s: resource requests + limits demonstrated")
check("securityContext" in allk8s, "k8s: a securityContext is demonstrated")


# --------------------------------------------------------------------------
# 7. Cross-links — the landing page points at every topic
# --------------------------------------------------------------------------
idx = read("index.html")
for topic in ["iac/", "terraform/", "docker/", "kubernetes/", "sre/", "learn/", "lab/"]:
    check(topic in idx, f"index.html: links into {topic}")
check("learn/index.html" and exists("learn/index.html"), "learn: course page present")


# --------------------------------------------------------------------------
# report
# --------------------------------------------------------------------------
passed = sum(1 for ok, _ in results if ok)
total = len(results)
print()
for ok, label in results:
    if not ok:
        print(f"  {FAIL}  {label}")
print(f"\n{passed}/{total} checks passed.")
if passed != total:
    print("FAILED")
    sys.exit(1)
print("ALL GREEN")
