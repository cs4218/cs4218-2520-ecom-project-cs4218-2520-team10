/*
    Test cases written by: Ong Chang Heng Bertrand A0253013X
*/

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CategoryProduct from "./CategoryProduct";

jest.mock("axios");

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

// Mock Layout component
jest.mock("../components/Layout", () => ({ children }) => <div>{children}</div>);

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
	__esModule: true,
	default: {
  	success: jest.fn(),
  	error: jest.fn(),
	},
}));

import { useCart } from "../context/cart";

/*
  Test cases for CategoryProduct Page:
  1. Happy Path: 3 tests
    a. should display category name and products when fetched successfully
    b. should add product to cart when 'ADD TO CART' button is clicked
    c. should display message when no products found (0 products)
  2. Error Handling: 2 tests
    a. should handle error when fetching category products
    b. should handle missing category data gracefully
  3. Side Effects / API Calls: 2 tests
    a. should call API with correct slug when component mounts
    b. should re-fetch products when slug changes
  4. Rendering / UI Structure: 2 tests
    a. should render product cards with correct navigation paths
    b. should display product images with correct src and alt
    c. should render product count
*/

describe("CategoryProduct Component", () => {
  let mockNavigate;
	let mockCart;
	let mockSetCart;

  const mockCategory = {
    _id: "cat1",
    name: "Electronics",
    slug: "electronics",
  };

  const mockProduct = {
    _id: "1",
    name: "Product 1",
    description: "Description for product 1",
    price: 100,
    slug: "product-1",
  };

  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    mockCart = [];
    mockSetCart = jest.fn();
    useCart.mockReturnValue([mockCart, mockSetCart]);
  });

  // ============ HAPPY PATH ============
  describe("Happy Path", () => {
    it("should display category name and products when fetched successfully", async () => {
      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: [mockProduct],
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
				expect(screen.getByTestId('category-name')).toHaveTextContent(mockCategory.name);
				expect(screen.getByTestId('product-count')).toHaveTextContent('1');
        expect(screen.getByTestId('product-name-1')).toHaveTextContent(mockProduct.name);
        expect(screen.getByTestId('product-price-1')).toHaveTextContent(mockProduct.price);
        expect(screen.getByTestId('product-description-1')).toHaveTextContent(`${mockProduct.description.substring(0, 60)}...`);
      });
    });

		it("should add product to cart when 'ADD TO CART' button is clicked", async () => {
			useParams.mockReturnValue({ slug: mockCategory.slug });
			axios.get.mockResolvedValueOnce({
				data: {
					category: mockCategory,
					products: [mockProduct],
				},
			});

			render(<CategoryProduct />);

			await waitFor(() => {
				expect(screen.getByTestId('category-name')).toHaveTextContent(`Category - ${mockCategory.name}`);
				expect(screen.getByTestId('product-count')).toHaveTextContent('1');
			});

      fireEvent.click(screen.getByTestId(`add-to-cart-button-${mockProduct._id}`));

			expect(mockSetCart).toHaveBeenCalledWith([mockProduct]);
			expect(mockLocalStorage.setItem).toHaveBeenCalledWith("cart", JSON.stringify([mockProduct]));
			expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
		});

    it("should display message when no products found (0 products)", async () => {
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: [],
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
        expect(screen.getByTestId('product-count')).toHaveTextContent('0');
        expect(screen.queryByTestId('product-name-1')).not.toBeInTheDocument();
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
    it("should handle error when fetching category products", async () => {
      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockRejectedValueOnce(new Error("Failed to fetch products"));

      render(<CategoryProduct />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it("should handle missing category data gracefully", async () => {
      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: null,
          products: [],
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
        expect(screen.getByTestId('category-name')).toBeInTheDocument();
        expect(screen.getByTestId('product-count')).toHaveTextContent('0');
        expect(screen.queryByTestId('product-name-1')).not.toBeInTheDocument();
      });
    });
  });

  // ============ SIDE EFFECTS / API CALLS ============
  describe("Side Effects / API Calls", () => {
    it("should call API with correct slug when component mounts", async () => {
      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: [],
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/product-category/${useParams().slug}`);
      });
    });

    it("should re-fetch products when slug changes", async () => {
      const mockCategory1 = {
        _id: "cat1",
        name: "Electronics",
        slug: "electronics",
      };

      const mockCategory2 = {
        _id: "cat2",
        name: "Books",
        slug: "books",
      };

      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory1,
          products: [],
        },
      });

      const { rerender } = render(<CategoryProduct />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/product-category/${useParams().slug}`);
      });

      // Change slug
      useParams.mockReturnValue({ slug: "books" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory2,
          products: [],
        },
      });

      rerender(<CategoryProduct />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/product-category/${useParams().slug}`);
      });
    });
  });

  // ============ RENDERING / UI STRUCTURE ============
  describe("Rendering / UI Structure", () => {
    it("should render product cards with correct navigation paths", async () => {
      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: [mockProduct],
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
        const moreDetailsButton = screen.getByTestId(`more-details-button-${mockProduct._id}`);
        fireEvent.click(moreDetailsButton);
        expect(mockNavigate).toHaveBeenCalledWith(`/product/${mockProduct.slug}`);
        expect(screen.getByTestId(`add-to-cart-button-${mockProduct._id}`)).toBeInTheDocument();
      });
    });
  });

  it("should display product images with correct src and alt", async () => {
    useParams.mockReturnValue({ slug: "electronics" });
    axios.get.mockResolvedValueOnce({
      data: {
        category: mockCategory,
        products: [mockProduct],
      },
    });

    render(<CategoryProduct />);

    await waitFor(() => {
      const productImage = screen.getByAltText(mockProduct.name);
      expect(productImage).toHaveAttribute('src', `/api/v1/product/product-photo/${mockProduct._id}`);
      expect(productImage).toHaveAttribute('alt', mockProduct.name);
    });
  });

  it("should render product count", async () => {
    useParams.mockReturnValue({ slug: "electronics" });
    axios.get.mockResolvedValueOnce({
      data: {
        category: mockCategory,
        products: [mockProduct],
      },
    });

    render(<CategoryProduct />);

    await waitFor(() => {
      expect(screen.getByTestId('product-count')).toHaveTextContent('1');
    });
  });
});