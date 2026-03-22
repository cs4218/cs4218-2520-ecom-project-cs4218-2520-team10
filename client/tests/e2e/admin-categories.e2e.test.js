// File & Tests Created - Shaun Lee Xuan Wei A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.

import { test, expect } from "@playwright/test";
import { seedDatabase } from "./db-seed.js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../.env") });

const CLIENT = process.env.REACT_APP_CLIENT || "http://localhost:3000";
const ADMIN_LOGIN_URL = `${CLIENT}/login`;
const ADMIN_CREATE_CATEGORY_URL = `${CLIENT}/dashboard/admin/create-category`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "test@admin.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "test@admin.com";

async function loginAsAdmin(page) {
  await page.goto(ADMIN_LOGIN_URL);
  await page.getByTestId("email-input").fill(ADMIN_EMAIL);
  await page.getByTestId("password-input").fill(ADMIN_PASSWORD);
  await page.getByTestId("login-button").click();
  await page.waitForURL(`${CLIENT}/`, { timeout: 10000 });
}

// Helper: returns locator scoped to tbody rows only (excludes header row)
const categoryRows = (page) => page.locator("tbody").getByRole("row");

test.describe("10. Admin — Category CRUD — admin-categories.e2e.js", () => {
  test.afterAll(async () => {
    await seedDatabase();
  });

  test.beforeEach(async ({ page }) => {
    await seedDatabase();
    await page.goto(CLIENT);
    await page.evaluate(() => localStorage.clear());
    await loginAsAdmin(page);
    await page.goto(ADMIN_CREATE_CATEGORY_URL);
    await expect(categoryRows(page).first()).toBeVisible({ timeout: 10000 });
  });

  test("10.1 View existing categories", async ({ page }) => {
    const rows = categoryRows(page);
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toBeVisible();
    }
  });

  test("10.2 Create a new category", async ({ page }) => {
    const categoryName = `TestCreate_${Date.now()}`;

    await page.getByPlaceholder("Enter new category").fill(categoryName);
    await page.getByRole("button", { name: /submit/i }).first().click();

    await expect(page.getByText(`${categoryName} is created`)).toBeVisible();
    await expect(
      categoryRows(page).filter({ hasText: categoryName })
    ).toBeVisible();
  });

  test("10.3 Create category with empty name", async ({ page }) => {
    const initialCount = await categoryRows(page).count();

    // Blank submit
    await page.getByRole("button", { name: /submit/i }).first().click();
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Name is required")).not.toBeVisible({ timeout: 10000 });

    // Whitespace only
    await page.getByPlaceholder("Enter new category").fill("   ");
    await page.getByRole("button", { name: /submit/i }).first().click();
    await expect(page.getByText("Name is required")).toBeVisible();

    // Verify no new row was added
    const countAfter = await categoryRows(page).count();
    expect(countAfter).toBe(initialCount);
  });

  test("10.4 Edit a category", async ({ page }) => {
    const originalName = "Electronics";
    const updatedName = "Electronics Updated";

    await categoryRows(page)
      .filter({ hasText: originalName })
      .getByRole("button", { name: /edit/i })
      .click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder("Enter new category").clear();
    await modal.getByPlaceholder("Enter new category").fill(updatedName);
    await modal.getByRole("button", { name: /submit/i }).click();

    await expect(page.getByText(`${updatedName} is updated`)).toBeVisible();
    await expect(
      categoryRows(page).filter({ hasText: updatedName })
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: originalName, exact: true })
    ).not.toBeVisible();
  });

  test("10.5 Edit category with duplicate name", async ({ page }) => {
    await categoryRows(page)
      .filter({ hasText: "Electronics" })
      .getByRole("button", { name: /edit/i })
      .click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder("Enter new category").clear();
    await modal.getByPlaceholder("Enter new category").fill("Book");
    await modal.getByRole("button", { name: /submit/i }).click();

    await expect(page.getByText("Book already exists")).toBeVisible();
    await expect(
      categoryRows(page).filter({ hasText: "Electronics" })
    ).toBeVisible();
  });

  test("10.6 Delete a category", async ({ page }) => {
    const categoryName = "Electronics";

    await categoryRows(page)
      .filter({ hasText: categoryName })
      .getByRole("button", { name: /delete/i })
      .click();

    await expect(page.getByText(`${categoryName} is deleted`)).toBeVisible();
    await expect(
      page.getByRole("cell", { name: categoryName, exact: true })
    ).not.toBeVisible();
  });

  test("10.7 Cancel edit modal", async ({ page }) => {
    const categoryName = "Electronics";

    await categoryRows(page)
      .filter({ hasText: categoryName })
      .getByRole("button", { name: /edit/i })
      .click();

    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    await modal.getByRole("button", { name: /close/i }).click();

    await expect(modal).not.toBeVisible();
    await expect(
      categoryRows(page).filter({ hasText: categoryName })
    ).toBeVisible();
  });

  test("10.8 Full CRUD cycle", async ({ page }) => {
    const categoryName = "TestCat";
    const updatedName = "TestCatUpdated";

    // Create
    await page.getByPlaceholder("Enter new category").fill(categoryName);
    await page.getByRole("button", { name: /submit/i }).first().click();
    await expect(page.getByText(`${categoryName} is created`)).toBeVisible();
    await expect(
      categoryRows(page).filter({ hasText: categoryName })
    ).toBeVisible();

    // Edit
    await categoryRows(page)
      .filter({ hasText: categoryName })
      .getByRole("button", { name: /edit/i })
      .click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await modal.getByPlaceholder("Enter new category").clear();
    await modal.getByPlaceholder("Enter new category").fill(updatedName);
    await modal.getByRole("button", { name: /submit/i }).click();
    await expect(page.getByText(`${updatedName} is updated`)).toBeVisible();
    await expect(
      categoryRows(page).filter({ hasText: updatedName })
    ).toBeVisible();

    // Delete
    await categoryRows(page)
      .filter({ hasText: updatedName })
      .getByRole("button", { name: /delete/i })
      .click();
    await expect(page.getByText(`${updatedName} is deleted`)).toBeVisible();
    await expect(
      page.getByRole("cell", { name: updatedName, exact: true })
    ).not.toBeVisible();
  });
});
