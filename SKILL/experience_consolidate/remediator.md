# Experience Remediator — Feedback Loop for SKILL Improvement

**Two phases: Capture raw experiences → Transform into SOP improvements.**

This is the self-improvement mechanism for SKILL. Over rounds of debugging and building, AI and humans accumulate experiences (pitfalls, discoveries, fixes). The remediator turns those raw notes into permanent improvements to the agent/implementer/reviewer files.

---

## How It Works

```
Phase 1: CAPTURE (continuous, during work)
──────────────────────────────────────────
  During debugging/building, jot raw experiences:
  → _memory/experience.md (append-only log)

Phase 2: REMEDIATE (user-triggered)
────────────────────────────────────
  User says: "remediate experiences" / "improve SKILL" / "consolidate learnings"
  → Read _memory/experience.md
  → Classify each entry by test type + agent phase
  → Propose improvements to agent/implementer/reviewer files
  → Apply approved changes
  → Archive processed experiences
```

---

## Phase 1: Capture — Recording Raw Experiences

### When to Capture

Capture an experience entry whenever:
- A **pitfall** is hit (something broke, wasn't obvious why)
- A **fix** is discovered (after debugging, found the root cause)
- A **pattern** emerges (same issue across multiple tests/modules)
- A **good approach** is validated (something worked better than expected)
- A **bad approach** is abandoned (wasted time on something that didn't work)
- The **user explicitly says** something like "remember this" / "this was painful" / "this worked well"

### How to Capture

**Append to `_memory/experience.md`** with this format:

```markdown
---
### [DATE] [TEST_TYPE] [PHASE] [GOOD/BAD]

**Context:** What were you doing?
**What happened:** What went wrong or right?
**Root cause:** Why did it happen?
**Fix/Lesson:** What was the solution or takeaway?
**Applies to:** Which agent files should learn this?
```

### Examples

```markdown
---
### 2026-04-06 load_test implementer BAD

**Context:** Writing k6 checks for search endpoint
**What happened:** 100% check failures — `search returns results array` all failed
**Root cause:** Search endpoint returns plain array `[...]` not `{ results: [...] }`
**Fix/Lesson:** Always curl the endpoint first to check response shape before writing checks
**Applies to:** load_test/agent.md (planning phase should verify shapes), load_test/implementer.md (add as pitfall)

---
### 2026-04-06 load_test implementer BAD

**Context:** Running two k6 scenarios in parallel for user journeys
**What happened:** Expected 50 VUs but got 100 — each scenario had target: 50
**Root cause:** k6 scenarios run concurrently, VU counts add up
**Fix/Lesson:** Use single scenario with __ITER % 2 alternation for multiple journeys
**Applies to:** load_test/implementer.md (add as pattern + pitfall)

---
### 2026-04-06 load_test reviewer GOOD

**Context:** Smoke test at 1 VU before full run
**What happened:** Caught seed data mismatch immediately — 404s on product slugs
**Root cause:** Atlas DB had different products than seed JSON files
**Fix/Lesson:** Always smoke test at 1 VU first. If checks fail at 1 VU, it's a script bug not a performance issue
**Applies to:** load_test/reviewer.md (smoke test step is critical, emphasize it)
```

### Hinting the User to Capture

When you observe these signals during a session, **prompt the user:**

| Signal | Hint |
|--------|------|
| User says "oh wait", "hmm", "that's weird" | "Want me to log this as an experience?" |
| Same error appears twice across different tests | "This pattern appeared before — should I capture it?" |
| User explicitly corrects the AI's approach | "Got it — should I capture this as a pitfall to avoid?" |
| A workaround is applied | "This workaround solved it — worth capturing for future sessions?" |
| Test passes after debugging | "We fixed it. Want me to log what went wrong and the fix?" |
| User says "remember this" / "don't do that again" | Capture immediately, no need to ask |

**The AI should also self-capture** when it recognizes its own mistakes:
- "I assumed X but it was actually Y — logging this"
- "This is the second time this pattern caused issues — capturing"

---

## Phase 2: Remediate — Transform Experiences into SOP

### Trigger

User says any of:
- "remediate experiences"
- "improve SKILL"  
- "consolidate learnings"
- "update SOPs"
- "apply experiences"

Or the AI hints: "You have N unprocessed experiences. Want me to remediate them into the SKILL files?"

### Step 1: Read & Classify

Read `_memory/experience.md` and classify each entry:

```
For each experience entry:
  1. TEST_TYPE: unit_test | integration_test | ui_test | load_test | general
  2. PHASE: agent (planning) | implementer (execution) | reviewer (verification)
  3. SENTIMENT: GOOD (reinforce) | BAD (add as pitfall/guard)
  4. SCOPE: specific (one test type) | cross-cutting (affects multiple)
```

**Build a remediation table:**

| # | Experience | Test Type | Phase | Good/Bad | Target File |
|---|-----------|-----------|-------|----------|-------------|
| 1 | Response shape mismatch | load_test | agent + implementer | BAD | agent.md §verify shapes, implementer.md §pitfalls |
| 2 | Smoke test caught data issue | load_test | reviewer | GOOD | reviewer.md §emphasize smoke test |
| 3 | Parallel scenarios doubling VUs | load_test | implementer | BAD | implementer.md §patterns + pitfalls |

### Step 2: Propose Changes

For each entry, propose a specific change to the target file:

```
PROPOSED CHANGE #1
──────────────────
File: load_test/agent.md
Section: Phase 1.4 (Verify Response Shapes)
Action: ADD paragraph emphasizing curl-first approach
Reason: Experience #1 — wrong shape caused 100% failures

PROPOSED CHANGE #2
──────────────────
File: load_test/implementer.md  
Section: Common Pitfalls
Action: ADD "Pitfall: Parallel Scenarios Doubling VUs"
Reason: Experience #3 — k6 scenarios run concurrently
```

**For GOOD experiences:** Reinforce existing patterns or add them if missing.
**For BAD experiences:** Add as pitfalls, guards, or warnings in the relevant phase.

### Step 3: Apply (with User Approval)

Present proposed changes to the user:
```
I have 5 improvements to apply across 3 SKILL files:
  - load_test/agent.md: 2 additions (response shape verification, data alignment)
  - load_test/implementer.md: 2 additions (VU alternation pattern, null-body pitfall)
  - load_test/reviewer.md: 1 reinforcement (smoke test emphasis)

Apply all? Or review individually?
```

**Rules for applying:**
- **Never remove** existing content — only add or restructure
- **Add to existing sections** when possible (don't create new sections for one-off items)
- **Generalize** — don't write project-specific details, write the generic pattern
- **Include rationale** — "Why: because X happened" helps future users judge edge cases
- **Cross-cutting experiences** go into multiple files

### Step 4: Archive Processed Experiences

After applying, move processed entries from `_memory/experience.md` to `_memory/experience_archive.md` with a timestamp:

```markdown
## Remediated: 2026-04-06

[moved entries here]

Applied to:
- load_test/agent.md (2 changes)
- load_test/implementer.md (2 changes)  
- load_test/reviewer.md (1 change)
```

This keeps `experience.md` clean for new captures while preserving history.

---

## Cross-Cutting Improvements

Some experiences improve **multiple test types**. Common cross-cutting patterns:

| Pattern | Affects | Example |
|---------|---------|---------|
| Seed data verification | All test types | "Always verify test data against running system, not static files" |
| Null/error guards | load_test, integration_test | "Guard against null responses in assertions" |
| Smoke test first | All test types | "Run minimal test to verify setup before full suite" |
| Environment checks | All test types | "Verify DB connection before running tests" |
| Response shape validation | load_test, integration_test | "Check actual API response structure before writing assertions" |

**Cross-cutting improvements go into `_memory/patterns.md`** AND the relevant agent files.

---

## Improvement Quality Rules

### What Makes a Good SOP Improvement

✅ **Specific** — "Add null-body guard before `r.json()` calls" not "handle errors better"
✅ **Actionable** — Clear what to do, when to do it, and where in the workflow
✅ **Generalizable** — Works for any project, not tied to specific URLs or data
✅ **Includes rationale** — "Why: server crashes under load produce null bodies"
✅ **Placed correctly** — In the right phase (planner vs implementer vs reviewer)

### What to Reject

❌ **Too vague** — "Be careful with data" → needs specificity
❌ **Too specific** — "Use slug 'laptop' for product tests" → project-specific
❌ **Wrong phase** — Implementation detail in the planner → move to implementer
❌ **Duplicate** — Already captured in the file → skip or merge
❌ **Ephemeral** — "Server was down today" → not useful long-term

---

## The Feedback Loop

```
         ┌──────────────────────────────────┐
         │                                  │
         ▼                                  │
    ┌─────────┐     ┌──────────┐     ┌──────┴──────┐
    │  PLAN   │────▶│ IMPLEMENT│────▶│   REVIEW    │
    │ agent.md│     │implement.│     │ reviewer.md │
    └─────────┘     └──────────┘     └──────┬──────┘
         ▲                                  │
         │           ┌──────────┐           │
         │           │ CAPTURE  │◀──────────┘
         │           │experience│   (during debugging)
         │           └────┬─────┘
         │                │
         │           ┌────▼──────┐
         └───────────┤ REMEDIATE │   (user-triggered)
                     │remediator │
                     └───────────┘
```

Each cycle makes the SKILL files better:
1. **Plan** with current SOPs
2. **Implement** following current patterns
3. **Review** using current checklists
4. **Capture** what went wrong or right (continuous)
5. **Remediate** raw experiences into SOP improvements (on trigger)
6. **Repeat** — next cycle benefits from accumulated wisdom

---

## Quick Reference

| Action | When | What Happens |
|--------|------|-------------|
| **Capture** | During debugging | Append to `_memory/experience.md` |
| **Remediate** | User triggers | Read experiences → propose → apply to SKILL files |
| **Archive** | After remediation | Move processed entries to `_memory/experience_archive.md` |
| **Hint** | AI observes pattern | Suggest capture to user |
