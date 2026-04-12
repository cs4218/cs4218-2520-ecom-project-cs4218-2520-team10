# Stress Test Implementer - Write & Execute

**Implement stress tests based on the planner's output. Goal: find the breaking point.**

---

## Script Structure

Every k6 stress test script follows this structure:

```javascript
// Author Name, ID
// [Stress Test] Script Title
// Target bottleneck: [CPU / DB / Mixed / Writes]
// Expected failure mode: [what should break first]

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:<port>";

// 1. Per-stage custom metrics (Rate + Trend per VU stage)
// 2. Per-endpoint custom metrics (Trend per endpoint)
// 3. Seed data constants (verified against running API)
// 4. Stage boundary helpers
// 5. k6 options (stepped stages + relaxed thresholds)
// 6. default function (test logic with stage-aware metric tracking)
// 7. handleSummary (HTML + JSON output)
```

---

## Implementation Patterns

### Pattern 1: Stepped Escalation Stages

```javascript
export const options = {
  stages: [
    { duration: "1m",    target: 50  },  // Stage 1: ramp to baseline
    { duration: "1m30s", target: 50  },  // Stage 1: hold
    { duration: "30s",   target: 100 },  // Stage 2: ramp to normal
    { duration: "1m30s", target: 100 },  // Stage 2: hold
    { duration: "30s",   target: 200 },  // Stage 3: ramp above normal
    { duration: "1m30s", target: 200 },  // Stage 3: hold
    { duration: "30s",   target: 300 },  // Stage 4: ramp to stress
    { duration: "1m30s", target: 300 },  // Stage 4: hold
    { duration: "30s",   target: 400 },  // Stage 5: ramp to breaking point
    { duration: "1m30s", target: 400 },  // Stage 5: hold
    { duration: "1m",    target: 0   },  // Recovery: ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],  // Relaxed: 2s overall
    http_req_failed: ["rate<0.15"],     // Relaxed: 15% error rate
  },
};
```

**Adjust VU numbers to your system.** A small local server might break at 50 VUs. Scale down all stages proportionally if needed (e.g., 10/20/40/60/80 for small systems).

### Pattern 2: Per-Stage Metric Tracking

```javascript
// Define per-stage metrics
const errorsStage1 = new Rate("errors_stage1_50vu");
const errorsStage2 = new Rate("errors_stage2_100vu");
const errorsStage3 = new Rate("errors_stage3_200vu");
const errorsStage4 = new Rate("errors_stage4_300vu");
const errorsStage5 = new Rate("errors_stage5_400vu");
const errorsRecovery = new Rate("errors_recovery");

const latencyStage1 = new Trend("latency_stage1_50vu");
const latencyStage2 = new Trend("latency_stage2_100vu");
const latencyStage3 = new Trend("latency_stage3_200vu");
const latencyStage4 = new Trend("latency_stage4_300vu");
const latencyStage5 = new Trend("latency_stage5_400vu");
const latencyRecovery = new Trend("latency_recovery");

// Stage boundary timestamps (cumulative seconds)
// Ramp + hold durations: 1m+1.5m, 0.5m+1.5m, 0.5m+1.5m, 0.5m+1.5m, 0.5m+1.5m, 1m
const STAGE_BOUNDARIES = [0, 150, 270, 390, 510, 630, 690]; // seconds

function getCurrentStage() {
  // k6 provides __ITER but not elapsed time directly.
  // Use Date.now() relative to a start timestamp.
  const elapsed = (Date.now() - startTime) / 1000;
  if (elapsed < STAGE_BOUNDARIES[1]) return 1;
  if (elapsed < STAGE_BOUNDARIES[2]) return 2;
  if (elapsed < STAGE_BOUNDARIES[3]) return 3;
  if (elapsed < STAGE_BOUNDARIES[4]) return 4;
  if (elapsed < STAGE_BOUNDARIES[5]) return 5;
  return 6; // recovery
}

// Initialize start time (runs once per VU)
const startTime = Date.now();

function trackStageMetrics(stage, success, duration) {
  const errorRates = [null, errorsStage1, errorsStage2, errorsStage3, errorsStage4, errorsStage5, errorsRecovery];
  const latencies = [null, latencyStage1, latencyStage2, latencyStage3, latencyStage4, latencyStage5, latencyRecovery];
  if (errorRates[stage]) errorRates[stage].add(!success);
  if (latencies[stage]) latencies[stage].add(duration);
}
```

### Pattern 3: Group per Endpoint with Stage Tracking

