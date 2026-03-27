# Unit Test Reviewer - Quality Checklist

**Review tests against rubric criteria before approval.**

---

## Rubric Overview

| Criteria | Weight | What We Check |
|----------|--------|---------------|
| Adherence to Principled Approach | 1% | Systematic approach (9 techniques) |
| Test Variety & Scope | 1% | Coverage of scenarios, edge cases |
| Correctness of Unit Tests | 2% | Testing in isolation, no issues |
| Code Quality | 1% | AAA pattern, readability, assertions |

---

## Criterion 1: Adherence to Principled Approach (1%)

**Score 1.0: Clearly follows the chosen approach**

### Checklist

- [ ] **Phase 1 (Analyze) Completed**
  - [ ] Unit clearly identified and documented
  - [ ] Complexity classification done (Simple/Medium/Complex)
  - [ ] Inputs/outputs mapped
  - [ ] Dependencies identified
  - [ ] Public interface defined (no private method testing)

- [ ] **Phase 2 (Design) Covered 9 Techniques**
  - [ ] Happy path scenario defined
  - [ ] Equivalence partitioning used (categories tested)
  - [ ] Boundary values identified and tested
  - [ ] Invalid/negative inputs tested
  - [ ] Error handling scenarios tested
  - [ ] Conditional branches covered
  - [ ] Decision table for complex logic (if applicable)
  - [ ] Side effects verified
  - [ ] Security invariants checked (if applicable)

- [ ] **Phase 3 (Test Type) Chosen**
  - [ ] Output-based / State-based / Communication-based test type is clear
  - [ ] Appropriate for the unit being tested

- [ ] **Phase 4 (Doubles) Strategy Clear**
  - [ ] Each dependency is Real / Mock / Stub / Fake by intention
  - [ ] Reasoning is documented (why this choice?)
  - [ ] Not mocking own code (only external dependencies)

### How to Verify

1. **Read the planner document** - Does it follow the 4-phase structure?
2. **Check if 9 techniques are visible** in test scenarios
3. **Verify test type reasoning** - Is it the right choice?
4. **Check mocking strategy** - Is it intentional, not just "let's mock"?

### Examples

**✅ GOOD: Principled Approach**
```
Planner documented:
- Phase 1: Function identified as "Medium complexity"
- Phase 2: 9 techniques used:
  ✓ Happy path: Valid registration
  ✓ Equivalence: 3 invalid email categories tested
  ✓ Boundaries: Password length 7,8,128,129 tested
  ✓ Invalid inputs: null, empty string, special chars
  ✓ Error: DB failure scenario
  ✓ Branches: Email exists / new email paths
  ✓ Side effects: Verify bcrypt.hash called
- Phase 3: State-based testing (object modified)
- Phase 4: Dependencies - Mock userModel, Real bcrypt

Tests follow this plan clearly.
```

**❌ BAD: No Principled Approach**
```
Planner: Just a list of test names, no analysis
Tests: Random scenarios, no clear approach
Dependencies: Everything mocked "just because"
Techniques: Hard to identify which are used
```

---

## Criterion 2: Test Variety & Scope (1 Point)

**Score 1.0: Tests show strong variety, covering important edge cases and scenarios**

### Minimum Required Coverage

**REQUIRED:** At minimum, your tests must include:

- [ ] **At least 1 Happy Path test**
  - [ ] One successful/normal scenario
  - [ ] Clear what success looks like

- [ ] **At least 2 Boundary Value tests**
  - [ ] Numeric limits (below, at, above)
  - [ ] String length (empty, minimum, maximum)
  - [ ] Valid range boundaries
  - Examples: 0 vs 1, -1 vs 0, 99 vs 100, empty string vs 1 char

- [ ] **At least 1 Negative Input test**
  - [ ] Null/undefined handling
  - [ ] Wrong types (string for number, etc.)
  - [ ] Out of range values
  - [ ] Empty/blank values
  - [ ] Special characters

- [ ] **At least 1 Error Handling test**
  - [ ] Dependency failures (DB error, API error)
  - [ ] Proper error thrown/returned
  - [ ] Exception handling verified

