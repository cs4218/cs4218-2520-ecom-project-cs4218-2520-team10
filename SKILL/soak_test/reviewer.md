# Soak Test Reviewer - Verify Quality & Drift Analysis

**Review scripts, validate results, analyze drift, approve or request changes.**

---

## Pre-Execution Review (Before Running)

### 1. Script Validity

**Verify k6 can parse the script:**
```bash
k6 inspect tests/nft/soak-script.js
```
If it returns JSON options without errors, the script is syntactically valid.

### 2. Soak Configuration Check

**Verify the script is configured for soak testing, not load testing:**

| Check | Expected | Red Flag |
|-------|----------|----------|
| `SOAK_DURATION` env var | Used with `"1h"` default | Hardcoded duration |
| Ramp up | 2 minutes | < 30s (too aggressive for soak) |
| Hold stage | Uses `SOAK_DURATION` variable | Fixed short duration |
| Ramp down | 2 minutes | Missing (abrupt stop) |
| Target VUs | ~30 (moderate) | > 100 (that's stress, not soak) |
| Think time | 1-2s between requests | < 0.5s (hammering, not soaking) |
| Interval tagging | Present on requests | Missing (no drift detection possible) |

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
k6 run tests/nft/soak-script.js --duration 10s --vus 1
```

**Expected:** 100% checks passed, 0 errors.

| Smoke Result | Action |
|---|---|
| 100% checks, 0 errors | Proceed to short validation |
| Check failures at 1 VU | Script bug -- fix before any soak run |
| Connection refused | Server not running -- start it first |
| 10s timeouts | DB not connected -- check connection string |

### 5. Short Validation Run

```bash
SOAK_DURATION=5m k6 run tests/nft/soak-script.js
```

**Expected:** Stable metrics over ~9 minutes (2m ramp + 5m hold + 2m ramp down). No memory issues, no errors, interval tags appearing correctly.

| Validation Result | Action |
|---|---|
| Stable metrics, 0 errors | Proceed to full soak run |
| k6 memory climbing rapidly | High-cardinality tag issue -- fix before full run |
| Errors increasing over 5 min | Server issue -- investigate before committing to hours |
| Interval tags not appearing in output | Tagging code is wrong -- fix before full run |

---

## Post-Execution Review (After Running)

### 6. Validate Test Conditions

**Before trusting results from a multi-hour run, confirm clean conditions:**

- [ ] Server was running and connected to DB for the entire duration
- [ ] No machine sleep, internet disconnect, or power interruption
- [ ] No other heavy processes competing for CPU during the run
- [ ] Only one k6 test was running at a time
- [ ] Database had correct seed data throughout
- [ ] k6 process did not crash or restart during the run
- [ ] Test machine CPU stayed below 80% (k6 itself was not the bottleneck)

**If conditions were violated, results are invalid.** Soak test results from interrupted or resource-constrained runs cannot be used as evidence. Re-run.

### 7. Interpret Aggregate Results

**Read k6 output and classify each line:**

| Symbol | Meaning | Action |
|--------|---------|--------|
| Green check | Threshold passed | Verify it's meaningful (aggregate pass doesn't mean no drift) |
| Red cross | Threshold crossed | Investigate: sustained degradation or brief spike? |

### 8. Drift Analysis (Core of Soak Review)

**This is the most important step for soak tests.** Aggregate pass/fail is necessary but not sufficient. You must analyze whether metrics CHANGED over time.

#### 8.1 Compare First Interval vs Last Interval

Using the JSON results file, compare metrics from the first 15-minute interval against the last 15-minute interval:

| Metric | First Interval (0-15min) | Last Interval | Drift % | Verdict |
|--------|--------------------------|---------------|---------|---------|
| p95 latency (endpoint A) | Xms | Yms | ((Y-X)/X)*100 | See criteria below |
| p95 latency (endpoint B) | Xms | Yms | ((Y-X)/X)*100 | See criteria below |
| Error rate | X% | Y% | - | See criteria below |
| Throughput (req/s) | X | Y | ((Y-X)/X)*100 | See criteria below |

#### 8.2 Drift Criteria

| Drift Range | Verdict | Action |
|-------------|---------|--------|
| **< 10%** | **No degradation** | System is stable under sustained load |
| **10-20%** | **Marginal** | Acceptable for most systems. Note it but approve. |
| **20-50%** | **Concerning** | Investigate root cause. May indicate slow leak or growing dataset impact. Run extended soak to confirm trend. |
| **> 50%** | **Degradation confirmed** | Significant performance regression over time. Document as finding. |
| **Exponential increase** | **Critical** | Resource exhaustion in progress. System will eventually fail. |

#### 8.3 Error Rate Drift

Error accumulation pattern matters more than absolute count:

| Pattern | Meaning |
|---------|---------|
| **Constant low rate (0.1%)** | Normal -- some errors are expected over hours |
| **Linear increase (0.1% -> 0.5% -> 1%)** | Gradual degradation -- connection pool, memory pressure |
| **Sudden jump (0% for 2h, then 5%)** | Threshold crossed -- resource limit hit |
| **Exponential (0.1% -> 1% -> 10%)** | System failing -- critical degradation |

#### 8.4 Throughput Stability

| Pattern | Meaning |
|---------|---------|
| **Flat throughput** | System handling sustained load well |
| **Gradual decline** | Server slowing down -- processing takes longer per request |
| **Sudden drop** | Server hit a limit -- thread pool, connection pool, memory |
| **Oscillating** | GC pauses or auto-restarts masking a leak |

### 9. Distinguish Real Degradation from Test Artifacts

| Symptom | Real Degradation? | Test Artifact? |
|---------|-------------------|----------------|
| p95 increases 30% over 2 hours, steady upward trend | **Yes** -- consistent drift indicates a real issue | No |
| p95 spikes at hour 2, then returns to normal | Maybe -- brief resource contention | **Likely** -- GC pause, other process, network hiccup |
| p95 increases 30% but test machine CPU was at 95% | **Cannot determine** | **Likely** -- test machine was bottleneck, re-run on better hardware |
| Error rate jumps from 0% to 5% at hour 3 | **Yes** -- resource limit reached | No (unless network disconnected) |
| All metrics stable for 4 hours | No degradation | No (this is a valid clean result) |
| k6 itself consumed 4GB RAM by end of test | **Cannot trust results** | **Yes** -- k6 memory pressure affected timings |

### 10. Review Metrics

For each script, check:

| Metric | Location in Output | What's Good (Soak-Specific) |
|--------|-------------------|-------------|
| **Checks** | `checks` line | > 99% pass rate over full duration |
| **Error rate** | `http_req_failed` | < 1% AND not trending upward |
| **p95 latency** | Custom `Trend` per endpoint | Under threshold AND stable across intervals |
| **Throughput** | `http_reqs` / duration | Stable, not declining over time |
| **Iterations** | `iterations` | All completed, none interrupted |
| **VUs** | `vus_max` | Matches expected count (~30) |
| **Total writes** | `total_writes` counter (if applicable) | Matches expected data growth calculation |
| **Test duration** | Summary line | Matches expected duration (SOAK_DURATION + ramp) |

### 11. Verify Report Artifacts

- [ ] `results/<name>-report.html` exists and renders correctly in browser
- [ ] `results/<name>-results.json` exists and contains data
- [ ] JSON results are not excessively large (> 500MB suggests metric cardinality issue)
- [ ] Terminal output shows clear pass/fail for each threshold
- [ ] Interval-tagged metrics are present in JSON for drift analysis

---

## Decision Matrix

| Scenario | Decision | Action |
|----------|----------|--------|
| All thresholds pass, no drift detected (< 10%) | **APPROVE** | System is stable under sustained load |
| All thresholds pass, marginal drift (10-20%) | **APPROVE with note** | Acceptable but worth monitoring in production |
| Thresholds pass, concerning drift (20-50%) | **APPROVE with finding** | Document drift as a finding. Recommend investigation. |
| Thresholds pass, severe drift (> 50%) | **APPROVE with critical finding** | Document degradation. System has a time-dependent issue. |
| Thresholds fail, no drift | **APPROVE with finding** | Absolute performance issue (not soak-specific). Document it. |
| Thresholds fail, drift detected | **APPROVE with critical finding** | Both absolute and time-dependent issues. Highest priority. |
| Server crashed during soak | **RERUN** | Valid finding (document it), but re-run for complete data |
| k6 crashed or ran out of memory | **REWORK** | Fix metric cardinality or k6 configuration, then re-run |
| Test machine was resource-constrained | **RERUN** | Results cannot be trusted. Use better hardware or fewer VUs. |
| 100% failures from start | **REWORK** | Server not running, DB not connected, or seed data wrong |
| Results from interrupted session | **RERUN** | Don't use partial data from multi-hour interrupted runs |
| Checks failing but thresholds pass | **REWORK** | Fix check assertions (wrong response shape, missing null guard) |
| Write accumulation causing measurable read slowdown | **APPROVE with finding** | This is exactly what soak tests are designed to detect |

---

## Quality Checklist

### Script Quality
- [ ] Every script has author name/ID comment header
- [ ] All scripts pass `k6 inspect` without errors
- [ ] `SOAK_DURATION` configurable via environment variable with `"1h"` default
- [ ] VU profile is soak-appropriate (2m ramp, moderate VUs, 2m ramp down)
- [ ] Target VUs are moderate (~30), not stress-level
- [ ] Smoke test passes at 1 VU (100% checks)
- [ ] Short validation passes at `SOAK_DURATION=5m`
- [ ] Interval tagging implemented for drift detection
- [ ] No high-cardinality tags that could exhaust k6 memory
- [ ] Null-body guards with try/catch on all `r.json()` calls
- [ ] `handleSummary()` produces HTML + JSON
- [ ] Think time is generous (1-2s) for realistic sustained pacing
- [ ] Custom `Trend` metric per endpoint with interval tags
- [ ] Periodic console logging for progress visibility
- [ ] Write endpoints use unique IDs to avoid collisions

### Results Quality
- [ ] Tests ran under clean conditions for the entire duration
- [ ] Test machine was not resource-constrained (CPU < 80%)
- [ ] k6 itself did not run out of memory
- [ ] No interruptions during the multi-hour run
- [ ] HTML reports generated in `results/`
- [ ] JSON results exported in `results/`
- [ ] Drift analysis completed (first interval vs last interval compared)
- [ ] Any threshold failures are real performance findings, not test bugs
- [ ] VU count matches expected (~30, not accidentally doubled)
- [ ] Total test duration matches expected (SOAK_DURATION + ramp time)

### Drift Report
- [ ] Per-endpoint drift percentage calculated (first vs last interval)
- [ ] Error rate accumulation pattern identified (constant, linear, exponential)
- [ ] Throughput stability assessed (flat, declining, oscillating)
- [ ] Each finding classified by drift criteria (< 10%, 10-20%, 20-50%, > 50%)
- [ ] Root cause hypotheses documented for any significant drift
- [ ] Report states: "p95 drifted from Xms to Yms over Z hours" or "No degradation detected over Z hours"

### Documentation
- [ ] README updated with contribution table (who did what, test type, scripts)
- [ ] Report includes: test approach, soak configuration, drift analysis, findings
- [ ] Drift findings explicitly stated with numbers (not vague "seemed OK")
- [ ] All scripts, results, and documentation committed to repo

---

## Approval

If all checklists pass and drift is within acceptable range -> **APPROVED** -- ready for submission.

If issues found:
- **REWORK** -> Implementer fixes specific issues (k6 memory, tags, checks, guards)
- **RERUN** -> Fix environment or machine resources, re-run for clean results
- **REPLAN** -> Methodology problems (wrong VU count, missing drift detection, too-short duration) -> back to Planner
