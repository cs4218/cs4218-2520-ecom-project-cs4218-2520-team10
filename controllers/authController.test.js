import { updateProfileController } from './authController.js';
import userModel from '../models/userModel.js';
import { hashPassword } from '../helpers/authHelper.js';

jest.mock('../models/userModel.js');
jest.mock('../helpers/authHelper.js');

/**
 * Unit Tests for updateProfileController
 *
 * Tests the profile update logic including:
 * - Authentication checks for authorized user access
 * - User existence validation
 * - Successful updates for individual fields (name, phone, address)
 * - Successful password update with hashing
 * - Successful update of multiple fields simultaneously
 * - Handling of empty request body (no updates)
 * - Equivalence Partitioning (EP) and Boundary Value Analysis (BVA) for password length validation
 * - Preservation of original data when empty/falsy values are provided for fields
 * - Comprehensive error handling for database operations and password hashing
 *
 * Coverage Target: 100% (lines + functions)
 * Test Strategy: Output-based + Communication-based testing
 *
 * Test Doubles Used:
 * - userModel.findById:          STUB (returns controlled test data: mockOriginalUser or null)
 * - userModel.findByIdAndUpdate: STUB (returns updated user data)
 * - hashPassword:                STUB (returns hashed password or throws)
 * - req/res:                     FAKE (test doubles for Express request/response objects)
 *
 * Testing Techniques Applied:
 * - Equivalence Partitioning (EP): Valid/invalid password length, valid/invalid field values
 * - Boundary Value Analysis (BVA): Password length (exact min, just below min)
 * - Negative Testing: Unauthorized access, user not found, invalid password
 * - Error Handling: Database errors, hashing errors during update
 * - Authentication Checks: Ensuring req.user is defined and has an _id
 *
 * Scenario Plan:
 * #  | Category        | Technique   | Scenario                                      | Expected
 * 1  | Authentication  | Negative    | req.user undefined                            | 401 Unauthorized
 * 2  | Authentication  | Negative    | req.user._id missing                          | 401 Unauthorized
 * 3  | User Existence  | Negative    | userModel.findById returns null               | 404 User Not Found
 * 4  | Happy Path      | EP          | update only name                              | 200 Success, name updated
 * 5  | Happy Path      | EP          | update only phone                             | 200 Success, phone updated
 * 6  | Happy Path      | EP          | update only address                           | 200 Success, address updated
 * 7  | Happy Path      | EP          | update password (valid)                       | 200 Success, password hashed and updated
 * 8  | Happy Path      | EP          | update all fields including password          | 200 Success, all fields updated
 * 9  | Happy Path      | EP          | empty req.body (no updates)                   | 200 Success, original user returned
 * 10 | Password        | BVA         | password length exactly 6 (valid)             | 200 Success, password hashed
 * 11 | Password        | BVA         | password length exactly 5 (invalid)           | 400 Bad Request, password error
 * 12 | Password        | EP          | empty string password                         | 400 Bad Request, password error
 * 13 | Password        | Negative    | invalid password, other fields valid          | 400 Bad Request, password error, no other updates
 * 14 | Falsy Values    | EP          | empty string for name                         | 200 Success, original name preserved
 * 15 | Falsy Values    | EP          | empty string for phone                        | 200 Success, original phone preserved
 * 16 | Falsy Values    | EP          | empty string for address                      | 200 Success, original address preserved
 * 17 | Falsy Values    | EP          | null values for fields                        | 200 Success, original data preserved
 * 18 | Falsy Values    | EP          | undefined values for fields                   | 200 Success, original data preserved
 * 19 | Error Handling  | Negative    | userModel.findById rejects                    | 400 Error While Updating Profile
 * 20 | Error Handling  | Negative    | hashPassword rejects                          | 400 Error While Updating Profile
 * 21 | Error Handling  | Negative    | userModel.findByIdAndUpdate rejects           | 400 Error While Updating Profile
 */
