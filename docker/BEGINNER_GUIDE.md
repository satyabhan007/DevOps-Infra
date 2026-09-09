# Docker & Containers — The Beginner's Guide

> A container is not a small virtual machine. It is one ordinary Linux
> process that has been lied to about what it can see and limited in what
> it can use.

Runnable labs: `docker/examples/` (multi-stage, hardened, compose).

---

## 1. What a container actually is

Two kernel features do all the work:

- **Namespaces** — control what a process can *see*. There are several
  (PID, network, mount, UTS, IPC, user). Give a process its own PID
  namespace and it thinks it is PID 1 and cannot see any other process.
  Its own network namespace = its own `eth0`, its own ports. Its own
  mount namespace + `pivot_root` = its own filesystem root.
- **cgroups** (control groups) — control what a process can *use*: CPU
  shares, memory ceiling, block-IO, PIDs count.

That is it. No hypervisor. No guest kernel. The container shares the
host's kernel and is scheduled like any other process. This is why it
starts in ~20 ms and a VM takes ~20 s.

### Analogy — hotel room vs house

A **VM** is a separate house: its own foundation, plumbing, electrical
(its own kernel and virtual hardware). Expensive, strong isolation.

A **container** is a hotel room: private door, bed, bathroom (namespaces)
and a metered socket (cgroups) — but it shares the building's foundation
and water main (the host kernel). Cheap, fast, weaker isolation (a
kernel exploit is a shared wall).

---

## 2. Images, layers, and the cache

An **image** is a stack of read-only **layers**, each a tarball of
filesystem changes, addressed by content hash. A **container** adds a
thin writable layer on top (copy-on-write).

```
┌─ writable layer ─┐   (the running container; gone when it is removed)
├─ COPY . .        ┤   layer D  — changes every commit
├─ RUN pip install ┤   layer C  — cached until requirements.txt changes
├─ COPY reqs.txt   ┤   layer B
└─ FROM python3.12 ┘   layer A  — shared by every image built on it
```

**The cache rule:** on `docker build`, Docker reuses a cached layer only
if that instruction *and every instruction before it* are unchanged.
The cache invalidates from the first change **downward**.

Consequence — **order instructions least-changing to most-changing**:

```dockerfile
# GOOD                              # BAD (reinstalls deps every code edit)
COPY requirements.txt .             COPY . .
RUN pip install -r requirements.txt RUN pip install -r requirements.txt
COPY . .
```

---

## 3. Multi-stage builds

Build with a fat toolchain image; ship only the artifact.

```dockerfile
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/app .

FROM gcr.io/distroless/static-debian12:nonroot AS runtime
COPY --from=build /out/app /app/app
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["/app/app"]
```

Result: a **~10 MB** image with no shell, no package manager, no
compilers, running as non-root. Compare ~800 MB for the `golang` image.

Why it matters in production:

- **smaller image → faster pull → faster autoscaling and rollback**
- **tiny attack surface** — no `sh`, no `curl`, nothing for an attacker
  to pivot with. CVE scanners return almost nothing.
- **the build cache** means editing `main.go` rebuilds in ~1 s (only the
  last two layers), not from `FROM`.

### Analogy — the restaurant kitchen

You cook in a full commercial kitchen with every appliance (build stage).
The diner gets only the plated dish (runtime stage). They do not need
your ovens — and they definitely do not need your knives.

See `docker/examples/multistage/`.

---

## 4. PID 1, signals, and shutdown

The first process in a container is the **init** process. It has two
kernel-imposed duties: forward signals to children, and **reap zombie**
processes. If you get PID 1 wrong, `docker stop` / Kubernetes rollout
hangs for the full grace period then `SIGKILL`s.

```dockerfile
# BAD — shell is PID 1, `python` is its child; SIGTERM hits the shell,
# which does not forward it. App is killed hard after 10s / 30s.
CMD python app.py &

# GOOD — exec form: python IS PID 1 and receives SIGTERM directly.
ENTRYPOINT ["python", "app.py"]

# ALSO GOOD — a tiny init that reaps zombies and forwards signals.
ENTRYPOINT ["tini", "--", "python", "app.py"]
```

Your app must then **handle SIGTERM**: stop accepting new work, finish
in-flight requests, close DB connections, exit. Kubernetes gives you
`terminationGracePeriodSeconds` (default 30) to do it.

---

## 5. Storage and networking

**Storage:**
- **Volume** — Docker-managed, persists past the container. Use for data
  (databases). `docker volume create pgdata`.
- **Bind mount** — a host path mapped in. Great for dev (live code
  reload); avoid in prod (couples you to host layout).
- **tmpfs** — in-memory, for secrets/scratch you never want on disk.
- The container's writable layer is **ephemeral** — it dies with the
  container. Never store anything you care about there.

**Networking:**
- Containers on the same **user-defined bridge network** reach each other
  by **container name** (Docker runs an embedded DNS).
- **Publish** a port to expose to the host: `-p 8080:80` (host:container).
- `--network host` shares the host's stack (no isolation, no port
  mapping) — occasionally needed, usually a smell.

---

## 6. Compose — the whole stack at once

```yaml
services:
  app:
    build: ../hardened
    depends_on:
      db: { condition: service_healthy }   # wait for REAL readiness
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:5000/healthz"]
  db:
    image: postgres:16.4-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:
```

`docker compose up` builds the graph, starts `db`, waits until its
healthcheck passes, *then* starts `app`. `docker compose down -v` also
drops the named volumes. Runnable: `docker/examples/compose/`.

---

## 7. Production examples

**Example: the 1.2 GB image.** A Node service shipped `node:20` (not
`-slim`), `npm install` including devDependencies, and the whole repo
(no `.dockerignore`). Fix: `node:20-slim` base, multi-stage with
`npm ci --omit=dev`, `.dockerignore` for `node_modules`/`.git`/tests.
1.2 GB → 180 MB. Pull time on scale-out dropped from 40 s to 6 s.

**Example: prod-parity bug.** Works locally, crashes in prod. Local dev
used a bind mount that masked a file the image was missing. Running the
*actual image* locally (`docker run`, no mounts) reproduced it instantly.

**Example: the leaked key.** `docker history` on a public image showed
`COPY .env .` in layer 6, then `RUN rm .env` in layer 9 — but layer 6
still contains the file. Fix: `.dockerignore` the `.env`, use BuildKit
`--mount=type=secret` for build-time secrets, rotate the key.

**Example: OOM in CI, fine locally.** The build ran `webpack` with no
memory limit; the CI runner had 2 GB, the laptop had 32. Added
`NODE_OPTIONS=--max-old-space-size=1536` and a bigger runner for that
job. The container memory limit was the signal, not the bug.

---

## 8. Next

- **`docker/SCENARIOS.md`** — image bloat, cache misses, zombie PID 1,
  the OOMKill, registry auth, multi-arch, with fixes.
- **`kubernetes/BEGINNER_GUIDE.md`** — where these images actually run.
- Labs: `docker/examples/multistage`, `.../hardened`, `.../compose`.
