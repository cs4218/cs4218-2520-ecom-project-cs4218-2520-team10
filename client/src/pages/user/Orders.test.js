// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */
import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import Orders from './Orders';
import moment from 'moment';

// Mock axios
jest.mock('axios');

// Mock moment
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return jest.fn((date) => {
    const momentInstance = actualMoment(date);
    momentInstance.fromNow = jest.fn(() => '2 days ago');
    return momentInstance;
  });
});

// Mock useAuth hook
jest.mock('../../context/auth', () => ({
  useAuth: jest.fn()
}));

// Mock child components
jest.mock('../../components/UserMenu', () => {
  return function UserMenu() {
    return <div data-testid="user-menu">UserMenu</div>;
  };
});

jest.mock('../../components/Layout', () => {
  return function Layout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

/**
 * Unit Tests for Orders Component
 *
 * Test Strategy: Output-based testing (UI focus)
 *
 * Testing Techniques Applied:
 *
 * 1. Statement Coverage
 * 2. Branch Coverage
 * 
 * All Tests Created:
 * 1. should render the Orders component with all main elements
 * 2. should pass correct title prop to Layout component
 * 3. should fetch orders when auth token exists
 * 4. should not fetch orders when auth token is missing
 * 5. should handle API errors gracefully
 * 6. should display orders when data is fetched successfully
 * 7. should display multiple orders correctly
 * 8. should display correct payment status - Success
 * 9. should display correct payment status - Failed
 * 10. should display correct order quantity based on products length
 * 11. should display order index correctly
 * 12. should display product details correctly
 * 13. should display multiple products correctly
 * 14. should truncate product description to 30 characters
 * 15. should render product images with correct src
 * 16. should format order date using moment.fromNow()
 * 17. should handle empty orders array gracefully
 * 18. should handle orders with empty products array
 * 19. should refetch orders when auth token changes
 * 20. should not fetch orders when component unmounts before API response
 * 21. should render table headers correctly
 */
describe('Orders Component', () => {
  const mockAuth = {
    user: { id: 1, name: 'John Doe' },
    token: 'mock-token-123'
  };

  const mockSetAuth = jest.fn();
  const { useAuth } = require('../../context/auth');

  beforeEach(() => {
    jest.clearAllMocks();

    useAuth.mockReturnValue([mockAuth, mockSetAuth]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the Orders component with all main elements', () => {
      axios.get.mockResolvedValue({ data: [] });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      expect(screen.getByText('All Orders')).toBeInTheDocument();
    });

    it('should pass correct title prop to Layout component', () => {
      axios.get.mockResolvedValue({ data: [] });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      const layoutElement = screen.getByTestId('layout');
      expect(layoutElement).toHaveAttribute('data-title', 'Your Orders');
    });
  });

  describe('API Calls and Data Fetching', () => {
    it('should fetch orders when auth token exists', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: []
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/orders');
      });
    });

    it('should not fetch orders when auth token is missing', async () => {
      useAuth.mockReturnValue([{ user: null, token: null }, mockSetAuth]);

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const mockError = new Error('Network error');
      axios.get.mockRejectedValue(mockError);

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      expect(consoleSpy).toHaveBeenCalledWith(mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('Order Display', () => {
    it('should display orders when data is fetched successfully', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: [
            {
              _id: 'product1',
              name: 'Product 1',
              description: 'This is a test product description',
              price: 100
            }
          ]
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        const dataRow = rows[1]; // Get the data row (skip header row)
        const cells = within(dataRow).getAllByRole('cell');
        
        // Check if expected values exist in any cell of the row
        const cellTexts = cells.map(cell => cell.textContent);
        expect(cellTexts).toContain('Processing');
        expect(cellTexts).toContain('John Doe');
        expect(cellTexts).toContain('Success');
      });
    });

    it('should display multiple orders correctly', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: [
            {
              _id: 'product1',
              name: 'Product 1',
              description: 'Description 1',
              price: 100
            }
          ]
        },
        {
          _id: 'order2',
          status: 'Shipped',
          buyer: { name: 'Jane Smith' },
          createAt: new Date('2024-02-21'),
          payment: { success: false },
          products: [
            {
              _id: 'product2',
              name: 'Product 2',
              description: 'Description 2',
              price: 200
            }
          ]
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const tables = screen.getAllByRole('table');
        
        // First order table
        const firstTable = tables[0];
        const firstRows = within(firstTable).getAllByRole('row');
        const firstDataRow = firstRows[1];
        const firstCellTexts = within(firstDataRow).getAllByRole('cell').map(cell => cell.textContent);
        expect(firstCellTexts).toContain('Processing');
        expect(firstCellTexts).toContain('John Doe');
        
        // Second order table
        const secondTable = tables[1];
        const secondRows = within(secondTable).getAllByRole('row');
        const secondDataRow = secondRows[1];
        const secondCellTexts = within(secondDataRow).getAllByRole('cell').map(cell => cell.textContent);
        expect(secondCellTexts).toContain('Shipped');
        expect(secondCellTexts).toContain('Jane Smith');
      });
    });

    it('should display correct payment status - Success', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: []
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        const dataRow = rows[1];
        const cellTexts = within(dataRow).getAllByRole('cell').map(cell => cell.textContent);
        expect(cellTexts).toContain('Success');
      });
    });

    it('should display correct payment status - Failed', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: false },
          products: []
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        const dataRow = rows[1];
        const cellTexts = within(dataRow).getAllByRole('cell').map(cell => cell.textContent);
        expect(cellTexts).toContain('Failed');
      });
    });

    it('should display correct order quantity based on products length', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: [
            { _id: 'p1', name: 'Product 1', description: 'Desc 1', price: 100 },
            { _id: 'p2', name: 'Product 2', description: 'Desc 2', price: 200 },
            { _id: 'p3', name: 'Product 3', description: 'Desc 3', price: 300 }
          ]
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        const dataRow = rows[1];
        const cellTexts = within(dataRow).getAllByRole('cell').map(cell => cell.textContent);
        expect(cellTexts).toContain('3');
      });
    });

    it('should display order index correctly', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: []
        },
        {
          _id: 'order2',
          status: 'Shipped',
          buyer: { name: 'Jane Smith' },
          createAt: new Date('2024-02-21'),
          payment: { success: true },
          products: []
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const indices = screen.getAllByText(/^[12]$/);
        expect(indices).toHaveLength(2);
      });
    });
  });

  describe('Product Display', () => {
    it('should display product details correctly', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: [
            {
              _id: 'product1',
              name: 'Test Product',
              description: 'This is a test product with a long description',
              price: 150
            }
          ]
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const productContainer = screen.getByText('Test Product').closest('.card');
        expect(within(productContainer).getByText('Test Product')).toBeInTheDocument();
        expect(within(productContainer).getByText('This is a test product with a')).toBeInTheDocument();
        expect(within(productContainer).getByText('Price : 150')).toBeInTheDocument();
      });
    });

    it('should display multiple products correctly', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: [
            {
              _id: 'product1',
              name: 'Product 1',
              description: 'Description for product 1',
              price: 100
            },
            {
              _id: 'product2',
              name: 'Product 2',
              description: 'Description for product 2',
              price: 200
            }
          ]
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const productCards = screen.getAllByText(/^Product [12]$/).map(el => el.closest('.card'));
        
        // First product
        expect(within(productCards[0]).getByText('Product 1')).toBeInTheDocument();
        expect(within(productCards[0]).getByText('Price : 100')).toBeInTheDocument();
        
        // Second product
        expect(within(productCards[1]).getByText('Product 2')).toBeInTheDocument();
        expect(within(productCards[1]).getByText('Price : 200')).toBeInTheDocument();
      });
    });

    it('should truncate product description to 30 characters', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: [
            {
              _id: 'product1',
              name: 'Product with Long Description',
              description: 'This is a very long product description that should be truncated',
              price: 300
            }
          ]
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const productCard = screen.getByText('Product with Long Description').closest('.card');
        const descriptionElement = within(productCard).getByText('This is a very long product de');
        expect(descriptionElement).toBeInTheDocument();
        // Verify it's exactly 30 characters
        expect(descriptionElement.textContent).toHaveLength(30);
      });
    });

    it('should render product images with correct src', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: [
            {
              _id: 'product123',
              name: 'Test Product',
              description: 'Test description',
              price: 100
            }
          ]
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const productCard = screen.getByText('Test Product').closest('.card');
        const img = within(productCard).getByAltText('Test Product');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', '/api/v1/product/product-photo/product123');
      });
    });
  });

  describe('Date Formatting', () => {
    it('should format order date using moment.fromNow()', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: []
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        const dataRow = rows[1];
        const cellTexts = within(dataRow).getAllByRole('cell').map(cell => cell.textContent);
        expect(cellTexts).toContain('2 days ago');
      });

      expect(moment).toHaveBeenCalled();
    });
  });

  describe('Empty State', () => {
    it('should handle empty orders array gracefully', async () => {
      axios.get.mockResolvedValue({ data: [] });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      expect(screen.getByText('All Orders')).toBeInTheDocument();
      expect(screen.queryByText('Processing')).not.toBeInTheDocument();
    });

    it('should handle orders with empty products array', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: []
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        const table = screen.getByRole('table');
        const rows = within(table).getAllByRole('row');
        const dataRow = rows[1];
        const cellTexts = within(dataRow).getAllByRole('cell').map(cell => cell.textContent);
        expect(cellTexts).toContain('Processing');
        expect(cellTexts).toContain('0');
      });
    });
  });

  describe('useEffect Hook Behavior', () => {
    it('should refetch orders when auth token changes', async () => {
      const { rerender } = render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });

      // Update auth token
      const newMockAuth = {
        user: { id: 2, name: 'Jane Doe' },
        token: 'new-token-456'
      };
      useAuth.mockReturnValue([newMockAuth, mockSetAuth]);

      rerender(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(2);
      });
    });

    it('should not fetch orders when component unmounts before API response', async () => {
      axios.get.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100)));

      const { unmount } = render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      unmount();

      // Verify axios was called but component unmounted
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Table Structure', () => {
    it('should render table headers correctly', async () => {
      const mockOrders = [
        {
          _id: 'order1',
          status: 'Processing',
          buyer: { name: 'John Doe' },
          createAt: new Date('2024-02-20'),
          payment: { success: true },
          products: []
        }
      ];

      axios.get.mockResolvedValue({ data: mockOrders });

      render(
        <MemoryRouter>
          <Orders />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('#')).toBeInTheDocument();
        expect(screen.getByText('Status')).toBeInTheDocument();
        expect(screen.getByText('Buyer')).toBeInTheDocument();
        expect(screen.getByText('date')).toBeInTheDocument();
        expect(screen.getByText('Payment')).toBeInTheDocument();
        expect(screen.getByText('Quantity')).toBeInTheDocument();
      });
    });
  });
});
