# Milestone 3 — Non-Functional Testing Plan (All 10 Types)

## Team Members

| Member | Student ID |
|--------|-----------|
| Kim Shi Tong | A0265858J |
| Yan Weidong | A0258151H |
| Ong Chang Heng Bertrand | A0253013X |
| Shaun Lee Xuan Wei | A0252626E |

---

## Overview: All 10 Non-Functional Test Types

Each member picks **one unique type**. This document provides a full implementation plan for every type so you can compare and choose.

| # | Test Type | Tool(s) | Difficulty | Effort |
|---|-----------|---------|------------|--------|
| 1 | **Load Testing** | Grafana k6 | Medium | ~3h |
| 2 | **Stress Testing** | Grafana k6 | Medium | ~3h |
| 3 | **Spike Testing** | Grafana k6 | Medium | ~3h |
| 4 | **Endurance/Soak Testing** | Grafana k6 | Medium | ~4h (long runs) |
| 5 | **Security Testing** | OWASP ZAP (Docker) | Medium-High | ~4h |
| 6 | **Usability Testing** | Playwright + axe-core | Low-Medium | ~3h |
| 7 | **Compatibility Testing** | Playwright multi-browser | Low-Medium | ~3h |
| 8 | **Reliability/Recovery Testing** | Jest + Supertest + custom scripts | Medium-High | ~4h |
| 9 | **Scalability Testing** | k6 + Node.js cluster | Medium-High | ~4h |
| 10 | **Portability Testing** | Docker + Testcontainers | Medium | ~4h |

> **Important:** Types 1-4 all use k6 but with **different test profiles** (different VU patterns, durations, and goals). They count as unique types for grading.

### Assignment Rules
- Each member picks **one** type — no repeats
- If two members both want a k6-based type (1-4), that's fine as long as the **type** is different (e.g., one does Load, another does Spike)
- Fill in assignments below before starting:

| Member | Chosen Test Type | Test # |
|--------|-----------------|--------|
| _(name)_ | | |
| _(name)_ | | |
| _(name)_ | | |
| _(name)_ | | |

---

## Shared Setup

### Install k6 (for types 1-4, 9)
```bash
brew install k6          # macOS
# or: https://grafana.com/docs/k6/latest/set-up/install-k6/
```

### Start the app (needed for all test types)
```bash
npm run dev              # backend :6060 + frontend :3000
```

### File structure
```
tests/nft/
├── load-test.js                # Type 1
├── stress-test.js              # Type 2
├── spike-test.js               # Type 3
├── soak-test.js                # Type 4
├── security-test.js            # Type 5 (or ZAP Docker commands)
├── accessibility.spec.js       # Type 6
├── compatibility.spec.js       # Type 7
├── reliability-test.js         # Type 8
├── scalability-test.js         # Type 9
├── portability/                # Type 10
│   ├── Dockerfile
│   └── portability-test.js
└── README.md
results/                        # Test output artifacts
```

---

# Performance Testing (Types 1–4)

All four use **Grafana k6** but differ in their VU (virtual user) profile and what they measure.

| Aspect | Load | Stress | Spike | Soak/Endurance |
|--------|------|--------|-------|----------------|
| **Goal** | Validate at expected traffic | Find breaking point | Handle sudden surges | Stability over time |
| **VU pattern** | Gradual ramp, hold steady | Escalate until failure | Instant jump, drop back | Steady for hours |
| **Duration** | ~10 min | ~12 min | ~5 min | 1-8 hours |
| **Key metric** | p95 latency, throughput | Max VUs before errors | Recovery time after spike | Memory leaks, degradation |

### Common Endpoints to Target

| Endpoint | Method | Auth? | Why interesting |
|----------|--------|-------|----------------|
| `GET /api/v1/product/get-product` | GET | No | Homepage product list — most traffic |
| `GET /api/v1/product/get-product/:slug` | GET | No | Product detail — high traffic |
| `GET /api/v1/category/get-category` | GET | No | Loaded on every page (Header) |
| `POST /api/v1/auth/login` | POST | No | bcrypt is CPU-heavy |
| `GET /api/v1/product/search/:keyword` | GET | No | Regex on DB — expensive |
| `GET /api/v1/product/product-list/:page` | GET | No | Pagination — common browsing |
| `POST /api/v1/product/product-filters` | POST | No | Filter query on products |

