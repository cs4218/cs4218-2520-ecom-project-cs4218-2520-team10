---
name: SKILL Framework
description: Main routing workflow for systematic testing and architectural learning
type: framework
version: 1.0
status: production-ready
last_updated: 2026-03-27
---

# SKILL Framework - Main Logic & Routing

**Systematic workflow routing to specialized agents for testing and architectural learning.**

---

## Prerequisites

**SKILL requires file access to operate. Choose one:**

- ✅ **Local Environment (Claude Code):** AI can read/write files directly
  - Agent outputs → Written as .md files
  - Agent workflows → Direct file creation

- ✅ **GitHub/Web with Access:** User provides GitHub credentials/access
  - Agent outputs → Can commit to repo
  - Agent workflows → Direct file creation

- ⚠️ **No File Access:** User cannot grant file access
  - Agent outputs → Provided in chat as markdown
  - User responsibility → Copy-paste to files manually
  - Agent workflows → Described step-by-step in chat

**No prerequisite:** If you're reading this in Claude Code, you have file access. ✓

---

## Core Concept

SKILL is a **routing workflow** that directs you to the right **Agent** based on what you need to do.

```
START
  ↓
1. UNDERSTAND ARCHITECTURE
   └─ Go to: architecture_reader/
   └─ Output: Project structure understanding
  ↓
2. CHOOSE TEST TYPE & AGENT
   ├─ Unit tests? → unit_test/
   ├─ Integration tests? → integration_test/
   ├─ UI tests? → ui_test/
   ├─ Load tests? → load_test/
   └─ Learning? → experience_consolidate/
  ↓
3. FOLLOW AGENT'S THREE-STEP PROCESS
   ├─ Step 1: agent.md (Planner - Plan detailed steps)
   ├─ Step 2: implementer.md (Implementer - Execute steps)
   └─ Step 3: reviewer.md (Reviewer - Verify quality)
  ↓
4. CONSOLIDATE & REPEAT
   └─ experience_consolidate/ (Document learnings, then repeat for next module)
```

---

## The Five Agents

Each agent folder contains its own complete workflow:

### 1. **architecture_reader/**
**Role:** Understand the codebase structure
- agent.md → What to analyze and document
- implementer.md → How to read and map architecture
- reviewer.md → Verify understanding is accurate

**Output:** Architecture documentation, component map, dependencies

**→ Pass to other agents for their use**

---

### 2. **unit_test/**
**Role:** Plan and write unit tests
- agent.md → How to analyze and plan unit tests
- implementer.md → How to write unit tests (AAA pattern, code quality)
- reviewer.md → Quality checklist and approval criteria

**Input:** Understanding from architecture_reader
**Output:** Unit test code + coverage

---

### 3. **integration_test/**
**Role:** Plan and write integration tests
- agent.md → How to plan integration test scenarios
- implementer.md → How to write integration tests (with real dependencies)
- reviewer.md → Verify integration test quality

**Input:** Architecture understanding
**Output:** Integration test code + coverage

---

### 4. **ui_test/**
**Role:** Plan and write UI/component tests
- agent.md → How to plan UI test scenarios
- implementer.md → How to write UI tests (component, E2E)
- reviewer.md → Verify UI test quality

**Input:** Architecture understanding
**Output:** UI test code + coverage

---

### 5. **load_test/**
**Role:** Plan and write performance tests
- agent.md → How to plan load test scenarios
- implementer.md → How to write load tests
- reviewer.md → Verify load test quality

**Input:** Architecture understanding, critical paths
**Output:** Load test code + performance baselines

---

### 6. **experience_consolidate/**
**Role:** Learn and document patterns
- agent.md → What to consolidate from completed tests
- implementer.md → How to synthesize learnings
- reviewer.md → Verify completeness of learnings

**Input:** Test results, observations, lessons
**Output:** Documented patterns, recommendations for next cycle

---

## Workflow: Step-by-Step

### Step 1: Understand Architecture

```
GO TO: architecture_reader/

1. Read: agent.md
   ↓ What to analyze?
   ↓ Which components?
   ↓ What dependencies?

2. Execute: implementer.md
   ↓ Map the structure
   ↓ Document interactions
   ↓ Create architecture diagram/docs

3. Verify: reviewer.md
   ↓ Is understanding accurate?
   ↓ Complete?
   ↓ Ready for other agents?
```

**Output:** Architecture understanding passed to other agents

---

### Step 2: Choose an Agent & Test Type

**Question:** What do you want to test?

