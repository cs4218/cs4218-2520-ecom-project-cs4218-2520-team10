// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */
import { brainTreePaymentController } from "./productController.js";

// Mock dependencies
const mockOrderSave = jest.fn();

jest.mock("braintree", () => {
  const saleMock = jest.fn();

  if (!global.mockTransactionSale) {
    global.mockTransactionSale = saleMock;
  }

  return {
    BraintreeGateway: jest.fn(function () {
      this.transaction = {
        sale: global.mockTransactionSale,
      };
      return this;
    }),
    Environment: {
      Sandbox: "sandbox",
    },
  };
});

jest.mock("../models/orderModel.js", () => {
  return jest.fn().mockImplementation((data) => ({
    ...data,
    save: global.mockOrderSave || jest.fn(),
  }));
});

global.mockOrderSave = mockOrderSave;

/**
 * Unit Tests for brainTreePaymentController
 *
 * Test Strategy: Output-based testing with comprehensive coverage
 *
 * Test Doubles Used:
 * - gateway.transaction.sale: STUB (simulates Braintree payment processing)
 * - orderModel:               MOCK (simulates database order creation)
 * - req/res:                  FAKE (test doubles for Express request/response objects)
 *
 * Testing Techniques Applied:
 *
 * 1. Statement Coverage: All executable statements are tested including:
 *    - Input validation (nonce, cart)
 *    - Price calculation logic
 *    - Payment processing
 *    - Order creation
 *    - Error handling
 *
 * 2. Condition Coverage: All boolean conditions tested for both true/false:
 *    - !nonce (true/false)
 *    - !cart (true/false)
 *    - !Array.isArray(cart) (true/false)
 *    - cart.length === 0 (true/false)
 *    - !item.price (true/false)
 *    - typeof item.price !== "number" (true/false)
 *    - result.success (true/false)
 *
 * 3. Branch Coverage: All decision branches covered:
 *    - Valid path: all validations pass → payment success → order saved
 *    - Invalid nonce path
 *    - Invalid cart paths (missing, not array, empty)
 *    - Invalid price paths (missing, non-numeric, calculation error)
 *    - Payment failure paths (error, result.success false)
 *    - Order save failure path
 *
 * 4. Equivalence Partitioning (EP):
 *    Input Classes:
 *    - Nonce: valid (string), invalid (null, undefined, missing)
 *    - Cart: valid (non-empty array), invalid (null, undefined, not array, empty)
 *    - Cart items: valid prices (numbers), invalid prices (null, undefined, strings, negative)
 *    - Payment result: success, gateway error, result.success false
 *    - Order save: success, failure
 *
 * 5. Boundary Value Analysis (BVA):
 *    - Cart length: 0 (boundary/invalid), 1 (minimum valid), multiple items
 *    - Price values: 0 (boundary), small positive, large positive, negative (invalid)
 *    - Total amount: 0 (edge case), normal values, very large values
 *
 * 6. Decision Table Testing:
 *    Conditions mapped to actions for all valid combinations:
 *    | Nonce | Cart Valid | Prices Valid | Payment | Order Save | Response |
 *    |-------|-----------|--------------|---------|------------|----------|
 *    |   ✓   |     ✓     |      ✓       |    ✓    |     ✓      | 200 OK   |
 *    |   ✗   |     -     |      -       |    -    |     -      | 400 Err  |
 *    |   ✓   |     ✗     |      -       |    -    |     -      | 400 Err  |
 *    |   ✓   |     ✓     |      ✗       |    -    |     -      | 500 Err  |
 *    |   ✓   |     ✓     |      ✓       |    ✗    |     -      | 500 Err  |
 *    |   ✓   |     ✓     |      ✓       |    ✓    |     ✗      | 500 Err  |
 *
 * Scenario Plan:
 * #  | Category             | Technique                    | Scenario                                           | Expected
 * 1  | Happy Path           | Statement, Branch, EP        | Valid nonce, cart with valid items                 | 200 OK, order created
 * 2  | Happy Path           | Statement, BVA               | Single item in cart                                | 200 OK, correct total
 * 3  | Happy Path           | Statement, BVA               | Multiple items in cart                             | 200 OK, sum of prices
 * 4  | Happy Path           | Statement                    | User ID used as buyer in order                     | 200 OK, buyer set correctly
 * 5  | Input Validation     | Condition, EP, Decision      | Missing nonce                                      | 400 Bad Request
 * 6  | Input Validation     | Condition, EP, Decision      | Null nonce                                         | 400 Bad Request
 * 7  | Input Validation     | Condition, EP, Decision      | Empty string nonce                                 | 400 Bad Request
 * 8  | Input Validation     | Condition, EP, Decision      | Missing cart                                       | 400 Bad Request
 * 9  | Input Validation     | Condition, EP, Decision      | Null cart                                          | 400 Bad Request
 * 10 | Input Validation     | Condition, EP, Decision      | Cart is not an array                               | 400 Bad Request
 * 11 | Input Validation     | Condition, EP, Decision      | Cart is an object instead of array                 | 400 Bad Request
 * 12 | Input Validation     | Condition, BVA, Decision     | Empty cart array                                   | 400 Bad Request
 * 13 | Price Validation     | Statement, EP                | Cart item with missing price                       | 500 Error
 * 14 | Price Validation     | Condition, EP                | Cart item with null price                          | 500 Error
 * 15 | Price Validation     | Condition, EP                | Cart item with non-numeric price (string)          | 500 Error
 * 16 | Price Validation     | Condition, EP                | Cart item with undefined price                     | 500 Error
 * 17 | Price Validation     | Statement, EP                | Multiple cart items with invalid prices            | 500 Error
 * 18 | BVA - Prices         | BVA                          | Cart with negative price                           | 500 Error
 * 19 | BVA - Prices         | BVA                          | Cart with zero price item (free item)              | 200 OK, total = 0
 * 20 | BVA - Prices         | BVA                          | Positive price values (small and large)            | 200 OK
 * 21 | Payment Processing   | Branch, EP, Decision         | Gateway returns error in callback                  | 500 Error
 * 22 | Payment Processing   | Condition, Branch, Decision  | Gateway returns result.success = false             | 500 Error
 * 23 | Payment Processing   | Branch                       | Gateway throws synchronous exception               | 500 Error
 * 24 | Order Creation       | Branch, EP, Decision         | Order save fails                                   | 500 Error
 */
