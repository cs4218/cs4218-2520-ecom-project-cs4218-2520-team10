# MS3 Implementation Plan — NFT + Project Management

## Final Assignments

| Member | Student ID | Test Type | Tool |
|--------|-----------|-----------|------|
| Kim Shi Tong | A0265858J | **Load Testing** | Grafana k6 |
| Yan Weidong | A0258151H | **Stress Testing** | Grafana k6 |
| Ong Chang Heng Bertrand | A0253013X | **Spike Testing** | Grafana k6 |
| Shaun Lee Xuan Wei | A0252626E | **Soak/Endurance Testing** | Grafana k6 |

> All 4 types are **unique** for grading — they differ in VU profile, duration, goals, thresholds, and what they measure. See the [comparison table](#how-the-4-types-differ) below.

---

## How the 4 Types Differ (for Grading Uniqueness)

| Aspect | Load | Stress | Spike | Soak |
|--------|------|--------|-------|------|
| **Goal** | Validate expected traffic | Find breaking point | Handle sudden surges | Detect degradation over time |
| **VU pattern** | Ramp up → hold steady → ramp down | Escalate in steps until failure | Instant jump (near-zero ramp) | Steady hold for extended duration |
| **Peak VUs** | 50 (expected) | 400+ (beyond capacity) | 500+ (sudden burst) | 30 (moderate, sustained) |
| **Duration** | ~10 min | ~12 min | ~5 min | 1–4 hours |
| **Ramp-up** | Gradual (minutes) | Stepped (minutes per stage) | Instant (10 seconds) | Gradual (minutes) |
| **Key metric** | p95 latency, throughput | Max VUs before errors | Recovery time after spike | Memory leaks, latency drift |
| **Thresholds** | Strict (p95 < 500ms, <1% errors) | Relaxed (p95 < 2s, <10% errors) | Very relaxed during spike | Strict but over time |
| **Pass/Fail** | Fails if latency too high | Identifies where system breaks | Measures recovery speed | Fails if degradation found |

---

## TROFOS Stories — Sprint 3 & Sprint 4

### Deadlines
- **Sprint 3 stories created by:** Thursday 12:00 PM of Sprint 3 planning week
- **Sprint 3 ends:** Monday 12:00 PM of Sprint 3 review week
- **Sprint 4 stories created by:** Thursday 12:00 PM of Sprint 4 planning week
- **Sprint 4 ends:** Monday 12:00 PM of Sprint 4 review week (= MS3 deadline)

### Rules Reminder
- At least **5 stories per sprint**
- Each story ≥ 1 point (1 point = 4 hours)
- Each story has: **title**, **description**, **assignee**, **deadline**, **status**
- Status must reflect progress: Not Started → In Progress → Completed

---

### Kim Shi Tong (A0265858J) — Load Testing

#### Sprint 3 Stories

| # | Title | Description | Points | Deadline | Status |
|---|-------|-------------|--------|----------|--------|
| 1 | **Set up k6 testing environment** | Install Grafana k6 on local machine. Verify k6 works by running a smoke test against localhost:6060. Create `tests/nft/` directory structure. Document setup steps. | 1 | Sprint 3 mid | Not Started → Completed |
| 2 | **Write k6 load test for product API endpoints** | Create load test script targeting `GET /api/v1/product/get-product`, `GET /api/v1/product/product-list/:page`, `GET /api/v1/product/search/:keyword`. Ramp up to 50 VUs, hold for 5 min. Add checks for status 200 and response body validation. | 2 | Sprint 3 mid-late | Not Started → Completed |
| 3 | **Write k6 load test for auth & category endpoints** | Extend load test to include `POST /api/v1/auth/login`, `GET /api/v1/category/get-category`. Simulate realistic user flow: browse categories → view products → search → login. Add think time (sleep) between requests. | 2 | Sprint 3 late | Not Started → Completed |
| 4 | **Configure thresholds and HTML report generation** | Set thresholds: p95 < 500ms, error rate < 1%. Add `handleSummary()` function using k6-reporter to export HTML report. Configure JSON output for archival. Verify thresholds pass/fail correctly. | 1 | Sprint 3 end | Not Started → Completed |
| 5 | **Execute initial load test run and analyze results** | Run full load test suite against running server. Capture k6 terminal summary screenshots. Analyze p95/p99 latency, throughput (req/s), error rate. Document initial findings. Identify any performance issues. | 2 | Sprint 3 end | Not Started → Completed |

#### Sprint 4 Stories

| # | Title | Description | Points | Deadline | Status |
|---|-------|-------------|--------|----------|--------|
| 1 | **Fix bugs discovered during load testing** | Investigate and fix any performance issues, errors, or crashes found during Sprint 3 load test runs. This may include: slow endpoints, unhandled errors under concurrent load, connection timeouts. | 2 | Sprint 4 mid | Not Started → Completed |
| 2 | **Refine load test scenarios and thresholds** | Adjust VU stages based on Sprint 3 results. Add per-endpoint URL tagging for granular metrics. Fine-tune thresholds based on baseline performance. Add product-filters POST endpoint to the test. | 1 | Sprint 4 mid | Not Started → Completed |
| 3 | **Generate final load test reports and evidence** | Execute final load test runs. Generate HTML reports via k6-reporter. Export JSON results. Take terminal summary screenshots. Store all artifacts in `results/` folder. | 1 | Sprint 4 mid-late | Not Started → Completed |
| 4 | **Update README with MS3 contribution** | Add MS3 section to README.md documenting: test type (load testing), tool (k6), endpoints tested, key findings, bugs fixed. Include name and student ID. | 1 | Sprint 4 late | Not Started → Completed |
| 5 | **Final review, cleanup, and ms3 tag** | Review all test scripts have `// Kim Shi Tong, A0265858J` comments. Ensure all artifacts (scripts, reports, screenshots) are committed. Coordinate with team to create `ms3` Git tag. Verify tag includes all NFT files. | 1 | Sprint 4 end | Not Started → Completed |

---

### Yan Weidong (A0258151H) — Stress Testing

#### Sprint 3 Stories

| # | Title | Description | Points | Deadline | Status |
|---|-------|-------------|--------|----------|--------|
| 1 | **Set up k6 environment for stress testing** | Install k6. Create `tests/nft/stress-test.js`. Run a quick smoke test to verify tool works. Plan which endpoints to stress test based on CPU/DB intensity (login with bcrypt, search with regex, product filters). | 1 | Sprint 3 mid | Not Started → Completed |
| 2 | **Write k6 stress test for auth endpoints** | Create stress test targeting `POST /api/v1/auth/login` (bcrypt is CPU-heavy). Stages: escalate from 50 → 100 → 200 → 300 → 400 VUs over 12 min. Add checks that responses return (even if not 200). Relaxed thresholds: p95 < 2s, error rate < 10%. | 2 | Sprint 3 mid-late | Not Started → Completed |
| 3 | **Write k6 stress test for product search & filter endpoints** | Add `GET /api/v1/product/search/:keyword` and `POST /api/v1/product/product-filters` to stress test. These are DB-intensive (regex search, filter queries). Validate that server doesn't crash even at 400 VUs. | 2 | Sprint 3 late | Not Started → Completed |
| 4 | **Configure breaking point detection and reporting** | Add custom k6 metrics to track when error rate spikes. Use `handleSummary()` for HTML report. Add threshold abort conditions. Configure JSON output to capture the exact VU count where degradation begins. | 1 | Sprint 3 end | Not Started → Completed |
| 5 | **Execute initial stress test and identify breaking point** | Run full stress test suite. Monitor at which VU level p95 degrades (>2s) and errors appear (>5%). Record breaking point. Capture screenshots. Document which endpoint breaks first. | 2 | Sprint 3 end | Not Started → Completed |

#### Sprint 4 Stories

| # | Title | Description | Points | Deadline | Status |
|---|-------|-------------|--------|----------|--------|
| 1 | **Fix bugs and crashes discovered during stress testing** | Investigate server crashes, unhandled errors, or timeouts found at high VU counts. Fix error handling for concurrent requests. Address any memory issues or connection pool exhaustion. | 2 | Sprint 4 mid | Not Started → Completed |
| 2 | **Add recovery phase analysis to stress test** | Extend script with a recovery stage (ramp down to 0 after peak). Measure how quickly response times return to baseline after overload. Add custom metrics tracking recovery behavior. | 1 | Sprint 4 mid | Not Started → Completed |
| 3 | **Generate final stress test reports** | Execute final stress test runs. Generate HTML reports showing escalation pattern. Export JSON results. Screenshots of k6 summary clearly showing the breaking point. Store in `results/`. | 1 | Sprint 4 mid-late | Not Started → Completed |
| 4 | **Update README with MS3 stress testing contribution** | Add MS3 section: test type (stress testing), tool (k6), endpoints tested, breaking point found, bugs fixed. Include `// Yan Weidong, A0258151H` in all test files. | 1 | Sprint 4 late | Not Started → Completed |
| 5 | **Final review and ms3 tag coordination** | Verify all scripts have name/ID comments. All reports and screenshots committed. Coordinate `ms3` Git tag with team. Verify artifacts are in the tag. | 1 | Sprint 4 end | Not Started → Completed |

---

### Ong Chang Heng Bertrand (A0253013X) — Spike Testing

#### Sprint 3 Stories

| # | Title | Description | Points | Deadline | Status |
|---|-------|-------------|--------|----------|--------|
| 1 | **Set up k6 environment for spike testing** | Install k6. Create `tests/nft/spike-test.js`. Research spike test VU profiles (instant ramp, short hold, instant drop). Plan scenario: simulate flash sale / viral traffic spike. | 1 | Sprint 3 mid | Not Started → Completed |
| 2 | **Write k6 spike test for product browsing flow** | Create spike test: baseline at 10 VUs → instant jump to 500 VUs in 10s → hold 1 min → instant drop to 10 VUs → observe 2 min recovery. Target `GET /api/v1/product/get-product`, `GET /api/v1/category/get-category`, `GET /api/v1/product/search/:keyword`. | 2 | Sprint 3 mid-late | Not Started → Completed |
| 3 | **Write k6 spike test for auth and cart flow** | Add auth endpoints to spike: `POST /api/v1/auth/login`. Simulate sudden surge of users trying to log in simultaneously (flash sale scenario). Minimal think time (0.3s) during spike to simulate urgency. | 2 | Sprint 3 late | Not Started → Completed |
| 4 | **Configure spike-specific metrics and reporting** | Add custom metrics to measure: time-to-recovery after spike ends, error rate during vs after spike, p95 during spike vs baseline. Use `handleSummary()` for HTML report. Very relaxed thresholds during spike (p95 < 3s, errors < 15%). | 1 | Sprint 3 end | Not Started → Completed |
| 5 | **Execute initial spike test and measure recovery** | Run full spike test. Key questions: Does server survive the instant surge? How many errors during the spike? How long until response times return to baseline after spike ends? Capture screenshots. | 2 | Sprint 3 end | Not Started → Completed |

#### Sprint 4 Stories

| # | Title | Description | Points | Deadline | Status |
|---|-------|-------------|--------|----------|--------|
| 1 | **Fix bugs found during spike testing** | Address any crashes during sudden traffic surge. Fix connection handling issues. Address any errors that persist after the spike ends (recovery failures). | 2 | Sprint 4 mid | Not Started → Completed |
| 2 | **Add multiple spike patterns** | Add additional spike scenarios: double spike (two surges), gradual spike (less sudden), spike at different VU levels (200, 500, 800). Compare recovery behavior across patterns. | 1 | Sprint 4 mid | Not Started → Completed |
| 3 | **Generate final spike test reports** | Execute final spike test runs. Generate HTML reports showing the spike impact clearly. Export JSON. Screenshots of k6 summary showing before/during/after spike metrics. Store in `results/`. | 1 | Sprint 4 mid-late | Not Started → Completed |
| 4 | **Update README with MS3 spike testing contribution** | Add MS3 section: test type (spike testing), tool (k6), endpoints tested, spike scenarios, recovery time findings, bugs fixed. Add `// Ong Chang Heng Bertrand, A0253013X` comments. | 1 | Sprint 4 late | Not Started → Completed |
| 5 | **Final review and ms3 tag coordination** | Verify all scripts have name/ID comments. All reports and screenshots committed. Coordinate `ms3` Git tag with team. Verify all NFT artifacts included. | 1 | Sprint 4 end | Not Started → Completed |

---

### Shaun Lee Xuan Wei (A0252626E) — Soak/Endurance Testing

#### Sprint 3 Stories

| # | Title | Description | Points | Deadline | Status |
|---|-------|-------------|--------|----------|--------|
| 1 | **Set up k6 environment for soak testing** | Install k6. Create `tests/nft/soak-test.js`. Research soak test best practices (long duration, steady VUs, memory leak detection). Plan for configurable duration (30min for dev, 1-4h for full runs). | 1 | Sprint 3 mid | Not Started → Completed |
| 2 | **Write k6 soak test for core API endpoints** | Create soak test: ramp to 30 VUs → hold steady for 1 hour → ramp down. Target `GET /api/v1/product/get-product`, `GET /api/v1/category/get-category`, `GET /api/v1/product/product-list/:page`. Realistic pacing with 2s sleep between iterations. | 2 | Sprint 3 mid-late | Not Started → Completed |
| 3 | **Add auth and search endpoints to soak test** | Add `POST /api/v1/auth/login` every 10th iteration (simulating periodic logins). Add `GET /api/v1/product/search/:keyword` with varied keywords. These test sustained DB load over time. | 2 | Sprint 3 late | Not Started → Completed |
| 4 | **Configure soak-specific thresholds and reporting** | Strict thresholds that should hold over time: p95 < 600ms, error rate < 1%. Add `handleSummary()` for HTML report. Configure JSON output for time-series analysis. Plan system resource monitoring (memory/CPU) during test. | 1 | Sprint 3 end | Not Started → Completed |
| 5 | **Execute initial soak test (30-min short run)** | Run abbreviated soak test (30 min) to validate scripts work. Monitor for early signs of degradation. Compare p95 at start vs end of run. Check for increasing error rate. Capture screenshots. | 2 | Sprint 3 end | Not Started → Completed |

#### Sprint 4 Stories

| # | Title | Description | Points | Deadline | Status |
|---|-------|-------------|--------|----------|--------|
| 1 | **Fix bugs found during soak testing** | Investigate any memory leaks, connection pool exhaustion, or gradual performance degradation discovered. Fix resource management issues. Address any error accumulation over time. | 2 | Sprint 4 mid | Not Started → Completed |
| 2 | **Execute full-duration soak test (1–4 hours)** | Run extended soak test for at least 1 hour (ideally 2–4 hours). Compare metrics at 15-min intervals to detect gradual degradation. Monitor Node.js memory usage if possible. | 2 | Sprint 4 mid-late | Not Started → Completed |
| 3 | **Generate final soak test reports and evidence** | Generate HTML reports. Export JSON time-series data. Screenshots of k6 summary showing full duration results. Document any latency drift or resource issues. Store in `results/`. | 1 | Sprint 4 mid-late | Not Started → Completed |
| 4 | **Update README with MS3 soak testing contribution** | Add MS3 section: test type (soak/endurance testing), tool (k6), endpoints tested, duration, degradation findings, bugs fixed. Add `// Shaun Lee Xuan Wei, A0252626E` comments. | 1 | Sprint 4 late | Not Started → Completed |
| 5 | **Final review and ms3 tag coordination** | Verify all scripts have name/ID comments. All reports and screenshots committed. Coordinate `ms3` Git tag with team. Verify all NFT artifacts included. | 1 | Sprint 4 end | Not Started → Completed |

---

## Detailed Implementation Guide

### Shared: k6 Installation & Project Setup

```bash
# Install k6
brew install k6                        # macOS
# choco install k6                     # Windows
# sudo apt install k6                  # Ubuntu/Debian
# See: https://grafana.com/docs/k6/latest/set-up/install-k6/

# Create test directories
mkdir -p tests/nft results

# Verify installation
k6 version
```

### Shared: HTML Report Generation (handleSummary)

Every member should include this in their test script to generate HTML reports:

```javascript
// Add to the end of each k6 test script
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

export function handleSummary(data) {
  return {
    'results/<test-type>-report.html': htmlReport(data),
    'results/<test-type>-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

### Shared: k6 Web Dashboard (built-in since v0.49)

```bash
# Run any test with built-in real-time web dashboard
K6_WEB_DASHBOARD=true k6 run tests/nft/<test-script>.js
# Opens a dashboard at http://localhost:5665 during the test run
# Automatically saves an HTML report at the end
```

---

## Test Script: Load Testing (Kim Shi Tong)

```javascript
// tests/nft/load-test.js
// Kim Shi Tong, A0265858J

import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';

export const options = {
  // Load test profile: gradual ramp to expected load, hold, ramp down
  stages: [
    { duration: '1m', target: 20 },   // ramp up gradually
    { duration: '2m', target: 50 },   // ramp to expected peak
    { duration: '5m', target: 50 },   // hold at expected peak
    { duration: '1m', target: 0 },    // ramp down gracefully
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // strict latency
    http_req_failed: ['rate<0.01'],                    // <1% error rate
    'http_req_duration{name:products}': ['p(95)<500'],
    'http_req_duration{name:categories}': ['p(95)<400'],
    'http_req_duration{name:search}': ['p(95)<600'],
    'http_req_duration{name:login}': ['p(95)<800'],
  },
};

export default function () {
  // 1. Browse products (most common action)
  const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`, {
    tags: { name: 'products' },
  });
  check(productsRes, {
    'products: status 200': (r) => r.status === 200,
    'products: has product array': (r) => {
      const body = JSON.parse(r.body);
      return body.products !== undefined;
    },
  });

  // 2. Browse categories
  const catRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
    tags: { name: 'categories' },
  });
  check(catRes, {
    'categories: status 200': (r) => r.status === 200,
  });

  // 3. Paginated product list
  const page = Math.floor(Math.random() * 3) + 1;
  const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
    tags: { name: 'productList' },
  });
  check(listRes, {
    'product list: status 200': (r) => r.status === 200,
  });

  // 4. Search products
  const keywords = ['laptop', 'phone', 'book', 'shirt', 'camera'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  const searchRes = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`, {
    tags: { name: 'search' },
  });
  check(searchRes, {
    'search: status 200': (r) => r.status === 200,
  });

  // 5. Login (simulating returning users)
  if (__ITER % 5 === 0) {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: 'test@test.com', password: 'testpassword' }),
      { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
    );
    check(loginRes, {
      'login: responded (not 500)': (r) => r.status !== 500,
    });
  }

  sleep(1); // think time between actions
}

