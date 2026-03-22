// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Cart Management E2E Tests
 *
 * Test Strategy: End-to-end testing with real browser interactions, focusing on complete user journeys
 * that require real browser behavior (navigation, refresh, authentication flows) not testable in integration tests.
 *
 * Pages/Components Under Test:
 * - Cart Page (/cart): Cart item display, removal, total calculation, empty states
 * - Home Page (/): Product listing, add to cart functionality
 * - Login Page (/login): Authentication flow with redirect back to cart
 * - User Profile (/dashboard/user/profile): Address management from cart
 *
 *
 * E2E Test Scenario Plan (11 critical tests - no overlap with integration tests):
 * #  | Category          | Scenario                                                                                  | Expected Result                                                                                         | E2E Rationale
 * ---|-------------------|-------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------|--------------------------------------------------
 * 1  | Happy Path        | Guest navigates directly to /cart with empty cart                                         | Displays "Hello Guest", "Your Cart Is Empty", cart badge shows 0 or empty                               | Real navigation, initial browser state
 * 2  | Happy Path        | User adds one item from home page and navigates to /cart                                  | Item displays with product name, "You Have 1 items in your cart", badge shows "1"                       | Cross-page flow, real browser navigation
 * 3  | Happy Path        | User adds 3 items from home and navigates to /cart                                        | "You Have 3 items in your cart", badge shows "3", 3 cart item cards displayed                           | Multi-item cross-page journey
 * 4  | Item Management   | User removes 1 item from cart with 2 items                                                | Shows "You Have 1 items in your cart", badge shows "1", 1 cart item card remains                        | User interaction, real DOM updates
 * 5  | Item Management   | User removes all items (2) one by one from cart                                           | Shows "Your Cart Is Empty", badge shows 0 or empty                                                      | Complete removal flow in browser
 * 6  | Persistence       | User adds 2 items to cart, refreshes browser page                                         | After reload: "You Have 2 items", product name visible, badge shows "2"                                 | **Critical**: Real browser refresh, localStorage
 * 7  | Persistence       | User adds 2 items, navigates home → cart → home → cart                                    | "You Have 2 items", badge shows "2", 2 cart item cards visible                                          | Real browser navigation, URL changes
 * 8  | Access Control    | Guest user with items views cart, clicks login button                                     | Shows "Hello Guest", "please login to checkout !", redirects to /login, login form visible              | Auth flow with redirect state
 * 9  | User Flow         | Guest with 2 items logs in from cart, redirects back                                      | Login success, redirected to /cart, "Hello [UserName]", 2 items persist, badge shows "2"                | **Critical**: Complete auth flow with redirect
 * 10 | Access Control    | Logged-in user adds 1 item and views cart                                                 | "Hello [UserName]", "You Have 1 items", NO "please login to checkout" message                           | Real auth state, personalized UI
 * 11 | Navigation        | Logged-in user with item clicks "Update Address" button                                   | Redirects to /dashboard/user/profile, "User Profile" heading visible                                    | Real navigation flow
 */
import { test, expect } from "@playwright/test";

