// File & Tests Created - Shaun Lee Xuan Wei A0252626E
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Integration Tests: Header ↔ useCategory ↔ AuthContext ↔ CartContext
 *
 * Test Strategy: Integration-based testing with real hooks and contexts, mocked axios
 *
 * Components Under Test:
 * - components/Header.js (renders nav with categories, cart badge, auth-conditional links)
 * - hooks/useCategory.js (fetches categories via axios, provides categories to Header)
 * - context/auth.js (AuthProvider/useAuth — provides auth state initialized from localStorage)
 * - context/cart.js (CartProvider/useCart — provides cart state initialized from localStorage)
 *
 * Test Doubles Used:
 * - axios mocked (external HTTP dependency — no real network calls)
 * - react-hot-toast mocked (side-effect UI library — not under test)
 * - SearchInput component mocked (UI subcomponent, not under test)
 * - localStorage pre-seeded per test (to inject auth and cart state into real context providers)
 * - AuthProvider and CartProvider are REAL (integration points being tested)
 * - useCategory hook is REAL (integration point being tested)
 *
 * Scenario Plan:
 * #  | Scenario                                         | Setup                             | Expected Result
 * ---|--------------------------------------------------|-----------------------------------|------------------------------------------
 * 1  | Header renders category dropdown from real hook  | axios resolves with 3 categories  | Dropdown links with correct names and hrefs
 * 2  | Header renders no category links when empty      | axios resolves with empty array   | Only "All Categories" link in dropdown, no category-specific links
 * 3  | Header handles API error from useCategory        | axios rejects with error          | Header renders without crashing, no category links, toast.error called with error message
 * 4  | Header cart badge shows 0 when cart is empty     | no cart in localStorage           | Badge displays count of 0
 * 5  | Header cart badge reflects cart count            | localStorage cart has 3 items     | Badge displays count of 3
 * 6  | Header shows admin dashboard link                | auth.user.role = 1                | Dashboard link href = /dashboard/admin
 * 7  | Header shows user dashboard link                 | auth.user.role = 0                | Dashboard link href = /dashboard/user
 * 8  | Header shows Register and Login when logged out  | no auth in localStorage           | Register and Login links visible, Dashboard link absent
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Header from "../../src/components/Header";
import { AuthProvider } from "../../src/context/auth";
import { CartProvider } from "../../src/context/cart";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../src/components/Form/SearchInput", () => () => (
  <div data-testid="search-input" />
));

