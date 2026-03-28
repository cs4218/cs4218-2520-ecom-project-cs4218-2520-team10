# Memory Base — Persistent Knowledge Store

This directory stores all learned patterns, test results, and optimizations discovered during SKILL testing workflows.

---

## Directory Structure

```
_memory-base/
├── modules/                          ← Test run records (episodic memory)
│   ├── auth/
│   │   └── runs/
│   │       ├── run-2026-03-27T10-30-45Z.json
│   │       └── run-2026-03-27T14-15-30Z.json
│   ├── products/
│   │   └── runs/
│   │       └── [run files...]
│   ├── orders/
│   │   └── runs/
│   │       └── [run files...]
│   └── categories/
│       └── runs/
│           └── [run files...]
│
├── architecture/                     ← Structured component documentation
│   ├── auth.json
│   ├── products.json
│   ├── orders.json
│   └── categories.json
│
├── knowledge/                        ← Extracted patterns & learnings
│   ├── patterns/
│   │   ├── validation-strategies.json
│   │   ├── mocking-strategies.json
│   │   ├── jest-patterns.json
│   │   └── test-data-patterns.json
│   └── agent-optimizations.json
│
└── README.md (this file)
```

---

## How Agents Use This Memory

### Writing (experience_consolidate)
After completing tests for a module, experience_consolidate:
1. Reads final test results and observations
2. Extracts **episodic data** → writes to `modules/[module]/runs/run-[timestamp].json`
3. Derives **semantic patterns** → updates `knowledge/patterns/*.json`
4. Notes **procedural improvements** → updates `knowledge/agent-optimizations.json`

### Reading (unit_test, integration_test, ui_test) — Optional
At the start of planning, agents can optionally:
1. Read `modules/[module]/runs/*.json` — "How did we test similar functions before?"
2. Read `knowledge/patterns/*.json` — "What validation/mocking strategies are effective?"
3. Read `knowledge/agent-optimizations.json` — "What's the time estimate? What bottlenecks did we encounter?"

---

## Key Points

### Episodic Memory (modules/)
- **What:** Records of actual test runs
- **When written:** After each module's testing completes
- **Format:** `run-[ISO-8601-timestamp].json`
- **Content:** Test counts, coverage, failures, findings, lessons learned
- **Lifetime:** Permanent (all runs kept for pattern analysis)
- **Example use:** "Auth module found password boundary test effective — apply to Products"

### Architecture (architecture/)
- **What:** Structured documentation of module components
- **When written:** By architecture_reader agent after analyzing source code
- **Format:** `[module-name].json` with component list, dependencies, interactions
- **Content:** Components (Controllers, Models, Helpers), their methods, dependencies
- **Lifetime:** Updated each time architecture is re-analyzed
- **Example use:** "Reference auth architecture to understand integration patterns"

### Semantic Patterns (knowledge/patterns/)
- **What:** Generalized testing patterns extracted from episodic data
- **When written:** After experience_consolidate processes module results
- **Files:**
  - `validation-strategies.json` — Email, password, phone validation patterns
  - `mocking-strategies.json` — When to use real vs mock dependencies
  - `jest-patterns.json` — Test naming, AAA pattern, assertions
  - `test-data-patterns.json` — Boundary values, edge cases by data type
- **Lifetime:** Growing across all modules (auth → products → orders → categories)
- **Example use:** "Email validation in Products — check what patterns worked for Auth"

### Procedural Optimizations (knowledge/agent-optimizations.json)
- **What:** Time estimates, bottlenecks, and workflow improvements
- **When written:** After each module completes
- **Content:** Estimated time per task complexity, reusable templates, optimizations
- **Lifetime:** Updated after each module
- **Example use:** "Unit test planning for medium complexity — expect 45 minutes, use decision table template"

---

## Using the Memory

### For manual inspection
```bash
# See all test runs for auth module
ls _memory-base/modules/auth/runs/

# Check validation patterns
cat _memory-base/knowledge/patterns/validation-strategies.json

# See time estimates
cat _memory-base/knowledge/agent-optimizations.json
```

### For agents (in SKILL files)
See the optional **Phase 0** sections in:
- `unit_test/agent.md` — "Check Memory for Similar Functions"
- `integration_test/agent.md` — "Review Prior Integration Patterns"
- `ui_test/agent.md` — "Reference User Flow Patterns"

---

## Memory Lifecycle Example

### Step 1: Auth Module Tests Complete (Kim)
- Kim runs through unit_test → integration_test → ui_test agents
- All test results collected
- Tests pass, coverage met

### Step 2: experience_consolidate Captures Learning (Kim)
- experience_consolidate/agent.md: Plan what to remember
- experience_consolidate/implementer.md: Extract and write memory
  - Episodic: Write `_memory-base/modules/auth/runs/run-2026-03-27T10-30-45Z.json`
  - Semantic: Update `validation-strategies.json` with email/password boundary findings
  - Semantic: Update `mocking-strategies.json` with bcrypt real vs mock discovery
  - Procedural: Update time estimates in `agent-optimizations.json`
- experience_consolidate/reviewer.md: Verify memory quality

### Step 3: Products Module Tests Begin (Ong)
- Optional: unit_test/agent reads `validation-strategies.json`
- Sees: "Email boundary test at TLD length is high-ROI"
- Sees: "Password boundary test at min length catches off-by-one errors"
- Plans products validation tests informed by Auth learnings
- Plans mocking strategy (bcrypt REAL, external APIs MOCKED) based on Auth findings

### Step 4: Products Module Tests Complete (Ong)
- Tests complete, new patterns discovered (price validation edge cases)
- experience_consolidate updates memory with Products findings
- `validation-strategies.json` now has Auth + Products patterns
- Next module (Orders) can learn from both Auth and Products

---

## Git Integration

All memory files are **version-controlled** in Git:
```bash
# Memory files are committed like any other code
git add SKILL/_memory-base/
git commit -m "Capture auth module test learnings"

# History shows memory evolution
git log --follow -- SKILL/_memory-base/knowledge/patterns/validation-strategies.json
```

This lets the team:
- Audit when and how patterns evolved
- Rollback if incorrect patterns are learned
- Compare patterns across different module test runs
- See team learning progress over time

---

## Privacy & Confidentiality

All memory files contain:
- ✅ Testing patterns and strategies (shareable, valuable)
- ✅ Module component structures (architecture, public info)
- ✅ Time estimates and optimizations (team productivity insights)
- ❌ NO sensitive code snippets
- ❌ NO API keys or credentials
- ❌ NO proprietary business logic details

All memory can be safely committed to version control.

---

## Best Practices

**DO:**
- ✅ Update memory after each module test
- ✅ Write accurate findings from actual test results
- ✅ Generalize patterns (don't over-fit to single module)
- ✅ Keep memory files under 500 lines each (readability)
- ✅ Commit memory to Git (version control + team visibility)

**DON'T:**
- ❌ Manually edit memory files (let experience_consolidate manage them)
- ❌ Delete old run files (history is valuable)
- ❌ Store sensitive data (credentials, API keys)
- ❌ Commit generated code (only documentation and patterns)
- ❌ Leave memory stale (update after each module)

---

## See Also

- `_memory-schema/README.md` — Overview of memory architecture
- `_memory-schema/memory-types.md` — Detailed type definitions
- `_memory-schema/file-format.md` — JSON schema specifications
- `../experience_consolidate/` — How memories are created
- `../unit_test/agent.md` — Optional Phase 0 for reading memory