- [ ] **State Transitions & Side Effects** (if applicable)
  - [ ] Verify state actually changed
  - [ ] Verify side effects occurred
  - [ ] Verify object modification works

### Full Coverage Checklist

- [ ] **Equivalence Partitioning**
  - [ ] Multiple input categories identified
  - [ ] At least one representative per category tested
  - [ ] Not just testing one value

- [ ] **Boundary Analysis**
  - [ ] Below boundary value
  - [ ] At boundary value
  - [ ] Above boundary value

- [ ] **Decision Coverage**
  - [ ] All if/else branches tested
  - [ ] All switch cases tested
  - [ ] Combinations of conditions tested

- [ ] **No Redundant Tests**
  - [ ] No multiple tests hitting same code path
  - [ ] Each test adds unique coverage

### Test Count by Complexity

- **Simple function:** 3-5 tests minimum
  - Example: formatDate() → 1 happy + 2 boundary + 1 error = 4 tests
- **Medium function:** 8-15 tests minimum
  - Example: validateEmail() → 1 happy + 3 boundary + 3 negative + 1+ error = 8+ tests
- **Complex function:** 15-30+ tests minimum
  - Example: processOrder() → Happy + boundaries + invalid + error + state + interactions = 20+ tests

### How to Verify

1. **Count test scenarios** - How many total?
2. **List categories covered** - What types of cases?
3. **Check for gaps** - Are there obvious missing scenarios?
4. **Verify no redundancy** - Are multiple tests hitting same code path?

### Example

**✅ GOOD: Strong Variety**
```
registerUser() tests:
1. Happy path: Valid email/password → success
2. Email equivalence: Short / Long / With+ / Special domain
3. Password boundaries: 7 chars / 8 chars / 128 chars / 129 chars
4. Invalid types: email as number, password as object
5. Error cases: Email exists, DB fails, bcrypt fails
6. Edge cases: Unicode email, passwords with all special chars
Total: 12 tests - Good coverage, no redundancy
```

**❌ BAD: Limited Variety**
```
registerUser() tests:
1. should register user → success
2. should not register user → failure
3. should hash password
Total: 3 tests - Missing many scenarios, too vague
```

---

## Criterion 3: Correctness of Unit Tests (2 Points)

**Score 2.0: Unit tests correctly testing components in isolation with no issues found**

### Checklist

- [ ] **Tests Isolated (Not Integration)**
  - [ ] Each test tests ONE unit, not multiple
  - [ ] External dependencies are mocked/stubbed
  - [ ] Database not hit (use mocks or in-memory)
  - [ ] External APIs not called (use mocks)
  - [ ] Tests don't modify shared state

- [ ] **No Test Interdependencies**
  - [ ] Test order doesn't matter
  - [ ] One test failing doesn't affect others
  - [ ] No shared state between tests
  - [ ] Each test has clean setup/teardown
  - [ ] Can run tests in any order

- [ ] **Test Doubles (Mocks, Stubs, Fakes) Correct**
  - [ ] Stubs return realistic data
  - [ ] Stub doesn't have unnecessary logic
  - [ ] Fake implementations are accurate
  - [ ] Real code used when needed (bcrypt, crypto, etc.)
  - [ ] Not mocking your own code (only external dependencies)
  - [ ] Not over-mocking (avoiding over-specification)

- [ ] **Assertions Are Precise and Mutation-Proof**
  - [ ] Each assertion is checking intended behavior
  - [ ] Assertions are specific (not just truthy/falsy)
  - [ ] Right assertion type used (toBe vs toEqual, etc.)
  - [ ] Negative cases assert failure correctly
  - [ ] Side effects verified (function calls, state changes)
  - [ ] Would fail if code behavior changed incorrectly
  - [ ] Test would fail if assertion value changed

- [ ] **All Tests Pass**
  - [ ] npm run test:backend passes 100%
  - [ ] No failing tests
  - [ ] No skipped/pending tests (unless documented reason)
  - [ ] Coverage meets 80% target

- [ ] **Mutation Testing Ready** (Mutation-Proof)
  - [ ] Would catch if unit returned opposite boolean
  - [ ] Would catch if unit returned null instead of value
  - [ ] Would catch if function not called
  - [ ] Would catch if wrong parameter passed
  - [ ] Would catch if loop condition wrong
  - [ ] Would catch if comparison operator flipped (> to <)

