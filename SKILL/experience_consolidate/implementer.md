# Experience Consolidate Implementer — Write Memories to Persistent Store

**Execute the consolidation plan. Write episodic, semantic, and procedural memories to `_memory-base/`.**

This phase runs **after the planning phase** (agent.md) is approved.

Prerequisites:
- [ ] Planning phase complete (agent.md output reviewed)
- [ ] All test results available (unit, integration, UI test reports)
- [ ] Module name and author known
- [ ] Memory organization strategy defined

---

## Step 1: Create Episodic Memory (Test Run Record)

**What:** Document facts about what was tested and what was found.

**File location:**
```
_memory-base/modules/[module-name]/runs/run-[ISO-8601-timestamp].json
Example: _memory-base/modules/auth/runs/run-2026-03-27T10-30-45Z.json
```

**Process:**

### 1.1 Collect Test Metrics
```javascript
From your test reports, extract:
- Total unit tests written
- Total unit tests passed, failed, skipped
- Code coverage percentage (lines, branches, functions)
- Total integration tests
- Total UI/E2E tests
- Test execution time
```

### 1.2 Write Episodic JSON File
Create `run-[timestamp].json` with this structure:

```json
{
  "metadata": {
    "timestamp": "2026-03-27T10:30:45Z",
    "module": "[module-name]",
    "author": "[Team Member Name, Student ID]",
    "test_framework": "Jest 29.7.0",
    "test_types": ["unit", "integration", "ui"],
    "duration_minutes": 120
  },

  "summary": {
    "total_tests": 66,
    "passed": 64,
    "failed": 2,
    "skipped": 0,
    "coverage_percent": 87.5,
    "coverage_lines": "210/240",
    "coverage_branches": "18/22",
    "coverage_functions": "15/16"
  },

  "scenarios_tested": {
    "unit_tests": {
      "[function-name]": {
        "test_count": 12,
        "coverage": "95%",
        "techniques_applied": [
          "happy_path",
          "boundary_values",
          "invalid_inputs",
          "error_handling"
        ],
        "test_types": ["output_based", "communication_based"]
      }
    },
    "integration_tests": {
      "[component-pair]": {
        "test_count": 9,
        "integration_approach": "bottom_up"
      }
    },
    "ui_tests": {
      "total_scenarios": 15,
      "key_flows_tested": ["login", "register", "password_reset"]
    }
  },

  "key_findings": {
    "high_value_test_cases": [
      {
        "description": "Boundary test: password length exactly 8 chars",
        "value": "Caught off-by-one error in validation",
        "test_name": "should accept password with exactly 8 characters"
      }
    ],
    "validation_patterns": [
      "Email requires boundary tests at TLD length (2=c, 3=co, 4=com)",
      "Password boundary test at min-1 (7 chars) and min (8 chars) effective"
    ],
    "mock_strategies": [
      "bcrypt: use REAL (security-critical)",
      "emailService: MOCK/STUB (external, slow)",
      "userModel: REAL in integration tests with mongodb-memory-server"
    ],
    "dependency_insights": [
      "JWT.sign is async — must await in tests"
    ]
  },

  "failures_and_issues": {
    "resolved_failures": [
      {
        "test_name": "should hash password",
        "error": "Mock not being called",
        "root_cause": "Test wasn't awaiting async hashPassword()",
        "solution": "Added async/await",
        "resolved": true
      }
    ],
    "environment_issues": [
      "mongodb-memory-server took 45 seconds first download",
      "Jest timeout was 5000ms, needed 10000ms for async"
    ]
  },

  "lessons_learned": [
    "Boundary value analysis finds bugs fast (3 tests, 2 bugs)",
    "Real dependencies better than mocks for security-critical functions",
    "mongodb-memory-server + test cleanup = stable integration tests"
  ],

  "recommendations_for_next_module": [
    "Apply boundary test strategy to similar validation functions",
    "Use same mock setup (bcrypt real, email mocked)",
    "Plan 45 seconds for mongodb-memory-server first download"
  ],

  "author_notes": "All tests passing locally and in CI. Coverage exceeds 85% threshold. Ready for review."
}
```

**Checklist:**
- [ ] Timestamp is accurate (ISO-8601 format)
- [ ] Module name matches directory structure
- [ ] Author name and ID included
- [ ] All test metrics collected
- [ ] High-value findings documented with "why valuable?"
- [ ] Lessons are actionable
- [ ] Recommendations specific (not vague)
- [ ] JSON file valid (no syntax errors)
- [ ] File created in correct location

---

## Step 2: Update Semantic Memory (Extracted Patterns)

