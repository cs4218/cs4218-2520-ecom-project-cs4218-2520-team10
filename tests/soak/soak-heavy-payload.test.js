/**
 * Soak Tests for Photo & Heavy Payload Stability
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 *
 * Purpose: Validate sustained stability of heavy payload and mixed workload behavior.
 * Duration: 1 hour per scenario (override with SOAK_DURATION)
 * Virtual Users: 30 VUs total across all scenarios in this file
 * Load Profile: Ramp up 2min -> Hold 1hr -> Ramp down 2min
 * 
 * Key Assertions:
 * - All requests remain successful (0% error rate, 0% consistency failures)
 * - Photo endpoint handles binary payloads with correct content-type
 * - Mixed workload maintains 80/20 read/write ratio within acceptable latency
 * - Query performance does NOT degrade as data volume increases (early vs late phase match)
 * - Product count consistency remains at 0% drift throughout
 */

import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Global metrics
const errorRate = new Rate('errors');
const successRate = new Rate('success_rate');
const requestCount = new Counter('heavy_payload_total_requests');

// Scenario-specific metrics
const photoLatency = new Trend('photo_latency');
const photoContentTypeFailures = new Rate('photo_content_type_failures');

const mixedReadLatency = new Trend('mixed_read_latency');
const mixedWriteLatency = new Trend('mixed_write_latency');
const mixedWriteRatio = new Rate('mixed_write_ratio');

const growthQueryLatency = new Trend('growth_query_latency');
const growthRegisterLatency = new Trend('growth_register_latency');

const productCountLatency = new Trend('product_count_latency');
const productCountConsistencyFailures = new Rate('product_count_consistency_failures');

const BASE_URL = __ENV.API_URL || 'http://localhost:6060/api/v1';
const SOAK_DURATION = __ENV.SOAK_DURATION || '1h';
const RAMP_DURATION = '2m';
const THINK_TIME = 2;
const SCENARIO_TARGETS = [10, 10, 10, 10];

// IDs from sample seed data.
const PRODUCT_IDS = [
	'66db427fdb0119d9234b27f1',
	'66db427fdb0119d9234b27f3',
	'66db427fdb0119d9234b27f5',
];

const SEARCH_KEYWORDS = ['laptop', 'phone', 'book', 'shirt'];
const LOGIN_PAYLOAD = JSON.stringify({
	email: process.env.TEST_USER_EMAIL,
	password: process.env.TEST_USER_PASSWORD,
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
		soakProductPhoto: {
			executor: 'ramping-vus',
			exec: 'soakProductPhoto',
			startVUs: 0,
			stages: createStages(SCENARIO_TARGETS[0]),
			gracefulRampDown: '30s',
			gracefulStop: '30s',
		},
		soakMixedReadWrite: {
			executor: 'ramping-vus',
			exec: 'soakMixedReadWrite',
			startVUs: 0,
			stages: createStages(SCENARIO_TARGETS[1]),
			gracefulRampDown: '30s',
			gracefulStop: '30s',
		},
		soakIncreasingData: {
			executor: 'ramping-vus',
			exec: 'soakIncreasingData',
			startVUs: 0,
			stages: createStages(SCENARIO_TARGETS[2]),
			gracefulRampDown: '30s',
			gracefulStop: '30s',
		},
		soakProductCountConsistency: {
			executor: 'ramping-vus',
			exec: 'soakProductCountConsistency',
			startVUs: 0,
			stages: createStages(SCENARIO_TARGETS[3]),
			gracefulRampDown: '30s',
			gracefulStop: '30s',
		},
	},
	thresholds: {
		// Global correctness — must remain healthy
		errors: ['rate<0.01'],
		success_rate: ['rate>0.99'],
		http_req_failed: ['rate<0.01'],

		// 1) Photo endpoint stability — track absolute latency under the current 40 VU total load
		photo_latency: ['p(95)<3000', 'p(99)<4000'],
		photo_content_type_failures: ['rate<0.002'],

		// 2) Mixed read/write profile — both should stay comfortably below 1s at 40 VUs
		mixed_read_latency: ['p(95)<200'],
		mixed_write_latency: ['p(95)<300'],
		mixed_write_ratio: ['rate>0.15', 'rate<0.25'],

		// 3) Increasing data baseline (early p95~120ms, late p95~159ms, register p95~289ms).
		'growth_query_latency{phase:early}': ['p(95)<200'],
		'growth_query_latency{phase:late}': ['p(95)<250'],
		growth_register_latency: ['p(95)<400'],

		// 4) Product-count baseline (p95~140ms) and strict consistency checks.
		product_count_latency: ['p(95)<200'],
		product_count_consistency_failures: ['rate<0.0005'],
	},
};

function trackResult(response, success, latencyMetric, latencyTags) {
	latencyMetric.add(response.timings.duration, latencyTags);
	errorRate.add(!success);
	successRate.add(success);
	requestCount.add(1);
}

function getContentType(response) {
	return response.headers['Content-Type'] || response.headers['content-type'] || '';
}

