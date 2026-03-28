---
name: UI Test Planner (E2E)
description: Plan complete end-to-end user scenarios using Playwright (MS3 rubric aligned)
type: agent-planner
rubric_alignment: MS3
completeness_weight: 1%
correctness_weight: 1%
variety_weight: 1%
---

# UI Test Planner - MS3 Standard (E2E with Playwright)

**Plan complete end-to-end user scenarios** (not individual page element checks).

---

## OPTIONAL Phase 0: Reference User Flow Patterns (For Cross-Module Learning)

**Skip this if this is your first module. Use this if prior E2E tests exist.**

If previous modules have been tested with E2E:

**Check prior module's user flows:**
```
_memory-base/knowledge/patterns/test-data-patterns.json
  → See what test data (user credentials, product info) was effective
  → See boundary values used for test data
  → Understand realistic data for this domain

_memory-base/modules/[prior-module]/runs/run-*.json
  → See which user journeys were tested
  → See wait strategies that worked (waitForNavigation, waitForLoadState)
  → See selector strategies that were effective (data-testid > role > CSS)
  → See common issues with timing or selectors
```

**Optional actions:**
- [ ] Read prior module's test data: "What realistic test data should I use?"
- [ ] Read prior module's user flows: "What journey patterns should I test?"
- [ ] Read prior module's run results: "What selectors and waits worked best?"
- [ ] Read jest-patterns.json: "What Playwright assertions were clear?"

**No mandatory actions** — This is optional. Proceed to Phase 1 even if no prior data exists.

---

## MS3 Rubric Requirements

### Key Distinction: E2E vs Page Element Testing

**❌ POOR: Just checking UI elements**
```
Test: Navigate to login page → Check that page contains:
  - Email input field
  - Password input field
  - Login button
This is NOT E2E testing, just page structure checking.
```

**✅ GOOD: Complete user scenario**
```
Test: User login flow
  - User navigates to login page
  - User enters valid credentials
  - User clicks login button
  - User is redirected to dashboard
  - User sees "Welcome" message with their name
This tests the COMPLETE interaction flow.
```

---

## Rubric Criterion 1: Completeness (1%)

**Score 1.0: Clear and complete E2E scenarios**

### What's Required

- [ ] **Full User Journey Tested**
  - [ ] Start: User on starting page
  - [ ] Action: User performs primary action (login, register, purchase, etc.)
  - [ ] Verification: User sees expected outcome
  - [ ] NOT just: "page has elements"

- [ ] **Multiple Steps in Scenario**
  - [ ] Step 1: Navigate to page
  - [ ] Step 2: Perform user action(s)
  - [ ] Step 3: Verify result(s)
  - [ ] Minimum 3 steps per test

- [ ] **Cross-Component Interaction**
  - [ ] Scenario spans multiple UI components
  - [ ] Example: Login → Dashboard → Profile
  - [ ] Example: Browse → Add to Cart → Checkout
  - [ ] Example: Register → Verify Email → Login

### Complete Scenario Examples

**✅ GOOD: Login E2E Scenario**
```
Scenario: User successfully logs in
  Step 1: Navigate to application homepage
  Step 2: Click "Login" link
  Step 3: Enter valid email and password
  Step 4: Click "Login" button
  Step 5: Verify redirect to dashboard
  Step 6: Verify welcome message shows user name
  Step 7: Verify navigation menu is visible
```

**❌ POOR: Just checking page elements**
```
Scenario: Login page structure
  - Check login form exists
  - Check email field exists
  - Check password field exists
  - Check login button exists
(Not testing actual login flow!)
```

---

## Rubric Criterion 2: Correctness (1%)

**Score 1.0: Correctly implemented with Playwright**

### What's Required

- [ ] **Playwright Implementation**
  - [ ] Use Playwright to navigate pages
  - [ ] Perform actual user actions (click, fill, etc.)
  - [ ] NOT just checking HTML/DOM

- [ ] **Proper Test Structure**
  - [ ] Navigate to page
  - [ ] Perform user actions
  - [ ] Assert visible outcomes
  - [ ] Clear pass/fail criteria

- [ ] **Real User Interactions**
  - [ ] Click actual buttons/links
  - [ ] Fill actual form fields
  - [ ] Wait for navigation/loading
  - [ ] Assert on visible changes

### Structure: Navigate → Act → Assert

