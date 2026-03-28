---
name: Integration Test Reviewer
description: Review integration tests against MS2 rubric criteria
type: agent-reviewer
rubric_total: 2%
---

# Integration Test Reviewer - MS2 Standard

**Review integration tests against MS2 rubric criteria before approval.**

---

## MS2 Rubric Overview (2% total)

| Criterion | Weight | What We Check |
|-----------|--------|---------------|
| Approach | 0.5% | Clear integration approach documented and code aligns |
| Correctness | 1% | Testing real component interactions with appropriate mocking |
| Variety | 0.5% | At least 2 different component files tested together |

**Passing Score:** All criteria met

---

## Criterion 1: Approach (0.5%)

**Score 0.5: Clear approach documented and code aligns**

### What's Required

- [ ] **Approach Clearly Documented**
  - [ ] Integration approach chosen (bottom-up, top-down, sandwich)
  - [ ] Reason WHY this approach
  - [ ] Documented before/with code

- [ ] **Code Aligns with Approach**
  - [ ] Tests follow the documented approach
  - [ ] Test structure reflects chosen approach
  - [ ] No misalignment between description and code

### How to Verify

1. **Check documentation** - Is approach explained?
2. **Read test code** - Do tests follow that approach?
3. **Check test order** - Do they build from stated foundation?

### Approach Checklist

**If Bottom-Up:**
- [ ] Tests start with models/helpers
- [ ] Then add controllers using those components
- [ ] Then add routes/integrations at top
- [ ] Each layer builds on previous

**If Top-Down:**
- [ ] Tests start with routes/controllers
- [ ] Then add lower-level models
- [ ] Then add helpers/utilities
- [ ] Work downward from user entry point

**If Sandwich:**
- [ ] Tests start with both high and low level
- [ ] Middle components added as needed
- [ ] Clear coverage of all layers

### Example

**✅ GOOD: Clear Approach**
```
Approach: Bottom-up integration
Rationale: Test models first (database core),
then controllers that depend on them.
Aligns with existing test structure.

Test structure:
1. userModel tests (models)
2. authController using userModel (controller)
3. userRoutes using authController (routes)
```

**❌ BAD: No Clear Approach**
```
Just wrote integration tests
Didn't explain approach
Tests seem random order
```

---

## Criterion 2: Correctness (1%)

**Score 1.0: Testing real component interactions with appropriate mocking**

### Requirement 1: Testing Real Interactions (Not Unit Tests)

- [ ] **Multiple Components Interact**
  - [ ] 2+ components are actually called
  - [ ] Not mocking each other
  - [ ] Data flows between them
  - [ ] Example: Controller calls Model calls Database

- [ ] **Verify Interaction Happened**
  - [ ] Assert on component A's behavior
  - [ ] Assert on component B's behavior
  - [ ] Assert on data passed between them
  - [ ] Assert on results of interaction

**How to verify:**
```javascript
// ✅ GOOD: Testing interaction
const controller = new AuthController();
const model = new UserModel();

const result = await controller.register(email, password, model);

expect(result.success).toBe(true);      // Controller response
const user = await model.findOne({ email });
expect(user).toBeDefined();              // Model saved it
expect(user.password).not.toBe(password); // Interaction effect
```

**❌ BAD: Still unit testing (mocking instead of integrating)**
```javascript
const mockModel = jest.fn();
controller.register(email, password, mockModel);
expect(mockModel).toHaveBeenCalled(); // Not testing interaction
```

### Requirement 2: Appropriate Mocking/Stubbing

- [ ] **Only External Dependencies Mocked**
  - [ ] Your own components: REAL
  - [ ] External APIs: Mocked (Braintree, email, etc.)
  - [ ] Database: REAL (use in-memory)
  - [ ] Helpers/utils: REAL or as needed

- [ ] **Mocks Return Realistic Data**
  - [ ] Mock doesn't return garbage
  - [ ] Mock behavior reflects real service
  - [ ] Assertions on mock data make sense

- [ ] **NOT Over-Mocking**
  - [ ] Don't mock components under test
  - [ ] Don't mock interactions you're testing
  - [ ] Mock only what's truly external

### Correctness Checklist

```
For each integration test:

☐ Components interact (not mocked)
☐ Both component behaviors tested
☐ Data flows between them
☐ Results verify interaction happened
☐ External dependencies only mocked
☐ Assertions specific (not vague)
☐ No test interdependencies
☐ Test independent and repeatable
```

