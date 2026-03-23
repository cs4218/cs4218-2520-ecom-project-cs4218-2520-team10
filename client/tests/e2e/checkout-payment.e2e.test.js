// File & Tests Created - YAN WEIDONG A0258151H
/**
 * NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.
 */

/**
 * Checkout and Payment Workflow E2E Tests
 *
 * Test Strategy: End-to-end testing with real browser interactions, focusing on complete user journeys
 * from cart management through payment processing to order verification. These tests require real browser
 * behavior (navigation, authentication, payment flow, state persistence) not testable in integration tests.
 *
 * Pages/Components Under Test:
 * - Cart Page (/cart): Cart display, Braintree DropIn component, payment button states, checkout flow
 * - Home Page (/): Product listing, add to cart functionality
 * - Orders Page (/dashboard/user/orders): Order history display, order details verification
 * - Profile Page (/dashboard/user/profile): User address management
 * - Login Page (/login): Authentication flow
 * - Register Page (/register): User registration flow
 *
 * E2E Test Scenario Plan (4 critical tests):
 * #  | Category                    | Scenario                                                                                  | Expected Result                                                                                                | E2E Rationale
 * ---|----------------------------|-------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------|--------------------------------------------------
 * 1  | Happy Path & User Flow      | Logged-in user with address adds items to cart and completes payment                      | Success toast displayed, redirected to /dashboard/user/orders, cart emptied (badge shows 0), order appears     | **Critical**: Complete payment flow, real navigation, order persistence
 * 2  | Access Control              | Guest user adds items to cart and views cart page                                         | Braintree DropIn NOT visible, "Make Payment" button NOT visible, "please login to checkout" message visible   | Auth-based component rendering, access control
 * 3  | Edge Cases                  | Logged-in user navigates to cart with empty cart                                           | Braintree DropIn NOT visible, "Make Payment" button NOT visible, "Your Cart Is Empty" displayed               | Conditional rendering based on cart state
 * 4  | Complete User Journey       | New user registers, logs in, updates address, adds product, completes payment, views order| Order appears in orders page with product details, order status "Not Processed", payment status "Success"     | **Critical**: Full registration to order flow, all system components working together
 */
import { test, expect } from "@playwright/test";
import { seedDatabase } from "./db-seed.js";

// Test users for authentication tests (registered via API in beforeAll)
const AUTH_USER_WITH_ADDRESS = {
  name: "Checkout Test User With Address",
  email: `checkout-with-address-${Date.now()}@test.com`,
  password: "CheckoutTest123!",
  phone: "91234567",
  address: "789 Checkout Test Street",
  answer: "green",
};

const AUTH_USER_NO_ADDRESS = {
  name: "Checkout Test User No Address",
  email: `checkout-no-address-${Date.now()}@test.com`,
  password: "CheckoutTest123!",
  phone: "98765432",
  address: "", // No address
  answer: "red",
};

/**
 * Helper: Register a user via API
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Response data from registration
 */
async function registerViaAPI(userData) {
  const response = await fetch("http://localhost:6060/api/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return await response.json();
}

/**
 * Helper: Update user address via API
 * @param {string} authToken - User authentication token
 * @param {string} address - New address to set
 * @returns {Promise<Object>} Response data from update
 */
// eslint-disable-next-line no-unused-vars
async function updateAddressViaAPI(authToken, address) {
  const response = await fetch("http://localhost:6060/api/v1/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: authToken,
    },
    body: JSON.stringify({ address }),
  });
  return await response.json();
}

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

  await expect(page.getByText("Login Successfully").first()).toBeVisible({
    timeout: 10000,
  });
}

/**
 * Helper: Register a user via the UI
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {Object} userData - User registration data
 */
