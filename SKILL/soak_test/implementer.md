# Soak Test Implementer - Write & Execute

**Implement soak/endurance tests based on the planner's output.**

---

## Script Structure

Every k6 soak test script follows this structure:

```javascript
// Author Name, ID
// [Soak/Endurance] Script Title
// Description: what degradation hypothesis this script tests

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:<port>";
const SOAK_DURATION = __ENV.SOAK_DURATION || "1h";

// 1. Custom metrics (one Trend per endpoint + interval tracking)
// 2. Seed data constants (verified against running API)
// 3. Test start timestamp (for interval bucketing)
// 4. k6 options (soak stages + thresholds)
// 5. default function (test logic with groups + interval tags)
// 6. handleSummary (HTML + JSON output)
```

---

## Soak-Specific Implementation Patterns

### Pattern 1: Configurable Soak Duration

```javascript
const SOAK_DURATION = __ENV.SOAK_DURATION || "1h";

export const options = {
  stages: [
    { duration: "2m", target: 30 },           // ramp up
    { duration: SOAK_DURATION, target: 30 },   // hold steady
    { duration: "2m", target: 0 },             // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
};
```

**Run with:**
```bash
# Quick validation (19 min total)
SOAK_DURATION=15m k6 run soak-script.js

# Standard soak (64 min total)
SOAK_DURATION=1h k6 run soak-script.js

# Extended endurance (244 min total)
SOAK_DURATION=4h k6 run soak-script.js
```

### Pattern 2: Interval Bucketing for Drift Detection

```javascript
// Track which 15-minute interval we're in
const TEST_START = Date.now();
const INTERVAL_MINUTES = 15;

function getInterval() {
  const elapsedMin = Math.floor((Date.now() - TEST_START) / 60000);
  return Math.floor(elapsedMin / INTERVAL_MINUTES) * INTERVAL_MINUTES;
}

// Use in requests for time-tagged metrics
group("Endpoint Name", function () {
  const interval = getInterval();
  const res = http.get(`${BASE_URL}/api/v1/resource`, {
    tags: { name: "EndpointName", interval: `${interval}min` },
  });
  endpointTrend.add(res.timings.duration, { interval: `${interval}min` });
});
```

**Why:** k6 aggregates all metrics across the entire run. Tagging by interval allows post-analysis to compare p95 at 0min vs p95 at 60min vs p95 at 120min.

### Pattern 3: Periodic Console Logging

```javascript
// Log a status line every N iterations for real-time drift observation
const LOG_EVERY = 100; // iterations

export default function () {
  if (__ITER % LOG_EVERY === 0 && __ITER > 0) {
    const elapsedMin = Math.floor((Date.now() - TEST_START) / 60000);
    console.log(
      `[VU ${__VU}] iter=${__ITER}, elapsed=${elapsedMin}min, interval=${getInterval()}min`
    );
  }
  // ... test logic ...
}
```

**Why:** During a 4-hour run, you need visibility into progress. These log lines confirm the test is still running and show elapsed time.

### Pattern 4: Write Accumulation with Unique Data

```javascript
// Generate unique data per VU per iteration to avoid conflicts
// Track total writes for data growth monitoring
const writeCounter = new Counter("total_writes");

function doWrite() {
  const uniqueId = `soak_vu${__VU}_iter${__ITER}_${Date.now()}`;
  const res = http.post(
    `${BASE_URL}/api/v1/resource`,
    JSON.stringify({
      name: `Soak Test ${uniqueId}`,
      email: `soak_${uniqueId}@test.com`,
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { name: "CreateResource", interval: `${getInterval()}min` },
    }
  );
  writeCounter.add(1);
  return res;
}
```

**Why:** Write accumulation is a primary soak test concern. Unique IDs prevent collisions across VUs. The counter tracks total data growth.

### Pattern 5: Mixed Read/Write with Data Growth

```javascript
// 90% reads / 10% writes -- soak pacing is gentler than load tests
export default function () {
  if (Math.random() < 0.9) {
    doReadOperation();   // 90% reads -- monitor if these slow as writes accumulate
  } else {
    doWriteOperation();  // 10% writes -- accumulate data over hours
  }
  sleep(1.5);  // generous think time for soak
}
```

### Pattern 6: Group per Endpoint with Interval Tags

```javascript
group("Search Endpoint", function () {
  const interval = getInterval();
  const res = http.get(`${BASE_URL}/api/v1/search/keyword`, {
    tags: { name: "Search", interval: `${interval}min` },
    timeout: "10s",  // longer timeout for soak -- network hiccups happen over hours
  });
  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "body valid": (r) => {
      if (!r.body) return false;
      const body = r.json();
      return body && Array.isArray(body.results || body);
    },
  });
  errorRate.add(!success);
  searchTrend.add(res.timings.duration, { interval: `${interval}min` });
});
sleep(1);
```

### Pattern 7: Auth Session Churn (Login/Use/Repeat)

