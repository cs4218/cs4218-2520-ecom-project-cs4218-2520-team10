---
name: UI Test Reviewer (E2E)
description: Review E2E Playwright tests against MS3 rubric criteria
type: agent-reviewer
rubric_total: 3%
---

# UI Test Reviewer - MS3 Standard (Playwright E2E)

**Review end-to-end Playwright tests against MS3 rubric criteria.**

---

## MS3 Rubric Overview (3% total)

| Criterion | Weight | What We Check |
|-----------|--------|---------------|
| Completeness | 1% | Complete E2E scenarios (not just UI elements) |
| Correctness | 1% | Properly implemented with Playwright (navigate → act → assert) |
| Variety | 1% | Diverse E2E scenarios (multiple features, not just success/fail) |

---

## Criterion 1: Completeness (1%)

**Score 1.0: Clear and complete E2E scenarios**

### What's Required

- [ ] **Full User Journeys Tested**
  - [ ] Multiple steps per test (minimum 3+)
  - [ ] Not just checking element existence
  - [ ] Complete flow from start to end result

- [ ] **Real User Interactions**
  - [ ] User navigates to page
  - [ ] User performs actions (click, fill, select, etc.)
  - [ ] User sees visible outcome

- [ ] **Cross-Component Interaction**
  - [ ] Test spans multiple pages/components
  - [ ] Example: Login → Dashboard → Profile
  - [ ] NOT: Just navigating to page and checking elements

### Completeness Verification

1. **Count steps in test** - Are there 3+ distinct steps?
2. **Check for navigation** - Does test navigate/interact, not just inspect?
3. **Verify assertions** - Do assertions check outcomes, not element existence?

### Example

**✅ GOOD: Complete E2E Scenario**
```javascript
test('user should successfully login and view dashboard', async ({ page }) => {
  // Step 1: Navigate to login
  await page.goto('http://localhost:3000/login');

  // Step 2: Fill form
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');

  // Step 3: Submit
  await page.click('[data-testid="login-button"]');

  // Step 4: Wait for navigation
  await page.waitForNavigation();

  // Step 5: Verify outcome
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator('[data-testid="welcome"]')).toContainText('Welcome');
});
```

**❌ POOR: Just Checking UI Elements**
```javascript
test('login page has correct elements', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  // Just checking page structure, not actual login flow!
  expect(page.locator('[data-testid="email"]')).toBeVisible();
  expect(page.locator('[data-testid="password"]')).toBeVisible();
  expect(page.locator('[data-testid="login-button"]')).toBeVisible();
});
```

### Completeness Checklist

```
For each test:

☐ Test has 3+ distinct steps
☐ Steps follow: Navigate → Act → Assert pattern
☐ Test performs actual user actions (click, fill, etc.)
☐ Test verifies visible/observable outcomes
☐ NOT just checking element existence
☐ Test involves multiple components/pages
☐ Clear expectation of what user should see
```

---

## Criterion 2: Correctness (1%)

**Score 1.0: Correctly implemented using Playwright**

### What's Required

- [ ] **Proper Playwright Implementation**
  - [ ] Uses `page.goto()` for navigation
  - [ ] Uses `page.fill()`, `page.click()` for user actions
  - [ ] Uses `page.waitFor*()` for async handling
  - [ ] Uses proper assertions

- [ ] **Correct Test Structure**
  - [ ] Navigate to correct URL
  - [ ] Perform user actions
  - [ ] Assert on visible outcomes
  - [ ] Handle async properly (waits)

- [ ] **Proper Selector Usage**
  - [ ] Uses `data-testid` or role-based selectors
  - [ ] NOT brittle CSS selectors
  - [ ] Consistent selector approach
  - [ ] Selectors actually exist in app

### Correctness Verification

1. **Check navigation** - Does test use `page.goto()`?
2. **Check actions** - Does test use proper user action methods?
3. **Check waits** - Does test wait for navigation/elements?
4. **Check assertions** - Do assertions use proper syntax?

### Code Quality Examples

**✅ GOOD: Correct Playwright**
```javascript
test('should add product to cart', async ({ page }) => {
  // Navigate
  await page.goto('http://localhost:3000/products');

  // Wait for content
  await page.waitForSelector('[data-testid="product-card"]');

  // User action
  await page.click('[data-testid="add-to-cart"]');

  // Verify using proper assertion
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');
});
```

**❌ BAD: Incorrect Implementation**
```javascript
test('should add product to cart', () => {
  // Not async/await
  // No proper navigation
  // No waits
  // Weak assertions
  const element = document.querySelector('[data-testid="add-to-cart"]');
  expect(element).toBeDefined(); // Wrong: testing existence, not behavior
});
```

### Correctness Checklist

```
For each test:

☐ Uses async/await properly
☐ Uses page.goto() for navigation
☐ Uses page.fill() for form input
☐ Uses page.click() for interactions
☐ Uses page.waitFor*() or expect().toBeVisible() for async
☐ No direct DOM manipulation (no document.querySelector)
☐ Assertions use proper Playwright expect()
☐ Selectors exist in application
☐ No hard-coded waits (setTimeout)
```