export function handleSummary(data) {
  return {
    'results/load-test-report.html': htmlReport(data),
    'results/load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

### Run Commands

```bash
# Basic run
k6 run tests/nft/load-test.js

# With web dashboard (real-time graphs)
K6_WEB_DASHBOARD=true k6 run tests/nft/load-test.js

# With custom base URL
k6 run -e BASE_URL=http://localhost:6060 tests/nft/load-test.js
```

---

## Test Script: Stress Testing (Yan Weidong)

```javascript
// tests/nft/stress-test.js
// Yan Weidong, A0258151H

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';

// Custom metrics for breaking point analysis
const errorRate = new Rate('custom_error_rate');
const loginDuration = new Trend('custom_login_duration');
const searchDuration = new Trend('custom_search_duration');

export const options = {
  // Stress test profile: stepped escalation beyond capacity
  stages: [
    { duration: '1m', target: 50 },    // warm up — below normal
    { duration: '2m', target: 100 },   // normal load
    { duration: '2m', target: 200 },   // above normal — approaching limit
    { duration: '2m', target: 300 },   // beyond expected — stress zone
    { duration: '2m', target: 400 },   // well beyond — breaking point
    { duration: '1m', target: 500 },   // extreme — confirm break
    { duration: '2m', target: 0 },     // recovery — does it come back?
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],    // relaxed — expect degradation
    http_req_failed: ['rate<0.15'],       // allow higher errors under stress
    custom_error_rate: ['rate<0.20'],     // custom tracking
  },
};

export default function () {
  // Login — bcrypt is CPU-bound, most likely to break first
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'test@test.com', password: 'testpassword' }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
  );
  check(loginRes, {
    'login: server responded': (r) => r.status !== 0,
    'login: not 500': (r) => r.status !== 500,
  });
  errorRate.add(loginRes.status === 0 || loginRes.status >= 500);
  loginDuration.add(loginRes.timings.duration);

  // Search — regex on MongoDB, DB-intensive
  const searchRes = http.get(`${BASE_URL}/api/v1/product/search/phone`, {
    tags: { name: 'search' },
  });
  check(searchRes, {
    'search: server responded': (r) => r.status !== 0,
    'search: not 500': (r) => r.status !== 500,
  });
  errorRate.add(searchRes.status === 0 || searchRes.status >= 500);
  searchDuration.add(searchRes.timings.duration);

  // Product filters — DB aggregation query
  const filterRes = http.post(
    `${BASE_URL}/api/v1/product/product-filters`,
    JSON.stringify({ checked: [], radio: [0, 100] }),
    { headers: { 'Content-Type': 'application/json' }, tags: { name: 'filters' } }
  );
  check(filterRes, {
    'filters: server responded': (r) => r.status !== 0,
  });
  errorRate.add(filterRes.status === 0 || filterRes.status >= 500);

  // Get all products — basic DB read under concurrency
  const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`, {
    tags: { name: 'products' },
  });
  check(productsRes, {
    'products: responded': (r) => r.status !== 0,
  });

  sleep(0.3); // minimal think time — stress scenario
}