```javascript
export default function () {
  const stage = getCurrentStage();

  group("Endpoint Name", function () {
    const res = http.get(`${BASE_URL}/api/v1/resource`, {
      tags: { name: "EndpointName" },
      timeout: "10s",  // Prevent infinite hangs under stress
    });
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
      "body valid": (r) => {
        if (!r.body) return false;
        const body = r.json();
        return body && body.expectedField;
      },
    });
    endpointTrend.add(res.timings.duration);
    trackStageMetrics(stage, success, res.timings.duration);
  });
  sleep(0.3);  // Minimal think time for stress
}
```

### Pattern 4: POST with JSON Body

```javascript
const res = http.post(
  `${BASE_URL}/api/v1/auth/login`,
  JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  {
    headers: { "Content-Type": "application/json" },
    tags: { name: "Login" },
    timeout: "10s",
  }
);
```

### Pattern 5: Unique Data per VU (for Write Endpoints)

```javascript
// __VU = virtual user ID, __ITER = iteration count
const uniqueEmail = `stresstest_vu${__VU}_iter${__ITER}@test.com`;
```

### Pattern 6: Alternating Journeys (Single Scenario)

```javascript
// DON'T: Two k6 scenarios each with 200 VUs = 400 VUs total
// DO: One scenario, alternate per iteration
export default function () {
  if (__ITER % 2 === 0) {
    cpuBoundJourney();
  } else {
    dbBoundJourney();
  }
}
```

**Why:** k6 `scenarios` run in parallel. Two scenarios each targeting 200 VUs creates 400 concurrent users, not 200. Use alternation within a single default function to keep VU count accurate.

### Pattern 7: Null-Body Guard (REQUIRED for Stress Tests)

```javascript
// When server crashes under stress, r.body is null.
// r.json() on null body produces hundreds of GoError stack traces.
// This WILL happen in stress tests — it's the expected outcome.
check(res, {
  "body valid": (r) => {
    if (!r.body) return false;  // ALWAYS add this guard
    const body = r.json();
    return body && body.token;
  },
});
```

### Pattern 8: Request Timeout (Critical for Stress Tests)

```javascript
// Under stress, requests can hang indefinitely. Always set a timeout.
const res = http.get(`${BASE_URL}/api/v1/resource`, {
  timeout: "10s",  // Fail fast rather than hang for 60s
  tags: { name: "ResourceGet" },
});
```

**Why:** Without timeouts, a single hanging request blocks the VU for 60s (k6 default), which skews your iteration count and makes per-stage metrics unreliable.

### Pattern 9: handleSummary for Reports

```javascript
export function handleSummary(data) {
  return {
    "results/stress-script-name-report.html": htmlReport(data),
    "results/stress-script-name-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
```

### Pattern 10: Recovery Measurement

```javascript
// Track a dedicated recovery trend
const recoveryTrend = new Trend("recovery_latency");
const recoveryErrors = new Rate("recovery_error_rate");

// In default function, during recovery stage:
if (stage === 6) {
  recoveryTrend.add(res.timings.duration);
  recoveryErrors.add(!success);
}
// Compare recovery_latency p95 to latency_stage1_50vu p95 in the report
// If recovery p95 ~= stage 1 p95, system recovered fully
```

---

## Execution Workflow

### Step 1: Smoke Test (Always First)

```bash
k6 run tests/nft/stress-script-name.js --duration 10s --vus 1
```
**Expect:** 100% checks, 0 errors. If this fails, the script has a bug — fix before full run.

### Step 2: Mini Stress Test (Validate Escalation)

```bash
k6 run tests/nft/stress-script-name.js --stage 10s:10,10s:10,10s:20,10s:20,10s:0
```
**Purpose:** Verify the script handles VU changes without errors. Check that per-stage metrics appear in the output.

### Step 3: Full Stress Run

```bash
k6 run tests/nft/stress-script-name.js
```
**This takes ~12 minutes per script.** Run one at a time.

### Step 4: Full Run with Dashboard (Recommended for Stress)

```bash
K6_WEB_DASHBOARD=true k6 run tests/nft/stress-script-name.js
# Opens live dashboard at http://localhost:5665
```
**The live dashboard is especially valuable for stress tests** — you can watch latency degrade in real time and see exactly when the system starts failing.

### Step 5: Verify Artifacts

```bash
ls results/
# stress-script-name-report.html  <- open in browser
# stress-script-name-results.json <- raw data for per-stage analysis
```

### Step 6: Monitor the Server (In Parallel)

**While the stress test runs, monitor the server process:**
```bash
# In a separate terminal — watch for crashes
# Node.js:
watch -n 1 "ps aux | grep node | grep -v grep"

# Check memory usage:
watch -n 5 "ps -o pid,rss,vsz,comm -p <server-pid>"

# Watch server logs for errors:
tail -f server.log
```

