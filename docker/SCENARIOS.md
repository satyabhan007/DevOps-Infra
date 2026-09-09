# Docker — Production Scenarios

**Symptom → cause → fix → prevention.** The container failures you meet
on-call and in interviews.

> Analogy: an image is a shipping container. Most of these problems are
> packing problems — you shipped the whole warehouse instead of the
> product (bloat), you put the fragile box on the bottom (cache order),
> or you sealed a copy of your house keys inside the wall of the crate
> (a baked-in secret). Fix the packing list, not the ship.

---

## Scenario 1 — the image is huge and pulls slowly

**Symptom.** `docker images` shows 1.4 GB. Autoscaling is slow because
every new node spends a minute pulling.

**Cause.** Full base image (`python`, `node`, `openjdk` instead of
`-slim` / `-alpine` / distroless), build tools left in the final image,
no `.dockerignore` (the `.git` dir, tests, local `node_modules` all
copied in), package-manager caches not cleaned.

**Fix.**
- Multi-stage: build in the fat image, `COPY --from=build` the artifact
  into `-slim` / distroless.
- One `RUN` for package installs, with cleanup in the *same* layer:
  `apt-get update && apt-get install -y --no-install-recommends X && rm -rf /var/lib/apt/lists/*`.
- `.dockerignore`: start with `*`, allow back only what the build needs.
- `pip install --no-cache-dir`, `npm ci --omit=dev`.

**Prevention.** A CI check that fails if the image exceeds a size budget.
`dive` or `docker history` in review. Standardise base images across
teams.

---

## Scenario 2 — every build reinstalls all dependencies

**Symptom.** Changing one line of code triggers a 4-minute
`npm install` / `pip install` / `go mod download`.

**Cause.** `COPY . .` appears **before** the dependency-install step, so
its layer (which changes every commit) invalidates the install cache.

**Fix.**
```dockerfile
COPY package.json package-lock.json ./
RUN npm ci
COPY . .            # now code edits reuse the npm layer
```

**Prevention.** Lint rule / review checklist: manifest files copied and
deps installed before the app source. Use BuildKit cache mounts for the
package cache: `RUN --mount=type=cache,target=/root/.npm npm ci`.

---

## Scenario 3 — `docker stop` takes 10 seconds every time

**Symptom.** Stopping or rolling the container always pauses ~10 s (or
`terminationGracePeriodSeconds`) then the process dies hard. Logs show no
graceful shutdown.

**Cause.** PID 1 is a shell (`CMD app.sh` where the script runs the app
without `exec`), or the app is backgrounded, or the app simply does not
handle `SIGTERM`. The signal never reaches the real process, so the
runtime waits the full grace period and `SIGKILL`s.

**Fix.**
- Exec form: `ENTRYPOINT ["python", "app.py"]`, or `exec python app.py`
  at the end of an entrypoint script.
- Add `tini` (`docker run --init`, or `ENTRYPOINT ["tini","--",...]`) to
  reap zombies and forward signals.
- Implement a `SIGTERM` handler: drain, then exit 0.

**Prevention.** Test it: `docker run -d ...; time docker stop <id>` —
should be well under a second for a clean app.

---

## Scenario 4 — container OOMKilled

**Symptom.** Container exits with code 137. `docker inspect` →
`"OOMKilled": true`. Often intermittent, under load.

**Cause.** The process's RSS exceeded the container memory **limit**, so
the kernel's OOM killer terminated it. Common triggers: a JVM/Node heap
sized from *host* memory not the cgroup limit; an unbounded in-memory
cache or request buffer; a batch job loading a whole file.

**Fix.**
- Make the runtime cgroup-aware: modern JVMs (`-XX:+UseContainerSupport`,
  on by default in 11+), Node `--max-old-space-size`, Go `GOMEMLIMIT`.
- Raise the limit if the working set is genuinely that big — and raise
  the **request** to match so the scheduler reserves it.
- Fix the leak / stream the file instead of loading it.