### Four Pillars Validation

Tests must pass **at least 3 of 4 pillars**:

1. **Regression Protection**
   - [ ] Test fails if code is changed to broken behavior
   - [ ] Catches bugs and breaks in existing functionality
   - Question: "Would this test catch a regression?"

2. **Refactoring Resistance**
   - [ ] Test still passes if code refactored (same behavior, different impl)
   - [ ] Tests behavior, not implementation details
   - Question: "Would refactoring break this test?"

3. **Fast Feedback**
   - [ ] Test runs quickly (under 100ms)
   - [ ] No unnecessary waits or delays
   - [ ] Uses mocks for slow operations
   - Question: "Does this test give instant feedback?"

4. **Maintainability**
   - [ ] Test is easy to understand
   - [ ] Test name explains what/why
   - [ ] No complex setup or teardown
   - Question: "Can someone else understand this test?"

**Scoring:**
- 4 of 4 pillars: ✅ Excellent
- 3 of 4 pillars: ✅ Pass
- 2 of 4 pillars: ❌ Needs work
- 1 of 4 pillars: ❌ Rewrite

### How to Verify

1. **Run the tests** - Do they all pass?
2. **Check coverage** - npm run test:backend -- --coverage (≥80%?)
3. **Break the code** - Modify unit, which tests fail? (Should be multiple)
4. **Run in different order** - shuffle test order, all still pass?
5. **Check mocks are correct** - Do they return what code expects?
6. **Four Pillars check** - Does test pass 3+ pillars?

### Example

**✅ GOOD: Correct Unit Tests**
```javascript
describe('hashPassword', () => {
  // Isolated: no DB, no external calls
  // Using real bcrypt (security-critical)

  it('should return hashed password', () => {
    const plain = 'TestPass123';
    const hashed = hashPassword(plain);

    // Correct assertions:
    expect(hashed).not.toBe(plain); // Not plaintext
    expect(hashed.length).toBe(60); // Bcrypt hash length
    expect(hashed).toMatch(/^\$2a\$10\$/); // Bcrypt format

    // INCORRECT would be:
    // expect(hashed).toBeTruthy(); // Too vague
    // expect(typeof hashed).toBe('string'); // Testing language, not behavior
  });
});

// No test interdependency - each test fresh
beforeEach(() => {
  jest.clearAllMocks();
});
```

**❌ BAD: Incorrect Unit Tests**
```javascript
describe('loginController', () => {
  // Over-mocking (shouldn't mock own code)
  const mockHashPassword = jest.fn().mockReturnValue('hash123');

  it('should login user', () => {
    // Not isolated (calling real controller, mocking helper)
    const result = loginController('user@test.com', 'password',
                                   mockUserModel,
                                   mockHashPassword); // Mocking own code!

    // Weak assertions
    expect(result).toBeTruthy(); // Too vague

    // Test interdependency (relies on previous test setup)
  });

  it('should return error for missing email', () => {
    // Tests fail randomly because state shared
  });
});
```

---

## Criterion 4: Code Quality (1%)

**Score 1.0: Well structured unit tests (AAA/Given-When-Then pattern)**

### Checklist

- [ ] **AAA Pattern Consistently Used**
  - [ ] Clear ARRANGE section (setup)
  - [ ] Clear ACT section (call unit)
  - [ ] Clear ASSERT section (verify)
  - [ ] Sections are visually separated
  - [ ] Optional: Comments labeling each section

- [ ] **Test Names Describe Behavior**
  - [ ] Format: "should <action/outcome> when <condition>"
  - [ ] Names are specific, not generic
  - [ ] Can understand test purpose from name
  - [ ] No redundant names ("test1", "test case 2")

- [ ] **Assertions Are Specific**
  - [ ] Using appropriate assertion methods
  - [ ] Not just .toBeTruthy() for everything
  - [ ] Verifying exact values/types
  - [ ] Clear what failure means

