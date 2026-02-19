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

describe("Products Admin Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============ HAPPY PATH ============
  describe("Happy Path", () => {
    it("should display all products when fetched successfully", async () => {
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
        expect(screen.getByTestId("all-products-title")).toHaveTextContent("All Products List");
        expect(screen.getByTestId("product-name-1")).toHaveTextContent("Product 1");
        expect(screen.getByTestId("product-description-1")).toHaveTextContent("Description 1");
        expect(screen.getByTestId("product-name-2")).toHaveTextContent("Product 2");
        expect(screen.getByTestId("product-description-2")).toHaveTextContent("Description 2");
      });
    });

    it("should display product images with correct src and alt", async () => {
      const mockProducts = [
        {
          _id: "1",
          name: "Test Product",
          description: "Test Description",
          slug: "test-product",
        },
      ];

      axios.get.mockResolvedValueOnce({
        data: { products: mockProducts },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        const productImage = screen.getByAltText("Test Product");
        expect(productImage).toHaveAttribute('src', '/api/v1/product/product-photo/1');
        expect(productImage).toHaveAttribute('alt', 'Test Product');
      });
    });

    it("should render product links with correct navigation paths", async () => {
      const mockProducts = [
        {
          _id: "1",
          name: "Product 1",
          description: "Description 1",
          slug: "product-1",
        },
      ];

      axios.get.mockResolvedValueOnce({
        data: { products: mockProducts },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        const productLink = screen.getByRole('link', { name: /Product 1/i });
        expect(productLink).toHaveAttribute('href', '/dashboard/admin/product/product-1');
      });
    });
  });

  // ============ Equivalence Partitioning ============
  describe("Product List Equivalence Partitioning", () => {
    it("should handle empty product list (0 products)", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: [] },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
				expect(screen.getByTestId("all-products-title")).toHaveTextContent("All Products List");
        expect(screen.queryByRole('link', { name: /Product/i })).not.toBeInTheDocument();
			});
    });

    it("should display multiple products (At least 1 product)", async () => {
      const mockProducts = Array.from({ length: 12 }, (_, i) => ({
        _id: `${i + 1}`,
        name: `Product ${i + 1}`,
        description: `Description ${i + 1}`,
        slug: `product-${i + 1}`,
      }));

      axios.get.mockResolvedValueOnce({
        data: { products: mockProducts },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
				expect(screen.getByTestId("all-products-title")).toHaveTextContent("All Products List");
				expect(screen.getByTestId("product-name-1")).toHaveTextContent("Product 1");
				expect(screen.getByTestId("product-name-12")).toHaveTextContent("Product 12");
        expect(screen.getAllByRole('link')).toHaveLength(12);
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
    it("should display error toast when product/get-product API call fails", async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      axios.get.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Something Went Wrong");
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleLogSpy.mockRestore();
    });

    it("should handle invalid products data gracefully", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: null },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("all-products-title")).toHaveTextContent("All Products List");
        expect(screen.queryByRole("link")).not.toBeInTheDocument();
      });
    });
  });

  // ============ SIDE EFFECTS / API CALLS ============
  describe("Side Effects / API Calls", () => {
    it("should call API to fetch products on mount", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: [] },
      });

      render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
        expect(axios.get).toHaveBeenCalledTimes(1);
      });
    });

    it("should only call API once on initial mount", async () => {
      axios.get.mockResolvedValueOnce({
        data: { products: [] },
      });

      const { rerender } = render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });

      // Rerender should not trigger another API call
      rerender(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      expect(axios.get).toHaveBeenCalledTimes(1);
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

    it("should render product cards with correct structure", async () => {
      const mockProducts = [
        {
          _id: "1",
          name: "Test Product",
          description: "Test Description",
          slug: "test-product",
        },
      ];

      axios.get.mockResolvedValueOnce({
        data: { products: mockProducts },
      });

      const { container } = render(
        <MemoryRouter>
          <Products />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(container.querySelector('.card')).toBeInTheDocument();
        expect(container.querySelector('.card-body')).toBeInTheDocument();
        expect(container.querySelector('.card-title')).toBeInTheDocument();
        expect(container.querySelector('.card-text')).toBeInTheDocument();
        expect(container.querySelector('.card-img-top')).toBeInTheDocument();
      });
    });
	});
});