---

## Type 1: Load Testing

### What It Tests
System behavior under **expected** user traffic — response times, throughput, error rates at normal load levels.

### Example k6 Script

```javascript
// tests/nft/load-test.js
// <Your Name>, <Your Student ID>
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';

export const options = {
  stages: [
    { duration: '1m', target: 20 },   // ramp up
    { duration: '3m', target: 50 },   // ramp to expected load
    { duration: '5m', target: 50 },   // hold at expected load
    { duration: '1m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],    // <1% error rate
  },
};

export default function () {
  const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`);
  check(productsRes, {
    'products status 200': (r) => r.status === 200,
    'products has data': (r) => JSON.parse(r.body).products !== undefined,
  });

  const catRes = http.get(`${BASE_URL}/api/v1/category/get-category`);
  check(catRes, { 'categories status 200': (r) => r.status === 200 });

  const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`);
  check(listRes, { 'product list status 200': (r) => r.status === 200 });

  sleep(1);
}
```

### Run
```bash
k6 run tests/nft/load-test.js
k6 run --out json=results/load-test-results.json tests/nft/load-test.js
```

### What to Report
- p95/p99 response times per endpoint
- Requests/sec (throughput)
- Error rate — should be <1%
- Screenshot of k6 terminal summary

---

## Type 2: Stress Testing

### What It Tests
Push system **beyond** expected capacity to find the **breaking point** — at what VU count does the server start failing?

### Key Difference from Load
Stress intentionally **exceeds** capacity; load stays within expected limits.

### Example k6 Script

```javascript
// tests/nft/stress-test.js
// <Your Name>, <Your Student ID>
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';

export const options = {
  stages: [
    { duration: '2m', target: 50 },    // below normal
    { duration: '2m', target: 100 },   // normal
    { duration: '2m', target: 200 },   // around breaking point
    { duration: '2m', target: 300 },   // beyond breaking point
    { duration: '2m', target: 400 },   // well beyond
    { duration: '2m', target: 0 },     // recovery
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // relaxed: 95% < 2s
    http_req_failed: ['rate<0.10'],     // allow up to 10% errors (stress)
  },
};

export default function () {
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'test@test.com', password: 'testpassword' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(loginRes, { 'login responded': (r) => r.status === 200 || r.status === 404 });

  const searchRes = http.get(`${BASE_URL}/api/v1/product/search/phone`);
  check(searchRes, { 'search responded': (r) => r.status === 200 });

  const filterRes = http.post(
    `${BASE_URL}/api/v1/product/product-filters`,
    JSON.stringify({ checked: [], radio: [0, 100] }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(filterRes, { 'filter responded': (r) => r.status === 200 });

  sleep(0.5);
}
```

### Run
```bash
k6 run tests/nft/stress-test.js
```

### What to Report
- At which VU count does p95 latency degrade significantly?
- At which VU count do errors start appearing?
- Maximum throughput before failure
- Recovery behavior after load drops
- Screenshot of k6 summary showing the breaking point

---

## Type 3: Spike Testing

### What It Tests
System reaction to **sudden, massive surges** in traffic — like a flash sale or viral post. Can the server handle an instant jump from 10 to 500 users?

### Key Difference from Stress
Stress gradually escalates; spike testing has an **instant jump** with near-zero ramp-up time.

### Example k6 Script

```javascript
// tests/nft/spike-test.js
// <Your Name>, <Your Student ID>
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // baseline — normal traffic
    { duration: '10s', target: 500 },   // SPIKE! instant surge
    { duration: '1m', target: 500 },    // hold spike briefly
    { duration: '10s', target: 10 },    // instant drop back to normal
    { duration: '2m', target: 10 },     // recovery period — observe
    { duration: '30s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // very relaxed during spike
    http_req_failed: ['rate<0.15'],     // some errors expected
  },
};

export default function () {
  // Simulate a user browsing products (flash sale scenario)
  const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`);
  check(productsRes, { 'products 200': (r) => r.status === 200 });

  const catRes = http.get(`${BASE_URL}/api/v1/category/get-category`);
  check(catRes, { 'categories 200': (r) => r.status === 200 });

  // Simulate adding to cart (search for product)
  const searchRes = http.get(`${BASE_URL}/api/v1/product/search/laptop`);
  check(searchRes, { 'search 200': (r) => r.status === 200 });

  sleep(0.3); // minimal think time during rush
}
```

### Run
```bash
k6 run tests/nft/spike-test.js
```

### What to Report
- Response times **during** the spike vs **before** the spike
- Error rate during the spike period
- **Recovery time**: how long until response times return to normal after spike ends
- Did the server crash or remain available?
- Screenshot of k6 output showing spike impact

---

## Type 4: Endurance/Soak Testing

### What It Tests
System stability under **sustained load over an extended period** — detects memory leaks, connection pool exhaustion, gradual performance degradation, storage depletion.

### Key Difference from Load
Same VU count as load testing, but runs for **hours** instead of minutes.

### Example k6 Script

```javascript
// tests/nft/soak-test.js
// <Your Name>, <Your Student ID>
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';

