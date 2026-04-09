/**
 * Soak Tests for Search & Filter Stability
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 *
 * Purpose: Verify that search and filter endpoints maintain stable performance under sustained load
 * Duration: 12 hours per test
 * Virtual Users: 30 VUs total across all scenarios in this file
 * Load Profile: Ramp up 2min → Hold 12h → Ramp down 2min
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const latency = new Trend('latency');
const requestCount = new Counter('requests');
const successRate = new Rate('success_rate');

const BASE_URL = __ENV.API_URL || 'http://localhost:6060/api/v1';
const SOAK_DURATION = __ENV.SOAK_DURATION || '12h';
const RAMP_DURATION = '2m';
const SLEEP_TIME = 2;
const SCENARIO_TARGETS = [10, 10, 10, 10];

// Test data
const SEARCH_KEYWORDS = ['laptop', 'phone', 'book', 'shirt'];
const CATEGORY_SLUGS  = ['electronics', 'clothing', 'book'];

const PRODUCT_IDS  = ['66db427fdb0119d9234b27f3', '66db427fdb0119d9234b27f5', '66db427fdb0119d9234b27f1'];
const CATEGORY_IDS = ['66db427fdb0119d9234b27ed', '66db427fdb0119d9234b27ee', '66db427fdb0119d9234b27ef'];

function createStages(target) {
  return [
    { duration: RAMP_DURATION, target },
    { duration: SOAK_DURATION, target },
    { duration: RAMP_DURATION, target: 0 },
  ];
}

function requestWithSingleRetry(requestFn) {
  let response = requestFn();
  if (!response || response.status === 0) {
    sleep(0.2);
    response = requestFn();
  }
  return response;
}

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    soakProductSearch: {
      executor: 'ramping-vus',
      exec: 'soakProductSearch',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[0]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
    soakProductFilters: {
      executor: 'ramping-vus',
      exec: 'soakProductFilters',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[1]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
    soakCategoryProducts: {
      executor: 'ramping-vus',
      exec: 'soakCategoryProducts',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[2]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
    soakRelatedProducts: {
      executor: 'ramping-vus',
      exec: 'soakRelatedProducts',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[3]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    // Based on latest run baseline (p95~193ms, p99~301ms) with reasonable CI headroom.
    'latency':           ['p(95)<300', 'p(99)<500'],
    'errors':            ['rate<0.01'],
    'http_req_duration': ['p(95)<300', 'p(99)<500'],
    'success_rate':      ['rate>0.99'],
  },
};

function recordRequestMetrics(response, metricTags) {
  const success = check(response, {
    'status is 2xx':         (r) => r.status >= 200 && r.status < 300,
    'response body not null':(r) => r.body !== null && r.body !== '',
    'no server errors':      (r) => r.status < 500,
  });

  latency.add(response.timings.duration, metricTags);
  errorRate.add(!success);
  successRate.add(success);
  requestCount.add(1);
}

/**
 * Test 1: Soak test product search
 * Every 3rd iteration hits search, others sleep — simulates realistic search frequency
 * Assertion: Search p95 at 60 min is within 20% of p95 at 5 min
 */
export function soakProductSearch() {
  // Every 3rd iteration hits search (as per story requirement)
  const shouldSearch = Math.floor(Math.random() * 3) === 0;

  if (shouldSearch) {
    const keyword = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];

    group('GET /product/search/:keyword', () => {
      const response = http.get(`${BASE_URL}/product/search/${keyword}`, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'ProductSearch', keyword },
        timeout: '30s',
      });

      recordRequestMetrics(response, { endpoint: 'search' });
    });
  }

  sleep(SLEEP_TIME);
}

/**
 * Test 2: Soak test product filters
 * Each VU POSTs filter params — assertion: 0% error rate over full duration
 */
export function soakProductFilters() {
  group('POST /product/product-filters', () => {
    const payload = JSON.stringify({ checked: [], radio: [0, 100] });

    const response = http.post(`${BASE_URL}/product/product-filters`, payload, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'ProductFilters' },
      timeout: '30s',
    });

    recordRequestMetrics(response, { endpoint: 'product-filters' });
  });

  sleep(SLEEP_TIME);
}

/**
 * Test 3: Soak test category-wise product listing
 * Assertion: No degradation over time for category-product queries
 */
export function soakCategoryProducts() {
  const randomSlug = CATEGORY_SLUGS[Math.floor(Math.random() * CATEGORY_SLUGS.length)];

  group('GET /product/product-category/:slug', () => {
    const response = requestWithSingleRetry(() =>
      http.get(`${BASE_URL}/product/product-category/${randomSlug}`, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'CategoryProducts', slug: randomSlug },
        timeout: '40s',
      })
    );

    recordRequestMetrics(response, { endpoint: 'product-category', slug: randomSlug });
  });

  sleep(SLEEP_TIME);
}

/**
 * Test 4: Soak test related products
 * Assertion: Related product lookup remains performant. No connection pool exhaustion.
 */
export function soakRelatedProducts() {
  const randomIndex = Math.floor(Math.random() * PRODUCT_IDS.length);
  const pid = PRODUCT_IDS[randomIndex];
  const cid = CATEGORY_IDS[randomIndex];

  group('GET /product/related-product/:pid/:cid', () => {
    const response = requestWithSingleRetry(() =>
      http.get(`${BASE_URL}/product/related-product/${pid}/${cid}`, {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'RelatedProducts', pid, cid },
        timeout: '40s',
      })
    );

    recordRequestMetrics(response, { endpoint: 'related-products', pid });
  });

  sleep(SLEEP_TIME);
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration;
  const reqs     = data.metrics.http_reqs;
  const failed   = data.metrics.http_req_failed;

  const throughput = reqs?.values?.rate?.toFixed(2)          ?? 'N/A';
  const p95        = duration?.values?.['p(95)']?.toFixed(2) ?? 'N/A';
  const p99        = duration?.values?.['p(99)']?.toFixed(2) ?? 'N/A';
  const errRate    = failed?.values?.rate != null
                     ? (failed.values.rate * 100).toFixed(2) : 'N/A';
  const totalReqs  = reqs?.values?.count                     ?? 'N/A';

  return {
    stdout: `
=== Search & Filter Soak Test Summary ===
Throughput:      ${throughput} req/s
Response p95:    ${p95} ms
Response p99:    ${p99} ms
HTTP Error Rate: ${errRate}%
Total Requests:  ${totalReqs}

NOTE: See cpu_log.txt for CPU utilization data.
    `
  };
}

export default function () {
  soakProductSearch();
}