describe('updateProfileController', () => {
  let req, res;
  const mockUserId = 'user123';
  const mockOriginalUser = {
    _id: mockUserId,
    name: 'Original Name',
    phone: '1111111111',
    address: 'Original Address',
    password: 'oldHashedPassword'
  };

  beforeEach(() => {
    req = {
      body: {},
      user: { _id: mockUserId }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
    jest.clearAllMocks();
    userModel.findById.mockResolvedValue(mockOriginalUser);
    userModel.findByIdAndUpdate.mockResolvedValue({ ...mockOriginalUser }); // Return a copy for immutability
    hashPassword.mockResolvedValue('newHashedPassword');
  });

  describe('Authentication Checks', () => {
    it('should return 401 Unauthorized if req.user is undefined', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.user = undefined;

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
      expect(userModel.findById).not.toHaveBeenCalled();
    });

    it('should return 401 Unauthorized if req.user._id is missing', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.user = {};

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
      expect(userModel.findById).not.toHaveBeenCalled();
    });
  });

  describe('User Existence', () => {
    it('should return 404 User Not Found if userModel.findById returns null', async () => {
      // ── ARRANGE ──────────────────────────────────
      userModel.findById.mockResolvedValue(null);
      req.body = { name: 'New Name' };

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Happy Path', () => {
    it('should update only name field successfully', async () => {
      // ── ARRANGE ──────────────────────────────────
      const updatedName = 'Updated Name';
      req.body = { name: updatedName };
      userModel.findByIdAndUpdate.mockResolvedValue({ ...mockOriginalUser, name: updatedName });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: updatedName,
          password: mockOriginalUser.password,
          phone: mockOriginalUser.phone,
          address: mockOriginalUser.address
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Profile Updated Successfully',
        updatedUser: expect.objectContaining({ name: updatedName })
      }));
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('should update only phone field successfully', async () => {
      // ── ARRANGE ──────────────────────────────────
      const updatedPhone = '9999999999';
      req.body = { phone: updatedPhone };
      userModel.findByIdAndUpdate.mockResolvedValue({ ...mockOriginalUser, phone: updatedPhone });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: mockOriginalUser.name,
          password: mockOriginalUser.password,
          phone: updatedPhone,
          address: mockOriginalUser.address
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Profile Updated Successfully',
        updatedUser: expect.objectContaining({ phone: updatedPhone })
      }));
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('should update only address field successfully', async () => {
      // ── ARRANGE ──────────────────────────────────
      const updatedAddress = 'New Address';
      req.body = { address: updatedAddress };
      userModel.findByIdAndUpdate.mockResolvedValue({ ...mockOriginalUser, address: updatedAddress });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: mockOriginalUser.name,
          password: mockOriginalUser.password,
          phone: mockOriginalUser.phone,
          address: updatedAddress
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Profile Updated Successfully',
        updatedUser: expect.objectContaining({ address: updatedAddress })
      }));
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('should update password only when valid and hash it', async () => {
      // ── ARRANGE ──────────────────────────────────
      const newPassword = 'newvalidpassword';
      const hashedPassword = 'hashedNewValidPassword';
      req.body = { password: newPassword };
      hashPassword.mockResolvedValue(hashedPassword);
      userModel.findByIdAndUpdate.mockResolvedValue({ ...mockOriginalUser, password: hashedPassword });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(hashPassword).toHaveBeenCalledWith(newPassword);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: mockOriginalUser.name,
          password: hashedPassword,
          phone: mockOriginalUser.phone,
          address: mockOriginalUser.address
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Profile Updated Successfully',
        updatedUser: expect.objectContaining({ password: hashedPassword })
      }));
    });

    it('should update all fields including password successfully', async () => {
      // ── ARRANGE ──────────────────────────────────
      const updatedName = 'All Fields Name';
      const updatedPhone = '4444444444';
      const updatedAddress = 'All Fields Address';
      const newPassword = 'newpass123';
      const hashedPassword = 'hashedNewPass';
      req.body = {
        name: updatedName,
        phone: updatedPhone,
        address: updatedAddress,
        password: newPassword
      };
      hashPassword.mockResolvedValue(hashedPassword);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockOriginalUser,
        name: updatedName,
        phone: updatedPhone,
        address: updatedAddress,
        password: hashedPassword
      });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(hashPassword).toHaveBeenCalledWith(newPassword);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: updatedName,
          password: hashedPassword,
          phone: updatedPhone,
          address: updatedAddress
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Profile Updated Successfully',
        updatedUser: expect.objectContaining({
          name: updatedName,
          phone: updatedPhone,
          address: updatedAddress,
          password: hashedPassword
        })
      }));
    });

    it('should not update any fields if req.body is empty', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = {};
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: mockOriginalUser.name,
          password: mockOriginalUser.password,
          phone: mockOriginalUser.phone,
          address: mockOriginalUser.address
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Profile Updated Successfully',
        updatedUser: mockOriginalUser
      }));
      expect(hashPassword).not.toHaveBeenCalled();
    });
  });

  describe('EP & BVA for Password', () => {
    // BVA: Password length exactly 6 characters (valid)
    it('should accept password with exactly 6 characters', async () => {
      // ── ARRANGE ──────────────────────────────────
      const password = '123456';
      const hashedPassword = 'hashed123456';
      req.body = { password };
      hashPassword.mockResolvedValue(hashedPassword);
      userModel.findByIdAndUpdate.mockResolvedValue({ ...mockOriginalUser, password: hashedPassword });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(hashPassword).toHaveBeenCalledWith(password);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ password: hashedPassword }),
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    // BVA: Password length exactly 5 characters (invalid)
    it('should reject password with exactly 5 characters', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { password: '12345' };

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password is required and 6 character long'
      });
      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    // EP: Empty string for password (invalid)
    it('should reject empty string password', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { password: '' };

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password is required and 6 character long'
      });
      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    // EP: Password valid length with other valid fields
    it('should reject invalid password but not attempt other updates', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { name: 'New Name', phone: '9999999999', password: '123' };

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password is required and 6 character long'
      });
      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Empty/Falsy Values for Profile Fields', () => {
    it('should preserve original name when empty string provided', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { name: '' };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser); // Mock to return original user if name is falsy

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ name: mockOriginalUser.name }),
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should preserve original phone when empty string provided', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { phone: '' };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ phone: mockOriginalUser.phone }),
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should preserve original address when empty string provided', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { address: '' };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({ address: mockOriginalUser.address }),
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should preserve original data when null values are provided for fields', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { name: null, phone: null, address: null };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: mockOriginalUser.name,
          password: mockOriginalUser.password,
          phone: mockOriginalUser.phone,
          address: mockOriginalUser.address
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should preserve original data when undefined values are provided for fields', async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { name: undefined, phone: undefined, address: undefined };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockUserId,
        {
          name: mockOriginalUser.name,
          password: mockOriginalUser.password,
          phone: mockOriginalUser.phone,
          address: mockOriginalUser.address
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 400 if userModel.findById rejects with an error', async () => {
      // ── ARRANGE ──────────────────────────────────
      const dbError = new Error('Database connection failed');
      userModel.findById.mockRejectedValue(dbError);
      req.body = { name: 'New Name' };

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error While Updating Profile',
        error: dbError
      });
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return 400 if hashPassword rejects with an error', async () => {
      // ── ARRANGE ──────────────────────────────────
      const hashError = new Error('Hashing algorithm failed');
      req.body = { password: 'validpassword123' };
      hashPassword.mockRejectedValue(hashError);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(hashPassword).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error While Updating Profile',
        error: hashError
      });
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should return 400 if userModel.findByIdAndUpdate rejects with an error', async () => {
      // ── ARRANGE ──────────────────────────────────
      const updateError = new Error('Failed to save to database');
      req.body = { name: 'New Name' };
      userModel.findByIdAndUpdate.mockRejectedValue(updateError);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error While Updating Profile',
        error: updateError
      });
    });
  });
});
