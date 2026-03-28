# Memory Types: Detailed Definitions

---

## 1. Episodic Memory — "What Happened?"

**Purpose:** Record factual events from test execution. Preserve what was tested, what passed/failed, and what was learned.

**Retention:** All module test runs (unlimited)

**Structure:**
```
_memory-base/modules/[module-name]/runs/run-[ISO-8601-timestamp].json
Example: _memory-base/modules/auth/runs/run-2026-03-27T10-30-45Z.json
```

**Content:**
- **metadata**: timestamp, module name, author, test framework version
- **summary**: total tests, passed, failed, skipped, coverage %
- **scenarios_tested**: list of what was tested
  - What functions/components tested
  - Which techniques applied (9 techniques for unit tests)
  - What test types used (output-based, state-based, communication-based)
- **key_findings**: what the testing revealed
  - High-value test cases (caught most bugs)
  - Edge cases discovered
  - Validation patterns observed
  - Mock strategies that worked best
  - Performance characteristics
- **failures_and_issues**: problems encountered
  - Test failures and root causes
  - Flaky tests identified
  - Integration issues found
  - Dependencies that caused problems
- **lessons_learned**: observations for next module
  - What patterns were effective
  - What took longer than expected
  - Bottlenecks encountered
- **author_notes**: additional context
  - Who ran the tests (team member ID)
  - Any special conditions or environment notes

**Lifetime:** Permanent (archive all runs)

---

## 2. Semantic Memory — "What Patterns Did We Learn?"

**Purpose:** Extract generalizable knowledge from episodic data. Build a knowledge base of testing patterns.

**Retention:** Growing across all modules (unlimited)

**Files:**

### 2.1 Validation Strategies
```
_memory-base/knowledge/patterns/validation-strategies.json
```

**Content:**
```json
{
  "email_validation": {
    "effective_test_cases": [
      "valid format (user@example.com)",
      "with plus sign (user+tag@example.co.uk)",
      "missing @ (invalid)",
      "missing TLD (user@domain)",
      "spaces in email (invalid)"
    ],
    "common_mistakes": ["missing TLD boundary test", "not testing +tag format"],
    "best_practices": ["test positive AND negative cases", "boundary value analysis on TLD"],
    "js_assertion_pattern": "expect(validateEmail(input)).toBe(expectedBoolean)"
  },
  "password_validation": {
    "effective_test_cases": [
      "minimum length (8 chars)",
      "below minimum (7 chars) → error",
      "with special chars",
      "null/undefined input",
      "empty string"
    ],
    "common_mistakes": ["forgetting uppercase/lowercase requirements"],
    "best_practices": ["test min/max boundaries", "test null separately"],
    "js_assertion_pattern": "expect(validatePassword(input)).toBeTruthy()"
  },
  "phone_validation": {
    "effective_test_cases": [
      "valid format (XXX-XXX-XXXX)",
      "missing hyphens (invalid)",
      "international format",
      "leading zeros"
    ],
    "common_mistakes": [],
    "best_practices": [],
    "js_assertion_pattern": ""
  }
}
```

### 2.2 Mocking Strategies
```
_memory-base/knowledge/patterns/mocking-strategies.json
```

**Content:**
```json
{
  "controller_mocking": {
    "pattern": "Controllers are REAL in unit tests, can be MOCKED in integration tests",
    "rationale": "Unit tests verify controller logic. Integration tests verify controller + model interaction",
    "when_to_use": "Integration tests when testing controller calling model methods",
    "jest_example": "const mockModel = { create: jest.fn() }; controller.register(..., mockModel)"
  },
  "model_mocking": {
    "pattern": "Models should be REAL for integration tests using in-memory DB (mongodb-memory-server)",
    "rationale": "Tests real database interaction without external connections",
    "when_to_use": "Integration tests when DB interaction is critical to test",
    "jest_example": "Use mongodb-memory-server to provide real-like DB without external connection"
  },
  "external_api_mocking": {
    "pattern": "Always MOCK external APIs (email service, payment gateway, SMS)",
    "rationale": "External services are slow, unreliable, expensive. Not testing them, just integration",
    "when_to_use": "Whenever code calls external APIs",
    "jest_example": "jest.fn().mockResolvedValue({ success: true })"
  },
  "helper_function_mocking": {
    "pattern": "REAL helpers for unit tests (bcrypt, JWT), MOCK only if testing code flow",
    "rationale": "Security-critical: test actual hashing/signing. But in integration, okay to mock non-essential",
    "when_to_use": "Unit: real. Integration: depends on what you're testing",
    "jest_example": "bcrypt.hash is REAL; emailService.send is MOCKED"
  }
}
```

