# Experience Consolidate Implementer

**Write learnings to markdown files in `_memory/`.**

---

## Step 1: Write Module Memory File

**Create/update:** `_memory/[module-name].md`

Use this template:

```markdown
# [Module Name] — Test Learnings

**Author:** [name, ID]
**Date:** [date]

## Architecture

### Components
- **[Controller]** (`controllers/[name].js`) — [what it does]
- **[Model]** (`models/[name].js`) — [schema fields, purpose]
- **[Helper]** (`helpers/[name].js`) — [functions, purpose]

### Key Interactions
- [Controller] → [Helper] → [Model] → Database
- [Route] → [Middleware] → [Controller]

### Dependencies
- Internal: [which components call which]
- External: [bcrypt, jwt, mongoose, etc. and why]

## Test Results

### Summary
- Unit tests: [count] ([coverage]%)
- Integration tests: [count]
- UI/E2E tests: [count]
- Overall: [passed]/[total] passing

### High-Value Test Cases
- [Test name]: [why it was valuable, what bug it caught]
- [Test name]: [why it was valuable]

### Failures & Fixes
- [What failed] → [root cause] → [how fixed]

## Learnings

### What Worked
- [Specific technique or pattern that was effective]
- [Mock strategy that worked well]

### What to Watch Out For
- [Pitfall or gotcha encountered]
- [Thing that took longer than expected]

### Recommendations for Next Module
- [Specific actionable recommendation]
- [Pattern to reuse]
```

---

## Step 2: Update Shared Patterns

**Append to:** `_memory/patterns.md`

For each cross-module insight discovered, add it to the relevant section:

- **Validation Patterns** — Add boundary values, edge cases that caught bugs
- **Mocking Strategies** — Add real/mock/stub decisions with rationale
- **Test Data Patterns** — Add effective test data (boundaries, edge cases)
- **Jest/Playwright Conventions** — Add patterns that worked well
- **Preferences & Conventions** — Add team preferences discovered

Remove the `<!-- comment -->` wrappers when adding real content.

**Be specific.** Not "boundary tests work" but "password min-1 (7 chars) catches off-by-one in length validation."

---

## Step 3: Update Memory Index

**Update:** `_memory/MEMORY.md`

Check the box for the completed module:
```
- [x] auth
- [ ] products
```

---

## Checklist

- [ ] Module .md file created with architecture + test learnings
- [ ] patterns.md updated with cross-module insights
- [ ] MEMORY.md index updated
- [ ] Learnings are specific (not vague)
- [ ] Recommendations are actionable for next module
- [ ] Ready for Reviewer

---

## Notes

- Keep it simple — markdown, not JSON
- Be specific — "found bug" is useless; "boundary test at length=7 found off-by-one" is gold
- Generalize — write patterns that apply to future modules, not just this one
- Include rationale — "why" helps future agents apply patterns correctly