export const options = {
  stages: [
    { duration: '2m', target: 30 },    // ramp up
    { duration: '1h', target: 30 },    // hold steady for 1 hour (adjust: 2h, 4h, 8h)
    { duration: '2m', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'],   // should stay consistent over time
    http_req_failed: ['rate<0.01'],     // no degradation allowed
  },
};

export default function () {
  const productsRes = http.get(`${BASE_URL}/api/v1/product/get-product`);
  check(productsRes, { 'products 200': (r) => r.status === 200 });

  const catRes = http.get(`${BASE_URL}/api/v1/category/get-category`);
  check(catRes, { 'categories 200': (r) => r.status === 200 });

  const listRes = http.get(`${BASE_URL}/api/v1/product/product-list/1`);
  check(listRes, { 'product list 200': (r) => r.status === 200 });

  // Login periodically to test auth under sustained load
  if (__ITER % 10 === 0) {
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email: 'test@test.com', password: 'testpassword' }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    check(loginRes, { 'login responded': (r) => r.status !== 500 });
  }

  sleep(2); // realistic pacing for long-duration test
}
```

### Run
```bash
# Short version for testing (30 minutes)
k6 run tests/nft/soak-test.js

# Override duration via env for longer runs
k6 run -e SOAK_DURATION=4h tests/nft/soak-test.js
```

### What to Report
- p95 latency **at start** vs **at end** — any degradation?
- Error rate over time — does it increase?
- Node.js memory usage over time (use `process.memoryUsage()` or system monitor)
- Total requests served and total duration
- Screenshot of k6 summary + system resource usage

---

# Type 5: Security Testing

### What It Tests
Identifies vulnerabilities, threats, and risks — SQL injection, XSS, auth bypass, insecure headers, information disclosure.

### Tool: OWASP ZAP
- Industry-standard DAST (Dynamic Application Security Testing) scanner
- Run via Docker: `docker pull zaproxy/zap-stable`
- Or install from [zaproxy.org](https://www.zaproxy.org/download/)
- CLI-based automation — no GUI needed

### What to Scan

| Target | URL | What ZAP Checks |
|--------|-----|-----------------|
| API baseline | `http://localhost:6060` | Headers, info disclosure, server config |
| OpenAPI spec | `http://localhost:6060/api-docs` | All endpoints from Swagger — injection, auth |
| Frontend | `http://localhost:3000` | XSS, clickjacking, CSP, insecure cookies |

### Approach 1: ZAP Docker Scans (Recommended)

```bash
# Baseline scan (passive, fast ~2 min)
docker run --rm -v $(pwd)/results:/zap/wrk zaproxy/zap-stable \
  zap-baseline.py -t http://host.docker.internal:6060 \
  -r baseline-report.html -J baseline-report.json

# API scan using OpenAPI spec (active, thorough ~10 min)
docker run --rm -v $(pwd)/results:/zap/wrk zaproxy/zap-stable \
  zap-api-scan.py -t http://host.docker.internal:6060/api-docs \
  -f openapi -r api-report.html -J api-report.json

# Frontend scan
docker run --rm -v $(pwd)/results:/zap/wrk zaproxy/zap-stable \
  zap-baseline.py -t http://host.docker.internal:3000 \
  -r frontend-report.html
```

> On macOS, use `host.docker.internal` to reach localhost from Docker.

### Approach 2: Supertest-based Security Checks (No Docker needed)

