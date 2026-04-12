# Spike Test Planner - Sudden Surge Test Design

**Analyze -> Plan -> Implement** (No code written in this phase!)

---

## OPTIONAL Phase 0: Check Memory (Cross-Module Learning)

**Skip if first time. Check `_memory/` if prior tests were run.**

- [ ] Read `_memory/patterns.md` -- Endpoint categories, threshold baselines, seed data patterns
- [ ] Read `_memory/[prior-module].md` -- What response shapes looked like, what broke under load

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

### 1.2 Classify Endpoint Spike Vulnerability

**For each endpoint, classify by how it behaves under sudden surge:**

| Category | Why It Matters for Spikes | Examples |
|----------|--------------------------|----------|
| **CPU-bound** | Thread/process starvation under instant load; queues explode | Login with bcrypt, password reset, image processing |
| **DB-intensive** | Connection pool exhaustion; query queueing; deadlocks | Full-text search, filtered listings, aggregations |
| **High-frequency** | Highest absolute request count during spike; amplifies everything | Get categories, get session, health checks |
| **Stateful** | Session stores, caches, connection pools may not survive spike | Auth endpoints, cart/checkout, WebSocket endpoints |
| **I/O-bound** | File handles / socket limits hit first | Image/photo endpoints, file downloads |
| **Lightweight** | Survive spikes well; good baseline canary | Get count, get single item by ID |

**Why this matters for spikes:** CPU-bound endpoints queue requests instantly. DB-intensive endpoints exhaust connection pools. Stateful endpoints may lose sessions during overload. Lightweight endpoints serve as recovery canaries -- if they degrade, the whole system is struggling.

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

**Common pitfall:** Seed JSON files have different data than what's in the database (e.g., different cloud DB, data was modified manually). Hardcoding from seed files without checking causes 100% failures.

### 1.4 Verify Response Shapes

**Before writing checks, confirm the actual response structure:**
```bash
# Is it { products: [...] } or just [...] ?
# Is it { results: [...] } or { data: [...] } ?
curl -s http://localhost:<port>/api/v1/<endpoint> | python3 -c "import sys,json; print(list(json.load(sys.stdin).keys()))"
```

### 1.5 Establish Baseline Expectations

**Spike tests compare spike behavior to baseline. You need baseline numbers.**

- [ ] Run a quick load test at low VUs (5-10 VUs, 30s) and record p95 latency per endpoint
- [ ] Record error rate at baseline (should be 0%)
- [ ] Note throughput (req/s) at baseline
- [ ] These become the "recovery target" -- after the spike ends, the system must return to these numbers

If load tests were already run (check `_memory/`), use those baseline numbers.

---

## Phase 2: Design Spike Test Scripts

### 2.1 Spike Test Goal

**Spike testing answers ONE question: Does the system survive sudden traffic surges and recover gracefully?**

Unlike load testing (steady state) or stress testing (gradual escalation), spike testing uses:
- **Instant ramp** -- near-zero ramp time (5-10s) to simulate flash sales, viral events, DDoS
- **Short hold** -- hold spike for 30-60s (long enough to see failure, short enough that recovery matters)
- **Recovery observation** -- 2-3 minutes AFTER spike to measure how fast the system returns to normal

### 2.2 Spike VU Profile

**Standard spike profile:**

```
Phase 1: Baseline     -- 10 VUs for 30s (establish normal behavior)
Phase 2: Spike up     -- Ramp to 500 VUs in 10s (instant surge)
Phase 3: Spike hold   -- Hold 500 VUs for 1 min (sustained spike)
Phase 4: Spike down   -- Drop to 10 VUs in 10s (surge ends)
Phase 5: Recovery     -- Hold 10 VUs for 2 min (observe recovery)
```

**k6 stages equivalent:**
```javascript
stages: [
  { duration: "30s", target: 10 },   // baseline
  { duration: "10s", target: 500 },   // spike up (near-instant)
  { duration: "1m",  target: 500 },   // spike hold
  { duration: "10s", target: 10 },    // spike down (near-instant)
  { duration: "2m",  target: 10 },    // recovery observation
]
```

