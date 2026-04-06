---
name: Integration Test Planner
description: Plan integration tests following systematic approach (MS2 rubric aligned)
type: agent-planner
rubric_alignment: MS2
approach_weight: 0.5%
correctness_weight: 1%
variety_weight: 0.5%
---

# Integration Test Planner - MS2 Standard

**Plan integration tests for component interactions** (not isolation, like unit tests).

---

## OPTIONAL Phase 0: Review Architecture & Prior Patterns (Cross-Module Learning)

**Skip if first module. Check `_memory/` if prior modules were tested.**

- [ ] Read `_memory/[prior-module].md` — Architecture, component pairs, integration approach used
- [ ] Read `_memory/patterns.md` — Mocking strategies, what worked as REAL vs MOCK

**Optional.** Proceed to Phase 1 even if no prior data exists.

---

**Key difference from Unit Tests:**
- Unit: Test ONE function in isolation with mocks
- Integration: Test 2+ components working together with REAL interactions

---

## MS2 Rubric Requirements

### Rubric Criterion 1: Approach (0.5%)

**Score 0.5: Clear approach documented and code aligns**

You must:
- [ ] Choose an integration approach (bottom-up, top-down, etc.)
- [ ] Document the approach clearly
- [ ] Ensure test code follows the documented approach
- [ ] Explain WHY this approach for your components

**Common Integration Approaches:**

**Bottom-Up Integration:**
```
Start with: Low-level units (database layer, helpers)
Then add: Controllers/services that use those units
Then add: Routes that use controllers
Benefits: Test core logic first, build complexity gradually
```

**Top-Down Integration:**
```
Start with: High-level routes/APIs
Then add: Lower-level controllers
Then add: Helper/data layer
Benefits: Test user-facing flows first
```

**Sandwich (Hybrid):**
```
Test: High-level + Low-level simultaneously
Middle: Fill in as needed
Benefits: Parallel development, focused testing
```

**Choose the approach that fits your architecture** - No universal "best" approach

---

### Rubric Criterion 2: Correctness (1%)

**Score 1.0: Testing real component interactions, appropriate mocking**

You must:
- [ ] Test 2+ components actually interacting (not mocking each other)
- [ ] Mock only external dependencies (database can be mocked, but if testing DB integration, use real)
- [ ] Real data flows between components
- [ ] Assert on both responses AND side effects

**What NOT to do:**
```javascript
// ❌ BAD: This is still unit testing (everything mocked)
it('should call controller', () => {
  const mockModel = jest.fn();
  const mockHelper = jest.fn();
  controller(mockModel, mockHelper);
  expect(mockModel).toHaveBeenCalled();
});

// ✅ GOOD: Testing controller + model interaction (real)
it('should save user via controller and model', () => {
  const controller = new UserController();
  const model = new UserModel(); // Real model
  const fakeDB = { save: jest.fn().mockResolvedValue({ id: 1 }) };

  const result = controller.register(email, password, model, fakeDB);
  expect(result.success).toBe(true);
  expect(fakeDB.save).toHaveBeenCalledWith(expect.objectContaining({
    email: email,
    password: expect.any(String) // hashed
  }));
});
```

---

### Rubric Criterion 3: Variety (0.5%)

**Score 0.5: Test at least 2 different component files**

You must:
- [ ] Test interactions between different components (not variations of same component)
- [ ] Example: AuthController + UserModel (different files)
- [ ] NOT: LoginController + RegisterController (both same level)
- [ ] At least 2 different component files involved

**Good examples:**
```
✅ registerController.js + userModel.js
✅ productController.js + categoryModel.js
✅ orderController.js + paymentService.js
❌ registerController.js + loginController.js (same level, not integrating)
❌ hashPassword (helper) + hashPassword again (not integration)
```

---

## Phase 1: Analyze Component Interactions

### 1.1 Choose Integration Approach

**Decision:** Which approach?
- [ ] **Bottom-up:** Start with helpers/models, add controllers
- [ ] **Top-down:** Start with routes/controllers, add models
- [ ] **Sandwich:** Start with both, meet in middle

**Reason:** Why this approach for your components?
```
Example: "Bottom-up because we test models first (database-centric),
then controllers that depend on those models. Aligns with existing
test structure in tests/integration/"
```

### 1.2 Identify Component Pairs to Test

**Identify which components interact in your architecture:**

For your project, identify:
- High-level components (routes, controllers, services)
- Mid-level components (controllers, services, managers)
- Low-level components (models, repositories, data access)
- Helper/utility components (helpers, formatters, validators)

**Choose 2+ pairs to test:**
- [ ] Pair 1: [ComponentA] + [ComponentB]
  - Reason: Tests interaction between [describe]

- [ ] Pair 2: [ComponentA] + [ComponentB]
  - Reason: Tests interaction between [describe]

- [ ] Pair 3: [ComponentA] + [ComponentB] (if needed)
  - Reason: Tests interaction between [describe]

### 1.3 Identify What to Mock vs Real

**For each pair, decide:**

| Component | Mock or Real? | Reason |
|-----------|---|---|
| Pair 1 - Component A | Real / Mock | Testing its logic? |
| Pair 1 - Component B | Real / Mock | Testing its logic? |
| External: Database | Real (in-memory) / Mock | Need real interaction? |
| External: API | Mock | External service |
| External: Email | Mock | Slow, not testing |

