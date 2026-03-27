# Integration Test Planner

**Plan tests for components working together** - controllers + models + database, APIs and services, etc.

## What Are Integration Tests?

Integration tests verify that **multiple components work together correctly**:
- Controller + Model + Database
- Service + Repository + Database
- Frontend component + API call + State management
- External API client + Your service

NOT testing just one component in isolation (that's unit tests).

## Planning Checklist

### 1. Identify Components to Test Together

**What questions to ask:**
- Which 2+ components need to work together?
- What's the "contract" between them? (data flow, API calls, etc.)
- Which one fails first if there's a bug?

**Examples (by project type):**

*Backend/API:*
- Controller calls Model methods? → Test together
- Service calls Repository then Database? → Test together
- API endpoint involves Auth + DB? → Test together

*Frontend:*
- Component calls API and updates state? → Test together
- Form component calls onSubmit handler then shows result? → Test together

*Full Stack:*
- Frontend form → Backend API → Database? → Test together

### 2. Define Test Scenarios

For each integration point, define:

- [ ] **Happy Path** (everything works)
  - Example: "User submits valid form → API processes → database saves → response returns"
  - Assertion: Response is success, data is in database

- [ ] **Error Cases** (something fails)
  - Example: "User submits form with duplicate email → API rejects → database unchanged"
  - Assertion: Error response, no record created

- [ ] **Edge Cases** (boundary conditions)
  - Example: "Submit form with max-length input → processes correctly"
  - Assertion: Data stored correctly, no truncation errors

- [ ] **State Verification** (system state after operation)
  - Example: "After creating item, fetching it returns same data"
  - Assertion: Both operations agree on data

### 3. Choose What to Mock vs Real

**Keep REAL:**
- ✅ Your application code (models, controllers, services)
- ✅ Your database (use in-memory or test instance)
- ✅ Real authentication/hashing if security matters
- ✅ Real data transformations

**Mock when NECESSARY:**
- ❌ External APIs (payment processors, 3rd party services)
- ❌ Slow operations (email, notifications)
- ❌ Non-deterministic systems (random.org, weather APIs)
- ❌ Long-running operations (video processing)

**DON'T mock just for convenience** - defeats purpose of integration test!

### 4. Database Setup Strategy

**Choose your approach:**

**Option A: In-Memory Database** (Recommended)
- What: Use in-memory DB for tests (MongoDB-memory-server, H2, SQLite)
- Pro: Fast, isolated, clean between tests
- Con: Might behave slightly differently than prod DB
- Example: mongodb-memory-server for Node.js projects

**Option B: Test Container**
- What: Spin up real DB in Docker for each test suite
- Pro: Uses exact same DB as production
- Con: Slower, requires Docker
- Example: testcontainers for Java/Python projects

**Option C: Test Database**
- What: Real database, clean between test runs
- Pro: Real behavior
- Con: Requires cleanup, slower, harder to parallelize

**Option D: Mock Database** (Least recommended for integration)
- What: Mock the DB layer entirely
- Pro: Fast
- Con: Not really testing integration

### 5. Test Data Approach

**Define for each test:**

- [ ] **Setup:** What test data do you need?
  - Example: "Create test user, create test product, create test order"

- [ ] **Isolation:** Does each test get fresh data?
  - Example: Drop database before each test, or use transactions

- [ ] **Teardown:** How to clean up?
  - Example: Delete created records, drop test database

**Example Test Data Pattern:**
```
Before each test:
  1. Start in-memory database
  2. Create test users with known data
  3. Create test products

Run test:
  1. Execute integration
  2. Verify response
  3. Verify database state

After each test:
  1. Clean up created records
  2. Stop database
```

### 6. Define Assertions (What to Check)

**Check 2 things:**

1. **Response/Output** - What does the integration return?
   - Example: "API returns status 200 and success message"
   - Check: response code, response body, response structure

2. **Side Effects** - What changed in the system?
   - Example: "Data actually saved to database"
   - Check: database query, file system, external service calls

**Example:**
```
Test: Create new user
Response check: expect(result.success).toBe(true)
                expect(result.id).toBeDefined()
Database check: const user = await db.findOne({ email: test@example.com })
                expect(user.email).toBe(test@example.com)
                expect(user.password).not.toBe(plainPassword) // hashed
```

### 7. Choose Test Framework/Tools

**This depends on your project:**

| Tech Stack | Integration Test Tool |
|---|---|
| Node.js Backend | Jest + SuperTest + mongodb-memory-server |
| Java Backend | JUnit + Mockito + TestContainers |
| Python Backend | pytest + pytest-fixtures + testcontainers |
| Python + PostgreSQL | pytest-postgresql |
| .NET Backend | xUnit + Testcontainers |
| Frontend + Backend | Cypress or Playwright + API mocking |

**Add to PROJECT_SETUP.md:** Which tools for your project?

### 8. Define Test File Naming & Location

**Pattern:**
```
Module: [Feature Name]
Integration tests file: tests/integration/[feature]-flow.integration.test.js
OR: tests/integration/[feature]-controller-db.integration.test.js

Examples:
- tests/integration/auth-flow.integration.test.js
- tests/integration/payment-flow.integration.test.js
- tests/integration/user-profile-flow.integration.test.js
```

### 9. Success Criteria

- [ ] **All integration points covered** - At least one test per interaction
- [ ] **Setup/Execution/Assertion present** - Each test has all 3 parts
- [ ] **Real components** - Not mocking your own code
- [ ] **Database verified** - Not just checking responses
- [ ] **Independent tests** - Can run in any order
- [ ] **Follows project style** - Matches other tests in codebase
- [ ] **Meets coverage targets** - Aligns with PROJECT_STANDARDS.md

---

## Output Format for Planner

When planning is complete, document:

1. **Module Name:** What feature?
2. **Components to integrate:** List what works together
3. **Test scenarios:** Happy path, errors, edge cases, state checks
4. **Database strategy:** Which approach? How to setup/teardown?
5. **Mocking strategy:** What stays mocked, what's real?
6. **Test file location:** Where will this live?
7. **Success criteria:** What does "done" look like?
8. **Ready for Implementer:** Clear handoff

---

## Real-World Example (Template for Your Project)

**Module:** User Authentication
**Components:** AuthController → UserModel → Database + Bcrypt Helper

**Scenario 1 - Happy Path:**
```
Test: Register new user with valid data
Setup: Clean database, prepare test user data
Execute: Call authController.register() with valid email/password
Assert Response: success=true, no errors
Assert Database: User exists in DB with email, password is hashed (not plaintext)
```

**Scenario 2 - Error Case:**
```
Test: Reject duplicate email registration
Setup: Create existing user with email test@example.com
Execute: Try to register another user with same email
Assert Response: success=false, error="Email already exists"
Assert Database: Still only one user with that email
```

**Scenario 3 - State Verification:**
```
Test: After registration, login works
Setup: Register user with known credentials
Execute: Call loginController with registered email/password
Assert Response: JWT token returned
Assert: Token is valid and matches registered user
```

---

## Tips for Writing Good Integration Tests

1. **Test the happy path first** - Make sure it works
2. **Then error cases** - What breaks?
3. **Then edge cases** - Boundaries and limits
4. **Make test names describe the scenario**, not implementation
5. **Use realistic test data** (not just "test123")
6. **Verify actual database state**, not just responses
7. **Keep tests independent** - One test shouldn't affect another
8. **Document WHY** you're testing this integration

---

## References

- See `reference/best_practices.md` - General testing principles
- See `reference/testing_frameworks.md` - Tools by language/framework
- Study existing integration tests in your project for patterns

