/**
 * Integration Test: FE-INT-2
 * Author: Kim Shi Tong, A0265858J
 *
 * APPROACH: Bottom-up integration testing (Level 1)
 *
 * Level 0 (MS1 — done): Units tested in isolation with full mocking.
 * Level 1 (this file): Pages integrated with REAL context providers + REAL React Router
 *   - Register.js and Login.js rendered in a real Routes tree
 *   - After successful registration, navigation to /login renders Login page
 *
 * What was mocked in MS1 that is NOW REAL:
 *   - useAuth context → now real AuthProvider
 *   - React Router navigation → real MemoryRouter with Routes
 *   - Register → Login page transition via real navigate()
 *
 * What stays mocked (and why):
 *   - axios: Frontend tests don't run a real backend server
 *   - react-hot-toast: External UI notification library, not an integration point
 *   - Layout: Simplified to avoid Helmet/Footer complexity
 *
 * Integration points tested:
 *   - Register.js calls API → on success, calls navigate("/login")
 *   - React Router renders Login.js at /login path
 *   - Both pages work within the same real provider tree
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../src/context/auth";
import { CartProvider } from "../../src/context/cart";
import { SearchProvider } from "../../src/context/search";
import Register from "../../src/pages/auth/Register";
import Login from "../../src/pages/auth/Login";
import axios from "axios";

// ONLY mock the network layer
jest.mock("axios");

// Mock toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => null,
}));

// Mock Layout to render children directly
jest.mock("../../src/components/Layout", () => {
  return function MockLayout({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();

  // Default axios mock for any GET requests (e.g., category)
  axios.get.mockResolvedValue({
    data: { success: true, category: [] },
  });
});

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
});

describe("FE-INT-2: Register → Login Navigation Integration", () => {
  // // Kim Shi Tong, A0265858J
  it("should navigate from Register to Login page after successful registration", async () => {
    // Mock register API success
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "User registered successfully" },
    });

    render(
      <AuthProvider>
        <CartProvider>
          <SearchProvider>
            <MemoryRouter initialEntries={["/register"]}>
              <Routes>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
              </Routes>
            </MemoryRouter>
          </SearchProvider>
        </CartProvider>
      </AuthProvider>
    );

    // Verify we start on Register page
    expect(screen.getByText("REGISTER FORM")).toBeInTheDocument();

    // Fill in registration form
    await userEvent.type(screen.getByPlaceholderText(/Enter Your Name/i), "John");
    await userEvent.type(screen.getByPlaceholderText(/Enter Your Email/i), "john@test.com");
    await userEvent.type(screen.getByPlaceholderText(/Enter Your Password/i), "password123");
    await userEvent.type(screen.getByPlaceholderText(/Enter Your Phone/i), "12345678");
    await userEvent.type(screen.getByPlaceholderText(/Enter Your Address/i), "123 Street");
    // DOB field
    await userEvent.type(screen.getByPlaceholderText(/Enter Your DOB/i), "2000-01-01");
    // Answer field
    await userEvent.type(screen.getByPlaceholderText(/What is Your Favorite sports/i), "fluffy");

    await userEvent.click(screen.getByRole("button", { name: /REGISTER/i }));

    // After navigation, the Login page should render
    await waitFor(() => {
      expect(screen.getByText("LOGIN FORM")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter Your Email/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /LOGIN/i })).toBeInTheDocument();
    });
  });
});
