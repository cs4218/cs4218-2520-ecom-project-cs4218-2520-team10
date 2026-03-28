# Architecture Reader Planner — Plan Structured Documentation

**Plan module architecture analysis and structured documentation for memory base.**

This phase runs **at the start of each module's testing** (before/alongside unit tests).

Goal: Create structured JSON documentation that other agents can reference and understand component relationships.

---

## Phase 1: Define Documentation Scope

**Question:** What architecture should be documented?

### 1.1 Module Components to Document

- [ ] **Controllers**
  - What controllers exist in this module? (e.g., authController, userController)
  - What are their main responsibilities?
  - What methods/functions do they expose?

- [ ] **Models**
  - What data models exist? (e.g., User, Product, Order)
  - What are the schema fields?
  - What methods do models provide? (create, findOne, update, delete, etc.)

- [ ] **Helpers/Utilities**
  - What helper functions exist? (e.g., hashPassword, validateEmail, calculateDiscount)
  - What is each helper's purpose?
  - Are they pure functions or do they have side effects?

- [ ] **Routes/Endpoints**
  - What API routes exist? (GET, POST, PUT, DELETE)
  - What controller methods do they call?
  - What request/response shapes?

- [ ] **Middleware**
  - What middleware exists for this module? (auth, validation, logging)
  - What does each middleware do?
  - What transformations happen?

### 1.2 Interaction Patterns to Map

- [ ] **Internal Dependencies**
  - Which components call which other components?
  - Example: Controller → Model (authController calls userModel.create())
  - Example: Route → Middleware → Controller (auth flow)

- [ ] **External Dependencies**
  - What external libraries/services does this module use?
  - Example: bcrypt, JWT, mongoose, email service
  - Why is each dependency needed?

- [ ] **Data Flow**
  - How does data flow through the module?
  - Example: User input → Validation → Hashing → Database save

---

## Phase 2: Identify Key Questions

**Question:** What do future agents need to understand?

- [ ] **Component Relationships**
  - "Which controllers depend on which models?"
  - "What does the dependency graph look like?"

- [ ] **Integration Points**
  - "How does the API receive requests?"
  - "What's the flow from route → controller → model?"
  - "Where do external services fit in?"

- [ ] **Data Schema**
  - "What fields does each model have?"
  - "What validations apply?"
  - "Are there relationships between models?"

- [ ] **Error Handling**
  - "How are errors handled?"
  - "What happens on validation failures?"
  - "How are errors propagated?"

- [ ] **Security**
  - "Where is authentication enforced?"
  - "How are passwords handled?"
  - "What validations prevent security issues?"

---

## Phase 3: Plan Analysis Approach

**Question:** How will we analyze the code?

- [ ] **File-by-file analysis**
  - Read each controller file
  - Read each model file
  - Read each helper file
  - Document what each does

- [ ] **Interaction mapping**
  - Trace a request through the system
  - Example: User submits registration form → which files execute in order?
  - Document the call chain

- [ ] **Dependency identification**
  - List all imports/requires in each file
  - Identify internal vs external dependencies
  - Document why each dependency exists

- [ ] **Pattern recognition**
  - Are there recurring patterns? (e.g., all controllers validate input before calling model)
  - Document patterns for reference

---

## Phase 4: Define Output Structure

**Question:** How should documentation be organized?

### Output will be structured JSON at:
```
_memory-base/architecture/[module-name].json
Example: _memory-base/architecture/auth.json
```

### Structure:
```json
{
  "module": "[module-name]",
  "date": "[date analyzed]",
  "author": "[analyzer name]",

  "components": [
    {
      "name": "[ComponentName]",
      "type": "controller|model|helper|middleware|route",
      "file": "[filepath]",
      "purpose": "[what it does]",
      "methods": [ { "name": "...", "parameters": [...], "returns": "..." } ],
      "dependencies": ["component1", "component2"]
    }
  ],

  "interactions": [
    {
      "flow": "[user-friendly name]",
      "steps": ["step1", "step2", "step3"],
      "components_involved": ["comp1", "comp2"]
    }
  ],

  "dependencies_external": [
    {
      "library": "[bcrypt]",
      "used_for": "[password hashing]",
      "components_using": ["authHelper"]
    }
  ]
}
```

---

## Phase 5: Success Criteria

**How will we know documentation is complete?**

Checklist:
- [ ] All major components identified and documented
- [ ] Component types (controller/model/helper) clearly labeled
- [ ] All key methods listed with parameters and return types
- [ ] Internal dependencies clearly shown (component → component)
- [ ] External dependencies documented with purpose
- [ ] At least 3 key interaction flows mapped step-by-step
- [ ] File paths accurate and match actual codebase
- [ ] JSON structure valid per schema
- [ ] Documentation is referenceable by future agents
- [ ] A new agent could understand this module's architecture from this JSON

---

## Output Format: Architecture Analysis Plan

When planning is complete, document:

```
ARCHITECTURE ANALYSIS PLAN
==========================

MODULE: [module-name]
ANALYZER: [name, ID]
DATE: [date]

1. COMPONENTS TO ANALYZE
   Controllers:
   - [ ] [Name] in [file] — [purpose]

   Models:
   - [ ] [Name] in [file] — [purpose]

   Helpers:
   - [ ] [Name] in [file] — [purpose]

   Middleware:
   - [ ] [Name] in [file] — [purpose]

2. KEY INTERACTION FLOWS TO MAP
   - [ ] User registration flow (route → controller → model → DB)
   - [ ] User login flow (route → auth middleware → controller → model)
   - [ ] [Module-specific flow]

3. EXTERNAL DEPENDENCIES
   - [ ] bcrypt (password hashing)
   - [ ] jwt (token generation)
   - [ ] mongoose (database)
   - [ ] [others]

4. OUTPUT STRUCTURE
   - File: _memory-base/architecture/[module-name].json
   - Format: Structured JSON per _memory-schema/file-format.md
   - Sections: components, interactions, dependencies

5. SUCCESS CRITERIA
   - [ ] All major components documented
   - [ ] All key flows mapped
   - [ ] Dependencies identified
   - [ ] JSON valid
   - [ ] Referenceable by future agents

READY FOR IMPLEMENTER ✓
```

---

## Notes

- **Completeness:** Document all major components. Skip minor utilities unless they're critical to understanding.
- **Accuracy:** File paths and function signatures must match actual code.
- **Usefulness:** Future agents will use this. Make it clear enough that someone unfamiliar with the code can understand the architecture.
- **Referencibility:** Structure as JSON so agents can parse and reference specific components programmatically.
