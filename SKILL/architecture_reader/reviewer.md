# Architecture Reader Reviewer — Verify Structured Documentation Quality

**Review architecture JSON documentation for accuracy, completeness, and referencibility.**

---

## Role
Verify that architecture documentation is accurate, complete, and useful for future agents.

## Responsibilities
- Verify JSON file structure matches schema
- Validate all components documented
- Check file paths against actual codebase
- Verify interaction flows are correct
- Ensure dependencies accurately identified
- Assess documentation clarity and usefulness
- Confirm JSON is referenceable by other agents

---

## Review Checklist

### 1. File Structure & Metadata

**File:** `_memory-base/architecture/[module-name].json`

- [ ] **File exists in correct location** — Check path matches pattern
- [ ] **Metadata complete**
  - [ ] module: matches actual module name
  - [ ] date: ISO-8601 format (2026-03-27)
  - [ ] author: name and student ID included
- [ ] **File is valid JSON** — No syntax errors, parseable

### 2. Components Documentation

**Section:** `components` array

- [ ] **All major components listed**
  - [ ] Controllers? (all of them)
  - [ ] Models? (all of them)
  - [ ] Helpers? (all major ones)
  - [ ] Routes? (if included)
  - [ ] Middleware? (if applicable)

- [ ] **Each component has required fields**
  - [ ] name: descriptive and matches actual class/object name
  - [ ] type: labeled correctly (controller/model/helper/route/middleware)
  - [ ] file: path matches actual codebase location
  - [ ] purpose: clearly explains what component does
  - [ ] methods: for controllers/models/helpers

- [ ] **Methods documented completely**
  - [ ] method name matches actual code
  - [ ] parameters list includes all parameters with types
  - [ ] returns: documents return type and structure
  - [ ] calls: lists other components/functions called

**Spot-check examples:**
```
controllers/authController.js
- registerController documented? ✓
- Parameters (email, password, userModel) listed? ✓
- Returns structure correct? ✓
- Calls (hashPassword, userModel.create, JWT.sign) listed? ✓

models/userModel.js
- Schema fields listed? ✓
- Methods (create, findOne, etc.) documented? ✓
- Validations noted? ✓
```

### 3. Dependencies Documentation

**Section:** `dependencies_internal` & `dependencies_external`

#### Internal Dependencies (Component → Component)
- [ ] **All major relationships documented**
  - [ ] authController → authHelper (calls hashPassword)
  - [ ] authController → userModel (calls create, findOne)
  - [ ] routes → controllers (imports and calls)

- [ ] **Relationships accurate**
  - [ ] "from" component actually calls "to" component
  - [ ] Method names correct
  - [ ] Not overstated (documenting only important calls)

#### External Dependencies (Libraries)
- [ ] **All libraries used documented**
  - [ ] bcrypt (password hashing)
  - [ ] jwt (token generation)
  - [ ] mongoose (database)
  - [ ] express, etc.

- [ ] **Each dependency includes**
  - [ ] library name
  - [ ] version (if known)
  - [ ] used_for: clear explanation of purpose
  - [ ] components_using: which components use it
  - [ ] why_needed: security or functional reason

**Verification:**
- Check package.json for all listed dependencies ✓
- Verify components listed actually use the library ✓

### 4. Interaction Flows

**Section:** `interactions` array

- [ ] **At least 3 key flows documented** — Usually:
  - Main success flow (e.g., registration)
  - Alternative flow (e.g., login)
  - Error or edge case flow

- [ ] **Each flow is complete**
  - [ ] flow name descriptive
  - [ ] description explains purpose
  - [ ] steps numbered and sequential
  - [ ] steps are step-by-step (not summarized)
  - [ ] each step includes action + result

- [ ] **Flows match actual code execution**
  - [ ] Step 1 matches route behavior
  - [ ] Step 2-N match controller/model behavior
  - [ ] Final result matches what system returns

**Example verification:**
```
Flow: User Registration
Step 1: Client POST /register
  ✓ Check routes/authRoutes.js has this endpoint
Step 2: Controller.registerController called
  ✓ Check controller is imported in route
Step 3: Validate input
  ✓ Check controller has validation logic
Step 4: Call authHelper.hashPassword
  ✓ Check this function exists and is called
Step 5: Call userModel.create
  ✓ Check this method exists
  ✓ Check it saves to database
```

### 5. Accuracy Spot-Checks

**Random verification from actual code:**

- [ ] **Pick one controller method** — Verify:
  - [ ] Actual parameters match documented parameters
  - [ ] Actual dependencies called match documented calls
  - [ ] Actual return value matches documented return

- [ ] **Pick one model** — Verify:
  - [ ] Schema fields exist in code
  - [ ] Available methods exist in code
  - [ ] Validations documented match code

