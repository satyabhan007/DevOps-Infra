# k6 — load test for the sample "checkout" service

`script.js` is a real k6 test (Ch 10 Capacity Planning & Load Testing):
ramp to a baseline, spike to ~10x for a "flash sale" burst, recover, and
ramp down — with thresholds that fail the run if the service can't hold
its SLO under that load.

## Run it

```bash
# against a local service on :8080
k6 run script.js

# against any other target
k6 run -e TARGET=https://staging.example.com script.js
```

No install? Use the docker image:

```bash
docker run --rm -i -e TARGET=http://host.docker.internal:8080 \
  grafana/k6:0.54.0 run - < script.js
```

## Reading the output

k6 prints a summary block per run. The three numbers that matter most:

- **`http_req_failed`** — the fraction of requests that errored. The
  threshold fails the run above **0.1%**, matching the checkout service's
  99.9% availability SLO in `../alerting/slo-burn-rate-rules.yml`. If this
  threshold fails, you've reproduced — under controlled load — exactly the
  condition that would trip the `CheckoutSLOErrorBudgetFastBurn1h` alert in
  production.
- **`http_req_duration` p(95)/p(99)`** — latency tail. Thresholds are
  `p95 < 500ms`, `p99 < 1000ms`, matching the 1000ms "slow request"
  threshold used for tail sampling in `../otel-collector/collector.yaml` —
  a run that breaches this threshold is generating exactly the traces that
  collector is configured to always keep.
- **`checkout_errors` / `checkout_duration`** — custom metrics defined in
  the script (`Rate`/`Trend`) so the request under test is tracked
  separately from any setup/teardown calls.

`handleSummary()` also prints a compact 5-line block so a CI log doesn't
need to be scraped for the default k6 report.

## Wiring into CI

k6 exits non-zero if any threshold fails, which is all a CI gate needs:

```yaml
- name: k6 load test
  run: |
    docker run --rm -i \
      -e TARGET=${{ env.STAGING_URL }} \
      grafana/k6:0.54.0 run - < learn5/labs/k6/script.js
```

Run it after a staging deploy, before promoting to production — the same
gate Ch 10's "pre-launch capacity sign-off" example describes. (This repo's
own `.github/workflows/lab-tests.yml` doesn't run k6 yet — a real target to
hit is a prerequisite, and that's out of scope for this lab.)

## Validate the script itself

```bash
k6 inspect script.js
```

`k6 inspect` parses and bundles the script without running it — useful in
CI as a fast syntax/shape check before spending time on a real load run.
