/*
  Test cases written by: Shaun Lee Xuan Wei A0252626E
*/
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Categories from './Categories';
import useCategory from '../hooks/useCategory';

jest.mock('../components/Layout', () => ({children}) => <div>{children}</div>);
jest.mock('../hooks/useCategory');

/**
  * Unit tests for Categories page
  *
  * 1. renders no links if empty array categories
  * 2. renders no links if undefined categories
  * 3. renders no links if null categories
  * 4. renders links with correct text and href given valid categories
  */

describe('Categories Page', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders no links if empty categories', () => {
    useCategory.mockReturnValue({
      categories: [],
      loading: false,
      error: null
    });
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <Routes>
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('renders no links if undefined categories', () => {
    useCategory.mockReturnValue({
      categories: undefined,
      loading: false,
      error: null
    });
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <Routes>
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('renders no links if null categories', () => {
    useCategory.mockReturnValue({
      categories: null,
      loading: false,
      error: null
    });
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <Routes>
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it("renders links with correct text and href given valid categories", () => {
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
      },
    ];
    useCategory.mockReturnValue({
      categories: mockCategories,
      loading: false,
      error: null
    });
    render(
      <MemoryRouter initialEntries={["/categories"]}>
        <Routes>
          <Route path="/categories" element={<Categories />} />
        </Routes>
      </MemoryRouter>
    );

    const links = screen.queryAllByRole('link');

    expect(links).toHaveLength(mockCategories.length);
    links.forEach((link, index) => {
      expect(link).toHaveTextContent(new RegExp(`^${mockCategories[index].name}$`));
      expect(link).toHaveAttribute('href', `/category/${mockCategories[index].slug}`);
    });
  });
});
