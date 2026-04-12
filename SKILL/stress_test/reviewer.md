# Stress Test Reviewer - Verify Quality & Analyze Breaking Point

**Review scripts, validate results, identify the breaking point, approve or request changes.**

---

## Pre-Execution Review (Before Running)

### 1. Script Validity

**Verify k6 can parse the script:**
```bash
k6 inspect tests/nft/stress-script-name.js
```
If it returns JSON options without errors, the script is syntactically valid.

### 2. Stage Profile Validation

**Verify the escalation profile makes sense:**

- [ ] At least 4-5 escalation stages defined
- [ ] Each stage has both a ramp period AND a hold period
- [ ] Hold periods are long enough to collect meaningful data (at least 1 min)
- [ ] Recovery phase exists (ramp down to 0 VUs)
- [ ] Peak VUs are high enough to plausibly break the system
- [ ] Total duration is reasonable (10-15 min for stress tests)

### 3. Data Alignment

**Verify hardcoded seed data matches the actual database:**
```bash
# Check entities exist (should return 200, not 404)
curl -s -w "%{http_code}" http://localhost:<port>/api/v1/resource/known-slug

# Check test credentials work
curl -s -X POST http://localhost:<port>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

### 4. Smoke Test

```bash
k6 run tests/nft/stress-script-name.js --duration 10s --vus 1
```

**Expected:** 100% checks passed, 0 errors.

| Smoke Result | Action |
|---|---|
| 100% checks, 0 errors | Proceed to mini stress test |
| Check failures at 1 VU | Script bug — fix before any stress run |
| Connection refused | Server not running — start it first |
| 10s timeouts | DB not connected — check connection string |

### 5. Mini Stress Test

```bash
k6 run tests/nft/stress-script-name.js --stage 10s:10,10s:10,10s:20,10s:20,10s:0
```

**Expected:** Per-stage metrics appear in output, no script errors during VU transitions.

---

## Post-Execution Review (After Running)

### 6. Validate Test Conditions

**Before trusting results, confirm clean conditions:**

- [ ] Server was running and connected to DB at test start
- [ ] No laptop sleep, internet disconnect, or power interruption
- [ ] No other heavy processes competing for CPU
- [ ] Only one k6 test was running at a time
- [ ] Database had correct seed data throughout
- [ ] Server process was monitored during the test (crash detection)
- [ ] OS file descriptor limits were checked/increased before test

**If conditions were violated, results are invalid.** Re-run.

### 7. Identify the Breaking Point

**This is the core deliverable of a stress test. Analyze per-stage metrics to find:**

#### 7.1 Latency Degradation Point

**At which VU stage does p95 latency exceed 2 seconds?**

| Stage | VUs | p95 Latency | Status |
|-------|-----|-------------|--------|
| 1 | 50 | ___ ms | Baseline |
| 2 | 100 | ___ ms | Normal / Degraded? |
| 3 | 200 | ___ ms | Normal / Degraded? |
| 4 | 300 | ___ ms | Normal / Degraded? |
| 5 | 400 | ___ ms | Normal / Degraded? |

**Degradation point:** The first stage where p95 exceeds 2x the Stage 1 baseline.
**Breaking point:** The first stage where p95 exceeds 2000ms or requests start timing out.

#### 7.2 Error Onset Point

**At which VU stage do errors first appear?**

| Stage | VUs | Error Rate | Status |
|-------|-----|-----------|--------|
| 1 | 50 | ___ % | Should be ~0% |
| 2 | 100 | ___ % | 0% / errors? |
| 3 | 200 | ___ % | 0% / errors? |
| 4 | 300 | ___ % | 0% / errors? |
| 5 | 400 | ___ % | 0% / errors? |

**Error onset:** The first stage where error rate exceeds 1%.
**System failure:** The first stage where error rate exceeds 10%.

#### 7.3 Server Crash Point

**Did the server process die during the test?**

- [ ] Server process survived all stages — document max VUs handled
- [ ] Server crashed at Stage ___ (___  VUs) — this IS the hard breaking point
- [ ] Server crashed and restarted (via process manager) — document recovery time

#### 7.4 Recovery Assessment

**After peak load, does the system return to baseline?**

| Metric | Stage 1 (Baseline) | Recovery Phase | Recovered? |
|--------|-------------------|----------------|------------|
| p95 latency | ___ ms | ___ ms | Yes / No |
| Error rate | ___ % | ___ % | Yes / No |

**Recovery time:** How many seconds after ramp-down began before metrics returned to baseline levels.

### 8. Distinguish Real Findings from Test Problems

| Symptom | Real Stress Finding? | Test Problem? |
|---------|---------------------|---------------|
| p95 gradually increases across stages | **Yes** — system degrades under load | No |
| p95 jumps suddenly at one stage | **Yes** — a resource limit was hit | No |
| Errors appear at high VU count | **Yes** — system capacity exceeded | No |
| Server process dies | **Yes** — hard breaking point found | No |
| 100% check failures from Stage 1 | No | **Yes** — wrong response shape or bad seed data |
| `connection refused` from the start | No | **Yes** — server not running |
| `GoError: body is null` spam | Server dropped connections (valid if at high VUs) | Missing null-body guard (if at low VUs) |
| All endpoints degrade simultaneously at one stage | **Yes** — connection pool or shared resource exhaustion | No |
| Only auth endpoints degrade | **Yes** — CPU saturation from hashing | No |
| 60s timeouts on one endpoint | Maybe — that endpoint hangs | Or no data exists (e.g., photo with no image) |
| k6 itself becomes unresponsive | No | **Yes** — k6 machine under-resourced |

### 9. Review Metrics

For each script, check:

| Metric | Location in Output | What to Look For |
|--------|-------------------|------------------|
| **Per-stage error rates** | `errors_stage_N_XXvu` | Which stage errors first appear |
| **Per-stage latency** | `latency_stage_N_XXvu` | Which stage latency degrades |
| **Overall p95** | `http_req_duration` | Should be under 2000ms threshold |
| **Overall error rate** | `http_req_failed` | Should be under 15% threshold |
| **Checks** | `checks` line | Expected to be < 100% (degradation is normal) |
| **Recovery latency** | `recovery_latency` or `latency_recovery` | Compare to Stage 1 |
| **VUs max** | `vus_max` | Matches expected peak (not doubled) |
| **Iterations** | `iterations` | Reasonable count for test duration |

### 10. Verify Report Artifacts

- [ ] `results/<name>-report.html` exists and renders correctly in browser
- [ ] `results/<name>-results.json` exists and contains per-stage metric data
- [ ] Terminal output shows clear per-stage breakdown

---

## Decision Matrix

| Scenario | Decision | Action |
|----------|----------|--------|
| Breaking point clearly identified, per-stage data clean | **APPROVE** | Document breaking point in report |
| All thresholds pass even at peak VUs | **APPROVE with note** | System handled all stages; consider higher VU targets |
| Server crashed at a specific stage | **APPROVE** | Crash point IS the finding; re-run only if you need recovery data |
| Thresholds fail but no per-stage metrics | **REWORK** | Per-stage tracking missing; add stage-aware metrics |
| Check failures from Stage 1 (not load-related) | **REWORK** | Fix check assertions (wrong response shape, missing null guard) |
| No recovery phase in script | **REWORK** | Add ramp-down stage and recovery metrics |
| Server crashed but no documentation of when | **RERUN** | Monitor server process during next run |
| 100% failures from start | **RERUN** | Server not running, DB not connected, or seed data wrong |
| Results from interrupted session | **RERUN** | Don't use data from laptop sleep / internet disconnect |
| Peak VUs too low (system never stressed) | **REPLAN** | Increase VU targets until degradation appears |
| All stages identical (no escalation visible) | **REPLAN** | VU stages too close together; spread them wider |

---

## Breaking Point Report Template

**When approving, ensure the team documents the breaking point clearly:**

```
STRESS TEST RESULTS — [Script Name]
=====================================

