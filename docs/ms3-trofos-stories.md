# MS3 TROFOS Stories — Non-Functional Testing

## Final Assignments

| Member | Student ID | Test Type | Tool |
|--------|-----------|-----------|------|
| **Kim Shi Tong** | A0265858J | Load Testing | Grafana k6 |
| **Yan Weidong** | A0258151H | Spike Testing | Grafana k6 |
| **Ong Chang Heng Bertrand** | A0253013X | Soak/Endurance Testing | Grafana k6 |
| **Shaun Lee Xuan Wei** | A0252626E | Stress Testing | Grafana k6 |

---

## Kim Shi Tong (A0265858J) — Load Testing

---

### Story 1

**Title:** [Load Test] k6 Environment Setup & Smoke Test

**Description:**
Set up Grafana k6 load testing infrastructure and validate with a smoke test.

1. Install k6 on local machine
   - Action: `brew install k6` (macOS), verify with `k6 version`.
   - Metric: k6 CLI runs successfully.

2. Create project test directory structure
   - Action: Create `tests/nft/` directory and `results/` directory for artifacts.
   - Metric: Directories exist and are tracked in Git.

3. Write and run a smoke test against the API
   - Action: Create `tests/nft/load-test.js` with 1 VU, 10s duration hitting `GET /api/v1/product/get-product`.
   - Metric: k6 completes with 0 errors and status 200 checks passing.

4. Configure HTML report generation
   - Action: Add `handleSummary()` using k6-reporter to export `results/load-test-report.html`.
   - Metric: HTML report file is generated after test run.

---

### Story 2

**Title:** [Load Test] Product & Category API Endpoints Under Expected Traffic

**Description:**
Write k6 load test scenarios for the core public-facing product and category endpoints, simulating expected user browsing traffic.

1. Load test — GET all products
   - Test Scenario: Ramp from 0 → 20 → 50 VUs over 3 min, hold at 50 VUs for 5 min, ramp down over 1 min. Each VU hits `GET /api/v1/product/get-product`.
   - Metric: p95 response time < 500ms, error rate < 1%.

2. Load test — GET categories
   - Test Scenario: Same VU profile. Each VU also hits `GET /api/v1/category/get-category` (loaded on every page via Header component).
   - Metric: p95 response time < 400ms, status 200 for all requests.

3. Load test — Paginated product list
   - Test Scenario: Each VU hits `GET /api/v1/product/product-list/:page` with random page 1–3.
   - Metric: p95 response time < 500ms, response contains product data.

4. Load test — Product search
   - Test Scenario: Each VU hits `GET /api/v1/product/search/:keyword` with random keywords (laptop, phone, book, shirt, camera).
   - Metric: p95 response time < 600ms (search uses regex on MongoDB — slower expected).

5. Load test — Product filters
   - Test Scenario: Each VU sends `POST /api/v1/product/product-filters` with `{ checked: [], radio: [0, 100] }`.
   - Metric: p95 response time < 500ms.

---

### Story 3

**Title:** [Load Test] Auth API Endpoints Under Expected Traffic

**Description:**
Extend the load test to include authentication endpoints, simulating concurrent user logins under normal traffic patterns.

1. Load test — Login endpoint
   - Test Scenario: At 50 VUs steady state, every 5th iteration sends `POST /api/v1/auth/login` with test credentials. bcrypt hashing is CPU-bound.
   - Metric: p95 response time < 800ms, no 500 errors.

2. Load test — Realistic user flow simulation
   - Test Scenario: Each VU follows a realistic browsing flow: browse categories → view products → search → occasionally login. Add 1s think time (sleep) between requests.
   - Metric: All endpoints maintain p95 < 500ms under combined load.

3. Load test — Per-endpoint URL tagging
   - Test Scenario: Tag each request with `{ tags: { name: 'products' } }`, `{ tags: { name: 'login' } }`, etc. for granular per-endpoint metrics.
   - Metric: k6 summary shows separate p95/p99 for each endpoint.

---

### Story 4

