# Architecture Reader Implementer — Create Structured JSON Documentation

**Analyze source code and write structured architecture documentation to memory base.**

This phase runs **after the planning phase** (agent.md) is approved.

---

## Step 1: Analyze Component Files

**Goal:** Read source code, understand each component's purpose and methods.

### 1.1 Analyze Controllers

For each controller file:
```javascript
// controllers/authController.js
module.exports = {
  registerController: (email, password, userModel) => {
    // What does this method do?
    // What parameters does it accept?
    // What does it return?
    // What other functions does it call? (dependencies)
  },
  loginController: (email, password, userModel) => {
    // ...
  }
}
```

Document:
- Controller name and file path
- Each method's purpose
- Method parameters (types, meaning)
- Method return value (structure)
- Dependencies called (which models, helpers)

### 1.2 Analyze Models

For each model file:
```javascript
// models/userModel.js
const userSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  name: { type: String }
  // What fields?
  // What validations?
  // What relationships to other models?
});

userModel.methods.create = () => { ... }
// What methods exist?
// What do they do?
```

Document:
- Model name and file path
- Schema fields (name, type, validation)
- Available methods (create, findOne, update, delete, etc.)
- Relationships to other models

### 1.3 Analyze Helpers

For each helper file:
```javascript
// helpers/authHelper.js
const hashPassword = (plainPassword) => {
  // Pure function? Side effects?
  // What inputs?
  // What output?
  // Security implications?
}
```

Document:
- Helper name and file path
- Each function's purpose
- Input parameters
- Output/return value
- Security considerations

### 1.4 Analyze Routes

For each route file:
```javascript
// routes/authRoutes.js
router.post('/register', authController.registerController)
// What endpoint?
// What HTTP method?
// What controller method?
// Any middleware?
```

Document:
- Route path and HTTP method
- Controller method called
- Middleware applied (auth, validation)
- Request/response structure

---

## Step 2: Trace Interaction Flows

**Goal:** Understand how components work together.

### Example: User Registration Flow

```
1. Client submits form to POST /register
   ↓
2. Route handler receives request
   ↓
3. Middleware (validation, auth) processes request
   ↓
4. Controller method called (registerController)
   ↓
5. Controller calls helper (hashPassword)
   ↓
6. Helper returns hashed password
   ↓
7. Controller calls model (userModel.create)
   ↓
8. Model saves to database
   ↓
9. Model returns user object
   ↓
10. Controller calls helper (JWT.sign) to create token
   ↓
11. Controller returns { user, token }
   ↓
12. Route sends response to client
```

**Document:**
- Flow name (e.g., "User Registration")
- Step-by-step breakdown
- Which components involved
- Which external dependencies called

---

## Step 3: Identify Dependencies

**Goal:** Document what this module depends on.

### Internal Dependencies (Component → Component)
```
authController → authHelper (calls hashPassword, comparePassword)
authController → userModel (calls create, findOne, updateOne)
routes/authRoutes → authController (calls register, login, logout)
```

### External Dependencies (Using Libraries)
```
authHelper uses bcrypt (password hashing)
authHelper uses jwt (token generation)
userModel uses mongoose (database operations)
authController uses express (HTTP server)
```

Document each with:
- Why it's needed
- What's it used for
- Which components use it

---

## Step 4: Create Architecture JSON File

**File location:** `_memory-base/architecture/[module-name].json`

**Process:**