- [ ] **Code is Readable**
  - [ ] Variable names are meaningful
  - [ ] Test data is realistic (not just "test" or "x")
  - [ ] Not overly complex logic in tests
  - [ ] Consistent style/formatting
  - [ ] Line length reasonable (not too long)

- [ ] **Setup/Cleanup is Clear**
  - [ ] beforeEach() and afterEach() used appropriately
  - [ ] No side effects between tests
  - [ ] Mocks/spies cleared
  - [ ] Test data cleaned up

- [ ] **Comments Where Needed**
  - [ ] Author name and student ID on each test file
  - [ ] Complex setup explained
  - [ ] Why mocking a particular way (if not obvious)
  - [ ] Not over-commented (code should be clear)

### How to Verify

1. **Read test without looking at code** - Understand purpose?
2. **Check formatting** - Consistent indentation, spacing?
3. **Review assertions** - Specific or vague?
4. **Look for comments** - Author attribution present?

### Example

**✅ GOOD: High Code Quality**
```javascript
/**
 * Unit Tests: authHelper.js
 * Author: Kim Shi Tong, A0265858J
 */

describe('hashPassword', () => {
  it('should return bcrypt hash when given valid plaintext password', () => {
    // ARRANGE
    const plainPassword = 'ValidPass123!';

    // ACT
    const hashedPassword = hashPassword(plainPassword);

    // ASSERT
    expect(hashedPassword).not.toBe(plainPassword);
    expect(hashedPassword).toMatch(/^\$2a\$10\$/); // Bcrypt format
  });

  it('should throw error when password is less than 8 characters', () => {
    // ARRANGE
    const shortPassword = 'Pass12'; // 6 chars, below minimum

    // ACT & ASSERT
    expect(() => hashPassword(shortPassword))
      .toThrow('Password must be at least 8 characters');
  });
});
```

**❌ BAD: Low Code Quality**
```javascript
describe('authHelper', () => {
  it('test password hashing', () => {
    let x = 'abc'; // Vague variable name
    let y = hashPassword(x); // Generic names
    expect(y).toBeTruthy(); // Too vague
    // No AAA structure
    // No author attribution
    // No comment explaining test
  });
});
```

---

## Anti-Pattern Detection

**Flag these issues if found:**

### ❌ Anti-Pattern 1: Testing Implementation Details

**Problem:** Test couples to code structure, fails on refactor even if behavior unchanged

```javascript
// ❌ BAD: Testing implementation
it('should create user with _setPassword private method', () => {
  const user = new User();
  user._setPassword('test123'); // Testing private method
  expect(user._hashedPassword).toBeDefined(); // Testing private property
});

// ✅ GOOD: Testing behavior
it('should create user with password', () => {
  const user = new User('test@example.com', 'test123');
  expect(user.authenticate('test123')).toBe(true);
});
```

**Fix:** Test public interface and behavior, not internals.

### ❌ Anti-Pattern 2: Multiple Acts

**Problem:** Test does multiple things, hard to know what failed

```javascript
// ❌ BAD: Multiple acts
it('should register and login user', () => {
  const user = registerUser('test@example.com', 'password');
  const token = loginUser(user.id, 'password');
  expect(token).toBeDefined();
});

// ✅ GOOD: One act per test
it('should register user', () => {
  const user = registerUser('test@example.com', 'password');
  expect(user.id).toBeDefined();
});

it('should login user with correct password', () => {
  const token = loginUser(1, 'password');
  expect(token).toBeDefined();
});
```

**Fix:** Each test should have one Act (one function call under test).

### ❌ Anti-Pattern 3: Assertion-Free Tests

**Problem:** Test runs but doesn't verify anything

```javascript
// ❌ BAD: No assertions
it('should process order', () => {
  const result = processOrder(order);
  // No expect() statement!
});

// ✅ GOOD: Clear assertions
it('should process order', () => {
  const result = processOrder(order);
  expect(result.status).toBe('processed');
  expect(result.total).toBeGreaterThan(0);
});
```

**Fix:** Every test must have at least one assertion.

### ❌ Anti-Pattern 4: Flaky/Timing-Dependent Tests

**Problem:** Test passes sometimes, fails other times (unreliable)

