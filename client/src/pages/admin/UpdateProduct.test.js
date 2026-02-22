/*
    Test cases written by: Ong Chang Heng Bertrand A0253013X
*/

import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";

// Mock axios
jest.mock("axios");

// Mock react-router-dom navigate and params
const mockNavigate = jest.fn();
const mockParams = { slug: "test-product-slug" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
}));

// Mock Layout component
jest.mock("./../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>
    {children}
  </div>
));

// Mock AdminMenu component
jest.mock("./../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Panel</div>
));

// Mock toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock antd Select
jest.mock("antd", () => {
  const Select = ({ children, onChange, placeholder, value, ...props }) => (
    <select
      {...props}
      onChange={(e) => onChange(e.target.value)}
      value={value}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
  Select.Option = ({ children, value, ...props }) => (
    <option value={value} {...props}>
      {children}
    </option>
  );
  return { Select };
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mocked-url");

// Mock window.prompt
global.prompt = jest.fn();

/*
  Test cases for UpdateProduct page:
  1. Happy Path: 5 tests
    a. Should fetch and display product details on mount
    b. Should fetch categories on mount
    c. Should update product successfully and navigate
    d. Should delete product when confirmed
    e. Should not delete product when cancelled
  2. Error Handling: 8 tests
    a. Should show error toast if fetching product fails
    b. Should show error toast if fetching categories fails
    c. Should show error toast with specific message if updating product fails
    d. Should show error toast if fetching categories retrieves 0 categories (Viewed item should have a category already, so there should be at least 1)
    e. Should show error toast if server fetching categories fails
    f. Should show error toast if deleting product fails
    g. Should show error toast when update returns success: false
    h. Should not populate categories when get categories returns success: false
  3. Rendering / UI: 10 tests
    a. Should render Layout and AdminMenu components
    b. Should render form fields with correct initial values
    c. Should change category on select
    d. Should change shipping on select
    e. Should render category and shipping as dropdowns
    f. Should render name and description as text inputs
    g. Should render price and quantity as number inputs
    h. Should render update and delete buttons
    i. Should render existing photo and upload photo button
    j. Should update photo preview when a new photo is uploaded
*/

describe("UpdateProduct page", () => {
  const mockCategories = [
    { _id: "66db427fdb0119d9234b27ee", name: "Electronics" },
    { _id: "66db427fdb0119d9234b27ef", name: "Clothing" },
  ];

  const mockProduct = {
    _id: "product123",
    name: "Test Product",
    description: "Test Description",
    price: 100,
    quantity: 5,
    shipping: true,
    category: {
      _id: "66db427fdb0119d9234b27ee",
      name: "Electronics",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock get single product
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/product/get-product/")) {
        return Promise.resolve({
          data: { product: mockProduct },
        });
      }
      if (url === "/api/v1/category/get-category") {
        return Promise.resolve({
          data: { success: true, category: mockCategories },
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });
  });

  // ============ HAPPY PATH ============
  describe("Happy Path", () => {
    it("should fetch and display product details on mount", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(`/api/v1/product/get-product/${mockParams.slug}`);
        expect(screen.getByTestId("category-select")).toHaveValue("66db427fdb0119d9234b27ee");
        expect(screen.getByTestId("shipping-select")).toHaveValue("1");
        expect(screen.getByTestId("description-input")).toHaveValue("Test Description");
        expect(screen.getByTestId("name-input")).toHaveValue("Test Product");
        expect(screen.getByTestId("price-input")).toHaveValue(100);
        expect(screen.getByTestId("quantity-input")).toHaveValue(5);
      });
    });

    it("should fetch multiple categories on mount", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        expect(screen.getByTestId("category-option-66db427fdb0119d9234b27ee")).toHaveTextContent("Electronics");
        expect(screen.getByTestId("category-option-66db427fdb0119d9234b27ef")).toHaveTextContent("Clothing");
      });
    });

    it("should update product successfully and navigate", async () => {
      axios.put = jest.fn().mockResolvedValueOnce({
        data: { success: true, message: "Product updated" },
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      // Select new category
      const categorySelect = screen.getByTestId("category-select");
      fireEvent.change(categorySelect, { target: { value: "66db427fdb0119d9234b27ef" } });

      // Select new shipping
      const shippingSelect = screen.getByTestId("shipping-select");
      fireEvent.change(shippingSelect, { target: { value: "0" } });

      // Photo upload
      const file = new File(["test"], "new-photo.png", { type: "image/png" });
      const fileInput = document.querySelector('input[type="file"]');
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Update fields
      fireEvent.change(screen.getByPlaceholderText("Write a name"), {
        target: { value: "Updated Product" },
      });
      fireEvent.change(screen.getByPlaceholderText("Write a description"), {
        target: { value: "Updated Description" },
      });
      fireEvent.change(screen.getByPlaceholderText("Write a price"), {
        target: { value: "150" },
      });
      fireEvent.change(screen.getByPlaceholderText("Write a quantity"), {
        target: { value: "8" },
      });

      // Click update button
      fireEvent.click(screen.getByTestId("update-button"));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          `/api/v1/product/update-product/${mockProduct._id}`,
          expect.any(FormData)
        );

        // Check FormData contents
        const formData = axios.put.mock.calls[0][1];
        expect(formData.get("name")).toBe("Updated Product");
        expect(formData.get("description")).toBe("Updated Description");
        expect(formData.get("price")).toBe("150");
        expect(formData.get("quantity")).toBe("8");
        expect(formData.get("category")).toBe("66db427fdb0119d9234b27ef");
        expect(formData.get("shipping")).toBe("0");
        expect(formData.get("photo")).toEqual(file);

        expect(toast.success).toHaveBeenCalledWith(expect.any(String));
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      });
    });

    it("should delete product when confirmed", async () => {
      global.confirm = jest.fn().mockReturnValueOnce(true);

      axios.delete = jest.fn().mockResolvedValueOnce({
        data: { success: true },
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      // Click delete button
      fireEvent.click(screen.getByTestId("delete-button"));

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalledWith(expect.any(String));
        expect(axios.delete).toHaveBeenCalledWith(`/api/v1/product/delete-product/${mockProduct._id}`);
        expect(toast.success).toHaveBeenCalledWith(expect.any(String));
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      });
    });

    it("should not delete product when cancelled", async () => {
      global.confirm = jest.fn().mockReturnValueOnce(false);

      axios.delete = jest.fn();

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      // Click delete button
      fireEvent.click(screen.getByTestId("delete-button"));

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalledWith(expect.any(String));
        expect(axios.delete).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
    it("should show error toast when fetching product fails", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      axios.get.mockReset();
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.reject(new Error("Failed to fetch product"));
        }
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({
            data: { success: true, category: mockCategories },
          });
        }
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it("should show error toast when fetching categories retrieves 0 products (Viewed item should have a category already, so there should be at least 1)", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      axios.get.mockReset();
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({
            data: { product: mockProduct },
          });
        }
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({
            data: { success: true, category: [] },
          });
        }
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it("should show error toast when fetching categories returns success: false", async () => {
      axios.get.mockReset();
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({
            data: { product: mockProduct },
          });
        }
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({
            data: { success: false, category: mockCategories },
          });
        }
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
       });
    });

    it("should show error toast when server fetching categories fails", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
      axios.get.mockReset();
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({
            data: { product: mockProduct },
          });
        }
        if (url === "/api/v1/category/get-category") {
          return Promise.reject(new Error("Failed to fetch categories"));
        }
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it("should show error toast with specific message when update fails", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      const mockError = new Error("API Error");
      mockError.response = {
        data: {
          success: false,
          message: "Specific error message"
        }
      };
      axios.put = jest.fn().mockRejectedValueOnce(mockError);

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      // Click update
      fireEvent.click(screen.getByTestId("update-button"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(mockError.response.data.message);
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      });
    });

    it("should show error toast when delete fails", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      global.confirm = jest.fn().mockReturnValueOnce(true);
      axios.delete = jest.fn().mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      // Click delete
      fireEvent.click(screen.getByTestId("delete-button"));

      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
      });
    });

    it("should show error toast when update returns success: false", async () => {
      // Bug: inverted logic in UpdateProduct.js
      axios.put = jest.fn().mockResolvedValueOnce({
        data: { success: false, message: "Error updating product" },
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      // Click update
      fireEvent.click(screen.getByText("UPDATE PRODUCT"));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(expect.any(String));
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    it("should not populate categories when get categories returns success: false", async () => {
      axios.get.mockReset();
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({
            data: { product: mockProduct },
          });
        }
        if (url === "/api/v1/category/get-category") {
          return Promise.resolve({
            data: { 
              success: false,
              category: mockCategories
            },
          });
        }
      });

      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      const categorySelect = screen.getByTestId("category-select");
      expect(within(categorySelect).queryByText("Electronics")).not.toBeInTheDocument();
      expect(within(categorySelect).queryByText("Clothing")).not.toBeInTheDocument();
    });
  });

  // ============ RENDERING / UI STRUCTURE ============
  describe("Rendering / UI Structure", () => {
    it("should render Layout and AdminMenu components", () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });

    it("should render form fields with correct initial values", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId("category-select")).toHaveValue("66db427fdb0119d9234b27ee");
        expect(screen.getByTestId("shipping-select")).toHaveValue("1");
        expect(screen.getByTestId("description-input")).toHaveValue("Test Description");
        expect(screen.getByTestId("name-input")).toHaveValue("Test Product");
        expect(screen.getByTestId("price-input")).toHaveValue(100);
        expect(screen.getByTestId("quantity-input")).toHaveValue(5);
      });
    });

    it("should change category on select", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const categorySelect = screen.getByTestId("category-select");
        fireEvent.change(categorySelect, { target: { value: "66db427fdb0119d9234b27ef" } });
        expect(categorySelect.value).toBe("66db427fdb0119d9234b27ef");
      });
    });

    it("should change shipping on select", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const shippingSelect = screen.getByTestId("shipping-select");
        fireEvent.change(shippingSelect, { target: { value: "0" } });
        expect(shippingSelect.value).toBe("0");
      });
    });

    it("should render category and shipping as dropdowns", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const categorySelect = screen.getByTestId("category-select");
        const shippingSelect = screen.getByTestId("shipping-select");

        expect(categorySelect.tagName).toBe("SELECT");
        expect(shippingSelect.tagName).toBe("SELECT");
      });
    });

    it("should render name and description as text inputs", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText("Write a name");
        const descriptionInput = screen.getByPlaceholderText("Write a description");

        expect(nameInput).toHaveAttribute("type", "text");
        expect(nameInput.tagName).toBe("INPUT");
        expect(descriptionInput).toHaveAttribute("type", "text");
        expect(descriptionInput.tagName).toBe("TEXTAREA");
      });
    });

    it("should render price and quantity as number inputs", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const priceInput = screen.getByPlaceholderText("Write a price");
        const quantityInput = screen.getByPlaceholderText("Write a quantity");

        expect(priceInput.tagName).toBe("INPUT");
        expect(priceInput).toHaveAttribute("type", "number");
        expect(quantityInput.tagName).toBe("INPUT");
        expect(quantityInput).toHaveAttribute("type", "number");
      });
    });

    it("should render update and delete buttons", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const updateButton = screen.getByTestId("update-button");
        const deleteButton = screen.getByTestId("delete-button");

        expect(updateButton).toBeInTheDocument();
        expect(updateButton.tagName).toBe("BUTTON");
        expect(deleteButton).toBeInTheDocument();
        expect(deleteButton.tagName).toBe("BUTTON");
      });
    });

    it("should display existing product photo and upload photo button", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        const image = screen.getByAltText("product_photo");
        const uploadButton = screen.getByTestId("upload-photo-button");

        expect(image).toHaveAttribute("src", `/api/v1/product/product-photo/${mockProduct._id}`);
        expect(uploadButton).toBeInTheDocument();
        expect(uploadButton.tagName).toBe("LABEL");
      });
    });

    it("should update photo preview when new photo is uploaded", async () => {
      render(
        <MemoryRouter>
          <UpdateProduct />
        </MemoryRouter>
      );

      // Wait for product to load
      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      });

      const file = new File(["test"], "new-photo.png", { type: "image/png" });
      const fileInput = document.querySelector('input[type="file"]');

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const newImage = screen.getByAltText("product_photo");
        expect(screen.getByText("new-photo.png")).toBeInTheDocument();
        expect(newImage).toHaveAttribute("src", "mocked-url");
      });
    });
  });
});