**Title:** [Load Test] Threshold Configuration & Results Analysis

**Description:**
Configure k6 thresholds for pass/fail criteria and analyze initial load test results to identify performance bottlenecks.

1. Set global thresholds
   - Action: Configure `http_req_duration: ['p(95)<500', 'p(99)<1000']` and `http_req_failed: ['rate<0.01']`.
   - Metric: k6 reports PASS or FAIL for each threshold.

2. Set per-endpoint thresholds
   - Action: Configure per-tag thresholds: products < 500ms, categories < 400ms, search < 600ms, login < 800ms.
   - Metric: Each endpoint has its own pass/fail status.

3. Run full load test and capture results
   - Action: Run `k6 run tests/nft/load-test.js`, capture terminal summary screenshot, export JSON results.
   - Metric: HTML report and JSON file generated in `results/`.

4. Analyze performance bottlenecks
   - Action: Identify which endpoint has the highest p95 latency. Document requests/sec throughput.
   - Metric: Written analysis of which endpoints are slowest and potential causes (e.g., search regex, bcrypt CPU).

---

### Story 5

**Title:** [Load Test] Bug Fixes, Final Reports & README Update

**Description:**
Fix any performance issues found during load testing, generate final reports, and prepare for ms3 submission.

1. Fix bugs discovered during load testing
   - Action: Investigate any endpoints returning 500 errors or timing out under load. Fix error handling or query optimization as needed.
   - Metric: Re-run load test — all thresholds pass, error rate < 1%.

2. Generate final load test report
   - Action: Run final load test with `K6_WEB_DASHBOARD=true`. Save HTML report, JSON results, and terminal summary screenshot.
   - Metric: `results/load-test-report.html` and `results/load-test-results.json` committed.

3. Add name and student ID comments
   - Action: Ensure `// Kim Shi Tong, A0265858J` comment is at the top of `tests/nft/load-test.js`.
   - Metric: Comment present and visible.

4. Update README.md with MS3 contribution
   - Action: Add MS3 table entry: test type (Load Testing), tool (Grafana k6), endpoints tested, key findings, bugs fixed.
   - Metric: README contains clear MS3 contribution for Kim Shi Tong.

5. Tag ms3 on GitHub
   - Action: Coordinate with team, `git tag ms3 && git push origin ms3`.
   - Metric: Tag exists on remote with all NFT artifacts included.

---
---

## Yan Weidong (A0258151H) — Spike Testing

---

### Story 1

**Title:** [Spike Test] k6 Environment Setup & Spike Profile Design

**Description:**
Set up k6 for spike testing and design the VU profile that simulates sudden, massive traffic surges (e.g., flash sale, viral post).

1. Install k6 and create test file
   - Action: Install k6, create `tests/nft/spike-test.js` with placeholder structure.
   - Metric: `k6 version` runs, file created.

2. Design spike VU profile
   - Action: Configure stages: baseline at 10 VUs (1 min) → instant jump to 500 VUs in 10s → hold 1 min → instant drop to 10 VUs in 10s → recovery observation 2 min → ramp down.
   - Metric: Stages configured with near-zero ramp-up/down (10s) to simulate real-world sudden surge.

3. Smoke test the spike script
   - Action: Run with scaled-down VUs (10 → 50 → 10) to verify script executes correctly.
   - Metric: k6 completes without script errors.

---

### Story 2

**Title:** [Spike Test] Product Browsing Endpoints Under Sudden Traffic Surge

**Description:**
Test product browsing endpoints (the most traffic-heavy pages) under a sudden spike simulating a flash sale scenario.

1. Spike test — GET all products
   - Test Scenario: Baseline at 10 VUs → instant surge to 500 VUs hitting `GET /api/v1/product/get-product`. Hold spike for 1 min. Drop back to 10 VUs.
   - Metric: Server survives spike without crashing. Measure error rate during spike vs baseline.

2. Spike test — GET categories
   - Test Scenario: Same spike profile. Each VU also hits `GET /api/v1/category/get-category`.
   - Metric: Response time during spike vs during recovery. Target: recovery p95 < 800ms.

