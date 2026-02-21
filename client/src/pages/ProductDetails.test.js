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

/*
  Test cases for ProductDetails Page:
  1. Happy Path: 5 tests
    a. should display product details when fetched successfully
    b. should display related products on fetch
    c. should add main product to cart when 'ADD TO CART' button is clicked
    d. should add related product to cart when 'ADD TO CART' button is clicked
    e. should display message when no related products found (0 related products)
  2. Error Handling: 5 tests
    a. should display error toast when fetching product details
    b. should handle error when fetching related products
    c. should display error toast when fetching related products
    d. should display error toast when handling missing product data gracefully
    e. should not call get product API when slug is missing
  3. Side Effects / API Calls: 2 tests
    a. should fetch product details on component mount
    b. should fetch related products after fetching main product
  4. Rendering / UI Structure: 4 tests
    a. should render similar products section
    b. should render similar product cards with correct navigation links
    c. should display main product photo on fetch with correct src and alt
    d. should display related product photos on fetch with correct src and alt
*/

describe("ProductDetails Component", () => {
  let mockNavigate;
  let mockCart;
  let mockSetCart;

  const mockProduct = {
    _id: "1",
    name: "Test Product",
    description: "This is a test product",
    price: 100,
    category: { _id: "cat1", name: "Category 1" },
    slug: "test-product",
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
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      render(<ProductDetails />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/get-product/${mockProduct.slug}`);
        expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`);
        expect(screen.getByTestId('product-title')).toHaveTextContent(mockProduct.name);
        expect(screen.getByTestId('product-description')).toHaveTextContent(mockProduct.description);
        expect(screen.getByTestId('product-price')).toHaveTextContent(mockProduct.price);
        expect(screen.getByTestId('product-category')).toHaveTextContent(mockProduct.category.name);
      });
    });

    it("should display related products on fetch", async () => {
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      render(<ProductDetails />);

      await waitFor(() => {
        expect(screen.getByTestId(`similar-product-name-${mockRelatedProducts[0]._id}`)).toHaveTextContent(mockRelatedProducts[0].name);
      });
    });

		it("should add main product to cart when ADD TO CART button is clicked", async () => {
			const mockLocalStorage = {
				getItem: jest.fn(),
				setItem: jest.fn(),
			};
			Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

			useParams.mockReturnValue({ slug: mockProduct.slug });
			axios.get
				.mockResolvedValueOnce({ data: { product: mockProduct } })
				.mockResolvedValueOnce({ data: { products: [] } });

			render(<ProductDetails />);

			await waitFor(() => {
				const addToCartButton = screen.getByTestId(`main-add-to-cart-button-${mockProduct._id}`);
				fireEvent.click(addToCartButton);

				expect(mockSetCart).toHaveBeenCalledWith([mockProduct]);
				expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
					"cart",
					JSON.stringify([mockProduct])
				);
				expect(toast.success).toHaveBeenCalledWith(expect.any(String));
			});
		});

		it("should add related product to cart when ADD TO CART button is clicked", async () => {
			const mockLocalStorage = {
				getItem: jest.fn(),
				setItem: jest.fn(),
			};
			Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      render(<ProductDetails />);

			await waitFor(() => {
				const addToCartButton = screen.getByTestId(`similar-add-to-cart-button-${mockRelatedProducts[0]._id}`);
				fireEvent.click(addToCartButton);

				expect(mockSetCart).toHaveBeenCalledWith([mockRelatedProducts[0]]);
				expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
					"cart",
					JSON.stringify([mockRelatedProducts[0]])
				);
				expect(toast.success).toHaveBeenCalledWith(expect.any(String));
			});
		});

    it("should display message when no related products found", async () => {
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      render(<ProductDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('no-similar-products').textContent).toEqual(expect.any(String));
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
    it("should display error toast when fetching product details", async () => {
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get.mockRejectedValueOnce(new Error("Failed to fetch product"));

      render(<ProductDetails />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it("should handle error when fetching related products", async () => {
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockRejectedValueOnce(new Error("Failed to fetch related products"));

      render(<ProductDetails />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it("should display error toast when fetching related products", async () => {
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockRejectedValueOnce(new Error("Failed to fetch related products"));

      render(<ProductDetails />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it("should display error toast when handling missing product data gracefully", async () => {
      useParams.mockReturnValue({ slug: "non-existent-product" });
      axios.get.mockResolvedValueOnce({ data: { product: null } });

      render(<ProductDetails />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it("should not call get product when slug is missing", async () => {
      useParams.mockReturnValue({ slug: "" });

      render(<ProductDetails />);

      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalledWith(expect.stringContaining('/api/v1/product/get-product/'));
      });
    });
  });

	// ============ SIDE EFFECTS / API CALLS ============
	describe("Side Effects / API Calls", () => {
		it("should fetch product details on component mount", async () => {
			useParams.mockReturnValue({ slug: mockProduct.slug });
			axios.get.mockResolvedValueOnce({ data: { product: mockProduct } });

			render(<ProductDetails />);

			await waitFor(() => {
				expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/get-product/${mockProduct.slug}`);
			});
		});

		it("should fetch related products after fetching main product", async () => {
			useParams.mockReturnValue({ slug: mockProduct.slug });
			axios.get
				.mockResolvedValueOnce({ data: { product: mockProduct } })
				.mockResolvedValueOnce({ data: { products: [] } });

			render(<ProductDetails />);

			await waitFor(() => {
				expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/related-product/${mockProduct._id}/${mockProduct.category._id}`);
			});
		});
	});

  // ============ RENDERING / UI STRUCTURE ============
  describe("Rendering / UI Structure", () => {
    it("should render similar products section", async () => {
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      const { container } = render(<ProductDetails />);

      await waitFor(() => {
        expect(container.querySelector('.similar-products')).toBeInTheDocument();
        expect(screen.getByTestId('similar-products-title')).toBeInTheDocument();
      });
    });

    it("should render similar product cards with correct navigation links", async () => {
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      render(<ProductDetails />);

      await waitFor(() => {
        const moreDetailsButton = screen.getByTestId(`similar-more-details-button-${mockRelatedProducts[0]._id}`);
        expect(moreDetailsButton).toBeInTheDocument();
        fireEvent.click(moreDetailsButton);
        expect(mockNavigate).toHaveBeenCalledWith(`/product/${mockRelatedProducts[0].slug}`);
      });
    });

    it("should display main product photo on fetch", async () => {
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      render(<ProductDetails />);

      await waitFor(() => {
        const productImage = screen.getByTestId('main-product-image');
        expect(productImage).toHaveAttribute('src', `/api/v1/product/product-photo/${mockProduct._id}`);
        expect(productImage).toHaveAttribute('alt', mockProduct.name);
      });
    });

    it("should display related product photos on fetch", async () => {
      useParams.mockReturnValue({ slug: mockProduct.slug });
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelatedProducts } });

      render(<ProductDetails />);

      await waitFor(() => {
        const relatedProductImage = screen.getByTestId(`similar-product-image-${mockRelatedProducts[0]._id}`);
        expect(relatedProductImage).toHaveAttribute('src', `/api/v1/product/product-photo/${mockRelatedProducts[0]._id}`);
        expect(relatedProductImage).toHaveAttribute('alt', mockRelatedProducts[0].name);
      });
    });
  });
});
