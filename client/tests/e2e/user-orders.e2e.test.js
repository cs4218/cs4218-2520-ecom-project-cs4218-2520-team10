// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * User Order History E2E Tests
 *
 * Test Strategy: End-to-end testing with real browser interactions, focusing on complete user journeys
 * that require real browser behavior (navigation, refresh, authentication flows)
 *
 * Pages/Components Under Test:
 * - Orders Page (/dashboard/user/orders): User order history display with order details and product information
 * - UserMenu Component: Dashboard navigation (Profile/Orders tabs)
 * - Login Page (/login): Authentication flow with redirect back to orders page
 * - Profile Page (/dashboard/user/profile): User profile management for navigation testing
 *
 * E2E Test Scenario Plan (6 critical tests):
 * #  | Category          | Scenario                                                                                  | Expected Result                                                                                                | E2E Rationale
 * ---|-------------------|-------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|----------------------------------------------
 * 1  | Happy Path        | Authenticated user navigates to orders page and views complete order details              | "All Orders" heading, table with buyer name/status/payment/quantity, 3 product cards with images/names/prices  | Real navigation, auth state, complete data rendering verification
 * 2  | State Persistence | User with orders refreshes /dashboard/user/orders page                                    | After browser refresh, orders remain displayed, auth maintained, data persists                                 | **Critical**: Real browser refresh, localStorage persistence
 * 3  | Access Control    | Guest (not logged in) attempts to access /dashboard/user/orders                           | Redirects to homepage (/), spinner countdown displays                                                          | Auth middleware redirect behavior
 * 4  | User Flow         | Guest attempts /dashboard/user/orders → logs in → navigates to orders                     | Redirects to homepage, user logs in manually, navigates to /dashboard/user/orders, orders displayed            | **Critical**: Complete auth flow
 * 5  | Navigation        | User navigates: Orders → Profile → Orders via UserMenu links                              | Orders shows table, Profile shows "User Profile" heading, back to Orders shows table again                     | Real browser navigation between dashboard tabs
 * 6  | Navigation        | User clicks "Profile" link from Orders page                                                | Navigates to /dashboard/user/profile, "User Profile" heading visible, URL changes                              | Navigation flow via UserMenu
 */

import { test, expect } from "@playwright/test";
import { seedDatabase } from "./db-seed.js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../.env") });

// Test user credentials from seed database (test.users.json)
const TEST_USER = {
  email: process.env.USER_EMAIL || "cs4218@test.com",
  password: process.env.USER_PASSWORD || "cs4218@test.com",
  name: "CS 4218 Test Account",
};

/**
 * Helper: Log in via the UI
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} email - User email
 * @param {string} password - User password
 */
async function loginViaUI(page, email, password) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.getByPlaceholder("Enter Your Email").fill(email);
  await page.getByPlaceholder("Enter Your Password").fill(password);
  await page.getByRole("button", { name: "LOGIN" }).click();

  await expect(page.getByText("Login Successfully")).toBeVisible({
    timeout: 5000,
  });
}

