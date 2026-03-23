// File & Tests Created - Shaun Lee Xuan Wei A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.

import { test, expect } from "@playwright/test";
import { seedDatabase } from "./db-seed.js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../.env") });

const CLIENT = process.env.REACT_APP_CLIENT || "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "test@admin.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "test@admin.com";
const BUYER_EMAIL = process.env.USER_EMAIL || "cs4218@test.com";
const BUYER_PASSWORD = process.env.USER_PASSWORD || "cs4218@test.com";
const ADMIN_ORDERS_URL = `${CLIENT}/dashboard/admin/orders`;
const USER_ORDERS_URL = `${CLIENT}/dashboard/user/orders`;

async function loginAs(page, email, password) {
  await page.goto(`${CLIENT}/login`);
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("login-button").click();
  await page.waitForURL(`${CLIENT}/`, { timeout: 30000 });
}

async function logout(page) {
  await page.evaluate(() => localStorage.clear());
  await page.goto(CLIENT);
}

test.describe("12. Admin — Order Management — admin-orders.e2e.js", () => {
  test.beforeAll(async () => {
    await seedDatabase();
  });

  test.afterAll(async () => {
    await seedDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(CLIENT);
    await page.evaluate(() => localStorage.clear());
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(ADMIN_ORDERS_URL);
    await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible({ timeout: 30000 });
  });

  test("12.1 View all orders", async ({ page }) => {
    // Table headers are present
    await expect(page.getByRole("columnheader", { name: /status/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /buyer/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /date/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /payment/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /quantity/i })).toBeVisible();

    // Seeded order data is visible
    await expect(page.getByText("CS 4218 Test Account")).toBeVisible();
    await expect(page.getByText("Failed")).toBeVisible();
    // Quantity of 3 products
    await expect(page.getByRole("cell", { name: "3", exact: true })).toBeVisible();
  });

  test("12.2 Update order status", async ({ page }) => {
    // Open the status dropdown for the first order
    await page.getByTestId("order-status-select-0").click();
    await page.getByTestId("order-status-option-shipped").last().click();

    // Page refreshes order list — verify new status is displayed
    await expect(page.getByTestId("order-status-select-0")).toContainText("Shipped");
  });

  test("12.3 Status change reflects on user side", async ({ page }) => {
    // Change order status to Shipped as admin
    await page.getByTestId("order-status-select-0").click();
    await page.getByTestId("order-status-option-shipped").last().click();
    await expect(page.getByTestId("order-status-select-0")).toContainText("Shipped");

    // Logout and login as the buyer
    await logout(page);
    await loginAs(page, BUYER_EMAIL, BUYER_PASSWORD);
    await page.goto(USER_ORDERS_URL);

    // Buyer's order shows Shipped status
    await expect(page.getByRole("cell", { name: "Shipped", exact: true })).toBeVisible({
      timeout: 30000,
    });
  });

  test("12.4 View order product details", async ({ page }) => {
    // Each order card shows product image, name, description, and price
    const productCard = page.locator(".card.flex-row").first();
    await expect(productCard).toBeVisible({ timeout: 30000 });

    await expect(productCard.locator("img")).toBeVisible();
    await expect(productCard.locator("p").nth(0)).toBeVisible(); // name
    await expect(productCard.locator("p").nth(1)).toBeVisible(); // description
    await expect(productCard.locator("p").filter({ hasText: /price/i })).toBeVisible();
  });
});