- Unit functions in isolation? → **unit_test/**
- Components working together? → **integration_test/**
- UI and user flows? → **ui_test/**
- Performance under load? → **load_test/**
- Learning patterns? → **experience_consolidate/**

---

### Step 3: Follow the Agent's Three-Step Process

```
CHOSEN AGENT (e.g., unit_test/)

STEP 1: PLANNER (agent.md)
├─ Read the planning guide
├─ Answer the planning questions
├─ Analyze what to test
└─ Create test plan (NO CODE YET)

STEP 2: IMPLEMENTER (implementer.md)
├─ Read the implementation guide
├─ Follow code quality standards
├─ Write tests based on plan
└─ Verify tests pass

STEP 3: REVIEWER (reviewer.md)
├─ Read the quality checklist
├─ Verify plan was followed
├─ Check code quality
├─ Approve or request changes
```

---

### Step 4: Consolidate & Learn

```
AFTER COMPLETING TESTS

GO TO: experience_consolidate/

1. agent.md → What to document?
2. implementer.md → Synthesize learnings
3. reviewer.md → Verify completeness

THEN: Repeat cycle for next module
```

---

## Using SKILL for Your Project

### Example: Testing Auth Module

```
1. START: Understand Auth Architecture
   └─ GO TO: architecture_reader/agent.md
   └─ Analyze: controllers, models, helpers, routes
   └─ Document relationships

2. CHOOSE: Test unit functions first
   └─ GO TO: unit_test/agent.md
   └─ Plan: hashPassword, validateEmail, etc.
   └─ Write tests following unit_test/implementer.md
   └─ Review using unit_test/reviewer.md

3. THEN: Test integration points
   └─ GO TO: integration_test/agent.md
   └─ Plan: controller + model + DB scenarios
   └─ Implement following integration_test/implementer.md
   └─ Review using integration_test/reviewer.md

4. THEN: Test UI flows
   └─ GO TO: ui_test/agent.md
   └─ Plan: login form, register form flows
   └─ Implement UI tests
   └─ Review quality

5. CONSOLIDATE: Document learnings
   └─ GO TO: experience_consolidate/
   └─ What patterns learned?
   └─ What should next module know?

6. REPEAT: For next module (Products, Categories, Orders, etc.)
```

---

## Execution Mode (How Agents Run)

**SKILL supports two execution modes. Choose based on task complexity:**

### Mode 1: Inline Execution (Keep Context Clear) ✅ Default

**What:** Agents run within current conversation, context stays clean

```
User → SKILL → Agent runs here → Output in chat
(Single context, continuous conversation)
```

**Characteristics:**
- ✅ Fast feedback, low latency
- ✅ Lower token cost
- ✅ Clean conversation history
- ✅ Easy to follow
- ❌ Not ideal for complex workflows

**Use for:**
- Testing 1-3 functions
- Simple/straightforward tasks
- Need immediate feedback
- Single module workflows

**Context management:** Agent keeps context clear, no bloat

---

### Mode 2: Spin-Out Agents (Separate Subprocess) 🚀 For Complex Work

**What:** Launch each agent as independent execution, isolated sandbox

```
User → SKILL → Spin-out Agent → Subprocess (isolated)
                    ↓
            Output back to context (filtered, clean)
```

**Characteristics:**
- ✅ Raw data isolated (stays in subprocess)
- ✅ Prevents context bloat
- ✅ Better for large projects
- ✅ Clear agent boundaries
- ❌ Higher token cost (15x)
- ❌ More coordination overhead

**Use for:**
- Testing entire modules (10+ functions)
- Complex multi-stage workflows
- High raw data volume
- Long-running processes
- Load/performance testing

**Context management:** Raw data stays sandboxed, clean handoff to context

---

### Choosing Your Mode

| Scenario | Mode | Reason |
|----------|------|--------|
| Test 1-3 functions | **Inline** | Simple, fast |
| Test 1 module (5-10 functions) | **Inline** | Manageable context |
| Test multiple modules | **Spin-out** | Complex, lots of data |
| Architecture understanding | **Inline** | Quick learning |
| Load/performance testing | **Spin-out** | Raw data volume |
| Learning & consolidation | **Inline** | Quick feedback |

**Rule of thumb:** If context feels cluttered → Switch to Spin-out mode

---

## Output Format (Based on Environment)

**Agent output adapts to your environment:**

| Environment | Agent Output | Format |
|---|---|---|
| **Claude Code (local files)** | Write files directly | .md files created |
| **GitHub with access** | Commit to repository | Files + git commits |
| **Chat only (no file access)** | Provide in chat | Markdown in messages |

**How agents decide:**
- If file access available → Write .md files
- If no file access → Output as chat markdown
- User responsibility → Copy-paste if needed

**Key:** Agents are flexible. They work in any environment.

---

## Key Principles

✅ **architecture_reader is first** - Understand before testing
✅ **Each agent is self-contained** - Has its own 3-step process
✅ **agent.md is planning** - No code, just planning
✅ **implementer.md is execution** - Write code based on plan
✅ **reviewer.md is quality** - Verify before moving on
✅ **Flexible output** - Works with or without file access

---

## When to Use Each Agent

| Need | Agent | Files |
|------|-------|-------|
| Understand codebase structure | architecture_reader | agent.md, implementer.md, reviewer.md |
| Test individual functions | unit_test | agent.md, implementer.md, reviewer.md |
| Test component interactions | integration_test | agent.md, implementer.md, reviewer.md |
| Test UI and flows | ui_test | agent.md, implementer.md, reviewer.md |
| Test performance | load_test | agent.md, implementer.md, reviewer.md |
| Document learnings | experience_consolidate | agent.md, implementer.md, reviewer.md |
| General best practices | reference/ | industry_standards.md, test_pyramid.md, etc. |

---

## Navigation

From here, go to the **agent folder** that matches your current need:

```
SKILL/
├── architecture_reader/     ← START HERE (understand structure)
├── unit_test/               ← Then test individual units
├── integration_test/        ← Then test interactions
├── ui_test/                 ← Then test UI/user flows
├── load_test/               ← Then test performance
├── experience_consolidate/  ← Finally, document learnings
└── reference/               ← Available for all agents (best practices)
```

Each folder has:
- **agent.md** - Detailed planning steps
- **implementer.md** - Detailed implementation steps
- **reviewer.md** - Detailed quality checks

---

## Remember

- SKILL.md = **Main routing only** (you are here)
- Each agent folder = **Complete workflow** (plan → implement → review)
- Reference folder = **Shared knowledge** (for all agents)
- architecture_reader = **Prerequisite** (must understand before other agents)

**Ready?** Go to your first agent:
- [architecture_reader/](./architecture_reader/agent.md) — Understand the project structure
- [unit_test/](./unit_test/agent.md) — Plan unit tests
- [integration_test/](./integration_test/agent.md) — Plan integration tests
- [ui_test/](./ui_test/agent.md) — Plan UI tests
- [load_test/](./load_test/agent.md) — Plan load tests

