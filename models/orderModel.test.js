// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */
import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import { ORDER_STATUS, DEFAULT_ORDER_STATUS } from "../client/src/constants/orderStatus.js";

/**
 *  Test cases for Order Model
 * 
 * 1. Happy Path: 2 tests
 *		a. Should validate successfully when all required fields are provided with valid data
 *		b. Should validate successfully when optional fields are included with valid data
 * 2. Input Validation: 4 tests
 *		a. Should fail validation when required fields are missing
 *		b. Should fail validation when status is not in the enum list
 *		c. Should fail validation when buyer is not a valid ObjectId
 *		d. Should fail validation when products contains invalid ObjectIds
 */
describe("Order Model", () => {
  describe("Happy Path", () => {
    it("should validate successfully with all required fields", async () => {
      const order = new Order({
        products: [new mongoose.Types.ObjectId()],
        payment: { transactionId: "12345" },
        buyer: new mongoose.Types.ObjectId(),
        status: ORDER_STATUS.NOT_PROCESS,
      });

      expect(order.validate()).resolves.toBeUndefined();
    });

    it("should validate successfully with optional fields included", async () => {
      const order = new Order({
        products: [
          new mongoose.Types.ObjectId(),
          new mongoose.Types.ObjectId(),
        ],
        payment: {
          transactionId: "12345",
          amount: 100,
          method: "credit_card",
        },
        buyer: new mongoose.Types.ObjectId(),
        status: ORDER_STATUS.PROCESSING,
      });

      expect(order.validate()).resolves.toBeUndefined();
    });

    it("should use default status when status is not provided", async () => {
      const order = new Order({
        products: [new mongoose.Types.ObjectId()],
        payment: {},
        buyer: new mongoose.Types.ObjectId(),
      });

      expect(order.status).toBe(DEFAULT_ORDER_STATUS);
      expect(order.validate()).resolves.toBeUndefined();
    });
  });

  describe("Input Validation", () => {
    it("should validate successfully with empty order object", async () => {
      const order = new Order({});

      expect(order.status).toBe(DEFAULT_ORDER_STATUS);
      expect(order.validate()).resolves.toBeUndefined();
    });

    it("should fail when status is not in the enum list", async () => {
      const order = new Order({
        products: [new mongoose.Types.ObjectId()],
        payment: {},
        buyer: new mongoose.Types.ObjectId(),
        status: "Invalid Status",
      });

      expect(order.validate()).rejects.toThrow();
    });

    it("should fail when buyer is not a valid ObjectId", async () => {
      const order = new Order({
        products: [new mongoose.Types.ObjectId()],
        payment: {},
        buyer: "invalid-id",
      });

      expect(order.validate()).rejects.toThrow();
    });

    it("should fail when products contains invalid ObjectIds", async () => {
      const order = new Order({
        products: ["invalid-id"],
        payment: {},
        buyer: new mongoose.Types.ObjectId(),
      });

      expect(order.validate()).rejects.toThrow();
    });

    it("should validate successfully with all valid order statuses", async () => {
      const statuses = [
        ORDER_STATUS.NOT_PROCESS,
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED,
      ];

      for (const status of statuses) {
        const order = new Order({
          products: [new mongoose.Types.ObjectId()],
          payment: {},
          buyer: new mongoose.Types.ObjectId(),
          status: status,
        });

        expect(order.validate()).resolves.toBeUndefined();
      }
    });
  });
});
