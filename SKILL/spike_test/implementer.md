# Spike Test Implementer - Write & Execute

**Implement spike tests based on the planner's output.**

---

## Script Structure

Every k6 spike test script follows this structure:

```javascript
// Author Name, ID
// [Spike Test] Script Title
// Description of what endpoints are tested under sudden surge

import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

const BASE_URL = __ENV.BASE_URL || "http://localhost:<port>";

// 1. Phase-tagged custom metrics (baseline / spike / recovery)
// 2. Seed data constants (verified against running API)
// 3. k6 options (spike stages + thresholds)
// 4. Phase detection helper
// 5. default function (test logic with groups, tagged by phase)
// 6. handleSummary (HTML + JSON output)
```

---

## Implementation Patterns

### Pattern 1: Spike VU Profile (Single Spike)

```javascript
export const options = {
  stages: [
    { duration: "30s", target: 10 },   // Phase 1: baseline
    { duration: "10s", target: 500 },   // Phase 2: spike ramp (near-instant)
    { duration: "1m",  target: 500 },   // Phase 3: spike hold
    { duration: "10s", target: 10 },    // Phase 4: spike drop (near-instant)
    { duration: "2m",  target: 10 },    // Phase 5: recovery observation
  ],
  thresholds: {
    // Overall (relaxed -- spike will pull these up)
    "http_req_duration": ["p(95)<3000"],
    "http_req_failed": ["rate<0.15"],

    // Phase-specific (tag-filtered)
    "baseline_duration": ["p(95)<500"],
    "spike_duration": ["p(95)<3000"],
    "recovery_duration": ["p(95)<500"],

    // Recovery error rate must return to near-zero
    "recovery_errors": ["rate<0.01"],
  },
};
```

### Pattern 2: Double Spike VU Profile

```javascript
export const options = {
  stages: [
    { duration: "30s", target: 10 },   // baseline
    { duration: "10s", target: 500 },   // spike 1 up
    { duration: "1m",  target: 500 },   // spike 1 hold
    { duration: "10s", target: 10 },    // spike 1 down
    { duration: "1m",  target: 10 },    // recovery 1
    { duration: "10s", target: 500 },   // spike 2 up
    { duration: "1m",  target: 500 },   // spike 2 hold
    { duration: "10s", target: 10 },    // spike 2 down
    { duration: "2m",  target: 10 },    // recovery 2 (extended)
  ],
  // ...thresholds as above
};
```

### Pattern 3: Phase Detection Helper

**Tag every request with its current phase for recovery comparison.**

```javascript
const baselineDuration = new Trend("baseline_duration");
const spikeDuration = new Trend("spike_duration");
const recoveryDuration = new Trend("recovery_duration");
const recoveryErrors = new Rate("recovery_errors");
const spikeErrors = new Rate("spike_errors");

const TEST_START = Date.now();

// Adjust these timestamps to match your stages
// Single spike: baseline=0-30s, spike=30-100s, recovery=100-220s
function getPhase() {
  const elapsed = (Date.now() - TEST_START) / 1000;
  if (elapsed < 30) return "baseline";
  if (elapsed < 100) return "spike";  // 30+10+60
  return "recovery";
}

function recordMetrics(res, phase) {
  if (phase === "baseline") {
    baselineDuration.add(res.timings.duration);
  } else if (phase === "spike") {
    spikeDuration.add(res.timings.duration);
    spikeErrors.add(res.status !== 200);
  } else {
    recoveryDuration.add(res.timings.duration);
    recoveryErrors.add(res.status !== 200);
  }
}
```

### Pattern 4: Group per Endpoint with Phase Tagging

```javascript
export default function () {
  const phase = getPhase();

  group("Endpoint Name", function () {
    const res = http.get(`${BASE_URL}/api/v1/resource`, {
      tags: { name: "EndpointName", phase: phase },
    });
    const success = check(res, {
      "status is 200": (r) => r.status === 200,
    });
    errorRate.add(!success);
    recordMetrics(res, phase);
  });

  // Think time varies by phase
  if (phase === "spike") {
    sleep(Math.random() * 0.3);  // minimal think time during spike
  } else {
    sleep(0.5 + Math.random() * 0.5);  // normal pacing
  }
}
```

### Pattern 5: Random Selection from Seed Data

```javascript
const SLUGS = ["item-a", "item-b", "item-c"];
const slug = SLUGS[Math.floor(Math.random() * SLUGS.length)];
const page = Math.floor(Math.random() * 3) + 1;
```

### Pattern 6: POST with JSON Body

