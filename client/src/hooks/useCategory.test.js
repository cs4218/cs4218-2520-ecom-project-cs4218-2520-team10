/*
  Test cases written by: Shaun Lee Xuan Wei A0252626E
*/
import { renderHook, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import useCategory from './useCategory';
import React from 'react';

jest.mock('axios');

/**
  * Unit tests for useCategory
  *
  * 1. Happy path: 3 tests
  *   a. categories empty, loading true, error null for initial state
  *   b. valid loaded state and non-empty categories
  *   c. valid loaded state and empty categories
  * 2. Input API output: 2 tests
  *   a. valid loaded state and empty categories on undefined categories from api
  *   b. valid loaded state and empty categories on null categories from api
  * 3. Error handling: 1 tests
  *   a. valid error state
  */
describe('useCategory', () => {
  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe("Happy Path", () => {
    it("should have valid initial state", async () => {
      axios.get.mockResolvedValue({ data: { categories: [] }});

      const { result } = renderHook(() => useCategory());

      await waitFor(() => expect(result.current).toEqual({
        categories: [],
        loading: true,
        error: null
      }));
    });

    it('should have valid loaded state and returned non empty categories', async () => {
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
      axios.get.mockResolvedValue({ data: { category: mockCategories } });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toEqual({
          categories: mockCategories,
          loading: false,
          error: null
        })
      });
    });

    it('should have valid loaded state and returned empty categories', async () => {
      axios.get.mockResolvedValue({ data: { category: [] } });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {
        expect(result.current).toEqual({
          categories: [],
          loading: false,
          error: null
        })
      });
    });
  });

  describe("Invalid API Output", () => {
    it('should return empty array when API returns undefined', async () => {
      axios.get.mockResolvedValue({ data: { category: undefined } });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => expect(result.current).toEqual({
        categories: [],
        loading: false,
        error: null
      }));
    });

    it('should return empty array when API returns null', async () => {
      axios.get.mockResolvedValue({ data: { category: null } });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => expect(result.current).toEqual({
        categories: [],
        loading: false,
        error: null
      }));
    });
  });

  describe("Error Handling", () => {
    it('should handle API error gracefully', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      const { result } = renderHook(() => useCategory());

      await waitFor(() => expect(result.current).toEqual({
        categories: [],
        loading: false,
        error
      }));
    });
  });
});
