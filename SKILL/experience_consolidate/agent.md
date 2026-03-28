# Experience Consolidate Planner — Memory Capture Strategy

**Plan what to capture, how to organize learnings, and how to update the persistent knowledge base.**

This phase runs **after all testing is complete** (unit tests → integration tests → UI tests → optional load tests).

Goal: Extract episodic data, derive semantic patterns, and note procedural optimizations for future modules.

---

## Phase 1: Review All Test Results

**Question:** What was accomplished in this module's testing?

### Unit Tests
- [ ] How many unit tests were written? (target: varies by complexity)
- [ ] What functions/components were tested?
- [ ] Coverage achieved? (target: 80%+)
- [ ] Which techniques from 9 techniques were most effective? (happy path, boundary values, error handling, etc.)
- [ ] Test failures or issues? (all resolved?)
- [ ] Author: Who completed these tests? (e.g., Kim Shi Tong, A0265858J)

### Integration Tests
- [ ] How many integration tests? (target: 5-25 depending on complexity)
- [ ] Which component pairs/stacks were tested?
- [ ] Integration approach used? (bottom-up, top-down, sandwich?)
- [ ] What integration issues were found and resolved?
- [ ] Mocking strategy effectiveness?

### UI/E2E Tests
- [ ] How many E2E scenarios? (target: 15-25+)
- [ ] Which user journeys were tested?
- [ ] Selector strategies used? (data-testid, role-based, CSS?)
- [ ] Wait strategies effective?

### Load Tests (if applicable)
- [ ] Performance baselines established?
- [ ] Bottlenecks identified?
- [ ] Scalability insights?

---

## Phase 2: Identify & Categorize Findings

**Question:** What did we learn? What patterns should be remembered?

### 2.1 High-Value Test Cases
- [ ] Which tests caught the most bugs? (save for patterns)
  - Example: "Boundary test at password length=7 caught validation error"
  - Why valuable: High ROI for small effort
- [ ] Which test scenarios were most effective?
  - Example: "Testing error path with null input prevents null reference exception"
- [ ] Reusable test patterns identified?

### 2.2 Validation Patterns Discovered
- [ ] What validation edge cases did we find?
  - Example: Email TLD requires boundary test at length=2 (c), 3 (co), 4 (com)
  - Example: Password requires length=7 (below min) and length=8 (at min) tests
- [ ] Common validation mistakes to watch for in other modules?

### 2.3 Mocking & Dependency Strategies
- [ ] What dependencies worked best as REAL vs MOCK vs STUB?
  - Example: bcrypt REAL (security-critical), emailService MOCKED (external)
- [ ] Database strategy effective? (mongodb-memory-server, real DB, mocked?)
- [ ] Mock setup patterns that were reusable?

### 2.4 Jest/Test Framework Patterns
- [ ] Test naming patterns that were clearest?
- [ ] AAA pattern worked well?
- [ ] Setup/teardown patterns discovered?
- [ ] Assertion libraries or patterns found useful?

### 2.5 Time & Performance Insights
- [ ] How long did each phase take? (planning, implementation, review)
- [ ] Bottlenecks encountered? (mongodb-memory-server download, fixture setup, etc.)
- [ ] How could next module be faster?

### 2.6 Architecture Insights
- [ ] Key components and interactions documented?
- [ ] Dependencies clarified?
- [ ] Integration points understood?

---

## Phase 3: Map to Memory Types

**Question:** How should we organize this knowledge?

### 3.1 Episodic Memory (What Happened?)
**File:** `_memory-base/modules/[module-name]/runs/run-[timestamp].json`

Checklist:
- [ ] Module name
- [ ] Timestamp of test run
- [ ] Author(s) who completed testing
- [ ] Summary stats: total tests, passed, failed, coverage %
- [ ] All scenarios tested (functions, techniques, test types)
- [ ] Key findings (high-value tests, patterns discovered)
- [ ] Failures and issues (and how they were resolved)
- [ ] Lessons learned (observations for next module)
- [ ] Recommendations (what should next module do differently?)

### 3.2 Semantic Memory (Patterns)
**Files:** `_memory-base/knowledge/patterns/*.json`

Identify what patterns to capture/update:

- [ ] **validation-strategies.json**
  - New validation patterns discovered? (email, password, phone, etc.)
  - Effective test cases that should be reused?
  - Common mistakes to avoid?

- [ ] **mocking-strategies.json**
  - New mock strategy insights? (when to use real vs mock vs stub)
  - Dependencies and how to test them?
  - Setup patterns discovered?