async function registerViaUI(page, userData) {
  await page.goto("/register");
  await page.waitForLoadState("networkidle");

  await page.getByPlaceholder("Enter Your Name").fill(userData.name);
  await page.getByPlaceholder("Enter Your Email").fill(userData.email);
  await page.getByPlaceholder("Enter Your Password").fill(userData.password);
  await page.getByPlaceholder("Enter Your Phone").fill(userData.phone);
  await page.getByPlaceholder("Enter Your Address").fill(userData.address);
  await page.getByPlaceholder("Enter Your DOB").fill(userData.dob);
  await page
    .getByPlaceholder("What is Your Favorite sports")
    .fill(userData.answer);
  await page.getByRole("button", { name: "REGISTER" }).click();

  await expect(page.getByText("Register Successfully").first()).toBeVisible({
    timeout: 10000,
  });
  
  // Wait for any post-registration redirect to complete
  await page.waitForLoadState("networkidle");
  
  // Small delay to ensure auth state is saved to localStorage
  await page.waitForTimeout(500);
}

/**
 * Helper: Add a product to cart from home page
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {number} productIndex - Index of product to add (0-based)
 * @returns {Promise<string>} Product name that was added
 */
async function addProductToCart(page, productIndex = 0) {
  const cards = page.locator('[data-testid^="product-card-"]');
  const targetCard = cards.nth(productIndex);

  const productName = await targetCard
    .locator('[data-testid^="product-name-"]')
    .innerText();

  await targetCard.locator('[data-testid^="product-cart-button-"]').click();
  await expect(page.getByText("Item Added to cart").first()).toBeVisible({
    timeout: 5000,
  });

  return productName;
}

/**
 * Helper: Mock Braintree token endpoint only
 * Note: We don't mock the payment endpoint to allow real backend order creation
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function mockBraintreeToken(page) {
  // Mock Braintree token endpoint only
  await page.route("**/api/v1/product/braintree/token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        clientToken: "mock_client_token_" + Date.now(),
      }),
    });
  });

  // DO NOT mock the payment endpoint - let it go through to backend
  // This ensures real order creation happens
}