3. Spike test — Product search under surge
   - Test Scenario: Each VU hits `GET /api/v1/product/search/:keyword` with random keywords during the spike. Regex search is DB-intensive.
   - Metric: Track how many search requests fail (status 500 or timeout) during the 500-VU spike.

4. Spike test — Paginated product list
   - Test Scenario: Each VU hits `GET /api/v1/product/product-list/:page` with random pages during spike.
   - Metric: p95 response time during spike, error rate.

---

### Story 3

**Title:** [Spike Test] Auth Endpoint Under Sudden Login Surge

**Description:**
Simulate a scenario where hundreds of users try to log in simultaneously (e.g., a flash sale starts and users rush to authenticate).

1. Spike test — Login endpoint under surge
   - Test Scenario: During the 500-VU spike, every 3rd iteration sends `POST /api/v1/auth/login` with test credentials. bcrypt is CPU-bound — likely the first endpoint to degrade.
   - Metric: Login response time during spike. Does the server queue or reject requests?

2. Spike test — Combined browsing + auth flow
   - Test Scenario: Simulate realistic spike: users arrive → browse products → try to log in → search for items. Minimal think time (0.3s) to simulate urgency.
   - Metric: Overall error rate during spike period. Which endpoint degrades first?

3. Spike test — Recovery after surge ends
   - Test Scenario: After spike drops from 500 → 10 VUs, continue making requests for 2 minutes.
   - Metric: How many seconds/iterations until p95 returns to baseline levels? Are there lingering errors after the spike ends?

---

### Story 4

**Title:** [Spike Test] Custom Metrics, Thresholds & Recovery Analysis

**Description:**
Configure spike-specific metrics to measure recovery time and compare baseline vs spike vs recovery performance.

1. Add custom spike metrics
   - Action: Create `Rate('spike_error_rate')` and `Trend('spike_response_time')` custom metrics. Track errors per phase.
   - Metric: Custom metrics appear in k6 summary and HTML report.

2. Configure phase-aware thresholds
   - Action: Set relaxed thresholds during spike (p95 < 3000ms, errors < 15%) but strict thresholds during baseline/recovery (p95 < 500ms for baseline, p95 < 800ms for recovery).
   - Metric: Thresholds pass for baseline/recovery phases.

3. Run full spike test and capture results
   - Action: Execute `K6_WEB_DASHBOARD=true k6 run tests/nft/spike-test.js`. Capture terminal screenshot, HTML report, JSON output.
   - Metric: Report clearly shows the spike impact on latency and error rate.

4. Document recovery time
   - Action: From the results, calculate how long after the spike ends it takes for p95 to return within 20% of baseline.
   - Metric: Recovery time documented in seconds.

---

### Story 5

**Title:** [Spike Test] Bug Fixes, Final Reports & README Update

**Description:**
Fix any crashes or issues found during spike testing, generate final reports, and prepare for ms3 submission.

1. Fix bugs discovered during spike testing
   - Action: Investigate server crashes during sudden surge. Fix connection handling, unhandled promise rejections, or timeouts. Address any errors that persist after spike ends (recovery failures).
   - Metric: Re-run spike test — server survives 500-VU spike without crashing.

2. Test additional spike patterns (optional)
   - Action: Try double-spike (two surges back-to-back) or varied spike levels (200, 500, 800 VUs).
   - Metric: Compare recovery behavior across patterns.

3. Generate final spike test report
   - Action: Run final spike test. Save HTML report, JSON results, and screenshot showing before/during/after spike metrics.
   - Metric: `results/spike-test-report.html` and `results/spike-test-results.json` committed.

4. Add name and student ID comments
   - Action: Ensure `// Yan Weidong, A0258151H` comment is at the top of `tests/nft/spike-test.js`.
   - Metric: Comment present and visible.

5. Update README.md with MS3 contribution
   - Action: Add MS3 table entry: test type (Spike Testing), tool (Grafana k6), endpoints tested, spike scenario, recovery time findings, bugs fixed.
   - Metric: README contains clear MS3 contribution for Yan Weidong.

