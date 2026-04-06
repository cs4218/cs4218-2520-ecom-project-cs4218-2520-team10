# Stress Test Planner - Find the Breaking Point

**Analyze -> Plan -> Implement** (No code written in this phase!)

**Goal:** Escalate load until the system FAILS. Find the exact VU count where latency degrades, errors appear, and the system crashes.

---

## OPTIONAL Phase 0: Check Memory (Cross-Module Learning)

**Skip if first time. Check `_memory/` if prior tests were run.**

- [ ] Read `_memory/patterns.md` — Endpoint categories, threshold baselines, seed data patterns
- [ ] Read `_memory/[prior-module].md` — What response shapes looked like, what broke, known breaking points

**Optional.** Proceed to Phase 1 even if no memories exist.

---

## Phase 1: Understand the System Under Test

Before writing ANY test code, understand what you're testing.

### 1.1 Identify API Endpoints

**Read route files** (e.g., `routes/*.js`, `src/routes/**`) and catalogue every endpoint:

- [ ] List all routes with method (GET/POST/PUT/DELETE) and path
- [ ] Group by domain (auth, products, categories, orders, etc.)
- [ ] Note which require authentication
- [ ] Note which accept request bodies

### 1.2 Classify Endpoint Stress Vulnerability

**For each endpoint, classify by expected failure mode under extreme load:**

| Category | Failure Mode | Examples |
|----------|-------------|----------|
| **CPU-bound** | Thread/process starvation, event loop blocking | Login with bcrypt, password hashing, encryption |
| **DB-intensive** | Connection pool exhaustion, query timeouts, lock contention | Regex search, filtered listings, aggregations |
| **High-frequency** | Memory exhaustion, GC pauses, socket exhaustion | Get all categories, get session, health checks |
| **I/O-bound** | File descriptor exhaustion, buffer overflow | Image endpoints, file uploads/downloads |
| **Write-heavy** | Write lock contention, journal overflow, replication lag | Create order, register user, update inventory |

**Why this matters for stress testing:** CPU-bound endpoints will bottleneck first on single-threaded runtimes (Node.js). DB-intensive endpoints will exhaust connection pools. Write-heavy endpoints will cause lock contention. Knowing the failure mode tells you where to expect the first break.

### 1.3 Identify Test Data Requirements

**Critical: Your tests will fail if seed data doesn't match the database.**

- [ ] What entities exist in the test database? (products, users, categories, etc.)
- [ ] What are their identifiers? (slugs, IDs, emails)
- [ ] What test credentials exist? (test user email/password)
- [ ] How to verify? Call the API and check actual response

**Always verify against the running API, not just seed files:**
```bash
# Check what actually exists in the DB
curl -s http://localhost:<port>/api/v1/<resource> | head -c 500
```

**Common pitfall:** Seed JSON files have different data than what's in the database. Hardcoding from seed files without checking causes 100% failures.

### 1.4 Verify Response Shapes

**Before writing checks, confirm the actual response structure:**
```bash
# Is it { products: [...] } or just [...] ?
curl -s http://localhost:<port>/api/v1/<endpoint> | python3 -c "import sys,json; print(list(json.load(sys.stdin).keys()))"
```

### 1.5 Baseline Performance (Stress-Specific)

**Before breaking things, know what "normal" looks like:**

- [ ] What is the p95 latency at 1 VU? (baseline)
- [ ] What is the p95 latency at the load test target? (normal operating range)
- [ ] What is the error rate at normal load? (should be ~0%)

**If you ran load tests already**, use those results as your baseline. The stress test will push beyond that baseline to find the ceiling.

---

## Phase 2: Design Stress Test Scripts

### 2.1 Organize by Stress Target, Not by Endpoint

**Stress tests should target specific system bottlenecks:**

| Script Theme | What It Breaks | Typical Endpoints |
|-------------|---------------|-------------------|
| **CPU saturation** | Event loop / thread pool under hashing load | Login, register, password reset |
| **DB connection exhaustion** | Connection pool under query flood | Search, filter, paginated lists, detail views |
| **Mixed escalation** | Overall system capacity under realistic traffic | Weighted mix of all endpoint types |
| **Write storm** | Write locks, journal, replication | Create/update/delete operations |
| **Session & auth flood** | Auth middleware, token validation, session store | Any authenticated endpoint chain |

**Target: 3-5 scripts, each focused on a different bottleneck.**

### 2.2 Design Stepped Escalation VU Profile

**Stress testing uses STEPPED ESCALATION — increase VUs in stages and observe each level before pushing higher.**