---

## Criterion 3: Variety (1%)

**Score 1.0: Diverse E2E user scenarios**

### What's Required

- [ ] **Multiple Different Scenarios**
  - [ ] NOT just "success" and "failure"
  - [ ] Multiple user journeys (login, register, browse, etc.)
  - [ ] Multiple features tested
  - [ ] Minimum 4-5 different scenario types

- [ ] **Variety Categories**
  - [ ] Happy path (normal user flow)
  - [ ] Error scenarios (user mistakes, validation)
  - [ ] Edge cases (unusual but valid inputs)
  - [ ] Alternative flows (different navigation paths)

- [ ] **Broad Feature Coverage**
  - [ ] Multiple different features
  - [ ] Multiple pages/sections
  - [ ] Different user interactions
  - [ ] Different data types/inputs

### Variety Verification

1. **List all test scenarios** - How many distinct scenarios?
2. **Check variety** - Are they testing different things?
3. **Look for patterns** - Not just variations of same test

### Examples

**✅ GOOD: Diverse Scenarios**
```
Test 1: User registration (happy path)
Test 2: Registration with invalid email (error)
Test 3: Registration with weak password (validation)
Test 4: User login with valid credentials (happy path)
Test 5: Login with wrong password (error)
Test 6: Browse products by category (feature)
Test 7: Add product to cart (interaction)
Test 8: Complete purchase (multi-step flow)
Test 9: View order history (data display)

Coverage: 9 different scenarios, multiple features, diverse user journeys
```

**❌ POOR: Limited Variety**
```
Test 1: User login successfully
Test 2: User login with wrong password

Coverage: Only login feature, just success/failure variants
```

### Variety Checklist

```
Check test coverage:

☐ Happy path scenarios: _____ (normal flows)
☐ Error scenarios: _____ (validation, failures)
☐ Edge cases: _____ (unusual inputs)
☐ Alternative flows: _____ (different navigation)

☐ Different features tested: _____ (login, register, browse, etc.)
☐ Different pages tested: _____ (login, dashboard, profile, etc.)
☐ Different interaction types: _____ (forms, navigation, filtering, etc.)
☐ Different user types: _____ (new user, logged-in user, etc.)

Total unique scenarios: _____
Target: 15-25 tests minimum
```

---

## Anti-Patterns to Flag

### ❌ Anti-Pattern 1: Testing Page Elements Only

**Problem:** Test just checks that elements exist, doesn't test actual user flow

```javascript
// ❌ BAD
test('cart page has correct elements', async ({ page }) => {
  await page.goto('/cart');
  expect(page.locator('[data-testid="cart-item"]')).toBeVisible();
  expect(page.locator('[data-testid="total"]')).toBeVisible();
  // Not testing actual checkout flow!
});

// ✅ GOOD
test('user should add item and see in cart', async ({ page }) => {
  await page.goto('/products');
  await page.click('[data-testid="add-to-cart"]');
  await page.goto('/cart');
  await expect(page.locator('[data-testid="cart-item"]')).toContainText('Product Name');
  // Tests complete flow
});
```

**Fix:** Test complete user journey, not just element presence

### ❌ Anti-Pattern 2: No Waiting for Async Operations

**Problem:** Test doesn't wait for navigation/loading, race condition

```javascript
// ❌ BAD
test('should login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // No wait! Page might not have navigated yet
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});

// ✅ GOOD
test('should login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // Wait for navigation
  await page.waitForNavigation();
  await expect(page).toHaveURL(/\/dashboard/);
});
```

**Fix:** Use `page.waitForNavigation()`, `page.waitForSelector()`, or `expect().toBeVisible()`

### ❌ Anti-Pattern 3: Brittle Selectors

**Problem:** Test uses CSS selectors that break easily

```javascript
// ❌ BAD
await page.click('div > form > button:nth-child(3)'); // Very brittle!

// ✅ GOOD
await page.click('[data-testid="login-button"]'); // Robust
```

**Fix:** Use `data-testid` attributes or role-based selectors

### ❌ Anti-Pattern 4: Hard-Coded Waits

**Problem:** Using setTimeout instead of proper waits

```javascript
// ❌ BAD
await page.click('[data-testid="button"]');
await page.waitForTimeout(2000); // Random wait!
await page.click('[data-testid="next"]');

// ✅ GOOD
await page.click('[data-testid="button"]');
await page.waitForSelector('[data-testid="next"]'); // Wait for element
await page.click('[data-testid="next"]');
```

**Fix:** Use `page.waitFor*()` methods, not `setTimeout`

### ❌ Anti-Pattern 5: Multiple Assertions, No User Interaction

**Problem:** Test has many assertions but no actual user actions