---
---

## Shaun Lee Xuan Wei (A0252626E) — Stress Testing

---

### Story 1

**Title:** [Stress Test] k6 Environment Setup & Stress Profile Design

**Description:**
Set up k6 for stress testing and design the VU escalation profile to find the system's breaking point.

1. Install k6 and create test file
   - Action: Install k6, create `tests/nft/stress-test.js` with placeholder structure.
   - Metric: `k6 version` runs, file created.

2. Design stress escalation profile
   - Action: Configure stepped stages: 50 VUs (warm-up) → 100 → 200 → 300 → 400 → 500 VUs, each held for 2 min. Then ramp down to 0 over 2 min (recovery).
   - Metric: Profile covers a wide range from normal to well-beyond-capacity.

3. Smoke test the stress script
   - Action: Run with scaled-down stages (10 → 20 → 30) to verify script executes.
   - Metric: k6 completes without script errors.

---

### Story 2

**Title:** [Stress Test] Auth Endpoint Breaking Point Analysis

**Description:**
Stress test the login endpoint (bcrypt-heavy, CPU-bound) to find at what concurrency level it breaks.

1. Stress test — Login at 50 VUs
   - Test Scenario: 50 VUs each sending `POST /api/v1/auth/login` with test credentials.
   - Metric: Baseline p95 latency. Error rate should be ~0%.

2. Stress test — Login at 200 VUs
   - Test Scenario: Escalate to 200 VUs hitting login endpoint.
   - Metric: p95 latency and error rate. Check if bcrypt computation causes CPU saturation.

3. Stress test — Login at 400 VUs
   - Test Scenario: Escalate to 400 VUs hitting login.
   - Metric: Record at which VU count errors first appear (> 1%). Record at which VU count p95 exceeds 2s.

4. Stress test — Login at 500 VUs (extreme)
   - Test Scenario: Push to 500 VUs. Server may crash or refuse connections.
   - Metric: Does server crash, reject connections, or degrade gracefully? Record maximum error rate.

---

### Story 3

**Title:** [Stress Test] Product Search & Filter Endpoints Breaking Point

**Description:**
Stress test the search and filter endpoints (DB-intensive, regex queries) to find their breaking points.

1. Stress test — Search endpoint escalation
   - Test Scenario: Escalate from 50 → 100 → 200 → 300 → 400 VUs, each VU hitting `GET /api/v1/product/search/phone`. Regex search puts heavy load on MongoDB.
   - Metric: At which VU count does search p95 exceed 2s? At which VU count do 500 errors appear?

2. Stress test — Product filters escalation
   - Test Scenario: Same escalation profile. Each VU sends `POST /api/v1/product/product-filters` with filter payload `{ checked: [], radio: [0, 100] }`.
   - Metric: Breaking point VU count for filter endpoint.

3. Stress test — GET all products escalation
   - Test Scenario: Same escalation. Each VU hits `GET /api/v1/product/get-product` — tests basic DB read under extreme concurrency.
   - Metric: Breaking point VU count. Compare to search/filter breaking points.

4. Stress test — Combined endpoint load
   - Test Scenario: Mix all endpoints (login + search + filters + products) in a single VU iteration to simulate realistic combined stress.
   - Metric: Which endpoint breaks first under combined stress? Record the weakest link.

---

### Story 4

**Title:** [Stress Test] Custom Metrics, Recovery Tracking & Report Generation

**Description:**
Add custom metrics to precisely track the breaking point and measure recovery behavior after overload.

1. Add custom breaking-point metrics
   - Action: Create `Rate('custom_error_rate')`, `Trend('custom_login_duration')`, `Trend('custom_search_duration')` to track per-endpoint degradation separately.
   - Metric: Custom metrics visible in k6 summary.

2. Configure relaxed thresholds for stress testing
   - Action: Set `http_req_duration: ['p(95)<2000']` (relaxed), `http_req_failed: ['rate<0.15']` (allow some errors). Stress tests are expected to have failures.
   - Metric: Thresholds set appropriately — not too strict (would always fail), not too loose (meaningless).

