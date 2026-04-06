# Spike Test Reviewer - Verify Quality & Results

**Review scripts, validate results, approve or request changes.**

---

## Pre-Execution Review (Before Running)

### 1. Script Validity

**Verify k6 can parse the script:**
```bash
k6 inspect tests/nft/spike-script-name.js
```
If it returns JSON options without errors, the script is syntactically valid.

### 2. VU Profile Review

**Verify the spike profile is correct:**

- [ ] Baseline phase exists (10 VUs, 30s) -- needed for comparison
- [ ] Spike ramp is near-instant (10s or less, not 30s+)
- [ ] Spike target is high enough to stress the system (typically 200-500+ VUs)
- [ ] Recovery phase exists and is long enough (2+ minutes)
- [ ] If double-spike: both spike/recovery cycles are present

**Red flags:**
- Ramp time > 15s -- that's a stress test, not a spike test
- No recovery phase -- defeats the purpose of spike testing
- No baseline phase -- cannot compare recovery to normal behavior

### 3. Phase Detection Review

**Verify phase detection is implemented:**

- [ ] `getPhase()` function exists and returns "baseline", "spike", "recovery"
- [ ] Phase timestamps align with stage durations (check arithmetic)
- [ ] Every request records metrics to the correct phase-tagged Trend
- [ ] Phase-specific thresholds are defined in options

### 4. Data Alignment