### 2.3 Jest Patterns
```
_memory-base/knowledge/patterns/jest-patterns.json
```

**Content:**
```json
{
  "test_naming": {
    "pattern": "should <action/outcome> when <condition>",
    "examples": [
      "should return hashed password when given valid plaintext",
      "should throw error when password is less than 8 characters",
      "should call userModel.create when registration succeeds"
    ],
    "antipatterns": ["test password", "test login", "test error case"]
  },
  "test_structure": {
    "pattern": "AAA — Arrange, Act, Assert",
    "arrange": "Set up test data and mocks",
    "act": "Call the function under test",
    "assert": "Verify outcome",
    "example": "const input = 'test'; const result = fn(input); expect(result).toBe(expected)"
  },
  "assertion_style": {
    "pattern": "One logical assertion per test (related assertions OK)",
    "examples": [
      "Single: expect(result).not.toBe(plainPassword)",
      "Related: expect(result.success).toBe(true) + expect(result.user.email).toBe(email)"
    ],
    "avoid": "Multiple unrelated assertions in one test"
  },
  "describe_blocks": {
    "pattern": "Organize by function, then by scenario",
    "structure": "describe('functionName', () => { describe('scenarioType', () => { it(...) }) })"
  },
  "mock_assertions": {
    "pattern": "Verify mocks were called with correct parameters",
    "examples": [
      "expect(mockUserModel.create).toHaveBeenCalledWith(expectedData)",
      "expect(mockEmail.send).toHaveBeenCalledTimes(1)"
    ]
  },
  "async_testing": {
    "pattern": "Use async/await or return Promise in tests",
    "examples": [
      "it('...', async () => { const result = await fn(); expect(result).toBe(...) })",
      "it('...', () => { return fn().then(result => { expect(result).toBe(...) }) })"
    ]
  }
}
```

### 2.4 Test Data Patterns
```
_memory-base/knowledge/patterns/test-data-patterns.json
```

**Content:**
```json
{
  "user_test_data": {
    "valid_user": {
      "email": "john.doe@example.com",
      "password": "SecurePass123!",
      "name": "John Doe",
      "phone": "1234567890"
    },
    "boundary_values": {
      "email_min": "a@b.c",
      "email_max": "[very long email... 254 chars max]",
      "password_min": "Aaa@1a0",
      "password_max": "[very long password... no typical max]"
    },
    "invalid_cases": {
      "email_no_at": "johndoe.example.com",
      "email_no_tld": "john@example",
      "password_weak": "123456",
      "password_no_special": "SecurePass123"
    }
  },
  "product_test_data": {
    "valid_product": {
      "name": "Laptop Computer",
      "price": 999.99,
      "category": "electronics",
      "stock": 10
    },
    "boundary_values": {
      "name_min": "A",
      "name_max": "[255 char limit]",
      "price_min": 0.01,
      "price_max": 999999.99,
      "stock_min": 0,
      "stock_max": 999999
    },
    "invalid_cases": {
      "price_negative": -10,
      "stock_negative": -1,
      "name_empty": ""
    }
  }
}
```

---

## 3. Procedural Memory — "How Can We Improve?"

**Purpose:** Record optimizations, time estimates, and workflow improvements discovered during testing.

**Retention:** Single file, updated after each module

