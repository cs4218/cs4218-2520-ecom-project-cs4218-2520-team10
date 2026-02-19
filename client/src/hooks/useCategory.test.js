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
  * 1. Happy path: 2 tests
  *   a. initial state empty array
  *   b. return categories when api return valid response
  * 2. Input API output: 2 tests
  *   a. axios returns undefined category
  *   b. axios returns null category
  * 3. Error handling: 1 tests
  *   a. return empty array on error
  * 4. Side effects: 1 tests
  *   a. Log error when error occurs
  */
describe('useCategory', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Happy Path", () => {
    it("should return initial data as empty array", () => {
      axios.get.mockResolvedValue(new Promise(() => {}));

      const { result } = renderHook(() => useCategory());

      expect(result.current).toEqual([]);
    });

    it('should return categories when API returns valid data', async () => {
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
      ]
      axios.get.mockResolvedValue({
        data: {
          category: mockCategories
        }
      });

      const { result } = renderHook(() => useCategory());

      await waitFor(() => {expect(result.current).toEqual(mockCategories)});
    });
  });

  describe("Invalid API Output", () => {
    it('should return empty array when API returns undefined', async () => {
      axios.get.mockResolvedValue({
        data: {
          category: undefined
        }
      });

      const { result } = renderHook(() => useCategory());
      await act(async () => await Promise.resolve());

      await waitFor(() => expect(result.current).toEqual([]))
    });

    it('should return empty array when API returns null', async () => {
      axios.get.mockResolvedValue({
        data: {
          category: null
        }
      });

      const { result } = renderHook(() => useCategory());
      await act(async () => await Promise.resolve());

      await waitFor(() => expect(result.current).toEqual([]));
    });
  });

  describe("Error Handling", () => {
    it('should handle API error gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCategory());

      expect(result.current).toEqual([]);
    });
  });

  describe("Side Effects", () => {
    it('should log error if occurs', async () => {
      const error = new Error('Network error');
      axios.get.mockRejectedValue(error);

      renderHook(() => useCategory());

      await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith(error));
    });
  });
});