**Verify hardcoded seed data matches the actual database:**
```bash
# Check entities exist (should return 200, not 404)
curl -s -w "%{http_code}" http://localhost:<port>/api/v1/resource/known-slug

# Check test credentials work
curl -s -X POST http://localhost:<port>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

### 5. Smoke Test

```bash
k6 run tests/nft/spike-script-name.js --duration 10s --vus 1
```

**Expected:** 100% checks passed, 0 errors.

| Smoke Result | Action |
|---|---|
| 100% checks, 0 errors | Proceed to baseline measurement |
| Check failures at 1 VU | Script bug -- fix before spike run (wrong response shape, bad seed data) |
| Connection refused | Server not running -- start it first |
| 10s timeouts | DB not connected -- check connection string |

### 6. Baseline Measurement

```bash
k6 run tests/nft/spike-script-name.js --duration 30s --vus 10
```

**Record baseline numbers before running the full spike.** These are the recovery targets:
- p95 latency per endpoint at 10 VUs
- Error rate at 10 VUs (should be 0%)
- Throughput (req/s) at 10 VUs

---

## Post-Execution Review (After Running)

### 7. Validate Test Conditions

**Before trusting results, confirm clean conditions:**

- [ ] Server was running and connected to DB for entire test
- [ ] No laptop sleep, internet disconnect, or power interruption
- [ ] No other heavy processes competing for CPU
- [ ] Only one k6 test was running at a time
- [ ] Database had correct seed data throughout
- [ ] k6 machine itself was not CPU-bottlenecked (check if k6 reported warnings)

**If conditions were violated, results are invalid.** Re-run.

### 8. Interpret Results by Phase

**Spike test results MUST be interpreted per phase, not as a single aggregate.**

#### Phase 1: Baseline
| Metric | Expected | Red Flag |
|--------|----------|----------|
| p95 latency | < 500ms | > 500ms means system already degraded before spike |
| Error rate | 0% | Any errors at 10 VUs means system is broken, not spike-related |
| Throughput | Steady | Fluctuating throughput at baseline suggests instability |

#### Phase 2: During Spike
| Metric | Expected | Red Flag |
|--------|----------|----------|
| p95 latency | < 3000ms | > 5000ms means severe degradation (may still be acceptable) |
| Error rate | < 15% | > 30% means server is functionally down |
| `connection refused` | None (ideal) | Server process crashed -- CRITICAL finding |
| Throughput | High (proportional to VUs) | Low throughput + high VUs = request queueing |

#### Phase 3: Recovery
| Metric | Expected | Red Flag |
|--------|----------|----------|
| p95 latency (0-30s) | < 1500ms, decreasing | Still at spike levels = no recovery |
| p95 latency (30-60s) | < 500ms (baseline) | Still > 1000ms = slow recovery |
| Error rate | < 1%, trending to 0% | Persistent errors = system stuck in degraded state |
| Throughput | Return to baseline | Lower than baseline = capacity loss |

### 9. Recovery Assessment

**This is the most important part of spike test review.**

| Recovery Behavior | Classification | Action |
|---|---|---|
| p95 returns to baseline within 30s | **Excellent** -- system recovers gracefully | APPROVE |
| p95 returns to baseline within 60s | **Acceptable** -- system recovers, with some latency | APPROVE with note |
| p95 returns to baseline within 2 min | **Marginal** -- system recovers slowly | APPROVE with finding |
| p95 never returns to baseline | **Failed recovery** -- system is degraded | REWORK (investigate cause) |
| Server crashed, did not restart | **Critical failure** -- no recovery at all | Document as critical finding |
| Recovery oscillates (bounces) | **Unstable recovery** -- partial degradation | Extend observation; document pattern |

**For double-spike tests, also compare:**
- Recovery 1 time vs Recovery 2 time -- should be similar
- If Recovery 2 takes 2x+ longer, system has cumulative degradation

### 10. Distinguish Real Failures from Test Problems

| Symptom | Real Performance Issue? | Test Problem? |
|---------|----------------------|---------------|
| Server crashes at 500 VUs | **Yes** -- critical finding | No (unless VU count was accidentally doubled) |
| p95 = 2s during spike, recovers to 200ms | Expected spike degradation + good recovery | No |
| p95 = 2s during spike, stays at 2s in recovery | **Yes** -- failed recovery | No (unless server was already broken) |
| 100% check failures, 0% status errors | No | **Yes** -- wrong response shape in check |
| `connection refused` from start | No | **Yes** -- server not started |
| `connection refused` only during spike | **Yes** -- server crashed under load | Verify server was stable before test |
| `GoError: body is null` spam | Server dropped connections (valid during spike) | Missing null-body guard (fix the guard noise) |
| 60s timeout on one endpoint | **Maybe** -- endpoint hangs under load | Or no data exists (e.g., photo with no image) |
| k6 reports "request rate limited" | No | **Yes** -- k6 machine bottleneck, not server |
| Phase metrics don't match expectations | No | **Yes** -- phase timestamps miscalculated |

### 11. Review Metrics

For each script, check:

| Metric | Location in Output | What's Good |
|--------|-------------------|-------------|
| **Baseline p95** | `baseline_duration` Trend | Under 500ms |
| **Spike p95** | `spike_duration` Trend | Under 3000ms |
| **Recovery p95** | `recovery_duration` Trend | Under 500ms (matches baseline) |
| **Spike errors** | `spike_errors` Rate | Under 15% |
| **Recovery errors** | `recovery_errors` Rate | Under 1% |
| **Overall checks** | `checks` line | Baseline: 100%, Spike: >85%, Recovery: >99% |
| **VUs** | `vus_max` | Matches expected spike count (not doubled) |
| **Iterations** | `iterations` | Completed, none interrupted |

### 12. Verify Report Artifacts

- [ ] `results/<name>-report.html` exists and renders correctly in browser
- [ ] `results/<name>-results.json` exists and contains data
- [ ] Terminal output shows clear pass/fail for each threshold
- [ ] Phase-tagged metrics are visible in results

---

## Decision Matrix

| Scenario | Decision | Action |
|----------|----------|--------|
| Server survives spike, recovers within 60s, all thresholds pass | **APPROVE** | Results are valid evidence of spike resilience |
| Server survives spike, recovers slowly (60-120s) | **APPROVE with finding** | Document slow recovery as a performance finding |
| Server survives spike, never fully recovers | **APPROVE with critical finding** | Document failed recovery; investigate cause |
| Server crashes during spike, restarts and recovers | **APPROVE with finding** | Document crash and recovery; note if auto-restart worked |
| Server crashes during spike, does NOT recover | **APPROVE with critical finding** | Document crash; this is a deployment/resilience issue |
| Thresholds pass but checks fail | **REWORK** | Fix check assertions (wrong response shape, missing null guard) |
| Double-spike: second recovery much worse than first | **APPROVE with finding** | Document cumulative degradation |
| Phase metrics missing or miscalculated | **REWORK** | Fix phase detection timestamps |
| VU count accidentally doubled | **RERUN** | Fix scenario config, re-run at correct VU count |
| 100% failures from start (even at 1 VU) | **RERUN** | Server not running, DB not connected, or seed data wrong |
| Results from interrupted session | **RERUN** | Don't use data from laptop sleep / internet disconnect |
| k6 machine was CPU-bottlenecked | **RERUN** | Reduce VU count or add think time; re-run |

---

## Summary Report Template

After review, document findings in this format:

```
SPIKE TEST RESULTS
==================
Script: [name]
Spike Profile: [single/double], [baseline VUs] -> [spike VUs] in [ramp time]

