# Experience Consolidate Reviewer — Memory Quality Gate

**Verify memory capture is complete, accurate, and useful for future modules.**

---

## Role
Review the quality and completeness of consolidated learnings and memory updates.

## Responsibilities
- Verify all episodic memory is captured accurately
- Check semantic patterns are generalizable (not one-off observations)
- Validate procedural optimizations are realistic
- Ensure recommendations are actionable
- Confirm JSON files are valid and well-structured
- Verify memory is organized per `_memory-schema/` specs

---

## Review Checklist

### 1. Episodic Memory Validation

**File:** `_memory-base/modules/[module]/runs/run-[timestamp].json`

- [ ] **File exists in correct location** — Check path matches pattern
- [ ] **Timestamp is accurate** — ISO-8601 format (2026-03-27T10:30:45Z)
- [ ] **Module name matches** — Directory and filename consistent
- [ ] **Author info complete** — Name and student ID included
- [ ] **Summary statistics accurate**
  - [ ] Total tests = passed + failed + skipped?
  - [ ] Coverage % matches reported coverage?
  - [ ] Coverage lines reasonable (e.g., 210/240)?
- [ ] **Test scenarios documented** — All unit, integration, UI tests listed
- [ ] **High-value findings specific**
  - [ ] Each finding includes "why valuable?"
  - [ ] Not vague (example: "fixed bug" → BAD; "fixed off-by-one in length validation" → GOOD)
- [ ] **Failures documented** — Even resolved failures have root cause explanation
- [ ] **Lessons learned are actionable**
  - [ ] Specific (not "tests were good")
  - [ ] Applicable to other modules (not one-off)
  - Example GOOD: "Boundary tests at min-1/min/min+1 catches length validation errors"
  - Example BAD: "Unit tests are important"
- [ ] **Recommendations specific**
  - [ ] Mention which next modules should apply them
  - [ ] Include expected benefits
  - Example GOOD: "Products module should test price boundary (0.01, 999999.99)"
  - Example BAD: "Test boundaries"
- [ ] **JSON valid** — No syntax errors, parseable
- [ ] **Author notes present** — Context about test environment, any special conditions

### 2. Semantic Pattern Validation

**Files:** `_memory-base/knowledge/patterns/*.json`

#### validation-strategies.json
- [ ] **New patterns added** for this module's findings
- [ ] **Test cases generalized** — Not tied to specific module, applicable to future modules
- [ ] **Boundary values documented** — Why each value matters
- [ ] **Common mistakes listed** — What other modules should avoid
- [ ] **Best practices include rationale** — Not just "do this", but "why"
- [ ] **Module reference added** — Record which modules tested this pattern
- Example format:
  ```json
  {
    "case": "boundary_min_length",
    "input": "...",
    "expected": false,
    "reason": "Below minimum — catches off-by-one errors",
    "modules_where_tested": [{ "module": "auth", "effectiveness": "High" }]
  }
  ```

#### mocking-strategies.json
- [ ] **Mock decisions justified** — Why real vs mock vs stub for each dependency
- [ ] **Patterns reusable** — Not specific to one module
- [ ] **Effectiveness rated** — Did it work? How well?
- [ ] **Jest examples included** — Other modules can copy-paste patterns
- [ ] **Module history updated** — Record which modules used this strategy

#### jest-patterns.json & test-data-patterns.json
- [ ] **Patterns generalized** — Applicable across modules
- [ ] **Rationale included** — Why each pattern worked
- [ ] **Module context added** — Where this pattern was discovered
- [ ] **Examples clear** — Other modules can understand and apply

### 3. Procedural Memory Validation

**File:** `_memory-base/knowledge/agent-optimizations.json`

- [ ] **Time estimates realistic**
  - [ ] Unit test planning: [X] minutes for simple/medium/complex
  - [ ] Integration setup: [X] minutes (mongodb-memory-server, fixtures)
  - [ ] Bottleneck times documented (e.g., "45 seconds for first download")
- [ ] **Bottlenecks identified** — What was slow? Why?
- [ ] **Optimizations documented** — How to avoid bottlenecks next time
- [ ] **Module record added**
  - [ ] Module name, date
  - [ ] Test counts (unit, integration, UI)
  - [ ] Total time
  - [ ] Bottleneck encountered
- [ ] **Reusable templates listed** — What can next modules copy?

### 4. Architecture Documentation Validation

**File:** `_memory-base/architecture/[module].json`

- [ ] **All major components listed** — Controllers, models, services, helpers
- [ ] **File paths accurate** — Match actual codebase
- [ ] **Component types correct** — labeled as controller/model/service/helper
- [ ] **Methods documented** — Key methods of each component
- [ ] **Dependencies clear**
  - [ ] Internal dependencies shown (which components call which)
  - [ ] External dependencies listed (bcrypt, JWT, mongoose, etc.)
- [ ] **Interaction flows explained** — Main user flows described step-by-step
- [ ] **JSON valid** — No syntax errors
- [ ] **Useful for next module** — Could someone understand architecture from this?

### 5. Overall Memory Quality

- [ ] **Specificity** — Patterns are specific, not vague
- [ ] **Generalizability** — Insights apply to multiple modules, not just this one
- [ ] **Actionability** — Future modules can apply recommendations without ambiguity
- [ ] **Accuracy** — Findings match actual test results
- [ ] **Completeness** — All significant findings captured
- [ ] **Organization** — Files in correct locations, properly named
- [ ] **JSON quality** — All files valid, readable, properly formatted (2-space indent)
- [ ] **Connections clear** — Relationships between findings explained

