# Architecture Reader Planner

**Understand the module's structure before testing it.**

This runs at the start of each module's testing workflow.

---

## What to Analyze

### 1. Identify Components
- [ ] What controllers exist? (file paths, main methods)
- [ ] What models exist? (schema fields, key methods)
- [ ] What helpers/utilities exist? (functions, purpose)
- [ ] What routes exist? (endpoints, HTTP methods)
- [ ] What middleware applies? (auth, validation)

### 2. Map Interactions
- [ ] How does data flow? (route → controller → model → DB)
- [ ] Which components depend on which?
- [ ] What external libraries are used? (bcrypt, jwt, mongoose)

### 3. Identify Key Flows
- [ ] Main success flow (e.g., user registers successfully)
- [ ] Alternative flow (e.g., user logs in)
- [ ] Error flow (e.g., invalid input rejected)

---

## Output

Write findings to `_memory/[module-name].md` (Architecture section).

If this is a new module, create the file. If it exists, update the Architecture section.

READY FOR IMPLEMENTER ✓