// Test user for authentication tests (registered via API in beforeAll)
const AUTH_USER = {
  name: "Cart Test User",
  email: `cart-test-${Date.now()}@test.com`,
  password: "CartTest123!",
  phone: "91234567",
  address: "456 Cart Test Street",
  answer: "blue",
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

test.describe("Cart Management", () => {
  // Seed a test user via API before all tests for authentication scenarios
  test.beforeAll(async () => {
    await fetch("http://localhost:6060/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(AUTH_USER),
    });
  });

  test.beforeEach(async ({ page, context }) => {
    // Navigate to home page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear cart localStorage after page is loaded
    try {
      await page.evaluate(() => {
        window.localStorage.removeItem("cart");
      });
    } catch (e) {
      // If localStorage isn't available yet, continue anyway
    }

    // Wait for products to load on home page
    await expect(
      page.locator('[data-testid^="product-card-"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test.describe("Item Management", () => {
    test("Guest views empty cart", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Navigate to cart page with no items
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── INTERACT ─────────────────────────────────
      // No interactions needed - just viewing empty state

      // ── ASSERT ───────────────────────────────────
      // Verify guest greeting displayed
      await expect(page.getByText("Hello Guest")).toBeVisible();

      // Verify empty cart message
      await expect(page.getByText("Your Cart Is Empty")).toBeVisible();

      // Verify cart badge shows 0 or is not visible
      const cartBadge = page.locator("sup").first();
      const badgeCount = await cartBadge.innerText().catch(() => "0");
      expect(["0", ""]).toContain(badgeCount.trim());
    });

    test("Add single item and view cart", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Already on home page from beforeEach

      // ── INTERACT ─────────────────────────────────
      // Add first product to cart
      const firstCard = page.locator('[data-testid^="product-card-"]').first();
      const productName = await firstCard
        .locator('[data-testid^="product-name-"]')
        .innerText();

      await firstCard.locator('[data-testid^="product-cart-button-"]').click();
      await expect(page.getByText("Item Added to cart").first()).toBeVisible();

      // Navigate to cart page
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify item displays in cart
      await expect(page.getByText(productName).first()).toBeVisible();

      // Verify cart shows 1 item
      await expect(
        page.getByText(/You Have 1 items in your cart/i),
      ).toBeVisible();

      // Verify cart badge shows 1
      const cartBadge = page.locator("sup").first();
      await expect(cartBadge).toContainText("1");
    });

    test("Add multiple items and view cart", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Already on home page from beforeEach

      // ── INTERACT ─────────────────────────────────
      // Add three different products to cart
      const cards = page.locator('[data-testid^="product-card-"]');

      await cards
        .nth(0)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);

      await cards
        .nth(1)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);

      await cards
        .nth(2)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await expect(page.getByText("Item Added to cart").first()).toBeVisible();

      // Navigate to cart page
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify cart shows 3 items
      await expect(
        page.getByText(/You Have 3 items in your cart/i),
      ).toBeVisible();

      // Verify cart badge shows 3
      const cartBadge = page.locator("sup").first();
      await expect(cartBadge).toContainText("3");

      // Verify multiple cart items are displayed
      const cartItems = page.locator(".card.flex-row");
      await expect(cartItems).toHaveCount(3, { timeout: 5000 });
    });

    test("Remove item from cart", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Add two items to cart first
      const cards = page.locator('[data-testid^="product-card-"]');

      await cards
        .nth(0)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);
      await cards
        .nth(1)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);

      // Navigate to cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // Verify 2 items initially
      await expect(
        page.getByText(/You Have 2 items in your cart/i),
      ).toBeVisible();

      // ── INTERACT ─────────────────────────────────
      // Remove first item
      const removeButtons = page.getByRole("button", { name: "Remove" });
      await removeButtons.first().click();

      // Wait for UI to update
      await page.waitForTimeout(500);

      // ── ASSERT ───────────────────────────────────
      // Verify cart now shows 1 item
      await expect(
        page.getByText(/You Have 1 items in your cart/i),
      ).toBeVisible();

      // Verify badge count decreased to 1
      const cartBadge = page.locator("sup").first();
      await expect(cartBadge).toContainText("1");

      // Verify only one cart item card remains
      const cartItems = page.locator(".card.flex-row");
      await expect(cartItems).toHaveCount(1, { timeout: 5000 });
    });

    test("Remove all items from cart", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Add two items to cart
      const cards = page.locator('[data-testid^="product-card-"]');

      await cards
        .nth(0)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);
      await cards
        .nth(1)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);

      // Navigate to cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── INTERACT ─────────────────────────────────
      // Remove first item
      let removeButtons = page.getByRole("button", { name: "Remove" });
      await removeButtons.first().click();
      await page.waitForTimeout(500);

      // Remove second (now first) item
      removeButtons = page.getByRole("button", { name: "Remove" });
      await removeButtons.first().click();
      await page.waitForTimeout(500);

      // ── ASSERT ───────────────────────────────────
      // Verify empty cart message appears
      await expect(page.getByText("Your Cart Is Empty")).toBeVisible();

      // Verify badge shows 0 or disappears
      const cartBadge = page.locator("sup").first();
      const badgeText = await cartBadge.innerText().catch(() => "0");
      expect(["0", ""]).toContain(badgeText.trim());
    });
  });

  test.describe("State Persistence", () => {
    test("Cart persists after page refresh", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Add items to cart
      const cards = page.locator('[data-testid^="product-card-"]');
      const firstProductName = await cards
        .nth(0)
        .locator('[data-testid^="product-name-"]')
        .innerText();

      await cards
        .nth(0)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);
      await cards
        .nth(1)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);

      // Navigate to cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // Verify 2 items before refresh
      await expect(
        page.getByText(/You Have 2 items in your cart/i),
      ).toBeVisible();

      // ── INTERACT ─────────────────────────────────
      // Refresh the page (critical E2E test - real browser localStorage)
      await page.reload();
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify cart items still present after refresh
      await expect(
        page.getByText(/You Have 2 items in your cart/i),
      ).toBeVisible();

      // Verify first product name still visible
      await expect(page.getByText(firstProductName).first()).toBeVisible();

      // Verify badge count persists
      const cartBadge = page.locator("sup").first();
      await expect(cartBadge).toContainText("2");
    });

    test("Cart persists across navigation", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Add items to cart from home page
      const cards = page.locator('[data-testid^="product-card-"]');

      await cards
        .nth(0)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);
      await cards
        .nth(1)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);

      // ── INTERACT ─────────────────────────────────
      // Navigate to cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // Verify 2 items in cart
      await expect(
        page.getByText(/You Have 2 items in your cart/i),
      ).toBeVisible();

      // Navigate back to home
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Navigate back to cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify cart items persisted across navigation
      await expect(
        page.getByText(/You Have 2 items in your cart/i),
      ).toBeVisible();

      // Verify badge count persists
      const cartBadge = page.locator("sup").first();
      await expect(cartBadge).toContainText("2");

      // Verify cart items visible
      const cartItems = page.locator(".card.flex-row");
      await expect(cartItems).toHaveCount(2, { timeout: 5000 });
    });
  });

  test.describe("Access Control & User Flow", () => {
    test("Guest redirected to login from cart", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Add item to cart as guest
      const firstCard = page.locator('[data-testid^="product-card-"]').first();
      await firstCard.locator('[data-testid^="product-cart-button-"]').click();
      await page.waitForTimeout(500);

      // Navigate to cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── INTERACT ─────────────────────────────────
      // Verify guest message displayed
      await expect(page.getByText("Hello Guest")).toBeVisible();
      await expect(page.getByText("please login to checkout !")).toBeVisible();

      // Click login button
      const loginButton = page.getByRole("button", {
        name: /login to checkout/i,
      });
      await loginButton.click();

      // ── ASSERT ───────────────────────────────────
      // Verify redirected to login page
      await expect(page).toHaveURL(/\/login/);

      // Verify login form is visible
      await expect(page.getByPlaceholder("Enter Your Email")).toBeVisible();
    });

    test("Guest logs in and redirects back to cart", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Add items to cart as guest
      const cards = page.locator('[data-testid^="product-card-"]');
      const firstProductName = await cards
        .nth(0)
        .locator('[data-testid^="product-name-"]')
        .innerText();

      await cards
        .nth(0)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);
      await cards
        .nth(1)
        .locator('[data-testid^="product-cart-button-"]')
        .click();
      await page.waitForTimeout(500);

      // Navigate to cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // Click login button
      const loginButton = page.getByRole("button", {
        name: /login to checkout/i,
      });
      await loginButton.click();
      await page.waitForLoadState("networkidle");

      // ── INTERACT ─────────────────────────────────
      // Log in via UI
      await page.getByPlaceholder("Enter Your Email").fill(AUTH_USER.email);
      await page
        .getByPlaceholder("Enter Your Password")
        .fill(AUTH_USER.password);
      await page.getByRole("button", { name: "LOGIN" }).click();

      // Wait for login success
      await expect(page.getByText("Login Successfully")).toBeVisible({
        timeout: 5000,
      });

      // ── ASSERT ───────────────────────────────────
      // Verify redirected back to cart page
      await expect(page).toHaveURL(/\/cart/);

      // Verify user greeting with name
      await expect(page.getByText(`Hello  ${AUTH_USER.name}`)).toBeVisible();

      // Verify cart items still present after login
      await expect(
        page.getByText(/You Have 2 items in your cart/i),
      ).toBeVisible();
      await expect(page.getByText(firstProductName).first()).toBeVisible();

      // Verify badge count persists
      const cartBadge = page.locator("sup").first();
      await expect(cartBadge).toContainText("2");
    });

    test("Logged-in user views cart with personalized greeting", async ({
      page,
    }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Log in first
      await loginViaUI(page, AUTH_USER.email, AUTH_USER.password);
      await page.waitForLoadState("networkidle");

      // Add items to cart
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(
        page.locator('[data-testid^="product-card-"]').first(),
      ).toBeVisible({ timeout: 15000 });

      const firstCard = page.locator('[data-testid^="product-card-"]').first();
      await firstCard.locator('[data-testid^="product-cart-button-"]').click();
      await page.waitForTimeout(500);

      // ── INTERACT ─────────────────────────────────
      // Navigate to cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify personalized greeting with user's name
      await expect(page.getByText(`Hello  ${AUTH_USER.name}`)).toBeVisible();

      // Verify cart displays items
      await expect(
        page.getByText(/You Have 1 items in your cart/i),
      ).toBeVisible();

      // Verify NO "please login to checkout" message (user is already logged in)
      await expect(
        page.getByText("please login to checkout !"),
      ).not.toBeVisible();
    });

    test("Logged-in user navigates to update address", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Log in first
      await loginViaUI(page, AUTH_USER.email, AUTH_USER.password);
      await page.waitForLoadState("networkidle");

      // Add item to cart
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(
        page.locator('[data-testid^="product-card-"]').first(),
      ).toBeVisible({ timeout: 15000 });

      const firstCard = page.locator('[data-testid^="product-card-"]').first();
      await firstCard.locator('[data-testid^="product-cart-button-"]').click();
      await page.waitForTimeout(500);

      // Navigate to cart
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── INTERACT ─────────────────────────────────
      // Click "Update Address" button
      const updateAddressButton = page.getByRole("button", {
        name: "Update Address",
      });
      await updateAddressButton.click();

      // ── ASSERT ───────────────────────────────────
      // Verify navigated to user profile page
      await expect(page).toHaveURL(/\/dashboard\/user\/profile/);

      // Verify profile page elements visible
      await expect(page.getByText("User Profile")).toBeVisible({
        timeout: 5000,
      });
    });
  });
});