---

## Review Decision Matrix

### ✅ APPROVE
**When:** All checks pass, memory is complete, accurate, and useful.

Criteria:
- All episodic memory accurate and specific
- Semantic patterns generalized and actionable
- Procedural optimizations realistic
- Architecture documentation complete
- JSON files all valid
- Findings will genuinely help future modules

Decision: **Memory captured successfully. Ready for next module to reference.**

### 🔄 REWORK (Implementer Deepens Analysis)
**When:** Minor gaps or unclear insights. Implementer digs deeper without replanning.

Examples:
- "Lessons learned too vague" → Implementer makes them specific with examples
- "Missing mock strategy for [component type]" → Implementer documents pattern
- "JSON formatting issues" → Implementer fixes syntax
- "Boundary value test 'effective' but no detail" → Implementer explains which boundary found bugs

Action: **Request specific rework, implementer corrects without replanning**

### ⚠️ REPLAN (Escalate to Planner)
**When:** Significant gaps in consolidation approach or fundamental misunderstandings.

Examples:
- Critical findings not captured during planning phase
- Approach didn't match module complexity
- Memory organization doesn't match schema
- Lessons learned contradict prior modules

Action: **Escalate to planner (agent.md), revise approach**

---

## Detailed Inspection Examples

### GOOD Lesson Learned
```
"Boundary value testing at password length boundaries (7, 8, 9 chars)
catches validation off-by-one errors. Found in auth module, should apply
to any min-length validation in products (quantity, name length)."
```

### BAD Lesson Learned
```
"Unit tests are important"  ← Vague, obvious, not actionable
"Testing is hard"          ← Too general
"Found bugs"               ← Missing detail
```

### GOOD Pattern
```json
{
  "pattern": "Email validation requires boundary test at TLD",
  "effective_test_case": "user@example.c (length=1 TLD)",
  "why_valuable": "Regex validation often allows TLD of any length; this test catches that error",
  "modules_where_tested": ["auth"],
  "recommendation": "Apply to any email field validation in products, orders, categories"
}
```

### BAD Pattern
```json
{
  "pattern": "Email validation works"  ← Too vague
  "note": "Found bugs"                 ← Missing detail
}
```

---

## Review Checklist Template

```
EXPERIENCE CONSOLIDATION REVIEW
===============================

MODULE: [name]
REVIEWER: [name]
DATE: [date]

1. EPISODIC MEMORY ✓/✗
   [ ] File exists in correct location
   [ ] Timestamp accurate
   [ ] Summary statistics match test results
   [ ] High-value findings specific and documented
   [ ] Lessons learned actionable
   [ ] Recommendations include expected modules
   [ ] JSON valid
   Notes: [any issues]

2. SEMANTIC PATTERNS ✓/✗
   [ ] validation-strategies.json updated with generalizable patterns
   [ ] mocking-strategies.json includes rationale for each strategy
   [ ] jest-patterns.json includes examples other modules can use
   [ ] test-data-patterns.json includes boundary values and edge cases
   [ ] Patterns generalized (not module-specific)
   Notes: [any issues]

3. PROCEDURAL MEMORY ✓/✗
   [ ] Time estimates realistic and specific
   [ ] Bottlenecks identified with time impacts
   [ ] Optimizations documented (how to avoid bottlenecks)
   [ ] Module record added to history
   Notes: [any issues]

4. ARCHITECTURE DOCUMENTATION ✓/✗
   [ ] All major components documented
   [ ] File paths accurate
   [ ] Dependencies clear
   [ ] Interaction flows explained
   [ ] JSON valid and complete
   Notes: [any issues]

5. OVERALL QUALITY ✓/✗
   [ ] Findings are specific (not vague)
   [ ] Patterns are generalizable (apply to future modules)
   [ ] Recommendations are actionable
   [ ] Organization per _memory-schema/ specs
   [ ] All JSON files valid
   Notes: [any issues]

DECISION: [ ] APPROVE  [ ] REWORK  [ ] REPLAN

If REWORK: Specific issues for implementer to address:
1. [Issue 1]
2. [Issue 2]

If REPLAN: Escalation reason:
[Explain what needs replanning]

Reviewer: [name]
Date: [date]
```

---

## Key Principles

✅ **Be thorough** — Memory affects all future modules. Poor quality slows everyone.
✅ **Be specific** — Vague patterns aren't useful. Require concrete examples.
✅ **Be objective** — Check facts against test results. Don't accept unverified claims.
✅ **Be realistic** — Time estimates should match actual experience, not optimistic.
✅ **Be fair** — If implementer captured core insights well but formatting needs work, use REWORK not REPLAN.

---

## Red Flags

🚩 **Vague lesson:** "Tests were good" → Need specific insight with example
🚩 **Wrong level:** Architecture doc describes tool setup instead of components → Wrong scope
🚩 **Missing data:** Episodic memory missing test failure explanations → Incomplete
🚩 **Over-generalized:** Pattern says "applies to all modules" but found in one → Unrealistic
🚩 **Unverified:** Recommendation not backed by actual test result → Questionable
