// File & Tests Created - Shaun Lee Xuan Wei A0252626E
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Integration Tests: CreateCategory ↔ CategoryForm
 *
 * Test Strategy: Integration-based testing with real CategoryForm component and real antd Modal, mocked axios
 *
 * Components Under Test:
 * - pages/admin/CreateCategory.js (manages category state, API calls, Modal visibility)
 * - components/Form/CategoryForm.js (real form input + submit button wired to CreateCategory handlers)
 *
 * Test Doubles Used:
 * - axios mocked (external HTTP dependency — no real network calls)
 * - react-hot-toast mocked (side-effect UI library — not under test)
 * - Layout mocked (UI shell, not under test)
 * - AdminMenu mocked (UI sidebar, not under test)
 * - CategoryForm is REAL (integration point being tested)
 * - antd Modal is REAL (integration point being tested)
 *
 * Key distinction from unit tests (CreateCategory.test.js):
 * Unit tests mock CategoryForm with test-id stubs, isolating CreateCategory logic.
 * These integration tests exercise the real CategoryForm input and submit button,
 * verifying the prop wiring between CreateCategory and CategoryForm is correct.
 *
 * Scenario Plan:
 * #  | Scenario                                   | Setup                                            | Expected Result
 * ---|--------------------------------------------|-------------------------------------------------|------------------------------------------
 * 1  | Create new category via real CategoryForm  | Type name in real input, click real Submit       | POST called with correct name, list refreshes with new category
 * 2  | Edit category via Modal and CategoryForm   | Click Edit, change name in modal, click Submit   | PUT called with new name, list refreshes with updated name
 * 3  | Delete category                            | Click Delete on a category                       | DELETE called with correct id, list refreshes without deleted category
 */

import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "../../src/pages/admin/CreateCategory";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock("../../src/components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../src/components/AdminMenu", () => () => <div />);

describe("FE-INT-10: CreateCategory ↔ CategoryForm (Real Child Component)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderCreateCategory = () =>
    render(
      <MemoryRouter>
        <CreateCategory />
      </MemoryRouter>
    );

  describe("Test 1: Create new category via real CategoryForm", () => {
    it("should call create API with the correct name and refresh the list", async () => {
      // ── ARRANGE ──────────────────────────────────
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });
      axios.post.mockResolvedValueOnce({ data: { success: true } });
      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          category: [{ _id: "1", name: "Electronics" }],
        },
      });

      renderCreateCategory();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // ── ACT ──────────────────────────────────────
      fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
        target: { value: "Electronics" },
      });
      fireEvent.click(screen.getByRole("button", { name: /submit/i }));

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/category/create-category",
          { name: "Electronics" }
        );
        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(toast.success).toHaveBeenCalledWith("Electronics is created");
        expect(screen.getByText("Electronics")).toBeInTheDocument();
      });
    });
  });

  describe("Test 2: Edit category via Modal and real CategoryForm", () => {
    it("should call update API with new name and refresh the list", async () => {
      // ── ARRANGE ──────────────────────────────────
      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          category: [{ _id: "1", name: "Electronics" }],
        },
      });
      axios.put.mockResolvedValueOnce({ data: { success: true } });
      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          category: [{ _id: "1", name: "Gadgets" }],
        },
      });

      renderCreateCategory();
      await screen.findByText("Electronics");

      // ── ACT ──────────────────────────────────────
      fireEvent.click(screen.getByRole("button", { name: /edit/i }));

      const dialog = await screen.findByRole("dialog");
      const modalInput = within(dialog).getByPlaceholderText("Enter new category");
      fireEvent.change(modalInput, { target: { value: "Gadgets" } });
      fireEvent.click(within(dialog).getByRole("button", { name: /submit/i }));

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          "/api/v1/category/update-category/1",
          { name: "Gadgets" }
        );
        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(toast.success).toHaveBeenCalledWith("Gadgets is updated");
        expect(screen.getByText("Gadgets")).toBeInTheDocument();
        expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
      });
    });
  });

  describe("Test 3: Delete category", () => {
    it("should call delete API and remove category from the list", async () => {
      // ── ARRANGE ──────────────────────────────────
      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          category: [
            { _id: "1", name: "Electronics" },
            { _id: "2", name: "Clothing" },
          ],
        },
      });
      axios.delete.mockResolvedValueOnce({ data: { success: true } });
      axios.get.mockResolvedValueOnce({
        data: {
          success: true,
          category: [{ _id: "2", name: "Clothing" }],
        },
      });

      renderCreateCategory();
      await screen.findByText("Electronics");

      // ── ACT ──────────────────────────────────────
      const rows = screen.getAllByRole("row");
      const electronicsRow = rows[1];
      fireEvent.click(within(electronicsRow).getByRole("button", { name: /delete/i }));

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/v1/category/delete-category/1"
        );
        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(toast.success).toHaveBeenCalledWith("Electronics is deleted");
        expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
        expect(screen.getByText("Clothing")).toBeInTheDocument();
      });
    });
  });
});
