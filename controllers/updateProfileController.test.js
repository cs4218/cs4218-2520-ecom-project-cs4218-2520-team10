// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */
import { updateProfileController } from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";
import { after } from "node:test";

jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");

/**
 * Unit Tests for updateProfileController
 *
 * Test Strategy: Output-based testing (focuses on observable behavior)
 *
 * Test Doubles Used:
 * - userModel.findById:          STUB (returns controlled test data: mockOriginalUser or null)
 * - userModel.findByIdAndUpdate: STUB (returns updated user data)
 * - hashPassword:                STUB (returns hashed password or throws)
 * - req/res:                     FAKE (test doubles for Express request/response objects)
 *
 * Testing Techniques Applied:
 * - Equivalence Partitioning (EP): Valid/invalid password length, valid/invalid field values
 * - Boundary Value Analysis (BVA): Password length (exact min, below min, above min)
 * - Negative Testing: Unauthorized access, user not found, invalid password
 * - Error Handling: Database errors, hashing errors during update
 * - Authentication Checks: Ensuring req.user is defined and has an _id
 *
 * Scenario Plan:
 * #  | Category        | Technique   | Scenario                                      | Expected
 * 1  | Happy Path      | EP          | Update only name                              | 200 Success, name updated, password unchanged
 * 2  | Happy Path      | EP          | Update only phone                             | 200 Success, phone updated, password unchanged
 * 3  | Happy Path      | EP          | Update only address                           | 200 Success, address updated, password unchanged
 * 4  | Happy Path      | EP          | Update password (valid)                       | 200 Success, password updated
 * 5  | Happy Path      | EP          | Update all fields including password          | 200 Success, all fields updated
 * 6  | Happy Path      | EP          | Empty request body (no updates)               | 200 Success, original data returned
 * 7  | Password        | EP          | Empty string password                         | 400 Bad Request, no update performed
 * 8  | Password        | BVA         | Password length < 6 characters                | 400 Bad Request, no update performed
 * 9  | Password        | BVA         | Password length exactly 6 characters          | 200 Success, password updated
 * 10 | Password        | BVA         | Password length > 6 characters                | 200 Success, password updated
 * 11 | Falsy Values    | EP          | Empty string for name                         | 200 Success, original name preserved
 * 12 | Falsy Values    | EP          | Empty string for phone                        | 200 Success, original phone preserved
 * 13 | Falsy Values    | EP          | Empty string for address                      | 200 Success, original address preserved
 * 14 | Falsy Values    | EP          | Null values for fields                        | 200 Success, original data preserved
 * 15 | Falsy Values    | EP          | Undefined values for fields                   | 200 Success, original data preserved
 * 16 | Error Handling  | Negative    | Database fails to find user                   | 404 Not Found, no update performed
 * 17 | Error Handling  | Negative    | Database fails to update user                 | 500 Internal Server Error, no update performed
 * 18 | Error Handling  | Negative    | Password hashing fails                        | 500 Internal Server Error, no update performed
 */
