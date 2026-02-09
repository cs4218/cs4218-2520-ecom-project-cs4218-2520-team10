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
  // VALIDATION TESTS (EQUIVALENCE PARTITIONING)
  // ═══════════════════════════════════════════════════════════

  describe('Validation - Missing Required Fields (EP)', () => {
    test('test_registerController_missingName_returnsNameRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
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
  });

  // ═══════════════════════════════════════════════════════════
  // BOUNDARY VALUE ANALYSIS TESTS
  // ═══════════════════════════════════════════════════════════

  describe('Boundary Value Analysis - Empty Strings', () => {
    test('test_registerController_emptyName_returnsNameRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: '',                   // BVA: empty string (exact boundary between valid/invalid, evaluates to falsy)
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
      // Observable behavior: Validation error message returned
      expect(res.send).toHaveBeenCalledWith({
        message: 'Name is Required',
      });
    });

    test('test_registerController_emptyEmail_returnsEmailRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: '',
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
    });

    test('test_registerController_emptyPassword_returnsPasswordRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: '',
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
    });

    test('test_registerController_emptyPhone_returnsPhoneRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
        phone: '',
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
    });

    test('test_registerController_emptyAnswer_returnsAnswerRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: '',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Answer is Required',
      });
    });

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
  // NEGATIVE INPUT TESTS (NULL VALUES)
  // ═══════════════════════════════════════════════════════════

  describe('Negative Inputs - Null Values', () => {
    test('test_registerController_nullName_returnsNameRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: null,               // EP: invalid partition (null is falsy, fails validation)
                                  // WHY: Test explicit null vs undefined to ensure both handled
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
      // Observable behavior: Validation rejects null values
      expect(res.send).toHaveBeenCalledWith({
        message: 'Name is Required',
      });
    });

    test('test_registerController_nullEmail_returnsEmailRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: null,
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
    });

    test('test_registerController_nullPassword_returnsPasswordRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: null,
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
    });

    test('test_registerController_nullPhone_returnsPhoneRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
        phone: null,
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
    });

    test('test_registerController_nullAddress_returnsAddressRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        address: null,
        answer: 'Blue',
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Address is Required',
      });
    });

    test('test_registerController_nullAnswer_returnsAnswerRequiredError', async () => {
      // ── ARRANGE ──────────────────────────────────
      req = createMockReq({
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password',
        phone: '1234567890',
        address: { street: '123 Main' },
        answer: null,
      });
      res = createMockRes();

      // ── ACT ──────────────────────────────────────
      await registerController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith({
        message: 'Answer is Required',
      });
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
  // INTEGRATION TESTS - CRITICAL SIDE EFFECTS
  // ═══════════════════════════════════════════════════════════
  // These tests verify important integration points with external dependencies.
  // They focus on WHAT parameters are passed, not HOW MANY TIMES or WHEN.

  describe('Integration - Critical Side Effects', () => {
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
