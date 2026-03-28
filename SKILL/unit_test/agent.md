# Unit Test Planner - Principled Test Design

**Analyze → Plan → Implement** (No code written in this phase!)

---

## OPTIONAL Phase 0: Check Memory (For Cross-Module Learning)

**Skip this if this is your first module. Use this if a prior module has been tested.**

If previous modules have been tested and memories captured, optionally reference learned patterns:

**Check these files if they exist:**
```
_memory-base/knowledge/patterns/validation-strategies.json
  → See what boundary tests were effective for similar validation functions
  → Example: "Email TLD boundary test at length 2/3/4 catches regex errors"

_memory-base/knowledge/patterns/mocking-strategies.json
  → See what mock strategies worked for similar component types
  → Example: "bcrypt should be REAL (security-critical), emailService MOCKED"

_memory-base/knowledge/patterns/jest-patterns.json
  → See what test naming and assertion patterns were clear
  → Example: Test naming pattern "should <action> when <condition>"

_memory-base/knowledge/agent-optimizations.json
  → See time estimates for similar complexity functions
  → Example: "Unit test planning for medium complexity: 45 minutes"
```

**Optional actions:**
- [ ] Read validation-strategies.json: "What validation patterns were effective?"
- [ ] Read mocking-strategies.json: "How should I mock for this component type?"
- [ ] Read jest-patterns.json: "What test patterns were clear and reusable?"
- [ ] Read agent-optimizations.json: "What's the time estimate for this complexity?"

**No mandatory actions** — This is optional. Proceed to Phase 1 even if no memories exist.

---

This planner ensures your unit tests meet the rubric criteria:
- ✅ Adherence to Principled Approach (1%)
- ✅ Test Variety & Scope (1%)
- ✅ Correctness of Unit Tests (2%)
- ✅ Code Quality (1%)

---

## Phase 1: Analyze the Unit Under Test

Before writing ANY test code, deeply understand what you're testing.

### 1.1 Identify the Unit

**Question:** What exactly are you testing?

- [ ] Function name and location
  - Example: `hashPassword()` in `helpers/authHelper.js`
  - Example: `calculateDiscount()` in `helpers/productHelper.js`

- [ ] What is the unit's purpose?
  - Example: "Hash a plaintext password for secure storage"
  - Example: "Calculate discount amount given price and discount percent"

### 1.2 Classify Code Complexity

Rate the unit's complexity to understand test scope needed:

- **Simple:** Single responsibility, few conditions
  - Example: `formatDate(date)` → returns formatted string
  - Test count: 3-5 tests

- **Medium:** Multiple paths, some conditions
  - Example: `validateEmail(email)` → checks multiple validation rules
  - Test count: 8-15 tests

- **Complex:** Many branches, multiple dependencies, state
  - Example: `processOrder(order)` → validates, calculates, updates multiple things
  - Test count: 15-30+ tests

**Your unit complexity: [Simple/Medium/Complex]**

### 1.3 Map Inputs and Outputs

**Create a table of the unit's interface:**

| Parameter | Type | Valid Range | Example |
|-----------|------|-------------|---------|
| input1 | string | 1-50 chars | "test@example.com" |
| input2 | number | 0-100 | 50 |
| Returns | boolean | true/false | true |

**Example for password hashing:**
```
Input: plainPassword (string)
  Valid: 8-128 characters, any characters except null
  Example: "MyPass123!"

Output: hashedPassword (string)
  Valid: 60 character hash
  Example: "$2b$10$..." (bcrypt hash)

Side effect: None (pure function)
```

### 1.4 Identify Dependencies

**What does this unit depend on?**

- [ ] External libraries/functions used
  - Example: `bcrypt.hash()`, `crypto.randomBytes()`

- [ ] Database/API calls
  - Example: User queries database? Yes/No

- [ ] State changes
  - Example: Modifies global state? Yes/No

**For each dependency, decide:**
- **Keep Real:** If testing the integration (e.g., real bcrypt)
- **Mock/Stub:** If testing business logic only (e.g., mock DB)

**Example:**
```
Unit: registerController
Dependencies:
  - userModel.findOne() → Mock (test controller logic, not DB)
  - hashPassword() → Real (test actual hashing)
  - JWT.sign() → Real (test actual token generation)
```

### 1.5 Identify Public Interface

**Rule:** Test only the PUBLIC interface. Never test private/internal methods.

- [ ] What parameters does it accept?
- [ ] What does it return?
- [ ] What observable side effects happen? (DB writes, API calls, etc.)
- [ ] What errors can it throw?

**DO NOT test:**
- Private helper methods (methods with `#` or `_` prefix)
- Implementation details
- Internal variables or state

---

