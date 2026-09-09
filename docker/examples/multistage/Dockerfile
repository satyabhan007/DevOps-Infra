# Multi-stage build: a fat toolchain image compiles the app, then we
# copy ONLY the resulting binary into a tiny runtime image.
#
#   docker build -t demo:multi .
#   docker images demo          # final image is a few MB, not ~800 MB
#   docker run --rm -p 8080:8080 demo:multi
#
# Why it matters in production:
#   - smaller image  -> faster pulls -> faster autoscaling & rollbacks
#   - no shell, no apt, no compilers in the runtime -> tiny attack surface
#   - the build cache means changing main.go rebuilds in ~1s, not from FROM

# ---- stage 1: build -------------------------------------------------------
FROM golang:1.23-alpine AS build

WORKDIR /src

# Copy manifests first and download deps in their own layer: this layer
# is cached until go.mod/go.sum actually change, so day-to-day code edits
# skip the download entirely.
COPY go.mod ./
RUN go mod download

COPY . .

# CGO off + static build so the binary needs no libc at runtime.
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/app .

# ---- stage 2: runtime ---------------------------------------------------
# distroless: no shell, no package manager, runs as an unprivileged user.
FROM gcr.io/distroless/static-debian12:nonroot AS runtime

WORKDIR /app
COPY --from=build /out/app /app/app

# Explicit non-root (distroless :nonroot is uid 65532) and a declared port.
USER 65532:65532
EXPOSE 8080

# Exec form (no shell) so signals reach PID 1 and the container stops fast.
ENTRYPOINT ["/app/app"]
