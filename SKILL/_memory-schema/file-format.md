# File Format Specifications

JSON schema examples for each memory type.

---

## Episodic Memory Format

**File:** `_memory-base/modules/[module-name]/runs/run-[ISO-8601-timestamp].json`

**Example:** `_memory-base/modules/auth/runs/run-2026-03-27T10-30-45Z.json`

```json
{
  "metadata": {
    "timestamp": "2026-03-27T10:30:45Z",
    "module": "auth",
    "author": "Kim Shi Tong, A0265858J",
    "test_framework": "Jest 29.7.0",
    "test_types": ["unit", "integration"],
    "duration_minutes": 120
  },

  "summary": {
    "total_tests": 42,
    "passed": 40,
    "failed": 2,
    "skipped": 0,
    "coverage_percent": 87.5,
    "coverage_lines": "210/240",
    "coverage_branches": "18/22",
    "coverage_functions": "15/16"
  },

  "scenarios_tested": {
    "unit_tests": {
      "authHelper.js": {
        "functions_tested": ["hashPassword", "comparePassword", "generateToken"],
        "techniques_applied": [
          "happy_path",
          "boundary_values",
          "invalid_inputs",
          "error_handling",
          "security_validation"
        ],
        "test_types_used": ["output_based", "communication_based"],
        "test_count": 18,
        "coverage": "95%"
      },
      "authController.js": {
        "functions_tested": ["registerController", "loginController", "logoutController"],
        "techniques_applied": [
          "happy_path",
          "error_scenarios",
          "side_effects",
          "state_changes"
        ],
        "test_types_used": ["communication_based", "state_based"],
        "test_count": 15,
        "coverage": "88%"
      }
    },
    "integration_tests": {
      "authController_authHelper_interaction": {
        "components_tested": ["authController", "authHelper"],
        "integration_approach": "bottom_up",
        "test_count": 9,
        "key_scenarios": [
          "Register flow: validation → hashing → DB save",
          "Login flow: DB query → password compare → token generation",
          "Password reset flow: verification → update → notification"
        ]
      }
    }
  },

  "key_findings": {
    "high_value_test_cases": [
      {
        "description": "Boundary test: password length exactly at minimum (8 chars)",
        "value": "Caught off-by-one error in validation logic",
        "test_name": "should accept password with exactly 8 characters"
      },
      {
        "description": "Negative test: null password input",
        "value": "Prevented null reference exception in bcrypt.hash()",
        "test_name": "should throw error when password is null"
      }
    ],
    "validation_patterns": [
      "Email validation requires boundary tests at TLD (domain.c, domain.co, domain.com)",
      "Password validation effective at min/max boundaries (7, 8, 128, 129 chars)",
      "Phone validation should test with/without country code prefix"
    ],
    "mock_strategies": [
      "bcrypt.hash should be REAL (security-critical)",
      "Database models should be MOCKED in unit tests, REAL in integration tests",
      "Email service should be STUBBED (external, slow)"
    ],
    "dependency_issues": [
      "JWT.sign timing — must account for async token generation",
      "Database connection pooling — mongodb-memory-server may leak connections if not cleaned up"
    ]
  },

  "failures_and_issues": {
    "test_failures": [
      {
        "test_name": "should hash password with bcrypt when registering",
        "error": "Mock not being called — password passed as plaintext",
        "root_cause": "authHelper.hashPassword() logic was async but test wasn't awaiting",
        "solution": "Added async/await to test",
        "resolved": true
      },
      {
        "test_name": "should prevent duplicate email registration",
        "error": "Test flaky — sometimes passes, sometimes fails",
        "root_cause": "MongoDB memory server cleanup between tests was incomplete",
        "solution": "Added explicit beforeEach(() => db.clear())",
        "resolved": true
      }
    ],
    "integration_issues": [
      "authController calling authHelper with incorrect parameter types",
      "Model.save() not being called after validation — data wasn't persisting"
    ],
    "environment_issues": [
      "mongodb-memory-server took 30+ seconds to download on first run",
      "Jest test timeout was 5s, needed 10s for async operations"
    ]
  },

  "lessons_learned": [
    "Boundary value analysis is high-ROI — found 2 bugs with just 3 boundary tests",
    "Mocking strategy matters: real bcrypt caught logic errors, stubbed email prevented flaky tests",
    "Integration tests revealed controller-model type mismatches unit tests missed",
    "mongodb-memory-server + beforeEach cleanup is crucial for test isolation"
  ],

  "recommendations_for_next_module": [
    "Apply same boundary test strategy to product price validation",
    "Use identical mock setup (Controller real, Model mocked in unit tests)",
    "Include integration tests pairing controllers with real models",
    "Plan 30+ seconds for first test run mongodb-memory-server download"
  ],

  "author_notes": "Tests written by Kim Shi Tong (A0265858J). All tests passing locally and in CI. Coverage met 85% threshold. Ready for code review."
}
```

