# Load Test Reviewer - Verify Quality & Results

**Review scripts, validate results, approve or request changes.**

---

## Pre-Execution Review (Before Running)

### 1. Script Validity

**Verify k6 can parse the script:**
```bash
k6 inspect tests/nft/script-name.js
```
If it returns JSON options without errors, the script is syntactically valid.

### 2. Data Alignment

**Verify hardcoded seed data matches the actual database:**
```bash
# Check entities exist (should return 200, not 404)
curl -s -w "%{http_code}" http://localhost:<port>/api/v1/resource/known-slug

# Check test credentials work
curl -s -X POST http://localhost:<port>/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'
```

### 3. Smoke Test

```bash
k6 run tests/nft/script-name.js --duration 10s --vus 1
```

**Expected:** 100% checks passed, 0 errors.

| Smoke Result | Action |
|---|---|
| 100% checks, 0 errors | Proceed to full run |
| Check failures at 1 VU | Script bug — fix before full run (wrong response shape, bad seed data) |
| Connection refused | Server not running — start it first |
| 10s timeouts | DB not connected — check connection string |

---

## Post-Execution Review (After Running)

### 4. Validate Test Conditions

**Before trusting results, confirm clean conditions:**

- [ ] Server was running and connected to DB for entire test
- [ ] No laptop sleep, internet disconnect, or power interruption
- [ ] No other heavy processes competing for CPU
- [ ] Only one k6 test was running at a time
- [ ] Database had correct seed data throughout

**If conditions were violated, results are invalid.** Re-run.

### 5. Interpret Results

**Read k6 output and classify each line:**

| Symbol | Meaning | Action |
|--------|---------|--------|
| `✓` green | Threshold passed | No action |
| `✗` red | Threshold crossed | Investigate: real issue or test problem? |

### 6. Distinguish Real Failures from Test Problems

| Symptom | Real Performance Issue? | Test Problem? |
|---------|----------------------|---------------|
| p95 slightly over threshold (e.g., 505ms vs 500ms) | **Yes** — endpoint at capacity | No |
| p95 massively over (e.g., 4000ms vs 500ms) | Maybe — or internet was disconnected | **Check conditions** |
| 100% check failures, 0% status errors | No | **Yes** — wrong response shape in check |
| `connection refused` from start | No | **Yes** — server not started |
| `connection refused` mid-test | **Yes** — server crashed under load | Check if server was stable before test |
| `GoError: body is null` spam | Server dropped connections (valid if under load) | Missing null-body guard (if at low VUs) |
| 60s timeout on one endpoint | **Yes** — endpoint hangs | Or no data exists (e.g., photo with no image) |

### 7. Review Metrics

For each script, check:

| Metric | Location in Output | What's Good |
|--------|-------------------|-------------|
| **Checks** | `checks` line | 100% pass rate |
| **Error rate** | `http_req_failed` | 0% (or < 1%) |
| **p95 latency** | Custom `Trend` per endpoint | Under threshold |
| **Throughput** | `http_reqs` / duration | Stable, reasonable |
| **Iterations** | `iterations` | All completed, none interrupted |
| **VUs** | `vus_max` | Matches expected count (not doubled) |

### 8. Verify Report Artifacts

- [ ] `results/<name>-report.html` exists and renders correctly in browser
- [ ] `results/<name>-results.json` exists and contains data
- [ ] Terminal output shows clear pass/fail for each threshold

---

## Decision Matrix

| Scenario | Decision | Action |
|----------|----------|--------|
| All thresholds pass, 100% checks | **APPROVE** | Results are valid evidence |
| Thresholds pass, some checks fail | **REWORK** | Fix check assertions (wrong response shape, missing null guard) |
| Thresholds fail, 100% checks pass | **APPROVE with finding** | Real performance issue — document in report |
| Server crashed mid-test | **RERUN** | Valid finding (document it), but re-run for clean data |
| 100% failures from start | **RERUN** | Server not running, DB not connected, or seed data wrong |
| Results from interrupted session | **RERUN** | Don't use data from laptop sleep / internet disconnect |

---

## Quality Checklist

### Script Quality
- [ ] Every script has author name/ID comment header
- [ ] All scripts pass `k6 inspect` without errors
- [ ] Smoke test passes at 1 VU (100% checks)
- [ ] No parallel scenarios unintentionally doubling VUs
- [ ] Null-body guards on all `r.json()` calls
- [ ] `handleSummary()` produces HTML + JSON
- [ ] Think time between requests (realistic pacing)
- [ ] Custom `Trend` metric per endpoint (granular reporting)

### Results Quality
- [ ] Tests ran under clean conditions (server up, DB connected, no interruptions)
- [ ] HTML reports generated in `results/`
- [ ] JSON results exported in `results/`
- [ ] Any threshold failures are real performance findings, not test bugs
- [ ] VU count matches expected (not accidentally doubled)

### Documentation
- [ ] README updated with contribution table (who did what, test type, scripts)
- [ ] Report includes: test approach, configuration, statistics per script, findings
- [ ] All scripts, results, and documentation committed to repo

---

## Approval

If all checklists pass → **APPROVED** — ready for submission.

If issues found:
- **REWORK** → Implementer fixes specific issues (checks, guards, seed data)
- **RERUN** → Fix environment, re-run tests for clean results
- **REPLAN** → Methodology problems (wrong VU count, missing endpoints) → back to Planner