**Double-spike profile (tests repeated resilience):**
```
Baseline (30s, 10 VU) -> Spike 1 (10s to 500) -> Hold (1m) -> Drop (10s to 10) ->
Recovery 1 (1m) -> Spike 2 (10s to 500) -> Hold (1m) -> Drop (10s to 10) ->
Recovery 2 (2m)
```

**Why double-spike:** The second spike tests whether the system truly recovered or is in a degraded state. Connection pools may be exhausted, caches cold, memory fragmented. If the second recovery is worse than the first, the system has a cumulative degradation problem.

### 2.3 Organize by Theme, Not by Endpoint

| Script Theme | What It Proves | Typical Endpoints |
|-------------|----------------|-------------------|
| **Core browsing spike** | Main read endpoints survive sudden traffic | List all, paginate, get detail |
| **Search spike** | DB-intensive operations under surge | Search, filter, category listing |
| **Auth spike** | CPU-bound endpoints under surge | Login, register |
| **Mixed spike** | Realistic traffic distribution during flash sale | 80% reads / 20% writes |
| **Double-spike** | System recovers fully, handles repeated surges | Mix of endpoints, two spike cycles |

**Target: 3-5 scripts, each testing 2-4 endpoints under spike conditions.**

### 2.4 Set Thresholds by Phase

**Spike tests need DIFFERENT thresholds for spike vs. recovery phases.**

| Phase | p95 Threshold | Error Rate | Rationale |
|-------|--------------|------------|-----------|
| Baseline | < 500ms | < 1% | Normal operating conditions |
| During spike | < 3000ms | < 15% | Degradation expected; crash is the failure |
| Recovery (0-30s after drop) | < 1500ms | < 5% | System draining queues |
| Recovery (30-60s after drop) | < 500ms | < 1% | Must return to baseline |

**Key insight:** During the spike, high latency and some errors are EXPECTED. The real test is:
1. Does the server crash? (connection refused = hard fail)
2. Does the server recover? (must return to baseline within 30-60s)

### 2.5 Plan Recovery Measurement

**Recovery tracking is the most important part of a spike test.**

Strategy: Use k6 custom metrics tagged by phase to compare pre-spike vs post-spike performance.

```
Tag each request with the current phase (baseline / spike / recovery).
After the test, compare:
  - recovery_p95 vs baseline_p95 -- should converge within 30-60s
  - recovery_error_rate vs baseline_error_rate -- should return to 0%
  - recovery_throughput vs baseline_throughput -- should match
```

If recovery metrics never return to baseline, the system has a degradation problem (memory leak, connection pool exhaustion, stuck threads).

### 2.6 Plan Think Time

| Phase | Think Time | Why |
|-------|-----------|-----|
| Baseline | 0.5-1s | Realistic pacing, establish clean numbers |
| During spike | 0-0.3s | Maximum pressure (simulates stampede) |
| Recovery | 0.5-1s | Return to realistic pacing |

---

## Phase 3: Plan Verification Strategy

### 3.1 Three Layers of Verification

**Layer 1: Thresholds** -- Automatic pass/fail on p95 latency and error rate.
```
"http_req_duration": ["p(95)<3000"]   // relaxed for spike
"http_req_failed": ["rate<0.15"]      // allow some errors during spike
```

**Layer 2: Checks** -- Per-request validation of status code and response body.
```
check(res, {
  "status is 200": (r) => r.status === 200,
  "body has expected field": (r) => { ... },
});
```

**Layer 3: Phase-tagged Custom Metrics** -- Recovery tracking per phase.
```
const baselineTrend = new Trend("baseline_duration");
const spikeTrend = new Trend("spike_duration");
const recoveryTrend = new Trend("recovery_duration");
// Add to appropriate trend based on current phase
```

### 3.2 Null-Body Guards (Critical for Spike Tests)

**During spikes, server crashes are common. Response bodies WILL be null.**

