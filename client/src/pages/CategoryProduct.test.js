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

describe("CategoryProduct Component", () => {
  let mockNavigate;
	let mockCart;
	let mockSetCart;

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
      const mockCategory = {
        _id: "cat1",
        name: "Electronics",
        slug: "electronics",
      };

      const mockProduct = [
        {
          _id: "1",
          name: "Product 1",
          description: "Description for product 1",
          price: 100,
          slug: "product-1",
        },
      ];

      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: mockProduct,
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
				expect(screen.getByTestId('category-name')).toHaveTextContent('Category - Electronics');
				expect(screen.getByTestId('product-count')).toHaveTextContent('1 result found');
        expect(screen.getByTestId('product-name-1')).toHaveTextContent('Product 1');
        expect(screen.getByTestId('product-price-1')).toHaveTextContent('$100.00');
      });
    });

    it("should display product images with correct src", async () => {
      const mockCategory = {
        _id: "cat1",
        name: "Electronics",
        slug: "electronics",
      };

      const mockProducts = [
        {
          _id: "1",
          name: "Product 1",
          description: "Description for product 1",
          price: 100,
          slug: "product-1",
        },
      ];

      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: mockProducts,
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
				const productImage = screen.getByRole('img', { name: /Product 1/i });
        expect(productImage).toHaveAttribute('src', '/api/v1/product/product-photo/1');
				expect(productImage).toHaveAttribute('alt', 'Product 1');
      });
    });

		it("should add product to cart when 'ADD TO CART' button is clicked", async () => {
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

			useParams.mockReturnValue({ slug: "electronics" });
			axios.get.mockResolvedValueOnce({
				data: {
					category: mockCategory,
					products: [mockProduct],
				},
			});

			render(<CategoryProduct />);

			await waitFor(() => {
				expect(screen.getByTestId('category-name')).toHaveTextContent('Category - Electronics');
				expect(screen.getByTestId('product-count')).toHaveTextContent('1 result found');
			});

			fireEvent.click(screen.getByRole('button', { name: /ADD TO CART/i }));

			expect(mockSetCart).toHaveBeenCalledWith([mockProduct]);
			expect(mockLocalStorage.setItem).toHaveBeenCalledWith("cart", JSON.stringify([mockProduct]));
			expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
		});
});

  // ============ EQUIVALENCE PARTITIONING ============
  describe("Equivalence Partitioning", () => {
    describe("Product Count Boundaries", () => {
      it("should display message when no products found (0 products)", async () => {
        const mockCategory = {
          _id: "cat1",
          name: "Empty Category",
          slug: "empty-category",
        };

        useParams.mockReturnValue({ slug: "empty-category" });
        axios.get.mockResolvedValueOnce({
          data: {
            category: mockCategory,
            products: [],
          },
        });

        render(<CategoryProduct />);

        await waitFor(() => {
					expect(screen.getByTestId('category-name')).toHaveTextContent('Category - Empty Category');
          expect(screen.getByTestId('product-count')).toHaveTextContent('0 result found');
        });
      });

      it("should display multiple products (At least 1 product)", async () => {
        const mockCategory = {
          _id: "cat1",
          name: "Electronics",
          slug: "electronics",
        };

        const mockProducts = Array.from({ length: 12 }, (_, i) => ({
          _id: `${i + 1}`,
          name: `Product ${i + 1}`,
          description: `Description ${i + 1}`,
          price: 100 + i * 10,
          slug: `product-${i + 1}`,
        }));

        useParams.mockReturnValue({ slug: "electronics" });
        axios.get.mockResolvedValueOnce({
          data: {
            category: mockCategory,
            products: mockProducts,
          },
        });

        render(<CategoryProduct />);

        await waitFor(() => {
          expect(screen.getByText(/12 result found/i)).toBeInTheDocument();
          expect(screen.getByTestId('product-name-1')).toHaveTextContent('Product 1');
        	expect(screen.getByTestId('product-name-12')).toHaveTextContent('Product 12');
        });
      });
    });

    describe("Description Length Equivalence Partitioning", () => {
			it("should truncate long description to 60 characters", async () => {
				const mockCategory = {
					_id: "cat1",
					name: "Electronics",
					slug: "electronics",
				};

				const mockProducts = [
					{
						_id: "1",
						name: "Product 1",
						description: "This is a very long description that exceeds sixty characters and should be truncated",
						price: 100,
						slug: "product-1",
					},
				];

				useParams.mockReturnValue({ slug: "electronics" });
				axios.get.mockResolvedValueOnce({
					data: {
						category: mockCategory,
						products: mockProducts,
					},
				});

				render(<CategoryProduct />);

				await waitFor(() => {
					expect(screen.getByTestId('product-description-1')).toHaveTextContent('This is a very long description that exceeds sixty character...');
				});
			});

      it("should display short description without truncation (<60 chars)", async () => {
        const mockCategory = {
          _id: "cat1",
          name: "Electronics",
          slug: "electronics",
        };

        const mockProducts = [
          {
            _id: "1",
            name: "Product 1",
            description: "Short description",
            price: 100,
            slug: "product-1",
          },
        ];

        useParams.mockReturnValue({ slug: "electronics" });
        axios.get.mockResolvedValueOnce({
          data: {
            category: mockCategory,
            products: mockProducts,
          },
        });

        render(<CategoryProduct />);

        await waitFor(() => {
					expect(screen.getByTestId('product-description-1')).toHaveTextContent('Short description');
        });
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
    it("should handle error when fetching category products", async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockRejectedValueOnce(new Error("Failed to fetch products"));

      render(<CategoryProduct />);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleLogSpy.mockRestore();
    });

    it("should handle undefined params.slug gracefully", async () => {
      useParams.mockReturnValue({ slug: undefined });

      render(<CategoryProduct />);

      // Should not make API call if slug is undefined
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should handle empty string params.slug", async () => {
      useParams.mockReturnValue({ slug: "" });

      render(<CategoryProduct />);

      // Should not make API call if slug is empty
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should handle null params.slug", async () => {
      useParams.mockReturnValue({ slug: null });

      render(<CategoryProduct />);

      // Should not make API call if slug is null
      expect(axios.get).not.toHaveBeenCalled();
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
        expect(screen.getByText(/Category -/i)).toBeInTheDocument();
        expect(screen.getByText(/0 result found/i)).toBeInTheDocument();
      });
    });
  });

  // ============ USER INTERACTIONS ============
  describe("User Interactions", () => {
    it("should navigate to product details when 'More Details' button is clicked", async () => {
      const mockCategory = {
        _id: "cat1",
        name: "Electronics",
        slug: "electronics",
      };

      const mockProducts = [
        {
          _id: "1",
          name: "Product 1",
          description: "Description for product 1",
          price: 100,
          slug: "product-1",
        },
      ];

      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: mockProducts,
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
        const moreDetailsButton = screen.getByRole('button', { name: /More Details/i });
        fireEvent.click(moreDetailsButton);
        expect(mockNavigate).toHaveBeenCalledWith("/product/product-1");
      });
    });
  });

  // ============ SIDE EFFECTS / API CALLS ============
  describe("Side Effects / API Calls", () => {
    it("should call API with correct slug when component mounts", async () => {
      const mockCategory = {
        _id: "cat1",
        name: "Electronics",
        slug: "electronics",
      };

      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: [],
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-category/electronics");
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
        expect(screen.getByText(/Category - Electronics/i)).toBeInTheDocument();
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
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-category/books");
      });
    });
  });

  // ============ RENDERING / UI STRUCTURE ============
  describe("Rendering / UI Structure", () => {
    it("should render Layout component", async () => {
      const mockCategory = {
        _id: "cat1",
        name: "Electronics",
        slug: "electronics",
      };

      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: [],
        },
      });

      const { container } = render(<CategoryProduct />);

      await waitFor(() => {
        expect(container.querySelector('.container.mt-3.category')).toBeInTheDocument();
      });
    });

    it("should render product cards with correct structure", async () => {
      const mockCategory = {
        _id: "cat1",
        name: "Electronics",
        slug: "electronics",
      };

      const mockProducts = [
        {
          _id: "1",
          name: "Product 1",
          description: "Description 1",
          price: 100,
          slug: "product-1",
        },
      ];

      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: mockProducts,
        },
      });

      const { container } = render(<CategoryProduct />);

      await waitFor(() => {
        expect(container.querySelector('.card')).toBeInTheDocument();
        expect(container.querySelector('.card-body')).toBeInTheDocument();
        expect(container.querySelector('.card-name-price')).toBeInTheDocument();
        expect(container.querySelector('.card-img-top')).toBeInTheDocument();
      });
    });

    it("should render category heading and result count", async () => {
      const mockCategory = {
        _id: "cat1",
        name: "Electronics",
        slug: "electronics",
      };

      const mockProducts = [
        {
          _id: "1",
          name: "Product 1",
          description: "Description 1",
          price: 100,
          slug: "product-1",
        },
      ];

      useParams.mockReturnValue({ slug: "electronics" });
      axios.get.mockResolvedValueOnce({
        data: {
          category: mockCategory,
          products: mockProducts,
        },
      });

      render(<CategoryProduct />);

      await waitFor(() => {
        const categoryHeading = screen.getByRole('heading', { name: /Category - Electronics/i });
        expect(categoryHeading).toBeInTheDocument();
        expect(categoryHeading.tagName).toBe('H4');

        const resultCount = screen.getByRole('heading', { name: /1 result found/i });
        expect(resultCount).toBeInTheDocument();
        expect(resultCount.tagName).toBe('H6');
      });
    });
  });
});