### Example

**✅ GOOD: Testing Real Interaction**
```javascript
describe('[ComponentA] and [ComponentB] integration', () => {
  it('should transform data when components interact', async () => {
    // Real components (not mocked)
    const componentA = new YourComponent();
    const componentB = new AnotherComponent();

    // Act
    const result = await componentA.doSomething(
      testData,
      componentB  // Real component, not mock
    );

    // Assert interaction
    expect(result.success).toBe(true);  // Component A worked

    // Verify component B processed it
    const saved = await componentB.retrieve(result.id);
    expect(saved).toBeDefined();
    expect(saved.transformed).toBe(true); // Interaction effect
  });
});
```

**❌ BAD: Over-Mocking (Not Real Integration)**
```javascript
describe('[ComponentA]', () => {
  it('should do something', () => {
    // Everything mocked - not integration!
    const mockB = jest.fn().mockReturnValue({ id: 1 });
    const mockHelper = jest.fn();

    componentA.process(data, mockB, mockHelper);

    expect(mockB).toHaveBeenCalled(); // Just checking mocks called
    // Not testing actual interaction!
  });
});
```

---

## Criterion 3: Variety (0.5%)

**Score 0.5: At least 2 different component files tested**

### Requirement

- [ ] **At least 2 different component files**
  - [ ] NOT same file tested in different ways
  - [ ] NOT same level components
  - [ ] Different layers or different features

- [ ] **Examples of Good Variety**
  - ✅ High-level component + low-level component (different layers)
  - ✅ Service A + Service B (different features)
  - ✅ Controller + Repository (different responsibilities)

- [ ] **Examples of BAD Variety**
  - ❌ ComponentA + ComponentB where both are same level/type
  - ❌ Same component tested multiple times (different ways)
  - ❌ Helper function tested in 2 scenarios (not integration)

### Variety Verification

1. **List components tested:**
   - Component pair 1: __________.js + __________.js
   - Component pair 2: __________.js + __________.js
   - Etc.

2. **Verify they're different files:**
   - [ ] Not same file tested multiple times
   - [ ] Not same level (e.g., not both controllers)
   - [ ] Actually testing interactions

3. **Check for meaningful variety:**
   - [ ] Different interaction types tested
   - [ ] Not just variations of same interaction

### Example

**✅ GOOD: Variety Across Different Components**
```
Test File 1: [feature1]-integration.test.js
├─ [ComponentA] + [ComponentB] interaction
└─ [ComponentA] + [ComponentC] interaction

Test File 2: [feature2]-integration.test.js
├─ [ComponentD] + [ComponentE] interaction
└─ [ComponentD] + [ComponentF] interaction

Different files? YES ✓
Different component pairs? YES ✓
Multiple integrations? YES ✓
```

**❌ BAD: No Real Variety**
```
Test File: [component]-integration.test.js
├─ [ComponentA] alone (tested in isolation)
├─ [ComponentA] with different inputs
├─ [ComponentB] alone (tested in isolation)

Different component pairs? NO ✗
Real integration testing? NO ✗ (not testing components together)
```

---

## Overall Verdict Options

### ✅ PASS (Score: 2%)

**All rubric criteria met.**

- [ ] **Approach (0.5%)** - Clear, documented, code aligns
- [ ] **Correctness (1%)** - Real interactions, appropriate mocking
- [ ] **Variety (0.5%)** - 2+ different component files tested

**Requirements:**
- Clear integration approach documented
- Tests show real component interactions (not isolated/mocked)
- Appropriate mocking strategy (external only)
- At least 2 different component files involved
- Code quality (AAA pattern, clear naming)
- All tests pass
- Author attribution present

**Verdict: PASS — Ready for submission**

---

### 🔄 REVISE (Score: < 2%)

**Some criteria not fully met, but fixable.**

**Possible issues:**

```
❌ Approach unclear or code doesn't align
→ Fix: Document approach clearly, ensure code follows it

❌ Mocking inappropriate (over-mocking components)
→ Fix: Keep components real, only mock external services

❌ Only 1 component file, not 2+
→ Fix: Add integration tests for another component pair

❌ Tests look like unit tests (too isolated)
→ Fix: Ensure components actually interact in tests

❌ Code quality issues
→ Fix: Add AAA pattern, clear naming, proper setup/teardown
```

