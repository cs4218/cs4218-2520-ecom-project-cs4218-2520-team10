/**
 * Unit Tests: registerController
 *
 * Unit Under Test: registerController (authController.js:7-63)
 *   - Validates user registration data (6 required fields)
 *   - Checks for duplicate email addresses
 *   - Hashes passwords before storage
 *   - Saves new user to database
 *
 * Test Doubles:
 *   - userModel.findOne: Stub (returns existing user or null)
 *   - userModel (constructor): Stub (returns mock user with save method)
 *   - hashPassword: Stub (returns hashed password string)
 *   - req/res: Fakes (simple objects mimicking Express request/response)
 *
 * Techniques Applied:
 *   - Equivalence Partitioning (EP): Missing vs. present fields, null vs. defined
 *   - Boundary Value Analysis (BVA): Empty strings (exact boundary of falsy)
 *   - Error Guessing: Database failures, hashing failures, save failures
 *   - Positive Testing: Happy path with valid data
 *   - Negative Testing: Invalid inputs and error conditions
 *
 * Scenario Plan:
 * #  | Category    | Technique | Scenario                        | Expected
 * 1  | Happy       | —         | all valid fields                | 201 + user
 * 2  | Happy       | —         | all fields with full address    | 201 + all fields saved
 * 3  | Validation  | EP+BVA    | name: missing / empty / null    | "Name is Required" (full)
 * 4  | Validation  | EP        | email: missing                  | "Email is Required"
 * 5  | Validation  | EP        | password: missing               | "Password is Required"
 * 6  | Validation  | EP        | phone: missing                  | "Phone no is Required"
 * 7  | Validation  | EP        | address: missing                | "Address is Required"
 * 8  | Validation  | EP        | answer: missing                 | "Answer is Required"
 * 9  | Boundary    | BVA       | address: {} (empty object)      | 201 (truthy, passes)
 * 10 | Duplicate   | —         | existing email                  | 200 + "Already Register"
 * 11 | Error       | —         | findOne throws                  | 500
 * 12 | Error       | —         | hashPassword throws             | 500
 * 13 | Error       | —         | save throws                     | 500
 * 14 | Side Effect | —         | validation fail → findOne skip  | findOne NOT called
 * 15 | Side Effect | —         | duplicate → hash skip           | hashPassword NOT called
 * 16 | Side Effect | —         | hash fail → save skip           | save() NOT called
 * 17 | Side Effect | —         | valid → findOne called w/ email | findOne({email})
 * 18 | Side Effect | —         | valid → hashPassword called     | hashPassword(raw)
 * 19 | Side Effect | —         | valid → save called             | save() invoked
 * 20 | Security    | —         | response contains hashed pw     | NOT raw password
 *
 * @see ../controllers/authController.js
 */

/**
 * Test Suite: forgotPasswordController
 *
 * Purpose: Validates password reset functionality including input validation,
 * user lookup, password hashing, and database updates.
 *
 * Testing Techniques Applied:
 * - Equivalence Partitioning (EP): Valid/invalid input partitions
 * - Boundary Value Analysis (BVA): Empty strings, null, undefined
 * - Decision Table Testing: All condition combinations
 * - Error Guessing: Database failures, hash failures
 * - State Transition Testing: Validation → Lookup → Hash → Update flow
 * - Communication-Based Testing: Side effect verification
 * - Security Testing: User enumeration vulnerability documentation
 *
 * @see authController.js:forgotPasswordController (lines 120-155)
 *
 * Decision Table - forgotPasswordController flow:
 * |         | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
 * |---------|--------|--------|--------|--------|
 * | C1: input valid?     | N      | Y      | Y      | Y      |
 * | C2: user found?      | -      | N      | Y      | Y      |
 * | C3: hash success?    | -      | -      | N      | Y      |
 * |---------|--------|--------|--------|--------|
 * | A1: 400 validation   | X      |        |        |        |
 * | A2: 404 not found    |        | X      |        |        |
 * | A3: 500 hash error   |        |        | X      |        |
 * | A4: 200 success      |        |        |        | X      |
 */