```
Stage 1:  0 -> 50 VUs   (1 min ramp, 1.5 min hold)  — Baseline
Stage 2: 50 -> 100 VUs  (30s ramp, 1.5 min hold)    — Normal load
Stage 3: 100 -> 200 VUs (30s ramp, 1.5 min hold)    — Above normal
Stage 4: 200 -> 300 VUs (30s ramp, 1.5 min hold)    — Stress zone
Stage 5: 300 -> 400 VUs (30s ramp, 1.5 min hold)    — Breaking point
Recovery: 400 -> 0 VUs  (1 min ramp down)            — Recovery measurement
Total: ~12 minutes
```

**k6 stages equivalent:**
```javascript
stages: [
  { duration: "1m",  target: 50  },  // Stage 1: ramp to baseline
  { duration: "1m30s", target: 50  },  // Stage 1: hold
  { duration: "30s", target: 100 },  // Stage 2: ramp to normal
  { duration: "1m30s", target: 100 },  // Stage 2: hold
  { duration: "30s", target: 200 },  // Stage 3: ramp to above normal
  { duration: "1m30s", target: 200 },  // Stage 3: hold
  { duration: "30s", target: 300 },  // Stage 4: ramp to stress
  { duration: "1m30s", target: 300 },  // Stage 4: hold
  { duration: "30s", target: 400 },  // Stage 5: ramp to breaking point
  { duration: "1m30s", target: 400 },  // Stage 5: hold
  { duration: "1m",  target: 0   },  // Recovery: ramp down
],
```

**Adjust the VU numbers based on your system.** A small local dev server might break at 50 VUs. A production cluster might handle 1000+. Start conservative and increase if the system doesn't break.

### 2.3 Set Relaxed Thresholds (We EXPECT Degradation)

**Stress test thresholds are deliberately relaxed — the goal is to find the breaking point, not to pass/fail.**

| Metric | Stress Threshold | Rationale |
|--------|-----------------|-----------|
| p95 latency (overall) | < 2000ms | We expect degradation; 2s is "still functioning" |
| p95 latency (CPU-bound) | < 3000ms | Hashing endpoints degrade first |
| Error rate (overall) | < 15% | Some errors expected at peak; >15% = system is down |
| Error rate (per stage) | Tracked, not thresholded | Used to identify the exact breaking stage |

**Key insight:** Stress test thresholds exist to detect total failure (server down), not to enforce performance targets. The real value is in the per-stage metrics.

### 2.4 Plan Breaking Point Detection

**Track metrics PER STAGE so you can report "system breaks at X VUs":**

```javascript
// Custom Rate metric per VU stage
import { Rate, Trend, Counter } from "k6/metrics";

const errorRateStage1 = new Rate("errors_stage_1_50vu");
const errorRateStage2 = new Rate("errors_stage_2_100vu");
const errorRateStage3 = new Rate("errors_stage_3_200vu");
const errorRateStage4 = new Rate("errors_stage_4_300vu");
const errorRateStage5 = new Rate("errors_stage_5_400vu");

// In default function, determine current stage from VU count:
const vuCount = __VU;
// Or use exec.instance.iterationsCompleted with timestamps
```

**Alternative: Use k6 scenarios with shared-iterations executor per stage** for cleaner stage separation. But stepped stages in a single scenario are simpler to implement.

### 2.5 Plan Think Time (Minimal)

**Stress tests use minimal think time — the goal is maximum pressure:**

| Scenario | Think Time | Why |
|----------|-----------|-----|
| CPU saturation | 0-0.3s | Maximum hashing throughput |
| DB exhaustion | 0.1-0.3s | Flood the connection pool |
| Mixed escalation | 0.3-0.5s | Semi-realistic but intense |
| Recovery phase | 1s | Give the system time to recover |

---

## Phase 3: Plan Verification Strategy

### 3.1 Three Layers of Verification

**Layer 1: Relaxed Thresholds** — Detect total failure, not performance targets.
```
"http_req_duration": ["p(95)<2000"]
"http_req_failed": ["rate<0.15"]
```

**Layer 2: Checks** — Per-request validation (with null-body guards).
```
check(res, {
  "status is 200": (r) => r.status === 200,
  "body valid": (r) => {
    if (!r.body) return false;
    const body = r.json();
    return body && body.expectedField;
  },
});
```

**Layer 3: Per-Stage Custom Metrics** — The most valuable data in a stress test.
```
const stageXTrend = new Trend("latency_stage_X_NNvu");
const stageXErrors = new Rate("errors_stage_X_NNvu");
```

### 3.2 Null-Body Guards (Critical for Stress Tests)

**Stress tests are MORE likely to crash the server than load tests.** When the server crashes, response bodies are null. Calling `.json()` on a null body produces hundreds of `GoError` stack traces in k6.

**EVERY `r.json()` call MUST have a null-body guard:**
```javascript
"body valid": (r) => {
  if (!r.body) return false;  // Server crashed — this IS the finding
  const body = r.json();
  return body && body.token;
},
```

