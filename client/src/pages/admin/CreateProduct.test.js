/*
    Test cases written by: Ong Chang Heng Bertrand A0253013X
*/

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";

// Mock axios
jest.mock("axios");

// Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock Layout component
jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" title={title}>
    {children}
  </div>
));

// Mock AdminMenu component
jest.mock("../../components/AdminMenu", () => () => <div data-testid="admin-menu">Admin Panel</div>);

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
  const Select = ({ children, onChange, placeholder, ...props }) => (
    <select
      data-testid={`select-${placeholder}`}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
  Select.Option = ({ children, value, ...props }) => (
    <option value={value} {...props}>{children}</option>
  );
  return { Select };
});

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => "mocked-url");

describe("CreateProduct Component", () => {
  const mockCategories = [
		{ _id: "66db427fdb0119d9234b27ee", name: "Electronics" },
    { _id: "66db427fdb0119d9234b27ef", name: "Clothing" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: categories fetch succeeds
    axios.get.mockResolvedValueOnce({
      data: { success: true, category: mockCategories },
    });
  });

  // ============ HAPPY PATH ============
  describe("Happy Path", () => {
    it("should submit form data and navigate on successful creation", async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: true, message: "Product Created Successfully" },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

			// Wait for category options to render
			await waitFor(() => {
				expect(screen.getByText("Electronics")).toBeInTheDocument();
			});

      // Select category
      const categorySelect = screen.getByTestId("select-Select a category");
      fireEvent.change(categorySelect, { target: { value: "66db427fdb0119d9234b27ee" } });

			// Upload photo
			const file = new File(["test"], "test-photo.png", { type: "image/png" });
			const fileInput = document.querySelector('input[type="file"]');
			fireEvent.change(fileInput, { target: { files: [file] } });

			// Fill in form fields
			fireEvent.change(screen.getByPlaceholderText("Write a name"), {
				target: { value: "Test Product" },
			});
			fireEvent.change(screen.getByPlaceholderText("Write a description"), {
				target: { value: "Test Description" },
			});
			fireEvent.change(screen.getByPlaceholderText("Write a price"), {
				target: { value: "100" },
			});
			fireEvent.change(screen.getByPlaceholderText("Write a quantity"), {
				target: { value: "5" },
			});

			// Select shipping
			const shippingSelect = screen.getByTestId("select-Select shipping");
			fireEvent.change(shippingSelect, { target: { value: "1" } });

      // Click CREATE PRODUCT button
      fireEvent.click(screen.getByText("CREATE PRODUCT"));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/create-product",
          expect.any(FormData)
        );

				const formData = axios.post.mock.calls[0][1];
				expect(formData.get("name")).toBe("Test Product");
				expect(formData.get("description")).toBe("Test Description");
				expect(formData.get("price")).toBe("100");
				expect(formData.get("quantity")).toBe("5");
				expect(formData.get("category")).toBe("66db427fdb0119d9234b27ee"); // MongoDB ObjectId string for cat1
				expect(formData.get("shipping")).toBe("1");
				expect(formData.get("photo")).toEqual(file);

				expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
      });
    });

    it("should fetch categories on mount", async () => {
      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        expect(screen.getByTestId("category-option-66db427fdb0119d9234b27ee")).toHaveTextContent("Electronics");
        expect(screen.getByTestId("category-option-66db427fdb0119d9234b27ef")).toHaveTextContent("Clothing");
      });
    });
  });

  // ============ EQUIVALENCE PARTITIONING ============
  describe("Equivalence Partitioning", () => {
    describe("Category Count", () => {
      it("should handle zero categories", async () => {
        // Override the default beforeEach mock
        axios.get.mockReset();
        axios.get.mockResolvedValueOnce({
          data: { success: true, category: [] },
        });

        render(
          <MemoryRouter>
            <CreateProduct />
          </MemoryRouter>
        );

        await waitFor(() => {
          const categorySelect = screen.getByTestId("select-Select a category");
          // Only the placeholder option should exist
          const options = categorySelect.querySelectorAll("option");
          expect(options).toHaveLength(1); // Only placeholder
        });
      });
    });
  });

  // ============ ERROR HANDLING ============
  describe("Error Handling", () => {
		it("should show error toast when product creation fails due to server error", async () => {
			const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

			axios.post.mockResolvedValueOnce({
				data: { success: false, message: "Failed to create product" },
			});

			render(
				<MemoryRouter>
					<CreateProduct />
				</MemoryRouter>
			);

			fireEvent.change(screen.getByPlaceholderText("Write a name"), {
				target: { value: "Test Product" },
			});

			fireEvent.click(screen.getByText("CREATE PRODUCT"));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith("Failed to create product");
			});

			consoleLogSpy.mockRestore();
		});

		it("should show error toast when product creation fails", async () => {
			const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

			axios.post.mockRejectedValueOnce(new Error("Network error"));

			render(
				<MemoryRouter>
					<CreateProduct />
				</MemoryRouter>
			);

			fireEvent.change(screen.getByPlaceholderText("Write a name"), {
				target: { value: "Only have name Test Product" },
			});

			fireEvent.click(screen.getByText("CREATE PRODUCT"));

			await waitFor(() => {
				expect(toast.error).toHaveBeenCalledWith("Something went wrong");
				expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
			});

			consoleLogSpy.mockRestore();
		});

    it("should show error toast when fetching categories fails", async () => {
      const consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

      axios.get.mockReset();
      axios.get.mockRejectedValueOnce(new Error("Failed to fetch categories"));

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Something went wrong in getting category"
        );
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleLogSpy.mockRestore();
    });

    it("should handle unsuccessful category fetch response", async () => {
      axios.get.mockReset();
      axios.get.mockResolvedValueOnce({
        data: { success: false, category: [] },
      });

      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Categories should not be populated
				expect(screen.queryByTestId("category-option-66db427fdb0119d9234b27ee")).not.toBeInTheDocument();
				expect(screen.queryByTestId("category-option-66db427fdb0119d9234b27ef")).not.toBeInTheDocument();
      });
    });
  });

	// ============ RENDERING / UI STRUCTURE ============
	describe("Rendering / UI Structure", () => {
		it("should render Layout and AdminMenu components", async () => {
			render(
				<MemoryRouter>
					<CreateProduct />
				</MemoryRouter>
			);

			await waitFor(() => {
				expect(screen.getByTestId("layout")).toBeInTheDocument();
				expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
			});
		});

		it("should render form fields and buttons", async () => {
			render(
				<MemoryRouter>
					<CreateProduct />
				</MemoryRouter>
			);

			await waitFor(() => {
				expect(screen.getByLabelText("Upload Photo")).toBeInTheDocument();
				expect(screen.getByPlaceholderText("Write a name")).toBeInTheDocument();
				expect(screen.getByPlaceholderText("Write a description")).toBeInTheDocument();
				expect(screen.getByPlaceholderText("Write a price")).toBeInTheDocument();
				expect(screen.getByPlaceholderText("Write a quantity")).toBeInTheDocument();
				expect(screen.getByTestId("select-Select a category")).toBeInTheDocument();
				expect(screen.getByTestId("select-Select shipping")).toBeInTheDocument();
			});
		});

		it("should render category and shipping as dropdowns", async () => {
			render(
				<MemoryRouter>
					<CreateProduct />
				</MemoryRouter>
			);

			await waitFor(() => {
				expect(screen.getByTestId("select-Select a category").tagName).toBe("SELECT");
				expect(screen.getByTestId("select-Select shipping").tagName).toBe("SELECT");
			});
		});

		 it("should render name and description as text inputs", async () => {
			render(
				<MemoryRouter>
					<CreateProduct />
				</MemoryRouter>
			);

			await waitFor(() => {
				const priceInput = screen.getByPlaceholderText("Write a price");
				expect(priceInput).toHaveAttribute("type", "number");
				expect(priceInput.tagName).toBe("INPUT");

				const quantityInput = screen.getByPlaceholderText("Write a quantity");
				expect(quantityInput).toHaveAttribute("type", "number");
				expect(quantityInput.tagName).toBe("INPUT");
			});
		});

		 it("should render price and quantity as number inputs", async () => {
			render(
				<MemoryRouter>
					<CreateProduct />
				</MemoryRouter>
			);

			await waitFor(() => {
				const nameInput = screen.getByPlaceholderText("Write a name");
				expect(nameInput).toHaveAttribute("type", "text");
				expect(nameInput.tagName).toBe("INPUT");

				const descInput = screen.getByPlaceholderText("Write a description");
				expect(descInput).toHaveAttribute("type", "text");
				expect(descInput.tagName).toBe("TEXTAREA");
			});
		});

		it("should render photo name and image preview after image upload", async () => {
      render(
        <MemoryRouter>
          <CreateProduct />
        </MemoryRouter>
      );

      const file = new File(["test"], "test-photo.png", { type: "image/png" });

			const fileInput = document.querySelector('input[type="file"]');
			fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
				const preview = screen.getByAltText("product_photo");
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute("src", "mocked-url");
        expect(screen.getByText("test-photo.png")).toBeInTheDocument();
      });
		});

		it("should render CREATE PRODUCT button", async () => {
			render(
				<MemoryRouter>
					<CreateProduct />
				</MemoryRouter>
			);

			await waitFor(() => {
				const button = screen.getByText("CREATE PRODUCT");
				expect(button).toBeInTheDocument();
				expect(button.tagName).toBe("BUTTON");
			});
		});
	});
});