SYSTEM CAPACITY
  Degradation point: [VU count] VUs (p95 exceeded 2x baseline)
  Error onset:       [VU count] VUs (error rate > 1%)
  Breaking point:    [VU count] VUs (error rate > 10% or server crash)
  Server crash:      [Yes/No, at VU count]

PER-STAGE SUMMARY
  Stage 1 (50 VUs):   p95 = ___ms, errors = ___%
  Stage 2 (100 VUs):  p95 = ___ms, errors = ___%
  Stage 3 (200 VUs):  p95 = ___ms, errors = ___%
  Stage 4 (300 VUs):  p95 = ___ms, errors = ___%
  Stage 5 (400 VUs):  p95 = ___ms, errors = ___%

RECOVERY
  Recovery time: ___s to return to baseline
  Full recovery: [Yes / Partial / No]

BOTTLENECK IDENTIFIED
  [CPU saturation on auth endpoints / DB connection pool at N connections /
   Memory exhaustion / Socket limit / etc.]

RECOMMENDATION
  Safe operating limit: [VU count] concurrent users
  With headroom (80%):  [VU count * 0.8] concurrent users
```

---

## Quality Checklist

### Script Quality
- [ ] Every script has author name/ID comment header
- [ ] Every script states target bottleneck and expected failure mode
- [ ] All scripts pass `k6 inspect` without errors
- [ ] Smoke test passes at 1 VU (100% checks)
- [ ] Stepped escalation with at least 4-5 stages + recovery
- [ ] Each stage has hold period (at least 1 min) for stable measurements
- [ ] Per-stage Rate and Trend metrics defined and tracked
- [ ] Relaxed thresholds (p95 < 2s, errors < 15%)
- [ ] No parallel scenarios unintentionally doubling VUs
- [ ] Null-body guards on all `r.json()` calls
- [ ] Request timeouts set (10s) to prevent hangs
- [ ] `handleSummary()` produces HTML + JSON
- [ ] Minimal think time (0.1-0.5s, appropriate for stress)
- [ ] Custom `Trend` metric per endpoint (granular reporting)

### Results Quality
- [ ] Tests ran under clean conditions (server up, DB connected, no interruptions)
- [ ] Server process was monitored during test (crash detection)
- [ ] HTML reports generated in `results/`
- [ ] JSON results exported in `results/`
- [ ] Per-stage metrics present in results
- [ ] Breaking point clearly identifiable from the data
- [ ] Recovery phase data present
- [ ] VU count matches expected (not accidentally doubled)

### Breaking Point Documentation
- [ ] Degradation point identified (VU count where p95 > 2x baseline)
- [ ] Error onset identified (VU count where errors first appear)
- [ ] Breaking point identified (VU count where system fails)
- [ ] Server crash documented if applicable (VU count, error type)
- [ ] Recovery assessment completed (time to return to baseline)
- [ ] Bottleneck identified (CPU, DB pool, memory, sockets, etc.)
- [ ] Safe operating limit recommended

### Documentation
- [ ] README updated with contribution table (who did what, test type, scripts)
- [ ] Report includes: per-stage latency/error tables, breaking point summary, recovery assessment
- [ ] All scripts, results, and documentation committed to repo

---

## Approval

If all checklists pass and breaking point is documented -> **APPROVED** — ready for submission.

If issues found:
- **REWORK** -> Implementer fixes specific issues (missing per-stage metrics, null guards, timeouts)
- **RERUN** -> Fix environment, monitor server, re-run for clean results
- **REPLAN** -> VU targets too low/high, missing recovery phase, wrong bottleneck focus -> back to Planner
