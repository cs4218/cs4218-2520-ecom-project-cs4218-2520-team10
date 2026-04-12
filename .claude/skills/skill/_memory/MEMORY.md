# SKILL Memory

Persistent learnings from testing modules. Agents read this to improve over time.

---

## How It Works

- **architecture_reader** reads source code → writes `[module].md` with architecture notes
- **experience_consolidate** reviews test results → appends learnings to `[module].md` and `patterns.md`
- **unit_test / integration_test / ui_test** optionally read these files before planning

## Files

- `MEMORY.md` — This index (you are here)
- `patterns.md` — Cross-module patterns (validation, mocking, preferences, conventions)
- `[module].md` — Per-module file: architecture + test learnings + recommendations

## Modules Tested

- [ ] auth
- [ ] products
- [ ] orders
- [ ] categories
