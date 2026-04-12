# Soak Test Planner - Endurance Test Design

**Analyze -> Plan -> Implement** (No code written in this phase!)

---

## OPTIONAL Phase 0: Check Memory (Cross-Module Learning)

**Skip if first time. Check `_memory/` if prior tests were run.**

- [ ] Read `_memory/patterns.md` -- Endpoint categories, threshold baselines, seed data patterns
- [ ] Read `_memory/[prior-module].md` -- What response shapes looked like, what broke

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

### 1.2 Classify Endpoints for Soak Relevance

**For soak testing, focus on endpoints most likely to degrade over time:**

| Category | Why It Degrades Over Time | Examples |
|----------|--------------------------|----------|
| **Stateful** | Session tables grow, connection pools fill | Login, session check, token refresh |
| **Write-accumulating** | Dataset grows during test, slowing reads | Register, create resource, submit form |
| **DB-intensive reads** | Table scans slow as data grows, query plans change | Full-text search, filtered listings, paginated results |
| **Cache-dependent** | Cache eviction under sustained load, memory pressure | Frequently-accessed listings, category trees |
| **Connection-holding** | Long-lived connections exhaust pools | Authenticated sequences, multi-step flows |
| **High-frequency** | Cumulative effect on GC, logging, connection churn | Get session, get categories, health check |

**Priority for soak tests:** Stateful + write-accumulating + DB-intensive. These are the endpoints where degradation is most likely to appear over hours.

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

### 1.5 Estimate Data Growth Impact

**Unique to soak testing:** If write endpoints are included, calculate expected data growth:

```
Writes per iteration: N
Iterations per second (at target VUs): ~M
Test duration: H hours

Total new records = N * M * H * 3600

Example: 1 register per 10 iterations, 30 VUs, 2 iterations/sec per VU
= 0.1 * 60 * 2 * 3600 = 43,200 new users over 2 hours
```

**Ask:** Will the database handle this growth? Will read performance degrade as tables grow? This is exactly what soak testing is designed to detect.

---

## Phase 2: Design Soak Test Scripts

### 2.1 Organize by Degradation Hypothesis

**Don't just run load tests longer. Design around what you expect to degrade:**

| Script Theme | Degradation Hypothesis | Typical Endpoints |
|-------------|------------------------|-------------------|
| **Steady read baseline** | Latency should remain flat if no leaks | List, get detail, get count, categories |
| **Write accumulation** | Reads slow as writes accumulate over hours | Register + search, create + list |
| **Auth session churn** | Connection/session pool exhaustion over time | Login + session check + logout, repeated |
| **Mixed sustained traffic** | Production-like: do reads + writes drift? | 80% reads / 20% writes, realistic pacing |
| **Single endpoint endurance** | Isolate one suspect endpoint for hours | The endpoint with highest p95 from load test |

**Target: 2-4 scripts. Soak tests are long -- fewer scripts, deeper analysis.**

### 2.2 Design VU Profile

**Soak testing uses MODERATE, STEADY load for LONG duration.**

The goal is NOT to stress the system. The goal is to hold a comfortable load and watch for creeping degradation.

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Ramp up** | 2 minutes | Gradual start, don't shock the system |
| **Hold** | 1-4 hours | Long enough for leaks/drift to manifest |
| **Ramp down** | 2 minutes | Graceful end |
| **Target VUs** | 30 | Moderate -- well below breaking point |
| **Total duration** | Controlled by `SOAK_DURATION` env var | Configurable per run |

```javascript
// Configurable soak duration via environment variable
const SOAK_DURATION = __ENV.SOAK_DURATION || "1h";

export const options = {
  stages: [
    { duration: "2m", target: 30 },           // ramp up
    { duration: SOAK_DURATION, target: 30 },   // hold steady
    { duration: "2m", target: 0 },             // ramp down
  ],
};
```