### 3.3 Plan Recovery Measurement

**After peak load, measure how quickly the system recovers:**

- [ ] Track response time during the ramp-down phase
- [ ] Track error rate during the ramp-down phase
- [ ] Compare ramp-down metrics to Stage 1 baseline
- [ ] Report: "System recovered to baseline within X seconds after peak"

### 3.4 Plan Reporting

Every script needs `handleSummary()` for evidence artifacts:
- HTML report (visual, for report/submission)
- JSON results (raw data, for per-stage analysis)
- Terminal summary (for quick pass/fail)

---

## Phase 4: Identify Risks and Gotchas

### Stress-Specific Gotchas

| Risk | Detection | Mitigation |
|------|-----------|------------|
| Server crashes and doesn't restart | Connection refused after crash point | Monitor server process; document crash VU count as a finding |
| Connection pool exhaustion | Sudden spike in timeouts at a specific VU level | Track timeout count per stage; this IS the breaking point |
| bcrypt/argon2 CPU saturation | Auth endpoints degrade exponentially while others are fine | Separate CPU-bound scripts from DB scripts for clear attribution |
| OS socket/file descriptor limits | `EMFILE` or `ECONNRESET` errors | Check `ulimit -n` before testing; increase if needed |
| k6 itself runs out of resources | k6 process crashes or hangs | Run on a machine with enough CPU/RAM; k6 at 400 VUs needs resources too |
| Database locks cause cascading failures | All endpoints slow down simultaneously, not just write endpoints | This is a valid finding — document it |
| Register endpoint filling the database | Thousands of test users created during stress | Use unique emails with `__VU` + `__ITER`; clean up after test |
| Server OOM kill | Process disappears, no error response | Check `dmesg` or system logs for OOM kill events |

### Common Gotchas (Same as Load Testing)

| Risk | Detection | Mitigation |
|------|-----------|------------|
| Seed data doesn't match DB | 100% check failures at 1 VU | Verify via curl before writing scripts |
| Parallel scenarios doubling VUs | 100 VUs when you expected 50 | Use single scenario with alternation |
| Binary endpoints hanging | 60s timeouts | Add `timeout: "5s"` or skip if no data |
| Interrupted test results | Extreme latencies, connection refused mid-test | Re-run; don't use results from interrupted runs |

---

## Summary Output Format

When planning is complete, document:

```
SYSTEM UNDER TEST
=================
Base URL: [e.g., http://localhost:6060]
API prefix: [e.g., /api/v1]
Total endpoints: [count]
Baseline p95: [from load test results or 1-VU smoke test]

TEST DATA
=========
Known entities: [slugs, IDs, emails verified against running API]
Test credentials: [email/password]
Seed script: [path if exists]

STRESS TEST SCRIPTS
====================
Script 1: [bottleneck target] -> [endpoints] -> [expected failure mode]
Script 2: [bottleneck target] -> [endpoints] -> [expected failure mode]
...

VU ESCALATION PROFILE
=====================
Stage 1: 50 VUs  (baseline)
Stage 2: 100 VUs (normal)
Stage 3: 200 VUs (above normal)
Stage 4: 300 VUs (stress)
Stage 5: 400 VUs (breaking point)
Recovery: 0 VUs  (ramp down)
Total duration: ~12 min

THRESHOLDS (RELAXED)
====================
p95 overall: < 2000ms
p95 CPU-bound: < 3000ms
Error rate: < 15%

BREAKING POINT DETECTION
========================
Per-stage Rate metrics: errors_stage_N_XXvu
Per-stage Trend metrics: latency_stage_N_XXvu

RECOVERY PLAN
=============
Measure: latency and error rate during ramp-down
Compare to: Stage 1 baseline
Report: recovery time in seconds

RISKS
=====
[List identified risks and mitigations]

TOTAL SCENARIOS: [count]
READY FOR IMPLEMENTER
```

---

## Planning Checklist

- [ ] All route files read, endpoints catalogued and classified by failure mode
- [ ] Test data verified against running API (not just seed files)
- [ ] Response shapes confirmed via curl
- [ ] Baseline performance known (from load tests or 1-VU smoke test)
- [ ] Scripts organized by bottleneck target (CPU, DB, mixed, writes)
- [ ] Stepped escalation VU profile designed with hold periods
- [ ] Relaxed thresholds set (p95 < 2s, errors < 15%)
- [ ] Per-stage custom metrics planned for breaking point detection
- [ ] Recovery measurement planned
- [ ] Null-body guards planned (critical for stress tests)
- [ ] Reporting (HTML + JSON) planned
- [ ] Stress-specific risks identified (crashes, OOM, connection pool, socket limits)
- [ ] Ready for implementer handoff