```javascript
// tests/nft/security-test.js
// <Your Name>, <Your Student ID>
import request from 'supertest';
import app from '../../app.js';

describe('Security Tests', () => {
  test('should not expose X-Powered-By header', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('SQL injection in login should not crash server', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: "' OR 1=1 --", password: "' OR 1=1 --" });
    expect(res.status).not.toBe(500);
  });

  test('NoSQL injection in login should be handled', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { "$gt": "" }, password: { "$gt": "" } });
    expect(res.status).not.toBe(500);
  });

  test('XSS payload in search should be handled safely', async () => {
    const res = await request(app)
      .get('/api/v1/product/search/<script>alert(1)</script>');
    expect(res.status).not.toBe(500);
    expect(res.text).not.toContain('<script>alert(1)</script>');
  });

  test('should reject requests with invalid JWT', async () => {
    const res = await request(app)
      .get('/api/v1/auth/orders')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });

  test('non-admin should not access admin routes', async () => {
    const res = await request(app)
      .get('/api/v1/auth/all-orders')
      .set('Authorization', 'Bearer some.user.token');
    expect([401, 403]).toContain(res.status);
  });

  test('path traversal should not expose files', async () => {
    const res = await request(app).get('/api/v1/product/get-product/../../.env');
    expect(res.status).not.toBe(200);
  });

  test('oversized payload should be rejected', async () => {
    const hugePayload = { email: 'a'.repeat(100000), password: 'test' };
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send(hugePayload);
    expect(res.status).not.toBe(500);
  });
});
```

### Run
```bash
# ZAP Docker approach
docker run --rm -v $(pwd)/results:/zap/wrk zaproxy/zap-stable \
  zap-api-scan.py -t http://host.docker.internal:6060/api-docs -f openapi -r security-report.html

# Supertest approach (runs within Jest)
npm run test:backend -- security-test
```

### What to Report
- ZAP alerts by risk level (High/Medium/Low/Informational)
- Specific vulnerabilities found + whether fixed
- HTML report screenshots
- Any bugs fixed (e.g., missing `helmet` middleware, exposed headers)

---

# Type 6: Usability Testing (Accessibility)

### What It Tests
Automated WCAG 2.1 compliance — missing alt text, color contrast, ARIA labels, keyboard navigation, semantic HTML, form labels.

### Tool: Playwright + @axe-core/playwright
- Already have Playwright in the project
- axe-core is the industry standard accessibility engine (by Deque)
- Install: `npm install -D @axe-core/playwright`

### Pages to Test

| Page | URL | Why |
|------|-----|-----|
| Home | `/` | Most visited page |
| Login | `/login` | Critical auth flow, form accessibility |
| Register | `/register` | Many form inputs |
| Product Details | `/product/:slug` | Key commerce page |
| Categories | `/categories` | Navigation-heavy |
| Cart | `/cart` | Transaction flow |
| Search | `/search` | Dynamic content |

### Example Test Script

```javascript
// tests/nft/accessibility.spec.js
// <Your Name>, <Your Student ID>
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = 'http://localhost:3000';

test.describe('Accessibility / Usability Tests (WCAG 2.1 AA)', () => {

  test('Home page — no critical violations', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    console.log('Home violations:', results.violations.length);
    results.violations.forEach(v => console.log(`  [${v.impact}] ${v.id}: ${v.description}`));
    expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('Login page — accessible forms', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    console.log('Login violations:', results.violations.length);
    results.violations.forEach(v => console.log(`  [${v.impact}] ${v.id}: ${v.description}`));
    expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('Register page — accessible forms', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('Categories page — proper heading structure', async ({ page }) => {
    await page.goto(`${BASE_URL}/categories`);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
  });

  test('HTML should have lang attribute', async ({ page }) => {
    await page.goto(BASE_URL);
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBeTruthy();
  });

  test('All images should have alt text', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).not.toBeNull();
    }
  });

  test('Interactive elements should be keyboard accessible', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    // Tab through form elements
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement.tagName);
    expect(['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA']).toContain(focused);
  });
});
```

### Run
```bash
npm install -D @axe-core/playwright
npx playwright test tests/nft/accessibility.spec.js --reporter=html
```

### What to Report
- Violations by impact level (critical/serious/moderate/minor)
- Specific WCAG rules violated (e.g., `color-contrast`, `label`, `image-alt`)
- Fixes applied (adding `lang="en"`, alt attributes, ARIA labels, contrast fixes)

---

# Type 7: Compatibility Testing

