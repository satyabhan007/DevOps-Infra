// Part 5 lab — k6 load test for the sample "checkout" service (Ch 10
// Capacity Planning & Load Testing, Ch 7 Alerting: this is what should trip
// the burn-rate alerts in ../alerting if you point it at a broken build).
//
// Run:
//   k6 run script.js
//   k6 run -e TARGET=https://staging.example.com script.js
//
// Stages: ramp to a steady baseline, hold, spike (the "10x traffic event"
// from the Ch 10 tagline), recover, ramp down. Thresholds fail the run
// (non-zero exit code) if the service doesn't hold its SLO under load —
// that's what makes this wireable into CI as a gate, not just a manual tool.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const TARGET = __ENV.TARGET || 'http://localhost:8080';

// Custom metrics surfaced alongside k6's built-ins in the summary/output.
const errorRate = new Rate('checkout_errors');
const checkoutDuration = new Trend('checkout_duration', true);

export const options = {
  scenarios: {
    checkout_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // ramp to baseline
        { duration: '2m', target: 20 },    // hold baseline
        { duration: '30s', target: 200 },  // spike: ~10x, e.g. a flash sale
        { duration: '2m', target: 200 },   // hold spike
        { duration: '30s', target: 20 },   // recover
        { duration: '1m', target: 20 },    // confirm recovery holds
        { duration: '30s', target: 0 },    // ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    // Mirrors the 99.9% availability SLO in ../alerting/slo-burn-rate-rules.yml —
    // a run that breaches this should be treated the same as a page.
    http_req_failed: ['rate<0.001'],
    // Matches the p99 < 1s "slow" tail-sampling threshold in
    // ../otel-collector/collector.yaml, so a regression here is the same
    // regression that collector would flag as a slow trace.
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    checkout_errors: ['rate<0.001'],
  },
};

export default function () {
  const res = http.get(`${TARGET}/checkout`, {
    tags: { name: 'GetCheckout' },
  });

  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'body is non-empty': (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!ok);
  checkoutDuration.add(res.timings.duration);

  sleep(1);
}

// Prints a compact human-readable summary in addition to k6's default
// stdout report — handy when this runs headless in CI and you just want
// pass/fail plus the key percentiles in the job log.
export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values['p(95)'];
  const p99 = data.metrics.http_req_duration?.values['p(99)'];
  const failRate = data.metrics.http_req_failed?.values.rate;

  const lines = [
    '--- checkout load test summary ---',
    `requests: ${data.metrics.http_reqs?.values.count ?? 0}`,
    `p95 latency: ${p95 !== undefined ? p95.toFixed(1) : 'n/a'}ms`,
    `p99 latency: ${p99 !== undefined ? p99.toFixed(1) : 'n/a'}ms`,
    `failed rate: ${failRate !== undefined ? (failRate * 100).toFixed(3) : 'n/a'}%`,
    '-----------------------------------',
  ];

  return {
    stdout: lines.join('\n') + '\n',
  };
}