## Phase 2: Design Test Scenarios

**Goal:** Systematically identify ALL important test cases using 9 techniques.

### 2.1 Happy Path Testing

**What:** Normal use case that should succeed

Examples:
- Valid email registration
- Valid product creation with all required fields
- Valid payment processing

**For your unit:**
- [ ] Happy path scenario defined
- [ ] Expected input: ___
- [ ] Expected output: ___

### 2.2 Equivalence Partitioning

**What:** Group inputs into categories. Test one from each group.

**Example for email validation:**
```
Valid emails:
  - user@example.com ← Test one
  - user+tag@example.co.uk ← Don't need to test, same category

Invalid emails:
  - missing@domain ← Test one (no TLD)
  - no-domain.com ← Test one (missing @)
  - spaces in@domain.com ← Test one (has space)
```

**For your unit:**
Identify input categories:
- [ ] Valid inputs category → Test one representative example
- [ ] Invalid inputs categories → Test one example per category
- [ ] Edge case categories → Test one example per category

### 2.3 Boundary Value Analysis

**What:** Test at the edges of valid ranges

**Example for discount calculation (0-100%):**
```
Boundaries:
- Just below 0: -1 → Should reject
- At 0: 0 → Should accept (no discount)
- Just above 0: 0.1 → Should accept
- Just below 100: 99.9 → Should accept
- At 100: 100 → Should accept (full discount)
- Just above 100: 100.1 → Should reject
```

**For your unit:**
- [ ] What numeric ranges apply?
- [ ] What are the boundaries?
- [ ] Test: just below, at, just above each boundary

### 2.4 Negative/Invalid Input Handling

**What:** Test with bad data (wrong type, out of range, etc.)

Examples:
- Empty string when expecting string
- Null/undefined values
- Wrong data types (string instead of number)
- Extremely large values
- Special characters that break parsing

**For your unit:**
- [ ] Null/undefined inputs → How should unit handle?
- [ ] Wrong type inputs → Expected behavior?
- [ ] Out of range values → Expected behavior?
- [ ] Empty/whitespace strings → Expected behavior?

### 2.5 Error Handling and Failure Modes

**What:** How does unit handle errors?

**For each dependency, test failure:**
- [ ] What if database query fails?
- [ ] What if external API returns error?
- [ ] What if parsing fails?
- [ ] Unit should: throw error / return error code / return default value?

**Example:**
```
Unit: getUser(userId)
Dependency: userModel.findById(userId)
Failure case: Database returns null (user not found)
Expected: Throw "User not found" error (not silent failure)
```

### 2.6 State Machine / Conditional Transitions

**What:** Test different paths through conditional logic

**If your unit has if/else or switch statements:**
- [ ] List all conditional branches
- [ ] Test input that takes each branch
- [ ] Test combinations of multiple conditions

**Example:**
```
Unit: validateOrder(order)

Conditions:
- if order.items is empty → return error "No items"
- else if order.total < 0 → return error "Invalid total"
- else if order.userId is missing → return error "User required"
- else → return success

Tests:
1. Empty items → error "No items"
2. Negative total → error "Invalid total"
3. Missing userId → error "User required"
4. All valid → success
```

### 2.7 Decision Tables (Multi-Condition Logic)

**What:** For complex logic with multiple conditions, create decision table

**Example for order validation:**

| Items | Total | User | Expected |
|-------|-------|------|----------|
| T | T | T | ✅ Success |
| T | T | F | ❌ Error |
| T | F | T | ❌ Error |
| F | T | T | ❌ Error |
| T | F | F | ❌ Error |
| ... | ... | ... | ... |

**For your unit:**
- [ ] Does it have 2+ conditions affecting output?
- [ ] Create decision table for all combinations
- [ ] Test each unique combination (collapse if same output)

### 2.8 Interaction and Side Effect Verification

**What:** Verify unit calls dependencies correctly and causes expected side effects

Examples:
- When saving user, does it call `userModel.save()`?
- When password set, does it call `bcrypt.hash()`?
- Does it modify the right database record?
- Does it send to the correct email address?

**For your unit:**
- [ ] What external functions should it call?
- [ ] With what parameters?
- [ ] Test: Verify it called with correct parameters
- [ ] Test: Verify return value from dependency is used correctly

### 2.9 Security and Invariant Validation

**What:** Test security-relevant behavior

Examples:
- Password hashed, never stored plaintext
- No SQL injection with special characters
- JWT tokens can't be forged
- Sensitive data not leaked in error messages

**For your unit:**
- [ ] Any security-sensitive operations?
- [ ] Test: Verify secure behavior
- [ ] Example: `expect(hashedPassword).not.toBe(plainPassword)`

---

