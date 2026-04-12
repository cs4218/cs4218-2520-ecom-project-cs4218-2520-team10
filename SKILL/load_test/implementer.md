# Load Test Implementer - Write & Execute

**Implement load tests based on the planner's output.**

---

## Script Structure

Every k6 load test script follows this structure:

```javascript
// Author Name, ID
// [Test Type] Script Title
// Description of what endpoints are tested

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:<port>";

// 1. Custom metrics (one Trend per endpoint)
// 2. Seed data constants (verified against running API)
// 3. k6 options (stages + thresholds)
// 4. default function (test logic with groups)
// 5. handleSummary (HTML + JSON output)
```

---

## Implementation Patterns

### Pattern 1: Group per Endpoint
```javascript
group("Endpoint Name", function () {
  const res = http.get(`${BASE_URL}/api/v1/resource`, {
    tags: { name: "EndpointName" },  // appears in report
  });
  const success = check(res, {
    "status is 200": (r) => r.status === 200,
  });
  errorRate.add(!success);
  endpointTrend.add(res.timings.duration);
});
sleep(1);
```

### Pattern 2: Random Selection from Seed Data
```javascript
const SLUGS = ["item-a", "item-b", "item-c"];
const slug = SLUGS[Math.floor(Math.random() * SLUGS.length)];
const page = Math.floor(Math.random() * 3) + 1;
```

### Pattern 3: POST with JSON Body
```javascript
const res = http.post(
  `${BASE_URL}/api/v1/auth/login`,
  JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  {
    headers: { "Content-Type": "application/json" },
    tags: { name: "Login" },
  }
);
```

### Pattern 4: Unique Data per VU (for write endpoints)
```javascript
// __VU = virtual user ID, __ITER = iteration count
const uniqueEmail = `loadtest_vu${__VU}_iter${__ITER}@test.com`;
```

### Pattern 5: Alternating Journeys (Single Scenario)
```javascript
// DON'T: Two k6 scenarios each with 50 VUs = 100 VUs total
// DO: One scenario, alternate per iteration
export default function () {
  if (__ITER % 2 === 0) {
    journeyA();
  } else {
    journeyB();
  }
}
```

**Why:** k6 `scenarios` run in parallel. Two scenarios each targeting 50 VUs creates 100 concurrent users, not 50. Use alternation within a single default function to keep VU count accurate.

### Pattern 6: Mixed Read/Write Workload
```javascript
export default function () {
  if (Math.random() < 0.8) {
    doReadOperation();   // 80% reads
  } else {
    doWriteOperation();  // 20% writes
  }
  sleep(0.5);
}
```

### Pattern 7: Sequential User Journey with Think Time
```javascript
export default function () {
  // Step 1: Browse
  http.get(`${BASE_URL}/api/v1/categories`);
  sleep(1);  // user pauses

  // Step 2: View products
  http.get(`${BASE_URL}/api/v1/products`);
  sleep(1);

  // Step 3: Search
  http.get(`${BASE_URL}/api/v1/search/keyword`);
  sleep(1);

  // Step 4: View detail
  http.get(`${BASE_URL}/api/v1/products/item-slug`);
  sleep(1);

  // Step 5: Login
  http.post(`${BASE_URL}/api/v1/auth/login`, ...);
}
```

### Pattern 8: Null-Body Guard (Required)
```javascript
// When server crashes under load, r.body is null.
// r.json() on null body produces hundreds of GoError stack traces.
check(res, {
  "body valid": (r) => {
    if (!r.body) return false;  // ALWAYS add this guard
    const body = r.json();
    return body && body.token;
  },
});
```

### Pattern 9: handleSummary for Reports
```javascript
export function handleSummary(data) {
  return {
    "results/script-name-report.html": htmlReport(data),
    "results/script-name-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
```

---

## Execution Workflow

### Step 1: Smoke Test (Always First)
```bash
k6 run tests/nft/script-name.js --duration 10s --vus 1
```
**Expect:** 100% checks, 0 errors. If this fails, the script has a bug — fix before full run.

### Step 2: Full Run
```bash
k6 run tests/nft/script-name.js
```

### Step 3: Full Run with Dashboard (Optional)
```bash
K6_WEB_DASHBOARD=true k6 run tests/nft/script-name.js
# Opens live dashboard at http://localhost:5665
```

### Step 4: Verify Artifacts
```bash
ls results/
# script-name-report.html  ← open in browser
# script-name-results.json ← raw data
```

**Run one script at a time** — running multiple k6 tests simultaneously skews results.

---

## Common Pitfalls & Fixes

### Pitfall 1: Seed Data Mismatch
**Symptom:** 100% check failures at 1 VU, endpoint returns 404.
**Cause:** Hardcoded slugs/IDs don't exist in the database.
**Fix:** Verify against the running API:
```bash
curl -s http://localhost:<port>/api/v1/resource/slug-name
# Must return 200, not 404
```
If mismatch: update script constants or re-seed the database.

### Pitfall 2: Server Not Connected to DB
**Symptom:** All requests timeout at 10s, `connection refused` errors from the start.
**Cause:** Server started but database connection string is wrong or DB is not running.
**Fix:** Check server logs for "Connected to database" message. Verify DB is running.

### Pitfall 3: Null Body Stack Traces
**Symptom:** Hundreds of `GoError: the body is null so we can't transform it to JSON`.
**Cause:** Server crashed under load, responses have null bodies.
**Fix:** Add `if (!r.body) return false;` before every `r.json()` call. The server crashing is a valid finding — the stack traces are just noise.

### Pitfall 4: Parallel Scenarios Doubling VUs
**Symptom:** k6 shows `max=100` VUs when you expected 50.
**Cause:** Two k6 `scenarios` run simultaneously, each with `target: 50`.
**Fix:** Use one default function with `__ITER % 2` alternation, or set `target: 25` per scenario.

### Pitfall 5: Binary Endpoints Hanging
**Symptom:** One endpoint shows 60s response time, blocks entire iteration.
**Cause:** Photo/file endpoint hangs when no binary data exists in DB.
**Fix:** Add `timeout: "5s"` to the request options, or skip endpoint if data doesn't exist.

### Pitfall 6: Wrong Response Shape
**Symptom:** 100% check failures but `status is 200` passes.
**Cause:** Checking for `body.results` but API returns plain array or `body.products`.
**Fix:** curl the endpoint and inspect the actual JSON keys before writing checks.

### Pitfall 7: Interrupted Test Results
**Symptom:** Extreme latencies (4s+), high error rates, connection refused errors mid-test.
**Cause:** Laptop sleep, internet disconnect, or server crash during test.
**Fix:** Don't use these results. Re-run under stable conditions.

---

## Implementation Checklist

- [ ] Every script has author name/ID comment header
- [ ] `BASE_URL` uses `__ENV.BASE_URL` with localhost fallback
- [ ] Every endpoint has its own `group()` block
- [ ] Every endpoint has its own custom `Trend` metric
- [ ] Every endpoint tagged with `{ tags: { name: "..." } }`
- [ ] All JSON body checks have `if (!r.body) return false` guard
- [ ] Seed data constants verified against running API
- [ ] `handleSummary()` outputs HTML + JSON to `results/`
- [ ] `results/` directory exists
- [ ] Smoke test passed (`--duration 10s --vus 1`) with 100% checks
- [ ] No parallel scenarios unintentionally doubling VU count
- [ ] Think time (sleep) between requests
- [ ] Ready for Reviewer
