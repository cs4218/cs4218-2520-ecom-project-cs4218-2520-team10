/*
  Test cases written by: Shaun Lee Xuan Wei A0252626E
*/
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import CategoryForm from "./CategoryForm";
import userEvent from '@testing-library/user-event';

/**
  * Unit tests for CategoryForm component
  * 
  * 1. renders the category form when the value is an empty string
  * 2. Renders the category form when the value is a non-empty string
  * 3. default input value to empty string when value prop is undefined
  * 4. default input value to empty string when value prop is null
  * 5. calls setValue on every input change
  * 6. calls handleSubmit once on form submit
  * 7. never calls setValue with undefined or null
  */
describe("CategoryForm", () => {
  const mockSetValue = jest.fn();
  const mockHandleSubmit = jest.fn((e) => e.preventDefault());

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("renders category form with empty value", () => {
    const mockValue = "";
    render(<CategoryForm value={mockValue} setValue={mockSetValue} handleSubmit={mockHandleSubmit} />);
    const input = screen.getByPlaceholderText("Enter new category");
    const button = screen.getByRole("button", { name: "Submit" });

    expect(input).toBeInTheDocument();
    expect(input.value).toBe(mockValue);
    expect(button).toBeInTheDocument();
  });

  it("renders category form with non-empty value", () => {
    const mockValue = "some value";
    render(<CategoryForm value={mockValue} setValue={mockSetValue} handleSubmit={mockHandleSubmit} />);
    const input = screen.getByPlaceholderText("Enter new category");
    const button = screen.getByRole("button", { name: "Submit" });

    expect(input).toBeInTheDocument();
    expect(input.value).toBe(mockValue);
    expect(button).toBeInTheDocument();
  });

  it("default input value to empty string when value prop is undefined", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    const { rerender } = render(<CategoryForm value={undefined} setValue={mockSetValue} handleSubmit={mockHandleSubmit} />);
    const input = screen.getByPlaceholderText("Enter new category");
    rerender(<CategoryForm value={""} setValue={mockSetValue} handleSubmit={mockHandleSubmit} />);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("");
  });

  it("default input value to empty string when value prop is null", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    render(<CategoryForm value={null} setValue={mockSetValue} handleSubmit={mockHandleSubmit} />);
    const input = screen.getByPlaceholderText("Enter new category");
    const button = screen.getByRole("button", { name: "Submit" });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("");
    expect(button).toBeInTheDocument();
  });

  it("calls setValue on every input change", async () => {
    const user = userEvent.setup();
    const newValue = "New Category";
    render(<CategoryForm value="" setValue={mockSetValue} handleSubmit={mockHandleSubmit} />);
    const input = screen.getByPlaceholderText(/enter new category/i);

    await user.type(input, newValue);

    expect(mockSetValue).toHaveBeenCalledTimes(newValue.length);
    expect(mockSetValue.mock.calls.map(c => c[0]).join("")).toBe(newValue);
  });

  it("calls handleSubmit once on form submit", async () => {
    const user = userEvent.setup();
    render(<CategoryForm value="Test" setValue={mockSetValue} handleSubmit={mockHandleSubmit} />);
    const button = screen.getByRole("button", { name: "Submit" });

    await user.click(button);

    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });

  it("never calls setValue with undefined or null", async () => {
    const user = userEvent.setup();
    render(<CategoryForm value="test" setValue={mockSetValue} handleSubmit={mockHandleSubmit} />);
    const input = screen.getByPlaceholderText("Enter new category");

    await user.type(input, "New Category");
    await user.clear(input);

    mockSetValue.mock.calls.forEach(([arg]) => {
      expect(arg).not.toBeUndefined();
      expect(arg).not.toBeNull();
      expect(typeof arg).toBe("string");
    });
  });
});