SURVIVAL
========
Server survived spike: [YES / NO]
Server process crashed: [YES / NO]
Auto-restart worked: [YES / NO / N/A]

PERFORMANCE DURING SPIKE
=========================
p95 latency: [value] (threshold: 3000ms) [PASS/FAIL]
Error rate: [value] (threshold: 15%) [PASS/FAIL]
Peak throughput: [req/s]

RECOVERY
========
Recovery time to baseline p95: [X seconds]
Recovery classification: [Excellent/Acceptable/Marginal/Failed]
Error rate after recovery: [value]
Throughput after recovery: [vs baseline]

DOUBLE-SPIKE (if applicable)
=============================
Recovery 1 time: [X seconds]
Recovery 2 time: [X seconds]
Cumulative degradation: [YES / NO]

FINDINGS
========
- [Finding 1: e.g., "Server survives 500 VU spike, recovers in 25 seconds"]
- [Finding 2: e.g., "Connection pool exhaustion causes 45s drain after spike"]
- [Finding 3: e.g., "Second spike recovery takes 2x longer -- cumulative degradation"]

VERDICT: [PASS / PASS WITH FINDINGS / FAIL]
```

---

## Quality Checklist

### Script Quality
- [ ] Every script has author name/ID comment header
- [ ] All scripts pass `k6 inspect` without errors
- [ ] Smoke test passes at 1 VU (100% checks)
- [ ] Spike VU profile uses near-instant ramp (10s or less)
- [ ] Phase detection implemented and timestamps match stages
- [ ] Phase-tagged Trends exist (baseline, spike, recovery)
- [ ] No parallel scenarios unintentionally doubling VUs
- [ ] Null-body guards on all `r.json()` calls (extra critical for spikes)
- [ ] `handleSummary()` produces HTML + JSON
- [ ] Think time varies by phase
- [ ] Custom `Trend` metric per endpoint (granular reporting)

### Results Quality
- [ ] Tests ran under clean conditions (server up, DB connected, no interruptions)
- [ ] k6 machine was not CPU-bottlenecked during spike
- [ ] Baseline phase data is clean (0% errors, reasonable latency)
- [ ] Recovery phase was long enough to observe full recovery (or confirm non-recovery)
- [ ] HTML reports generated in `results/`
- [ ] JSON results exported in `results/`
- [ ] Phase-tagged metrics are present and correctly classified
- [ ] Any threshold failures are real performance findings, not test bugs
- [ ] VU count matches expected spike target (not accidentally doubled)

### Documentation
- [ ] README updated with contribution table (who did what, test type, scripts)
- [ ] Report includes: spike profile, survival, performance during spike, recovery time, findings
- [ ] Summary clearly states "Server survives/crashes at X VU spike, recovers in Y seconds"
- [ ] All scripts, results, and documentation committed to repo

---

## Approval

If all checklists pass -> **APPROVED** -- ready for submission.

If issues found:
- **REWORK** -> Implementer fixes specific issues (checks, guards, phase detection, seed data)
- **RERUN** -> Fix environment or VU config, re-run tests for clean results
- **REPLAN** -> Methodology problems (wrong spike profile, missing recovery phase, no baseline) -> back to Planner