describe("updateProfileController", () => {
  let req, res;
  const mockUserId = "user123";
  const mockOriginalUser = {
    _id: mockUserId,
    name: "Original Name",
    phone: "1111111111",
    address: "Original Address",
    password: "oldHashedPassword",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      user: { _id: mockUserId },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    userModel.findById.mockResolvedValue(mockOriginalUser);
    userModel.findByIdAndUpdate.mockResolvedValue({ ...mockOriginalUser }); // Return a copy for immutability
    hashPassword.mockResolvedValue("newHashedPassword");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should update only name field successfully", async () => {
      // ── ARRANGE ──────────────────────────────────
      const updatedName = "Updated Name";
      req.body = { name: updatedName };
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockOriginalUser,
        name: updatedName,
      });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          updatedUser: expect.objectContaining({
            name: updatedName,
            password: mockOriginalUser.password, // Ensure password is unchanged
          }),
        }),
      );
    });

    it("should update only phone field successfully", async () => {
      // ── ARRANGE ──────────────────────────────────
      const updatedPhone = "9999999999";
      req.body = { phone: updatedPhone };
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockOriginalUser,
        phone: updatedPhone,
      });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          updatedUser: expect.objectContaining({
            phone: updatedPhone,
            password: mockOriginalUser.password, // Ensure password is unchanged
          }),
        }),
      );
    });

    it("should update only address field successfully", async () => {
      // ── ARRANGE ──────────────────────────────────
      const updatedAddress = "New Address";
      req.body = { address: updatedAddress };
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockOriginalUser,
        address: updatedAddress,
      });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          updatedUser: expect.objectContaining({
            address: updatedAddress,
            password: mockOriginalUser.password, // Ensure password is unchanged
          }),
        }),
      );
    });

    it("should update password only when valid and hash it", async () => {
      // ── ARRANGE ──────────────────────────────────
      const newPassword = "newvalidpassword";
      const hashedPassword = "hashedNewValidPassword";
      req.body = { password: newPassword };
      hashPassword.mockResolvedValue(hashedPassword);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockOriginalUser,
        password: hashedPassword,
      });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          updatedUser: expect.objectContaining({
            password: hashedPassword,
          }),
        }),
      );
    });

    it("should update all fields including password successfully", async () => {
      // ── ARRANGE ──────────────────────────────────
      const newName = "New Name";
      const newPhone = "9999999999";
      const newAddress = "New Address";
      const newPassword = "newvalidpassword";
      const hashedPassword = "hashedNewValidPassword";
      req.body = {
        name: newName,
        phone: newPhone,
        address: newAddress,
        password: newPassword,
      };
      hashPassword.mockResolvedValue(hashedPassword);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockOriginalUser,
        name: newName,
        phone: newPhone,
        address: newAddress,
        password: hashedPassword,
      });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          updatedUser: expect.objectContaining({
            name: newName,
            phone: newPhone,
            address: newAddress,
            password: hashedPassword,
          }),
        }),
      );
    });

    it("should not update any fields if request body is empty", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = {};
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          updatedUser: mockOriginalUser,
        }),
      );
    });
  });

  describe("EP & BVA for Password", () => {
    // Boundary Value: password.length = 6
    // EP: Outside Interval - Invalid password length
    it("should reject empty string password", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { password: "" };

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.any(String),
        updatedUser: undefined, // Ensure no update is performed when password is invalid
      });
    });

    it("should reject password with less than 6 characters", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { password: "12345" };

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.any(String),
        updatedUser: undefined, // Ensure no update is performed when password is invalid
      });
    });

    // // EP: Inside Interval - Valid password length
    it("should accept password with exactly 6 characters", async () => {
      // ── ARRANGE ──────────────────────────────────
      const password = "123456";
      const hashedPassword = "hashed123456";
      req.body = { password };
      hashPassword.mockResolvedValue(hashedPassword);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockOriginalUser,
        password: hashedPassword,
      });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          updatedUser: expect.objectContaining({ password: hashedPassword }),
        }),
      );
    });

    it("should accept password with more than 6 characters", async () => {
      // ── ARRANGE ──────────────────────────────────
      const password = "1234567";
      const hashedPassword = "hashed1234567";
      req.body = { password };
      hashPassword.mockResolvedValue(hashedPassword);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockOriginalUser,
        password: hashedPassword,
      });

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          updatedUser: expect.objectContaining({ password: hashedPassword }),
        }),
      );
    });
  });

  describe("Empty/Falsy Values for Profile Fields", () => {
    it("should preserve original name when empty string provided", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { name: "" };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser); // Mock to return original user if name is falsy

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          updatedUser: expect.objectContaining({ name: mockOriginalUser.name }),
        }),
      );
    });

    it("should preserve original phone when empty string provided", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { phone: "" };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          updatedUser: expect.objectContaining({ phone: mockOriginalUser.phone }),
        }),
      );
    });

    it("should preserve original address when empty string provided", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { address: "" };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          updatedUser: expect.objectContaining({ address: mockOriginalUser.address }),
        }),
      );
    });

    it("should preserve original data when null values are provided for fields", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { name: null, phone: null, address: null };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          updatedUser: expect.objectContaining({
            name: mockOriginalUser.name,
            phone: mockOriginalUser.phone,
            address: mockOriginalUser.address,
          }),
        }),
      );
    });

    it("should preserve original data when undefined values are provided for fields", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = {
        name: undefined,
        phone: undefined,
        address: undefined,
      };
      userModel.findByIdAndUpdate.mockResolvedValue(mockOriginalUser);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          updatedUser: expect.objectContaining({
            name: mockOriginalUser.name,
            phone: mockOriginalUser.phone,
            address: mockOriginalUser.address,
          }),
        }),
      );
    });
  });

  describe("Error Handling", () => {
    it("should return 404 User Not Found if user is not found in database", async () => {
      // ── ARRANGE ──────────────────────────────────
      userModel.findById.mockResolvedValue(null);
      req.body = { name: "New Name" };

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 500 Internal Server Error when database fails to find user", async () => {
      // ── ARRANGE ──────────────────────────────────
      const dbError = new Error("Database connection failed");
      userModel.findById.mockRejectedValue(dbError);
      req.body = { name: "New Name" };

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: dbError,
        updatedUser: undefined, // Ensure no update is performed
      });
    });

    it("should return 500 Internal Server Error when database fails to update user", async () => {
      // ── ARRANGE ──────────────────────────────────
      const updateError = new Error("Failed to save to database");
      req.body = { name: "New Name" };
      userModel.findByIdAndUpdate.mockRejectedValue(updateError);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(userModel.findById).toHaveBeenCalledWith(mockUserId);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: updateError,
        updatedUser: undefined, // Ensure no update is performed
      });
    });

    it("should return 500 Internal Server Error when password hashing fails", async () => {
      // ── ARRANGE ──────────────────────────────────
      const hashError = new Error("Hashing algorithm failed");
      req.body = { password: "validpassword123" };
      hashPassword.mockRejectedValue(hashError);

      // ── ACT ──────────────────────────────────────
      await updateProfileController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(hashPassword).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: hashError,
        updatedUser: undefined, // Ensure no update is performed
      });
    });
  });
});
