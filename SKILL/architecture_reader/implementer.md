# Architecture Reader Implementer

**Read source code and document architecture in `_memory/[module].md`.**

---

## Step 1: Read Source Files

For the target module, read:
- Controller files → document methods, parameters, return values
- Model files → document schema fields, validations, methods
- Helper files → document functions, inputs, outputs
- Route files → document endpoints, HTTP methods, middleware

## Step 2: Trace Key Flows

Pick 2-3 key user flows and trace them through the code:

```
Example: User Registration
1. POST /register → routes/authRoutes.js
2. → authController.registerController(req, res)
3. → authHelper.hashPassword(password)
4. → userModel.create({ email, hashedPassword })
5. → JWT.sign(user) → return { user, token }
```

## Step 3: Write to Memory

**Create/update:** `_memory/[module-name].md`

Write the **Architecture** section:

```markdown
## Architecture

### Components
- **authController** (`controllers/authController.js`)
  - registerController(req, res) — handles registration
  - loginController(req, res) — handles login
  - forgotPasswordController(req, res) — handles password reset

- **userModel** (`models/userModel.js`)
  - Fields: email (String, required, unique), password (String, required), name (String)
  - Methods: create, findOne, findById, updateOne

- **authHelper** (`helpers/authHelper.js`)
  - hashPassword(password) → hashed string (uses bcrypt)
  - comparePassword(plain, hashed) → boolean

### Key Interactions
- authController → authHelper (password hashing/comparison)
- authController → userModel (CRUD operations)
- authRoutes → authMiddleware → authController

### External Dependencies
- bcrypt: password hashing (security-critical, always test with REAL)
- jsonwebtoken: token generation
- mongoose: database operations

### Key Flows
1. **Registration:** POST /register → validate → hash password → save user → generate token → return
2. **Login:** POST /login → find user → compare password → generate token → return
3. **Forgot Password:** POST /forgot → verify answer → hash new password → update user
```

---

## Checklist

- [ ] All major components documented (controllers, models, helpers)
- [ ] File paths match actual codebase
- [ ] Key methods listed with what they do
- [ ] Dependencies documented (internal + external)
- [ ] 2-3 key flows traced through code
- [ ] Written to `_memory/[module].md`
- [ ] Ready for Reviewer