---

## Semantic Memory Format

### Validation Strategies Example
**File:** `_memory-base/knowledge/patterns/validation-strategies.json`

```json
{
  "email_validation": {
    "effective_test_cases": [
      {
        "case": "valid_standard",
        "input": "user@example.com",
        "expected": true,
        "reason": "Standard email format"
      },
      {
        "case": "valid_plus_tag",
        "input": "user+tag@example.co.uk",
        "expected": true,
        "reason": "Plus addressing, multi-level TLD"
      },
      {
        "case": "boundary_no_tld",
        "input": "user@example",
        "expected": false,
        "reason": "No TLD — boundary case, high ROI"
      },
      {
        "case": "boundary_single_char_tld",
        "input": "user@example.c",
        "expected": false,
        "reason": "TLD too short — catches off-by-one errors"
      },
      {
        "case": "invalid_no_at",
        "input": "userexample.com",
        "expected": false,
        "reason": "Missing @ symbol"
      },
      {
        "case": "invalid_spaces",
        "input": "user @example.com",
        "expected": false,
        "reason": "Spaces not allowed"
      }
    ],
    "common_mistakes_found": [
      "Tests only positive cases, missing negative boundary cases",
      "Doesn't test TLD boundary (domain.c vs domain.co vs domain.com)",
      "Doesn't test plus addressing format"
    ],
    "best_practices": [
      "Test positive + negative cases",
      "Use boundary value analysis on TLD length",
      "Include plus addressing format (Gmail compatibility)",
      "Test spaces, special characters, missing @"
    ],
    "modules_where_tested": [
      {
        "module": "auth",
        "date": "2026-03-27",
        "effectiveness": "High — found validation logic error in TLD regex",
        "bugs_caught": 1
      }
    ]
  },

  "password_validation": {
    "effective_test_cases": [
      {
        "case": "boundary_min_length",
        "input": "Aaa@1a7",
        "length": 7,
        "expected": false,
        "reason": "Below 8-char minimum"
      },
      {
        "case": "boundary_min_length_exact",
        "input": "Aaa@1a8",
        "length": 8,
        "expected": true,
        "reason": "Exactly at minimum — catches off-by-one"
      },
      {
        "case": "valid_with_special",
        "input": "SecurePass123!@#",
        "expected": true,
        "reason": "Special characters allowed"
      },
      {
        "case": "invalid_no_uppercase",
        "input": "securepass123!",
        "expected": false,
        "reason": "Requires uppercase letter"
      },
      {
        "case": "invalid_no_number",
        "input": "SecurePass!@#",
        "expected": false,
        "reason": "Requires at least one digit"
      },
      {
        "case": "null_input",
        "input": null,
        "expected": "error",
        "reason": "Should throw/error, not silently fail"
      }
    ],
    "common_mistakes_found": [
      "Boundary test only at 8 chars, not 7 chars (didn't test below minimum)",
      "Didn't test null/undefined separately from empty string",
      "Didn't verify uppercase requirement"
    ],
    "best_practices": [
      "Test boundaries: below minimum (7), at minimum (8), above (9+)",
      "Test each complexity requirement separately (uppercase, lowercase, digit, special)",
      "Test null/undefined separately from empty string",
      "Test maximum length boundary if exists"
    ],
    "modules_where_tested": [
      {
        "module": "auth",
        "date": "2026-03-27",
        "effectiveness": "High — caught validation accepting 7-char passwords",
        "bugs_caught": 1
      }
    ]
  }
}
```

### Mocking Strategies Example
**File:** `_memory-base/knowledge/patterns/mocking-strategies.json`

```json
{
  "controller_mocking": {
    "pattern": "Controllers are REAL in unit tests, MOCKED in integration setup",
    "rationale": {
      "unit_tests": "Need to verify controller logic and how it calls dependencies",
      "integration_tests": "Testing controller + model interaction, so both need to be present"
    },
    "effective_pattern": "Real controller calls to both real and mocked dependencies",
    "jest_example": {
      "unit_test": "const result = authController.register(email, password, mockUserModel);",
      "integration_test": "const result = authController.register(email, password, realUserModel);"
    },
    "pitfall_to_avoid": "Mocking the controller itself in unit tests defeats the purpose"
  },

  "model_mocking": {
    "pattern": "Use mongodb-memory-server for integration tests (real model, fake DB)",
    "rationale": "Real model code path without external DB connection",
    "effective_setup": "beforeAll: connect to memory DB, afterEach: clear collections",
    "jest_example": {
      "setup": "const memoryServer = await MongoMemoryServer.create();",
      "test": "const user = await UserModel.create({ email: 'test@example.com' });",
      "verify": "const saved = await UserModel.findOne({ email: 'test@example.com' }); expect(saved).toBeTruthy();"
    },
    "pitfall_to_avoid": "Using a real MongoDB Atlas connection in tests (slow, unreliable, costs)"
  },

  "external_api_mocking": {
    "pattern": "Always mock email, payment, SMS services",
    "rationale": "External services are slow, unreliable, may have rate limits or costs",
    "effective_pattern": "Mock return values, verify calls were made with correct parameters",
    "jest_example": {
      "mock": "const mockEmailService = { send: jest.fn().mockResolvedValue({ success: true }) };",
      "test": "authController.register(email, password, mockEmailService);",
      "verify": "expect(mockEmailService.send).toHaveBeenCalledWith(expect.objectContaining({ to: email }))"
    },
    "pitfall_to_avoid": "Actually calling external services in tests"
  },

  "helper_mocking": {
    "pattern": "Security-critical helpers (bcrypt, JWT) should be REAL; others flexible",
    "rationale": "Need to verify actual security operations, but can mock others for isolation",
    "effective_pattern": "Keep bcrypt/JWT real in unit tests, mock everything else",
    "jest_example": {
      "real": "const hashedPassword = await bcrypt.hash(plainPassword, 10);",
      "mock": "const mockLogger = { info: jest.fn() };"
    },
    "pitfall_to_avoid": "Mocking bcrypt causes false positives (mocks pass but real code fails)"
  }
}
```

