import { updateProfileController } from './authController.js';
import userModel from '../models/userModel.js';
import { hashPassword } from '../helpers/authHelper.js';

jest.mock('../models/userModel.js');
jest.mock('../helpers/authHelper.js');

describe('updateProfileController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      user: { _id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  // ========== EP + BVA: Password Length ==========
  describe('Password Length Validation', () => {
    const mockUser = {
      _id: 'user123',
      name: 'John Doe',
      phone: '1234567890',
      address: 'Test Address',
      password: 'oldHashedPassword'
    };

    beforeEach(() => {
      userModel.findById.mockResolvedValue(mockUser);
    });

    it('should reject empty string password', async () => {
      req.body = { password: '' };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password is required and 6 character long'
      });
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('should reject password with 5 characters', async () => {
      req.body = { password: '12345' };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Password is required and 6 character long'
      });
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('should accept password with exactly 6 characters', async () => {
      req.body = { password: '123456' };
      hashPassword.mockResolvedValue('hashed123456');
      userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await updateProfileController(req, res);

      expect(hashPassword).toHaveBeenCalledWith('123456');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: 'Profile Updated Successfully',
        updatedUser: mockUser
      });
    });

    it('should accept password with 7 characters', async () => {
      req.body = { password: '1234567' };
      hashPassword.mockResolvedValue('hashed1234567');
      userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      await updateProfileController(req, res);

      expect(hashPassword).toHaveBeenCalledWith('1234567');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ========== DT: Field Combinations ==========
  describe('Field Update Combinations', () => {
    const mockUser = {
      _id: 'user123',
      name: 'Original Name',
      phone: '1111111111',
      address: 'Original Address',
      password: 'oldHashedPassword'
    };

    beforeEach(() => {
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue(mockUser);
    });

    it('should update only name field', async () => {
      req.body = { name: 'Updated Name' };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Updated Name',
          password: 'oldHashedPassword',
          phone: '1111111111',
          address: 'Original Address'
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should update only phone field', async () => {
      req.body = { phone: '9999999999' };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Original Name',
          password: 'oldHashedPassword',
          phone: '9999999999',
          address: 'Original Address'
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should update only address field', async () => {
      req.body = { address: 'New Address' };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Original Name',
          password: 'oldHashedPassword',
          phone: '1111111111',
          address: 'New Address'
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should update name and phone together', async () => {
      req.body = { name: 'New Name', phone: '2222222222' };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'New Name',
          password: 'oldHashedPassword',
          phone: '2222222222',
          address: 'Original Address'
        },
        { new: true }
      );
    });

    it('should update name, phone, and address together (no password)', async () => {
      req.body = { 
        name: 'Complete Name', 
        phone: '3333333333',
        address: 'Complete Address'
      };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Complete Name',
          password: 'oldHashedPassword',
          phone: '3333333333',
          address: 'Complete Address'
        },
        { new: true }
      );
      expect(hashPassword).not.toHaveBeenCalled();
    });

    it('should update all fields including password', async () => {
      req.body = {
        name: 'All Fields Name',
        phone: '4444444444',
        address: 'All Fields Address',
        password: 'newpass123'
      };
      hashPassword.mockResolvedValue('hashedNewPass');

      await updateProfileController(req, res);

      expect(hashPassword).toHaveBeenCalledWith('newpass123');
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'All Fields Name',
          password: 'hashedNewPass',
          phone: '4444444444',
          address: 'All Fields Address'
        },
        { new: true }
      );
    });
  });

  // ========== DT: Password Combinations ==========
  describe('Password Logic Validation', () => {
    const mockUser = {
      _id: 'user123',
      name: 'Test',
      phone: '1234567890',
      address: 'Test',
      password: 'oldHash'
    };

    beforeEach(() => {
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue(mockUser);
    });

    // Rule: Password=undefined, Other fields=provided
    it('No password + valid name should update name only', async () => {
      req.body = { name: 'New Name' };

      await updateProfileController(req, res);

      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          name: 'New Name',
          password: 'oldHash'
        }),
        { new: true }
      );
    });

    // Rule: Password=empty, Other fields=provided
    it('Empty password + valid name should reject', async () => {
      req.body = { name: 'New Name', password: '' };

      await updateProfileController(req, res);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Password is required and 6 character long'
      });
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    // Rule: Password=invalid length, Other fields=provided
    it('Invalid password + valid fields should reject all updates', async () => {
      req.body = { name: 'New Name', phone: '9999999999', password: '12345' };

      await updateProfileController(req, res);

      expect(res.json).toHaveBeenCalledWith({
        error: 'Password is required and 6 character long'
      });
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    // Rule: Password=valid, Other fields=empty
    it('Valid password + no other fields should update password only', async () => {
      req.body = { password: 'newpass123' };
      hashPassword.mockResolvedValue('newHash');

      await updateProfileController(req, res);

      expect(hashPassword).toHaveBeenCalledWith('newpass123');
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Test',
          password: 'newHash',
          phone: '1234567890',
          address: 'Test'
        },
        { new: true }
      );
    });

    // Rule: All fields=empty/undefined
    it('No fields provided should preserve all original data', async () => {
      req.body = {};

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Test',
          password: 'oldHash',
          phone: '1234567890',
          address: 'Test'
        },
        { new: true }
      );
    });
  });

  // ========== EP: Empty/Falsy Values ==========
  describe('Empty and Falsy Values', () => {
    const mockUser = {
      _id: 'user123',
      name: 'Original',
      phone: '1234567890',
      address: 'Original Address',
      password: 'hashedPassword'
    };

    beforeEach(() => {
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue(mockUser);
    });

    it('should preserve original name when empty string provided', async () => {
      req.body = { name: '' };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Original', // Falls back to user.name due to empty string being falsy
          password: 'hashedPassword',
          phone: '1234567890',
          address: 'Original Address'
        },
        { new: true }
      );
    });

    it('should preserve original phone when empty string provided', async () => {
      req.body = { phone: '' };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          phone: '1234567890'
        }),
        { new: true }
      );
    });

    it('should preserve original address when empty string provided', async () => {
      req.body = { address: '' };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          address: 'Original Address'
        }),
        { new: true }
      );
    });

    it('should handle null values by preserving original data', async () => {
      req.body = { name: null, phone: null, address: null };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          name: 'Original',
          password: 'hashedPassword',
          phone: '1234567890',
          address: 'Original Address'
        },
        { new: true }
      );
    });

    it('should handle undefined values in body', async () => {
      req.body = { name: undefined };

      await updateProfileController(req, res);

      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          name: 'Original'
        }),
        { new: true }
      );
    });
  });

  // ========== ERROR HANDLING & EDGE CASES ==========
  describe('Error Handling and Edge Cases', () => {
    it('should handle database error on findById', async () => {
      const error = new Error('Database connection failed');
      userModel.findById.mockRejectedValue(error);

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error While Updating Profile',
        error
      });
    });

    it('should handle database error on findByIdAndUpdate', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test',
        phone: '1234567890',
        address: 'Test',
        password: 'hashed'
      };
      const updateError = new Error('Update failed');
      
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockRejectedValue(updateError);
      req.body = { name: 'New Name' };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error While Updating Profile',
        error: updateError
      });
    });

    it('should handle hashPassword failure', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test',
        phone: '1234567890',
        address: 'Test',
        password: 'hashed'
      };
      const hashError = new Error('Hashing failed');
      
      userModel.findById.mockResolvedValue(mockUser);
      hashPassword.mockRejectedValue(hashError);
      req.body = { password: 'validpass123' };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error While Updating Profile',
        error: hashError
      });
    });

    it('should handle missing user', async () => {
      userModel.findById.mockResolvedValue(null);
      req.body = { phone: '9999999999' };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'User not found'
      });
    });

    it('should handle missing req.user._id', async () => {
      req.user = {};
      req.body = { name: 'Test' };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    });

    it('should handle undefined req.user', async () => {
      req.user = undefined;
      req.body = { name: 'Test' };

      await updateProfileController(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized: User not authenticated'
      });
    });
  });
});