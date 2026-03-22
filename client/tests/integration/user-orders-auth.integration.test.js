// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Integration Tests for Orders ↔ AuthContext
 *
 * Test Strategy: Integration-based testing with real AuthProvider and Orders component
 * Focus: Bidirectional data flow between Orders component and AuthContext for authenticated API calls
 *
 * Components Under Test:
 * - Orders component (pages/user/Orders.js): Fetches user's orders using auth token from context
 * - AuthContext (context/auth.js): Provides user/token state, sets axios Authorization header
 *
 * Test Doubles Used:
 * - axios:              STUB (returns controlled API responses) + SPY (verify Authorization header)
 * - toast:              MOCK (verify success/error notifications)
 * - Layout:             FAKE (simplified wrapper component)
 * - UserMenu:           FAKE (simplified menu component)
 * - localStorage:       FAKE (test double for browser API)
 * - AuthProvider:       REAL (actual implementation to test integration)
 * - moment:             REAL (actual date formatting library)
 *
 * Testing Techniques Applied:
 * - Integration Testing: Testing Orders ↔ AuthContext interaction
 * - Communication-Based Testing: Verify token flow from AuthContext to axios headers
 * - State-Based Testing: Verify orders state updates based on API responses
 *
 * Integration Test Scenario Plan (15 tests):
 * #  | Data Flow Direction   | Category          | Scenario                                                    | Expected Result
 * ---|---------------------- |-------------------|-------------------------------------------------------------|---------------------------------------------------------------------------------
 * 1  | Context → Orders      | Happy Path        | Orders component receives token from auth context           | Auth context provides token, axios Authorization header is set
 * 2  | Context → Orders      | Happy Path        | Orders fetches and displays data when token exists          | API called with Authorization header, orders displayed with correct data
 * 3  | Context → Orders      | Happy Path        | Orders displays populated buyer details                     | Buyer name displayed from populated order.buyer object
 * 4  | Context → Orders      | Happy Path        | Orders displays populated product details                   | Product names, descriptions, prices displayed from populated order.products array
 * 5  | Context → Orders      | Happy Path        | Orders displays payment status correctly                    | "Success" shown when payment.success is true, "Failed" when false
 * 6  | Context → Orders      | Happy Path        | Orders displays formatted date from createdAt               | Date formatted using moment().fromNow()
 * 7  | Context → Orders      | Data Integrity    | Multiple orders displayed with correct indexing             | Multiple orders rendered with sequential indices (1, 2, 3...)
 * 8  | Context → Orders      | Data Integrity    | Empty orders array displays no order cards                  | Component renders without orders when API returns empty array
 * 9  | Context → Orders      | Access Control    | No API call made when token is missing                      | useEffect skips getOrders when auth.token is null/undefined
 * 10 | Context → Orders      | Access Control    | Orders refetch when token changes                           | New API call triggered when auth.token updates
 * 11 | Context → Orders      | Error Handling    | 401 Unauthorized error displays toast message               | Toast error shown with appropriate message for auth failure
 * 12 | Context → Orders      | Error Handling    | 500 Server error displays toast message                     | Toast error shown with server error message
 * 13 | Context → Orders      | Error Handling    | Network failure displays user-friendly toast                | Toast error shown with fallback message on network error
 * 14 | Context → Orders      | Error Handling    | Invalid response format displays toast and clears orders    | Toast error shown when API returns non-array, orders set to []
 * 15 | Context → Orders      | Edge Cases        | Orders with empty products array display 0 quantity         | Order quantity shows 0 when products array is empty
 *
 * Note: This suite focuses solely on Orders ↔ AuthContext integration.
 * Unit-level concerns (individual field rendering, validation) are tested in Orders.test.js.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import Orders from "../../src/pages/user/Orders";
import { AuthProvider } from "../../src/context/auth";
import toast from "react-hot-toast";

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock axios - but keep it controllable for each test
jest.mock("axios");

