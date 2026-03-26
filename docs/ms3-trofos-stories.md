# MS3 TROFOS Stories — Non-Functional Testing

## Assignments

| Member | Student ID | Test Type | Tool |
|--------|-----------|-----------|------|
| **Kim Shi Tong** | A0265858J | Load Testing | Grafana k6 |
| **Yan Weidong** | A0258151H | Spike Testing | Grafana k6 |
| **Shaun Lee Xuan Wei** | A0252626E | Stress Testing | Grafana k6 |
| **Ong Chang Heng Bertrand** | A0253013X | Soak/Endurance Testing | Grafana k6 |

---

## Kim Shi Tong (A0265858J) — Load Testing

### Story 1

**Title:** [Load Test] Product Browsing API Under Expected Traffic

**Description:**
Proposed k6 Load Test (load-product-browsing.js):

1. Load test GET all products at 50 VUs
   - Test Scenario: Ramp from 0 → 20 → 50 VUs over 3 min, hold at 50 VUs for 5 min, ramp down over 1 min. Each VU sends `GET /api/v1/product/get-product`.
   - Assertion: p95 response time < 500ms. Error rate < 1%. Response body contains `products` array.

2. Load test paginated product list at 50 VUs
   - Test Scenario: Same VU profile. Each VU sends `GET /api/v1/product/product-list/:page` with random page (1–3).
   - Assertion: p95 < 500ms. Status 200 for all requests.

3. Load test single product detail at 50 VUs
   - Test Scenario: Each VU sends `GET /api/v1/product/get-product/:slug` using known product slugs.
   - Assertion: p95 < 500ms. Response contains product name and description.

4. Load test product count at 50 VUs
   - Test Scenario: Each VU sends `GET /api/v1/product/product-count`.
   - Assertion: p95 < 300ms. Response contains `total` count.

---

### Story 2

**Title:** [Load Test] Search & Filter API Under Expected Traffic

**Description:**
Proposed k6 Load Test (load-search-filter.js):

1. Load test product search at 50 VUs
   - Test Scenario: 50 VUs steady state. Each VU sends `GET /api/v1/product/search/:keyword` with random keywords (laptop, phone, book, shirt, camera). Search uses regex on MongoDB.
   - Assertion: p95 < 600ms (slower due to regex). Error rate < 1%.

2. Load test product filters at 50 VUs
   - Test Scenario: 50 VUs steady state. Each VU sends `POST /api/v1/product/product-filters` with `{ checked: [], radio: [0, 100] }`.
   - Assertion: p95 < 500ms. Response contains filtered products array.

3. Load test category-wise product listing at 50 VUs
   - Test Scenario: 50 VUs. Each VU sends `GET /api/v1/product/product-category/:slug` using known category slugs.
   - Assertion: p95 < 500ms. Status 200.

4. Load test related products at 50 VUs
   - Test Scenario: 50 VUs. Each VU sends `GET /api/v1/product/related-product/:pid/:cid` using known product and category IDs.
   - Assertion: p95 < 500ms. Response returns related products.

---

### Story 3

**Title:** [Load Test] Auth & Category API Under Expected Traffic

**Description:**
Proposed k6 Load Test (load-auth-category.js):

1. Load test login endpoint at 50 VUs
   - Test Scenario: 50 VUs steady state. Each VU sends `POST /api/v1/auth/login` with test credentials. bcrypt hashing is CPU-bound — tests server CPU capacity at expected load.
   - Assertion: p95 < 800ms (bcrypt is inherently slow). No 500 errors.

2. Load test get all categories at 50 VUs
   - Test Scenario: 50 VUs. Each VU sends `GET /api/v1/category/get-category`. This endpoint is called on every page load (Header component).
   - Assertion: p95 < 400ms (lightweight query). Error rate 0%.

3. Load test single category at 50 VUs
   - Test Scenario: 50 VUs. Each VU sends `GET /api/v1/category/single-category/:slug` with known slugs.
   - Assertion: p95 < 400ms. Response contains category data.

4. Load test register endpoint at 50 VUs
   - Test Scenario: 50 VUs. Each VU sends `POST /api/v1/auth/register` with unique generated emails (using VU id + iteration). Tests write concurrency.
   - Assertion: p95 < 1000ms. No 500 errors.

---

### Story 4

**Title:** [Load Test] Realistic User Journey Simulation

**Description:**
Proposed k6 Load Test (load-user-journey.js):

