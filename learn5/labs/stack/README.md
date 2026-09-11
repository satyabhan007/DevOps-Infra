# Stack — Prometheus + Grafana + Loki + Tempo

`docker-compose.yml` stands up the full open-source observability stack
taught across Part 5's foundation chapters (Ch 1-5): metrics, dashboards,
traces and logs, wired together so you can click from one to another.

## What's running

| Service | Role | Port |
|---|---|---|
| `otel-collector` | receives OTLP (traces + metrics), fans out to Tempo + Prometheus — config is `../otel-collector/collector.yaml` | 4317 (gRPC), 4318 (HTTP), 8889 (scrape) |
| `prometheus` | scrapes the collector, evaluates the SLO burn-rate rules in `../alerting` | 9090 |
| `tempo` | stores traces, single-binary/local-disk config for a lab | 3200 |
| `loki` | stores logs | 3100 |
| `promtail` | discovers every container in this compose project via the Docker socket and ships stdout/stderr to Loki | — |
| `grafana` | Prometheus + Tempo + Loki datasources pre-provisioned, a `checkout` service-overview dashboard pre-loaded, anonymous admin login | 3000 |

## Run it

```bash
docker compose -f learn5/labs/stack/docker-compose.yml up -d
open http://localhost:3000    # Grafana — anonymous admin, no login needed
open http://localhost:9090    # Prometheus
open http://localhost:9090/rules   # the burn-rate alerts, evaluating live
```

There's no application container here — the stack has nothing to scrape
until something speaks OTLP at `otel-collector:4317`/`:4318`, or HTTP
metrics at a target you add to `prometheus/prometheus.yml`. That's
deliberate: this lab teaches the observability wiring itself, not a demo
app. Point your own instrumented service at the collector, or send it
synthetic load with `../k6/script.js` once you do.

## How the pieces connect

```
service --OTLP--> otel-collector --traces--> tempo
                        |         --metrics-> prometheus (scraped, not pushed)
                        |
                        +--(stdout via promtail)--> loki

grafana --queries--> prometheus, tempo, loki
        --exemplars--> jump from a Prometheus latency spike straight to
                        the Tempo trace that produced it
        --derived fields--> jump from a Loki log line's trace_id to Tempo
```

- `prometheus/prometheus.yml` — scrape config + `rule_files` pointing at
  `../alerting`.
- `tempo/tempo.yaml` — minimal single-binary config, local disk storage.
- `promtail/promtail-config.yaml` — Docker service discovery, so every
  container's logs land in Loki labeled by container name, no per-service
  config needed.
- `grafana/provisioning/datasources/datasources.yaml` — Prometheus
  (default) + Tempo + Loki, with exemplar and derived-field wiring so the
  three signals cross-link inside Grafana.
- `grafana/provisioning/dashboards/dashboards.yaml` — tells Grafana to
  auto-load every JSON in `grafana/dashboards/`.
- `grafana/dashboards/checkout-overview.json` — golden signals (traffic,
  errors, latency), the SLO burn-rate series from `../alerting`, and a
  Tempo trace table, for a sample `checkout` service.

## Validate

```bash
docker compose -f learn5/labs/stack/docker-compose.yml config
```

Syntax-only — this checks the compose file resolves and every referenced
file/volume path exists; it does not require actually pulling images or
running containers.