3. Analyze recovery phase
   - Action: After peak VUs (500), ramp down to 0 over 2 min. Track whether response times return to baseline during ramp-down.
   - Metric: Document recovery behavior — does system recover gracefully or remain degraded?

4. Run full stress test and capture results
   - Action: Execute `K6_WEB_DASHBOARD=true k6 run tests/nft/stress-test.js`. Capture screenshots, HTML report, JSON output.
   - Metric: Report clearly shows the escalation pattern and breaking point.

---

### Story 5

**Title:** [Stress Test] Bug Fixes, Final Reports & README Update

**Description:**
Fix any crashes or errors found during stress testing, generate final reports, and prepare for ms3 submission.

1. Fix bugs discovered during stress testing
   - Action: Investigate server crashes at high VU counts. Fix unhandled errors under extreme concurrency. Address connection pool exhaustion or memory issues. Fix any error handling that returns 500 instead of graceful degradation.
   - Metric: Re-run stress test — server degrades gracefully instead of crashing.

2. Generate final stress test report
   - Action: Run final stress test. Save HTML report, JSON results, and terminal summary screenshot showing escalation and breaking point.
   - Metric: `results/stress-test-report.html` and `results/stress-test-results.json` committed.

3. Document breaking point analysis
   - Action: Create a summary: "Login breaks at X VUs, Search breaks at Y VUs, Filters break at Z VUs. Server max throughput is N req/s."
   - Metric: Clear breaking point data documented.

4. Add name and student ID comments
   - Action: Ensure `// Shaun Lee Xuan Wei, A0252626E` comment is at the top of `tests/nft/stress-test.js`.
   - Metric: Comment present and visible.

5. Update README.md with MS3 contribution
   - Action: Add MS3 table entry: test type (Stress Testing), tool (Grafana k6), endpoints tested, breaking points found, bugs fixed.
   - Metric: README contains clear MS3 contribution for Shaun Lee Xuan Wei.

---
---

## Ong Chang Heng Bertrand (A0253013X) — Soak/Endurance Testing

---

### Story 1

**Title:** [Soak Test] k6 Environment Setup & Soak Profile Design

**Description:**
Set up k6 for soak/endurance testing and design the long-duration VU profile to detect gradual degradation over time.

1. Install k6 and create test file
   - Action: Install k6, create `tests/nft/soak-test.js` with placeholder structure.
   - Metric: `k6 version` runs, file created.

2. Design soak test VU profile
   - Action: Configure stages: ramp to 30 VUs over 2 min → hold steady at 30 VUs for extended duration (configurable: 30 min for dev, 1–4 hours for full runs) → ramp down over 2 min. Use `__ENV.SOAK_DURATION` for configurability.
   - Metric: Profile holds steady at moderate load for extended period — key difference from other test types.

3. Smoke test the soak script (short run)
   - Action: Run with 5-min hold duration to verify script executes end-to-end without errors.
   - Metric: k6 completes, HTML report generated.

---

### Story 2

**Title:** [Soak Test] Product & Category Endpoints Under Sustained Load

**Description:**
Test core product and category endpoints under sustained moderate load to detect performance degradation, memory leaks, or connection pool exhaustion over time.

1. Soak test — GET all products (sustained)
   - Test Scenario: 30 VUs hitting `GET /api/v1/product/get-product` continuously for 1 hour with 2s sleep between iterations.
   - Metric: Compare p95 at 15-min mark vs 30-min mark vs 60-min mark. Should remain stable (< 600ms).

2. Soak test — GET categories (sustained)
   - Test Scenario: Same soak profile. Each VU hits `GET /api/v1/category/get-category`.
   - Metric: p95 latency should not increase over time. Error rate stays < 1% throughout.

3. Soak test — Paginated product list (sustained)
   - Test Scenario: Each VU hits `GET /api/v1/product/product-list/:page` with random page numbers.
   - Metric: Response time stability over the full duration.

