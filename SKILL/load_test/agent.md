# Load Test Planner - Performance Test Design

**Analyze → Plan → Implement** (No code written in this phase!)

---

## OPTIONAL Phase 0: Check Memory (Cross-Module Learning)

**Skip if first time. Check `_memory/` if prior tests were run.**

- [ ] Read `_memory/patterns.md` — Endpoint categories, threshold baselines, seed data patterns
- [ ] Read `_memory/[prior-module].md` — What response shapes looked like, what broke

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

### 1.2 Classify Endpoint Performance Characteristics

**For each endpoint, classify by expected cost:**

| Category | Characteristics | Examples |
|----------|----------------|----------|
| **CPU-bound** | Heavy computation (hashing, encryption, image processing) | Login with bcrypt, password reset |
| **DB-intensive** | Regex search, joins, aggregations, cross-collection queries | Full-text search, filtered listings, related items |
| **High-frequency** | Called on every page load or navigation | Get all categories, get user session |
| **I/O-bound** | Binary data transfer, file reads | Image/photo endpoints, file downloads |
| **Lightweight** | Simple DB reads, counts | Get count, get single item by ID |

**Why this matters:** CPU-bound endpoints need higher latency thresholds. DB-intensive endpoints are most likely to degrade under load. High-frequency endpoints have the highest impact on user experience.

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

**Common pitfall:** Assuming `{ results: [...] }` when the API returns a plain array `[...]`. Getting the shape wrong causes 100% check failures even though the endpoint works fine.

---

## Phase 2: Design Test Scripts

### 2.1 Organize by Theme, Not by Endpoint

**Don't create one script per endpoint.** Group related endpoints into thematic scripts:

| Script Theme | What It Proves | Typical Endpoints |
|-------------|----------------|-------------------|
| **Core browsing** | Main pages handle expected traffic | List all, paginate, get detail, get count |
| **Search & filter** | DB-intensive operations hold up | Search, filter, category listing, related items |
| **Auth & session** | CPU-bound + high-frequency endpoints | Login, register, get session/categories |
| **User journey** | Full realistic flow works end-to-end | Sequential: browse → search → view → login |
| **Mixed workload** | Production-like traffic distribution | 80% reads / 20% writes, pagination cycling |

**Target: 4-5 scripts, each with 3-5 scenarios = 15-20 total scenarios.**

### 2.2 Design VU Profile

**Virtual Users (VUs) = simulated concurrent users.**

Choose a profile based on test type:

| Test Type | VU Pattern | Duration | Purpose |
|-----------|-----------|----------|---------|
| **Load** | Ramp up → hold steady → ramp down | 3-10 min | Validate expected traffic |
| **Stress** | Escalate in steps until failure | 10-15 min | Find breaking point |
| **Spike** | Instant jump, then drop | 3-5 min | Handle sudden surges |
| **Soak** | Steady hold for extended time | 1-4 hours | Detect degradation over time |

**For load testing, a simple 3-minute profile is sufficient for evidence:**
```
30s ramp to target VUs → 2 min hold → 30s ramp down
```

### 2.3 Set Thresholds by Endpoint Type

**Thresholds make tests pass/fail automatically — not just informational.**

| Endpoint Type | p95 Threshold | Rationale |
|--------------|---------------|-----------|
| Lightweight reads | < 300-400ms | Simple DB queries |
| Standard CRUD | < 500ms | Normal read/write |
| Search/regex/filter | < 600ms | DB regex is slower |
| Auth (hashing) | < 800ms | bcrypt/argon2 is slow by design |
| Writes (create) | < 1000ms | Hash + DB write |
| Error rate (all) | < 1% | Reliability baseline |

### 2.4 Plan Think Time

**Sleep between requests simulates realistic user pacing:**

| Scenario | Think Time | Why |
|----------|-----------|-----|
| Individual endpoints | 0.5-1s | Users pause between actions |
| User journeys | 1s between steps | Natural browsing pace |
| Mixed workload | 0.3-0.5s | Aggregate traffic pattern |
| Stress/spike | 0-0.3s | Maximum pressure |

---

## Phase 3: Plan Verification Strategy

### 3.1 Three Layers of Verification

Every load test should have three verification layers:

**Layer 1: Thresholds** — Automatic pass/fail on p95 latency and error rate.
```
"http_req_duration": ["p(95)<500"]
"http_req_failed": ["rate<0.01"]
```

**Layer 2: Checks** — Per-request validation of status code and response body.
```
check(res, {
  "status is 200": (r) => r.status === 200,
  "body has expected field": (r) => { ... },
});
```

**Layer 3: Custom Metrics** — Per-endpoint Trend metrics for granular comparison.
```
const loginTrend = new Trend("login_duration");
loginTrend.add(res.timings.duration);
```

### 3.2 Null-Body Guards

**When the server crashes under load, response bodies are null.** Calling `.json()` on a null body produces hundreds of `GoError` stack traces in k6.

**Always guard JSON checks:**
```javascript
"body valid": (r) => {
  if (!r.body) return false;
  const body = r.json();
  return body && body.token;
},
```

### 3.3 Plan Reporting

Every script needs `handleSummary()` for evidence artifacts:
- HTML report (visual, for report/submission)
- JSON results (raw data, for analysis)
- Terminal summary (for quick pass/fail)

---

## Phase 4: Identify Risks and Gotchas

### Common Gotchas to Plan For

| Risk | Detection | Mitigation |
|------|-----------|------------|
| Seed data doesn't match DB | 100% check failures at 1 VU | Verify via curl before writing scripts |
| Server not connected to DB | 10s timeouts on every request | Check for "Connected" log message |
| Parallel scenarios doubling VUs | 100 VUs when you expected 50 | Use single scenario with alternation |
| Binary endpoints (photos) hanging | 60s timeouts | Add `timeout: "5s"` or skip if no data |
| Internet disconnect mid-test | Connection refused errors | Re-run; don't use results from interrupted runs |
| Register endpoint creating real data | DB fills with test users | Use unique emails with `__VU` + `__ITER` |

---

## Summary Output Format

When planning is complete, document:

```
SYSTEM UNDER TEST
=================
Base URL: [e.g., http://localhost:6060]
API prefix: [e.g., /api/v1]
Total endpoints: [count]

TEST DATA
=========
Known entities: [slugs, IDs, emails verified against running API]
Test credentials: [email/password]
Seed script: [path if exists]

TEST SCRIPTS
============
Script 1: [theme] → [endpoints] → [threshold per endpoint]
Script 2: [theme] → [endpoints] → [threshold per endpoint]
...

VU PROFILE
==========
Type: [Load/Stress/Spike/Soak]
Profile: [ramp description]
Duration: [total time]
Target VUs: [count]

VERIFICATION
============
Thresholds: [per endpoint type]
Checks: [status + body shape per endpoint]
Custom metrics: [one Trend per endpoint]

RISKS
=====
[List identified risks and mitigations]

TOTAL SCENARIOS: [count]
READY FOR IMPLEMENTER ✓
```

---

## Planning Checklist

- [ ] All route files read, endpoints catalogued and classified
- [ ] Test data verified against running API (not just seed files)
- [ ] Response shapes confirmed via curl
- [ ] Scripts organized by theme (not one-per-endpoint)
- [ ] VU profile chosen with rationale
- [ ] Thresholds set per endpoint type
- [ ] Think time planned per scenario type
- [ ] Null-body guards planned
- [ ] Reporting (HTML + JSON) planned
- [ ] Risks identified and mitigated
- [ ] Ready for implementer handoff