```javascript
// Simulate sustained authenticated sessions -- tests connection pool exhaustion
function authChurnCycle() {
  // Login
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { name: "Login", interval: `${getInterval()}min` },
    }
  );
  let token = null;
  if (loginRes.body) {
    try {
      token = loginRes.json().token;
    } catch (e) {}
  }
  sleep(1);

  // Use session (authenticated request)
  if (token) {
    http.get(`${BASE_URL}/api/v1/auth/user`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: "GetUser", interval: `${getInterval()}min` },
    });
  }
  sleep(1);
}
```

### Pattern 8: Null-Body Guard (Required -- Even More Critical for Soak)

```javascript
// Server degradation over hours makes null bodies more likely than in short tests.
// A null-body GoError at hour 3 will spam thousands of stack traces.
check(res, {
  "body valid": (r) => {
    if (!r.body) return false;  // ALWAYS guard -- especially critical for soak
    try {
      const body = r.json();
      return body && body.expectedField;
    } catch (e) {
      return false;  // malformed JSON under degradation
    }
  },
});
```

### Pattern 9: handleSummary for Soak Reports

```javascript
export function handleSummary(data) {
  return {
    "results/soak-script-name-report.html": htmlReport(data),
    "results/soak-script-name-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
```

### Pattern 10: Memory-Efficient Options for Long Runs

```javascript
export const options = {
  stages: [
    { duration: "2m", target: 30 },
    { duration: SOAK_DURATION, target: 30 },
    { duration: "2m", target: 0 },
  ],
  // Reduce k6 memory usage for long runs
  discardResponseBodies: false,  // set to true if you don't need body checks
  noConnectionReuse: false,      // reuse connections (default) to reduce overhead
  // Avoid high-cardinality tags -- each unique tag combo consumes memory
  // BAD:  tags: { name: "Search", query: keyword }  (unbounded)
  // GOOD: tags: { name: "Search", interval: "15min" } (bounded)
};
```

---

## Execution Workflow

### Step 1: Smoke Test (Always First)

```bash
k6 run tests/nft/soak-script.js --duration 10s --vus 1
```
**Expect:** 100% checks, 0 errors. If this fails, the script has a bug -- fix before soak run.

### Step 2: Short Validation Run

```bash
SOAK_DURATION=5m k6 run tests/nft/soak-script.js
```
**Expect:** Stable metrics over 5 minutes. Confirms the script runs without errors before committing to a multi-hour run.

### Step 3: Full Soak Run

```bash
# Standard 1-hour soak
SOAK_DURATION=1h k6 run tests/nft/soak-script.js

# With live dashboard
SOAK_DURATION=1h K6_WEB_DASHBOARD=true k6 run tests/nft/soak-script.js

# Extended 4-hour soak
SOAK_DURATION=4h k6 run tests/nft/soak-script.js
```

**Important for long runs:**
- Use `tmux` or `screen` if running over SSH to prevent disconnection kills
- Keep the machine awake (disable sleep/screen lock)
- Close unnecessary applications to avoid resource contention
- Monitor machine resources in a separate terminal:
  ```bash
  # Watch machine CPU and memory alongside the soak test
  top -l 0 -s 30 | grep "CPU usage\|PhysMem"  # macOS
  vmstat 30                                      # Linux
  ```

### Step 4: Verify Artifacts

```bash
ls results/
# soak-script-name-report.html  <- open in browser
# soak-script-name-results.json <- raw data for drift analysis
```

**Run one script at a time** -- running multiple k6 tests simultaneously skews results. This is especially important for soak tests, where machine resource competition would invalidate drift measurements.

---

## Post-Run Drift Analysis

### Analyzing Time-Series Data from JSON Results

After a soak run completes, analyze the JSON results for drift:

```bash
# Extract per-interval metrics from the JSON results
# Look for the tagged metrics in results/<name>-results.json
# Compare p95 values across intervals
```

**What to look for in the results:**

| Pattern | Meaning |
|---------|---------|
| Flat line (p95 stable across all intervals) | No degradation -- system is healthy |
| Gradual upward slope | Degradation -- memory leak, connection exhaustion, or data growth impact |
| Sudden step up at specific interval | Something changed -- GC pause, server restart, cache eviction |
| Periodic spikes at regular intervals | Scheduled job interference (cron, GC, log rotation) |
| Exponential increase toward end | Severe resource exhaustion -- system approaching failure |

**Report format for drift findings:**
```
DRIFT ANALYSIS
==============
Endpoint: Search
  p95 at 0-15min:   120ms
  p95 at 45-60min:  135ms
  p95 at 105-120min: 142ms
  Drift: +18% over 2 hours -- ACCEPTABLE (< 20%)

Endpoint: Login
  p95 at 0-15min:   450ms
  p95 at 45-60min:  680ms
  p95 at 105-120min: 920ms
  Drift: +104% over 2 hours -- DEGRADATION DETECTED
  Possible cause: session table growth, connection pool exhaustion
```

---

## Common Pitfalls & Fixes

### Pitfall 1: k6 Runs Out of Memory on Long Tests

