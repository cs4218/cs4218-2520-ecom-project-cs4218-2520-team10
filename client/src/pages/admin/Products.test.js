/*
    Test cases written by: Ong Chang Heng Bertrand A0253013X
*/

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "./Products";

jest.mock("axios");

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}));

// Mock Layout component
jest.mock("../../components/Layout", () => ({ children }) => <div data-testid="layout">{children}</div>);

// Mock AdminMenu component
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Panel</div>);

/*
  Test cases for Products Admin Page:
  1. Happy Path: 2 tests
    a. should display all products when fetched successfully
    b. should display blank page when there are 0 products
  2. Error Handling: 1 test
    a. should display error toast when product/get-product API call fails
  3. Side Effects / API Calls: 1 test
    a. should only call API once on initial mount
  4. Rendering / UI Structure: 3 tests
    a. should render Layout and AdminMenu components
    b. should display product images with correct src and alt
    c. should render product links with correct navigation paths
*/

describe("Products Admin Page", () => {
  const mockProducts = [
    {
      _id: "1",
      name: "Product 1",
      description: "Description 1",
      slug: "product-1",
    },
    {
      _id: "2",
      name: "Product 2",
      description: "Description 2",
      slug: "product-2",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation();
  });

  // ============ HAPPY PATH ============
  describe("Happy Path", () => {
    it("should display all products when fetched successfully", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: mockProducts },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
        expect(screen.getByTestId("product-name-1")).toHaveTextContent(mockProducts[0].name);
        expect(screen.getByTestId("product-description-1")).toHaveTextContent(mockProducts[0].description);
        expect(screen.getByTestId("product-name-2")).toHaveTextContent(mockProducts[1].name);
        expect(screen.getByTestId("product-description-2")).toHaveTextContent(mockProducts[1].description);
      });
    });

    it("should display blank page when there are 0 products", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: [] },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("all-products-title")).toBeInTheDocument();
        expect(screen.queryByTestId("product-link-1")).not.toBeInTheDocument();
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
    it("should display error toast when product/get-product API call fails", async () => {
      axios.get.mockRejectedValueOnce(new Error("Database fetch error"));

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });
    });
  });

  // ============ SIDE EFFECTS / API CALLS ============
  describe("Side Effects / API Calls", () => {
    it("should only call API once on initial mount", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: [] },
      });

      const { rerender } = render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      // Wait for initial API call to complete
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });

      // Rerender should not trigger another API call
      rerender(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ============ RENDERING / UI STRUCTURE ============
  describe("Rendering / UI Structure", () => {
    it("should render Layout and AdminMenu components", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: [] },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("layout")).toBeInTheDocument();
        expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
      });
    });

    it("should display product images with correct src and alt", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: mockProducts },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        const productImage = screen.getByAltText(mockProducts[0].name);
        expect(productImage).toHaveAttribute('src', `/api/v1/product/product-photo/${mockProducts[0]._id}`);
        expect(productImage).toHaveAttribute('alt', mockProducts[0].name);
        const productImage2 = screen.getByAltText(mockProducts[1].name);
        expect(productImage2).toHaveAttribute('src', `/api/v1/product/product-photo/${mockProducts[1]._id}`);
        expect(productImage2).toHaveAttribute('alt', mockProducts[1].name);
      });
    });

    it("should render product links with correct navigation paths", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: mockProducts },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        const productLink = screen.getByTestId(`product-link-${mockProducts[0]._id}`);
        expect(productLink).toHaveAttribute('href', `/dashboard/admin/product/${mockProducts[0].slug}`);
        const productLink2 = screen.getByTestId(`product-link-${mockProducts[1]._id}`);
        expect(productLink2).toHaveAttribute('href', `/dashboard/admin/product/${mockProducts[1].slug}`);
      });
    });
	});
});