- [ ] **jest-patterns.json**
  - Test naming conventions that worked well?
  - AAA pattern applications?
  - Assertion patterns?

- [ ] **test-data-patterns.json**
  - Boundary values discovered? (min/max, edge cases)
  - Representative test data for this domain?
  - Field-specific patterns (email, password, price, quantity)?

### 3.3 Procedural Memory (Optimizations)
**File:** `_memory-base/knowledge/agent-optimizations.json`

Checklist:
- [ ] Time estimate for unit test planning? (simple/medium/complex)
- [ ] Time estimate for integration test planning?
- [ ] Time estimate for UI test planning?
- [ ] Bottlenecks encountered? (how long did they take?)
- [ ] Optimizations discovered? (what could be faster?)
- [ ] Reusable templates created? (which ones can be reused?)
- [ ] Recommendations for speedup?

---

## Phase 4: Plan Memory Update Strategy

**Question:** How will implementer write to memory base?

- [ ] **New episodic run file** will be created at:
  ```
  _memory-base/modules/[module]/runs/run-[timestamp].json
  ```
  - All test results, findings, lessons documented

- [ ] **Semantic patterns will be updated** in:
  ```
  _memory-base/knowledge/patterns/[topic].json
  ```
  - New patterns merged with existing patterns
  - Example: validation-strategies.json will add [module]'s email/password patterns

- [ ] **Procedural memory will be updated** in:
  ```
  _memory-base/knowledge/agent-optimizations.json
  ```
  - Time estimates added/updated
  - Bottlenecks noted
  - Optimizations documented

- [ ] **Architecture will be documented** at:
  ```
  _memory-base/architecture/[module].json
  ```
  - Components, dependencies, interactions

---

## Phase 5: Define Success Criteria

**How will we know memory capture is complete and accurate?**

Checklist:
- [ ] Episodic run file contains all required fields (metadata, summary, findings, lessons)
- [ ] All test counts match reality (passed, failed, coverage %)
- [ ] High-value test cases documented with "why valuable?"
- [ ] Patterns are generalizable (not one-off observations)
- [ ] Mock strategies documented with rationale
- [ ] Time estimates are accurate (not guesses)
- [ ] Lessons learned are actionable (not vague)
- [ ] File format valid JSON (no syntax errors)
- [ ] Memory organized per `_memory-schema/` specs

---

## Output Format: Consolidation Plan

When planning is complete, document:

```
EXPERIENCE CONSOLIDATION PLAN
=============================

MODULE: [name]
AUTHOR: [team member name, ID]
DATE: [timestamp]

1. TEST PHASES CONSOLIDATED
   - Unit tests: [count] tests, [coverage]%
   - Integration tests: [count] tests, approach: [bottom-up/top-down/sandwich]
   - UI tests: [count] scenarios
   - Summary: [key stats]

2. EPISODIC MEMORY
   - File: _memory-base/modules/[module]/runs/run-[timestamp].json
   - Key findings: [3-5 bullet points]
   - Lessons learned: [3-5 bullet points]
   - Issues resolved: [any major issues and how resolved]

3. SEMANTIC PATTERNS TO CAPTURE
   - Validation patterns: [which fields tested, boundary insights]
   - Mocking strategies: [what worked as real/mock/stub]
   - Jest patterns: [test naming, AAA, assertion styles observed]
   - Test data patterns: [boundary values, edge cases discovered]

4. PROCEDURAL IMPROVEMENTS
   - Unit test planning: [estimated time for next module]
   - Integration testing: [estimated time, bottleneck]
   - UI testing: [estimated time, bottleneck]
   - Optimizations: [what could be faster]

5. RECOMMENDATIONS FOR NEXT MODULE
   - Apply boundary test strategy to [similar functions]
   - Use [mock pattern] for [component type]
   - Expect [time] for setup, [time] for execution
   - Watch for [known issues/bottlenecks]

6. READY FOR IMPLEMENTER
   ☐ All findings identified
   ☐ Patterns categorized into episodic/semantic/procedural
   ☐ Memory file locations determined
   ☐ Update strategy defined
   ☐ Success criteria clear

READY FOR IMPLEMENTER ✓
```

---

## Notes

- **Accuracy matters:** Memory feeds future modules. Bad patterns slow everyone down.
- **Generalize, don't memorize:** Extract patterns usable by other modules, not just this one.
- **Be specific:** "boundary tests effective" → not actionable. "Email TLD boundary at length 2/3/4 catches regex errors" → actionable.
- **Include rationale:** Why a pattern matters helps future agents apply it correctly.
- **All-inclusive:** Don't skip findings because they seem obvious. Future modules need every insight.