---

## Procedural Memory Format

**File:** `_memory-base/knowledge/agent-optimizations.json`

```json
{
  "unit_test_planning": {
    "complexity_simple": {
      "example_function": "hashPassword(password)",
      "estimated_time_minutes": 15,
      "techniques_applied": 4,
      "bottleneck": "Identifying all edge cases",
      "optimization_discovered": "Use checklist of 9 techniques — more systematic"
    },
    "complexity_medium": {
      "example_function": "validateRegistration(email, password, name)",
      "estimated_time_minutes": 45,
      "techniques_applied": 7,
      "bottleneck": "Decision tables for multiple conditions",
      "optimization_discovered": "Pre-made decision table template speeds up phase 2"
    },
    "complexity_complex": {
      "example_function": "processOrder(order, user, payment)",
      "estimated_time_minutes": 120,
      "techniques_applied": 9,
      "bottleneck": "Managing many dependencies",
      "optimization_discovered": "Dependency matrix from architecture_reader cuts time in half"
    }
  },

  "integration_test_planning": {
    "approach_comparison": {
      "bottom_up": {
        "effectiveness": "High",
        "time_to_setup": "20 minutes (mongodb-memory-server first run)",
        "time_per_pair": "30 minutes",
        "best_for": "Testing data layer → business logic → controllers"
      },
      "top_down": {
        "effectiveness": "Medium",
        "time_to_setup": "25 minutes (need to mock lower layers first)",
        "time_per_pair": "40 minutes",
        "best_for": "Testing user-facing APIs first, lower layers later"
      }
    },
    "reusable_patterns": [
      {
        "name": "Database setup/cleanup",
        "reuse_count": 1,
        "time_saved": "10 minutes",
        "pattern": "beforeAll: connect to memory DB, afterEach: clear collections"
      },
      {
        "name": "Mock factory for external APIs",
        "reuse_count": 1,
        "time_saved": "15 minutes",
        "pattern": "Factory function creating standardized mocks"
      }
    ]
  },

  "ui_test_planning": {
    "selector_strategy": {
      "data_testid_availability_percent": 60,
      "fallback_time_per_page": "10 minutes",
      "optimization": "Request developers add data-testid during code review"
    },
    "wait_strategy": {
      "most_reliable": "waitForNavigation + waitForLoadState",
      "common_failure": "Missing waits for form submission navigation",
      "pattern_template": "Standardized wait for login flow, checkout flow, etc."
    }
  },

  "modules_processed": [
    {
      "module": "auth",
      "date": "2026-03-27",
      "unit_tests_count": 42,
      "integration_tests_count": 9,
      "ui_tests_count": 15,
      "total_time_hours": 8,
      "bottleneck": "mongodb-memory-server download time"
    }
  ]
}
```

---

## File Naming Conventions

**Episodic Memory (per module test run):**
```
run-[ISO-8601-timestamp].json
Example: run-2026-03-27T10-30-45Z.json
```

**Semantic Memory (patterns):**
```
[domain]-[topic].json
Examples:
  validation-strategies.json
  mocking-strategies.json
  jest-patterns.json
  test-data-patterns.json
```

**Procedural Memory (optimizations):**
```
agent-optimizations.json (single file, updated per module)
```

**Architecture Documentation:**
```
[module-name].json
Examples:
  auth.json
  products.json
  orders.json
  categories.json
```

---

## JSON Validity & Version Control

- All memory files must be valid JSON (use JSON validator)
- Use 2-space indentation for readability
- Include `last_updated` timestamp in all files
- Git-track all memory files for history/audit trail
- No `.gitignore` entry for memory files (they're part of team knowledge)
