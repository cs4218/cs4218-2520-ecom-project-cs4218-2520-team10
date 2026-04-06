# Experience Consolidate Reviewer

**Verify memory capture is useful for future modules.**

---

## Review Checklist

### Module File (`_memory/[module].md`)
- [ ] Architecture documented (components, interactions, dependencies)
- [ ] Test results summarized (counts, coverage)
- [ ] High-value test cases documented with **why** they were valuable
- [ ] Failures documented with root cause and fix
- [ ] Learnings are **specific** (not "tests were good")
- [ ] Recommendations are **actionable** for next module

### Patterns File (`_memory/patterns.md`)
- [ ] New patterns added to correct sections
- [ ] Patterns are **generalizable** (apply to future modules, not just this one)
- [ ] Includes rationale (why the pattern works)

### Quality Check
- [ ] Could someone unfamiliar with this module understand the learnings?
- [ ] Would a future agent find these patterns useful for planning?
- [ ] Are recommendations specific enough to act on?

---

## Red Flags

- "Tests were good" → Too vague. Need specific insight.
- "Found bugs" → Which tests? What bugs? Why valuable?
- "Use mocks" → Which dependencies? Real or mock? Why?

---

## Decision

- **APPROVE** — Learnings are specific, actionable, and useful for future modules
- **REWORK** — Minor gaps: implementer adds specificity or missing sections
- **REPLAN** — Major gaps: findings incomplete, need to re-review test results
