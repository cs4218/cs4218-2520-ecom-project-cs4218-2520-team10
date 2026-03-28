# Memory Schema System

## Overview

The Memory Schema System defines how the SKILL test agents capture, store, and retrieve learnings across multiple testing cycles.

This system enables **cross-module learning**: patterns discovered while testing the Auth module inform better test planning for Products, Orders, and Categories modules.

---

## Why Memory?

**Without Memory:**
- Test agents plan each module independently
- Patterns from auth module are lost when testing products
- Same mistakes repeated in each module
- No continuous improvement

**With Memory:**
- Test agents learn from past test runs
- Effective mock strategies reused across modules
- Common validation patterns recognized and applied
- Performance improvements from previous cycles

---

## Memory Architecture

### Three Memory Types

1. **Episodic Memory** — "What happened?"
   - Records of actual test runs per module
   - Which test scenarios were effective at catching bugs
   - Coverage achieved, failures encountered
   - Raw data about test execution

2. **Semantic Memory** — "What patterns did we learn?"
   - Generalized knowledge extracted from episodic data
   - Best practices for mocking controllers, models, services
   - Validation patterns for common field types
   - Architectural patterns discovered (bottom-up, top-down, etc.)

3. **Procedural Memory** — "How can we improve?"
   - Optimizations and speedups discovered
   - Time estimates for different task complexities
   - Bottlenecks encountered and solutions
   - Shortcuts and templates that worked well

---

## Directory Structure

```
SKILL/_memory-schema/          ← You are here (schemas)
├── README.md                  ← This file
├── memory-types.md            ← Detailed definitions
├── file-format.md             ← JSON schema examples
│
SKILL/_memory-base/            ← Actual stored memories
├── README.md
├── modules/
│   ├── auth/
│   │   └── runs/              ← Episodic: test run records
│   ├── products/
│   ├── orders/
│   └── categories/
├── architecture/              ← Structured docs (from architecture_reader)
│   ├── auth.json
│   ├── products.json
│   └── ...
└── knowledge/
    ├── patterns/              ← Semantic: extracted patterns
    │   ├── validation-strategies.json
    │   ├── mocking-strategies.json
    │   └── jest-patterns.json
    └── agent-optimizations.json  ← Procedural: learnings
```

---

## How Agents Use Memory

### Writing (experience_consolidate)
1. After testing a module, experience_consolidate reviews all test results
2. **Extracts episodic data:** Which tests passed/failed, coverage metrics, findings
3. **Derives semantic patterns:** Common validation types, effective mock strategies
4. **Notes procedural improvements:** Time spent, bottlenecks, what could be faster

### Reading (unit_test, integration_test, ui_test) — Optional
1. At start of planning phase, agents can check recent memories
2. **"How did we test similar functions in the auth module?"** → Check episodic memory
3. **"What mocking patterns work for Controllers?"** → Check semantic memory
4. **"How long did unit test planning take last time?"** → Check procedural memory

---

## Key Principles

**1. Append-only (Unlimited Retention)**
- All module memories are kept indefinitely
- Pattern detection across 4+ modules improves over time
- No automatic cleanup (preserves full history)

**2. Optional References**
- Agents CAN cite memories but don't REQUIRE them
- Backward compatible if memories don't exist
- Graceful fallback to standard agent behavior

**3. Human-Inspectable**
- All memories stored as readable JSON
- Easy to verify, audit, and understand
- Git-tracked for version control

**4. Structured & Queryable**
- Consistent format for each memory type
- Agents can reliably parse and reference
- Semantic patterns organized by domain

---

## Memory Lifecycle

```
Test Execution
    ↓
Results & Observations
    ↓
experience_consolidate/agent.md → Plan what to remember
    ↓
experience_consolidate/implementer.md → Write to _memory-base/
    ↓
Episodic Memory (test run record) + Semantic Memory (patterns) + Procedural Memory (optimizations)
    ↓
Next Module Test
    ↓
unit_test/agent.md → OPTIONAL: Check _memory-base/ for similar functions
    ↓
Better informed planning → Faster execution → Fewer iterations
```

---

## See Also

- `memory-types.md` — Detailed schema for each memory type
- `file-format.md` — JSON examples and structure
- `SKILL/experience_consolidate/` — How memories are captured
- `SKILL/_memory-base/README.md` — How to use memories
