# Single-stage, but hardened — the checklist that turns a naive
# `FROM python` into something you would run in production.
#
#   docker build -t demo:hardened .
#   docker run --rm -p 5000:5000 demo:hardened
#   docker scout cves demo:hardened   # or: trivy image demo:hardened
#
# The seven fixes, top to bottom:
#   1. pinned, slim base (digest-pinnable) — reproducible, small
#   2. OCI labels — provenance for humans and scanners
#   3. one RUN for apt, with --no-install-recommends and list cleanup
#   4. a dedicated non-root user, created explicitly
#   5. deps installed before app code — cache survives code edits
#   6. no pip cache in the layer
#   7. HEALTHCHECK + exec-form ENTRYPOINT so orchestrators see real state

FROM python:3.12-slim-bookworm

LABEL org.opencontainers.image.title="devops-infra hardened demo" \
      org.opencontainers.image.source="https://github.com/satyabhan007/DevOps-Infra"

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 appuser

WORKDIR /app

# Deps layer first: rebuilt only when requirements.txt changes.
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./

# Numeric UID (matches the useradd above) so it resolves on any host.
USER 10001
EXPOSE 5000

# JSON/exec form; the shell is explicit so `|| exit 1` still works.
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
    CMD ["sh", "-c", "curl -fsS http://localhost:5000/healthz || exit 1"]

ENTRYPOINT ["python", "app.py"]
