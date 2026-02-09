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

import { forgotPasswordController } from './authController.js';
import userModel from '../models/userModel.js';
import { hashPassword } from '../helpers/authHelper.js';

// Mock dependencies
jest.mock('../models/userModel.js');
jest.mock('../helpers/authHelper.js');

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
    test('test_forgotPasswordController_validCredentials_returns200Success', async () => {
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

  describe('Input Validation', () => {
    test('test_forgotPasswordController_missingEmail_returns400', async () => {
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

    test('test_forgotPasswordController_missingAnswer_returns400', async () => {
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

    test('test_forgotPasswordController_missingNewPassword_returns400', async () => {
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

    test('test_forgotPasswordController_allFieldsMissing_returns400', async () => {
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

    test('test_forgotPasswordController_emptyEmail_returns400', async () => {
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

    test('test_forgotPasswordController_nullEmail_returns400', async () => {
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

    test('test_forgotPasswordController_userNotFound_returns404', async () => {
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
    test('test_forgotPasswordController_findOneThrowsError_returns500', async () => {
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

    test('test_forgotPasswordController_hashPasswordThrowsError_returns500', async () => {
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

    test('test_forgotPasswordController_findByIdAndUpdateThrowsError_returns500', async () => {
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
    test('test_forgotPasswordController_validInput_callsFindOneWithEmailAndAnswer', async () => {
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

    test('test_forgotPasswordController_validInput_callsHashPasswordWithNewPassword', async () => {
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

    test('test_forgotPasswordController_success_callsFindByIdAndUpdateWithHashedPassword', async () => {
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

    test('test_forgotPasswordController_missingEmail_doesNotCallFindOne', async () => {
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

    test('test_forgotPasswordController_userNotFound_doesNotCallHashPassword', async () => {
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

    test('test_forgotPasswordController_userNotFound_doesNotCallFindByIdAndUpdate', async () => {
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

    test('test_forgotPasswordController_nonexistentEmail_returns404WithGenericMessage', async () => {
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

    test('test_forgotPasswordController_wrongAnswer_returnsSameMessageAsWrongEmail', async () => {
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
