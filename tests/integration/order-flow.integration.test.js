// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../../config/db.js";
import {
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "../../controllers/authController.js";
import orderModel from "../../models/orderModel.js";
import userModel from "../../models/userModel.js";
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import { ORDER_STATUS } from "../../constants/orderStatus.js";

/**
 * Integration Tests for Order Flow
 *
 * Test Strategy: Integration-based testing with real database interactions
 *
 * Components Under Test:
 * - controllers/authController.js:
 *   - getOrdersController (retrieves orders for a specific user)
 *   - getAllOrdersController (retrieves all orders with sorting)
 *   - orderStatusController (updates order status with validation)
 * - models/orderModel.js (order schema with product/buyer references)
 * - models/userModel.js (user schema for buyer population)
 * - models/productModel.js (product schema for order items)
 * - models/categoryModel.js (category schema for product references)
 * - Database interactions: create, read, update, populate operations
 *
 * Test Doubles Used:
 * - Real MongoDB database connection (no mocks for models/database)
 * - Fake Express req/res objects (mocked with jest.fn())
 * - Test data for models
 *
 * Scenario Plan:
 * #  | Controller                 | Category         | Scenario                                          | Expected Result
 * ---|----------------------------|------------------|---------------------------------------------------|-----------------------------------------------------
 * 1  | getOrdersController        | Happy Path       | User retrieves orders with populated details      | 200 Success, returns orders with product/buyer/payment data
 * 2  | getOrdersController        | Happy Path       | User has no orders                                | 200 Success, returns empty array
 * 3  | getOrdersController        | Access Control   | User retrieves only their own orders              | 200 Success, returns only authenticated user's orders
 * 4  | getOrdersController        | Edge Cases       | Order references deleted product                  | 200 Success, product reference is undefined/null
 * 5  | getAllOrdersController     | Happy Path       | Retrieves all orders sorted by creation date      | 200 Success, orders sorted newest first
 * 6  | orderStatusController      | Happy Path       | Updates order status with complete response       | 200 Success, database updated and returns full order structure
 * 7  | orderStatusController      | Happy Path       | Allows all valid ORDER_STATUS transitions         | 200 Success, all enum values accepted
 * 8  | orderStatusController      | Input Validation | Rejects invalid status value                      | 400 Bad Request, validation error message
 * 9  | orderStatusController      | Input Validation | Rejects missing status field                      | 400 Bad Request, validation error message
 * 10 | orderStatusController      | Input Validation | Rejects invalid ObjectId format                   | 400 Bad Request, invalid ID format error
 * 11 | orderStatusController      | Error Handling   | Updates non-existent order                        | 404 Not Found, order not found error
 */
// Load environment variables
dotenv.config();

describe("Order Flow Integration", () => {
  let testUser1, testUser2, testCategory, testProduct1, testProduct2;
  let testOrder1, testOrder2, testOrder3;

  const testPaymentDetails = {
      transactionId: "txn_abc123xyz",
      amount: 249.98,
      method: "credit_card",
      cardLast4: "4242",
      timestamp: new Date().toISOString(),
      status: "completed",
    };

  // Setup test data before all tests
  beforeAll(async () => {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }

    // Suppress console output
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});

    // Create test users
    testUser1 = await userModel.create({
      name: "Test User 1",
      email: `testuser1_${Date.now()}@test.com`,
      password: "hashedpassword123",
      phone: "1234567890",
      address: { street: "123 Test St", city: "Test City" },
      answer: "test answer",
      role: 0,
    });

    testUser2 = await userModel.create({
      name: "Test User 2",
      email: `testuser2_${Date.now()}@test.com`,
      password: "hashedpassword456",
      phone: "0987654321",
      address: { street: "456 Test Ave", city: "Test Town" },
      answer: "test answer 2",
      role: 0,
    });

    // Create test category
    testCategory = await categoryModel.create({
      name: "Test Category",
      slug: "test-category",
    });

    // Create test products
    testProduct1 = await productModel.create({
      name: "Test Product 1",
      slug: "test-product-1",
      description: "Test product 1 description",
      price: 99.99,
      category: testCategory._id,
      quantity: 10,
      shipping: true,
    });

    testProduct2 = await productModel.create({
      name: "Test Product 2",
      slug: "test-product-2",
      description: "Test product 2 description",
      price: 149.99,
      category: testCategory._id,
      quantity: 5,
      shipping: false,
    });
  });

  // Clean up test data after all tests
  afterAll(async () => {
    // Clean up orders
    if (testOrder1) await orderModel.findByIdAndDelete(testOrder1._id);
    if (testOrder2) await orderModel.findByIdAndDelete(testOrder2._id);
    if (testOrder3) await orderModel.findByIdAndDelete(testOrder3._id);

    // Clean up other test data
    if (testProduct1) await productModel.findByIdAndDelete(testProduct1._id);
    if (testProduct2) await productModel.findByIdAndDelete(testProduct2._id);
    if (testCategory) await categoryModel.findByIdAndDelete(testCategory._id);
    if (testUser1) await userModel.findByIdAndDelete(testUser1._id);
    if (testUser2) await userModel.findByIdAndDelete(testUser2._id);

    jest.restoreAllMocks();

    // Disconnect from MongoDB
    await mongoose.connection.close();
  });

  // Clean up orders before each test
  beforeEach(async () => {
    if (testOrder1) await orderModel.findByIdAndDelete(testOrder1._id);
    if (testOrder2) await orderModel.findByIdAndDelete(testOrder2._id);
    if (testOrder3) await orderModel.findByIdAndDelete(testOrder3._id);
    testOrder1 = null;
    testOrder2 = null;
    testOrder3 = null;
  });

  describe("getOrdersControllers <-> userModel + orderModel", () => {
    it("should retrieve user orders with populated product, payment, and buyer details", async () => {
      // ── ARRANGE ──────────────────────────────────
      testOrder1 = await orderModel.create({
        products: [testProduct1._id, testProduct2._id],
        payment: testPaymentDetails,
        buyer: testUser1._id,
        status: ORDER_STATUS.NOT_PROCESS,
      });

      const req = {
        user: { _id: testUser1._id },
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // ── ACT ──────────────────────────────────────
      await getOrdersController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];

      expect(orders).toHaveLength(1);
      expect(orders[0].buyer._id.toString()).toBe(testUser1._id.toString());
      expect(orders[0].buyer.name).toBe("Test User 1");

      expect(orders[0].products).toHaveLength(2);
      expect(orders[0].products[0]).toMatchObject(testProduct1.toObject());
      expect(orders[0].products[0].name).toBe("Test Product 1");
      expect(orders[0].products[1]).toMatchObject(testProduct2.toObject());
      expect(orders[0].products[1].name).toBe("Test Product 2");

      expect(orders[0].payment).toMatchObject(testPaymentDetails);
      expect(orders[0].payment.transactionId).toBe("txn_abc123xyz");
      expect(orders[0].payment.amount).toBe(249.98);
      expect(orders[0].payment.method).toBe("credit_card");
    });

    it("should retrieve empty array when no orders exist", async () => {
      // ── ARRANGE ──────────────────────────────────
      const req = {
        user: { _id: testUser1._id },
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      
      // ── ACT ──────────────────────────────────────
      await getOrdersController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];

      expect(orders).toEqual([]);
      expect(orders).toHaveLength(0);
    });

    it("should only return orders belonging to the authenticated user", async () => {
      // ── ARRANGE ──────────────────────────────────
      // Create orders for both users
      testOrder1 = await orderModel.create({
        products: [testProduct1._id],
        payment: { transactionId: "user1_txn1" },
        buyer: testUser1._id,
        status: ORDER_STATUS.NOT_PROCESS,
      });

      testOrder2 = await orderModel.create({
        products: [testProduct2._id],
        payment: { transactionId: "user1_txn2" },
        buyer: testUser1._id,
        status: ORDER_STATUS.PROCESSING,
      });

      testOrder3 = await orderModel.create({
        products: [testProduct1._id],
        payment: { transactionId: "user2_txn1" },
        buyer: testUser2._id,
        status: ORDER_STATUS.SHIPPED,
      });

      // Create request for user1
      const req = {
        user: { _id: testUser1._id },
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // ── ACT ──────────────────────────────────────
      await getOrdersController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];

      expect(orders).toHaveLength(2);

      // Verify all returned orders belong to testUser1
      orders.forEach((order) => {
        expect(order.buyer._id.toString()).toBe(testUser1._id.toString());
        expect(order.buyer.name).toBe("Test User 1");
      });

      // Verify testUser2's order is not included
      const orderIds = orders.map((order) => order._id.toString());
      expect(orderIds).not.toContain(testOrder3._id.toString());
    });

    it("should handle orders with deleted product references", async () => {
      // ── ARRANGE ──────────────────────────────────
      testOrder1 = await orderModel.create({
        products: [testProduct1._id],
        payment: { transactionId: "txn_orphan" },
        buyer: testUser1._id,
        status: ORDER_STATUS.NOT_PROCESS,
      });

      // Delete the product after creating the order
      await productModel.findByIdAndDelete(testProduct1._id);

      const req = {
        user: { _id: testUser1._id },
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // ── ACT ──────────────────────────────────────
      await getOrdersController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];

      expect(orders).toHaveLength(1);
      // Product reference should be undefined after deletion
      expect(orders[0].products[0]).toBeUndefined();

      // Recreate testProduct1 for subsequent tests
      testProduct1 = await productModel.create({
        name: "Test Product 1",
        slug: "test-product-1",
        description: "Test product 1 description",
        price: 99.99,
        category: testCategory._id,
        quantity: 10,
        shipping: true,
      });
    });
  });

  describe("getAllOrdersController <-> orderModel", () => {
    it("should retrieve all orders correctly, sorted by creation date (newest first)", async () => {
      // ── ARRANGE ──────────────────────────────────
      // Create multiple orders at different times
      testOrder1 = await orderModel.create({
        products: [testProduct1._id],
        payment: { transactionId: "txn1" },
        buyer: testUser1._id,
        status: ORDER_STATUS.NOT_PROCESS,
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      testOrder2 = await orderModel.create({
        products: [testProduct2._id],
        payment: { transactionId: "txn2" },
        buyer: testUser2._id,
        status: ORDER_STATUS.PROCESSING,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      testOrder3 = await orderModel.create({
        products: [testProduct1._id, testProduct2._id],
        payment: { transactionId: "txn3" },
        buyer: testUser1._id,
        status: ORDER_STATUS.SHIPPED,
      });

      const req = {};
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // ── ACT ──────────────────────────────────────
      await getAllOrdersController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalled();
      const orders = res.json.mock.calls[0][0];

      expect(orders.length).toBeGreaterThanOrEqual(3);

      // Find our test orders in the results
      const retrievedOrders = orders.filter((order) =>
        [
          testOrder1._id.toString(),
          testOrder2._id.toString(),
          testOrder3._id.toString(),
        ].includes(order._id.toString()),
      );

      expect(retrievedOrders).toHaveLength(3);
      retrievedOrders.forEach((order) => {
        expect(
          Array.from([
            testOrder1._id.toString(),
            testOrder2._id.toString(),
            testOrder3._id.toString(),
          ]),
        ).toContain(order._id.toString());
      });

      // Verify sorting (newest first)
      expect(
        new Date(retrievedOrders[0].createdAt).getTime(),
      ).toBeGreaterThanOrEqual(
        new Date(retrievedOrders[1].createdAt).getTime(),
      );
      expect(
        new Date(retrievedOrders[1].createdAt).getTime(),
      ).toBeGreaterThanOrEqual(
        new Date(retrievedOrders[2].createdAt).getTime(),
      );
    });
  });

  describe("orderStatusController <-> orderModel", () => {
    it("should update order status to a valid new state", async () => {
      // ── ARRANGE ──────────────────────────────────
      testOrder1 = await orderModel.create({
        products: [testProduct1._id],
        payment: { transactionId: "txn123" },
        buyer: testUser1._id,
        status: ORDER_STATUS.NOT_PROCESS,
      });

      const req = {
        params: { orderId: testOrder1._id.toString() },
        body: { status: ORDER_STATUS.PROCESSING },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalled();

      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.message).toContain("Order status updated successfully");
      expect(response.order).toBeDefined();
      expect(response.order._id.toString()).toBe(testOrder1._id.toString());
      expect(response.order.status).toBe(ORDER_STATUS.PROCESSING);
      expect(response.order.products).toHaveLength(1);
      expect(response.order.buyer.toString()).toBe(testUser1._id.toString());
      expect(response.order.payment.transactionId).toBe("txn123");

      // Verify database was updated
      const updatedOrder = await orderModel.findById(testOrder1._id);
      expect(updatedOrder.status).toBe(ORDER_STATUS.PROCESSING);
    });

    it("should allow all valid ORDER_STATUS values", async () => {
      // ── ARRANGE ──────────────────────────────────
      testOrder1 = await orderModel.create({
        products: [testProduct1._id],
        payment: { transactionId: "txn_transitions" },
        buyer: testUser1._id,
        status: ORDER_STATUS.NOT_PROCESS,
      });

      const validStatuses = [
        ORDER_STATUS.PROCESSING,
        ORDER_STATUS.SHIPPED,
        ORDER_STATUS.DELIVERED,
        ORDER_STATUS.CANCELLED,
      ];

      // ── ACT & ASSERT ─────────────────────────────
      for (const status of validStatuses) {
        const req = {
          params: { orderId: testOrder1._id.toString() },
          body: { status },
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn(),
        };

        await orderStatusController(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const updatedOrder = await orderModel.findById(testOrder1._id);
        expect(updatedOrder.status).toBe(status);
      }
    });

    it("should reject update with invalid order status and return 400", async () => {
      // ── ARRANGE ──────────────────────────────────
      testOrder1 = await orderModel.create({
        products: [testProduct1._id],
        payment: { transactionId: "txn123" },
        buyer: testUser1._id,
        status: ORDER_STATUS.NOT_PROCESS,
      });

      const req = {
        params: { orderId: testOrder1._id.toString() },
        body: { status: "Invalid Status" },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalled();

      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toContain("Invalid or missing order status");

      // Verify database was NOT updated
      const unchangedOrder = await orderModel.findById(testOrder1._id);
      expect(unchangedOrder.status).toBe(ORDER_STATUS.NOT_PROCESS);
    });

    it("should reject update with missing status and return 400", async () => {
      // ── ARRANGE ──────────────────────────────────
      testOrder1 = await orderModel.create({
        products: [testProduct1._id],
        payment: { transactionId: "txn123" },
        buyer: testUser1._id,
        status: ORDER_STATUS.NOT_PROCESS,
      });

      const req = {
        params: { orderId: testOrder1._id.toString() },
        body: {}, // Missing status
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalled();

      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toContain("Invalid or missing order status");
    });

    it("should return 400 for invalid order ID format", async () => {
      // ── ARRANGE ──────────────────────────────────
      const req = {
        params: { orderId: "invalid-id-format" },
        body: { status: ORDER_STATUS.PROCESSING },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalled();

      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toContain("Invalid Order ID format");
    });

    it("should return 404 when updating non-existent order", async () => {
      // ── ARRANGE ──────────────────────────────────
      const nonExistentOrderId = new mongoose.Types.ObjectId();

      const req = {
        params: { orderId: nonExistentOrderId.toString() },
        body: { status: ORDER_STATUS.PROCESSING },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // ── ACT ──────────────────────────────────────
      await orderStatusController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalled();

      const response = res.send.mock.calls[0][0];
      expect(response.success).toBe(false);
      expect(response.message).toContain("Order not found");
    });
  });
});