## Phase 3: Choose Test Type and Test Doubles

**For each test scenario, choose the right approach:**

### 3.1 Output-Based Testing

**When:** Unit returns a value (pure function)

```javascript
// Example: calculateDiscount(price, discountPercent)
// No dependencies, just calculate and return

expect(calculateDiscount(100, 10)).toBe(10); // Simple assertion
```

**Use when:**
- Function returns a value
- No dependencies
- No state changes

### 3.2 State-Based Testing

**When:** Unit modifies state (object, database, etc.)

```javascript
// Example: addProductToCart(cart, product)
// Modifies cart object

const cart = { items: [] };
addProductToCart(cart, product);
expect(cart.items.length).toBe(1); // Assert state changed
```

**Use when:**
- Function modifies object state
- Function modifies database
- Function modifies global state

### 3.3 Communication-Based Testing

**When:** Unit calls dependencies (external functions/APIs)

```javascript
// Example: registerUser(email, password)
// Calls userModel.create() and bcrypt.hash()

const mockUserModel = { create: jest.fn() };
registerUser(email, password, mockUserModel);
expect(mockUserModel.create).toHaveBeenCalledWith(...); // Assert call made
```

**Use when:**
- Function calls external APIs
- Function calls other services
- Need to verify interaction

---

## Phase 4: Choose Test Doubles Strategy

**For each dependency, choose:**

| Dependency | Use | When |
|---|---|---|
| **Real** | Keep the real implementation | Testing integration, security-critical, pure functions |
| **Stub** | Return fake data, no logic | Don't care about behavior, just need to return something |
| **Fake** | Working implementation but simplified | Need realistic behavior but faster/simpler |
| **Mock** | Track calls and parameters | Need to verify unit called it correctly |

**Example:**
```
Unit: registerController
├─ bcrypt.hash() → REAL (testing actual hashing, security)
├─ JWT.sign() → REAL (testing actual token generation)
├─ userModel.create() → MOCK (verify called with correct data)
├─ emailService.send() → STUB (don't care, just needs to not error)
└─ logger.info() → MOCK or STUB (optional, testing doesn't require)
```

**For your unit:**
- [ ] Dependency 1: Real / Stub / Fake / Mock
- [ ] Dependency 2: Real / Stub / Fake / Mock
- [ ] Dependency 3: Real / Stub / Fake / Mock

---

## Summary Output Format

When Phase 1-4 planning is complete, document:

```
UNIT UNDER TEST
===============
Function: [name]
Location: [file path]
Purpose: [what it does]
Complexity: [Simple/Medium/Complex]

INPUTS & OUTPUTS
================
Parameters: [type, range, examples]
Return: [type, example]
Side effects: [list or none]

DEPENDENCIES
============
[List each dependency]
├─ Dependency 1: [Real/Mock/Stub/Fake]
├─ Dependency 2: [Real/Mock/Stub/Fake]
└─ Dependency 3: [Real/Mock/Stub/Fake]

TEST SCENARIOS (Using 9 Techniques)
===================================
1. Happy Path: [description]
2. Equivalence Classes: [list classes and test case]
3. Boundary Values: [list boundaries and test cases]
4. Invalid Inputs: [null, wrong type, out of range, etc.]
5. Error Handling: [dependency failures]
6. Conditional Branches: [different code paths]
7. Decision Table: [if complex multi-condition logic]
8. Side Effects: [verify calls, modifications]
9. Security: [any sensitive operations]

TOTAL TEST COUNT: [estimated]

READY FOR IMPLEMENTER ✓
```

---

## Rubric Alignment Checklist

Before handing off to implementer, verify:

- [ ] **Adherence to Principled Approach (1%)**
  - [ ] Used systematic approach (9 techniques)
  - [ ] Analyzed unit fully before planning
  - [ ] Clear test type chosen for each scenario

- [ ] **Test Variety & Scope (1%)**
  - [ ] Happy path covered
  - [ ] Multiple equivalence classes tested
  - [ ] Boundary values included
  - [ ] Error cases included
  - [ ] Edge cases identified

- [ ] **Correctness of Unit Tests (2%)**
  - [ ] Unit tested in isolation
  - [ ] Dependencies properly handled (Real/Mock/Stub/Fake)
  - [ ] No test interdependencies
  - [ ] Each test has single responsibility

- [ ] **Code Quality (1%)**
  - [ ] Test naming clear (should <action> when <condition>)
  - [ ] AAA pattern planned
  - [ ] Assertions are specific
  - [ ] Setup/cleanup clear

---

## Examples to Study

See your project's existing tests:
- Study the patterns used in unit tests
- Notice how they apply these 9 techniques
- Identify Real vs Mock dependencies
- See AAA pattern in action

