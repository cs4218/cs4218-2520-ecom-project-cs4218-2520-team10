/*
  Test cases written by: Shaun Lee Xuan Wei A0252626E
*/
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CreateCategory from './CreateCategory';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

jest.mock('axios');
jest.mock('../../components/Layout', () => ({children}) => <div>{children}</div>);
jest.mock('../../components/AdminMenu');
jest.mock('../../components/Form/CategoryForm',() => {
  return ({ handleSubmit, value, setValue }) => (
    <div>
      <input
        data-testid="form-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button data-testid="submit-button" onClick={e => handleSubmit(e)}/>
    </div>
  )
});
jest.mock('react-hot-toast');
jest.mock('antd', () => ({
  Modal: ({ onCancel, footer, open, children }) => (
    open ? <div data-testid="update-modal" onClick={onCancel}>{children}</div> : null
  )
}));

/**
  * Unit tests for CreateCategory admin page
  *
  * 1. 5 rendering unit tests
  * 2. 3 happy path unit tests
  * 3. 19 error handling unit tests
  */
describe("CreateCategory", () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders category table headers correctly", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: []
        },
      });
      render(<CreateCategory />);
      const headers = screen.getAllByRole("columnheader");

      await waitFor(() => {expect(axios.get).toHaveBeenCalled()});
      expect(headers).toHaveLength(2);
      expect(headers[0]).toHaveTextContent("Name");
      expect(headers[1]).toHaveTextContent("Actions");
    });

    it("renders category table data in correct order", async () => {
      const mockCategories = [
        {
          _id: "validId1",
          name: "Book",
          slug: "book"
        },
        {
          _id: "validId2",
          name: "Clothing",
          slug: "clothing"
        }
      ];
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: mockCategories
        },
      });
      render(<CreateCategory />);

      let dataRows;
      await waitFor(() => {
        const rows = screen.getAllByRole("row");
        dataRows = rows.slice(1);
        expect(dataRows).toHaveLength(mockCategories.length);
      });

      dataRows.forEach((row, index) => {
        const cells = within(row).getAllByRole("cell");
        expect(cells[0]).toHaveTextContent(mockCategories[index].name);
        const actions = within(cells[1]).getAllByRole("button");
        expect(actions[0]).toHaveTextContent("Edit");
        expect(actions[1]).toHaveTextContent("Delete");
      });
    });

    it("should not render update modal on initial render", async () => {
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: []
        },
      });
      render(<CreateCategory />);

      await waitFor(async () => {
        const updateModal = screen.queryByTestId("update-modal");
        expect(updateModal).not.toBeInTheDocument();
      });
    });

    it("should render update modal on edit button", async () => {
      const user = userEvent.setup();
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [{
            _id: "validId1",
            name: "Book",
            slug: "book"
          }]
        },
      });
      render(<CreateCategory />);

      await waitFor(async () => {
        const editButton = screen.getByRole("button", {name: "Edit"});
        await user.click(editButton);
      });
      await waitFor(async () => {
        const updateModal = screen.getByTestId("update-modal");
        expect(updateModal).toBeInTheDocument();
      });
    });

    it("should close update modal on onCancel trigger", async () => {
      const user = userEvent.setup();
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [{
            _id: "validId1",
            name: "Book",
            slug: "book"
          }]
        },
      });
      render(<CreateCategory />);

      await waitFor(async () => {
        const editButton = screen.getByRole("button", {name: "Edit"});
        await user.click(editButton);
      });
      await waitFor(async () => {
        const updateModal = screen.getByTestId("update-modal");
        expect(updateModal).toBeInTheDocument();
      });
      await waitFor(async () => {
        const updateModal = screen.getByTestId("update-modal");
        await user.click(updateModal);
        expect(updateModal).not.toBeInTheDocument();
      });
    });
  });

  describe("Happy Path", () => {
    it("should delete category successfully", async () => {
      const user = userEvent.setup();
      const mockCategory = {
        _id: "validId1",
        name: "Book",
        slug: "book"
      };
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [mockCategory]
        },
      });
      axios.delete.mockResolvedValue({
        data: {
          success: true,
          message: "Response message"
        }
      });
      render(<CreateCategory />);

      await waitFor(async () => {
        const deleteButton = screen.getByRole("button", {name: "Delete"});
        await user.click(deleteButton);
      });

      await waitFor(() => expect(axios.delete).toHaveBeenCalled());
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith(`${mockCategory.name} is deleted`));
    });

    it("should create category successfully", async () => {
      const user = userEvent.setup();
      const newName = "Book";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: []
        },
      });
      axios.post.mockResolvedValue({
        data: {
          success: true,
          message: "Response message"
        }
      });
      render(<CreateCategory />);

      const createInput = screen.getByTestId("form-input");
      fireEvent.change(createInput, { target: { value: newName } });
      const createButton = screen.getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(createButton);
      });

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith(`${newName} is created`));
    });

    it("should update category successfully", async () => {
      const user = userEvent.setup();
      const updatedName = "Clothing";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [{
            _id: "validId",
            name: "Book",
            slug: "book"
          }]
        },
      });
      axios.put.mockResolvedValue({
        data: {
          success: true,
          message: "Response message"
        }
      });
      render(<CreateCategory />);

      await waitFor(async () => {
        const editButton = screen.getByRole("button", {name: "Edit"});
        await user.click(editButton);
      });
      const formInput = within(screen.getByTestId("update-modal")).getByTestId("form-input");
      fireEvent.change(formInput, { target: { value: updatedName } });
      const submitButton = within(screen.getByTestId("update-modal")).getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => expect(axios.put).toHaveBeenCalled());
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith(`${updatedName} is updated`));
    });
  });

  describe("Error handling", () => {
    it("should display error on fail get categories", async () => {
      axios.get.mockResolvedValue({data: {
        success: false,
        message: "Response message",
        error: new Error()
      }});
      render(<CreateCategory />);

      await waitFor(() => expect(axios.get).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category"));
    });

    it("should display error on get categories error", async () => {
      const error = new Error("Network error");
      axios.get.mockRejectedValue(error);
      render(<CreateCategory />);

      await waitFor(() => expect(axios.get).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category"));
    });

    it("should display error on get categories returns undefined", async () => {
      axios.get.mockResolvedValue({ data: undefined });
      render(<CreateCategory />);

      await waitFor(() => expect(axios.get).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category"));
    });

    it("should display error on get categories returns null", async () => {
      axios.get.mockResolvedValue({ data: null });
      render(<CreateCategory />);

      await waitFor(() => expect(axios.get).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category"));
    });

    it("should display error on fail delete category", async () => {
      const user = userEvent.setup();
      const mockCategories = [{
        _id: "validId1",
        name: "Book",
        slug: "book"
      }];
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: mockCategories
        },
      });
      const errorResponse = {
        success: false,
        message: "Response message"
      };
      axios.delete.mockResolvedValue({data: errorResponse});
      render(<CreateCategory />);

      await waitFor(async () => {
        const deleteButton = screen.getByRole("button", {name: "Delete"});
        await user.click(deleteButton);
      });

      await waitFor(() => expect(axios.delete).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorResponse.message));
    });

    it("should display error on delete category returns undefined", async () => {
      const user = userEvent.setup();
      const mockCategories = [{
        _id: "validId1",
        name: "Book",
        slug: "book"
      }];
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: mockCategories
        },
      });
      axios.delete.mockResolvedValue({ data: undefined });
      render(<CreateCategory />);

      await waitFor(async () => {
        const deleteButton = screen.getByRole("button", {name: "Delete"});
        await user.click(deleteButton);
      });

      await waitFor(() => expect(axios.delete).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
    });

    it("should display error on delete category returns null", async () => {
      const user = userEvent.setup();
      const mockCategories = [{
        _id: "validId1",
        name: "Book",
        slug: "book"
      }];
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: mockCategories
        },
      });
      axios.delete.mockResolvedValue({ data: null });
      render(<CreateCategory />);

      await waitFor(async () => {
        const deleteButton = screen.getByRole("button", {name: "Delete"});
        await user.click(deleteButton);
      });

      await waitFor(() => expect(axios.delete).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
    });

    it("should display error on delete category error", async () => {
      const user = userEvent.setup();
      const mockCategories = [{
        _id: "validId1",
        name: "Book",
        slug: "book"
      }];
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: mockCategories
        },
      });
      const error = new Error("Network error");
      axios.delete.mockRejectedValue(error);
      render(<CreateCategory />);

      await waitFor(async () => {
        const deleteButton = screen.getByRole("button", {name: "Delete"});
        await user.click(deleteButton);
      });

      await waitFor(() => expect(axios.delete).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
    });

    it("should display error on empty name in create category", async () => {
      const user = userEvent.setup();
      const newName = "";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: []
        },
      });
      const errorResponse = {
        success: false,
        message: "Response message"
      };
      axios.post.mockResolvedValue({ data: errorResponse });
      render(<CreateCategory />);

      const createButton = screen.getByTestId("submit-button");
      const createInput = screen.getByTestId("form-input");
      fireEvent.change(createInput, { target: { value: newName } });
      await waitFor(async () => {
        await user.click(createButton);
      });

      await waitFor(() => expect(axios.post).not.toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Name is required"));
    });

    it("should display error on fail create category", async () => {
      const user = userEvent.setup();
      const newName = "Book";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: []
        },
      });
      const errorResponse = {
        success: false,
        message: "Response message"
      };
      axios.post.mockResolvedValue({ data: errorResponse });
      render(<CreateCategory />);

      const createButton = screen.getByTestId("submit-button");
      const createInput = screen.getByTestId("form-input");
      fireEvent.change(createInput, { target: { value: newName } });
      await waitFor(async () => {
        await user.click(createButton);
      });

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorResponse.message));
    });

    it("should display error on create category error", async () => {
      const user = userEvent.setup();
      const newName = "Book";
      const error = new Error("Network error");
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: []
        },
      });
      axios.post.mockRejectedValue(error);
      render(<CreateCategory />);

      const createInput = screen.getByTestId("form-input");
      fireEvent.change(createInput, { target: { value: newName } });
      const createButton = screen.getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(createButton);
      });

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong in input form"));
    });

    it("should display error on create category returns undefined", async () => {
      const user = userEvent.setup();
      const newName = "Book";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: []
        },
      });
      axios.post.mockResolvedValue({ data: undefined });
      render(<CreateCategory />);

      const createInput = screen.getByTestId("form-input");
      fireEvent.change(createInput, { target: { value: newName } });
      const createButton = screen.getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(createButton);
      });

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong in creating category"));
    });

    it("should display error on create category returns null", async () => {
      const user = userEvent.setup();
      const newName = "Book";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: []
        },
      });
      axios.post.mockResolvedValue({ data: null });
      render(<CreateCategory />);

      const createInput = screen.getByTestId("form-input");
      fireEvent.change(createInput, { target: { value: newName } });
      const createButton = screen.getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(createButton);
      });

      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong in creating category"));
    });

    it("should display error on fail update category", async () => {
      const user = userEvent.setup();
      const updatedName = "Clothing";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [{
            _id: "validId",
            name: "Book",
            slug: "book"
          }]
        },
      });
      const errorResponse = {
        success: false,
        message: "Response message"
      };
      axios.put.mockResolvedValue({ data: errorResponse });
      render(<CreateCategory />);

      await waitFor(async () => {
        const editButton = screen.getByRole("button", {name: "Edit"});
        await user.click(editButton);
      });
      const formInput = within(screen.getByTestId("update-modal")).getByTestId("form-input");
      fireEvent.change(formInput, { target: { value: updatedName } });
      const submitButton = within(screen.getByTestId("update-modal")).getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => expect(axios.put).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(errorResponse.message));
    });

    it("should display error on empty name in update category", async () => {
      const user = userEvent.setup();
      const updatedName = "";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [{
            _id: "validId",
            name: "Book",
            slug: "book"
          }]
        },
      });
      const errorResponse = {
        success: false,
        message: "Response message"
      };
      axios.put.mockResolvedValue({ data: errorResponse });
      render(<CreateCategory />);

      await waitFor(async () => {
        const editButton = screen.getByRole("button", {name: "Edit"});
        await user.click(editButton);
      });
      const formInput = within(screen.getByTestId("update-modal")).getByTestId("form-input");
      fireEvent.change(formInput, { target: { value: updatedName } });
      const submitButton = within(screen.getByTestId("update-modal")).getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => expect(axios.put).not.toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Name is required"));
    });

    it("should display error on duplicate name in update category", async () => {
      const user = userEvent.setup();
      const updatedName = "Clothing";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [
            {
            _id: "validId1",
            name: "Book",
            slug: "book"
            },
            {
            _id: "validId2",
            name: "Clothing",
            slug: "clothing"
          }
        ]
        },
      });
      const errorResponse = {
        success: false,
        message: "Response message"
      };
      axios.put.mockResolvedValue({ data: errorResponse });
      render(<CreateCategory />);

      await waitFor(async () => {
        const dataRows = screen.getAllByRole("row");
        const bookRow = dataRows[1];
        const editButton = within(bookRow).getByRole("button", {name: "Edit"});
        await user.click(editButton);
      });
      const formInput = within(screen.getByTestId("update-modal")).getByTestId("form-input");
      fireEvent.change(formInput, { target: { value: updatedName } });
      const submitButton = within(screen.getByTestId("update-modal")).getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => expect(axios.put).not.toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Clothing already exists"));
    });

    it("should display error on update category error", async () => {
      const user = userEvent.setup();
      const updatedName = "Clothing";
      const error = new Error("Network error");
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [{
            _id: "validId",
            name: "Book",
            slug: "book"
          }]
        },
      });
      axios.put.mockRejectedValue(error);
      render(<CreateCategory />);

      await waitFor(async () => {
        const editButton = screen.getByRole("button", {name: "Edit"});
        await user.click(editButton);
      });
      const formInput = within(screen.getByTestId("update-modal")).getByTestId("form-input");
      fireEvent.change(formInput, { target: { value: updatedName } });
      const submitButton = within(screen.getByTestId("update-modal")).getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => expect(axios.put).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Something went wrong"));
    });

    it("should display error on update category returns undefined", async () => {
      const user = userEvent.setup();
      const updatedName = "Clothing";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [{
            _id: "validId",
            name: "Book",
            slug: "book"
          }]
        },
      });
      axios.put.mockResolvedValue({ data: undefined });
      render(<CreateCategory />);

      await waitFor(async () => {
        const editButton = screen.getByRole("button", {name: "Edit"});
        await user.click(editButton);
      });
      const formInput = within(screen.getByTestId("update-modal")).getByTestId("form-input");
      fireEvent.change(formInput, { target: { value: updatedName } });
      const submitButton = within(screen.getByTestId("update-modal")).getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => expect(axios.put).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error updating name"));
    });

    it("should display error on update category returns null", async () => {
      const user = userEvent.setup();
      const updatedName = "Clothing";
      axios.get.mockResolvedValue({
        data: {
          success: true,
          message: "Response message",
          category: [{
            _id: "validId",
            name: "Book",
            slug: "book"
          }]
        },
      });
      axios.put.mockResolvedValue({ data: null });
      render(<CreateCategory />);

      await waitFor(async () => {
        const editButton = screen.getByRole("button", {name: "Edit"});
        await user.click(editButton);
      });
      const formInput = within(screen.getByTestId("update-modal")).getByTestId("form-input");
      fireEvent.change(formInput, { target: { value: updatedName } });
      const submitButton = within(screen.getByTestId("update-modal")).getByTestId("submit-button");
      await waitFor(async () => {
        await user.click(submitButton);
      });

      await waitFor(() => expect(axios.put).toHaveBeenCalled());
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error updating name"));
    });
  });
});