**Prevention.** Load-test with the prod memory limit set. Alert on
`container_memory_working_set_bytes / limit > 0.9`. Set requests≈limits
for memory (Guaranteed QoS) on latency-critical services.

---

## Scenario 5 — "works on my machine", fails in the registry/cluster

**Symptom.** Local `docker build` + `docker run` is fine. The same image
in CI or the cluster misbehaves.

**Causes and fixes.**
- **Bind mount masking a bug.** Dev used `-v $PWD:/app`, hiding a file
  missing from the image. → Run the pure image locally: `docker run`
  with no mounts.
- **Architecture mismatch.** Built on an Apple-silicon laptop (arm64),
  cluster is amd64. → `docker buildx build --platform linux/amd64,linux/arm64`
  and push a manifest list.
- **Missing env / config.** Local `.env` not present in prod. → 12-factor
  config; fail fast on startup if a required var is unset.
- **Wrong tag pulled.** `:latest` moved. → Deploy by digest
  (`image@sha256:...`) or immutable tags (`:v1.4.2`, `:git-<sha>`).

**Prevention.** CI builds and runs the image (smoke test) on the target
architecture. Never deploy `:latest`.

---

## Scenario 6 — `docker build` fails / hangs in CI only

**Symptom.** Local build works; CI times out or OOMs during the build.

**Causes.**
- Build step (webpack, `go build`, `cargo`) needs more RAM than the CI
  runner has. → cap the tool's memory, or use a bigger runner for that
  job.
- No layer cache in CI (fresh runner each time). → `docker buildx` with
  `--cache-to/--cache-from` a registry, or a persistent BuildKit.
- Network egress blocked (can't reach a package mirror). → vendor deps,
  or an internal proxy/mirror.

**Prevention.** Give the build job explicit resource limits that match
what the tool actually needs. Warm the cache from the registry.

---

## Scenario 7 — secret baked into an image layer

**Symptom.** `trivy image` / `docker scout` flags a credential. Or
`docker history --no-trunc` shows `COPY .npmrc` / `ARG NPM_TOKEN`.

**Cause.** Secrets passed as `ARG`, or `COPY`-ed in and deleted in a
later layer. Earlier layers are immutable and still contain the file;
`ARG` values show in `docker history`.

**Fix.**
- Rotate the secret immediately.
- BuildKit: `RUN --mount=type=secret,id=npmtoken ...` — the secret is
  available during that `RUN` only, never persisted.
- For runtime secrets, inject at **run** time (env from a secret
  manager / Kubernetes Secret), never build time.

**Prevention.** `.dockerignore` all `.env`, `.npmrc`, `*.pem`. Image
scanning in CI as a blocking gate. Never `ARG` a token.

---

## Scenario 8 — disk full on the Docker host / node

**Symptom.** `no space left on device` during build or pull. Node goes
`NotReady` with `DiskPressure`.

**Cause.** Accumulated dangling images, stopped containers, build cache,
and unused volumes. On Kubernetes nodes: old image versions never
garbage-collected, plus large container logs.

**Fix.**
```bash
docker system df                    # where is the space going
docker system prune -af --volumes   # DANGER: also removes unused volumes
docker builder prune -af            # build cache only
```
On nodes: tune kubelet `--image-gc-high-threshold`, cap log size
(`--log-opt max-size=10m --log-opt max-file=3` / cluster log rotation).

**Prevention.** Scheduled prune on build hosts. Kubelet image GC + log
rotation configured. Alert on node disk > 80%.

---

## Quick reference

```bash
docker history --no-trunc IMAGE          # what each layer added (and how big)
dive IMAGE                               # interactive layer explorer
docker inspect --format '{{.State.OOMKilled}} {{.State.ExitCode}}' CID
docker stats                             # live CPU/mem/IO per container
docker run --rm -it --entrypoint sh IMAGE  # poke around a built image
docker buildx build --platform linux/amd64,linux/arm64 --push -t REPO:TAG .
docker system df                         # disk usage by images/containers/cache/volumes
```
