// File & Tests Created - Shaun Lee Xuan Wei A0252626E
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Integration Tests: PrivateRoute ↔ AuthContext ↔ Spinner
 *
 * Test Strategy: Integration-based testing with real AuthProvider and real Spinner, mocked axios
 *
 * Components Under Test:
 * - components/Routes/Private.js (reads auth token from context, calls user-auth API, renders Outlet or Spinner)
 * - context/auth.js (AuthProvider/useAuth — provides auth state initialized from localStorage)
 * - components/Spinner.js (renders countdown and redirects when unauthenticated)
 *
 * Test Doubles Used:
 * - axios mocked (external HTTP dependency — no real network calls)
 * - localStorage pre-seeded per test (to inject auth state into real AuthProvider)
 * - AuthProvider is REAL (integration point being tested)
 * - Spinner is REAL (integration point being tested)
 *
 * Scenario Plan:
 * #  | Scenario                                              | Setup                                      | Expected Result
 * ---|-------------------------------------------------------|--------------------------------------------|-----------------------------------------
 * 1  | Authenticated user passes PrivateRoute                | Auth token in localStorage, API → {ok:true}| Outlet child renders
 * 2  | Unauthenticated user sees Spinner (no token)          | No auth in localStorage, no API call       | Spinner renders with countdown text
 * 3  | Token present but API returns ok:false                | Auth token in localStorage, API → {ok:false}| Spinner renders, Outlet child absent
 * 4  | Spinner redirects to / after countdown completes      | No auth in localStorage                    | Navigate called to / after 3 seconds
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import PrivateRoute from "../../src/components/Routes/Private";
import { AuthProvider } from "../../src/context/auth";

jest.mock("axios");

const renderPrivateRoute = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <AuthProvider>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<div>Protected Content</div>} />
          </Route>
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

describe("FE-INT-8: PrivateRoute ↔ AuthContext ↔ Spinner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  describe("Test 1: Authenticated user passes PrivateRoute", () => {
    it("should render Outlet child when auth token is present and API returns ok:true", async () => {
      // ── ARRANGE ──────────────────────────────────
      localStorage.setItem(
        "auth",
        JSON.stringify({ user: { name: "Test User" }, token: "valid-token" })
      );
      axios.get.mockResolvedValueOnce({ data: { ok: true } });

      // ── ACT ──────────────────────────────────────
      renderPrivateRoute();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });
    });
  });

  describe("Test 2: Unauthenticated user sees Spinner when no token", () => {
    it("should render Spinner with countdown text and not call the auth API", async () => {
      // ── ARRANGE ──────────────────────────────────
      // localStorage is already cleared in beforeEach — no auth set

      // ── ACT ──────────────────────────────────────
      renderPrivateRoute();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).not.toHaveBeenCalled();
        expect(
          screen.getByText(/redirecting to you in/i)
        ).toBeInTheDocument();
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
      });
    });
  });

  describe("Test 3: Token present but API returns ok:false", () => {
    it("should render Spinner and not render Outlet child when API denies access", async () => {
      // ── ARRANGE ──────────────────────────────────
      localStorage.setItem(
        "auth",
        JSON.stringify({ user: { name: "Test User" }, token: "expired-token" })
      );
      axios.get.mockResolvedValueOnce({ data: { ok: false } });

      // ── ACT ──────────────────────────────────────
      renderPrivateRoute();

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
        expect(
          screen.getByText(/redirecting to you in/i)
        ).toBeInTheDocument();
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
      });
    });
  });

  describe("Test 4: Spinner redirects to / after countdown completes", () => {
    it("should navigate to / and show Home Page after 3 seconds", async () => {
      // ── ARRANGE ──────────────────────────────────
      jest.useFakeTimers();

      // ── ACT ──────────────────────────────────────
      renderPrivateRoute();

      await waitFor(() => {
        expect(screen.getByText(/redirecting to you in/i)).toBeInTheDocument();
      });

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // ── ASSERT ───────────────────────────────────
      await waitFor(() => {
        expect(screen.getByText("Home Page")).toBeInTheDocument();
        expect(
          screen.queryByText(/redirecting to you in/i)
        ).not.toBeInTheDocument();
      });
    });
  });
});
