/**
 * Soak Tests for Auth & Category Stability
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 *
 * Purpose: Verify that auth and category endpoints maintain stable performance under sustained load
 * Duration: 1 hour per test
 * Virtual Users: 30 VUs total across all scenarios in this file
 * Load Profile: Ramp up 2min → Hold 1hr → Ramp down 2min
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate   = new Rate('errors');
const latency     = new Trend('latency');
const requestCount = new Counter('requests');
const successRate = new Rate('success_rate');

const BASE_URL    = __ENV.API_URL || 'http://localhost:6060/api/v1';
const SOAK_DURATION  = __ENV.SOAK_DURATION || '1h';
const RAMP_DURATION  = '2m';
const SLEEP_TIME     = 2;
const SCENARIO_TARGETS = [10, 10, 10, 10];

const CATEGORY_SLUGS = ['electronics', 'clothing', 'book'];

// Existing test account — must exist in your test DB
const LOGIN_PAYLOAD = JSON.stringify({
  email:    'user@test.com',
  password: 'user@test.com',
});

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
    soakLogin: {
      executor: 'ramping-vus',
      exec: 'soakLogin',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[0]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
    soakGetCategories: {
      executor: 'ramping-vus',
      exec: 'soakGetCategories',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[1]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
    soakSingleCategory: {
      executor: 'ramping-vus',
      exec: 'soakSingleCategory',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[2]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
    soakRegister: {
      executor: 'ramping-vus',
      exec: 'soakRegister',
      startVUs: 0,
      stages: createStages(SCENARIO_TARGETS[3]),
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    // Based on previous run baseline (p95~105ms, p99~122ms) with headroom for CI variability.
    'latency':           ['p(95)<250', 'p(99)<500'],
    'errors':            ['rate<0.01'],
    'http_req_duration': ['p(95)<250', 'p(99)<500'],
    'success_rate':      ['rate>0.99'],
  },
	ext: {
		loadimpact: {
			projectID: 0,
			name: 'Auth & Category Soak Test',
		},
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
 * Test 1: Soak test login - with connection pooling
 */
export function soakLogin() {
  const shouldLogin = Math.floor(Math.random() * 10) === 0;

  if (shouldLogin) {
    group('POST /auth/login', () => {
      try {
        const response = http.post(`${BASE_URL}/auth/login`, LOGIN_PAYLOAD, {
          headers: { 
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
          },
          tags: { name: 'Login' },
          timeout: '15s',
        });

        recordRequestMetrics(response, { endpoint: 'login' });
      } catch (e) {
        errorRate.add(1);
        successRate.add(0);
      }
    });
  }

  sleep(5);
}

/**
 * Test 2: Soak test GET all categories
 */
export function soakGetCategories() {
  group('GET /category/get-category', () => {
    try {
      const response = http.get(`${BASE_URL}/category/get-category`, {
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
        },
        tags: { name: 'GetCategories' },
        timeout: '10s',
      });

      recordRequestMetrics(response, { endpoint: 'get-category' });
    } catch (e) {
      errorRate.add(1);
      successRate.add(0);
    }
  });

  sleep(SLEEP_TIME);
}

/**
 * Test 3: Soak test single category
 */
export function soakSingleCategory() {
  const randomSlug = CATEGORY_SLUGS[Math.floor(Math.random() * CATEGORY_SLUGS.length)];

  group('GET /category/single-category/:slug', () => {
    try {
      const response = http.get(`${BASE_URL}/category/single-category/${randomSlug}`, {
        headers: { 
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
        },
        tags: { name: 'SingleCategory', slug: randomSlug },
        timeout: '10s',
      });

      recordRequestMetrics(response, { endpoint: 'single-category', slug: randomSlug });
    } catch (e) {
      errorRate.add(1);
      successRate.add(0);
    }
  });

  sleep(SLEEP_TIME);
}

/**
 * Test 4: Soak test register
 */
export function soakRegister() {
  const shouldRegister = Math.floor(Math.random() * 50) === 0;

  if (shouldRegister) {
    const uniqueEmail = `soak_user_${__VU}_${Date.now()}@test.com`;

    const payload = JSON.stringify({
      name: 'Soak Test User',
      email: uniqueEmail,
      password: 'soaktest123',
      phone: '91234567',
      address: 'Test Address',
      answer: 'testanswer',
    });

    group('POST /auth/register', () => {
      try {
        const response = http.post(`${BASE_URL}/auth/register`, payload, {
          headers: { 
            'Content-Type': 'application/json',
            'Connection': 'keep-alive',
          },
          tags: { name: 'Register' },
          timeout: '15s',
        });

        recordRequestMetrics(response, { endpoint: 'register' });
      } catch (e) {
        errorRate.add(1);
        successRate.add(0);
      }
    });
  }

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
=== Auth & Category Soak Test Summary ===
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
  soakLogin();
}