// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */
import mongoose from "mongoose";
import { orderStatusController } from "./authController.js";
import orderModel from "../models/orderModel.js";
import {
  DEFAULT_ORDER_STATUS,
  ORDER_STATUS,
} from "../constants/orderStatus.js";

jest.mock("../models/orderModel.js", () => ({
  find: jest.fn().mockReturnThis(),
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  then: jest.fn((resolve) => resolve([])),
  findByIdAndUpdate: jest.fn(),
}));

/**
 * Unit Tests for orderStatusController
 * 
 * Test Strategy: Output-based testing
 *
 * Test Doubles Used:
 * - orderModel.findByIdAndUpdate:    STUB (returns updated order or null)
 * - mongoose.Types.ObjectId.isValid: STUB (controls orderId format validation)
 * - req/res:                         FAKE (test doubles for Express request/response objects)
 *
 * Testing Techniques Applied:
 * - Happy Path: Valid inputs leading to success
 * - Negative Testing: Invalid inputs, edge cases, error conditions
 * - Equivalence Partitioning (EP): Valid/invalid orderId, valid/invalid status
 *
 * Scenario Plan:
 * #  | Category             | Technique             | Scenario                                          | Expected Result
 * ---|----------------------|-----------------------|---------------------------------------------------|-----------------------------------------------------
 * 1  | Happy Path           | EP (Valid)            | Valid orderId and valid status provided           | 200 Success, returns order with updated status
 * 2  | Input Validation     | EP (Invalid)          | Invalid orderId format (not a valid ObjectId)     | 400 Bad Request, error message, no order returned
 * 3  | Input Validation     | EP (Invalid)          | Missing status in request body                    | 400 Bad Request, error message, no order returned
 * 4  | Input Validation     | EP (Invalid)          | Invalid status.                                   | 400 Bad Request, error message, no order returned
 * 5  | Error Handling       | Negative Testing      | Order ID not found                                | 404 Not Found, error message, no order returned
 * 6  | Error Handling       | Negative Testing      | Database error                                    | 500 Internal Server Error, error message and error object
 */
describe("orderStatusController", () => {
  let req, res;
  const mockOrderId = "60c72b2f9b1d4b0015b2e3e6"; // A fake valid Mongoose ObjectId string
  let mockValidStatus;
  let mockUpdatedOrder;

  beforeEach(() => {
    jest.clearAllMocks();

    mockValidStatus = ORDER_STATUS.PROCESSING; // "Processing"
    mockUpdatedOrder = {
      _id: mockOrderId,
      status: mockValidStatus,
      buyer: "someUserId",
      products: [],
    };

    req = {
      params: { orderId: mockOrderId },
      body: { status: mockValidStatus },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };
    jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);

    // Default mocks for a successful path
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
    orderModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedOrder);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should update order status successfully and return 200", async () => {
      // ── ARRANGE ──────────────────────────────────
      // (Defaults state set in beforeEach)

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        order: mockUpdatedOrder,
      });
      expect(res.send.mock.calls[0][0].order.status).toBe(mockValidStatus);
    });
  });

  describe("Input Validation", () => {
    it("should return 400 if orderId format is invalid", async () => {
      // ── ARRANGE ──────────────────────────────────
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        order: undefined, // No order should be returned
      });
    });

    it("should return 400 if status is missing", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body.status = undefined; // Missing status

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        order: undefined, // No order should be returned
      });
    });

    it("should return 400 if order status value is invalid", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body.status = "NonExistentStatus";

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        order: undefined, // No order should be returned
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 404 if order ID is not found", async () => {
      // ── ARRANGE ──────────────────────────────────
      orderModel.findByIdAndUpdate.mockResolvedValue(null);

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        order: undefined, // No order should be returned
      });
    });

    it("should return 500 when database operation fails", async () => {
      // ── ARRANGE ──────────────────────────────────
      const dbError = new Error("Database update failed");
      orderModel.findByIdAndUpdate.mockRejectedValue(dbError);

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        {
          success: false,
          message: expect.any(String),
          error: dbError,
          order: undefined // No order should be returned
        }
      );
    });
  });
});