```javascript
// ❌ BAD: Flaky (timing dependent)
it('should receive notification', (done) => {
  const timer = setTimeout(() => {
    expect(notificationReceived).toBe(true);
    done();
  }, 500); // Might be too fast on slow machine
});

// ✅ GOOD: Not timing dependent
it('should receive notification', (done) => {
  emailService.onNotification(() => {
    expect(notificationReceived).toBe(true);
    done();
  });
  // No arbitrary setTimeout
});
```

**Fix:** Don't use arbitrary delays. Mock async properly or use promises.

### ❌ Anti-Pattern 5: Conditional Logic in Tests

**Problem:** Test behavior changes based on conditions

```javascript
// ❌ BAD: Conditional logic
it('should handle user data', () => {
  if (isProduction) {
    expect(result).toBe(productionValue);
  } else {
    expect(result).toBe(testValue); // Which one gets tested?
  }
});

// ✅ GOOD: No conditionals
it('should handle user data in test environment', () => {
  expect(result).toBe(testValue);
});
```

**Fix:** Each test should have single, clear path.

### ❌ Anti-Pattern 6: Magic Numbers/Strings

**Problem:** Hard to understand what specific value means

```javascript
// ❌ BAD: Magic numbers
it('should validate password', () => {
  expect(validatePassword('abc')).toBe(false);
  expect(validatePassword('abcdefgh')).toBe(true);
  // Why 8? Not clear.
});

// ✅ GOOD: Named constants
const MINIMUM_PASSWORD_LENGTH = 8;
it('should reject password shorter than minimum', () => {
  const shortPassword = 'a'.repeat(MINIMUM_PASSWORD_LENGTH - 1);
  expect(validatePassword(shortPassword)).toBe(false);
});
```

**Fix:** Use named constants, not magic numbers.

### ❌ Anti-Pattern 7: Over-Mocking

**Problem:** Mocking so much that test doesn't test real behavior

```javascript
// ❌ BAD: Over-mocking
it('should hash password', () => {
  const mockBcrypt = { hash: jest.fn().mockResolvedValue('fake') };
  const result = hashPassword('test', mockBcrypt);
  expect(result).toBe('fake');
  // Didn't test actual hashing!
});

// ✅ GOOD: Use real for security-critical
it('should hash password with bcrypt', () => {
  const hashedPassword = hashPassword('ValidPass123!');
  expect(hashedPassword).toMatch(/^\$2a\$10\$/); // Real bcrypt format
});
```

**Fix:** Keep real implementations when security/correctness critical.

### ❌ Anti-Pattern 8: Test Order Dependency

**Problem:** Tests fail if run in different order

```javascript
// ❌ BAD: Tests depend on order
let user;
it('should create user', () => {
  user = createUser('test@example.com');
  expect(user.id).toBeDefined();
});
it('should get user', () => {
  expect(user).toBeDefined(); // Depends on previous test!
});

// ✅ GOOD: Each test independent
it('should create user', () => {
  const user = createUser('test@example.com');
  expect(user.id).toBeDefined();
});
it('should get user by id', () => {
  const user = createUser('test@example.com');
  const retrieved = getUser(user.id);
  expect(retrieved.id).toBeDefined();
});
```

**Fix:** Each test creates own setup, doesn't depend on others.

---

## Summary: Anti-Pattern Scores

| Anti-Pattern | Impact | Action |
|---|---|---|
| Testing implementation details | High | Refactor test to test behavior |
| Multiple acts per test | High | Split into separate tests |
| No assertions | Critical | Add expect() statements |
| Flaky/timing tests | Critical | Remove arbitrary waits |
| Conditional logic | Medium | Separate into multiple tests |
| Magic numbers | Low | Use named constants |
| Over-mocking | High | Use real for critical code |
| Order dependency | Critical | Make tests independent |

**Result:** If any CRITICAL anti-patterns found → REWRITE. If HIGH → REVISE. If LOW → Can pass with notes.

---

## Overall Approval Decision

### ✅ PASS if:
**Ready to submit. All rubric criteria met.**

All of:
- [ ] Criterion 1 (Principled Approach): 1.0 ✓
- [ ] Criterion 2 (Test Variety): 1.0 ✓
  - Minimum coverage requirements met (happy + boundaries + negative + error)