**File:**
```
_memory-base/knowledge/agent-optimizations.json
```

**Content:**
```json
{
  "unit_test_agent": {
    "planning_phase": {
      "complexity_simple": {
        "estimated_time": "15-20 minutes",
        "9_techniques_applied": ["Happy Path", "Boundary Values", "Invalid Inputs"],
        "bottleneck": "Mapping all dependencies",
        "optimization": "Use pre-filled dependency matrix from architecture_reader"
      },
      "complexity_medium": {
        "estimated_time": "40-50 minutes",
        "9_techniques_applied": ["All 9 techniques"],
        "bottleneck": "Decision tables for multi-condition logic",
        "optimization": "Template decision table for common patterns"
      }
    },
    "implementation_phase": {
      "avg_time_per_test": "3-5 minutes",
      "fastest_patterns": ["Output-based tests", "Happy path assertions"],
      "slowest_patterns": ["State-based with complex setup", "Communication-based with multiple mocks"],
      "reusable_templates": [
        "Mock setup for Controllers",
        "Assert pattern for email validation",
        "Setup pattern for bcrypt testing"
      ]
    }
  },
  "integration_test_agent": {
    "approach_most_effective": "Bottom-up (tested for auth, products modules)",
    "avg_pair_count": "3 pairs per module",
    "mock_setup_time": "10-15 minutes (one-time investment)",
    "reusable_mocks": [
      "mongodb-memory-server setup",
      "External API stub factory",
      "Database cleanup pattern"
    ]
  },
  "ui_test_agent": {
    "selector_discovery": {
      "data_testid_availability": "60% of components have data-testid",
      "fallback_selector_time": "5-10 minutes per page",
      "best_practice": "Add data-testid during component review phase"
    },
    "wait_strategy": {
      "most_reliable": "waitForNavigation + waitForLoadState",
      "common_failure": "Missing waitForNavigation for form submissions",
      "optimization": "Template for common wait patterns"
    }
  }
}
```

---

## Memory Update Frequency

**Episodic Memory:**
- Updated after each module test run
- One file per run (timestamped)

**Semantic Memory:**
- Updated after experience_consolidate processes each module
- Incrementally built (auth patterns → products patterns → orders patterns)
- New patterns added, existing patterns enhanced

**Procedural Memory:**
- Updated after each module
- Reflects learned time estimates and optimizations
- Informs future sprint planning

---

## Accessing Memory

### From experience_consolidate
- Reads final test results
- Extracts and writes episodic/semantic/procedural data
- Creates new memory files

### From unit_test/integration_test/ui_test (Optional)
- Reads recent episodic memory: "How did we test similar functions?"
- Reads semantic memory: "What validation patterns are effective?"
- Reads procedural memory: "What's our time estimate?"

### Manual inspection
- All JSON files are human-readable
- Easy to audit and verify
- Git-tracked for history

---

## Example: Cross-Module Learning

**Module 1 (Auth) - Kim:**
1. Tests password validation with 8 test cases
2. Discovers: boundary test at length=7 is most effective
3. experience_consolidate writes to `validation-strategies.json`

**Module 2 (Products) - Ong:**
1. unit_test/agent reads `validation-strategies.json`
2. Sees: "boundary tests effective for validation"
3. Plans: tests for product name length boundaries
4. Result: Finds bug at length=1 vs length=255 boundary
5. experience_consolidate updates `validation-strategies.json` with product-specific patterns

**Module 3 (Orders) - Yan:**
1. unit_test/agent reads updated `validation-strategies.json` with 2 modules' learnings
2. Plans: comprehensive boundary tests for order quantity, total amount
3. Catches bugs faster with informed test design

---

## Data Quality Principles

1. **Accuracy:** Only verified, confirmed patterns stored
2. **Generalizability:** Patterns extracted for reuse, not one-off observations
3. **Clarity:** Human-readable explanations alongside data
4. **Auditability:** Timestamped, authored, traceable to specific module tests