```javascript
const architecture = {
  "module": "[module-name]",
  "date": "[ISO-8601 date]",
  "author": "[name, student ID]",

  "components": [
    {
      "name": "authController",
      "type": "controller",
      "file": "controllers/authController.js",
      "purpose": "Handles authentication requests (register, login, forgot password)",
      "methods": [
        {
          "name": "registerController",
          "parameters": [
            { "name": "email", "type": "string", "description": "User email" },
            { "name": "password", "type": "string", "description": "User password" },
            { "name": "userModel", "type": "Model", "description": "User data model" }
          ],
          "returns": "{ success: boolean, user: object, token: string }",
          "calls": ["authHelper.hashPassword", "userModel.create", "JWT.sign"]
        },
        {
          "name": "loginController",
          "parameters": [
            { "name": "email", "type": "string" },
            { "name": "password", "type": "string" },
            { "name": "userModel", "type": "Model" }
          ],
          "returns": "{ success: boolean, user: object, token: string }",
          "calls": ["userModel.findOne", "authHelper.comparePassword", "JWT.sign"]
        }
      ],
      "dependencies": ["authHelper", "userModel", "jwt"]
    },

    {
      "name": "userModel",
      "type": "model",
      "file": "models/userModel.js",
      "purpose": "MongoDB schema and methods for User data",
      "schema_fields": [
        { "field": "email", "type": "String", "required": true, "validation": "must be unique" },
        { "field": "password", "type": "String", "required": true, "validation": "must be hashed" },
        { "field": "name", "type": "String", "required": true }
      ],
      "methods": ["create", "findOne", "findById", "updateOne", "deleteOne"],
      "dependencies": ["mongoose"]
    },

    {
      "name": "authHelper",
      "type": "helper",
      "file": "helpers/authHelper.js",
      "purpose": "Utility functions for password hashing and comparison",
      "functions": [
        {
          "name": "hashPassword",
          "parameters": [{ "name": "plainPassword", "type": "string" }],
          "returns": "Promise<string> (hashed password)",
          "purpose": "Hash plaintext password with bcrypt",
          "security": "Never stores plaintext; always hashes"
        },
        {
          "name": "comparePassword",
          "parameters": [
            { "name": "plainPassword", "type": "string" },
            { "name": "hashedPassword", "type": "string" }
          ],
          "returns": "Promise<boolean>",
          "purpose": "Compare plaintext password with hash",
          "security": "Uses bcrypt.compare for secure comparison"
        }
      ],
      "dependencies": ["bcrypt"]
    }
  ],

  "interactions": [
    {
      "flow": "User Registration",
      "description": "Complete flow when user submits registration form",
      "steps": [
        "1. Client POST /register with email, password",
        "2. Route handler receives request",
        "3. Controller.registerController called",
        "4. Validate email, password format",
        "5. Call authHelper.hashPassword(password)",
        "6. Call userModel.create(email, hashedPassword)",
        "7. Model saves to MongoDB",
        "8. Call JWT.sign(userObject) for token",
        "9. Return {user, token} to client"
      ],
      "components_involved": [
        "routes/authRoutes",
        "authController",
        "authHelper",
        "userModel",
        "MongoDB"
      ]
    },
    {
      "flow": "User Login",
      "description": "Complete flow when user submits login form",
      "steps": [
        "1. Client POST /login with email, password",
        "2. Controller.loginController called",
        "3. Call userModel.findOne({email})",
        "4. Call authHelper.comparePassword(input, stored)",
        "5. If match, call JWT.sign(userObject)",
        "6. Return {user, token}"
      ],
      "components_involved": ["authController", "authHelper", "userModel"]
    }
  ],

  "dependencies_external": [
    {
      "library": "bcrypt",
      "version": "^5.1.1",
      "used_for": "Password hashing and comparison",
      "components_using": ["authHelper"],
      "why_needed": "Security best practice for password storage"
    },
    {
      "library": "jwt (jsonwebtoken)",
      "version": "^9.0.2",
      "used_for": "Token generation for authentication",
      "components_using": ["authController"],
      "why_needed": "Secure token-based authentication"
    },
    {
      "library": "mongoose",
      "version": "^8.1.2",
      "used_for": "MongoDB data modeling and queries",
      "components_using": ["all models"],
      "why_needed": "ORM for MongoDB interactions"
    }
  ],

  "dependencies_internal": [
    {
      "from": "authController",
      "to": "authHelper",
      "method": "calls hashPassword, comparePassword"
    },
    {
      "from": "authController",
      "to": "userModel",
      "method": "calls create, findOne, updateOne"
    },
    {
      "from": "routes/authRoutes",
      "to": "authController",
      "method": "imports and calls register, login, logout"
    }
  ]
}

// Write to file
fs.writeFileSync(
  `_memory-base/architecture/${module}.json`,
  JSON.stringify(architecture, null, 2)
);
```

---

## Step 5: Implementation Checklist

- [ ] All major controllers analyzed
- [ ] All models analyzed and documented
- [ ] All helpers documented
- [ ] All routes mapped
- [ ] At least 3 key interaction flows documented
- [ ] All internal dependencies identified
- [ ] All external dependencies listed
- [ ] File paths match actual codebase
- [ ] Method signatures accurate
- [ ] JSON file created at correct location
- [ ] JSON valid (no syntax errors)
- [ ] Documentation is referenceable

---

## Output

**Created:** `_memory-base/architecture/[module-name].json`

**Contains:**
- All components (controllers, models, helpers, routes)
- Component purposes and methods
- All internal dependencies (component → component)
- All external dependencies (libraries used)
- Key interaction flows (step-by-step)

This JSON can be referenced by future agents in their planning phases.