### What It Tests
Application behavior across **different browsers** — Chromium, Firefox, and WebKit (Safari engine). Ensures UI renders correctly and features work consistently.

### Tool: Playwright (already installed)
- Playwright natively supports Chromium, Firefox, and WebKit
- Just configure `playwright.config.js` to run across all three browsers

### Playwright Config for Multi-Browser

```javascript
// playwright.config.compatibility.js (or modify existing config)
// <Your Name>, <Your Student ID>
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/nft',
  testMatch: 'compatibility.spec.js',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',         // capture screenshots for comparison
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: [
    {
      command: 'npm start',
      url: 'http://localhost:6060',
      reuseExistingServer: true,
    },
    {
      command: 'npm run client',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
    },
  ],
});
```

### Example Test Script

```javascript
// tests/nft/compatibility.spec.js
// <Your Name>, <Your Student ID>
import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility Tests', () => {

  test('Home page renders correctly', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check core layout elements exist
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.banner-image, .home-page, [class*="home"]').first()).toBeVisible();

    // Screenshot for visual comparison across browsers
    await page.screenshot({ path: `results/compatibility/home-${browserName}.png`, fullPage: true });
  });

  test('Login form works across browsers', async ({ page, browserName }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Verify form elements render
    const emailInput = page.locator('input[type="email"], #email, [placeholder*="email" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Test form interaction
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    await page.screenshot({ path: `results/compatibility/login-${browserName}.png` });
  });

  test('Product listing renders consistently', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check product cards render
    const products = page.locator('.card, [class*="product"]');
    const count = await products.count();
    expect(count).toBeGreaterThan(0);

    await page.screenshot({ path: `results/compatibility/products-${browserName}.png`, fullPage: true });
  });

  test('Navigation menu works', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click categories link
    const categoriesLink = page.locator('a[href="/categories"]').first();
    if (await categoriesLink.isVisible()) {
      await categoriesLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/categories/);
    }

    await page.screenshot({ path: `results/compatibility/categories-${browserName}.png` });
  });

  test('Search functionality works across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"], [placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `results/compatibility/search-${browserName}.png` });
    }
  });

  test('Responsive layout on mobile viewport', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify no horizontal scrollbar on mobile
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance

    await page.screenshot({ path: `results/compatibility/responsive-${browserName}.png`, fullPage: true });
  });
});
```

### Run
```bash
# Install browsers if not already
npx playwright install

# Run compatibility tests across all browsers
npx playwright test --config=playwright.config.compatibility.js --reporter=html

# Run for a specific browser only
npx playwright test --config=playwright.config.compatibility.js --project=firefox
```

### What to Report
- Side-by-side screenshots from Chromium, Firefox, WebKit
- Any rendering differences or broken functionality per browser
- Mobile vs desktop comparison screenshots
- Bugs found (e.g., CSS not rendering in Safari, JS feature not supported in Firefox)

---

# Type 8: Reliability / Recovery Testing

### What It Tests
System's ability to **recover from failures** — database disconnection, server crash, malformed requests, error handling under abnormal conditions.

### Tool: Jest + Supertest + custom child_process scripts
- Uses existing test infrastructure (no new tool install needed)
- Simulates failure scenarios programmatically

### Example Test Script