test.describe("User Order History", () => {
  // Seed database before all tests to ensure consistent test data
  test.beforeAll(async () => {
    await seedDatabase();
  });

  // Reset database after all tests
  test.afterAll(async () => {
    await seedDatabase();
  });

  test.describe("Happy Path", () => {
    test("Authenticated user navigates to orders page and views complete order details", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      // Log in as test user with existing orders
      await loginViaUI(page, TEST_USER.email, TEST_USER.password);
      
      // Navigate to orders page
      await page.goto("/dashboard/user/orders");
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify page heading
      await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible({
        timeout: 10000,
      });

      // Verify table headers
      await expect(page.getByRole("columnheader", { name: "#" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /buyer/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /date/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /payment/i })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: /quantity/i })).toBeVisible();

      // Verify seeded order data is visible (buyer name, status, payment)
      await expect(page.getByText(TEST_USER.name).first()).toBeVisible();
      await expect(page.getByText("Not Processed").first()).toBeVisible();
      await expect(page.getByText("Failed").first()).toBeVisible();
      
      // Verify order quantity in table (seeded order has 3 products)
      await expect(page.getByRole("cell", { name: "3", exact: true })).toBeVisible();

      // Verify product cards are displayed
      const productCards = page.locator(".card.flex-row");
      await expect(productCards.first()).toBeVisible();
      await expect(productCards).toHaveCount(3, { timeout: 5000 });

      // Verify first product card has all required elements
      const firstProductCard = productCards.first();
      await expect(firstProductCard.locator("img")).toBeVisible();
      await expect(firstProductCard.locator("p").first()).toBeVisible(); // Product name
      await expect(firstProductCard.locator("p").nth(1)).toBeVisible(); // Description
      await expect(firstProductCard.locator("p").filter({ hasText: /price/i })).toBeVisible();
    });
  });

  test.describe("State Persistence", () => {
    test("User with orders refreshes the orders page", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      await loginViaUI(page, TEST_USER.email, TEST_USER.password);

      await page.goto("/dashboard/user/orders");
      await page.waitForLoadState("networkidle");

      // Verify orders are displayed before refresh
      await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
      await expect(page.getByText(TEST_USER.name).first()).toBeVisible();

      // ── INTERACT ─────────────────────────────────
      // Refresh the page
      await page.reload();
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify orders are still displayed after refresh
      await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible({
        timeout: 10000,
      });
      
      // Verify authentication is maintained (not redirected to login)
      await expect(page).toHaveURL(/\/dashboard\/user\/orders/);
      
      // Verify order data persists
      await expect(page.getByText(TEST_USER.name).first()).toBeVisible();
      await expect(page.getByText("Failed").first()).toBeVisible();
    });
  });

  test.describe("Access Control & User Flow", () => {
    test("Guest user attempts to access orders page directly", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Clear authentication to simulate guest user
      await page.evaluate(() => {
        localStorage.removeItem("auth");
      });

      // ── INTERACT ─────────────────────────────────
      // Attempt to access protected orders page as guest
      await page.goto("/dashboard/user/orders");

      // ── ASSERT ───────────────────────────────────
      // Wait for spinner countdown to appear
      await expect(page.getByText(/redirecting to you in/i)).toBeVisible({ timeout: 5000 });
      
      // Verify redirect to homepage after countdown
      await expect(page).toHaveURL(/\/$/, { timeout: 10000 });
      
      // Verify we're back on home page (not on orders page)
      await expect(page.getByRole("heading", { name: "All Orders" })).not.toBeVisible();
    });

    test("Guest attempts orders page, logs in, navigates to orders", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Clear authentication to simulate guest user
      await page.evaluate(() => {
        localStorage.removeItem("auth");
      });

      // Attempt to access orders page as guest
      await page.goto("/dashboard/user/orders");
      
      // Wait for redirect to complete
      await expect(page).toHaveURL(/\/$/, { timeout: 10000 });

      // ── INTERACT ─────────────────────────────────
      // User realizes they need to log in, navigates to login manually
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Fill in login credentials
      await page.getByPlaceholder("Enter Your Email").fill(TEST_USER.email);
      await page.getByPlaceholder("Enter Your Password").fill(TEST_USER.password);
      await page.getByRole("button", { name: "LOGIN" }).click();

      // Wait for successful login
      await expect(page.getByText("Login Successfully")).toBeVisible({
        timeout: 5000,
      });

      // Now navigate to orders page as authenticated user
      await page.goto("/dashboard/user/orders");
      await page.waitForLoadState("networkidle");
      
      // ── ASSERT ───────────────────────────────────
      // Verify user can now access orders page and see their orders
      await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
      await expect(page.getByText(TEST_USER.name).first()).toBeVisible();
      
      // Verify we're on the correct URL
      await expect(page).toHaveURL(/\/dashboard\/user\/orders/);
    });
  });

  test.describe("Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      await loginViaUI(page, TEST_USER.email, TEST_USER.password);
    });

    test("User navigates between Dashboard tabs: Orders → Profile → Orders", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Navigate to Orders
      await page.goto("/dashboard/user/orders");
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify Orders page displays
      await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();

      // ── INTERACT ─────────────────────────────────
      // Navigate to Profile via UserMenu
      await page.getByRole("link", { name: "Profile" }).click();
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify Profile page displays
      await expect(page).toHaveURL(/\/dashboard\/user\/profile/);
      await expect(page.getByRole("heading", { name: "User Profile" })).toBeVisible({
        timeout: 10000,
      });

      // ── INTERACT ─────────────────────────────────
      // Navigate back to Orders via UserMenu
      await page.getByRole("link", { name: "Orders" }).click();
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify Orders page displays again
      await expect(page).toHaveURL(/\/dashboard\/user\/orders/);
      await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible();
      await expect(page.getByText(TEST_USER.name).first()).toBeVisible();
    });

    test("User clicks Profile link from Orders page", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      await page.goto("/dashboard/user/orders");
      await page.waitForLoadState("networkidle");

      // Verify on Orders page
      await expect(page.getByRole("heading", { name: "All Orders" })).toBeVisible({
        timeout: 10000,
      });

      // ── INTERACT ─────────────────────────────────
      // Click Profile link in UserMenu
      await page.getByRole("link", { name: "Profile" }).click();
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify navigation to Profile page
      await expect(page).toHaveURL(/\/dashboard\/user\/profile/);
      await expect(page.getByRole("heading", { name: "User Profile" })).toBeVisible({
        timeout: 10000,
      });
    });
  });
});