```javascript
"body valid": (r) => {
  if (!r.body) return false;  // ALWAYS add this guard
  const body = r.json();
  return body && body.token;
},
```

**In spike tests, null bodies are MORE likely than in load tests.** Every `r.json()` call MUST be guarded.

### 3.3 Plan Reporting

Every script needs `handleSummary()` for evidence artifacts:
- HTML report (visual, for report/submission)
- JSON results (raw data, for recovery analysis)
- Terminal summary (for quick pass/fail)

---

## Phase 4: Identify Risks and Gotchas

### Spike-Specific Gotchas

| Risk | Detection | Mitigation |
|------|-----------|------------|
| Server crashes during spike | `connection refused` mid-test | Document as finding; restart server and re-run for recovery data |
| Connection pool exhaustion | Requests queue, then mass timeout after spike ends | Track per-phase latency; check DB connection pool config |
| Recovery oscillation | p95 bounces between normal and degraded after spike | Extend recovery observation to 3-5 min; track per-10s windows |
| Memory leak revealed by spike | Gradual degradation even after recovery period | Monitor server memory during test; compare pre/post RSS |
| Socket/file descriptor exhaustion | `EMFILE` or `ENOMEM` errors during spike | Check OS ulimit settings; track open connections |
| k6 itself bottlenecking | k6 machine CPU at 100%, skewing results | Monitor k6 machine resources; use `--out` for lightweight output |
| Parallel scenarios doubling spike VUs | 1000 VUs when you expected 500 | Use single scenario with alternation |
| Second spike worse than first | Connection pool never fully drained | Document as cumulative degradation finding |
| Seed data mismatch | 100% check failures at 1 VU | Verify via curl before writing scripts |
| Server not connected to DB | 10s timeouts on every request | Check for "Connected" log message |

---

## Summary Output Format

When planning is complete, document:

```
SYSTEM UNDER TEST
=================
Base URL: [e.g., http://localhost:6060]
API prefix: [e.g., /api/v1]
Total endpoints: [count]
Endpoints most vulnerable to spike: [list CPU-bound and DB-intensive]

TEST DATA
=========
Known entities: [slugs, IDs, emails verified against running API]
Test credentials: [email/password]
Seed script: [path if exists]

BASELINE MEASUREMENTS
=====================
p95 at 10 VUs: [per endpoint]
Error rate at 10 VUs: [should be 0%]
Throughput at 10 VUs: [req/s]

TEST SCRIPTS
============
Script 1: [theme] -> [endpoints] -> [spike VU target] -> [thresholds per phase]
Script 2: [theme] -> [endpoints] -> [spike VU target] -> [thresholds per phase]
...

VU PROFILE
==========
Type: Spike (single / double)
Baseline: [VU count] for [duration]
Spike: [VU count] in [ramp time]
Hold: [duration]
Recovery: [VU count] for [observation duration]
Total duration: [time]

VERIFICATION
============
Thresholds: [per phase: baseline / spike / recovery]
Checks: [status + body shape per endpoint]
Custom metrics: [phase-tagged Trends for recovery comparison]
Recovery target: [must return to baseline p95 within X seconds]

RISKS
=====
[List identified spike-specific risks and mitigations]

TOTAL SCENARIOS: [count]
READY FOR IMPLEMENTER
```

---

## Planning Checklist

- [ ] All route files read, endpoints catalogued and classified by spike vulnerability
- [ ] Test data verified against running API (not just seed files)
- [ ] Response shapes confirmed via curl
- [ ] Baseline expectations established (p95, error rate, throughput at low VUs)
- [ ] Scripts organized by theme (not one-per-endpoint)
- [ ] Spike VU profile chosen (single or double spike)
- [ ] Thresholds set per phase (baseline / spike / recovery)
- [ ] Recovery measurement strategy planned (phase-tagged metrics)
- [ ] Think time planned per phase
- [ ] Null-body guards planned (extra critical for spikes)
- [ ] Reporting (HTML + JSON) planned
- [ ] Spike-specific risks identified and mitigated
- [ ] Ready for implementer handoff