```javascript
// tests/nft/reliability-test.js
// <Your Name>, <Your Student ID>
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';

describe('Reliability / Recovery Tests', () => {

  // --- Database Disconnection Recovery ---
  describe('Database disconnection recovery', () => {
    test('should handle requests gracefully when DB is disconnected', async () => {
      // Disconnect from MongoDB
      await mongoose.disconnect();

      // Requests should fail gracefully, not crash the server
      const res = await request(app).get('/api/v1/product/get-product');
      // Should return an error response, not crash (500 is acceptable, not a hang/crash)
      expect(res.status).toBeGreaterThanOrEqual(400);

      // Reconnect
      await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/test');
    });

    test('should resume normal operation after DB reconnection', async () => {
      const res = await request(app).get('/api/v1/category/get-category');
      expect(res.status).toBe(200);
    });
  });

  // --- Malformed Request Handling ---
  describe('Malformed request handling', () => {
    test('should handle invalid JSON body', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      expect(res.status).toBe(400);
    });

    test('should handle empty body on POST endpoints', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});
      expect(res.status).not.toBe(500);
    });

    test('should handle missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test' }); // missing email, password, etc.
      expect(res.status).not.toBe(500);
    });

    test('should handle extremely long input strings', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'a'.repeat(10000) + '@test.com', password: 'b'.repeat(10000) });
      expect(res.status).not.toBe(500);
    });
  });

  // --- Invalid Route Parameters ---
  describe('Invalid route parameters', () => {
    test('should handle invalid MongoDB ObjectId in route', async () => {
      const res = await request(app).get('/api/v1/product/product-photo/not-a-valid-id');
      expect(res.status).not.toBe(500);
    });

    test('should handle non-existent product slug', async () => {
      const res = await request(app).get('/api/v1/product/get-product/non-existent-slug-12345');
      expect([200, 404]).toContain(res.status);
    });

    test('should handle negative page numbers', async () => {
      const res = await request(app).get('/api/v1/product/product-list/-1');
      expect(res.status).not.toBe(500);
    });

    test('should handle non-numeric page parameter', async () => {
      const res = await request(app).get('/api/v1/product/product-list/abc');
      expect(res.status).not.toBe(500);
    });
  });

  // --- Concurrent Request Handling ---
  describe('Concurrent request handling', () => {
    test('should handle 50 concurrent requests without crashing', async () => {
      const requests = Array.from({ length: 50 }, () =>
        request(app).get('/api/v1/product/get-product')
      );
      const responses = await Promise.all(requests);
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBe(50); // all should succeed
    });

    test('should handle concurrent writes without data corruption', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/v1/auth/login')
          .send({ email: `user${i}@test.com`, password: 'password123' })
      );
      const responses = await Promise.all(requests);
      // None should be 500
      responses.forEach(r => expect(r.status).not.toBe(500));
    });
  });

  // --- Server Process Recovery ---
  describe('Error isolation', () => {
    test('one failed request should not affect subsequent requests', async () => {
      // Trigger an error
      await request(app).get('/api/v1/product/product-photo/invalid');

      // Next request should still work
      const res = await request(app).get('/api/v1/category/get-category');
      expect(res.status).toBe(200);
    });
  });
});
```

### Run
```bash
# Uses existing Jest backend config
npm run test:backend -- reliability-test
```

### What to Report
- Which failure scenarios the server handles gracefully vs crashes
- Recovery behavior after DB disconnect/reconnect
- Any uncaught exceptions or unhandled promise rejections found
- Bugs fixed (e.g., missing error handling, crash on invalid input)

---

# Type 9: Scalability Testing

### What It Tests
System's ability to **increase capacity** — does performance scale linearly with more resources? What happens as data volume grows?

### Tool: k6 + Node.js cluster mode comparison
- Run k6 tests at increasing VU levels and measure throughput scaling
- Compare single-process vs clustered Node.js performance

### Example k6 Script — Incremental Scaling

```javascript
// tests/nft/scalability-test.js
// <Your Name>, <Your Student ID>
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:6060';

// Scalability test: run at increasing VU levels to measure throughput scaling
// Run this script multiple times with different VU counts:
//   k6 run --vus 10 --duration 2m tests/nft/scalability-test.js
//   k6 run --vus 25 --duration 2m tests/nft/scalability-test.js
//   k6 run --vus 50 --duration 2m tests/nft/scalability-test.js
//   k6 run --vus 100 --duration 2m tests/nft/scalability-test.js
//   k6 run --vus 200 --duration 2m tests/nft/scalability-test.js

export const options = {
  stages: [
    { duration: '30s', target: __ENV.TARGET_VUS ? parseInt(__ENV.TARGET_VUS) : 50 },
    { duration: '3m', target: __ENV.TARGET_VUS ? parseInt(__ENV.TARGET_VUS) : 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  // Mix of read operations
  http.get(`${BASE_URL}/api/v1/product/get-product`);
  http.get(`${BASE_URL}/api/v1/category/get-category`);
  http.get(`${BASE_URL}/api/v1/product/product-list/1`);

  // Write operation (login)
  http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: 'test@test.com', password: 'password' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  sleep(0.5);
}
```

### Scaling Analysis Script

