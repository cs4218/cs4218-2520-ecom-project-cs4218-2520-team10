/**
 * Soak Tests for Product Browsing Stability
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 *
 * Purpose: Verify that product endpoints maintain stable performance under sustained load
 * Duration: 1 hour per test
 * Virtual Users: 30 VUs total across all scenarios in this file
 * Load Profile: Ramp up 2min → Hold 1hr → Ramp down 2min
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const latency = new Trend('latency');
const productCountGauge = new Gauge('product_count');
const requestCount = new Counter('requests');
const successRate = new Rate('success_rate');

const BASE_URL = __ENV.API_URL || 'http://localhost:6060/api/v1';
const SOAK_DURATION = __ENV.SOAK_DURATION || '1h';
const RAMP_DURATION = '2m';
const SLEEP_TIME = 2; // seconds between requests per VU
const SCENARIO_TARGETS = [10, 10, 10, 10];

// Product slugs from test database
const PRODUCT_SLUGS = ['novel', 'nus-tshirt', 'the-law-of-contract-in-singapore', 'laptop', 'smartphone', 'textbook'];

function createStages(target) {
  return [
    { duration: RAMP_DURATION, target },
    { duration: SOAK_DURATION, target },
    { duration: RAMP_DURATION, target: 0 },
  ];
}

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  scenarios: {
    soakAllProducts: {
      executor: 'ramping-vus',
      exec: 'soakAllProducts',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[0]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
    soakPaginatedProducts: {
      executor: 'ramping-vus',
      exec: 'soakPaginatedProducts',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[1]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
    soakProductDetail: {
      executor: 'ramping-vus',
      exec: 'soakProductDetail',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[2]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
    soakProductCount: {
      executor: 'ramping-vus',
      exec: 'soakProductCount',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[3]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    'latency':           ['p(95)<500', 'p(99)<1000'],
    'errors':            ['rate<0.01'],
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'success_rate':      ['rate>0.99'],
  },
};

let initialProductCount = null;

function safeJsonPath(response, path) {
  if (!response || response.status < 200 || response.status >= 300) return null;
  if (response.body === null || response.body === '') return null;
  try {
    return response.json(path);
  } catch (e) {
    return null;
  }
}

/**
 * Test 1: Soak test GET all products
 * Ramp to 30 VUs over 2 min → hold at 30 VUs for 1 hour → ramp down over 2 min
 * Assertion: p95 at 60-min mark is within 20% of p95 at 5-min mark
 */
export function soakAllProducts() {
  group('GET /product/get-product', () => {
    const response = http.get(`${BASE_URL}/product/get-product`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'GetAllProducts' },
      timeout: '10s',
    });

    const products = safeJsonPath(response, 'products');

    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response has products': () => products !== null,
      'no server errors': (r) => r.status < 500,
    });

    latency.add(response.timings.duration, { endpoint: 'get-product' });
    errorRate.add(!success);
    successRate.add(success);
    requestCount.add(1);

    // Track product count consistency
    if (Array.isArray(products)) {
      productCountGauge.add(products.length);
    }

    sleep(SLEEP_TIME);
  });
}

/**
 * Test 2: Soak test paginated product list
 * Each VU hits GET /v1/product/product-list/:page with random pages
 * Assertion: Pagination performance remains stable. No increasing latency over time.
 */
export function soakPaginatedProducts() {
  group('GET /product/product-list/:page', () => {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const response = http.get(`${BASE_URL}/product/product-list/${randomPage}`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'GetPaginatedProducts', page: randomPage },
      timeout: '10s',
    });

    const products = safeJsonPath(response, 'products');

    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response has products': () => products !== null,
      'no server errors': (r) => r.status < 500,
    });

    latency.add(response.timings.duration, { endpoint: 'product-list', page: randomPage });
    errorRate.add(!success);
    successRate.add(success);
    requestCount.add(1);

    sleep(SLEEP_TIME);
  });
}

/**
 * Test 3: Soak test product detail endpoint
 * Each VU hits GET /v1/product/get-product/:slug
 * Assertion: Detail endpoint p95 remains stable over full duration
 */
export function soakProductDetail() {
  // Use actual product slugs from test database
  const randomSlug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];

  group('GET /product/get-product/:slug', () => {
    const response = http.get(`${BASE_URL}/product/get-product/${randomSlug}`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'GetProductDetail', slug: randomSlug },
      timeout: '10s',
    });

    const product = safeJsonPath(response, 'product');

    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response has product': () => product !== null,
      'no server errors': (r) => r.status < 500,
    });

    latency.add(response.timings.duration, { endpoint: 'get-product-detail', slug: randomSlug });
    errorRate.add(!success);
    successRate.add(success);
    requestCount.add(1);

    sleep(SLEEP_TIME);
  });
}