**What:** Generalize learnings into reusable patterns for future modules.

### 2.1 Update validation-strategies.json

**File:** `_memory-base/knowledge/patterns/validation-strategies.json`

For each validation pattern discovered, add to the appropriate section:

```javascript
// Read existing file, append new patterns

const validationStrategies = JSON.parse(
  fs.readFileSync('_memory-base/knowledge/patterns/validation-strategies.json')
);

// Add/update email pattern from this module's findings
validationStrategies.email_validation.modules_where_tested.push({
  module: "[module-name]",
  date: "[2026-MM-DD]",
  effectiveness: "High",
  bugs_caught: 1
});

// Write back to file
fs.writeFileSync(
  '_memory-base/knowledge/patterns/validation-strategies.json',
  JSON.stringify(validationStrategies, null, 2)
);
```

**What to capture:**
- Test cases that were effective
- Boundary values discovered
- Common mistakes found
- Best practices applied

### 2.2 Update mocking-strategies.json

**File:** `_memory-base/knowledge/patterns/mocking-strategies.json`

For each mock strategy used:

```javascript
// If you discovered that "Controllers should be REAL in unit tests"
// Add to file:
{
  "module": "[module-name]",
  "date": "[2026-MM-DD]",
  "strategy": "Controllers REAL, Models MOCKED in unit tests",
  "effectiveness": "Caught logic errors",
  "lesson": "Real dependencies reveal bugs, mocks isolate code"
}
```

**What to capture:**
- Which dependencies were real vs mocked vs stubbed
- Why each choice was effective
- Patterns that worked well
- Setups that should be reused

### 2.3 Update jest-patterns.json

**File:** `_memory-base/knowledge/patterns/jest-patterns.json`

If you discovered effective Jest patterns:

```javascript
// Add test naming patterns observed
jest_patterns.test_naming.examples.push({
  module: "[module-name]",
  example: "should return hashed password when given valid plaintext",
  context: "password validation unit test"
});

// Add assertion patterns observed
jest_patterns.assertion_style.examples.push({
  module: "[module-name]",
  pattern: "expect(result).not.toBe(plainPassword)",
  effectiveness: "Clear, verifiable security property"
});
```

**What to capture:**
- Test naming patterns that were clear
- Assertion patterns that worked well
- AAA pattern applications
- Useful Jest matchers/assertions

### 2.4 Update test-data-patterns.json

**File:** `_memory-base/knowledge/patterns/test-data-patterns.json`

Add test data patterns specific to this module:

```javascript
const testDataPatterns = JSON.parse(
  fs.readFileSync('_memory-base/knowledge/patterns/test-data-patterns.json')
);

// Add module-specific test data
testDataPatterns.[module-domain]_test_data = {
  valid_example: {
    field1: "value",
    field2: 123
    // Realistic example from this module
  },
  boundary_values: {
    field_min: "...",
    field_max: "...",
    numeric_min: 0,
    numeric_max: 999999
  },
  invalid_cases: {
    field_empty: "",
    field_null: null,
    field_wrong_type: {}
  }
};

fs.writeFileSync(
  '_memory-base/knowledge/patterns/test-data-patterns.json',
  JSON.stringify(testDataPatterns, null, 2)
);
```

**What to capture:**
- Representative test data for this domain
- Boundary values that revealed bugs
- Invalid cases that should be tested
- Edge cases discovered

---

## Step 3: Update Procedural Memory (Optimizations)

**File:** `_memory-base/knowledge/agent-optimizations.json`

```javascript
const optimizations = JSON.parse(
  fs.readFileSync('_memory-base/knowledge/agent-optimizations.json')
);

// Add time estimates from this module
optimizations.unit_test_planning.complexity_medium = {
  example_function: "[example from this module]",
  estimated_time_minutes: 45,
  techniques_applied: 7,
  bottleneck: "[what took longest]",
  optimization_discovered: "[how to be faster next time]"
};

// Add module record
optimizations.modules_processed.push({
  module: "[module-name]",
  date: "2026-03-27",
  unit_tests_count: 42,
  integration_tests_count: 9,
  ui_tests_count: 15,
  total_time_hours: 8,
  bottleneck: "[main slowdown]"
});

fs.writeFileSync(
  '_memory-base/knowledge/agent-optimizations.json',
  JSON.stringify(optimizations, null, 2)
);
```

**What to capture:**
- Time spent on each phase (planning, implementation, review)
- Bottlenecks (what was slow or painful)
- Optimizations (what could be faster next time)
- Reusable templates created
- Estimated time for similar work in future

---

## Step 4: Create Architecture Documentation

**File:** `_memory-base/architecture/[module-name].json`