- [ ] Criterion 3 (Correctness): 2.0 ✓
  - Tests isolated, mutation-proof
  - 4+ pillars pass 3/4 minimum
  - No CRITICAL anti-patterns
- [ ] Criterion 4 (Code Quality): 1.0 ✓
  - AAA pattern used
  - Clear test names
  - Well-structured
- [ ] Coverage: ≥ 80%
- [ ] All tests pass
- [ ] No CRITICAL anti-patterns

**Verdict: PASS — Ready for submission**

---

### 🔄 REVISE if:
**Specific issues found, can be fixed without major redesign.**

Some but not all:
- [ ] Criterion 3 (Correctness) has minor issues:
  - Some test isolation problems
  - A few weak assertions
  - Flaky test(s)
  - Only 2/4 Four Pillars pass
- [ ] Coverage 75-79% (close to target)
- [ ] HIGH anti-patterns found (not critical)
- [ ] Code quality could be better

**Specific issues to fix:**
```
Issue 1: ____________________
Issue 2: ____________________
Issue 3: ____________________
```

**Action:** Implementer fixes specific issues, re-review.

**Verdict: REVISE — Fix issues and re-submit**

---

### ↩️ REWRITE if:
**Fundamental problems. Return to planning phase.**

Major issues:
- [ ] Criterion 1 (Approach): Not systematic (0.5 or less)
  - 9 techniques not used
  - No clear approach
- [ ] Criterion 2 (Variety): Severely limited (0.5 or less)
  - Missing multiple required test types (happy/boundary/negative/error)
  - Too few tests for function complexity
  - Major gaps in coverage
- [ ] Criterion 3 (Correctness): Multiple issues (< 1.5)
  - Tests not properly isolated
  - Many assertions weak
  - Only 1/4 Four Pillars pass
  - CRITICAL anti-patterns found
- [ ] Coverage < 75%
- [ ] Many test failures

**Issues found:**
- ___ tests not isolated
- ___ missing error handling tests
- ___ over-mocking of own code
- ___ assertion-free tests
- ___ other: ____________________

**Action:** Go back to Planner (agent.md), redesign test plan completely.

**Verdict: REWRITE — Major issues, start from planning**

---

## Review Checklist Template

```
UNIT UNDER TEST: ________________
REVIEWER: ________________
DATE: ________________

CRITERION 1: Adherence to Principled Approach
☐ Phase 1 (Analyze) complete
☐ Phase 2 (Design with 9 techniques) complete
☐ Phase 3 (Test Type) chosen
☐ Phase 4 (Doubles Strategy) defined
Result: ☐ Pass ☐ Needs Work

CRITERION 2: Test Variety & Scope
☐ Happy path covered
☐ Equivalence classes covered
☐ Boundaries tested
☐ Invalid inputs tested
☐ Error cases tested
☐ Edge cases considered
☐ Test count appropriate: ___ tests
Result: ☐ Pass ☐ Needs Work

CRITERION 3: Correctness of Unit Tests
☐ Tests isolated (no integration)
☐ No test interdependencies
☐ Mocking correct
☐ Assertions correct
☐ All tests pass
☐ No issues found
Coverage: ___% (target: 80%)
Result: ☐ Pass ☐ Needs Work

CRITERION 4: Code Quality
☐ AAA pattern used
☐ Test names describe behavior
☐ Assertions specific
☐ Code readable
☐ Setup/cleanup clear
☐ Author attribution present
Result: ☐ Pass ☐ Needs Work

OVERALL DECISION:
☐ APPROVE - Ready for submission
☐ REWORK - Fix issues (Criterion X)
☐ REPLAN - Major gaps, redesign tests

COMMENTS:
________________
________________
________________
```

---

## Tips for Reviewers

1. **Read tests as documentation** - Could new team member understand from test names?
2. **Think like attacker** - Can you break the code and have tests fail?
3. **Check realistic scenarios** - Not just theoretical cases?
4. **Verify mocking reasoning** - Why mock this? Why keep real?
5. **Look for patterns** - Are tests following consistent style?
6. **Ask "why?"** - For any questionable design choice