**Symptom:** k6 process slows down or crashes after 2+ hours. Machine starts swapping.
**Cause:** High-cardinality tags (each unique tag value creates a separate metric series in memory). Thousands of unique interval tags or per-request tags.
**Fix:**
- Use bounded interval tags (`15min`, `30min`, not per-second timestamps)
- Set `discardResponseBodies: true` if body checks are not needed
- Reduce the number of custom metrics
- Avoid storing large response bodies in variables

### Pitfall 2: Test Machine Becomes the Bottleneck

**Symptom:** Latencies increase over time, but the server is fine. Machine CPU at 100%.
**Cause:** The test machine itself is degrading, not the server under test.
**Fix:**
- Monitor machine CPU/RAM alongside the soak test
- If machine CPU > 80%, reduce VUs or increase think time
- Close other applications during soak runs
- Consider running k6 on a separate machine from the server

### Pitfall 3: Network Timeouts on Long Runs

**Symptom:** Sporadic `connection timeout` or `connection reset` errors appearing at random intervals. Not consistent with any particular endpoint.
**Cause:** Network hiccups over multi-hour runs. WiFi reconnections, router timeouts, VPN resets.
**Fix:**
- Use wired connection for soak tests if possible
- Set generous timeouts: `timeout: "10s"` on requests
- Distinguish network errors (sporadic, random) from server degradation (consistent, worsening)
- A few network errors over 4 hours is normal -- investigate only if error rate trends upward

### Pitfall 4: Clock Drift in Interval Bucketing

**Symptom:** Intervals don't align with expected 15-minute boundaries. Last interval seems too long/short.
**Cause:** Using wall clock time instead of elapsed time from test start.
**Fix:** Always use `Date.now() - TEST_START` for interval calculation, not wall clock time.

### Pitfall 5: Seed Data Mismatch

**Symptom:** 100% check failures at 1 VU, endpoint returns 404.
**Cause:** Hardcoded slugs/IDs don't exist in the database.
**Fix:** Verify against the running API before writing scripts.

### Pitfall 6: Write Accumulation Fills Disk

**Symptom:** Server errors increase dramatically after N hours. Database errors in server logs.
**Cause:** Thousands of test records created during soak, disk fills up.
**Fix:** Calculate expected writes before running. Ensure disk has 2x the estimated data growth. Plan a cleanup script.

### Pitfall 7: Null Body Stack Traces

**Symptom:** Hundreds of `GoError: the body is null` stack traces in k6 output.
**Cause:** Server starts dropping connections under sustained load. More likely in soak tests than short runs.
**Fix:** Add `if (!r.body) return false;` and `try/catch` around every `r.json()` call. The server dropping connections after hours of sustained load IS a valid finding.

### Pitfall 8: Interrupted Long Run

**Symptom:** k6 exits partway through a 4-hour test. Partial results.
**Cause:** Laptop sleep, SSH disconnect, terminal closed, machine restart.
**Fix:**
- Use `tmux`/`screen` for SSH sessions
- Disable machine sleep (`caffeinate` on macOS, `systemd-inhibit` on Linux)
- Partial results from interrupted runs should NOT be used as evidence
- Re-run under stable conditions

### Pitfall 9: Server Auto-Restarts Masking Leaks

**Symptom:** Periodic brief spike every N minutes, then latency drops back to baseline.
**Cause:** Server has a watchdog/auto-restart that clears leaked memory periodically.
**Fix:** Check server logs for restarts. If the server restarts during a soak test, the test is still valid -- the restart itself is a finding (the server needs to restart to stay healthy).

---

## Implementation Checklist

- [ ] Every script has author name/ID comment header
- [ ] `BASE_URL` uses `__ENV.BASE_URL` with localhost fallback
- [ ] `SOAK_DURATION` uses `__ENV.SOAK_DURATION` with `"1h"` fallback
- [ ] VU profile: 2m ramp -> SOAK_DURATION hold -> 2m ramp down
- [ ] Target VUs: 30 (moderate, not stress-level)
- [ ] Every endpoint has its own `group()` block
- [ ] Every endpoint has its own custom `Trend` metric
- [ ] Every request tagged with `{ tags: { name: "...", interval: "Xmin" } }`
- [ ] Interval bucketing uses `Date.now() - TEST_START` (not wall clock)
- [ ] All JSON body checks have `if (!r.body) return false` guard with try/catch
- [ ] Seed data constants verified against running API
- [ ] Write endpoints use unique IDs (`__VU` + `__ITER` + `Date.now()`)
- [ ] Think time is generous (1-2s between requests)
- [ ] `handleSummary()` outputs HTML + JSON to `results/`
- [ ] `results/` directory exists
- [ ] Smoke test passed (`--duration 10s --vus 1`) with 100% checks
- [ ] Short validation passed (`SOAK_DURATION=5m`) with stable metrics
- [ ] No high-cardinality tags that could exhaust k6 memory
- [ ] Periodic console logging for progress visibility during long runs
- [ ] Tags are bounded (finite set of intervals, not per-request unique values)
- [ ] Ready for Reviewer
