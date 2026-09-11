# Part 5 · labs — runnable configs

> Standard tools, at production depth. Every file here is validated in CI
> (`.github/workflows/lab-tests.yml`, job `parts_2_5`).

Landing alongside chapters 2–16: a Prometheus + Grafana + Loki + Tempo
docker-compose stack, alerting/burn-rate rules, an OpenTelemetry Collector
config, and a k6 load-test script.

| Lab | Stands up | Validated with |
|---|---|---|
| [`stack/`](stack/) | `docker-compose.yml` — OTel Collector + Prometheus + Grafana + Tempo + Loki + promtail, wired end to end for a sample `checkout` service | `docker compose config` |
| [`alerting/`](alerting/) | Prometheus recording rules + multi-window multi-burn-rate SLO alerts (Google SRE Workbook pattern) for a 99.9% availability SLO | `promtool check rules` |
| [`otel-collector/`](otel-collector/) | the OTel Collector config used by `stack/` — OTLP in, tail sampling, PII redaction, Tempo + Prometheus out | `otelcol validate` |
| [`k6/`](k6/) | a k6 load test (baseline → 10x spike → recover) with thresholds tied to the SLO in `alerting/` | `k6 inspect` |

`docker compose -f stack/docker-compose.yml up -d` then open Grafana at
`localhost:3000` to see metrics, traces and logs cross-linked end to end.