**Run durations:**
- Quick validation: `SOAK_DURATION=15m` (ramp + hold + ramp = ~19 min)
- Standard soak: `SOAK_DURATION=1h` (total ~64 min)
- Extended soak: `SOAK_DURATION=4h` (total ~244 min)

### 2.3 Set Thresholds for Soak Testing

**Soak thresholds are about CONSISTENCY, not just absolute values.**

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| p95 overall | < 500-800ms | Absolute ceiling (same as load test) |
| Error rate | < 1% | Must remain low across entire run |
| Per-endpoint Trend | Track, don't threshold | Compare start vs end manually |

**Key insight:** k6 built-in thresholds aggregate over the ENTIRE run. They cannot detect drift (p95 at minute 5 vs p95 at minute 60). For drift detection, use time-series comparison in the analysis phase.

### 2.4 Plan Time-Series Comparison

**This is the core of soak test analysis.** You need to compare metrics across time intervals.

**Strategy: 15-minute interval markers**

Use k6 custom metrics with tags to bucket results by time interval:

```javascript
// Tag each request with its 15-min interval
const intervalMinutes = 15;
const elapsedMin = Math.floor((Date.now() - testStartTime) / 60000);
const interval = Math.floor(elapsedMin / intervalMinutes) * intervalMinutes;

http.get(url, {
  tags: { interval: `${interval}min` },
});
```

**What to compare:**
- p95 at interval 0-15min vs p95 at last interval
- Error rate at interval 0-15min vs error rate at last interval
- Throughput (req/s) at interval 0-15min vs throughput at last interval

**Acceptable drift:** < 20% increase from first to last interval.
**Concerning drift:** > 20% increase suggests degradation under sustained load.

### 2.5 Plan Think Time

**Soak tests should use realistic pacing -- no hammering.**

| Scenario | Think Time | Why |
|----------|-----------|-----|
| Steady reads | 1-2s | Natural browsing pace |
| Write accumulation | 2-3s | Writes are less frequent |
| Auth churn | 1s between steps | Session operations are sequential |
| Mixed workload | 1-2s | Production-like pacing |