export function handleSummary(data) {
  return {
    'results/stress-test-report.html': htmlReport(data),
    'results/stress-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

### Run Commands

```bash
k6 run tests/nft/stress-test.js
K6_WEB_DASHBOARD=true k6 run tests/nft/stress-test.js
```

---

## Test Script: Spike Testing (Ong Chang Heng Bertrand)

```javascript
// tests/nft/spike-test.js
// Ong Chang Heng Bertrand, A0253013X

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';

// Custom metrics for spike analysis
const spikeErrorRate = new Rate('spike_error_rate');
const responseTime = new Trend('spike_response_time');

export const options = {
  // Spike test profile: instant surge, then instant drop
  stages: [
    { duration: '1m', target: 10 },     // 1. baseline — normal traffic
    { duration: '10s', target: 500 },    // 2. SPIKE — instant surge (flash sale!)
    { duration: '1m', target: 500 },     // 3. hold spike — sustained rush
    { duration: '10s', target: 10 },     // 4. instant drop — rush over
    { duration: '2m', target: 10 },      // 5. recovery — observe normalization
    { duration: '30s', target: 0 },      // 6. ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],            // very relaxed during spike
    http_req_failed: ['rate<0.15'],               // some errors expected
    spike_error_rate: ['rate<0.20'],              // custom tracking
    'http_req_duration{phase:baseline}': ['p(95)<500'],   // strict during baseline
    'http_req_duration{phase:recovery}': ['p(95)<800'],   // should recover
  },
};

export default function () {
  // Determine phase for tagging
  const elapsed = __ENV.__VU_ELAPSED || 0;
  const phase = __ITER < 60 ? 'baseline' : (__ITER > 200 ? 'recovery' : 'spike');

  // Simulate flash sale browsing — users rushing to buy products
  const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`, {
    tags: { name: 'products', phase: phase },
  });
  check(productsRes, {
    'products: responded': (r) => r.status !== 0,
    'products: status 200': (r) => r.status === 200,
  });
  spikeErrorRate.add(productsRes.status === 0 || productsRes.status >= 500);
  responseTime.add(productsRes.timings.duration);

  // Category browsing during rush
  const catRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
    tags: { name: 'categories', phase: phase },
  });
  check(catRes, {
    'categories: responded': (r) => r.status !== 0,
  });
  spikeErrorRate.add(catRes.status === 0 || catRes.status >= 500);

  // Search for products (everyone searching at once)
  const keywords = ['laptop', 'phone', 'tablet', 'headphones'];
  const keyword = keywords[Math.floor(Math.random() * keywords.length)];
  const searchRes = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`, {
    tags: { name: 'search', phase: phase },
  });
  check(searchRes, {
    'search: responded': (r) => r.status !== 0,
  });
  spikeErrorRate.add(searchRes.status === 0 || searchRes.status >= 500);

  // Users trying to log in during the rush
  if (__ITER % 3 === 0) {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: 'test@test.com', password: 'testpassword' }),
      { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login', phase: phase } }
    );
    check(loginRes, {
      'login: responded': (r) => r.status !== 0,
    });
    spikeErrorRate.add(loginRes.status === 0 || loginRes.status >= 500);
  }

  sleep(0.3); // minimal think time during rush
}

export function handleSummary(data) {
  return {
    'results/spike-test-report.html': htmlReport(data),
    'results/spike-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

### Run Commands

```bash
k6 run tests/nft/spike-test.js
K6_WEB_DASHBOARD=true k6 run tests/nft/spike-test.js
```

---

## Test Script: Soak/Endurance Testing (Shaun Lee Xuan Wei)

```javascript
// tests/nft/soak-test.js
// Shaun Lee Xuan Wei, A0252626E

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Counter } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';
const SOAK_DURATION = __ENV.SOAK_DURATION || '30m'; // default 30min, use 1h-4h for full runs

