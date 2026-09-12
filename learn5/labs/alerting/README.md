# Alerting — multi-window multi-burn-rate SLO alerts

`slo-burn-rate-rules.yml` implements the Google SRE Workbook's
["Alerting on SLOs"](https://sre.google/workbook/alerting-on-slo/) pattern
for a sample **checkout** service with a **99.9% availability SLO** over a
rolling 30-day window (error budget = 0.1%).

## Why multi-window multi-burn-rate

A single-window alert ("error rate > X for 5m") forces a trade-off you
can't win: a short window pages fast but flaps on noise; a long window is
stable but you've already blown a chunk of budget before it fires. The
workbook's fix is to require **two windows to agree** — a long window that
measures real budget consumption, and a short window that confirms the
problem is still happening right now (so the alert clears quickly once
it's fixed, instead of a long-window average dragging it out).

This file has two severities, each a long/short pair:

| Alert | Long window | Burn rate | Short window | Severity | Budget burned by long window |
|---|---|---|---|---|---|
| `CheckoutSLOErrorBudgetFastBurn1h` | 1h | 14.4x | 5m | page | ~2% |
| `CheckoutSLOErrorBudgetFastBurn6h` | 6h | 6x | 30m | page | ~5% |
| `CheckoutSLOErrorBudgetSlowBurn1d` | 1d | 3x | 2h | ticket | ~10% |
| `CheckoutSLOErrorBudgetSlowBurn3d` | 3d | 1x | 6h | ticket | ~10% |

Read the comment block at the top of `slo-burn-rate-rules.yml` for the
burn-rate formula and how those thresholds were derived — they're the
standard workbook constants, not arbitrary.

## What's in the file

1. **Recording rules** (`checkout.slo.recording-rules`) pre-compute the bad
   (5xx) event ratio at each window (5m, 30m, 1h, 2h, 6h, 1d, 3d) plus two
   `burn_rate` series the Grafana dashboard in `../stack/grafana/dashboards`
   plots directly.
2. **Alerting rules** (`checkout.slo.burn-rate-alerts`) combine those into
   the four long/short pairs above.

## Validate

```bash
promtool check rules slo-burn-rate-rules.yml

# or via docker, no local install needed:
docker run --rm -v "$PWD":/w --entrypoint promtool prom/prometheus:v2.53.2 \
    check rules /w/learn5/labs/alerting/slo-burn-rate-rules.yml
```

The file is also loaded straight into the local stack — see
`../stack/docker-compose.yml`'s `prometheus` service, which mounts this
directory to `/etc/prometheus/rules` and lists it in `rule_files`.

## Adapting to a real SLO

Swap `service="checkout"` for your service, change `0.001` (the error
budget = `1 - SLO`) in every `burn_rate` calculation, and re-derive the
thresholds if your SLO target isn't 99.9% — the workbook's Appendix has
the table for 99%, 99.9% and 99.99% targets.
