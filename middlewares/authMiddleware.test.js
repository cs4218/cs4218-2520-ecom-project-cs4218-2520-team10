/**
 * Unit Tests: authMiddleware
 *
 * Units Under Test:
 *   1. requireSignIn (authMiddleware.js:5-16)
 *   2. isAdmin (authMiddleware.js:19-38)
 *
 * Test Doubles:
 *   - JWT.verify: Stub (returns decoded token or throws)
 *   - userModel.findById: Stub (returns user object or throws)
 *   - req/res/next: Fakes/Mocks
 *
 * Techniques: EP, BVA, Error Guessing, Decision Table, Side Effects, Security
 */

import { requireSignIn, isAdmin } from './authMiddleware.js';
import JWT from 'jsonwebtoken';
import userModel from '../models/userModel.js';

jest.mock('jsonwebtoken');
jest.mock('../models/userModel.js');

describe('authMiddleware', () => {

  // Helper functions for creating test doubles
  const createMockReq = (overrides = {}) => ({
    headers: {},
    user: undefined,
    ...overrides
  });

  const createMockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
  });

  // ═══════════════════════════════════════════════════
  // UNIT 1: requireSignIn
  // ═══════════════════════════════════════════════════

  describe('requireSignIn', () => {

    describe('Happy Path', () => {

      test('test_requireSignIn_validToken_setsReqUserAndCallsNext', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'valid-jwt-token' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const decodedToken = {
          _id: 'user123',
          iat: 1234567890,
          exp: 1234567890 + 604800
        };
        JWT.verify.mockReturnValue(decodedToken);

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(req.user).toEqual(decodedToken);
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Validation — Missing/Invalid Token (EP)', () => {

      test('test_requireSignIn_missingAuthorizationHeader_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq(); // No authorization header
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          throw new Error('jwt must be provided');
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_requireSignIn_undefinedAuthorizationHeader_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: undefined }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          throw new Error('jwt must be provided');
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_requireSignIn_nullAuthorizationHeader_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: null }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          throw new Error('jwt must be provided');
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_requireSignIn_emptyStringAuthorization_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: '' }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          throw new Error('jwt must be provided');
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling — JWT Failures', () => {

      test('test_requireSignIn_malformedToken_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'malformed.token.here' }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          throw new Error('jwt malformed');
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_requireSignIn_expiredToken_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'expired.jwt.token' }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          const error = new Error('jwt expired');
          error.name = 'TokenExpiredError';
          throw error;
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_requireSignIn_invalidSignature_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'token.with.invalid.signature' }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          const error = new Error('invalid signature');
          error.name = 'JsonWebTokenError';
          throw error;
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_requireSignIn_wrongAlgorithm_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'token.with.wrong.algorithm' }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          const error = new Error('invalid algorithm');
          error.name = 'JsonWebTokenError';
          throw error;
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_requireSignIn_genericJWTError_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'some.jwt.token' }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          throw new Error('Unexpected JWT error');
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid or expired token"
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Side Effects', () => {

      test('test_requireSignIn_validToken_callsJWTVerifyWithCorrectArgs', async () => {
        // ── ARRANGE ──
        const token = 'valid-jwt-token';
        const req = createMockReq({
          headers: { authorization: token }
        });
        const res = createMockRes();
        const next = jest.fn();

        const decodedToken = { _id: 'user123', iat: 1234567890, exp: 1234567890 + 604800 };
        JWT.verify.mockReturnValue(decodedToken);

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(JWT.verify).toHaveBeenCalledWith(token, 'test-secret-key');
        expect(JWT.verify).toHaveBeenCalledTimes(1);
      });

      test('test_requireSignIn_validToken_setsReqUserToDecodedPayload', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'valid-jwt-token' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const decodedToken = {
          _id: 'user-abc-123',
          iat: 1234567890,
          exp: 1234567890 + 604800
        };
        JWT.verify.mockReturnValue(decodedToken);

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(req.user).toEqual(decodedToken);
        expect(req.user._id).toBe('user-abc-123');
      });

      test('test_requireSignIn_validToken_callsNextOnce', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'valid-jwt-token' }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockReturnValue({ _id: 'user123', iat: 1234567890, exp: 1234567890 + 604800 });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });

      test('test_requireSignIn_invalidToken_doesNotCallNext', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'invalid-token' }
        });
        const res = createMockRes();
        const next = jest.fn();

        JWT.verify.mockImplementation(() => {
          throw new Error('invalid token');
        });

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Security Invariants', () => {

      test('test_requireSignIn_decodedTokenStructure_hasExpectedFields', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          headers: { authorization: 'valid-jwt-token' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const decodedToken = {
          _id: 'user123',
          iat: 1234567890,
          exp: 1234567890 + 604800
        };
        JWT.verify.mockReturnValue(decodedToken);

        // ── ACT ──
        await requireSignIn(req, res, next);

        // ── ASSERT ──
        expect(req.user).toHaveProperty('_id');
        expect(req.user).toHaveProperty('iat');
        expect(req.user).toHaveProperty('exp');
        expect(typeof req.user._id).toBe('string');
        expect(typeof req.user.iat).toBe('number');
        expect(typeof req.user.exp).toBe('number');
      });
    });
  });

  // ═══════════════════════════════════════════════════
  // UNIT 2: isAdmin
  // ═══════════════════════════════════════════════════

  describe('isAdmin', () => {

    describe('Happy Path', () => {

      test('test_isAdmin_userIsAdmin_callsNext', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'admin123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const adminUser = {
          _id: 'admin123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 1
        };
        userModel.findById.mockResolvedValue(adminUser);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
      });
    });

    describe('Authorization — Role Boundaries (EP + BVA)', () => {

      test('test_isAdmin_userRoleIsZero_returns401UnauthorizedAccess', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const regularUser = {
          _id: 'user123',
          name: 'Regular User',
          email: 'user@example.com',
          role: 0
        };
        userModel.findById.mockResolvedValue(regularUser);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "UnAuthorized Access"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_isAdmin_userRoleIsTwo_returns401UnauthorizedAccess', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const userWithRoleTwo = {
          _id: 'user123',
          name: 'User',
          email: 'user@example.com',
          role: 2
        };
        userModel.findById.mockResolvedValue(userWithRoleTwo);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "UnAuthorized Access"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_isAdmin_userRoleIsNegativeOne_returns401UnauthorizedAccess', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const userWithNegativeRole = {
          _id: 'user123',
          name: 'User',
          email: 'user@example.com',
          role: -1
        };
        userModel.findById.mockResolvedValue(userWithNegativeRole);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "UnAuthorized Access"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_isAdmin_userRoleIsUndefined_returns401UnauthorizedAccess', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const userWithUndefinedRole = {
          _id: 'user123',
          name: 'User',
          email: 'user@example.com',
          role: undefined
        };
        userModel.findById.mockResolvedValue(userWithUndefinedRole);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "UnAuthorized Access"
        });
        expect(next).not.toHaveBeenCalled();
      });

      test('test_isAdmin_userRoleIsNull_returns401UnauthorizedAccess', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const userWithNullRole = {
          _id: 'user123',
          name: 'User',
          email: 'user@example.com',
          role: null
        };
        userModel.findById.mockResolvedValue(userWithNullRole);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "UnAuthorized Access"
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Validation — Missing req.user._id', () => {

      test('test_isAdmin_reqUserIdIsUndefined_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: undefined }
        });
        const res = createMockRes();
        const next = jest.fn();

        userModel.findById.mockRejectedValue(new Error('User ID is required'));

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error in admin middleware"
          })
        );
        expect(next).not.toHaveBeenCalled();
      });

      test('test_isAdmin_reqUserIdIsNull_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: null }
        });
        const res = createMockRes();
        const next = jest.fn();

        userModel.findById.mockRejectedValue(new Error('User ID is required'));

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error in admin middleware"
          })
        );
        expect(next).not.toHaveBeenCalled();
      });

      test('test_isAdmin_reqUserMissing_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq(); // No user property at all
        const res = createMockRes();
        const next = jest.fn();

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error in admin middleware"
          })
        );
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Error Handling — Database Failures', () => {

      test('test_isAdmin_findByIdReturnsNull_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'deleted-user-123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        userModel.findById.mockResolvedValue(null);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error in admin middleware"
          })
        );
        expect(next).not.toHaveBeenCalled();
      });

      test('test_isAdmin_databaseError_returns401Error', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const dbError = new Error('Database connection failed');
        userModel.findById.mockRejectedValue(dbError);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: dbError,
          message: "Error in admin middleware"
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Side Effects', () => {

      test('test_isAdmin_validAdmin_callsFindByIdWithCorrectId', async () => {
        // ── ARRANGE ──
        const userId = 'admin-xyz-789';
        const req = createMockReq({
          user: { _id: userId }
        });
        const res = createMockRes();
        const next = jest.fn();

        const adminUser = {
          _id: userId,
          name: 'Admin',
          email: 'admin@example.com',
          role: 1
        };
        userModel.findById.mockResolvedValue(adminUser);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(userModel.findById).toHaveBeenCalledWith(userId);
        expect(userModel.findById).toHaveBeenCalledTimes(1);
      });

      test('test_isAdmin_validAdmin_callsNextOnce', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'admin123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        userModel.findById.mockResolvedValue({ role: 1 });

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
      });

      test('test_isAdmin_nonAdmin_doesNotCallNext', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        userModel.findById.mockResolvedValue({ role: 0 });

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(next).not.toHaveBeenCalled();
      });

      test('test_isAdmin_databaseError_doesNotCallNext', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        userModel.findById.mockRejectedValue(new Error('DB error'));

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(next).not.toHaveBeenCalled();
      });
    });

    describe('Security Invariants', () => {

      test('test_isAdmin_nonAdminResponse_hasCorrectStructure', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        userModel.findById.mockResolvedValue({ role: 0 });

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "UnAuthorized Access"
        });
        const responseData = res.send.mock.calls[0][0];
        expect(responseData).toHaveProperty('success', false);
        expect(responseData).toHaveProperty('message', "UnAuthorized Access");
      });

      test('test_isAdmin_errorResponse_hasCorrectStructure', async () => {
        // ── ARRANGE ──
        const req = createMockReq({
          user: { _id: 'user123' }
        });
        const res = createMockRes();
        const next = jest.fn();

        const dbError = new Error('Database error');
        userModel.findById.mockRejectedValue(dbError);

        // ── ACT ──
        await isAdmin(req, res, next);

        // ── ASSERT ──
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: dbError,
          message: "Error in admin middleware"
        });
        const responseData = res.send.mock.calls[0][0];
        expect(responseData).toHaveProperty('success', false);
        expect(responseData).toHaveProperty('error');
        expect(responseData).toHaveProperty('message', "Error in admin middleware");
      });
    });
  });
});
