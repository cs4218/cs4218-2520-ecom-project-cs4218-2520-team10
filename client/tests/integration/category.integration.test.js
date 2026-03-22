// File & Tests Created - Shaun Lee Xuan Wei A0252626E
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Integration Tests: Categories Page ↔ useCategory Hook
 *
 * Test Strategy: Integration-based testing with real hook, mocked axios
 *
 * Components Under Test:
 * - pages/Categories.js (renders category list from hook data)
 * - hooks/useCategory.js (fetches categories via axios, manages loading/error state)
 *
 * Test Doubles Used:
 * - axios mocked (external HTTP dependency — no real network calls)
 * - react-hot-toast mocked (side-effect UI library — assert calls instead)
 * - Layout component mocked (UI shell, not under test)
 * - useCategory hook is REAL (integration point being tested)
 *
 * Scenario Plan:
 * #  | Scenario                                    | axios.get behaviour          | Expected Result
 * ---|---------------------------------------------|------------------------------|------------------------------------------
 * 1  | Categories page renders from real hook       | Resolves with categories     | Category links with correct names and hrefs, toast.error not called
 * 2  | Categories page handles empty categories     | Resolves with empty array    | No links rendered, toast.error not called
 * 3  | Categories page handles API error            | Rejects with error           | Page renders without crashing, no links shown, toast.error called with error message
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Categories from "../../src/pages/Categories";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
}));

jest.mock("../../src/components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <h2>{title}</h2>
    {children}
  </div>
));

describe("FE-INT-6: Categories Page ↔ useCategory Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderCategories = () =>
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <Routes>
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </MemoryRouter>
    );

  describe("Test 1: Categories page renders from real useCategory hook", () => {
    it("should render category links with correct names and hrefs", async () => {
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
      renderCategories();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");

        const links = screen.queryAllByRole("link");
        expect(links).toHaveLength(mockCategories.length);

        mockCategories.forEach((category) => {
          const link = screen.getByText(category.name);
          expect(link).toBeInTheDocument();
          expect(link).toHaveAttribute("href", `/category/${category.slug}`);
        });

        expect(toast.error).not.toHaveBeenCalled();
      });
    });
  });

  describe("Test 2: Categories page handles empty categories", () => {
    it("should render no links when API returns empty array", async () => {
      // ── ARRANGE ──────────────────────────────────
      axios.get.mockResolvedValueOnce({
        data: { category: [] },
      });

      // ── ACT ──────────────────────────────────────
      renderCategories();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        expect(toast.error).not.toHaveBeenCalled();
      });

      const links = screen.queryAllByRole("link");
      expect(links).toHaveLength(0);
    });
  });

  describe("Test 3: Categories page handles API error", () => {
    it("should render without crashing and show no category links", async () => {
      // ── ARRANGE ──────────────────────────────────
      const error = new Error("Network Error");
      axios.get.mockRejectedValueOnce(error);

      // ── ACT ──────────────────────────────────────
      renderCategories();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        expect(toast.error).toHaveBeenCalledWith("Network Error");
      });

      const links = screen.queryAllByRole("link");
      expect(links).toHaveLength(0);
    });
  });
});