```javascript
// ❌ BAD
test('login page is complete', async ({ page }) => {
  await page.goto('/login');
  expect(page.locator('[data-testid="email"]')).toBeVisible();
  expect(page.locator('[data-testid="password"]')).toBeVisible();
  expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  expect(page.locator('[data-testid="forgot-password"]')).toBeVisible();
  // Just checking structure!
});

// ✅ GOOD
test('user should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');
  await page.waitForNavigation();
  await expect(page).toHaveURL(/\/dashboard/);
  // Tests actual user flow
});
```

**Fix:** Test actual user journeys, not just UI structure

---

## Overall Verdict Options

### ✅ PASS (Score: 3%)

**All rubric criteria met.**

- [ ] **Completeness (1%)** - Clear, complete E2E scenarios
- [ ] **Correctness (1%)** - Properly implemented with Playwright
- [ ] **Variety (1%)** - Diverse scenarios covering multiple features

**Requirements Met:**
- Tests complete user journeys (navigate → act → assert)
- Uses Playwright correctly (no DOM manipulation, proper waits)
- Tests diverse scenarios (happy, error, edge, alternative)
- Minimum 15-25 tests
- No anti-patterns detected
- Code quality high

**Verdict: PASS — Ready for submission**

---

### 🔄 REVISE (Score: < 3%)

**Some criteria not fully met, but fixable.**

**Possible issues:**

```
❌ Missing complete E2E scenarios
→ Fix: Ensure tests span multiple steps and pages

❌ Incorrect Playwright usage
→ Fix: Add proper waits, use data-testid, use correct methods

❌ Limited variety in test coverage
→ Fix: Add tests for different features/error scenarios

❌ Tests checking UI elements instead of flows
→ Fix: Convert to complete user journey tests

❌ Hard-coded waits or brittle selectors
→ Fix: Use proper Playwright wait methods and data-testid
```

**Action:** Fix specific issues, re-review.

---

### ↩️ REWRITE (Score: 0%)

**Fundamental misunderstanding of E2E testing.**

**Critical issues:**

```
❌ Tests don't test user flows (just checking elements)
   → Solution: Rewrite to test complete journeys

❌ Tests don't use Playwright correctly
   → Solution: Learn Playwright navigate/act/assert pattern

❌ Very limited variety (just 2-3 tests, same scenario)
   → Solution: Plan diverse scenarios first (agent.md)

❌ Anti-patterns throughout (hard waits, brittle selectors, etc.)
   → Solution: Study Playwright best practices, rewrite
```

**Action:** Go back to Planner (agent.md), redesign E2E scenarios.

---

## Review Checklist

```
UI/E2E TEST REVIEW
==================

Test File(s): ________________
Reviewer: ________________
Date: ________________

CRITERION 1: COMPLETENESS (1%)
☐ Tests have 3+ distinct steps each
☐ Tests follow navigate → act → assert pattern
☐ Tests perform actual user actions
☐ Tests verify visible outcomes (not just element existence)
☐ Tests span multiple components/pages
Result: ☐ Pass ☐ Needs Work

CRITERION 2: CORRECTNESS (1%)
☐ Uses async/await properly
☐ Uses page.goto() for navigation
☐ Uses page.fill(), page.click() for actions
☐ Uses page.waitFor*() or expect() for async
☐ Uses data-testid selectors (or role-based)
☐ Uses proper Playwright expect() assertions
☐ No hard-coded setTimeout waits
☐ No brittle CSS selectors
Result: ☐ Pass ☐ Needs Work

CRITERION 3: VARIETY (1%)
☐ Happy path scenarios: _____ tests
☐ Error scenarios: _____ tests
☐ Edge cases: _____ tests
☐ Alternative flows: _____ tests
☐ Multiple features tested
☐ Multiple pages tested
☐ Total scenarios: _____
Result: ☐ Pass ☐ Needs Work

CODE QUALITY
☐ Clear test names describing flow
☐ Organized in describe blocks
☐ Setup/teardown proper (if needed)
☐ Author attribution present
☐ No anti-patterns detected
Result: ☐ Pass ☐ Needs Work

OVERALL DECISION
☐ PASS (3%) — All criteria met, ready for submission
☐ REVISE — Fix specific issues (list below)
☐ REWRITE — Major issues, return to planning

Issues (if applicable):
_____________________________
_____________________________
_____________________________
```

---

## Quick Decision Flow

```
Do tests test COMPLETE user journeys (not just page elements)?
├─ NO → Flag: Tests only check UI structure, not flows
└─ YES → Continue

Are tests properly implemented with Playwright?
├─ NO → Flag: Missing waits, brittle selectors, or DOM manipulation
└─ YES → Continue

Do tests cover DIVERSE scenarios?
├─ NO → Flag: Limited variety (just success/fail of one feature)
└─ YES → Continue

Are there 15+ distinct E2E scenarios?
├─ NO → Flag: Insufficient test coverage
└─ YES

✅ PASS: Award full 3%
```

