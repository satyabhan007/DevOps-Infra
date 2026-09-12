# OpenTelemetry Collector — traces + metrics pipeline

`collector.yaml` is a real OTel Collector config: OTLP receiver (gRPC +
HTTP) in, tail-based sampling and PII redaction in the middle, Tempo and a
Prometheus scrape endpoint out. It is used two ways in this repo:

- **standalone**, as the thing this README teaches — read it top to bottom
  to see a production-shaped pipeline (receivers → processors → exporters →
  service.pipelines).
- **wired into `../stack/docker-compose.yml`**, which mounts this exact file
  into the `otel-collector` service, so it's the log/trace shipper for the
  runnable local stack.

## Pipeline shape

```
        ┌──────────┐
app --> │   OTLP   │ --> resourcedetection --> resource --> attributes/redact
        │ receiver │                                 │
        └──────────┘                                 ├─ tail_sampling --> batch --> otlp/tempo (traces)
                                                       └─ batch ----------------> prometheus (metrics)
```

- **`tail_sampling`** keeps every error and every request slower than 1s,
  and only 10% of the boring successes — see Ch 4 ("debugging a broken
  trace") and Ch 11 (cost observability: sampling is a cost lever, not just
  a noise lever).
- **`attributes/redact`** strips `Authorization` and `Cookie` headers before
  anything leaves the collector, so a leaked trace never leaks a token.
- **`prometheus` exporter** runs with `enable_open_metrics: true` so metric
  points carry **exemplars** (a metric sample linked straight to the
  `trace_id` that produced it) — the mechanism Ch 3's dashboards use to jump
  from a latency spike to the exact trace that caused it.

## Validate

```bash
# with the otelcol binary:
otelcol validate --config=collector.yaml

# or via the contrib docker image (no local install needed):
docker run --rm -v "$PWD":/w otel/opentelemetry-collector-contrib:0.109.0 \
    validate --config=/w/learn5/labs/otel-collector/collector.yaml
```

`yamllint` also runs over this file in CI (`.github/workflows/lab-tests.yml`,
job `parts_2_5`).