```
it('should complete user scenario', async () => {
  // NAVIGATE
  await page.goto('/login');
  await page.waitForSelector('[data-testid="login-form"]');

  // ACT (User actions)
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  // ASSERT (Verify outcomes)
  await page.waitForNavigation();
  const welcomeText = await page.textContent('[data-testid="welcome"]');
  expect(welcomeText).toContain('Welcome');
  expect(page.url()).toContain('/dashboard');
});
```

---

## Rubric Criterion 3: Variety (1%)

**Score 1.0: Diverse E2E user scenarios**

### What's Required

- [ ] **Multiple Different Scenarios**
  - [ ] NOT just "success" and "failure"
  - [ ] Cover different user journeys
  - [ ] Test different features
  - [ ] Example: Login, Register, Browse, Purchase, etc.

- [ ] **Variety Types**
  - [ ] Happy path scenarios (normal user flow)
  - [ ] Error scenarios (what happens when things go wrong)
  - [ ] Edge case scenarios (unusual but valid inputs)
  - [ ] Different user types (admin, customer, etc.)

- [ ] **Broad Feature Coverage**
  - [ ] Multiple features, not just one
  - [ ] Multiple user workflows
  - [ ] Different pages/sections
  - [ ] Different interaction types (forms, navigation, filtering, etc.)

### Variety Examples

**✅ GOOD: Diverse scenarios**
```
Scenario 1: User registration flow (happy path)
Scenario 2: User login with invalid credentials (error)
Scenario 3: User browsing products (navigation)
Scenario 4: User adding item to cart (interaction)
Scenario 5: User checkout process (multi-step flow)
Scenario 6: User viewing order history (data display)

Coverage: 6 different scenarios, multiple features
```

**❌ POOR: Limited variety**
```
Scenario 1: User login successfully
Scenario 2: User login with wrong password

Coverage: Only login feature, just success/failure
```

---

## Phase 1: Identify End-to-End Scenarios

### 1.1 Define Major User Journeys

**Question:** What are the main things users do in your application?

Identify 5-8 major journeys:
- [ ] Journey 1: _________________ (e.g., User Registration)
- [ ] Journey 2: _________________ (e.g., User Login)
- [ ] Journey 3: _________________ (e.g., Browse Products)
- [ ] Journey 4: _________________ (e.g., Purchase Item)
- [ ] Journey 5: _________________ (e.g., View Profile)
- [ ] Journey 6: _________________ (e.g., Update Account)
- [ ] Journey 7: _________________ (e.g., Search Products)
- [ ] Journey 8: _________________ (e.g., Write Review)

### 1.2 Define Each Scenario Steps

For each journey, define the complete flow:

```
Journey: [Journey Name]

Step 1 (Navigate): User navigates to [page/feature]
Step 2 (Perform Action): User [performs action]
Step 3 (Perform Action): User [performs action]
Step 4 (Verify): User sees [expected result]
Step 5 (Verify): [additional verification]
```

**Example:**
```
Journey: Complete Purchase

Step 1: User navigates to product page
Step 2: User clicks "Add to Cart" button
Step 3: User navigates to shopping cart
Step 4: User clicks "Checkout" button
Step 5: User enters shipping information
Step 6: User selects payment method
Step 7: User clicks "Complete Order" button
Step 8: User sees order confirmation page
Step 9: User receives confirmation email (optional)
Step 10: User sees order in order history
```

---

## Phase 2: Categorize Scenarios

### 2.1 Happy Path (Normal User Flow)

**Definition:** User completes flow without errors

- [ ] Scenario: _______________
  - Expected: User successfully completes flow
  - Verification: [specific observable outcome]

- [ ] Scenario: _______________
  - Expected: User successfully completes flow
  - Verification: [specific observable outcome]

### 2.2 Error Path (User Input Errors)

**Definition:** User makes mistake, system handles gracefully

- [ ] Scenario: _______________
  - Error: User enters invalid data
  - Expected: System shows error message
  - Verification: [error message visible]

- [ ] Scenario: _______________
  - Error: User skips required field
  - Expected: Form validation error
  - Verification: [validation error visible]

### 2.3 Edge Cases (Unusual but Valid)

**Definition:** Unusual but valid user behavior

- [ ] Scenario: _______________
  - Input: [unusual but valid scenario]
  - Expected: System handles correctly
  - Verification: [correct behavior shown]

- [ ] Scenario: _______________
  - Input: [edge case input]
  - Expected: System handles correctly
  - Verification: [correct behavior shown]

### 2.4 Alternative Flows (Different User Paths)