```javascript
const res = http.post(
  `${BASE_URL}/api/v1/auth/login`,
  JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  {
    headers: { "Content-Type": "application/json" },
    tags: { name: "Login", phase: phase },
  }
);
```

### Pattern 7: Unique Data per VU (for write endpoints)

```javascript
// __VU = virtual user ID, __ITER = iteration count
const uniqueEmail = `spiketest_vu${__VU}_iter${__ITER}@test.com`;
```

### Pattern 8: Alternating Journeys (Single Scenario)

```javascript
// DON'T: Two k6 scenarios each with 500 VUs = 1000 VUs total
// DO: One scenario, alternate per iteration
export default function () {
  if (__ITER % 2 === 0) {
    journeyA();
  } else {
    journeyB();
  }
}
```

**Why:** k6 `scenarios` run in parallel. Two scenarios each targeting 500 VUs creates 1000 concurrent users, not 500. This is ESPECIALLY dangerous for spike tests where VU count is already extreme.

### Pattern 9: Null-Body Guard (Critical for Spike Tests)

```javascript
// During spikes, the server WILL drop connections. r.body WILL be null.
// r.json() on null body produces hundreds of GoError stack traces.
check(res, {
  "body valid": (r) => {
    if (!r.body) return false;  // ALWAYS add this guard
    const body = r.json();
    return body && body.expectedField;
  },
});
```

**In spike tests, null bodies are far more common than in load tests.** Every `r.json()` call MUST be guarded. This is not optional.

### Pattern 10: handleSummary for Reports

```javascript
export function handleSummary(data) {
  return {
    "results/spike-script-name-report.html": htmlReport(data),
    "results/spike-script-name-results.json": JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
```

### Pattern 11: Recovery Canary Endpoint

**Pick one lightweight endpoint as a "canary" -- if this doesn't recover, nothing will.**

```javascript
group("Recovery Canary", function () {
  const res = http.get(`${BASE_URL}/api/v1/health-or-lightweight-endpoint`, {
    tags: { name: "RecoveryCanary", phase: phase },
    timeout: "5s",
  });
  recordMetrics(res, phase);
});
```

Track the canary's p95 separately. If the canary doesn't return to baseline within 60s of spike ending, the system has a systemic recovery problem.

---

## Execution Workflow

### Step 1: Verify Baseline (Always First)

```bash
# Smoke test at 1 VU -- script must work before spike
k6 run tests/nft/spike-script-name.js --duration 10s --vus 1
```
**Expect:** 100% checks, 0 errors. If this fails, the script has a bug -- fix before spike run.

### Step 2: Baseline Measurement (Quick Load Test)

```bash
# Run at baseline VUs to establish reference numbers
k6 run tests/nft/spike-script-name.js --duration 30s --vus 10
```
**Record:** p95 latency, error rate, throughput. These are recovery targets.

### Step 3: Full Spike Run

```bash
k6 run tests/nft/spike-script-name.js
```

**Monitor during the run:**
- Watch VU count climb during spike phase
- Watch for `connection refused` errors (server crash)
- Watch for p95 climbing during spike (expected) then dropping during recovery (required)

### Step 4: Full Run with Dashboard (Recommended)

```bash
K6_WEB_DASHBOARD=true k6 run tests/nft/spike-script-name.js
# Opens live dashboard at http://localhost:5665
```

The live dashboard is especially valuable for spike tests because you can visually see the spike and recovery phases in real time.

### Step 5: Verify Artifacts

```bash
ls results/
# spike-script-name-report.html  <- open in browser
# spike-script-name-results.json <- raw data for recovery analysis
```

### Step 6: Analyze Recovery (Post-Run)

After the run, examine the JSON results:
- Compare `baseline_duration` p95 vs `recovery_duration` p95
- If `recovery_duration` p95 is more than 2x `baseline_duration` p95, recovery is incomplete
- Check `recovery_errors` rate -- must be near 0%

**Run one script at a time** -- running multiple k6 tests simultaneously skews results, especially for spike tests.

---

## Common Pitfalls & Fixes

### Pitfall 1: Server Crashes and Doesn't Restart

**Symptom:** `connection refused` for the entire recovery phase.
**Cause:** The spike killed the server process (OOM, uncaught exception, process manager not configured).
**Fix:** This IS a valid finding -- document it. Then restart the server and re-run at a lower spike VU to find the exact crash threshold. Check if the server has a process manager (PM2, systemd) that should auto-restart.

### Pitfall 2: Connection Pool Exhaustion