```bash
#!/bin/bash
# tests/nft/run-scalability.sh
# <Your Name>, <Your Student ID>
# Runs k6 at increasing VU levels and collects results

echo "=== Scalability Test Suite ==="

for VUS in 10 25 50 100 200; do
  echo ""
  echo "--- Testing with $VUS virtual users ---"
  k6 run \
    -e TARGET_VUS=$VUS \
    --out json=results/scalability-${VUS}vus.json \
    tests/nft/scalability-test.js 2>&1 | tee results/scalability-${VUS}vus.txt
  echo ""
done

echo "=== Scalability Test Complete ==="
echo "Compare req/s and p95 latency across VU levels in results/"
```

### Run
```bash
chmod +x tests/nft/run-scalability.sh
./tests/nft/run-scalability.sh
```

### What to Report
- Table of VU count vs throughput (req/s) vs p95 latency
- Is scaling linear? (2x VUs = 2x throughput?)
- At what point does adding more VUs stop increasing throughput?
- Chart/graph showing the scaling curve
- Bottleneck identification (CPU, memory, DB connections?)

---

# Type 10: Portability Testing

### What It Tests
Whether the application can be **deployed and run correctly in different environments** — different Node.js versions, containerized (Docker), different OS environments.

### Tool: Docker + Testcontainers (or multi-stage Docker builds)
- Build and test the app in Docker containers with different base images
- Verify it works across Node.js 18, 20, 22, 24

### Dockerfile for Testing

```dockerfile
# tests/nft/portability/Dockerfile
# <Your Name>, <Your Student ID>
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install && cd client && npm install

# Copy source
COPY . .

# Expose ports
EXPOSE 6060 3000

# Run tests
CMD ["npm", "run", "test"]
```

### Portability Test Script

```bash
#!/bin/bash
# tests/nft/portability/run-portability.sh
# <Your Name>, <Your Student ID>
# Tests the application across different Node.js versions

echo "=== Portability Test Suite ==="

RESULTS_DIR="results/portability"
mkdir -p $RESULTS_DIR

for NODE_VER in 18 20 22 24; do
  echo ""
  echo "--- Testing on Node.js ${NODE_VER} ---"

  docker build \
    --build-arg NODE_VERSION=${NODE_VER} \
    -t ecom-test:node${NODE_VER} \
    -f tests/nft/portability/Dockerfile . \
    2>&1 | tee ${RESULTS_DIR}/build-node${NODE_VER}.log

  BUILD_STATUS=$?

  if [ $BUILD_STATUS -eq 0 ]; then
    echo "✓ Build succeeded on Node.js ${NODE_VER}"

    docker run --rm \
      --name ecom-test-node${NODE_VER} \
      -e MONGO_URL=mongodb://host.docker.internal:27017/test \
      ecom-test:node${NODE_VER} \
      2>&1 | tee ${RESULTS_DIR}/test-node${NODE_VER}.log

    TEST_STATUS=$?
    if [ $TEST_STATUS -eq 0 ]; then
      echo "✓ Tests passed on Node.js ${NODE_VER}"
    else
      echo "✗ Tests FAILED on Node.js ${NODE_VER}"
    fi
  else
    echo "✗ Build FAILED on Node.js ${NODE_VER}"
  fi

  echo ""
done

echo "=== Portability Test Complete ==="
echo "Results in ${RESULTS_DIR}/"
```

### Alternative: GitHub Actions Matrix (CI-based)

```yaml
# .github/workflows/portability-test.yaml
# <Your Name>, <Your Student ID>
name: Portability Tests
on: workflow_dispatch

jobs:
  portability:
    strategy:
      matrix:
        node-version: [18, 20, 22, 24]
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm install && cd client && npm install
      - run: npm run test
```

### Run
```bash
chmod +x tests/nft/portability/run-portability.sh
./tests/nft/portability/run-portability.sh
```

### What to Report
- Build success/failure per Node.js version
- Test pass/fail per Node.js version
- Any version-specific issues (deprecated APIs, breaking changes)
- Docker build logs and test output screenshots
- Compatibility matrix table

---

## Summary Comparison Table

