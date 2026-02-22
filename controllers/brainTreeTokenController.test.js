// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */
import { braintreeTokenController } from "./productController.js";

// Mock braintree module
jest.mock("braintree", () => {
  // Define mockGenerate inside the factory to avoid hoisting issue
  const generateMock = jest.fn();

  // Store reference to mockGenerate outside
  if (!global.mockGenerate) {
    global.mockGenerate = generateMock;
  }

  return {
    BraintreeGateway: jest.fn(function () {
      this.clientToken = {
        generate: global.mockGenerate,
      };
      return this;
    }),
    Environment: {
      Sandbox: "sandbox",
    },
  };
});

/**
 * Unit Tests for braintreeTokenController
 *
 * Test Strategy: Output-based testing (focuses on observable behavior)
 *
 * Test Doubles Used:
 * - gateway.clientToken.generate: STUB (returns controlled test data or errors via callback)
 * - req/res:                      FAKE (test doubles for Express request/response objects)
 *
 * Testing Techniques Applied:
 * - Equivalence Partitioning (EP): Partitions response types into equivalence classes:
 *   * Valid responses (with token data)
 *   * Error responses (callback errors)
 *   * Exception responses (synchronous exceptions)
 *   * Null/empty responses (edge cases)
 * 
 * - Condition Coverage:
 *   * Success path: callback(null, response) -> res.send(response)
 *   * Callback error path: callback(err, null) -> res.status(500).send(err)
 *   * Exception path: throw error -> catch block -> res.status(500).send({...})
 * - Negative Testing: Tests error scenarios (gateway failures, exceptions)
 * - Edge Case Testing: Tests boundary inputs (null, empty object responses)
 *
 * Scenario Plan:
 * #  | Category        | Technique              | Scenario                                    | Expected
 * 1  | Happy Path      | EP, Condition Coverage | Token generated successfully                | 200 OK, token returned
 * 2  | Error Handling  | EP, Condition Coverage | Gateway returns error in callback           | 500 Error, structured error response
 * 3  | Error Handling  | EP, Condition Coverage | Gateway throws synchronous exception        | 500 Error, structured error response
 * 4  | Edge Cases      | EP                     | Gateway returns null response               | 200 OK, null returned
 * 5  | Edge Cases      | EP                     | Gateway returns empty object response       | 200 OK, empty object returned
 */
describe("braintreeTokenController", () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
    };

    // Reset mock implementation
    global.mockGenerate.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should successfully return payment token when gateway generates token", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockTokenResponse = {
        clientToken: "mock_client_token_12345",
        success: true,
      };

      // Mock gateway to call callback with success response
      global.mockGenerate.mockImplementation((options, callback) => {
        callback(null, mockTokenResponse);
      });

      // ── ACT ──────────────────────────────────────
      await braintreeTokenController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith(mockTokenResponse);
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when gateway returns error in callback", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockError = new Error("Braintree authentication failed");

      global.mockGenerate.mockImplementation((options, callback) => {
        callback(mockError, null); // Error returned via callback
      });

      // ── ACT ──────────────────────────────────────
      await braintreeTokenController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: mockError,
      });
    });

    it("should return 500 when gateway throws synchronous exception", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockError = new Error("Gateway initialization failed");

      global.mockGenerate.mockImplementation(() => {
        throw mockError; // Synchronous exception
      });

      // ── ACT ──────────────────────────────────────
      await braintreeTokenController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: mockError,
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle null response from gateway", async () => {
      // ── ARRANGE ──────────────────────────────────
      global.mockGenerate.mockImplementation((options, callback) => {
        callback(null, null);
      });

      // ── ACT ──────────────────────────────────────
      await braintreeTokenController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith(null);
    });

    it("should handle empty response object from gateway", async () => {
      // ── ARRANGE ──────────────────────────────────
      const emptyResponse = {};

      global.mockGenerate.mockImplementation((options, callback) => {
        callback(null, emptyResponse);
      });

      // ── ACT ──────────────────────────────────────
      await braintreeTokenController(req, res);

      // ── ASSERT ───────────────────────────────────
      expect(res.send).toHaveBeenCalledWith(emptyResponse);
    });
  });
});