// Custom metrics for degradation tracking
const iterationDuration = new Trend('soak_iteration_duration');
const totalRequests = new Counter('soak_total_requests');

export const options = {
  // Soak test profile: moderate steady load for extended period
  stages: [
    { duration: '2m', target: 30 },             // ramp up
    { duration: SOAK_DURATION, target: 30 },     // hold steady for extended period
    { duration: '2m', target: 0 },               // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<600', 'p(99)<1200'],  // strict — should hold over time
    http_req_failed: ['rate<0.01'],                    // <1% errors even after hours
    soak_iteration_duration: ['p(95)<3000'],           // full iteration < 3s
  },
};

export default function () {
  const iterStart = Date.now();

  // 1. Browse products — most common action
  const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`, {
    tags: { name: 'products' },
  });
  check(productsRes, {
    'products: status 200': (r) => r.status === 200,
  });
  totalRequests.add(1);

  // 2. Browse categories
  const catRes = http.get(`${BASE_URL}/api/v1/category/get-category`, {
    tags: { name: 'categories' },
  });
  check(catRes, {
    'categories: status 200': (r) => r.status === 200,
  });
  totalRequests.add(1);

  // 3. Paginated product list
  const page = Math.floor(Math.random() * 3) + 1;
  const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/${page}`, {
    tags: { name: 'productList' },
  });
  check(listRes, {
    'product list: status 200': (r) => r.status === 200,
  });
  totalRequests.add(1);

  // 4. Search — every few iterations
  if (__ITER % 3 === 0) {
    const keywords = ['laptop', 'phone', 'book', 'test'];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const searchRes = http.get(`${BASE_URL}/api/v1/product/search/${keyword}`, {
      tags: { name: 'search' },
    });
    check(searchRes, {
      'search: status 200': (r) => r.status === 200,
    });
    totalRequests.add(1);
  }

  // 5. Login — every 10th iteration (simulating periodic auth)
  if (__ITER % 10 === 0) {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: 'test@test.com', password: 'testpassword' }),
      { headers: { 'Content-Type': 'application/json' }, tags: { name: 'login' } }
    );
    check(loginRes, {
      'login: not 500': (r) => r.status !== 500,
    });
    totalRequests.add(1);
  }

  // Track full iteration time for degradation detection
  iterationDuration.add(Date.now() - iterStart);

  sleep(2); // realistic pacing for sustained load
}

