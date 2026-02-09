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

import { registerController } from './authController.js';
import userModel from '../models/userModel.js';
import { hashPassword } from '../helpers/authHelper.js';

// Mock dependencies
jest.mock('../models/userModel.js');
jest.mock('../helpers/authHelper.js');

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
    test('test_registerController_validData_returns201AndUser', async () => {
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

    test('test_registerController_allFieldsPresent_userSavedWithAllFields', async () => {
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

  describe('Validation — Required Fields (EP + BVA)', () => {
    // "name" field: FULLY TESTED representative (all falsy variants)
    test('test_registerController_missingName_returnsNameRequiredError', async () => {
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

    test('test_registerController_emptyName_returnsNameRequiredError', async () => {
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

    test('test_registerController_nullName_returnsNameRequiredError', async () => {
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
    test('test_registerController_missingEmail_returnsEmailRequiredError', async () => {
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

    test('test_registerController_missingPassword_returnsPasswordRequiredError', async () => {
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

    test('test_registerController_missingPhone_returnsPhoneRequiredError', async () => {
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

    test('test_registerController_missingAddress_returnsAddressRequiredError', async () => {
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

    test('test_registerController_missingAnswer_returnsAnswerRequiredError', async () => {
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

    // BVA: Empty object for address (distinct behavior - {} is truthy, passes validation)
    test('test_registerController_emptyObjectAddress_passesValidation', async () => {
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
  // DUPLICATE EMAIL TEST
  // ═══════════════════════════════════════════════════════════

  describe('Duplicate Email Check', () => {
    test('test_registerController_existingEmail_returns200WithFailure', async () => {
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
  });

  // ═══════════════════════════════════════════════════════════
  // ERROR HANDLING TESTS
  // ═══════════════════════════════════════════════════════════

  describe('Error Handling', () => {
    test('test_registerController_findOneThrowsError_returns500', async () => {
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

    test('test_registerController_hashPasswordThrowsError_returns500', async () => {
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

    test('test_registerController_saveThrowsError_returns500', async () => {
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
    test('test_registerController_validData_storesHashedPasswordNotRaw', async () => {
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
    test('test_registerController_missingName_doesNotCallFindOne', async () => {
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

    test('test_registerController_duplicateEmail_doesNotCallHashPassword', async () => {
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

    test('test_registerController_hashFails_doesNotCallSave', async () => {
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

    test('test_registerController_validData_callsFindOneWithCorrectEmail', async () => {
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

    test('test_registerController_validData_callsHashPasswordWithRawPassword', async () => {
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

    test('test_registerController_validData_savesUserToDatabase', async () => {
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
