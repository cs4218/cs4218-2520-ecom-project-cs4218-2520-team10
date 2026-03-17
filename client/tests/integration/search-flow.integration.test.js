/**
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { SearchProvider } from "../../src/context/search";
import SearchInput from "../../src/components/Form/SearchInput";
import Search from "../../src/pages/Search";

jest.mock("axios");

jest.mock("../../src/components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <h2>{title}</h2>
    {children}
  </div>
));

describe("FE-INT-3: SearchInput ↔ SearchContext ↔ Search Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSearchFlow = () => {
    return render(
      <SearchProvider>
        <MemoryRouter initialEntries={["/"]}>
          {/* Render SearchInput (like it would be in a header) */}
          <SearchInput />
          
          <Routes>
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/search" element={<Search />} />
          </Routes>
        </MemoryRouter>
      </SearchProvider>
    );
  };

  describe("Test Case 1: Search flow: type keyword → results appear on Search page", () => {
    it("should display mocked products when search is submitted", async () => {
      const mockProducts = [
        {
          _id: "1",
          name: "Dell Laptop",
          description: "A fast laptop for work",
          price: 999,
        },
        {
          _id: "2",
          name: "HP Laptop",
          description: "A budget friendly laptop",
          price: 599,
        }
      ];
      axios.get.mockResolvedValueOnce({ data: mockProducts });

      renderSearchFlow();

      const searchInput = screen.getByTestId("search-input");
      const searchButton = screen.getByTestId("search-button");

      fireEvent.change(searchInput, { target: { value: "laptop" } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
        
        expect(screen.getByTestId("results-count")).toHaveTextContent("2");
        expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
        expect(screen.getByText(mockProducts[1].name)).toBeInTheDocument();
      });
    });
  });

  describe("Test Case 2: Empty search flow: type keyword → no results found", () => {
    it("should display 'No Products Found' when API returns an empty array", async () => {
      axios.get.mockResolvedValueOnce({ data: [] });

      renderSearchFlow();

      const searchInput = screen.getByTestId("search-input");
      const searchButton = screen.getByTestId("search-button");

      fireEvent.change(searchInput, { target: { value: "nonexistentitem" } });
      fireEvent.click(searchButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/nonexistentitem");
        expect(screen.getByText("No Products Found")).toBeInTheDocument();
      });
    });
  });
});