1. Simulate full browsing journey at 50 VUs
   - Test Scenario: Each VU follows a realistic flow: `GET /api/v1/category/get-category` → `GET /api/v1/product/get-product` → `GET /api/v1/product/search/laptop` → `GET /api/v1/product/get-product/:slug` → `POST /api/v1/auth/login`. 1s think time between requests.
   - Assertion: Full iteration completes in < 5s. Overall p95 < 500ms.

2. Simulate returning user journey at 50 VUs
   - Test Scenario: Each VU: login → browse categories → filter products → view paginated list → view product detail. 1s sleep between requests.
   - Assertion: End-to-end journey completes. All endpoints return 200.

3. Throughput measurement at 50 VUs
   - Test Scenario: Run the full journey for 5 min at steady 50 VUs. Measure total requests/sec the server can sustain.
   - Assertion: Throughput ≥ 100 req/s. No throughput degradation over the 5-min window.

4. Per-endpoint latency comparison at 50 VUs
   - Test Scenario: Tag each request with endpoint name (`{ tags: { name: 'products' } }`) for granular reporting. Run full journey test.
   - Assertion: Each endpoint stays under its individual threshold. Report ranks endpoints from fastest to slowest.

---

### Story 5

**Title:** [Load Test] Concurrent Read-Write Mixed Workload

**Description:**
Proposed k6 Load Test (load-mixed-workload.js):

1. Mixed read + write at 50 VUs
   - Test Scenario: 80% of VU iterations are read-only (GET products, categories, search). 20% are write operations (POST login, POST filters). Simulates realistic read-heavy e-commerce traffic.
   - Assertion: Read p95 < 500ms. Write p95 < 800ms. Combined error rate < 1%.