| # | Type | What You Measure | Tool | Deliverable |
|---|------|-----------------|------|-------------|
| 1 | Load | Latency + throughput at normal traffic | k6 | k6 summary screenshot |
| 2 | Stress | Breaking point (max VUs) | k6 | k6 summary + error graph |
| 3 | Spike | Recovery time after sudden surge | k6 | k6 summary + spike graph |
| 4 | Endurance | Stability over hours | k6 | k6 summary + memory graph |
| 5 | Security | Vulnerabilities (XSS, injection, headers) | ZAP / Supertest | ZAP report HTML / Jest results |
| 6 | Usability | WCAG violations (a11y) | Playwright + axe | Playwright report + fixes |
| 7 | Compatibility | Cross-browser rendering + functionality | Playwright | Screenshots per browser |
| 8 | Reliability | Recovery from failures (DB down, bad input) | Jest + Supertest | Jest results + bug fixes |
| 9 | Scalability | Throughput scaling curve | k6 | Chart: VUs vs req/s |
| 10 | Portability | Works across Node versions + OS | Docker / GH Actions | Compatibility matrix |

---

## Implementation Checklist Per Member

1. **Pick a unique test type** (1-10) — no repeats within team
2. **Create test script(s)** in `tests/nft/` with `// Name, StudentID` comments
3. **Run tests** against the running application
4. **Fix any bugs** discovered during testing
5. **Capture evidence**: screenshots, HTML reports, terminal output
6. **Update README.md** with MS3 contribution
7. **Commit all** scripts, configs, reports under the `ms3` Git tag

---

## Grading Alignment

| Criterion | Points | How to Satisfy |
|-----------|--------|----------------|
| **Consistency** | 1% | Report describes exactly what code does; endpoints, thresholds, tool match |
| **Correctness** | 2% | Tests execute, produce meaningful results, clearly test NFT |
| **Uniqueness** | 1% | Each member has a different test type — verify before starting |

---

## References

### Performance Testing (k6)
- [Grafana k6 Documentation](https://grafana.com/docs/k6/latest/)
- [k6 API Load Testing Guide](https://grafana.com/docs/k6/latest/testing-guides/api-load-testing/)
- [Load Testing Types: load, stress, soak, spike](https://www.kodziak.com/blog/load-testing-types-load-stress-soak-spike)
- [Spike Testing with K6](https://medium.com/@ajaykumar1807/performance-testing-for-apis-spike-testing-with-k6-ecc910ecd20d)
- [Reusable K6 Patterns for Load, Soak, and Spike](https://medium.com/@siva_bankapalli/write-once-run-anywhere-reusable-k6-patterns-for-load-soak-and-spike-testing-687b66ee35fb)
- [k6 Soak Testing Docs](https://k6.io/docs/test-types/soak-testing/)

### Security Testing
- [OWASP ZAP API Security Testing](https://oneuptime.com/blog/post/2026-01-25-owasp-zap-api-security/view)
- [ZAP API Reference](https://www.zaproxy.org/docs/api/)
- [Ensuring API Security with OWASP ZAP](https://www.opsmx.com/blog/ensuring-api-security-with-owasp-zap-a-step-by-step-guide/)

### Usability / Accessibility Testing
- [Playwright Accessibility Testing (Official)](https://playwright.dev/docs/accessibility-testing)
- [Automating Accessibility with Playwright + axe-core](https://dev.to/leading-edje/automating-accessibility-testing-with-playwright-3el7)
- [How We Automate Accessibility Testing](https://dev.to/subito/how-we-automate-accessibility-testing-with-playwright-and-axe-3ok5)

### Compatibility Testing
- [Cross-Browser Testing with Playwright (2026 Guide)](https://thinksys.com/qa-testing/cross-browser-testing-with-playwright/)
- [Playwright Browser Testing Guide](https://testdino.com/blog/playwright-browser-testing-a-comprehensive-guide-for-chromium-firefox-and-webkit/)
- [Playwright Browsers Docs](https://playwright.dev/docs/browsers)

### Reliability / Recovery Testing
- [Chaos Engineering for Node.js](https://diginode.in/nodejs/chaos-engineering-and-resilience-testing-for-node-js-applications/)
- [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

### Scalability Testing
- [Performance and Stress Testing in Node.js](https://blog.appsignal.com/2025/06/04/performance-and-stress-testing-in-nodejs.html)
- [k6 Kubernetes Autoscaling Example](https://github.com/grafana/example-kubernetes-autoscaling-nodejs-api)

### Portability Testing
- [Run Node.js Tests in a Container (Docker Docs)](https://docs.docker.com/guides/nodejs/run-tests/)
- [Testing Across Node.js Versions Using Docker](https://www.sitepoint.com/testing-across-node-js-versions-using-docker/)
- [Testcontainers for Node.js](https://node.testcontainers.org/)
