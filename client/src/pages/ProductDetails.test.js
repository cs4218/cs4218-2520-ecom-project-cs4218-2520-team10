/*
	Test cases written by: Ong Chang Heng Bertrand A0253013X
*/

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ProductDetails from "./ProductDetails";

jest.mock("axios");

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

// Mock Layout component
jest.mock("./../components/Layout", () => ({ children }) => <div>{children}</div>);

// Mock cart context
jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

// Mock toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { useCart } from "../context/cart";

describe("ProductDetails Component", () => {
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
    it("should display product details when fetched successfully", async () => {
      const mockProduct = {
        _id: "1",
        name: "Test Product",
        description: "This is a test product",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      const mockRelatedProducts = [
        {
          _id: "2",
          name: "Related Product 1",
          description: "Related product description 1",
          price: 80,
          slug: "related-product-1",
        },
      ];

      useParams.mockReturnValue({ slug: "test-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      render(<ProductDetails />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-product");
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/related-product/1/cat1");
        expect(screen.getByTestId('product-title')).toHaveTextContent('Test Product');
        expect(screen.getByTestId('product-description')).toHaveTextContent('This is a test product');
        expect(screen.getByTestId('product-price')).toHaveTextContent('$100.00');
        expect(screen.getByTestId('product-category')).toHaveTextContent('Category 1');
      });
    });

    it("should display related products on fetch", async () => {
      const mockProduct = {
        _id: "1",
        name: "Main Product",
        description: "Main product description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      const mockRelatedProducts = [
        {
          _id: "2",
          name: "Related Product 1",
          description: "Related product description that is quite long and needs truncation",
          price: 80,
          slug: "related-product-1",
        },
        {
          _id: "3",
          name: "Related Product 2",
          description: "Another related product description",
          price: 90,
          slug: "related-product-2",
        },
      ];

      useParams.mockReturnValue({ slug: "main-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      render(<ProductDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Similar Products/i)).toBeInTheDocument();
        expect(screen.getByText(/Related Product 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Related Product 2/i)).toBeInTheDocument();
        expect(screen.getByText(/\$80.00/i)).toBeInTheDocument();
        expect(screen.getByText(/\$90.00/i)).toBeInTheDocument();
      });
    });

    it("should display main product photo on fetch", async () => {
      const mockProduct = {
        _id: "1",
        name: "Test Product",
        description: "Test description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      useParams.mockReturnValue({ slug: "test-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      render(<ProductDetails />);

      await waitFor(() => {
        const productImage = screen.getAllByRole('img')[0];
        expect(productImage).toHaveAttribute('src', '/api/v1/product/product-photo/1');
        expect(productImage).toHaveAttribute('alt', 'Test Product');
      });
    });

    it("should display related product photo on fetch", async () => {
      const mockProduct = {
        _id: "1",
        name: "Main Product",
        description: "Main description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      const mockRelatedProducts = [
        {
          _id: "2",
          name: "Related Product",
          description: "Related description",
          price: 80,
          slug: "related-product",
        },
      ];

      useParams.mockReturnValue({ slug: "main-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      render(<ProductDetails />);

      await waitFor(() => {
        const relatedProductImage = screen.getAllByRole('img')[1];
        expect(relatedProductImage).toHaveAttribute('src', '/api/v1/product/product-photo/2');
        expect(relatedProductImage).toHaveAttribute('alt', 'Related Product');
      });
    });

		it("should add main product to cart when ADD TO CART button is clicked", async () => {
			const mockProduct = {
				_id: "1",
				name: "Test Product",
				description: "Test description",
				price: 100,
				category: { _id: "cat1", name: "Category 1" },
			};

			const mockLocalStorage = {
				getItem: jest.fn(),
				setItem: jest.fn(),
			};
			Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

			useParams.mockReturnValue({ slug: "test-product" });
			axios.get
				.mockResolvedValueOnce({ data: { product: mockProduct } })
				.mockResolvedValueOnce({ data: { products: [] } });

			render(<ProductDetails />);

			await waitFor(() => {
				const addToCartButtons = screen.getAllByRole('button', { name: /ADD TO CART/i });
				fireEvent.click(addToCartButtons[0]);

				expect(mockSetCart).toHaveBeenCalledWith([mockProduct]);
				expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
					"cart",
					JSON.stringify([mockProduct])
				);
				expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
			});
		});

		it("should add related product to cart when ADD TO CART button is clicked", async () => {
			const mockProduct = {
				_id: "1",
				name: "Main Product",
				description: "Main description",
				price: 100,
				category: { _id: "cat1", name: "Category 1" },
			};

			const mockRelatedProduct = {
				_id: "2",
				name: "Related Product",
				description: "Related description",
				price: 80,
				slug: "related-product",
			};

			const mockLocalStorage = {
				getItem: jest.fn(),
				setItem: jest.fn(),
			};
			Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

			useParams.mockReturnValue({ slug: "main-product" });
			axios.get
				.mockResolvedValueOnce({ data: { product: mockProduct } })
				.mockResolvedValueOnce({ data: { products: [mockRelatedProduct] } });

			render(<ProductDetails />);

			await waitFor(() => {
				const addToCartButtons = screen.getAllByRole('button', { name: /ADD TO CART/i });
				fireEvent.click(addToCartButtons[1]); // Click related product's button

				expect(mockSetCart).toHaveBeenCalledWith([mockRelatedProduct]);
				expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
					"cart",
					JSON.stringify([mockRelatedProduct])
				);
				expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
			});
		});
  });

  // ============ Equivalence Partition ============
  describe("Equivalence Partition", () => {
    describe("Description Equivalence Partition", () => {
      it("should truncate long descriptions in related products (>60 chars)", async () => {
        const mockProduct = {
          _id: "1",
          name: "Main Product",
          description: "Main description",
          price: 100,
          category: { _id: "cat1", name: "Category 1" },
        };

        const mockRelatedProducts = [
          {
            _id: "2",
            name: "Related Product",
            description: "This is a very long description that exceeds sixty characters and should be truncated",
            price: 80,
            slug: "related-product",
          },
        ];

        useParams.mockReturnValue({ slug: "main-product" });
        axios.get
          .mockResolvedValueOnce({ data: { product: mockProduct } })
          .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

        render(<ProductDetails />);

        await waitFor(() => {
          const truncatedText = screen.getByText(/This is a very long description that exceeds sixty character.../i);
          expect(truncatedText).toBeInTheDocument();
        });
      });

      it("should display short description without truncation (<60 chars)", async () => {
        const mockProduct = {
          _id: "1",
          name: "Main Product",
          description: "Main description",
          price: 100,
          category: { _id: "cat1", name: "Category 1" },
        };

        const mockRelatedProducts = [
          {
            _id: "2",
            name: "Related Product",
            description: "Short description",
            price: 80,
            slug: "related-product",
          },
        ];

        useParams.mockReturnValue({ slug: "main-product" });
        axios.get
          .mockResolvedValueOnce({ data: { product: mockProduct } })
          .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

        render(<ProductDetails />);

        await waitFor(() => {
          expect(screen.getByText(/Short description.../i)).toBeInTheDocument();
        });
      });
    });

    describe("Related Products Count Equivalence Partition", () => {
      it("should display message when no related products (0 products)", async () => {
        const mockProduct = {
          _id: "1",
          name: "Unique Product",
          description: "No similar products",
          price: 100,
          category: { _id: "cat1", name: "Category 1" },
        };

        useParams.mockReturnValue({ slug: "unique-product" });
        axios.get
          .mockResolvedValueOnce({ data: { product: mockProduct } })
          .mockResolvedValueOnce({ data: { products: [] } });

        render(<ProductDetails />);

        await waitFor(() => {
          expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();
        });
      });

      it("should display multiple related products (At least 1 product)", async () => {
        const mockProduct = {
          _id: "1",
          name: "Main Product",
          description: "Main description",
          price: 100,
          category: { _id: "cat1", name: "Category 1" },
        };

        const mockRelatedProducts = Array.from({ length: 5 }, (_, i) => ({
          _id: `${i + 2}`,
          name: `Related Product ${i + 1}`,
          description: `Description ${i + 1}`,
          price: 80 + i * 10,
          slug: `related-product-${i + 1}`,
        }));

        useParams.mockReturnValue({ slug: "main-product" });
        axios.get
          .mockResolvedValueOnce({ data: { product: mockProduct } })
          .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

        render(<ProductDetails />);

        await waitFor(() => {
          mockRelatedProducts.forEach((product) => {
            expect(screen.getByText(new RegExp(product.name, 'i'))).toBeInTheDocument();
          });
        });
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
    it("should handle error when fetching product details", async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      useParams.mockReturnValue({ slug: "test-product" });
      axios.get.mockRejectedValueOnce(new Error("Failed to fetch product"));

      render(<ProductDetails />);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleLogSpy.mockRestore();
    });

    it("should handle error when fetching related products", async () => {
      const mockProduct = {
        _id: "1",
        name: "Test Product",
        description: "Test description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      useParams.mockReturnValue({ slug: "test-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockRejectedValueOnce(new Error("Failed to fetch related products"));

      render(<ProductDetails />);

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalled();
      });

      consoleLogSpy.mockRestore();
    });

    it("should handle missing product data gracefully", async () => {
      useParams.mockReturnValue({ slug: "test-product" });
      axios.get.mockResolvedValueOnce({ data: { product: null } });

      render(<ProductDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Product Details/i)).toBeInTheDocument();
      });
    });

    it("should handle undefined params.slug", async () => {
      useParams.mockReturnValue({ slug: undefined });

      render(<ProductDetails />);

      // Should not make API call if slug is undefined
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should handle empty string params.slug", async () => {
      useParams.mockReturnValue({ slug: "" });

      render(<ProductDetails />);

      // Should not make API call if slug is empty
      expect(axios.get).not.toHaveBeenCalled();
    });

    it("should handle null params.slug", async () => {
      useParams.mockReturnValue({ slug: null });

      render(<ProductDetails />);

      // Should not make API call if slug is null
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  // ============ USER INTERACTIONS ============
  describe("User Interactions", () => {
    it("should navigate to related product details when 'More Details' is clicked", async () => {
      const mockProduct = {
        _id: "1",
        name: "Main Product",
        description: "Main description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      const mockRelatedProducts = [
        {
          _id: "2",
          name: "Related Product 1",
          description: "Related product description",
          price: 80,
          slug: "related-product-1",
        },
      ];

      useParams.mockReturnValue({ slug: "main-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      render(<ProductDetails />);

      await waitFor(() => {
        const moreDetailsButton = screen.getByRole('button', { name: /More Details/i });
        fireEvent.click(moreDetailsButton);
        expect(mockNavigate).toHaveBeenCalledWith("/product/related-product-1");
      });
    });
	});

  // ============ RENDERING / UI STRUCTURE ============
  describe("Rendering / UI Structure", () => {
    it("should render Layout component", async () => {
      const mockProduct = {
        _id: "1",
        name: "Test Product",
        description: "Test description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      useParams.mockReturnValue({ slug: "test-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      const { container } = render(<ProductDetails />);

      await waitFor(() => {
        expect(container.querySelector('.row.container.product-details')).toBeInTheDocument();
      });
    });

    it("should render product details section with correct CSS classes", async () => {
      const mockProduct = {
        _id: "1",
        name: "Test Product",
        description: "Test description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      useParams.mockReturnValue({ slug: "test-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      const { container } = render(<ProductDetails />);

      await waitFor(() => {
        expect(container.querySelector('.product-details-info')).toBeInTheDocument();
        expect(screen.getByText(/Product Details/i)).toBeInTheDocument();
      });
    });

    it("should render 'ADD TO CART' button", async () => {
      const mockProduct = {
        _id: "1",
        name: "Test Product",
        description: "Test description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      useParams.mockReturnValue({ slug: "test-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      render(<ProductDetails />);

      await waitFor(() => {
        const addToCartButton = screen.getByRole('button', { name: /ADD TO CART/i });
        expect(addToCartButton).toBeInTheDocument();
      });
    });

    it("should render similar products section", async () => {
      const mockProduct = {
        _id: "1",
        name: "Test Product",
        description: "Test description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      useParams.mockReturnValue({ slug: "test-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      const { container } = render(<ProductDetails />);

      await waitFor(() => {
        expect(container.querySelector('.similar-products')).toBeInTheDocument();
        expect(screen.getByTestId('similar-products-title')).toHaveTextContent('Similar Products');
      });
    });

    it("should render related product cards with correct structure", async () => {
      const mockProduct = {
        _id: "1",
        name: "Main Product",
        description: "Main description",
        price: 100,
        category: { _id: "cat1", name: "Category 1" },
      };

      const mockRelatedProducts = [
        {
          _id: "2",
          name: "Related Product",
          description: "Related description",
          price: 80,
          slug: "related-product",
        },
      ];

      useParams.mockReturnValue({ slug: "main-product" });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      const { container } = render(<ProductDetails />);

      await waitFor(() => {
        const cards = container.querySelectorAll('.card');
        expect(cards.length).toBeGreaterThan(0);
        expect(container.querySelector('.card-body')).toBeInTheDocument();
        expect(container.querySelector('.card-name-price')).toBeInTheDocument();
      });
    });
  });
});