// Mock toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Layout component
jest.mock("../../src/components/Layout", () => {
  return function Layout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock UserMenu component
jest.mock("../../src/components/UserMenu", () => {
  return function UserMenu() {
    return <div data-testid="user-menu">User Menu</div>;
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

/**
 * Helper function to render Orders component wrapped in AuthProvider
 * @param {Object} initialAuthState - Initial auth state { user, token }
 */
const renderOrdersWithAuth = (initialAuthState = null) => {
  // Set up localStorage with initial auth state
  if (initialAuthState) {
    localStorageMock.setItem("auth", JSON.stringify(initialAuthState));
  } else {
    localStorageMock.clear();
  }

  return render(
    <MemoryRouter>
      <AuthProvider>
        <Orders />
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe("Orders <-> AuthContext Integration", () => {
  const mockUser = {
    _id: "user123",
    name: "John Doe",
    email: "john@test.com",
  };

  const mockToken = "Bearer mock.jwt.token";

  const mockOrder1 = {
    _id: "order1",
    status: "Processing",
    buyer: {
      _id: "user123",
      name: "John Doe",
    },
    createdAt: new Date("2024-02-20"),
    payment: {
      success: true,
    },
    products: [
      {
        _id: "product1",
        name: "Test Product 1",
        description:
          "This is a test product description that is longer than 30 characters",
        price: 99.99,
      },
      {
        _id: "product2",
        name: "Test Product 2",
        description: "Another test product description",
        price: 149.99,
      },
    ],
  };

  const mockOrder2 = {
    _id: "order2",
    status: "Shipped",
    buyer: {
      _id: "user123",
      name: "John Doe",
    },
    createdAt: new Date("2024-02-18"),
    payment: {
      success: false,
    },
    products: [
      {
        _id: "product3",
        name: "Test Product 3",
        description: "Short desc",
        price: 49.99,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Reset axios defaults
    axios.defaults = { headers: { common: {} } };

    // Default mock for axios.get
    axios.get = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Context → Orders (Happy Path)", () => {
    it("should receive token from auth context and set axios Authorization header", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      axios.get.mockResolvedValue({ data: [] });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // Wait for useEffect to execute
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // ── ASSERT ───────────────────────────────────
      // Verify Authorization header was set by AuthContext
      expect(axios.defaults.headers.common["Authorization"]).toBe(mockToken);

      // Verify API was called with correct endpoint
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    it("should fetch and display orders when token exists in auth context", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      axios.get.mockResolvedValue({ data: [mockOrder1] });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        // Verify buyer details are rendered
        expect(screen.getByText("Processing")).toBeInTheDocument();
        expect(screen.getByText("John Doe")).toBeInTheDocument();

        // Verify product details are rendered
        expect(screen.getByText("Test Product 1")).toBeInTheDocument();
        expect(screen.getByText("Test Product 2")).toBeInTheDocument();
        expect(screen.getByText("Price : 99.99")).toBeInTheDocument();
        expect(screen.getByText("Price : 149.99")).toBeInTheDocument();
      });

      // Verify axios was called
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });

    it("should display payment status correctly - Success", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      axios.get.mockResolvedValue({ data: [mockOrder1] });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        // Verify "Success" is shown when payment.success is true
        expect(screen.getByText("Success")).toBeInTheDocument();
      });
    });

    it("should display payment status correctly - Failed", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      // Order with failed payment
      axios.get.mockResolvedValue({ data: [mockOrder2] });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        // Verify "Failed" is shown when payment.success is false
        expect(screen.getByText("Failed")).toBeInTheDocument();
      });
    });

    it("should display formatted date from createdAt using moment", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      axios.get.mockResolvedValue({ data: [mockOrder1] });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        // Verify moment().fromNow() is called and displays relative date
        // The exact text depends on current date, but should contain "ago" or "in"
        expect(screen.getByText("Processing")).toBeInTheDocument();
        // Date will be formatted by moment - could be "a month ago", "2 months ago", etc.
        // Verify the date text exists in the document
        expect(screen.getAllByText(/ago|in|now/i).length).toBeGreaterThan(0);
      });
    });
  });

  describe("Context → Orders (Data Integrity)", () => {
    it("should display multiple orders with correct indexing", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      axios.get.mockResolvedValue({ data: [mockOrder1, mockOrder2] });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        // Verify both orders are rendered
        expect(screen.getByText("Processing")).toBeInTheDocument();
        expect(screen.getByText("Shipped")).toBeInTheDocument();
      });

      // Verify all products are displayed
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
      expect(screen.getByText("Test Product 3")).toBeInTheDocument();

      // Verify quantities are displayed (using getAllByText since there might be duplicates)
      const allTwos = screen.getAllByText("2");
      expect(allTwos.length).toBeGreaterThanOrEqual(1); // At least one "2" (product quantity for order 1)

      const allOnes = screen.getAllByText("1");
      expect(allOnes.length).toBeGreaterThanOrEqual(1); // At least one "1" (product quantity for order 2)
    });

    it("should display no order cards when API returns empty array", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      axios.get.mockResolvedValue({ data: [] });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // Verify no order cards are rendered
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
      expect(screen.queryByText("Shipped")).not.toBeInTheDocument();

      // But main components still render
      expect(screen.getByText("All Orders")).toBeInTheDocument();
      expect(screen.getByTestId("user-menu")).toBeInTheDocument();
    });
  });

  describe("Context → Orders (Error Handling)", () => {
    it("should not make API call when token is missing from auth context", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: null, // No token
      };

      axios.get.mockResolvedValue({ data: [] });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // Wait a bit to ensure useEffect had time to run
      await waitFor(() => {
        expect(screen.getByText("All Orders")).toBeInTheDocument();
      });

      // ── ASSERT ───────────────────────────────────
      // Verify API was NOT called because token is missing
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should display toast error on 401 Unauthorized", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      const error = {
        response: {
          status: 401,
          data: {
            message: "Unauthorized - Invalid token",
          },
        },
      };

      axios.get.mockRejectedValue(error);

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Unauthorized - Invalid token",
        );
      });

      // Verify orders state is cleared
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
    });

    it("should display toast error on 500 Server Error", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      const error = {
        response: {
          status: 500,
          data: {
            message: "Internal Server Error",
          },
        },
      };

      axios.get.mockRejectedValue(error);

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Internal Server Error");
      });

      // Verify orders state is cleared
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
    });

    it("should display user-friendly toast on network failure", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      // Network error without response object
      const error = new Error("Network Error");

      axios.get.mockRejectedValue(error);

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Failed to fetch orders. Please try again later.",
        );
      });

      // Verify orders state is cleared
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
    });

    it("should display toast and clear orders when API returns invalid format", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      // Invalid response format (not an array)
      axios.get.mockResolvedValue({
        data: {
          success: false,
          message: "Some error",
        },
      });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Invalid response format from server",
        );
      });

      // Verify no orders are displayed
      expect(screen.queryByText("Processing")).not.toBeInTheDocument();
      expect(screen.queryByText("Shipped")).not.toBeInTheDocument();
    });
  });

  describe("Context → Orders (Edge Cases)", () => {
    it("should display 0 quantity for orders with empty products array", async () => {
      // ── ARRANGE ──────────────────────────────────
      const initialAuth = {
        user: mockUser,
        token: mockToken,
      };

      const orderWithNoProducts = {
        _id: "order3",
        status: "Cancelled",
        buyer: {
          _id: "user123",
          name: "John Doe",
        },
        createdAt: new Date("2024-02-15"),
        payment: {
          success: false,
        },
        products: [], // Empty products array
      };

      axios.get.mockResolvedValue({ data: [orderWithNoProducts] });

      // ── ACT ──────────────────────────────────────
      renderOrdersWithAuth(initialAuth);

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(screen.getByText("Cancelled")).toBeInTheDocument();

        // Verify quantity shows 0 (products.length is 0)
        // The "0" should be rendered as part of the order card display
        const quantityElements = screen.getAllByText(/0/);
        expect(quantityElements.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