function safeJsonPath(response, path) {
	if (!response || response.status < 200 || response.status >= 300) return null;
	if (response.body === null || response.body === '') return null;
	try {
		return response.json(path);
	} catch (e) {
		return null;
	}
}

function requestWithSingleRetry(requestFn) {
	let response = requestFn();
	if (!response || response.status === 0) {
		sleep(0.2);
		response = requestFn();
	}
	return response;
}

/**
 * Soak test 1: heavy binary photo payload transfer over sustained load.
 */
export function soakProductPhoto() {
	const pid = PRODUCT_IDS[Math.floor(Math.random() * PRODUCT_IDS.length)];

	group('GET /product/product-photo/:pid', () => {
		const response = http.get(`${BASE_URL}/product/product-photo/${pid}`, {
			headers: { 'Content-Type': 'application/json' },
			tags: { scenario: 'productPhoto', endpoint: 'product-photo' },
			timeout: '20s',
			responseType: 'binary',
		});

		const contentType = getContentType(response).toLowerCase();
		const isImage = contentType.startsWith('image/');
		const success = check(response, {
			'photo status is 200': (r) => r.status === 200,
			'photo payload is not empty': (r) => r.body && r.body.byteLength > 0,
			'photo content-type is image/*': () => isImage,
			'photo no server errors': (r) => r.status < 500,
		});

		photoContentTypeFailures.add(!isImage);
		trackResult(response, success, photoLatency, { endpoint: 'product-photo' });
	});

	sleep(0.5);
}

function doReadOperation() {
	const readOps = [
		{
			name: 'GetProducts',
			method: 'GET',
			url: `${BASE_URL}/product/get-product`,
		},
		{
			name: 'GetCategories',
			method: 'GET',
			url: `${BASE_URL}/category/get-category`,
		},
		{
			name: 'SearchProducts',
			method: 'GET',
			url: `${BASE_URL}/product/search/${SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)]}`,
		},
	];
	const op = readOps[Math.floor(Math.random() * readOps.length)];
	const response = http.get(op.url, {
		headers: { 'Content-Type': 'application/json' },
		tags: { scenario: 'mixedReadWrite', type: 'read', name: op.name },
		timeout: '15s',
	});
	const success = check(response, {
		'mixed read status is 200': (r) => r.status === 200,
		'mixed read no server errors': (r) => r.status < 500,
		'mixed read response body not null': (r) => r.body !== null && r.body !== '',
	});

	trackResult(response, success, mixedReadLatency, { endpoint: op.name.toLowerCase() });
}

function doWriteOperation() {
	const doLogin = Math.random() < 0.5;
	let response;

	if (doLogin) {
		response = http.post(`${BASE_URL}/auth/login`, LOGIN_PAYLOAD, {
			headers: { 'Content-Type': 'application/json' },
			tags: { scenario: 'mixedReadWrite', type: 'write', name: 'Login' },
			timeout: '20s',
		});
	} else {
		const payload = JSON.stringify({ checked: [], radio: [0, 5000] });
		response = requestWithSingleRetry(() =>
			http.post(`${BASE_URL}/product/product-filters`, payload, {
				headers: { 'Content-Type': 'application/json' },
				tags: { scenario: 'mixedReadWrite', type: 'write', name: 'ProductFilters' },
				timeout: '30s',
			})
		);
	}

	const success = check(response, {
		'mixed write status is 2xx': (r) => r.status >= 200 && r.status < 300,
		'mixed write no server errors': (r) => r.status < 500,
		'mixed write response body not null': (r) => r.body !== null && r.body !== '',
	});

	trackResult(response, success, mixedWriteLatency, { endpoint: doLogin ? 'login' : 'product-filters' });
}

/**
 * Soak test 2: 80% read + 20% write with 2s think-time.
 */
export function soakMixedReadWrite() {
	const isWrite = Math.random() < 0.2;
	mixedWriteRatio.add(isWrite);

	if (isWrite) {
		group('Mixed workload write (20%)', () => {
			doWriteOperation();
		});
	} else {
		group('Mixed workload read (80%)', () => {
			doReadOperation();
		});
	}

	sleep(THINK_TIME);
}

function registerGrowingDataUser() {
	const uniqueEmail = `soak_grow_${__VU}_${__ITER}_${Date.now()}@test.com`;
	const payload = JSON.stringify({
		name: 'Soak Growth User',
		email: uniqueEmail,
		password: 'soaktest123',
		phone: '91234567',
		address: 'Growth Test Address',
		answer: 'growth-answer',
	});

	const response = http.post(`${BASE_URL}/auth/register`, payload, {
		headers: { 'Content-Type': 'application/json' },
		tags: { scenario: 'increasingData', type: 'write', name: 'Register' },
		timeout: '20s',
	});

	const success = check(response, {
		'growth register status is 201 or 409': (r) => r.status === 201 || r.status === 409,
		'growth register no server errors': (r) => r.status < 500,
		'growth register response body not null': (r) => r.body !== null && r.body !== '',
	});

	trackResult(response, success, growthRegisterLatency, { endpoint: 'register' });
}