**Action:** Fix specific issues, re-review.

---

### ↩️ REWRITE (Score: 0%)

**Fundamental misunderstanding of integration testing.**

**Critical issues:**

```
❌ Tests are still unit tests (everything mocked)
   → Solution: Rewrite to test real interactions

❌ No clear approach / random test structure
   → Solution: Plan approach first (agent.md), then implement

❌ No multiple component files
   → Solution: Identify component pairs to test together

❌ Inappropriate understanding of mocking
   → Solution: Study examples, understand when to mock vs keep real
```

**Action:** Go back to Planner (agent.md), redesign test approach.

---

## Review Checklist

```
INTEGRATION TEST REVIEW
=======================

Test File: ________________
Reviewer: ________________
Date: ________________

CRITERION 1: Approach (0.5%)
☐ Approach documented (bottom-up/top-down/sandwich)
☐ Reason clearly stated
☐ Code structure follows approach
☐ Tests align with documented approach
Result: ☐ Pass ☐ Needs Work

CRITERION 2: Correctness (1%)
☐ Multiple components interact (not mocked)
☐ Data flows between components
☐ Both component behaviors tested
☐ External dependencies only mocked
☐ Mocks return realistic data
☐ Assertions on interactions
☐ All tests pass
Result: ☐ Pass ☐ Needs Work

CRITERION 3: Variety (0.5%)
☐ At least 2 different component files
☐ Not same file tested multiple ways
☐ Different layers or features
☐ Real variety in integrations
Result: ☐ Pass ☐ Needs Work

CODE QUALITY
☐ AAA pattern used
☐ Test names describe interaction
☐ Setup/teardown proper
☐ No test interdependencies
☐ Author attribution present
Result: ☐ Pass ☐ Needs Work

OVERALL DECISION
☐ PASS (2%) — All criteria met, ready for submission
☐ REVISE — Fix specific issues (list below)
☐ REWRITE — Return to planning, redesign approach

Issues to fix (if applicable):
_____________________________
_____________________________
_____________________________

Reviewer Notes:
_____________________________
_____________________________
```

---

## Anti-Patterns to Flag

### ❌ Anti-Pattern 1: Still Unit Testing (Everything Mocked)

**Problem:** Tests look like unit tests, not integration

```javascript
// ❌ BAD
const mockModel = jest.fn();
const mockHelper = jest.fn();
controller(mockModel, mockHelper); // Nothing real!
```

**Fix:** Use real components, mock only external

---

### ❌ Anti-Pattern 2: No Clear Approach

**Problem:** Tests seem random, no documented strategy

**Fix:** Document approach first (bottom-up/top-down), ensure code follows

---

### ❌ Anti-Pattern 3: Insufficient Variety

**Problem:** Only 1 component pair tested, or same component tested different ways

**Fix:** Add tests for another component pair (e.g., products, orders)

---

### ❌ Anti-Pattern 4: Inappropriate Mocking

**Problem:** Mocking components under test instead of external services

```javascript
// ❌ BAD: Mocking the components we want to test
const mockController = jest.fn();
const mockModel = jest.fn();
// This defeats the purpose of integration testing!

// ✅ GOOD: Only mock external
const controller = new Controller(); // Real
const model = new Model(); // Real
const mockExtAPI = jest.fn(); // Mock external
```

**Fix:** Keep your components real, only mock truly external services

---

## Quick Decision Flow

```
Does test code match documented approach?
├─ NO → Flag: Approach alignment issue
└─ YES → Continue

Are components actually interacting (not mocked)?
├─ NO (everything mocked) → Flag: Not testing integration
└─ YES → Continue

Is mocking only external dependencies?
├─ NO (mocking own components) → Flag: Over-mocking
└─ YES → Continue

Are at least 2 different component files tested together?
├─ NO → Flag: Insufficient variety
└─ YES → Continue

Code quality OK? (AAA, naming, setup, etc.)
├─ NO → Flag: Quality issues
└─ YES

✅ PASS: Award full 2%
```

---

## Tips for Reviewers

1. **Run the tests** - Do they pass?
2. **Check component interaction** - Are they actually calling each other?
3. **Verify mocking** - Is it appropriate or over-done?
4. **Trace data flow** - Does data flow correctly between components?
5. **Check approach alignment** - Do tests follow documented strategy?
6. **Verify variety** - Are multiple different components tested?