test.describe("Checkout and Payment Workflow", () => {
  // Seed database before all tests to ensure consistent test data
  test.beforeAll(async () => {
    await seedDatabase();
    await registerViaAPI(AUTH_USER_WITH_ADDRESS);
    await registerViaAPI(AUTH_USER_NO_ADDRESS);
  });

  // Reset database after all tests
  test.afterAll(async () => {
    await seedDatabase();
  });

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Clear cart and auth localStorage
    try {
      await page.evaluate(() => {
        window.localStorage.removeItem("cart");
        window.localStorage.removeItem("auth");
      });
    } catch (e) {
      // If localStorage isn't available yet, continue anyway
    }

    // Wait for products to load on home page
    await expect(
      page.locator('[data-testid^="product-card-"]').first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test.describe("Complete Purchase Flow", () => {
    test("Logged-in user completes payment and order is created", async ({
      page,
    }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Login as user with address
      await loginViaUI(
        page,
        AUTH_USER_WITH_ADDRESS.email,
        AUTH_USER_WITH_ADDRESS.password,
      );

      // Navigate back to home page after login
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // ── INTERACT ─────────────────────────────────
      // Add two products to cart
      await addProductToCart(page, 0);
      await page.waitForTimeout(500);
      await addProductToCart(page, 1);
      await page.waitForTimeout(500);

      // Navigate to cart page
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // Verify we're logged in and have items
      await expect(
        page.getByText(`Hello  ${AUTH_USER_WITH_ADDRESS.name}`).first(),
      ).toBeVisible();
      await expect(
        page.getByText(/You Have 2 items in your cart/i),
      ).toBeVisible();

      // Mock Braintree token endpoint only (payment goes through backend)
      await mockBraintreeToken(page);

      // Wait for Braintree DropIn to be visible
      await expect(page.locator(".braintree-dropin")).toBeVisible({
        timeout: 10000,
      });

      // Fill in payment details in Braintree form - each field is in its own iframe
      const cardNumberFrame = page.frameLocator('#braintree-hosted-field-number');
      await cardNumberFrame.locator('input[name="credit-card-number"]').fill("4111111111111111");
      
      // Wait for VISA icon to appear (Braintree auto-detects card type)
      await expect(page.locator('[data-braintree-id="visa-card-icon"]')).toBeVisible();

      const expirationFrame = page.frameLocator('#braintree-hosted-field-expirationDate');
      await expirationFrame.locator('input[name="expiration"]').fill("1234");

      const cvvFrame = page.frameLocator('#braintree-hosted-field-cvv');
      await cvvFrame.locator('input[name="cvv"]').fill("123");

      // Verify "Make Payment" button is enabled
      const paymentButton = page.getByRole("button", { name: "Make Payment" });
      await expect(paymentButton).toBeVisible();
      await expect(paymentButton).toBeEnabled();

      // Click "Make Payment" button
      await paymentButton.click();

      // ── ASSERT ───────────────────────────────────
      // Verify success toast appears
      await expect(
        page.getByText("Payment Completed Successfully").first(),
      ).toBeVisible({ timeout: 10000 });

      // Verify redirected to orders page
      await expect(page).toHaveURL(/\/dashboard\/user\/orders/);

      // Verify cart is emptied (badge shows 0 or is hidden)
      const cartBadge = page.locator("sup").first();
      const badgeText = await cartBadge.innerText().catch(() => "0");
      expect(["0", ""]).toContain(badgeText.trim());

      // Verify order appears in order list
      await expect(page.getByText("All Orders").first()).toBeVisible();

      // Verify at least one order exists (the one we just created)
      const orderTables = page.locator(".border.shadow");
      await expect(orderTables.first()).toBeVisible({ timeout: 5000 });
    });

    test("Full end-to-end journey: Register → Update Address → Purchase → Verify Order", async ({
      page,
    }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Create new unique user for this test
      const newUser = {
        name: "E2E Journey User",
        email: `e2e-journey-${Date.now()}@test.com`,
        password: "E2EJourney123!",
        phone: "88887777",
        address: "999 E2E Test Avenue",
        dob: "1990-01-01",
        answer: "yellow",
      };

      // ── INTERACT ─────────────────────────────────
      // Register new user via UI
      await registerViaUI(page, newUser);
      
      // Log in with the newly created user
      await loginViaUI(page, newUser.email, newUser.password);

      // Navigate to profile page to update address
      await page.goto("/dashboard/user/profile");
      await page.waitForLoadState("networkidle");

      // Verify User Profile page loaded
      await expect(page.getByText("USER PROFILE").first()).toBeVisible();

      // Update address (it should already be there from registration, but let's update to be sure)
      const addressInput = page.getByPlaceholder("Enter Your Address");
      await addressInput.clear();
      await addressInput.fill(newUser.address);

      await page.getByRole("button", { name: "UPDATE" }).click();
      await expect(
        page.getByText("Profile Updated Successfully").first(),
      ).toBeVisible({ timeout: 5000 });

      // Navigate to home page
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Add one product to cart (capture product name)
      const productName = await addProductToCart(page, 0);
      await page.waitForTimeout(500);

      // Navigate to cart page
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // Verify product in cart
      await expect(page.getByText(productName).first()).toBeVisible();

      // Mock Braintree token endpoint only (payment goes through backend)
      await mockBraintreeToken(page);

      // Wait for DropIn and complete payment
      await expect(page.locator(".braintree-dropin")).toBeVisible({
        timeout: 10000,
      });

      // Fill in payment details in Braintree form - each field is in its own iframe
      const cardNumberFrame = page.frameLocator('#braintree-hosted-field-number');
      await cardNumberFrame.locator('input[name="credit-card-number"]').fill("4111111111111111");
      
      // Wait for VISA icon to appear (Braintree auto-detects card type)
      await expect(page.locator('[data-braintree-id="visa-card-icon"]')).toBeVisible();

      const expirationFrame = page.frameLocator('#braintree-hosted-field-expirationDate');
      await expirationFrame.locator('input[name="expiration"]').fill("1234");

      const cvvFrame = page.frameLocator('#braintree-hosted-field-cvv');
      await cvvFrame.locator('input[name="cvv"]').fill("123");

      const paymentButton = page.getByRole("button", { name: "Make Payment" });
      await paymentButton.click();

      // Wait for success and navigation
      await expect(
        page.getByText("Payment Completed Successfully").first(),
      ).toBeVisible({ timeout: 10000 });
      await expect(page).toHaveURL(/\/dashboard\/user\/orders/);

      // ── ASSERT ───────────────────────────────────
      // Navigate to orders page (in case redirect didn't complete)
      await page.goto("/dashboard/user/orders");
      await page.waitForLoadState("networkidle");

      // Verify order appears in order list
      await expect(page.getByText("All Orders").first()).toBeVisible();

      const orderTable = page.locator(".border.shadow").first();
      await expect(orderTable).toBeVisible({ timeout: 5000 });

      // Verify order status is "Not Processed"
      await expect(orderTable.getByText("Not Processed").first()).toBeVisible();

      // Verify payment status is "Success"
      await expect(orderTable.getByText("Success").first()).toBeVisible();
    });
  });

  test.describe("Access Control & Visibility", () => {
    test("Payment section hidden for guest user", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Already on home page from beforeEach (not logged in)

      // ── INTERACT ─────────────────────────────────
      // Add two products to cart as guest
      await addProductToCart(page, 0);
      await page.waitForTimeout(500);
      await addProductToCart(page, 1);
      await page.waitForTimeout(500);

      // Navigate to cart page
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify guest greeting displayed
      await expect(page.getByText("Hello Guest").first()).toBeVisible();

      // Verify login prompt message
      await expect(
        page.getByText("please login to checkout !").first(),
      ).toBeVisible();

      // Verify Braintree DropIn component is NOT visible
      const dropIn = page.locator(".braintree-dropin");
      await expect(dropIn).not.toBeVisible();

      // Verify "Make Payment" button is NOT visible
      const paymentButton = page.getByRole("button", { name: "Make Payment" });
      await expect(paymentButton).not.toBeVisible();

      // Verify "Plase Login to checkout" button IS visible
      await expect(
        page.getByRole("button", { name: "Plase Login to checkout" }),
      ).toBeVisible();
    });

    test("Payment section hidden when cart is empty", async ({ page }) => {
      // ── NAVIGATE ─────────────────────────────────
      // Login as user with address
      await loginViaUI(
        page,
        AUTH_USER_WITH_ADDRESS.email,
        AUTH_USER_WITH_ADDRESS.password,
      );

      // ── INTERACT ─────────────────────────────────
      // Navigate to cart page (cart is empty from beforeEach)
      await page.goto("/cart");
      await page.waitForLoadState("networkidle");

      // ── ASSERT ───────────────────────────────────
      // Verify empty cart message
      await expect(page.getByText("Your Cart Is Empty").first()).toBeVisible();

      // Verify user greeting (logged in)
      await expect(
        page.getByText(`Hello  ${AUTH_USER_WITH_ADDRESS.name}`).first(),
      ).toBeVisible();

      // Verify Braintree DropIn component is NOT visible
      const dropIn = page.locator(".braintree-dropin");
      await expect(dropIn).not.toBeVisible();

      // Verify "Make Payment" button is NOT visible
      const paymentButton = page.getByRole("button", { name: "Make Payment" });
      await expect(paymentButton).not.toBeVisible();

      // Verify cart badge shows 0 or is empty
      const cartBadge = page.locator("sup").first();
      const badgeText = await cartBadge.innerText().catch(() => "0");
      expect(["0", ""]).toContain(badgeText.trim());
    });
  });
});
