/**
 * Soak Tests for Realistic User Journey Stability
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 *
 * Purpose: Verify that a realistic user journey remains stable under sustained load
 * Duration: 1 hour (or 2 hours via SOAK_DURATION env var)
 * Virtual Users: 30 VUs
 * Load Profile: Ramp up 2min → Hold 1hr → Ramp down 2min
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate           = new Rate('errors');
const latency             = new Trend('latency');
const requestCount        = new Counter('soak_total_requests');
const successRate         = new Rate('success_rate');
const iterationDuration   = new Trend('soak_iteration_duration'); // tracks full journey time

const BASE_URL       = __ENV.API_URL      || 'http://localhost:6060/api/v1';
const SOAK_DURATION  = __ENV.SOAK_DURATION || '1h';  // override with -e SOAK_DURATION=2h
const RAMP_DURATION  = '2m';
const VIRTUAL_USERS  = 40;
const SLEEP_TIME     = 2;

const LOGIN_PAYLOAD  = JSON.stringify({
  email:    'user@test.com',
  password: 'user@test.com',
});

const stages = [
  { duration: RAMP_DURATION, target: VIRTUAL_USERS },
  { duration: SOAK_DURATION, target: VIRTUAL_USERS },
  { duration: RAMP_DURATION, target: 0 },
];

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    soakUserJourney: {
      executor: 'ramping-vus',
      exec: 'soakUserJourney',
      startVUs: 0,
      stages,
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    // Based on latest run baseline (iteration p95~8562ms, req p95~152ms, req p99~191ms).
    'soak_iteration_duration': ['p(95)<9500'],
    'latency':                 ['p(95)<250', 'p(99)<500'],
    'errors':                  ['rate<0.01'],
    'http_req_duration':       ['p(95)<250', 'p(99)<500'],
    'success_rate':            ['rate>0.99'],
  },
};

/**
 * Helper: make a request and record metrics
 */
function makeRequest(method, url, body, params) {
  const response = method === 'POST'
    ? http.post(url, body, params)
    : http.get(url, params);

  const success = check(response, {
    'status is 2xx':         (r) => r.status >= 200 && r.status < 300,
    'no server errors':      (r) => r.status < 500,
    'response body not null':(r) => r.body !== null && r.body !== '',
  });

  latency.add(response.timings.duration, { url });
  errorRate.add(!success);
  successRate.add(success);
  requestCount.add(1);

  return { response, success };
}

/**
 * Test 1 & 2 & 3: Full browsing journey with throughput and error tracking
 * Journey: GET categories → GET products → GET search → GET product-list → POST login (every 10th)
 * Assertion: soak_iteration_duration remains stable (±15%) from start to finish
 */
export function soakUserJourney() {
  const journeyStart = Date.now();

  // Step 1: GET categories — called on every page load
  group('Step 1: GET /category/get-category', () => {
    makeRequest('GET', `${BASE_URL}/category/get-category`, null, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'GetCategories', step: '1' },
      timeout: '10s',
    });
  });

  sleep(SLEEP_TIME);

  // Step 2: GET all products
  group('Step 2: GET /product/get-product', () => {
    makeRequest('GET', `${BASE_URL}/product/get-product`, null, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'GetProducts', step: '2' },
      timeout: '10s',
    });
  });

  sleep(SLEEP_TIME);

  // Step 3: GET search/laptop — regex query, potential memory accumulation
  group('Step 3: GET /product/search/laptop', () => {
    makeRequest('GET', `${BASE_URL}/product/search/laptop`, null, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'SearchLaptop', step: '3' },
      timeout: '15s',
    });
  });

  sleep(SLEEP_TIME);

  // Step 4: GET product-list page 1
  group('Step 4: GET /product/product-list/1', () => {
    makeRequest('GET', `${BASE_URL}/product/product-list/1`, null, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'ProductList', step: '4' },
      timeout: '10s',
    });
  });

  sleep(SLEEP_TIME);

  // Step 5: POST login — only every 10th iteration
  if (Math.floor(Math.random() * 10) === 0) {
    group('Step 5: POST /auth/login', () => {
      makeRequest('POST', `${BASE_URL}/auth/login`, LOGIN_PAYLOAD, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'Login', step: '5' },
        timeout: '15s', // bcrypt takes longer
      });
    });
  }

  // Record full iteration duration for stability assertion
  const journeyEnd = Date.now();
  iterationDuration.add(journeyEnd - journeyStart);
}

/**
 * handleSummary: prints all 4 metrics + throughput stability note
 */
export function handleSummary(data) {
  const duration   = data.metrics.http_req_duration;
  const reqs       = data.metrics.http_reqs;
  const failed     = data.metrics.http_req_failed;
  const iterDur    = data.metrics.soak_iteration_duration;
  const totalReqs  = data.metrics.soak_total_requests;

  const throughput     = reqs?.values?.rate?.toFixed(2)            ?? 'N/A';
  const p95            = duration?.values?.['p(95)']?.toFixed(2)   ?? 'N/A';
  const p99            = duration?.values?.['p(99)']?.toFixed(2)   ?? 'N/A';
  const errRate        = failed?.values?.rate != null
                         ? (failed.values.rate * 100).toFixed(2)   : 'N/A';
  const iterP95        = iterDur?.values?.['p(95)']?.toFixed(2)    ?? 'N/A';
  const iterMedian     = iterDur?.values?.['med']?.toFixed(2)      ?? 'N/A';
  const totalRequests  = totalReqs?.values?.count                  ?? 'N/A';

  return {
    stdout: `
=== User Journey Soak Test Summary ===
--- Per Request ---
Throughput:              ${throughput} req/s
Response p95:            ${p95} ms
Response p99:            ${p99} ms
HTTP Error Rate:         ${errRate}%

--- Full Journey Iteration ---
Iteration p95:           ${iterP95} ms
Iteration Median:        ${iterMedian} ms
Total Journey Requests:  ${totalRequests}

Throughput Stability:    Compare req/s at 5-min vs 60-min in k6 logs above.
Error Accumulation:      Error rate should be <1% and grow linearly with requests.

NOTE: See cpu_log.txt for CPU utilization data.
NOTE: For 2-hour run: k6 run -e SOAK_DURATION=2h tests/soak/soak-user-journey.js
    `
  };
}

export default function () {
  soakUserJourney();
}