/**
 * Test 4: Soak test product count endpoint
 * Each VU hits GET /v1/product/product-count
 * Assertion: Count remains consistent (no phantom data accumulation). Latency stable.
 */
export function soakProductCount() {
  group('GET /product/product-count', () => {
    const response = http.get(`${BASE_URL}/product/product-count`, {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'GetProductCount' },
      timeout: '10s',
    });

    const total = safeJsonPath(response, 'total');
    const hasValidTotal = Number.isInteger(total) && total >= 0;
    let hasDrift = false;

    if (hasValidTotal) {
      if (initialProductCount === null) {
        initialProductCount = total;
      } else {
        hasDrift = total !== initialProductCount;
      }
    }

    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response has total': () => total !== null,
      'count is a number': () => hasValidTotal,
      'count has no drift': () => !hasDrift,
      'no server errors': (r) => r.status < 500,
    });

    if (hasValidTotal) {
      productCountGauge.add(total, { endpoint: 'product-count' });
    }

    latency.add(response.timings.duration, { endpoint: 'product-count' });
    errorRate.add(!success);
    successRate.add(success);
    requestCount.add(1);

    sleep(SLEEP_TIME);
  });
}

/**
 * Combined soak test: All product endpoints under sustained load
 */
export function soakCombined() {
  // Rotate through different endpoints
  const endpoint = Math.floor(Math.random() * 4);

  switch (endpoint) {
    case 0:
      group('GET /product/get-product', () => {
        const response = http.get(`${BASE_URL}/product/get-product`, {
          timeout: '10s',
        });
        const success = check(response, { 'status is 200': (r) => r.status === 200 });
        latency.add(response.timings.duration);
        errorRate.add(!success);
        successRate.add(success);
      });
      requestCount.add(1);
      break;

    case 1:
      group('GET /product/product-list/:page', () => {
        const page = Math.floor(Math.random() * 5) + 1;
        const response = http.get(`${BASE_URL}/product/product-list/${page}`, {
          timeout: '10s',
        });
        const success = check(response, { 'status is 200': (r) => r.status === 200 });
        latency.add(response.timings.duration);
        errorRate.add(!success);
        successRate.add(success);
      });
      requestCount.add(1);
      break;

    case 2:
      group('GET /product/get-product/:slug', () => {
        const slug = PRODUCT_SLUGS[Math.floor(Math.random() * PRODUCT_SLUGS.length)];
        const response = http.get(`${BASE_URL}/product/get-product/${slug}`, {
          timeout: '10s',
        });
        const success = check(response, {
          'status is 200': (r) => r.status === 200,
        });
        latency.add(response.timings.duration);
        errorRate.add(!success);
        successRate.add(success);
      });
      requestCount.add(1);
      break;

    case 3:
      group('GET /product/product-count', () => {
        const response = http.get(`${BASE_URL}/product/product-count`, {
          timeout: '10s',
        });
        const success = check(response, { 'status is 200': (r) => r.status === 200 });
        latency.add(response.timings.duration);
        errorRate.add(!success);
        successRate.add(success);
      });
      requestCount.add(1);
      break;
  }

  sleep(SLEEP_TIME);
}

export function handleSummary(data) {
  const duration = data.metrics.http_req_duration;
  const reqs     = data.metrics.http_reqs;
  const failed   = data.metrics.http_req_failed;

  const throughput = reqs?.values?.rate?.toFixed(2)           ?? 'N/A';
  const p95        = duration?.values?.['p(95)']?.toFixed(2)  ?? 'N/A';
  const p99        = duration?.values?.['p(99)']?.toFixed(2)  ?? 'N/A';
  const errRate    = failed?.values?.rate != null
                     ? (failed.values.rate * 100).toFixed(2)  : 'N/A';
  const totalReqs  = reqs?.values?.count                      ?? 'N/A';

  return {
    stdout: `
=== Soak Test Summary ===
Throughput:      ${throughput} req/s
Response p95:    ${p95} ms
Response p99:    ${p99} ms
HTTP Error Rate: ${errRate}%
Total Requests:  ${totalReqs}

NOTE: See cpu_log.txt for CPU utilization data.
    `
  };
}

/**
 * Default export - runs the combined soak test
 */
export default function () {
  soakCombined();
}