2. Concurrent product photo requests at 50 VUs
   - Test Scenario: 50 VUs each requesting `GET /api/v1/product/product-photo/:pid`. Photo endpoint returns binary data — tests I/O and bandwidth under load.
   - Assertion: p95 < 1000ms. No 500 errors. Response content-type is image/*.

3. Multiple paginated pages at 50 VUs
   - Test Scenario: 50 VUs each cycling through pages 1, 2, 3 of `GET /api/v1/product/product-list/:page`. Tests consistent pagination performance.
   - Assertion: All pages respond < 500ms. Page 3 latency is not significantly worse than page 1.

4. Sustained 50-VU throughput over 10 minutes
   - Test Scenario: Hold the full mixed workload at 50 VUs for 10 min. This is the final comprehensive load test.
   - Assertion: All thresholds pass for the full duration. HTML report generated. JSON results exported.

---
---

## Yan Weidong (A0258151H) — Spike Testing

### Story 1

**Title:** [Spike Test] Product Browsing Under Sudden Traffic Surge

**Description:**
Proposed k6 Spike Test (spike-product-browsing.js):

1. Spike test GET all products — baseline then surge
   - Test Scenario: Baseline at 10 VUs for 1 min → instant jump to 500 VUs in 10s → hold at 500 for 1 min → instant drop to 10 VUs → observe 2 min recovery. Each VU hits `GET /api/v1/product/get-product`.
   - Assertion: Server does not crash during surge. Error rate during spike < 15%. Recovery p95 returns to within 20% of baseline within 30s of spike ending.

2. Spike test paginated product list — sudden surge
   - Test Scenario: Same spike profile (10 → 500 → 10 VUs). Each VU hits `GET /api/v1/product/product-list/:page` with random pages.
   - Assertion: Pagination still works during spike. p95 during recovery < 800ms.

3. Spike test product detail — sudden surge
   - Test Scenario: Same spike profile. Each VU hits `GET /api/v1/product/get-product/:slug`.
   - Assertion: Product details still load during peak. No data corruption in responses.

4. Spike test product count — sudden surge
   - Test Scenario: Same spike profile. Each VU hits `GET /api/v1/product/product-count`.
   - Assertion: Count endpoint stays responsive (lightweight query should survive spike).

---

### Story 2

**Title:** [Spike Test] Search & Filter Under Flash Sale Scenario

**Description:**
Proposed k6 Spike Test (spike-search-filter.js):

1. Spike test product search — flash sale rush
   - Test Scenario: 10 VUs baseline → instant surge to 500 VUs → each VU searches `GET /api/v1/product/search/:keyword` with keywords (laptop, phone, headphones, tablet). Regex search is DB-intensive.
   - Assertion: Search endpoint survives the spike without crashing. Track how many requests timeout or return 500.

2. Spike test product filters — flash sale rush
   - Test Scenario: Same spike profile. Each VU sends `POST /api/v1/product/product-filters` with `{ checked: [], radio: [0, 100] }`.
   - Assertion: Filter endpoint responds during spike. p95 during recovery < 1s.

3. Spike test category-wise products — flash sale rush
   - Test Scenario: Same spike profile. Each VU hits `GET /api/v1/product/product-category/:slug`.
   - Assertion: Category filtering works under sudden surge.

4. Recovery measurement after search spike
   - Test Scenario: After spike drops from 500 → 10 VUs, track search response time every 5s for 2 min.
   - Assertion: Search p95 returns to baseline level within 60 seconds of spike ending.

---

### Story 3

**Title:** [Spike Test] Auth Endpoints Under Sudden Login Surge

**Description:**
Proposed k6 Spike Test (spike-auth.js):

1. Spike test login — hundreds of users logging in at once
   - Test Scenario: 10 VUs baseline → instant jump to 500 VUs → each VU sends `POST /api/v1/auth/login`. bcrypt is CPU-bound — this is the most likely endpoint to degrade during a spike.
   - Assertion: Server stays alive during login spike. Record max response time. Track how many login requests fail (timeout or 500).

2. Spike test register — mass registration surge
   - Test Scenario: Same spike profile. Each VU sends `POST /api/v1/auth/register` with unique generated emails.
   - Assertion: Registration works during spike. No duplicate user errors caused by race conditions.

3. Spike test forgot-password — surge scenario
   - Test Scenario: Same spike profile. Each VU sends `POST /api/v1/auth/forgot-password` with test data.
   - Assertion: Endpoint handles concurrent requests without crashing.

4. Login recovery after spike
   - Test Scenario: After spike ends (500 → 10 VUs), measure login response time during the 2-min recovery window.
   - Assertion: Login p95 returns to < 1s within 60 seconds. No lingering errors after spike.

---

### Story 4

**Title:** [Spike Test] Full User Journey Under Sudden Surge

**Description:**
Proposed k6 Spike Test (spike-user-journey.js):

1. Spike test realistic user flow — flash sale simulation
   - Test Scenario: Baseline 10 VUs → instant spike to 500 VUs. Each VU follows: `GET categories` → `GET products` → `GET search/laptop` → `POST login` → `GET product-list/1`. 0.3s think time (users are rushing).
   - Assertion: Full journey completes during spike (even if slow). Server does not crash.

2. Compare per-endpoint impact during spike
   - Test Scenario: Tag each request with endpoint name. Run the full spike. Compare which endpoint degrades the most.
   - Assertion: Identify the bottleneck endpoint (expected: login due to bcrypt, or search due to regex).

3. Double-spike test — two surges back-to-back
   - Test Scenario: 10 VUs → spike to 500 → drop to 10 → wait 1 min → spike to 500 again → drop to 10 → recovery.
   - Assertion: Server handles the second spike as well as the first. Second recovery time ≤ first recovery time.

4. Graduated spike test — different surge levels
   - Test Scenario: Test at spike levels 200, 500, and 800 VUs (separate runs). Compare error rate and recovery time across levels.
   - Assertion: Document the max spike level the server can survive without crashing.

---

### Story 5

**Title:** [Spike Test] Category & Lightweight Endpoints Under Surge

**Description:**
Proposed k6 Spike Test (spike-categories-lightweight.js):

1. Spike test GET all categories — sudden surge
   - Test Scenario: 10 VUs → instant jump to 500 VUs. Each VU hits `GET /api/v1/category/get-category`. Lightweight query — should be more resilient.
   - Assertion: p95 during spike < 1s. Error rate < 5%. This is the "control" — if categories fail, everything else will too.

2. Spike test single category — sudden surge
   - Test Scenario: Same spike profile. Each VU hits `GET /api/v1/category/single-category/:slug`.
   - Assertion: Single category lookup survives spike. p95 < 1s during spike.

3. Spike test related products — sudden surge
   - Test Scenario: Same spike profile. Each VU hits `GET /api/v1/product/related-product/:pid/:cid`.
   - Assertion: Related products endpoint handles spike without 500 errors.

4. Spike test product photo — sudden surge
   - Test Scenario: Same spike profile. Each VU hits `GET /api/v1/product/product-photo/:pid`. Binary data transfer under extreme concurrency.
   - Assertion: Photo endpoint survives spike. Record bandwidth usage and timeout rate.

---
---

## Shaun Lee Xuan Wei (A0252626E) — Stress Testing

### Story 1

**Title:** [Stress Test] Auth Endpoint Breaking Point Analysis

**Description:**
Proposed k6 Stress Test (stress-auth.js):

1. Stress test login — escalate from 50 to 500 VUs
   - Test Scenario: Stages: 50 VUs (2 min) → 100 VUs (2 min) → 200 VUs (2 min) → 300 VUs (2 min) → 400 VUs (2 min) → 500 VUs (1 min) → ramp down (2 min). Each VU sends `POST /api/v1/auth/login`.
   - Assertion: Record p95 latency at each stage. Identify the VU count where errors first exceed 1%. Identify the VU count where p95 exceeds 2s.

2. Stress test login — breaking point identification
   - Test Scenario: Same escalation. Track custom `Rate('login_error_rate')` at each stage.
   - Assertion: Document exact breaking point: "Login breaks at X VUs (error rate > 5%)."

3. Stress test register — escalate to 300 VUs
   - Test Scenario: Escalate to 300 VUs, each sending `POST /api/v1/auth/register` with unique emails.
   - Assertion: No duplicate user creation from race conditions. Identify breaking point.

4. Stress test forgot-password — escalate to 300 VUs
   - Test Scenario: Escalate to 300 VUs hitting `POST /api/v1/auth/forgot-password`.
   - Assertion: Endpoint doesn't crash. Document error rate at each VU level.

---

### Story 2

**Title:** [Stress Test] Product Search & Filter Breaking Point

**Description:**
Proposed k6 Stress Test (stress-search-filter.js):

1. Stress test search — escalate from 50 to 500 VUs
   - Test Scenario: Same stepped escalation (50 → 100 → 200 → 300 → 400 → 500). Each VU hits `GET /api/v1/product/search/phone`. Regex search is DB-intensive.
   - Assertion: Record at which VU count search p95 exceeds 2s. Record at which VU count 500 errors appear.

2. Stress test filters — escalate from 50 to 500 VUs
   - Test Scenario: Same escalation. Each VU sends `POST /api/v1/product/product-filters` with `{ checked: [], radio: [0, 100] }`.
   - Assertion: Document filter breaking point. Compare to search breaking point.

3. Stress test search with varied keywords
   - Test Scenario: Escalate to 400 VUs. Each VU searches with different keywords (laptop, phone, book, shirt, camera, headphones) — tests regex across different data sets.
   - Assertion: Breaking point does not vary significantly by keyword.

4. Compare search vs filter breaking points
   - Test Scenario: Run both search and filter in the same VU iteration under escalation.
   - Assertion: Document which breaks first. Search (regex) expected to break before filters.

---

### Story 3

**Title:** [Stress Test] Product Browsing Endpoints Breaking Point

**Description:**
Proposed k6 Stress Test (stress-product-browsing.js):

1. Stress test GET all products — escalate to 500 VUs
   - Test Scenario: Stepped escalation from 50 → 500 VUs. Each VU hits `GET /api/v1/product/get-product`.
   - Assertion: Record breaking point for basic DB read. This should break later than search/login.

2. Stress test paginated list — escalate to 500 VUs
   - Test Scenario: Same escalation. Each VU hits `GET /api/v1/product/product-list/:page`.
   - Assertion: Document breaking point for pagination. Compare to GET all products.

3. Stress test product photo — escalate to 300 VUs
   - Test Scenario: Escalate to 300 VUs. Each VU requests `GET /api/v1/product/product-photo/:pid`. Binary data under stress tests I/O and bandwidth limits.
   - Assertion: Record at which VU count photo requests start timing out.

4. Stress test product count — escalate to 500 VUs
   - Test Scenario: Same escalation. Each VU hits `GET /api/v1/product/product-count`. Lightweight aggregation query.
   - Assertion: Should survive to higher VU counts than other endpoints. Document the threshold.

---

### Story 4

**Title:** [Stress Test] Combined API Workload Breaking Point

**Description:**
Proposed k6 Stress Test (stress-combined.js):

1. Stress test combined workload — all endpoints mixed
   - Test Scenario: Escalate from 50 → 500 VUs. Each VU iteration hits: login + search + filters + get products + categories. This simulates realistic combined stress on all server resources.
   - Assertion: Identify which endpoint breaks first under combined load. Record combined breaking point.

2. Stress test read-heavy workload at 400 VUs
   - Test Scenario: 400 VUs, 90% reads (products, categories, search) + 10% writes (login, filters).
   - Assertion: Read performance under extreme concurrency. p95 for reads tracked separately.

3. Stress test write-heavy workload at 200 VUs
   - Test Scenario: 200 VUs, 50% writes (login, register, filters) + 50% reads. Tests DB write concurrency.
   - Assertion: No data corruption. Document write endpoint breaking points.

4. Stress test with zero think time at 300 VUs
   - Test Scenario: 300 VUs with no `sleep()` — maximum request rate. Hammers the server as fast as possible.
   - Assertion: Find absolute maximum req/s the server can handle. Record at what req/s errors begin.

---

### Story 5

**Title:** [Stress Test] Category & Recovery Behavior Under Extreme Load

**Description:**
Proposed k6 Stress Test (stress-category-recovery.js):

1. Stress test GET all categories — escalate to 500 VUs
   - Test Scenario: Stepped escalation from 50 → 500 VUs. Each VU hits `GET /api/v1/category/get-category`.
   - Assertion: Categories (simple DB query) should break at a higher VU count than login/search. Document the ceiling.

2. Stress test single category — escalate to 500 VUs
   - Test Scenario: Same escalation. Each VU hits `GET /api/v1/category/single-category/:slug`.
   - Assertion: Document single-category breaking point.

3. Recovery test — ramp down from 500 to 0 VUs
   - Test Scenario: After reaching 500 VUs, ramp down to 0 over 2 min. Track response time and error rate during the ramp-down phase.
   - Assertion: Server recovers gracefully. p95 returns to baseline levels. No lingering 500 errors after load drops.

4. Recovery test — immediate drop from 400 to 10 VUs
   - Test Scenario: Hold at 400 VUs for 2 min then instantly drop to 10 VUs. Monitor recovery behavior for 2 min.
   - Assertion: Server resumes normal operation within 30s. Error rate drops to 0% within 60s.

---
---

## Ong Chang Heng Bertrand (A0253013X) — Soak/Endurance Testing

### Story 1

**Title:** [Soak Test] Product Browsing Stability Over Extended Duration

**Description:**
Proposed k6 Soak Test (soak-product-browsing.js):

1. Soak test GET all products — 1 hour at 30 VUs
   - Test Scenario: Ramp to 30 VUs over 2 min → hold at 30 VUs for 1 hour → ramp down over 2 min. Each VU hits `GET /api/v1/product/get-product` with 2s sleep.
   - Assertion: p95 at 60-min mark is within 20% of p95 at 5-min mark. No latency drift. Error rate stays < 1% throughout.

2. Soak test paginated product list — 1 hour at 30 VUs
   - Test Scenario: Same soak profile. Each VU hits `GET /api/v1/product/product-list/:page` with random pages.
   - Assertion: Pagination performance remains stable. No increasing latency over time.

3. Soak test product detail — 1 hour at 30 VUs
   - Test Scenario: Same profile. Each VU hits `GET /api/v1/product/get-product/:slug`.
   - Assertion: Detail endpoint p95 remains stable over full duration.

4. Soak test product count — 1 hour at 30 VUs
   - Test Scenario: Same profile. Each VU hits `GET /api/v1/product/product-count`.
   - Assertion: Count remains consistent (no phantom data accumulation). Latency stable.

---

### Story 2

**Title:** [Soak Test] Search & Filter Stability Over Extended Duration

**Description:**
Proposed k6 Soak Test (soak-search-filter.js):

1. Soak test product search — 1 hour at 30 VUs
   - Test Scenario: 30 VUs for 1 hour. Every 3rd iteration hits `GET /api/v1/product/search/:keyword` with varied keywords (laptop, phone, book, shirt). Regex queries may cause MongoDB memory accumulation over time.
   - Assertion: Search p95 at 60 min is within 20% of p95 at 5 min. No memory-related degradation.

2. Soak test product filters — 1 hour at 30 VUs
   - Test Scenario: Same soak profile. Each VU sends `POST /api/v1/product/product-filters` with `{ checked: [], radio: [0, 100] }`.
   - Assertion: Filter response time stays stable. Error rate 0% over full duration.

3. Soak test category-wise product listing — 1 hour at 30 VUs
   - Test Scenario: Each VU hits `GET /api/v1/product/product-category/:slug`.
   - Assertion: No degradation over time for category-product queries.

4. Soak test related products — 1 hour at 30 VUs
   - Test Scenario: Each VU hits `GET /api/v1/product/related-product/:pid/:cid`.
   - Assertion: Related product lookup remains performant. No connection pool exhaustion.

---

### Story 3

**Title:** [Soak Test] Auth & Category Stability Over Extended Duration

**Description:**
Proposed k6 Soak Test (soak-auth-category.js):

1. Soak test login — periodic auth over 1 hour
   - Test Scenario: 30 VUs for 1 hour. Every 10th iteration sends `POST /api/v1/auth/login`. bcrypt CPU usage should remain constant (no accumulation).
   - Assertion: Login p95 at 60 min equals p95 at 5 min (±10%). CPU doesn't saturate over time.

2. Soak test GET all categories — 1 hour at 30 VUs
   - Test Scenario: Each VU hits `GET /api/v1/category/get-category` every iteration. This endpoint is called on every page load in the app.
   - Assertion: Categories p95 remains < 400ms for the entire hour. Zero errors.

3. Soak test single category — 1 hour at 30 VUs
   - Test Scenario: Each VU hits `GET /api/v1/category/single-category/:slug` with known slugs.
   - Assertion: Stable latency throughout. No connection issues.

4. Soak test register with periodic writes — 1 hour
   - Test Scenario: Every 20th iteration sends `POST /api/v1/auth/register` with unique emails. Tests slow write accumulation over time.
   - Assertion: Write latency doesn't increase as the users collection grows during the test.

---

### Story 4

**Title:** [Soak Test] Realistic User Journey Over Extended Duration

**Description:**
Proposed k6 Soak Test (soak-user-journey.js):

1. Soak test full browsing journey — 1 hour at 30 VUs
   - Test Scenario: Each VU follows: `GET categories` → `GET products` → `GET search/laptop` → `GET product-list/1` → `POST login` (every 10th iter). 2s think time. Run for 1 hour.
   - Assertion: Full iteration time tracked with custom `Trend('soak_iteration_duration')`. Should remain stable (±15%) from start to finish.

2. Total throughput stability over 1 hour
   - Test Scenario: Track `Counter('soak_total_requests')` throughout. Measure req/s at 15-min intervals.
   - Assertion: Throughput at 60 min is within 10% of throughput at 5 min. No gradual slowdown.

3. Error accumulation check over 1 hour
   - Test Scenario: Track cumulative errors at 15-min intervals.
   - Assertion: Error count grows linearly (proportional to requests) not exponentially. Total error rate stays < 1%.

4. Soak test with extended 2-hour run
   - Test Scenario: Run the same journey for 2 hours (`k6 run -e SOAK_DURATION=2h`) to catch slower degradation patterns.
   - Assertion: All metrics remain stable at 2 hours. No memory leaks (if Node.js `process.memoryUsage()` can be monitored).

---

### Story 5

**Title:** [Soak Test] Photo & Heavy Payload Stability Over Extended Duration

**Description:**
Proposed k6 Soak Test (soak-heavy-payload.js):

1. Soak test product photo — 1 hour at 30 VUs
   - Test Scenario: 30 VUs for 1 hour. Each VU hits `GET /api/v1/product/product-photo/:pid`. Binary image data transfer — tests I/O stability and bandwidth over time.
   - Assertion: Photo response time stays stable. No I/O resource exhaustion. Content-type remains image/*.

2. Soak test mixed read-write workload — 1 hour at 30 VUs
   - Test Scenario: 80% reads (products, categories, search) + 20% writes (login, filters). 2s think time. Run for 1 hour.
   - Assertion: Read p95 < 600ms and write p95 < 800ms hold for entire duration. No divergence between read/write latency.

3. Soak test with increasing data — 1 hour
   - Test Scenario: Periodically create new users via register endpoint throughout the test. Monitor if growing dataset impacts query performance.
   - Assertion: Query performance (get products, search) does not degrade as data volume increases.

4. Soak test product count consistency — 1 hour
   - Test Scenario: Hit `GET /api/v1/product/product-count` every iteration. Compare the count at start vs end of test.
   - Assertion: Count remains consistent (no phantom data). Response time stays < 300ms throughout.