**Symptom:** During spike, requests start timing out. After spike ends, timeouts CONTINUE for 30-60s as the pool drains.
**Cause:** Database connection pool is too small for spike VUs. Connections are checked out but not returned fast enough.
**Fix:** This is a valid finding. Track it via phase-tagged metrics. The connection pool size is a configuration finding, not a test bug. Document the pool drain time.

### Pitfall 3: Recovery Oscillation

**Symptom:** After spike ends, p95 bounces between normal (200ms) and degraded (2000ms) every 5-10 seconds.
**Cause:** Server is partially recovered -- some requests hit warm cache/connections, others hit cold paths. Or health checks are causing periodic load.
**Fix:** Extend recovery observation to 3-5 minutes. Track per-10s windows. Document the oscillation pattern -- it may indicate cache invalidation issues.

### Pitfall 4: k6 Machine Itself Bottlenecking

**Symptom:** CPU at 100% on the machine running k6. Reported latencies are higher than actual server latency.
**Cause:** 500 VUs generating requests as fast as possible overwhelms the test runner.
**Fix:** Add minimal think time (0.1s) even during spike. Reduce VU count. Use `--out` to reduce reporting overhead. Consider distributed k6 execution for very high VU counts.

### Pitfall 5: Null Body Stack Traces

**Symptom:** Hundreds of `GoError: the body is null so we can't transform it to JSON`.
**Cause:** Server dropped connections under spike load. Response bodies are null.
**Fix:** Add `if (!r.body) return false;` before every `r.json()` call. The null bodies during spike are EXPECTED -- the stack traces are just noise from missing guards.

### Pitfall 6: Phase Timestamps Drifting

**Symptom:** Phase-tagged metrics don't align with actual VU stages.
**Cause:** `Date.now()` at script start vs k6 actual stage transitions can drift by a few seconds.
**Fix:** Add 5-10s buffer to phase boundaries. Better to slightly misclassify a few requests than to miss the phase transition entirely.

### Pitfall 7: Parallel Scenarios Doubling Spike VUs

**Symptom:** k6 shows `max=1000` VUs when you expected 500.
**Cause:** Two k6 `scenarios` run simultaneously, each with `target: 500`.
**Fix:** Use one default function with `__ITER % 2` alternation. For spike tests, doubling VUs is especially dangerous -- it can crash the test machine, not just the server.

### Pitfall 8: Second Spike Worse Than First (Double-Spike)

**Symptom:** Recovery from spike 2 takes 2-3x longer than recovery from spike 1.
**Cause:** System never fully recovered between spikes -- connection pool partially drained, memory fragmented, caches invalidated.
**Fix:** This IS a valid finding. Document the cumulative degradation. Consider increasing recovery time between spikes to find the minimum recovery window.

### Pitfall 9: Seed Data Mismatch

**Symptom:** 100% check failures at 1 VU, endpoint returns 404.
**Cause:** Hardcoded slugs/IDs don't exist in the database.
**Fix:** Verify against the running API:
```bash
curl -s http://localhost:<port>/api/v1/resource/slug-name
# Must return 200, not 404
```

### Pitfall 10: Socket/File Descriptor Limits

**Symptom:** `EMFILE: too many open files` or `ENOMEM` during spike phase.
**Cause:** OS-level limits on open file descriptors hit by 500 concurrent connections.
**Fix:** Check and increase limits:
```bash
ulimit -n        # current limit
ulimit -n 65536  # increase for test session
```

---

## Implementation Checklist

- [ ] Every script has author name/ID comment header
- [ ] `BASE_URL` uses `__ENV.BASE_URL` with localhost fallback
- [ ] Spike VU profile uses near-instant ramp (10s or less)
- [ ] Phase detection helper implemented (baseline / spike / recovery)
- [ ] Every endpoint has its own `group()` block
- [ ] Every request tagged with `{ phase: phase }` for phase-filtered metrics
- [ ] Phase-tagged custom Trends: `baseline_duration`, `spike_duration`, `recovery_duration`
- [ ] Phase-tagged error rates: `spike_errors`, `recovery_errors`
- [ ] All JSON body checks have `if (!r.body) return false` guard
- [ ] Think time varies by phase (minimal during spike, normal during baseline/recovery)
- [ ] Seed data constants verified against running API
- [ ] `handleSummary()` outputs HTML + JSON to `results/`
- [ ] `results/` directory exists
- [ ] Smoke test passed (`--duration 10s --vus 1`) with 100% checks
- [ ] Baseline measurement recorded (10 VUs, 30s)
- [ ] No parallel scenarios unintentionally doubling VU count
- [ ] Recovery canary endpoint identified and tracked
- [ ] Ready for Reviewer
