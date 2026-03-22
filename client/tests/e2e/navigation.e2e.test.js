// File & Tests Created - Shaun Lee Xuan Wei A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.

import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../.env") });

const CLIENT = process.env.REACT_APP_CLIENT || "http://localhost:3000";

test.describe("13. Navigation & Static Pages — navigation.e2e.js", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CLIENT);
    await page.evaluate(() => localStorage.clear());
  });

  test("13.1 Header brand link goes home", async ({ page }) => {
    await page.goto(`${CLIENT}/about`);
    await page.getByRole("link", { name: /virtual vault/i }).click();
    await expect(page).toHaveURL(`${CLIENT}/`);
  });

  test("13.2 Header Home link", async ({ page }) => {
    await page.goto(`${CLIENT}/about`);
    await page.getByRole("link", { name: /^home$/i }).click();
    await expect(page).toHaveURL(`${CLIENT}/`);
  });

  test("13.3 Footer About link", async ({ page }) => {
    await page.getByRole("link", { name: /^about$/i }).click();
    await expect(page).toHaveURL(`${CLIENT}/about`);
    await expect(page).toHaveTitle(/about us/i, { timeout: 30000 });
  });

  test("13.4 Footer Contact link", async ({ page }) => {
    await page.getByRole("link", { name: /^contact$/i }).click();
    await expect(page).toHaveURL(`${CLIENT}/contact`);
    await expect(
      page.getByRole("heading", { name: /contact us/i })
    ).toBeVisible({ timeout: 30000 });
  });

  test("13.5 Footer Policy link", async ({ page }) => {
    await page.getByRole("link", { name: /privacy policy/i }).click();
    await expect(page).toHaveURL(`${CLIENT}/policy`);
    await expect(page).toHaveTitle(/privacy policy/i, { timeout: 30000 });
  });

  test("13.6 404 page for invalid route", async ({ page }) => {
    await page.goto(`${CLIENT}/nonexistent-page`);
    await expect(page.getByText("404")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText(/page not found/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /go back/i })).toBeVisible();
  });

  test("13.7 404 Go Back button", async ({ page }) => {
    await page.goto(`${CLIENT}/nonexistent-page`);
    await expect(page.getByRole("link", { name: /go back/i })).toBeVisible({
      timeout: 30000,
    });
    await page.getByRole("link", { name: /go back/i }).click();
    await expect(page).toHaveURL(`${CLIENT}/`);
  });

  test("13.8 Header Categories link navigates to all categories", async ({ page }) => {
    await page
      .locator(".nav-link.dropdown-toggle")
      .filter({ hasText: /^categories$/i })
      .click();
    await page
      .locator(".dropdown-menu")
      .getByRole("link", { name: /^all categories$/i })
      .click();
    await expect(page).toHaveURL(`${CLIENT}/categories`);
  });

  test("13.9 Header Register link", async ({ page }) => {
    await page.getByRole("link", { name: /^register$/i }).click();
    await expect(page).toHaveURL(`${CLIENT}/register`);
  });

  test("13.10 Header Login link", async ({ page }) => {
    await page.getByRole("link", { name: /^login$/i }).click();
    await expect(page).toHaveURL(`${CLIENT}/login`);
  });

  test("13.11 Header Cart link", async ({ page }) => {
    await page.getByRole("link", { name: /^cart$/i }).click();
    await expect(page).toHaveURL(`${CLIENT}/cart`);
  });
});