export function handleSummary(data) {
  return {
    'results/soak-test-report.html': htmlReport(data),
    'results/soak-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

### Run Commands

```bash
# Short run (30 min — for development/validation)
k6 run tests/nft/soak-test.js

# 1-hour full run
k6 run -e SOAK_DURATION=1h tests/nft/soak-test.js

# 4-hour extended run
k6 run -e SOAK_DURATION=4h tests/nft/soak-test.js

# With web dashboard
K6_WEB_DASHBOARD=true k6 run -e SOAK_DURATION=1h tests/nft/soak-test.js
```

---

## What to Submit (ms3 Tag Checklist)

### Files to Commit

```
tests/nft/
├── load-test.js              # Kim Shi Tong, A0265858J
├── stress-test.js            # Yan Weidong, A0258151H
├── spike-test.js             # Ong Chang Heng Bertrand, A0253013X
└── soak-test.js              # Shaun Lee Xuan Wei, A0252626E

results/
├── load-test-report.html     # generated by k6-reporter
├── load-test-results.json
├── stress-test-report.html
├── stress-test-results.json
├── spike-test-report.html
├── spike-test-results.json
├── soak-test-report.html
└── soak-test-results.json
```

### README.md Update Template

```markdown
# MS3 Contribution Summary (Non-Functional Testing)

| Member | Test Type | Tool | Files |
|--------|-----------|------|-------|
| **Kim Shi Tong (A0265858J)** | Load Testing | Grafana k6 | `tests/nft/load-test.js` |
| **Yan Weidong (A0258151H)** | Stress Testing | Grafana k6 | `tests/nft/stress-test.js` |
| **Ong Chang Heng Bertrand (A0253013X)** | Spike Testing | Grafana k6 | `tests/nft/spike-test.js` |
| **Shaun Lee Xuan Wei (A0252626E)** | Soak/Endurance Testing | Grafana k6 | `tests/nft/soak-test.js` |
```

### Git Tag

```bash
# After all commits are in
git tag ms3
git push origin ms3
```

---

## Grading Checklist

| Criterion | Points | ✅ How to Satisfy |
|-----------|--------|------------------|
| **Consistency** | 1% | Script matches what you write in the report. VU profile, endpoints, thresholds in code = what you describe. |
| **Correctness** | 2% | Script runs without errors. k6 actually generates load. Checks and thresholds produce meaningful pass/fail. HTML report is generated. |
| **Uniqueness** | 1% | Load ≠ Stress ≠ Spike ≠ Soak. All 4 have different VU profiles, durations, goals, and thresholds (see [comparison table](#how-the-4-types-differ)). |

### Common Mistakes to Avoid
- ❌ All 4 scripts having identical VU stages → not unique
- ❌ No `handleSummary` → no report artifact to submit
- ❌ No `// Name, StudentID` comment → 1 mark deduction
- ❌ No README update → graders can't find your contribution
- ❌ Not fixing bugs found → rubric says "fix any bugs found"
- ❌ Forgetting to create `ms3` Git tag → nothing to grade

---

## References

- [Grafana k6 Documentation](https://grafana.com/docs/k6/latest/)
- [k6 Test Types: Load, Stress, Spike, Soak](https://www.kodziak.com/blog/load-testing-types-load-stress-soak-spike)
- [k6 Thresholds Documentation](https://grafana.com/docs/k6/latest/using-k6/thresholds/)
- [k6 Custom Metrics](https://grafana.com/docs/k6/latest/using-k6/metrics/)
- [k6 handleSummary / Custom Summary](https://grafana.com/docs/k6/latest/results-output/end-of-test/custom-summary/)
- [k6 Web Dashboard](https://grafana.com/docs/k6/latest/results-output/web-dashboard/)
- [k6-reporter (HTML Reports)](https://github.com/benc-uk/k6-reporter)
- [Peak, Spike, and Soak Tests with k6](https://grafana.com/blog/2023/02/14/load-testing-grafana-k6-peak-spike-and-soak-tests/)
- [Types of Load Testing — Grafana](https://grafana.com/load-testing/types-of-load-testing/)