**Definition:** Different ways to achieve same goal

- [ ] Scenario: _______________
  - Path: User takes alternative route
  - Expected: Same end result
  - Verification: [end result verified]

---

## Phase 3: Design Test Data

### 3.1 User Accounts/Personas

**Define realistic test users:**

```
User 1: Normal User
  Email: testuser@example.com
  Password: ValidPass123!
  Name: Test User
  Status: Regular customer

User 2: Admin User
  Email: admin@example.com
  Password: AdminPass123!
  Name: Admin User
  Status: Administrator

User 3: New User (Registration)
  Email: newuser@example.com
  Password: NewPass123!
  Name: New Test User
  Status: Just registering
```

### 3.2 Test Data for Scenarios

**For each scenario, define required data:**

```
Scenario: Add product to cart
  Product: Electronics > Laptop
  Product Name: Test Laptop
  Product Price: $999.99
  Quantity: 1
  Expected in Cart: $999.99 total
```

---

## Phase 4: Plan Test Implementation

### 4.1 Test Environment Setup

- [ ] Base URL: `http://localhost:3000` (or your dev URL)
- [ ] Browser: Chrome/Firefox/WebKit (Playwright supports all)
- [ ] Viewport: Desktop standard (1280x720)
- [ ] Authentication: Pre-login setup or test account creation
- [ ] Test Data: Database fixtures or create during test

### 4.2 Test Selectors Strategy

**Choose selector approach:**

- [ ] Use `data-testid` attributes (recommended)
  ```html
  <button data-testid="login-button">Login</button>
  ```

- [ ] Use accessible selectors (role-based)
  ```
  getByRole('button', { name: /login/i })
  ```

- [ ] Use semantic selectors (CSS/XPath)
  ```
  button:has-text("Login")
  ```

**Preference order (most to least robust):**
1. `data-testid` - Most explicit
2. Role-based - Most semantic
3. Text-based - Most user-focused
4. CSS selectors - Last resort

### 4.3 Wait Strategies

**Define how to handle async operations:**

```
Navigation waits: await page.goto('/path')
Element visibility: await page.waitForSelector(selector)
Network requests: await page.waitForLoadState('networkidle')
Custom waits: await page.waitForFunction(() => ...)
```

---

## Phase 5: Estimate Test Count

### 5.1 Calculate Total Tests

| Scenario Type | Count | Example |
|---|---|---|
| Happy Path | _____ | Login, Register, Purchase |
| Error Cases | _____ | Invalid input, auth failure |
| Edge Cases | _____ | Long strings, special chars |
| Alternative Flows | _____ | Different navigation paths |
| **Total Estimated** | **_____** | |

**Target:** 15-25 E2E scenarios per person (adjust for team size)

---

## Planning Output Format

When complete, document:

```
UI/E2E TEST PLAN
================

1. COMPLETENESS: E2E SCENARIOS
   Scenario 1: [Journey Name]
   └─ Steps: Navigate → Act → Verify (specify each)
   └─ Assertions: [what user sees at end]

   Scenario 2: [Journey Name]
   └─ Steps: [...]
   └─ Assertions: [...]

   (List all scenarios)

2. CORRECTNESS: PLAYWRIGHT IMPLEMENTATION
   Base URL: [your app URL]
   Browser: [Chrome/Firefox/WebKit]
   Selectors: [data-testid / role-based / other]
   Wait Strategy: [how to handle async]

3. VARIETY: SCENARIO COVERAGE
   ✓ Happy Path: [list scenarios]
   ✓ Error Cases: [list scenarios]
   ✓ Edge Cases: [list scenarios]
   ✓ Alternative Flows: [list scenarios]

4. TEST DATA
   Test User 1: [email, password, role]
   Test User 2: [email, password, role]
   Test Products: [name, price, category]

5. ESTIMATED TEST COUNT
   Total: ___ tests
   Per category: Happy[__] Error[__] Edge[__] Alt[__]

READY FOR IMPLEMENTER ✓
```

---

## Key Points

✅ **DO:**
- Test COMPLETE user journeys (not just page elements)
- Use Playwright to navigate and interact
- Assert on visible/observable outcomes
- Include error and edge case scenarios
- Test diverse features and user flows
- Create realistic test data

❌ **DON'T:**
- Just check that page elements exist
- Test implementation details
- Forget to wait for navigation/loading
- Assume instant responses (use waits)
- Test only happy paths
- Ignore error scenarios