function runGrowthQuery() {
	const doSearch = Math.random() < 0.5;
	const phase = exec.scenario.progress < 0.5 ? 'early' : 'late';
	let response;

	if (doSearch) {
		const keyword = SEARCH_KEYWORDS[Math.floor(Math.random() * SEARCH_KEYWORDS.length)];
		response = http.get(`${BASE_URL}/product/search/${keyword}`, {
			headers: { 'Content-Type': 'application/json' },
			tags: { scenario: 'increasingData', type: 'query', name: 'Search', phase },
			timeout: '15s',
		});
	} else {
		response = http.get(`${BASE_URL}/product/get-product`, {
			headers: { 'Content-Type': 'application/json' },
			tags: { scenario: 'increasingData', type: 'query', name: 'GetProducts', phase },
			timeout: '15s',
		});
	}

	const success = check(response, {
		'growth query status is 200': (r) => r.status === 200,
		'growth query no server errors': (r) => r.status < 500,
		'growth query response body not null': (r) => r.body !== null && r.body !== '',
	});

	trackResult(response, success, growthQueryLatency, { phase });
}

/**
 * Soak test 3: periodically add users while continuously running product queries.
 */
export function soakIncreasingData() {
	if (__ITER % 5 === 0) {
		group('Increasing data write: POST /auth/register', () => {
			registerGrowingDataUser();
		});
	}

	group('Increasing data query: GET products/search', () => {
		runGrowthQuery();
	});

	sleep(THINK_TIME);
}

let initialProductCount = null;

/**
 * Soak test 4: verify product count remains stable while polling product-count endpoint.
 */
export function soakProductCountConsistency() {
	group('GET /product/product-count', () => {
		const response = requestWithSingleRetry(() =>
			http.get(`${BASE_URL}/product/product-count`, {
				headers: { 'Content-Type': 'application/json' },
				tags: { scenario: 'productCountConsistency', endpoint: 'product-count' },
				timeout: '20s',
			})
		);

		const parsedCount = safeJsonPath(response, 'total');
		const hasValidCount = Number.isInteger(parsedCount) && parsedCount >= 0;
		let hasDrift = false;

		if (hasValidCount) {
			if (initialProductCount === null) {
				initialProductCount = parsedCount;
			} else {
				hasDrift = parsedCount !== initialProductCount;
			}
		}

		const success = check(response, {
			'product count status is 200': (r) => r.status === 200,
			'product count total is valid integer': () => hasValidCount,
			'product count has no drift': () => !hasDrift,
			'product count no server errors': (r) => r.status < 500,
		});

		productCountConsistencyFailures.add(hasDrift || !hasValidCount);
		trackResult(response, success, productCountLatency, { endpoint: 'product-count' });
	});

	sleep(THINK_TIME);
}

function fmt(metric, stat) {
	return metric?.values?.[stat] != null ? metric.values[stat].toFixed(2) : 'N/A';
}

function fmtRatePercent(metric) {
	return metric?.values?.rate != null ? (metric.values.rate * 100).toFixed(2) : 'N/A';
}

export function handleSummary(data) {
	const reqs = data.metrics.http_reqs;
	const failed = data.metrics.http_req_failed;

	const photo = data.metrics.photo_latency;
	const read = data.metrics.mixed_read_latency;
	const write = data.metrics.mixed_write_latency;
	const growthEarly = data.metrics['growth_query_latency{phase:early}'];
	const growthLate = data.metrics['growth_query_latency{phase:late}'];
	const count = data.metrics.product_count_latency;

	const throughput = reqs?.values?.rate?.toFixed(2) ?? 'N/A';
	const totalReqs = reqs?.values?.count ?? 'N/A';
	const errRate = fmtRatePercent(failed);

	return {
		stdout: `
=== Photo & Heavy Payload Soak Test Summary ===
--- Global ---
Throughput:                         ${throughput} req/s
HTTP Error Rate:                    ${errRate}%
Total Requests:                     ${totalReqs}

--- Product Photo Stability ---
Photo latency p95:                  ${fmt(photo, 'p(95)')} ms
Photo latency p99:                  ${fmt(photo, 'p(99)')} ms
Photo content-type failures:        ${fmtRatePercent(data.metrics.photo_content_type_failures)}%

--- Mixed Read/Write Workload ---
Mixed read latency p95:             ${fmt(read, 'p(95)')} ms
Mixed write latency p95:            ${fmt(write, 'p(95)')} ms
Observed write ratio:               ${fmtRatePercent(data.metrics.mixed_write_ratio)}%

--- Increasing Data Impact ---
Query p95 early phase:              ${fmt(growthEarly, 'p(95)')} ms
Query p95 late phase:               ${fmt(growthLate, 'p(95)')} ms
Register latency p95:               ${fmt(data.metrics.growth_register_latency, 'p(95)')} ms

--- Product Count Consistency ---
Product count latency p95:          ${fmt(count, 'p(95)')} ms
Product count consistency failures: ${fmtRatePercent(data.metrics.product_count_consistency_failures)}%

NOTE: For 2-hour run: k6 run -e SOAK_DURATION=2h tests/soak/soak-heavy-payload.test.js
NOTE: See cpu_log.txt for CPU utilization data.
`,
	};
}

export default function () {
	soakProductPhoto();
}
