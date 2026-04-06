# Experience Consolidate Planner

**After testing a module, capture what we learned so the next module benefits.**

This runs after unit/integration/UI tests are complete for a module.

---

## What to Capture

Review all test results and answer these questions:

### 1. What was tested?
- [ ] Which functions/components were tested?
- [ ] How many tests? (unit, integration, UI)
- [ ] Coverage achieved?

### 2. What worked well?
- [ ] Which test techniques caught the most bugs? (boundary values, error handling, etc.)
- [ ] Which mocking strategies were effective? (real vs mock for each dependency)
- [ ] Which test data patterns were useful? (boundary values, edge cases)

### 3. What was surprising or hard?
- [ ] Any unexpected failures?
- [ ] Bottlenecks? (slow setup, flaky tests, etc.)
- [ ] What took longer than expected?

### 4. What should the next module know?
- [ ] Validation patterns to reuse
- [ ] Mock strategies to copy
- [ ] Pitfalls to avoid
- [ ] Time estimates for planning

---

## Output

Two files to update:

1. **`_memory/[module].md`** — This module's architecture + test learnings
2. **`_memory/patterns.md`** — Cross-module patterns (append new discoveries)

Hand off to Implementer with:
- List of findings to write
- Which sections of patterns.md to update
- Specific recommendations for next module

READY FOR IMPLEMENTER ✓