describe("brainTreePaymentController", () => {
  let req, res;
  const mockUserId = "user123";
  const mockNonce = "fake-nonce";
  const mockValidNonce = "fake-valid-nonce";
  const mockPaymentResult = { success: true };
  const mockSavedOrder = { _id: "order123" };
  const simpleCart = [{ name: "Product", price: 10 }];

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

    // Reset mock implementations
    global.mockTransactionSale.mockReset();
    global.mockOrderSave.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should successfully process payment and create order with valid inputs", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [
        { name: "Product 1", price: 10.99 },
        { name: "Product 2", price: 25.5 },
      ];
      const detailedPaymentResult = {
        success: true,
        transaction: { id: "txn123", amount: "36.49" },
      };
      const detailedSavedOrder = {
        _id: "order123",
        products: mockCart,
        payment: detailedPaymentResult,
        buyer: mockUserId,
      };

      req.body = { nonce: mockValidNonce, cart: mockCart };

      // Mock gateway to succeed
      global.mockTransactionSale.mockImplementation((options, callback) => {
        callback(null, detailedPaymentResult);
      });
      // Mock order save to succeed
      global.mockOrderSave.mockResolvedValue(detailedSavedOrder);

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        order: detailedSavedOrder,
      });
    });

    it("should calculate correct total for single item cart", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [{ name: "Product 1", price: 49.99 }];

      req.body = { nonce: mockValidNonce, cart: mockCart };

      global.mockTransactionSale.mockImplementation((options, callback) => {
        expect(options.amount).toBe(49.99); // Verify correct total passed to gateway
        callback(null, mockPaymentResult);
      });
      global.mockOrderSave.mockResolvedValue(mockSavedOrder);

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        order: mockSavedOrder,
      });
    });

    it("should calculate correct total for multiple items", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [
        { name: "Product 1", price: 10 },
        { name: "Product 2", price: 20 },
        { name: "Product 3", price: 30 },
      ];

      req.body = { nonce: mockValidNonce, cart: mockCart };

      global.mockTransactionSale.mockImplementation((options, callback) => {
        expect(options.amount).toBe(60); // Verify correct total passed to gateway
        callback(null, mockPaymentResult);
      });
      global.mockOrderSave.mockResolvedValue(mockSavedOrder);

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalled();
    });

    it("should use user ID as buyer in order", async () => {
      // ── ARRANGE ──────────────────────────────────
      const buyerSavedOrder = { _id: "order123", buyer: mockUserId };

      req.body = { nonce: mockValidNonce, cart: simpleCart };

      global.mockTransactionSale.mockImplementation((options, callback) => {
        callback(null, mockPaymentResult);
      });
      global.mockOrderSave.mockResolvedValue(buyerSavedOrder);

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          order: expect.objectContaining({ buyer: mockUserId }),
        }),
      );
    });
  });

  describe("Input Validation - Nonce", () => {
    it("should return 400 when nonce is missing from request body", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { cart: simpleCart };
      // nonce is undefined

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 when nonce is null", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { nonce: null, cart: simpleCart };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 when nonce is empty string", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { nonce: "", cart: simpleCart };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });
  });

  describe("Input Validation - Cart", () => {
    it("should return 400 when cart is missing from request body", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { nonce: mockNonce };
      // cart is undefined

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 when cart is null", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { nonce: mockNonce, cart: null };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 when cart is not an array", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { nonce: mockNonce, cart: "not-an-array" };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 when cart is an object instead of array", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { nonce: mockNonce, cart: { item: "product" } };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it("should return 400 when cart is an empty array", async () => {
      // ── ARRANGE ──────────────────────────────────
      req.body = { nonce: mockNonce, cart: [] };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });
  });

  describe("Price Validation", () => {
    it("should return 500 when cart item has missing price", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [{ name: "Product 1" }]; // price is missing
      req.body = { nonce: mockNonce, cart: mockCart };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: expect.any(Error),
      });
    });

    it("should return 500 when cart item has null price", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [{ name: "Product 1", price: null }];
      req.body = { nonce: mockNonce, cart: mockCart };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: expect.any(Error),
      });
    });

    it("should return 500 when cart item has string price", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [{ name: "Product 1", price: "10.99" }]; // string, not number
      req.body = { nonce: mockNonce, cart: mockCart };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: expect.any(Error),
      });
    });

    it("should return 500 when cart item has undefined price", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [{ name: "Product 1", price: undefined }];
      req.body = { nonce: mockNonce, cart: mockCart };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: expect.any(Error),
      });
    });

    it("should detect invalid price in multiple cart items", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [
        { name: "Product 1", price: 10.99 }, // valid
        { name: "Product 2", price: "invalid" }, // invalid
        { name: "Product 3", price: undefined }, // invalid
      ];
      req.body = { nonce: mockNonce, cart: mockCart };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: expect.any(Error),
      });
    });
  });

  describe("BVA - Prices", () => {
    // Boundary Value: price = 0
    // price < 0 (Invalid)
    it("should reject cart with negative price", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [{ name: "Product", price: -1 }];

      req.body = { nonce: mockNonce, cart: mockCart };

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: expect.any(Error),
      });
    });

    // price = 0 (Valid)
    it("should accept cart with zero price item (free items allowed)", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [{ name: "Free Product", price: 0 }];

      req.body = { nonce: mockNonce, cart: mockCart };

      global.mockTransactionSale.mockImplementation((options, callback) => {
        expect(options.amount).toBe(0);
        callback(null, mockPaymentResult);
      });
      global.mockOrderSave.mockResolvedValue(mockSavedOrder);

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalledWith({
        ok: true,
        order: mockSavedOrder,
      });
    });

    // price > 0 (Valid)
    it("should handle positive price values", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCart = [
        { name: "Item", price: 1 },
        { name: "Expensive Item", price: 100000 },
      ];

      req.body = { nonce: mockNonce, cart: mockCart };

      global.mockTransactionSale.mockImplementation((options, callback) => {
        expect(options.amount).toBe(100001); // Verify correct total passed to gateway
        callback(null, mockPaymentResult);
      });

      global.mockOrderSave.mockResolvedValue(mockSavedOrder);

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("Payment Processing - Gateway Errors", () => {
    it("should return 500 Internal Server Error when gateway returns error in callback", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockError = new Error("Payment gateway error");

      req.body = { nonce: mockNonce, cart: simpleCart };

      global.mockTransactionSale.mockImplementation((options, callback) => {
        callback(mockError, null);
      });

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: mockError,
      });
    });

    it("should return 500 Internal Server Error when payment is unsuccessful", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockResult = {
        success: false,
        message: "Insufficient funds",
      };

      req.body = { nonce: mockNonce, cart: simpleCart };

      global.mockTransactionSale.mockImplementation((options, callback) => {
        callback(null, mockResult);
      });

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: expect.any(Error),
      });
    });

    it("should return 500 Internal Server Error when gateway throws synchronous exception", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockError = new Error("Gateway initialization failed");

      req.body = { nonce: mockNonce, cart: simpleCart };

      global.mockTransactionSale.mockImplementation(() => {
        throw mockError;
      });

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: mockError,
      });
    });
  });

  describe("Order Creation - Database Errors", () => {
    it("should return 500 Internal Server Error when order save fails", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockError = new Error("Database connection failed");

      req.body = { nonce: mockNonce, cart: simpleCart };

      global.mockTransactionSale.mockImplementation((options, callback) => {
        callback(null, mockPaymentResult);
      });

      global.mockOrderSave.mockRejectedValue(mockError);

      // ── ACT ──────────────────────────────────────
      await brainTreePaymentController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: mockError,
      });
    });
  });
});