/**
 * Unit Tests for loginController
 *
 * Tests authentication logic including:
 * - Input validation (email, password presence)
 * - User lookup and authentication
 * - Password comparison
 * - JWT token generation
 * - Error handling for all failure paths
 * - Response structure and status codes
 *
 * Coverage Target: 100% (lines + functions)
 * Test Strategy: Output-based + Communication-based testing
 *
 * Test Doubles Used:
 * - userModel.findOne:   STUB (returns controlled test data: mockUser or null)
 * - comparePassword:     STUB (returns controlled boolean: true or false)
 * - JWT.sign:            STUB (returns controlled token string)
 * - req/res:             FAKE (test doubles for Express request/response objects)
 * - console.log:         SPY (monitors error logging, no behavior change)
 *
 * Testing Techniques Applied:
 * - Equivalence Partitioning (EP): Valid/invalid input partitions
 * - Boundary Value Analysis (BVA): Empty strings, null, undefined values
 * - Decision Table Testing: Coverage of all condition combinations
 * - Error Guessing: Database failures, bcrypt errors, JWT errors
 * - State Transition Testing: Authentication flow state changes
 *
 * Scenario Plan:
 * #  | Category    | Technique | Scenario                        | Expected
 * 1  | Happy       | —         | valid email + correct password   | 200 + token + user
 * 2  | Validation  | EP+BVA    | email: missing / empty / null    | 404 (full variants)
 * 3  | Validation  | EP        | password: missing                | 404
 * 4  | Validation  | EP        | both missing                    | 404
 * 5  | Auth        | DT rule 2 | user not found                  | 404 "not registered"
 * 6  | Auth        | DT rule 3 | password mismatch               | 200 "Invalid Password"
 * 7  | Error       | —         | findOne throws                  | 500
 * 8  | Error       | —         | comparePassword throws           | 500
 * 9  | Error       | —         | JWT.sign throws                 | 500
 * 10 | Error       | —         | error → console.log called      | logs error
 * 11 | Side Effect | —         | valid → findOne({email})         | called with email
 * 12 | Side Effect | —         | valid → comparePassword(raw,hash)| correct args
 * 13 | Side Effect | —         | success → JWT.sign(userId)      | correct payload
 * 14 | Side Effect | —         | missing email → findOne skip    | NOT called
 * 15 | Side Effect | —         | not found → compare skip        | NOT called
 * 16 | Side Effect | —         | pw mismatch → JWT skip          | NOT called
 * 17 | Security    | —         | success response                | password NOT in user obj
 * 18 | Security    | —         | not found vs wrong pw messages  | document difference
 */

import { loginController } from "./authController.js";
import { registerController } from './authController.js';
import { forgotPasswordController } from './authController.js';

import JWT from "jsonwebtoken";