Create structured documentation of module architecture:

```json
{
  "module": "[module-name]",
  "date": "[2026-MM-DD]",
  "author": "[Team Member Name, ID]",

  "components": [
    {
      "name": "[ControllerName]",
      "type": "controller",
      "file": "controllers/[name]Controller.js",
      "methods": [
        {
          "name": "registerController",
          "parameters": ["email", "password", "name"],
          "returns": "{ success, user, token }",
          "dependencies": ["userModel", "authHelper"]
        }
      ],
      "responsibilities": "Handles registration requests, validates input, calls model"
    },
    {
      "name": "[ModelName]",
      "type": "model",
      "file": "models/[name]Model.js",
      "schema_fields": ["email", "password", "name"],
      "methods": ["create", "findOne", "findById", "updateOne"]
    },
    {
      "name": "[HelperName]",
      "type": "helper",
      "file": "helpers/[name]Helper.js",
      "functions": ["hashPassword", "comparePassword"]
    }
  ],

  "dependencies": {
    "internal": [
      "userModel → authHelper (for password hashing)",
      "userController → userModel (for DB operations)"
    ],
    "external": [
      "bcrypt (password hashing)",
      "jwt (token generation)",
      "mongoose (DB connection)"
    ]
  },

  "interaction_patterns": [
    {
      "flow": "User Registration",
      "steps": [
        "authController receives email, password",
        "Calls authHelper.hashPassword(password)",
        "Calls userModel.create(email, hashedPassword)",
        "Calls JWT.sign() for token",
        "Returns user object and token"
      ]
    }
  ],

  "integration_points": [
    "Controller → Model (direct method calls)",
    "Controller → Helper (utility functions)",
    "Model → Database (mongoose operations)"
  ]
}
```

**Checklist:**
- [ ] All major components documented
- [ ] Component types labeled (controller, model, service, helper)
- [ ] Dependencies clearly shown
- [ ] Interaction flows described
- [ ] File paths accurate
- [ ] JSON valid

---

## Step 5: Create Consolidated Report

**File:** `[module-name]-consolidation-report.md`

Create human-readable summary:

```markdown
# [Module] Testing - Consolidation Report

## Summary
- Module: [name]
- Author: [name, ID]
- Date: [date]
- Total tests: [count]
- Coverage: [%]

## Key Findings
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

## Lessons Learned
- [Lesson 1]
- [Lesson 2]

## Recommendations for Next Module
- [Recommendation 1]
- [Recommendation 2]

## Files Created/Updated
- Created: _memory-base/modules/[module]/runs/run-[timestamp].json
- Updated: _memory-base/knowledge/patterns/*.json
- Updated: _memory-base/knowledge/agent-optimizations.json
- Created: _memory-base/architecture/[module].json
```

---

## Implementation Checklist

- [ ] Episodic memory file created in correct location
- [ ] All test metrics included and accurate
- [ ] High-value findings documented
- [ ] Lessons learned are specific and actionable
- [ ] Recommendations specific to next modules
- [ ] validation-strategies.json updated with new patterns
- [ ] mocking-strategies.json updated with insights
- [ ] jest-patterns.json updated with patterns discovered
- [ ] test-data-patterns.json updated with test data
- [ ] agent-optimizations.json updated with time estimates
- [ ] Architecture documentation created and complete
- [ ] Consolidated report written
- [ ] All JSON files valid (no syntax errors)
- [ ] All files in correct locations
- [ ] Ready for Reviewer assessment

---

## Output Summary

**New files created:**
- `_memory-base/modules/[module]/runs/run-[timestamp].json` ← Episodic memory
- `_memory-base/architecture/[module].json` ← Architecture docs
- `[module]-consolidation-report.md` ← Summary report

**Files updated:**
- `_memory-base/knowledge/patterns/validation-strategies.json` ← Semantic
- `_memory-base/knowledge/patterns/mocking-strategies.json` ← Semantic
- `_memory-base/knowledge/patterns/jest-patterns.json` ← Semantic
- `_memory-base/knowledge/patterns/test-data-patterns.json` ← Semantic
- `_memory-base/knowledge/agent-optimizations.json` ← Procedural

---

## Notes

- **Use ISO-8601 timestamps** for consistency (2026-03-27T10:30:45Z)
- **Valid JSON only** — test files with `json` validator before committing
- **Include rationale** — "why this pattern works" helps future agents apply it
- **Be specific** — "boundary tests effective" is vague; "boundary test at min-1/min/min+1 catches off-by-one" is actionable
- **All-inclusive** — Don't skip findings. Future modules need every insight to improve faster
