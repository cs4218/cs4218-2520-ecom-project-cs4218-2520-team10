/**
 * Integration Test: FE-INT-8
 * Author: Kim Shi Tong, A0265858J
 *
 * APPROACH: Bottom-up integration testing (Level 1)
 *
 * Level 0 (MS1 — done): Units tested in isolation with full mocking.
 * Level 1 (this file): PrivateRoute integrated with REAL AuthProvider + REAL Spinner
 *   - PrivateRoute reads token from REAL AuthProvider (context/auth.js)
 *   - PrivateRoute makes API call to verify auth (axios mocked)
 *   - Authenticated user sees protected content (Outlet)
 *   - Unauthenticated user sees REAL Spinner with countdown + redirect
 *
 * What was mocked in MS1 that is NOW REAL:
 *   - useAuth context → now real AuthProvider wrapping PrivateRoute
 *   - Spinner component → now real Spinner with countdown + redirect
 *   - localStorage → real browser storage (jsdom)
 *
 * What stays mocked (and why):
 *   - axios: Frontend tests don't run a real backend server
 *
 * Integration points tested:
 *   - PrivateRoute reads token from real AuthProvider
 *   - PrivateRoute calls /api/v1/auth/user-auth with real token
 *   - On success: renders Outlet (protected content)
 *   - On failure: renders real Spinner → countdown → redirect to /login
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../../src/context/auth";
import { CartProvider } from "../../src/context/cart";
import { SearchProvider } from "../../src/context/search";
import PrivateRoute from "../../src/components/Routes/Private";
import axios from "axios";

// ONLY mock the network layer
jest.mock("axios");

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  localStorage.clear();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("FE-INT-8: PrivateRoute ↔ AuthContext ↔ Spinner Integration", () => {
  // // Kim Shi Tong, A0265858J
  it("should show protected content when user is authenticated", async () => {
    // Pre-set auth in localStorage (AuthProvider reads from here on init)
    localStorage.setItem(
      "auth",
      JSON.stringify({
        user: { name: "John", role: 0 },
        token: "valid-token",
      })
    );

    // Mock the auth-check API endpoint that PrivateRoute calls
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/auth/user-auth")) {
        return Promise.resolve({ data: { ok: true } });
      }
      return Promise.resolve({ data: { success: true, category: [] } });
    });

    await act(async () => {
      render(
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                  <Route path="/dashboard" element={<PrivateRoute />}>
                    <Route path="" element={<div>Protected Content</div>} />
                  </Route>
                  <Route path="/login" element={<div>Login Page</div>} />
                </Routes>
              </MemoryRouter>
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    // Spinner / redirect should NOT appear
    expect(screen.queryByText(/redirecting/i)).not.toBeInTheDocument();
  });

  // // Kim Shi Tong, A0265858J
  it("should show Spinner and redirect to login when user is not authenticated", async () => {
    // No auth in localStorage
    localStorage.clear();

    axios.get.mockImplementation((url) => {
      if (url.includes("/api/v1/auth/user-auth")) {
        return Promise.resolve({ data: { ok: false } });
      }
      return Promise.resolve({ data: { success: true, category: [] } });
    });

    await act(async () => {
      render(
        <AuthProvider>
          <CartProvider>
            <SearchProvider>
              <MemoryRouter initialEntries={["/dashboard"]}>
                <Routes>
                  <Route path="/dashboard" element={<PrivateRoute />}>
                    <Route path="" element={<div>Protected Content</div>} />
                  </Route>
                  <Route path="/" element={<div>Login Page</div>} />
                </Routes>
              </MemoryRouter>
            </SearchProvider>
          </CartProvider>
        </AuthProvider>
      );
    });

    // Spinner should render with countdown text
    expect(screen.getByText(/redirecting/i)).toBeInTheDocument();

    // Protected content should NOT appear
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();

    // Advance timer through countdown (Spinner counts down from 3)
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // After countdown, should redirect to login (path="" redirects to "/")
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });
});