// ══════════════════════════════════════════════════════════════════════════════
// MOCK DECLARATIONS
// ══════════════════════════════════════════════════════════════════════════════

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE: AuthController
// ══════════════════════════════════════════════════════════════════════════════
describe("AuthController", () => {
  describe("loginController", () => {
    /**
     * Decision Table — loginController auth flow:
     *         | Rule 1 | Rule 2 | Rule 3 | Rule 4 |
     * --------|--------|--------|--------|--------|
     * C1: input valid?    |   N    |   Y    |   Y    |   Y    |
     * C2: user found?     |   -    |   N    |   Y    |   Y    |
     * C3: password match? |   -    |   -    |   N    |   Y    |
     * --------|--------|--------|--------|--------|
     * A1: 404 invalid      |   X    |        |        |        |
     * A2: 404 not registered|       |   X    |        |        |
     * A3: 200 invalid pw   |        |        |   X    |        |
     * A4: 200 success+token|        |        |        |   X    |
     */

    let req, res, mockUser, consoleLogSpy;

    // ────────────────────────────────────────────────────────────────────────────
    // SETUP & TEARDOWN
    // ────────────────────────────────────────────────────────────────────────────

    beforeEach(() => {
      // Initialize request object with empty body
      req = {
        body: {},
      };

      // Initialize response object with chainable methods
      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      // Mock user object matching userModel schema
      mockUser = {
        _id: "507f1f77bcf86cd799439011",
        name: "Test User",
        email: "test@example.com",
        phone: "1234567890",
        address: { street: "123 Test St", city: "Test City" },
        role: 0,
        password: "$2b$10$hashedPasswordExample",
      };

      // Spy on console.log for error logging verification
      consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
      // Clear all mocks to ensure test isolation
      jest.clearAllMocks();
      consoleLogSpy.mockRestore();
    });

    // ══════════════════════════════════════════════════════════════════════════════
    // HAPPY PATH TESTS (EP: Valid Partition)
    // ══════════════════════════════════════════════════════════════════════════════

    describe("Happy Path", () => {
      it("should return 200 with success message, token, and user data when credentials are valid", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // EP: Valid partition - both email and password present with valid formats
        req.body = {
          email: "test@example.com",        // EP: Valid email format
          password: "validPassword123",     // EP: Valid non-empty password
        };

        // STUB: User exists in database (successful lookup)
        userModel.findOne.mockResolvedValue(mockUser);

        // STUB: Password matches (successful authentication)
        comparePassword.mockResolvedValue(true);

        // STUB: JWT token generated successfully
        const mockToken = "mock.jwt.token.xyz";
        JWT.sign.mockResolvedValue(mockToken);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "login successfully",
          user: {
            _id: mockUser._id,
            name: mockUser.name,
            email: mockUser.email,
            phone: mockUser.phone,
            address: mockUser.address,
            role: mockUser.role,
          },
          token: mockToken,
        });
      });
    });

    // ══════════════════════════════════════════════════════════════════════════════
    // INPUT VALIDATION (EP: Invalid Partition + BVA: Null/Empty Boundaries)
    // ══════════════════════════════════════════════════════════════════════════════

    describe("Boundary Values", () => {
      it("should return 404 with invalid credentials message when email is missing", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // EP: Invalid partition - missing required field (email)
        // BVA: Undefined value (field not present in object)
        req.body = {
          password: "somePassword",  // Only password provided, email undefined
        };

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
      });

      it("should return 404 with invalid credentials message when password is missing", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // EP: Invalid partition - missing required field (password)
        // BVA: Undefined value (field not present in object)
        req.body = {
          email: "test@example.com",  // Only email provided, password undefined
        };

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
      });

      it("should return 404 with invalid credentials message when both fields are missing", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // Decision Table: email=missing AND password=missing → validation error
        // EP: Invalid partition - both required fields missing
        req.body = {};  // Both fields undefined

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
      });

      it("should return 404 with invalid credentials message when email is empty string", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // BVA: On-boundary value - empty string (length = 0, just past valid minimum)
        // EP: Invalid partition - falsy email value
        req.body = {
          email: "",                  // BVA: Boundary - empty string
          password: "validPassword",
        };

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
      });

      it("should return 404 with invalid credentials message when email is null", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // BVA: Boundary value - null (distinct from undefined and empty string)
        // EP: Invalid partition - falsy email value
        req.body = {
          email: null,                // BVA: Explicit null value
          password: "validPassword",
        };

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
      });
    });

    // ══════════════════════════════════════════════════════════════════════════════
    // ERROR HANDLING
    // ══════════════════════════════════════════════════════════════════════════════

    describe("Error Handling", () => {
      it("should return 404 with email not registered message when user is not found", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // EP: Valid input format, but user doesn't exist (negative test case)
        // State Transition: Valid input → User lookup → Not found state
        req.body = {
          email: "nonexistent@example.com",
          password: "somePassword",
        };

        // STUB: Database returns null (user not found)
        userModel.findOne.mockResolvedValue(null);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Email is not registerd", // Note: typo exists in original code
        });
      });

      it("should return 200 with invalid password message when password does not match", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // EP: Valid email, invalid password (authentication failure partition)
        // State Transition: User found → Password comparison → Mismatch state
        req.body = {
          email: "test@example.com",
          password: "wrongPassword",
        };

        userModel.findOne.mockResolvedValue(mockUser);
        // STUB: comparePassword returns false (passwords don't match)
        comparePassword.mockResolvedValue(false);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // Note: Original code returns 200 for invalid password (security issue: should be 401)
        // Test validates actual behavior, not ideal behavior
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid Password",
        });
      });

      it("should return 500 with error message when findOne throws an error", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // Error Guessing: Database failure scenario (connection loss, timeout, etc.)
        req.body = {
          email: "test@example.com",
          password: "validPassword",
        };

        // STUB: Database query throws error (simulating connection failure)
        const dbError = new Error("Database connection failed");
        userModel.findOne.mockRejectedValue(dbError);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error in login",
          error: dbError,
        });
      });

      it("should return 500 with error message when comparePassword throws an error", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // Error Guessing: Bcrypt library failure (corrupted hash, memory error, etc.)
        req.body = {
          email: "test@example.com",
          password: "validPassword",
        };

        userModel.findOne.mockResolvedValue(mockUser);
        // STUB: bcrypt comparison throws error (simulating crypto failure)
        const bcryptError = new Error("Bcrypt comparison failed");
        comparePassword.mockRejectedValue(bcryptError);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error in login",
          error: bcryptError,
        });
      });

      it("should return 500 with error message when JWT sign throws an error", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // Error Guessing: JWT generation failure (invalid secret, library error, etc.)
        req.body = {
          email: "test@example.com",
          password: "validPassword",
        };

        userModel.findOne.mockResolvedValue(mockUser);
        comparePassword.mockResolvedValue(true);
        // STUB: JWT signing throws error (simulating token generation failure)
        const jwtError = new Error("JWT signing failed");
        JWT.sign.mockRejectedValue(jwtError);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error in login",
          error: jwtError,
        });
      });

      it("should log error to console when an error occurs", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // Communication-Based Testing: Verify side effect (console.log called)
        req.body = {
          email: "test@example.com",
          password: "validPassword",
        };

        const testError = new Error("Test error for logging");
        userModel.findOne.mockRejectedValue(testError);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // SPY Assertion: Verify error was logged to console (observability requirement)
        expect(consoleLogSpy).toHaveBeenCalledWith(testError);
      });
    });

    // ══════════════════════════════════════════════════════════════════════════════
    // SIDE EFFECTS (State Transition: Communication-Based Testing)
    // ══════════════════════════════════════════════════════════════════════════════

    describe("Side Effects", () => {
      it("should call findOne with email when input is valid", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // Communication-Based Testing: Verify correct database query made
        // State Transition: Initial → Querying database
        req.body = {
          email: "test@example.com",
          password: "validPassword",
        };

        userModel.findOne.mockResolvedValue(mockUser);
        comparePassword.mockResolvedValue(true);
        JWT.sign.mockResolvedValue("mock.token");

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // MOCK Verification: userModel.findOne called with correct email parameter
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(userModel.findOne).toHaveBeenCalledTimes(1);
      });

      it("should call comparePassword with correct arguments when input is valid", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        req.body = {
          email: "test@example.com",
          password: "validPassword123",
        };

        userModel.findOne.mockResolvedValue(mockUser);
        comparePassword.mockResolvedValue(true);
        JWT.sign.mockResolvedValue("mock.token");

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // Verify comparePassword called with plaintext password and hashed password
        expect(comparePassword).toHaveBeenCalledWith(
          "validPassword123",
          mockUser.password
        );
        expect(comparePassword).toHaveBeenCalledTimes(1);
      });

      it("should call JWT sign with user ID when login is successful", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // Communication-Based Testing: Verify token generation with correct payload
        // State Transition: Authentication success → Token generation
        req.body = {
          email: "test@example.com",
          password: "validPassword",
        };

        userModel.findOne.mockResolvedValue(mockUser);
        comparePassword.mockResolvedValue(true);
        JWT.sign.mockResolvedValue("mock.token");

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // MOCK Verification: JWT.sign called with correct user ID payload and options
        expect(JWT.sign).toHaveBeenCalledWith(
          { _id: mockUser._id },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        expect(JWT.sign).toHaveBeenCalledTimes(1);
      });

      it("should not call findOne when email is missing", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // State Transition: Validation failure → Early return (no database query)
        // Communication-Based Testing: Verify database NOT queried on invalid input
        req.body = {
          password: "somePassword",  // Missing email triggers validation failure
        };

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // MOCK Verification: findOne NOT called (performance: avoid unnecessary DB call)
        expect(userModel.findOne).not.toHaveBeenCalled();
      });

      it("should not call comparePassword when user is not found", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // State Transition: User lookup → Not found → Early return (no password check)
        // Communication-Based Testing: Verify bcrypt NOT called on non-existent user
        req.body = {
          email: "nonexistent@example.com",
          password: "somePassword",
        };

        // STUB: User not found in database
        userModel.findOne.mockResolvedValue(null);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // MOCK Verification: comparePassword NOT called (security: timing attack mitigation)
        expect(comparePassword).not.toHaveBeenCalled();
      });

      it("should not call JWT sign when password does not match", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // State Transition: Password check → Mismatch → Early return (no token)
        // Communication-Based Testing: Verify JWT NOT generated on auth failure
        req.body = {
          email: "test@example.com",
          password: "wrongPassword",
        };

        userModel.findOne.mockResolvedValue(mockUser);
        // STUB: Password doesn't match
        comparePassword.mockResolvedValue(false);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // MOCK Verification: JWT.sign NOT called (security: no token on failed auth)
        expect(JWT.sign).not.toHaveBeenCalled();
      });
    });

    // ══════════════════════════════════════════════════════════════════════════════
    // SECURITY INVARIANTS
    // ══════════════════════════════════════════════════════════════════════════════

    describe("Security Invariants", () => {
      it("should exclude password from response when credentials are valid", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // Security Test: Verify sensitive data (password) is not leaked in response
        req.body = {
          email: "test@example.com",
          password: "validPassword123",
        };
        userModel.findOne.mockResolvedValue(mockUser);  // mockUser contains password field
        comparePassword.mockResolvedValue(true);
        JWT.sign.mockResolvedValue("mock.jwt.token");

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // Security Assertion: Password must not be included in response
        const sentResponse = res.send.mock.calls[0][0];
        expect(sentResponse.user).toBeDefined();
        expect(sentResponse.user.password).toBeUndefined();
      });

      it("should return different message when user is not found (documents user enumeration vulnerability)", async () => {
        // ── ARRANGE ──────────────────────────────────────────────────────────
        // Security Test: Verify error messages for "user not found" vs "wrong password"
        // NOTE: This is a KNOWN SECURITY CONCERN - Different error messages allow
        // user enumeration attacks (attacker can determine if an email exists in system).
        // IDEAL: Both cases should return identical "Invalid credentials" message.
        // ACTUAL: Current implementation returns different messages - testing actual behavior.
        req.body = {
          email: "nonexistent@example.com",
          password: "somePassword",
        };

        // STUB: User not found in database
        userModel.findOne.mockResolvedValue(null);

        // ── ACT ──────────────────────────────────────────────────────────────
        await loginController(req, res);

        // ── ASSERT ───────────────────────────────────────────────────────────
        // Document actual behavior: "Email is not registerd" leaks email existence
        // Security smell: Allows attacker to enumerate valid emails in the system
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Email is not registerd", // Leaks whether email exists (security issue)
        });
      });
    });
  });
  describe('forgotPasswordController', () => {
    let req;
    let res;
    let mockUser;

    beforeEach(() => {
      // Setup mock user object
      mockUser = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        address: { street: '123 Test St', city: 'Test City' },
        role: 0,
        password: '$2b$10$oldHashedPassword',
        answer: 'test security answer',
      };

      // Setup request and response mocks
      req = {
        body: {}
      };

      res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      };

      // Reset all mocks
      jest.clearAllMocks();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    // ============================================================================
    // HAPPY PATH (EP: Valid Partition)
    // ============================================================================

    describe('Happy Path', () => {
      it('should return 200 with success message', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        userModel.findOne.mockResolvedValue(mockUser);
        hashPassword.mockResolvedValue('$2b$10$newHashedPassword');
        userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: 'Password Reset Successfully'
        });
      });
    });

    // ============================================================================
    // INPUT VALIDATION (EP: Invalid Partition + BVA)
    // ============================================================================

    describe('Boundary Values', () => {
      it('should return 400 when email is missing', async () => {
        // Arrange
        req.body = {
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          message: 'Email is required'
        });
      });

      it('should return 400 when answer is missing', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          newPassword: 'newPassword123'
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          message: 'Answer is required'
        });
      });

      it('should return 400 when new password is missing', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'test security answer'
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          message: 'New Password is required'
        });
      });

      it('should return 400 when all fields are missing', async () => {
        // Arrange
        req.body = {};

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          message: 'Email is required'
        });
      });

      it('should return 400 when email is empty', async () => {
        // Arrange - BVA: empty string
        req.body = {
          email: '',
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          message: 'Email is required'
        });
      });

      it('should return 400 when email is null', async () => {
        // Arrange - BVA: null value
        req.body = {
          email: null,
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          message: 'Email is required'
        });
      });

      it('should return 404 when user is not found', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'wrong answer',
          newPassword: 'newPassword123'
        };

        userModel.findOne.mockResolvedValue(null);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Wrong Email Or Answer'
        });
      });
    });

    // ============================================================================
    // ERROR HANDLING (Error Guessing: Dependency Failures)
    // ============================================================================

    describe('Error Handling', () => {
      it('should return 500 when database query fails', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        const dbError = new Error('Database connection failed');
        userModel.findOne.mockRejectedValue(dbError);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Something went wrong',
          error: dbError
        });
      });

      it('should return 500 when password hashing fails', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        userModel.findOne.mockResolvedValue(mockUser);
        const hashError = new Error('Hashing failed');
        hashPassword.mockRejectedValue(hashError);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Something went wrong',
          error: hashError
        });
      });

      it('should return 500 when database update fails', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        userModel.findOne.mockResolvedValue(mockUser);
        hashPassword.mockResolvedValue('$2b$10$newHashedPassword');
        const updateError = new Error('Update failed');
        userModel.findByIdAndUpdate.mockRejectedValue(updateError);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Something went wrong',
          error: updateError
        });
      });
    });

    // ============================================================================
    // SIDE EFFECTS (Communication-Based Testing)
    // ============================================================================

    describe('Side Effects', () => {
      it('should call findOne with email and answer when input is valid', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        userModel.findOne.mockResolvedValue(mockUser);
        hashPassword.mockResolvedValue('$2b$10$newHashedPassword');
        userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({
          email: 'test@example.com',
          answer: 'test security answer'
        });
      });

      it('should call hashPassword with new password when input is valid', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        userModel.findOne.mockResolvedValue(mockUser);
        hashPassword.mockResolvedValue('$2b$10$newHashedPassword');
        userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(hashPassword).toHaveBeenCalledWith('newPassword123');
      });

      it('should call findByIdAndUpdate with hashed password on success', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        userModel.findOne.mockResolvedValue(mockUser);
        hashPassword.mockResolvedValue('$2b$10$newHashedPassword');
        userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          mockUser._id,
          { password: '$2b$10$newHashedPassword' }
        );
      });

      it('should not call findOne when email is missing', async () => {
        // Arrange
        req.body = {
          answer: 'test security answer',
          newPassword: 'newPassword123'
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(userModel.findOne).not.toHaveBeenCalled();
      });

      it('should not call hashPassword when user is not found', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'wrong answer',
          newPassword: 'newPassword123'
        };

        userModel.findOne.mockResolvedValue(null);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(hashPassword).not.toHaveBeenCalled();
      });

      it('should not call findByIdAndUpdate when user is not found', async () => {
        // Arrange
        req.body = {
          email: 'test@example.com',
          answer: 'wrong answer',
          newPassword: 'newPassword123'
        };

        userModel.findOne.mockResolvedValue(null);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
      });
    });

    // ============================================================================
    // SECURITY INVARIANTS
    // ============================================================================

    describe('Security Invariants', () => {
      /**
       * SECURITY VULNERABILITY DOCUMENTATION:
       *
       * The following tests document a user enumeration vulnerability in the current implementation.
       *
       * Issue: The error message "Wrong Email Or Answer" is returned when findOne({email, answer})
       * returns null. This could mean either:
       * 1. Email doesn't exist in the system
       * 2. Email exists but answer is wrong
       *
       * Current behavior: The compound query (email AND answer) returns the same error message
       * for both scenarios, which might seem secure. However, timing attacks or database-level
       * behavior could still leak information about which emails exist in the system.
       *
       * Recommended improvement:
       * - Check if email exists first (separate query)
       * - If email doesn't exist, return generic error
       * - If email exists but answer is wrong, return the SAME generic error
       * - Use constant-time comparison where possible
       * - Add rate limiting to prevent brute force attacks
       *
       * Example improved flow:
       * 1. const user = await userModel.findOne({ email });
       * 2. if (!user || user.answer !== answer) {
       *      return res.status(404).send({ message: "Invalid credentials" });
       *    }
       */

      it('should return 404 with generic message when email does not exist', async () => {
        // Arrange
        req.body = {
          email: 'nonexistent@example.com',
          answer: 'any answer',
          newPassword: 'newPassword123'
        };
        userModel.findOne.mockResolvedValue(null);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Wrong Email Or Answer'
        });
      });

      it('should return same message for wrong answer as wrong email', async () => {
        // Arrange - Note: Current implementation doesn't distinguish wrong answer
        req.body = {
          email: 'test@example.com',
          answer: 'wrong answer',
          newPassword: 'newPassword123'
        };
        userModel.findOne.mockResolvedValue(null);

        // Act
        await forgotPasswordController(req, res);

        // Assert - Same generic message prevents user enumeration
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: 'Wrong Email Or Answer'
        });
      });
    });
  });
  describe('registerController', () => {
    let req, res;

    // Helper function to create mock request
    const createMockReq = (body = {}) => ({ body });

    // Helper function to create mock response
    const createMockRes = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.send = jest.fn().mockReturnValue(res);
      return res;
    };

    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();

      // Setup default mock implementations
      userModel.findOne = jest.fn();
      userModel.mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue({
          _id: 'user123',
          ...data,
        }),
      }));
    });

    // ═══════════════════════════════════════════════════════════
    // HAPPY PATH TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Happy Path', () => {
      it('should return 201 with user data when all fields are valid', async () => {
      // ── ARRANGE ──────────────────────────────────
      // Positive test: All fields present in valid partition
      req = createMockReq({
        name: 'John Doe',           // EP: valid partition (non-empty string)
        email: 'john@example.com',  // EP: valid partition (non-empty string)
        password: 'password123',    // EP: valid partition (non-empty string)
        phone: '1234567890',        // EP: valid partition (non-empty string)
        address: { street: '123 Main St', city: 'New York' }, // EP: valid partition (truthy object)
        answer: 'Blue',             // EP: valid partition (non-empty string)
      });
      res = createMockRes();

      // Stub: No existing user with this email
      userModel.findOne.mockResolvedValue(null);
      // Stub: Return predetermined hash
      hashPassword.mockResolvedValue('hashedPassword123');

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      // Observable behavior: Correct HTTP status and response structure
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'User Register Successfully',
        user: expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          password: 'hashedPassword123',
          answer: 'Blue',
        }),
      });
    });

      it('should save user with all fields when all fields are present', async () => {
      // ── ARRANGE ──────────────────────────────────
      const userData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'secure123',
        phone: '9876543210',
        address: { street: '456 Oak Ave', city: 'Boston', zip: '02101' },
        answer: 'Red',
      };
      req = createMockReq(userData);
      res = createMockRes();

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedSecure123');

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          user: expect.objectContaining({
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            address: userData.address,
            answer: userData.answer,
          }),
        })
      );
      });
    });

    // ═══════════════════════════════════════════════════════════
    // VALIDATION TESTS — REQUIRED FIELDS (EP + BVA)
    // ═══════════════════════════════════════════════════════════
    // Representative testing: name field fully tested (missing/empty/null)
    // Other fields: one test each (missing) — same code path, same behavior

    describe('Equivalence Partitions', () => {
      // "name" field: FULLY TESTED representative (all falsy variants)
      it('should return name required error when name is missing', async () => {
      // ── ARRANGE ──────────────────────────────────
      // EP: invalid partition (undefined/missing field)
      req = createMockReq({
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: 'Blue',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Name is Required',
      });
      expect(res.status).not.toHaveBeenCalled();
      });

      it('should return name required error when name is empty', async () => {
      // ── ARRANGE ──────────────────────────────────
      // BVA: empty string (exact boundary between valid/invalid, evaluates to falsy)
      req = createMockReq({
        name: '',
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: 'Blue',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Name is Required',
      });
      });

      it('should return name required error when name is null', async () => {
      // ── ARRANGE ──────────────────────────────────
      // EP: invalid partition (null is falsy, fails validation)
      // WHY: Test explicit null vs undefined to ensure both handled
      req = createMockReq({
        name: null,
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: 'Blue',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Name is Required',
      });
      });

      // Remaining fields: ONE representative test each (missing/undefined)
      // WHY: Same code path (if (!field)), same behavior, redundant to test all variants
      it('should return email required error when email is missing', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        password: 'password',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: 'Blue',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Email is Required',
      });
      expect(res.status).not.toHaveBeenCalled();
      });

      it('should return password required error when password is missing', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: 'Blue',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Password is Required',
      });
      expect(res.status).not.toHaveBeenCalled();
      });

      it('should return phone required error when phone is missing', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
        address: { street: '123 Main' },
        answer: 'Blue',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Phone no is Required',
      });
      expect(res.status).not.toHaveBeenCalled();
      });

      it('should return address required error when address is missing', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        answer: 'Blue',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Address is Required',
      });
      expect(res.status).not.toHaveBeenCalled();
      });

      it('should return answer required error when answer is missing', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        address: { street: '123 Main' },
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Answer is Required',
      });
      expect(res.status).not.toHaveBeenCalled();
      });
    });

    // ═══════════════════════════════════════════════════════════
    // BOUNDARY VALUE TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Boundary Values', () => {
      // BVA: Empty object for address (distinct behavior - {} is truthy, passes validation)
      it('should pass validation when address is an empty object', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        address: {},              // BVA: empty object (boundary case - truthy but has no properties)
                                  // WHY: JavaScript {} is truthy, so validation passes
        answer: 'Blue',
      });
      res = createMockRes();

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      // Observable behavior: Empty object is accepted as valid address
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User Register Successfully',
        })
      );
      });
    });

    // ═══════════════════════════════════════════════════════════
    // ERROR HANDLING TESTS
    // ═══════════════════════════════════════════════════════════

    describe('Error Handling', () => {
      // Duplicate email check
      it('should return 200 with failure message when email already exists', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'Blue',
      });
      res = createMockRes();

      const existingUser = {
        _id: 'existingUser123',
        email: 'existing@example.com',
        name: 'Existing User',
      };
      userModel.findOne.mockResolvedValue(existingUser);

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Already Register please login',
      });
      });

      it('should return 500 when database query throws error', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'Blue',
      });
      res = createMockRes();

      const dbError = new Error('Database connection failed');
      userModel.findOne.mockRejectedValue(dbError);

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error in Registration',
        error: dbError,
      });
      });

      it('should return 500 when password hashing throws error', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'Blue',
      });
      res = createMockRes();

      userModel.findOne.mockResolvedValue(null);
      const hashError = new Error('Hashing failed');
      hashPassword.mockRejectedValue(hashError);

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error in Registration',
        error: hashError,
      });
      });

      it('should return 500 when user save operation throws error', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'Blue',
      });
      res = createMockRes();

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');

      const saveError = new Error('Save failed');
      userModel.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(saveError),
      }));

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error in Registration',
        error: saveError,
      });
      });
    });

    // ═══════════════════════════════════════════════════════════
    // SECURITY INVARIANTS
    // ═══════════════════════════════════════════════════════════
    // Verify security-critical contracts: passwords hashed, sensitive data excluded

    describe('Security Invariants', () => {
      it('should store hashed password not raw password', async () => {
      // ── ARRANGE ──────────────────────────────────
      const rawPassword = 'password123';
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: rawPassword,      // Raw password from user input
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'Blue',
      });
      res = createMockRes();

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      // Security invariant: Response contains HASHED password, NOT raw password
      // WHY: Critical security requirement - never expose or store raw passwords
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            password: 'hashedPassword123',  // Hashed version
          }),
        })
      );
      // Verify raw password is NOT in response
      expect(res.send).not.toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            password: rawPassword,  // Raw password should NOT be here
          }),
        })
      );
      });
    });

    // ═══════════════════════════════════════════════════════════
    // SIDE EFFECTS
    // ═══════════════════════════════════════════════════════════
    // Verify side effects (calls to collaborators) — both positive and negative paths:
    //   1. Early exit chain: downstream operations NOT called when early exits occur
    //   2. Success path: operations ARE called with correct parameters
    // Flow: validate fields → check duplicate email → hash password → save user

    describe('Side Effects', () => {
      it('should not call findOne when validation fails', async () => {
      // ── ARRANGE ──────────────────────────────────
      // Validation failure scenario (name missing)
      req = createMockReq({
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: 'Blue',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      // Early exit: validation fails → findOne should NOT be called
      // WHY: Optimization + correctness - no point checking DB if validation failed
      expect(userModel.findOne).not.toHaveBeenCalled();
      expect(hashPassword).not.toHaveBeenCalled();
      });

      it('should not call hashPassword when duplicate email found', async () => {
      // ── ARRANGE ──────────────────────────────────
      // Duplicate email scenario
      req = createMockReq({
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: 'Blue',
      });
      res = createMockRes();

      const existingUser = {
        _id: 'user123',
        email: 'existing@example.com',
      };
      userModel.findOne.mockResolvedValue(existingUser);

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      // Early exit: duplicate found → hashPassword should NOT be called
      // WHY: User won't be created, so no point hashing password
      expect(hashPassword).not.toHaveBeenCalled();
      });

      it('should not call save when hashing fails', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: 'Blue',
      });
      res = createMockRes();

      userModel.findOne.mockResolvedValue(null);
      const hashError = new Error('Hashing failed');
      hashPassword.mockRejectedValue(hashError);

      const saveMock = jest.fn();
      userModel.mockImplementation(() => ({
        save: saveMock,
      }));

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      // Early exit: hash fails → save should NOT be called
      // WHY: Error caught before user object creation
      expect(saveMock).not.toHaveBeenCalled();
      });

      // ────────────────────────────────────────────────────────
      // Positive path: Verify collaborators ARE called with correct arguments
      // ────────────────────────────────────────────────────────

      it('should call findOne with correct email', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',  // This specific email should be used for lookup
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'Blue',
      });
      res = createMockRes();

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      // Observable side effect: Database queried with correct email
      // WHY: Critical that duplicate check uses the exact email from request
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      });

      it('should call hashPassword with raw password', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',     // This raw password should be hashed
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'Blue',
      });
      res = createMockRes();

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      // Observable side effect: Password hashing called with raw password
      // WHY: Critical security requirement - raw password must be hashed
      expect(hashPassword).toHaveBeenCalledWith('password123');
      });

      it('should save user to database', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        address: { street: '123 Main St' },
        answer: 'Blue',
      });
      res = createMockRes();

      const saveMock = jest.fn().mockResolvedValue({
        _id: 'user123',
        name: 'John Doe',
        email: 'test@example.com',
      });

      userModel.findOne.mockResolvedValue(null);
      hashPassword.mockResolvedValue('hashedPassword123');
      userModel.mockImplementation(() => ({
        save: saveMock,
      }));

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      // Observable side effect: User persisted to database
      // WHY: Core requirement - successful registration must save user
      expect(saveMock).toHaveBeenCalled();
      });
    });
  });
});

