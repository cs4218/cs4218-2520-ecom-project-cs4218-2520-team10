# Architecture Reader Reviewer

**Verify architecture documentation is accurate and useful.**

---

## Review Checklist

- [ ] **Components complete** — All major controllers, models, helpers documented
- [ ] **File paths accurate** — Paths match actual codebase
- [ ] **Methods documented** — Key methods listed with purpose
- [ ] **Dependencies clear** — Internal (component → component) and external (libraries)
- [ ] **Flows traced** — At least 2 key flows step-by-step
- [ ] **Spot-check** — Pick one method, verify documentation matches actual code

## Red Flags

- Missing component (major controller/model not documented)
- Wrong file path (doesn't exist in codebase)
- Flow doesn't match code (steps are inaccurate)

## Decision

- **APPROVE** — Documentation matches code, useful for testing agents
- **REWORK** — Minor gaps: add missing component or fix path
- **REPLAN** — Major misunderstanding of architecture, re-analyze