describe("FE-INT-7: Header ↔ useCategory ↔ AuthContext ↔ CartContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderHeader = () =>
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AuthProvider>
          <CartProvider>
            <Header />
          </CartProvider>
        </AuthProvider>
      </MemoryRouter>
    );

  describe("Test 1: Header renders category dropdown from real useCategory hook", () => {
    it("should render category dropdown links with correct names and hrefs", async () => {
      // ── ARRANGE ──────────────────────────────────
      const mockCategories = [
        { _id: "1", name: "Electronics", slug: "electronics" },
        { _id: "2", name: "Clothing", slug: "clothing" },
        { _id: "3", name: "Sports", slug: "sports" },
      ];
      axios.get.mockResolvedValueOnce({
        data: { category: mockCategories },
      });

      // ── ACT ──────────────────────────────────────
      renderHeader();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");

        mockCategories.forEach((category) => {
          const link = screen.getByText(category.name);
          expect(link).toBeInTheDocument();
          expect(link).toHaveAttribute("href", `/category/${category.slug}`);
        });
      });
    });
  });

  describe("Test 2: Header renders no category links when API returns empty array", () => {
    it("should render only the All Categories link with no category-specific links", async () => {
      // ── ARRANGE ──────────────────────────────────
      axios.get.mockResolvedValueOnce({ data: { category: [] } });

      // ── ACT ──────────────────────────────────────
      renderHeader();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
      });

      const allCategoriesLink = screen.getByText("All Categories");
      expect(allCategoriesLink).toHaveAttribute("href", "/categories");

      const categoryLinks = screen
        .queryAllByRole("link")
        .filter((link) => link.getAttribute("href")?.startsWith("/category/"));
      expect(categoryLinks).toHaveLength(0);
    });
  });

  describe("Test 3: Header handles API error from useCategory hook", () => {
    it("should render without crashing, show no category links, and call toast.error with the error message", async () => {
      // ── ARRANGE ──────────────────────────────────
      const error = new Error("Network Error");
      axios.get.mockRejectedValueOnce(error);

      // ── ACT ──────────────────────────────────────
      renderHeader();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        expect(toast.error).toHaveBeenCalledWith("Network Error");
      });

      const categoryLinks = screen
        .queryAllByRole("link")
        .filter((link) => link.getAttribute("href")?.startsWith("/category/"));
      expect(categoryLinks).toHaveLength(0);
    });
  });

  describe("Test 4: Header cart badge shows 0 when cart is empty", () => {
    it("should display badge count of 0 when no cart exists in localStorage", async () => {
      // ── ARRANGE ──────────────────────────────────
      // localStorage is already cleared in beforeEach — no cart set
      axios.get.mockResolvedValueOnce({ data: { category: [] } });

      // ── ACT ──────────────────────────────────────
      renderHeader();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(screen.getByText("0")).toBeInTheDocument();
      });
    });
  });

  describe("Test 5: Header cart badge reflects cart count", () => {
    it("should display badge count matching the number of items in cart", async () => {
      // ── ARRANGE ──────────────────────────────────
      const cartItems = [
        { _id: "p1", name: "Item 1", price: 10 },
        { _id: "p2", name: "Item 2", price: 20 },
        { _id: "p3", name: "Item 3", price: 30 },
      ];
      localStorage.setItem("cart", JSON.stringify(cartItems));
      axios.get.mockResolvedValueOnce({ data: { category: [] } });

      // ── ACT ──────────────────────────────────────
      renderHeader();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
      });
    });
  });

  describe("Test 6: Header shows admin dashboard link for admin user", () => {
    it("should render dashboard link pointing to /dashboard/admin when role is 1", async () => {
      // ── ARRANGE ──────────────────────────────────
      const adminAuth = {
        user: { name: "Admin User", role: 1, email: "admin@test.com" },
        token: "admin-token",
      };
      localStorage.setItem("auth", JSON.stringify(adminAuth));
      axios.get.mockResolvedValueOnce({ data: { category: [] } });

      // ── ACT ──────────────────────────────────────
      renderHeader();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        const dashboardLink = screen.getByText("Dashboard");
        expect(dashboardLink).toBeInTheDocument();
        expect(dashboardLink).toHaveAttribute("href", "/dashboard/admin");
      });
    });
  });

  describe("Test 7: Header shows user dashboard link for regular user", () => {
    it("should render dashboard link pointing to /dashboard/user when role is 0", async () => {
      // ── ARRANGE ──────────────────────────────────
      const userAuth = {
        user: { name: "Regular User", role: 0, email: "user@test.com" },
        token: "user-token",
      };
      localStorage.setItem("auth", JSON.stringify(userAuth));
      axios.get.mockResolvedValueOnce({ data: { category: [] } });

      // ── ACT ──────────────────────────────────────
      renderHeader();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        const dashboardLink = screen.getByText("Dashboard");
        expect(dashboardLink).toBeInTheDocument();
        expect(dashboardLink).toHaveAttribute("href", "/dashboard/user");
      });
    });
  });

  describe("Test 8: Header shows Register and Login links when user is not logged in", () => {
    it("should render Register and Login links and no Dashboard link when auth.user is null", async () => {
      // ── ARRANGE ──────────────────────────────────
      // localStorage is already cleared in beforeEach — no auth set
      axios.get.mockResolvedValueOnce({ data: { category: [] } });

      // ── ACT ──────────────────────────────────────
      renderHeader();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(screen.getByText("Register")).toBeInTheDocument();
        expect(screen.getByText("Login")).toBeInTheDocument();
        expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
      });
    });
  });
});