- [ ] **Pick one interaction flow** — Trace through:
  - [ ] Follow the steps in actual code
  - [ ] Steps match what code actually does
  - [ ] Nothing important is missing
  - [ ] No incorrect steps added

### 6. Clarity & Usefulness

- [ ] **Documentation is clear** — Could someone unfamiliar with code understand it?
- [ ] **Terminology consistent** — Component names match actual code
- [ ] **Referenceable** — Future agents can find what they need
  - [ ] Method signatures clear enough to understand calls
  - [ ] Dependencies clear enough to understand interactions
  - [ ] Flows clear enough to understand execution order

---

## Red Flags

🚩 **Missing component** — Major controller, model, or helper not documented
🚩 **Incorrect file path** — Doesn't match actual codebase location
🚩 **Wrong method signature** — Parameters or returns don't match actual code
🚩 **Missing dependency** — Controller calls function not documented
🚩 **Incomplete flow** — Flow is summarized rather than step-by-step
🚩 **Wrong interaction** — Documented interaction doesn't match code execution
🚩 **Invalid JSON** — Syntax errors, missing quotes, etc.

---

## Review Decision Matrix

### ✅ APPROVE
**When:** Documentation is complete, accurate, and matches actual code.

Criteria:
- All major components documented
- File paths accurate
- Method signatures correct
- Dependencies complete
- Interaction flows accurate and step-by-step
- JSON valid and referenceable
- Documentation clear

Decision: **Architecture documentation ready. Other agents can reference this.**

### 🔄 REWORK (Implementer Refines)
**When:** Minor gaps or inaccuracies. Implementer fixes without re-analyzing.

Examples:
- "Component X documented but method Y missing" → Add method
- "Dependency Z listed but not explained why" → Add rationale
- "Interaction flow missing step" → Insert missing step
- "File path incorrect" → Fix path
- "JSON formatting issue" → Fix syntax

Action: **Request specific fixes, implementer corrects**

### ⚠️ REPLAN (Escalate to Planner)
**When:** Major misunderstandings or missing architectural concepts.

Examples:
- Critical architectural pattern not documented
- Fundamental misunderstanding of component relationships
- Major component/service completely missed
- JSON structure doesn't match schema

Action: **Escalate to planner (agent.md), re-analyze**

---

## Review Checklist Template

```
ARCHITECTURE REVIEW
===================

MODULE: [module-name]
REVIEWER: [name]
DATE: [date]

1. FILE STRUCTURE ✓/✗
   [ ] File in correct location
   [ ] Metadata complete and correct
   [ ] JSON valid
   Notes: [any issues]

2. COMPONENTS ✓/✗
   [ ] All major components listed
   [ ] Component types correct (controller/model/helper)
   [ ] File paths match actual codebase
   [ ] Methods documented with signatures
   [ ] Dependencies for each component listed
   Notes: [spot-checks performed, any issues]

3. DEPENDENCIES ✓/✗
   [ ] Internal dependencies (component → component) documented
   [ ] External dependencies (libraries) documented
   [ ] Dependencies in package.json? ✓
   [ ] Why-needed rationale for each? ✓
   Notes: [any missing or incorrect dependencies]

4. INTERACTION FLOWS ✓/✗
   [ ] At least 3 key flows documented
   [ ] Each flow step-by-step (not summarized)
   [ ] Each flow matches actual code execution
   [ ] Flows cover success, alternative, error cases
   Notes: [any flow inaccuracies or missing flows]

5. ACCURACY ✓/✗
   [ ] Random spot-checks performed
   [ ] Method names accurate
   [ ] Parameters match actual code
   [ ] Return values match actual code
   [ ] Dependencies called match documentation
   Notes: [spot-checks passed/failed and why]

6. CLARITY & USEFULNESS ✓/✗
   [ ] Documentation clear to someone unfamiliar with code
   [ ] Terminology consistent with actual code
   [ ] Referenceable by other agents
   Notes: [clarity issues if any]

DECISION: [ ] APPROVE  [ ] REWORK  [ ] REPLAN

If REWORK: Specific items for implementer to fix:
1. [Issue 1 — be specific]
2. [Issue 2 — be specific]

If REPLAN: Escalation reason:
[Explain what needs re-analysis]

Reviewer: [name]
Date: [date]
```

---

## Key Principles

✅ **Accuracy First** — Architecture documentation is a reference. It must be correct.
✅ **Completeness** — Document all major components. Skip minor utilities unless critical.
✅ **Clarity** — A future agent should understand the module from this JSON.
✅ **Referencibility** — JSON structure should enable programmatic reference by other agents.
✅ **Spot-checking** — Verify documentation against actual code, not assumptions.
