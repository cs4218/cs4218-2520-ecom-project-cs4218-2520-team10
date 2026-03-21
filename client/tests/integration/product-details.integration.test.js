/**
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { CartProvider } from "../../src/context/cart";
import ProductDetails from "../../src/pages/ProductDetails";

/**
 * Integration tests for ProductDetails page and CartContext (2 tests)
 *
 * 1. Add to cart from ProductDetails page
 * 2. Related products rendered and navigable
 */

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock("../../src/components/Header", () => () => <div data-testid="header">Header</div>);
jest.mock("../../src/components/Layout", () => {
  const React = require("react");
  return ({ children, title }) => (
    <div data-testid="layout">
      <h2>{title}</h2>
      {children}
    </div>
  );
});

describe("ProductDetails ↔ CartContext", () => {
  const mockProduct = {
    _id: "p1",
    name: "Main Product",
    slug: "main-product",
    description: "Main product description",
    price: 100,
    category: {
      _id: "c1",
      name: "Electronics",
    },
  };

  const mockRelatedProduct = {
    _id: "p2",
    name: "Related Product",
    slug: "related-product",
    description: "Related product description",
    price: 50,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderProductDetails = (initialSlug = "main-product") => {
    return render(
      <CartProvider>
        <MemoryRouter initialEntries={[`/product/${initialSlug}`]}>
          <Routes>
            <Route path="/product/:slug" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );
  };

  describe("Test Case 1: Add to cart from ProductDetails page", () => {
    it("should update cart context, show toast, and update localStorage", async () => {
      // Mock API responses
      axios.get.mockImplementation((url) => {
        if (url.includes(`/api/v1/product/get-product/main-product`)) {
          return Promise.resolve({ data: { product: mockProduct } });
        }
        return Promise.reject(new Error("not found"));
      });

      const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

      renderProductDetails();

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByText("Main Product")).toBeInTheDocument();
      });

      const addToCartBtn = screen.getByTestId(`main-add-to-cart-button-${mockProduct._id}`);
      fireEvent.click(addToCartBtn);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.any(String));
        expect(setItemSpy).toHaveBeenCalledWith(
          "cart",
          JSON.stringify([mockProduct])
        );
      });
    });
  });

  describe("Test Case 2: Related products rendered and navigable", () => {
    it("should display related products and navigate on 'More Details' click", async () => {
      // Mock API responses
      axios.get.mockImplementation((url) => {
        if (url.includes(`/api/v1/product/get-product/main-product`)) {
          return Promise.resolve({ data: { product: mockProduct } });
        }
        if (url.includes(`/api/v1/product/related-product/p1/c1`)) {
          return Promise.resolve({ data: { products: [mockRelatedProduct] } });
        }
        return Promise.reject(new Error("not found"));
      });

      renderProductDetails();

      // Wait for main product and related product to load
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
        expect(screen.getByText(mockRelatedProduct.name)).toBeInTheDocument();
      });

      const moreDetailsBtns = screen.getAllByRole("button", { name: /more details/i });
      // We'll click the last one assuming it's from the related card.
      fireEvent.click(moreDetailsBtns[moreDetailsBtns.length - 1]);

      // Verify navigation occurred by checking if API is called with new slug
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining(`/api/v1/product/get-product/related-product`));
      });
    });
  });
});