**Key rule:** Mock external services, keep real components talking to each other

---

## Phase 2: Design Integration Test Scenarios

### 2.1 Happy Path (Component Interaction Works)

**Scenario:** Normal flow where components work together

Example:
```
Pair: authController.js + userModel.js
Scenario: Register flow
  - authController receives email/password
  - Calls userModel.create()
  - userModel validates and saves
  - Returns success with user object
```

### 2.2 Error Scenarios (Failures Between Components)

**Scenario:** What happens when one component fails?

Example:
```
Scenario: Database save fails
  - authController.register() calls userModel.create()
  - userModel tries to save to DB
  - DB fails (mocked)
  - authController should handle error gracefully
```

### 2.3 Data Flow Scenarios (Data Transforms)

**Scenario:** How does data flow and transform?

Example:
```
Scenario: Password hashing through layers
  - authController receives plaintext password
  - Calls authHelper.hashPassword()
  - Returns hashed password
  - Passes to userModel.create()
  - Model stores hashed (not plaintext) in DB
```

### 2.4 State Changes (Side Effects)

**Scenario:** What actually changed?

Example:
```
Scenario: User created in database
  - Before: DB empty
  - Call: authController.register()
  - After: User in DB with hashed password
  - Side effect: JWT token returned
```

### 2.5 Edge Cases / Boundaries

**Scenario:** Unusual but valid inputs

Example:
```
Scenario: Very long email with special characters
  - authController processes unusual email
  - userModel validates correctly
  - Database saves without error
```

---

## Phase 3: Define Test Data & Setup

### 3.1 Test Data

**Create realistic test data for your components:**

Define test data that represents what your components actually handle:
- Real but fake data (not "test123" or "xyz")
- Valid values within expected ranges
- Representative of actual production data
- Includes both simple and complex cases

### 3.2 Setup/Teardown

**Database:**
- [ ] Use in-memory database (mongodb-memory-server)
- [ ] Fresh database before each test
- [ ] Clean up after each test

**Mocks:**
- [ ] Clear all mocks before/after
- [ ] Initialize fresh mocks per test
- [ ] Reset spy counters

### 3.3 Test File Location & Naming

**Follow your project's test file conventions:**
- Where does your project store integration tests? (tests/integration/, spec/, __tests__/, etc.)
- What's your naming pattern? (feature-integration.test.js, component.spec.js, etc.)
- Use consistent conventions with existing tests

**Example (adjust to your project):**
```
[your-test-directory]/
├── [component-pair-1]-integration.test.js
├── [component-pair-2]-integration.test.js
└── [component-pair-3]-integration.test.js
```

---

## Phase 4: Define Integration Test Count

**How many tests?**

| Complexity | Test Count | Example |
|---|---|---|
| Simple pair (2 components) | 5-10 tests | Controller + Model |
| Medium pair (2 components + helpers) | 10-15 tests | Controller + Model + Helper |
| Complex (3+ components) | 15-25 tests | Route + Controller + Model |

**Estimate for your pair:** _____ tests

---

## Planning Output Format

When complete, document:

```
INTEGRATION TEST PLAN
=====================

1. APPROACH
   Selected: [Bottom-up / Top-down / Sandwich]
   Reason: [Why for these components]

2. COMPONENT PAIRS
   Pair 1: [file1].js + [file2].js
   Reason: [What interaction tested]

   Pair 2: [file1].js + [file2].js
   Reason: [What interaction tested]

3. MOCK STRATEGY
   Component A: Real / Mock
   Component B: Real / Mock
   Database: Real (in-memory) / Mock
   External APIs: Mocked

4. TEST SCENARIOS
   ✓ Happy Path: [describe]
   ✓ Error Handling: [describe]
   ✓ Data Flow: [describe]
   ✓ State Changes: [describe]
   ✓ Edge Cases: [describe]

5. TEST DATA
   - Test user: [realistic example]
   - Test product: [realistic example]
   - Database: in-memory via mongodb-memory-server

6. ESTIMATED TEST COUNT
   Pair 1: ___ tests
   Pair 2: ___ tests
   Total: ___ tests

7. SUCCESS CRITERIA
   ☐ Tests verify real component interaction
   ☐ Each component's behavior tested
   ☐ Mocking only external dependencies
   ☐ Data flows correctly between components
   ☐ Errors handled appropriately

READY FOR IMPLEMENTER ✓
```

---

## MS2 Rubric Alignment Checklist

Before handing off, verify:

- [ ] **Approach (0.5%)**
  - [ ] Clear integration approach chosen
  - [ ] Approach documented
  - [ ] Code will align with approach

- [ ] **Correctness (1%)**
  - [ ] 2+ components in real interaction
  - [ ] Appropriate mocking (not everything mocked)
  - [ ] Data flows between components

- [ ] **Variety (0.5%)**
  - [ ] At least 2 different component files
  - [ ] Different levels (not just same level)
  - [ ] Real integration being tested

---

## Notes for Your Project

**Adapt these guidelines to YOUR project:**
- Replace "Component A" with your actual components
- Replace "database" with your actual database technology
- Adjust test file naming to match your conventions
- Use your project's testing tools (Jest, pytest, etc.)

**Example adaptation:**
```
Generic: Component A + Component B integration
Your project: [YourControllerA] + [YourModelB] integration
```

Study your project's existing test patterns for conventions to follow!

