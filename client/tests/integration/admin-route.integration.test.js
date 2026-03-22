// File & Tests Created - Shaun Lee Xuan Wei A0252626E
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Integration Tests: AdminRoute ↔ AuthContext ↔ Spinner
 *
 * Test Strategy: Integration-based testing with real AuthContext and real Spinner, mocked axios
 *
 * Components Under Test:
 * - components/Routes/AdminRoute.js (calls admin-auth API, renders Outlet or Spinner based on result)
 * - context/auth.js (provides auth token to AdminRoute via useAuth)
 * - components/Spinner.js (rendered when admin auth check fails, redirects after countdown)
 *
 * Test Doubles Used:
 * - axios mocked (external HTTP dependency — no real network calls)
 * - AuthProvider is REAL (integration point being tested)
 * - Spinner is REAL (integration point being tested)
 *
 * Scenario Plan:
 * #  | Scenario                                  | Setup                                              | Expected Result
 * ---|-------------------------------------------|----------------------------------------------------|------------------------------------------
 * 1  | Admin user passes AdminRoute              | Admin token in localStorage. Mock GET → {ok:true}  | Child route renders
 * 2  | Unauthenticated user sees Spinner         | No localStorage. Render AdminRoute.                | Spinner renders, API not called
 * 3  | Non-admin user with token gets Spinner    | User token in localStorage. Mock GET → {ok:false}  | Spinner renders, child route absent
 * 4  | Spinner redirects after countdown         | No localStorage. Advance timers 3 seconds.         | Navigate to /login occurs
 * 5  | API network error falls through to Spinner| Admin token in localStorage. Mock GET → throws.    | Spinner renders, child route absent
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { AuthProvider } from "../../src/context/auth";
import AdminRoute from "../../src/components/Routes/AdminRoute";

jest.mock("axios");

const renderAdminRoute = (authData) => {
  if (authData) {
    localStorage.setItem("auth", JSON.stringify(authData));
  }
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route
              index
              element={<div data-testid="admin-content">Admin Content</div>}
            />
          </Route>
          <Route
            path="/login"
            element={<div data-testid="login-page">Login Page</div>}
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe("FE-INT-9: AdminRoute ↔ AuthContext ↔ Spinner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    localStorage.clear();
  });

  describe("Test 1: Admin user passes AdminRoute", () => {
    it("renders child route when admin-auth API returns ok:true", async () => {
      axios.get.mockResolvedValue({ data: { ok: true } });

      renderAdminRoute({ user: { name: "Admin", role: 1 }, token: "admin-token" });

      await waitFor(() => {
        expect(screen.getByTestId("admin-content")).toBeInTheDocument();
      });
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });

  describe("Test 2: Unauthenticated user sees Spinner (no token)", () => {
    it("renders Spinner and does not call auth API when no token present", async () => {
      renderAdminRoute(null);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
      expect(axios.get).not.toHaveBeenCalled();
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });
  });

  describe("Test 3: Non-admin user with token gets Spinner", () => {
    it("renders Spinner when admin-auth API returns ok:false", async () => {
      axios.get.mockResolvedValue({ data: { ok: false } });

      renderAdminRoute({ user: { name: "User", role: 0 }, token: "user-token" });

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });
  });

  describe("Test 4: Spinner redirects after countdown completes", () => {
    it("navigates to /login after 3 second countdown", async () => {
      renderAdminRoute(null);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(screen.getByTestId("login-page")).toBeInTheDocument();
      });
    });
  });

  describe("Test 5: API network error falls through to Spinner", () => {
    it("renders Spinner when admin-auth API throws a network error", async () => {
      axios.get.mockRejectedValue(new Error("Network Error"));

      renderAdminRoute({ user: { name: "Admin", role: 1 }, token: "admin-token" });

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/admin-auth");
      expect(screen.queryByTestId("admin-content")).not.toBeInTheDocument();
    });
  });
});