**Why generous think time matters for soak tests:** Short think time generates more load, which tests throughput (that's a load test). Soak tests want moderate sustained load to expose time-dependent issues. Generous think time also reduces the chance of k6 itself running out of memory over multi-hour runs.

---

## Phase 3: Plan Verification Strategy

### 3.1 Four Layers of Soak Verification

Soak tests have one extra layer compared to load tests:

**Layer 1: Thresholds** -- Automatic pass/fail on aggregate p95 and error rate.
```
"http_req_duration": ["p(95)<800"]
"http_req_failed": ["rate<0.01"]
```

**Layer 2: Checks** -- Per-request validation of status code and response body.
```
check(res, {
  "status is 200": (r) => r.status === 200,
  "body has expected field": (r) => { ... },
});
```

**Layer 3: Custom Metrics** -- Per-endpoint Trend metrics for granular comparison.
```
const searchTrend = new Trend("search_duration");
searchTrend.add(res.timings.duration);
```

**Layer 4: Time-Series Drift Detection** -- Compare early intervals vs late intervals.
```
// Log interval markers to console for post-analysis
// Or use tagged custom metrics for interval comparison
```

### 3.2 Null-Body Guards

**When the server degrades under sustained load, response bodies may become null.** This is more common in soak tests because the server has been running for hours.

**Always guard JSON checks:**
```javascript
"body valid": (r) => {
  if (!r.body) return false;  // ALWAYS add this guard
  const body = r.json();
  return body && body.expectedField;
},
```

### 3.3 Plan Reporting

Every script needs `handleSummary()` for evidence artifacts:
- HTML report (visual, for report/submission)
- JSON results (raw data, for time-series analysis)
- Terminal summary (for quick pass/fail)

**Additionally, plan for console output of interval summaries** so drift can be observed in real-time during long runs.

---

## Phase 4: Identify Soak-Specific Risks

### Common Soak Testing Risks

| Risk | Detection | Mitigation |
|------|-----------|------------|
| **k6 itself runs out of memory** | k6 process crashes or slows after 2+ hours | Reduce custom metric cardinality, avoid high-cardinality tags, use `discardResponseBodies: true` if body checks aren't needed |
| **Test machine resource exhaustion** | Laptop fans spin up, swapping starts, k6 timings include machine overhead | Run on a machine with sufficient RAM, close other applications, monitor machine CPU/RAM during test |
| **Network timeouts on long runs** | Sporadic connection timeouts unrelated to server performance | Add `timeout: "10s"` to requests, distinguish network errors from server errors in analysis |
| **Clock drift on long runs** | Interval bucketing becomes inaccurate over hours | Use monotonic elapsed time (`Date.now() - startTime`), not wall clock intervals |
| **Database fills up** | Write-heavy tests create thousands of records, disk fills | Calculate expected writes before running, ensure sufficient disk space, plan cleanup |
| **Server auto-restart / GC pauses** | Periodic latency spikes at regular intervals | Check server logs for restarts, distinguish GC pauses (brief) from degradation (sustained) |
| **Seed data becomes stale** | Early iterations use data that later iterations modified | Use read-only seed data for reads, unique data for writes |
| **Test data polluting production DB** | Thousands of test users/records created | Use isolated test database, plan cleanup script |
| **k6 summary data too large** | JSON results file is hundreds of MB after 4 hours | Use `handleSummary` to output only aggregated data, not raw time-series |
| **Interrupted run (laptop sleep, SSH disconnect)** | k6 exits, partial results | Use `screen`/`tmux` for remote runs, keep laptop awake for local runs |

---

## Summary Output Format

When planning is complete, document:

```
SYSTEM UNDER TEST
=================
Base URL: [e.g., http://localhost:6060]
API prefix: [e.g., /api/v1]
Total endpoints: [count]
Endpoints selected for soak: [count, with rationale]

TEST DATA
=========
Known entities: [slugs, IDs, emails verified against running API]
Test credentials: [email/password]
Seed script: [path if exists]
Expected data growth: [N records over H hours]

TEST SCRIPTS
============
Script 1: [degradation hypothesis] -> [endpoints] -> [what drift to detect]
Script 2: [degradation hypothesis] -> [endpoints] -> [what drift to detect]
...

VU PROFILE
==========
Type: Soak/Endurance
Profile: 2m ramp -> SOAK_DURATION hold -> 2m ramp down
Default duration: 1h
Target VUs: 30
Configurable via: SOAK_DURATION environment variable

VERIFICATION
============
Thresholds: [aggregate p95, error rate]
Checks: [status + body shape per endpoint]
Custom metrics: [one Trend per endpoint]
Drift detection: [15-min interval comparison, first vs last]

DRIFT CRITERIA
==============
Acceptable: < 20% p95 increase from first to last interval
Concerning: 20-50% increase -- investigate
Failing: > 50% increase -- degradation confirmed

RISKS
=====
[List identified risks and mitigations]

TOTAL SCENARIOS: [count]
READY FOR IMPLEMENTER
```

---

## Planning Checklist

- [ ] All route files read, endpoints catalogued and classified for soak relevance
- [ ] Test data verified against running API (not just seed files)
- [ ] Response shapes confirmed via curl
- [ ] Data growth impact estimated (writes * VUs * duration)
- [ ] Scripts organized by degradation hypothesis (not one-per-endpoint)
- [ ] VU profile set: moderate VUs, long duration, configurable via `SOAK_DURATION`
- [ ] Thresholds set for aggregate metrics
- [ ] Drift detection strategy planned (interval tagging or periodic logging)
- [ ] Think time set generously (1-2s) for realistic sustained pacing
- [ ] Null-body guards planned
- [ ] Reporting (HTML + JSON) planned
- [ ] Soak-specific risks identified (k6 memory, machine resources, data growth)
- [ ] Cleanup plan for test-generated data
- [ ] Ready for implementer handoff