**Document any server crashes** — the VU count when the server dies IS the breaking point.

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

### Pitfall 2: Server Not Connected to DB

**Symptom:** All requests timeout at 10s, `connection refused` from the start.
**Cause:** Server started but database connection string is wrong or DB is not running.
**Fix:** Check server logs for "Connected to database" message. Verify DB is running.

### Pitfall 3: Null Body Stack Traces

**Symptom:** Hundreds of `GoError: the body is null so we can't transform it to JSON`.
**Cause:** Server crashed under stress, responses have null bodies.
**Fix:** Add `if (!r.body) return false;` before every `r.json()` call. The server crashing is a valid finding — the stack traces are just noise.

### Pitfall 4: Parallel Scenarios Doubling VUs

**Symptom:** k6 shows `max=800` VUs when you expected 400.
**Cause:** Two k6 `scenarios` run simultaneously, each with the full stage profile.
**Fix:** Use one default function with `__ITER % N` alternation, or split VU targets across scenarios.

### Pitfall 5: Server Crashes and Doesn't Restart

**Symptom:** Connection refused errors from a specific point onward, never recovers.
**Cause:** Server process died (OOM, unhandled exception, segfault).
**Fix:** This IS the finding. Document the VU count when it crashed. For recovery measurement, you need the server to stay up — reduce peak VUs or add a process manager (pm2, systemd) that auto-restarts.

### Pitfall 6: Connection Pool Exhaustion

**Symptom:** Requests succeed at 100 VUs, then ALL endpoints start timing out at 200 VUs simultaneously.
**Cause:** Database connection pool is full. New queries wait in queue and timeout.
**Fix:** This IS the finding. Document the VU count where pool exhaustion occurs. The pool size (often 5-10 connections by default) is the bottleneck.

### Pitfall 7: bcrypt/Hashing CPU Saturation

**Symptom:** Login endpoint p95 goes from 200ms at 50 VUs to 8000ms at 200 VUs, while non-auth endpoints remain fast.
**Cause:** bcrypt is CPU-bound and blocks the event loop (Node.js) or saturates worker threads.
**Fix:** This IS the finding. Document the VU count where auth endpoints become unusable. The ratio of auth VU count to thread/core count determines the ceiling.

### Pitfall 8: k6 Machine Running Out of Resources

**Symptom:** k6 output shows warnings about dropped iterations, or k6 itself becomes unresponsive.
**Cause:** The machine running k6 doesn't have enough CPU/RAM for 400 VUs.
**Fix:** Reduce peak VUs, or run k6 on a separate machine from the server under test.

### Pitfall 9: OS Socket/File Descriptor Limits

**Symptom:** `EMFILE` or `ECONNRESET` errors starting at a specific VU count.
**Cause:** OS limit on open file descriptors (default 256-1024 on macOS/Linux).
**Fix:** Increase limits before testing:
```bash
ulimit -n 10240  # Increase open file limit for current session
```

### Pitfall 10: No Recovery After Ramp-Down

**Symptom:** Error rate stays high even after VUs drop to 0.
**Cause:** Server is in a broken state (leaked connections, exhausted memory, corrupted state).
**Fix:** This IS the finding — the system doesn't recover gracefully. Document it.

---

## Implementation Checklist

- [ ] Every script has author name/ID comment header
- [ ] Every script header states the target bottleneck and expected failure mode
- [ ] `BASE_URL` uses `__ENV.BASE_URL` with localhost fallback
- [ ] Stepped escalation stages implemented (5 stages + recovery)
- [ ] Per-stage Rate and Trend metrics defined and tracked
- [ ] Relaxed thresholds set (p95 < 2s, errors < 15%)
- [ ] Every endpoint has its own `group()` block
- [ ] Every endpoint has its own custom `Trend` metric
- [ ] Every endpoint tagged with `{ tags: { name: "..." } }`
- [ ] All JSON body checks have `if (!r.body) return false` guard
- [ ] All requests have `timeout: "10s"` to prevent hangs
- [ ] Seed data constants verified against running API
- [ ] `handleSummary()` outputs HTML + JSON to `results/`
- [ ] `results/` directory exists
- [ ] Smoke test passed (`--duration 10s --vus 1`) with 100% checks
- [ ] Mini stress test passed (short stages, verify escalation works)
- [ ] No parallel scenarios unintentionally doubling VU count
- [ ] Minimal think time between requests (0.1-0.5s)
- [ ] Server monitoring plan in place (watch for crashes during full run)
- [ ] Ready for Reviewer