4. Soak test — Product search (sustained)
   - Test Scenario: Every 3rd iteration hits `GET /api/v1/product/search/:keyword` with varied keywords. Regex search uses DB resources that may accumulate.
   - Metric: Search latency should not drift upward over time.

---

### Story 3

**Title:** [Soak Test] Auth Endpoint & Mixed Workload Sustained Load

**Description:**
Add authentication and mixed workload to the soak test, simulating periodic logins and varied operations over hours.

1. Soak test — Periodic login
   - Test Scenario: Every 10th iteration, VU sends `POST /api/v1/auth/login`. Simulates users re-authenticating over hours. bcrypt CPU usage should remain constant.
   - Metric: Login p95 at start vs after 1 hour. No upward drift expected.

2. Soak test — Mixed realistic workload
   - Test Scenario: Each VU follows: browse products → browse categories → occasionally search → occasionally login. 2s think time for realistic pacing.
   - Metric: Overall iteration time tracked with custom `Trend('soak_iteration_duration')`. Should remain stable.

3. Soak test — Total request counting
   - Test Scenario: Use custom `Counter('soak_total_requests')` to track total requests served over the entire soak duration.
   - Metric: Verify throughput (req/s) is consistent from start to finish — no gradual slowdown.

---

### Story 4

**Title:** [Soak Test] Degradation Detection, Thresholds & Report Generation

**Description:**
Configure strict thresholds that must hold over the entire duration, and set up reporting for time-series analysis.

1. Set strict long-duration thresholds
   - Action: Configure `http_req_duration: ['p(95)<600', 'p(99)<1200']` and `http_req_failed: ['rate<0.01']`. These must hold for the full duration — any late-stage degradation means failure.
   - Metric: Thresholds remain PASS even at the end of a 1-hour run.

2. Configure HTML and JSON report generation
   - Action: Add `handleSummary()` to export `results/soak-test-report.html` and `results/soak-test-results.json`.
   - Metric: Report files generated after test run.

3. Execute 30-minute soak test
   - Action: Run abbreviated soak (30 min) to validate everything works. Compare early vs late metrics.
   - Metric: No degradation detected in 30-min run.

4. Execute full 1-hour (or longer) soak test
   - Action: Run `k6 run -e SOAK_DURATION=1h tests/nft/soak-test.js`. Monitor system resources (CPU, memory) during the run.
   - Metric: p95 at 60 min is within 20% of p95 at 5 min. Error rate stays < 1%.

---

### Story 5

**Title:** [Soak Test] Bug Fixes, Final Reports & README Update

**Description:**
Fix any degradation issues found during soak testing, generate final reports, and prepare for ms3 submission.

1. Fix bugs discovered during soak testing
   - Action: Investigate any memory leaks (Node.js heap growth), MongoDB connection pool exhaustion, or gradual latency increase. Fix resource management issues. Address any error accumulation over time.
   - Metric: Re-run soak test — no degradation detected over 1 hour.

2. Generate final soak test report
   - Action: Run final soak test (1 hour minimum). Save HTML report, JSON results, terminal summary screenshot. Document p95 at 15-min intervals.
   - Metric: `results/soak-test-report.html` and `results/soak-test-results.json` committed.

3. Document degradation analysis
   - Action: Create summary: "After 1 hour at 30 VUs: p95 started at Xms, ended at Yms. Error rate: Z%. Total requests served: N. Degradation: [none/mild/significant]."
   - Metric: Clear degradation analysis documented.

4. Add name and student ID comments
   - Action: Ensure `// Ong Chang Heng Bertrand, A0253013X` comment is at the top of `tests/nft/soak-test.js`.
   - Metric: Comment present and visible.

5. Update README.md with MS3 contribution
   - Action: Add MS3 table entry: test type (Soak/Endurance Testing), tool (Grafana k6), endpoints tested, duration, degradation findings, bugs fixed.
   - Metric: README contains clear MS3 contribution for Ong Chang Heng Bertrand.
