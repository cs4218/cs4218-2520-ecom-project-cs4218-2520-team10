// File & Tests Created - Shaun Lee Xuan Wei A0252626E
// NOTE: The following tests and documentation are created with the help of AI based on user defined test scenario plan.

import { test, expect } from "@playwright/test";
import { seedDatabase } from "./db-seed.js";

test.beforeAll(async () => {
  await seedDatabase();
});

test.describe("5. Category Browsing (Public) — categories.e2e.js", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.evaluate(() => localStorage.clear());
  });

  test("5.1 View all categories page", async ({ page }) => {
    await page.goto("http://localhost:3000/categories");

    await expect(page.getByTestId(/^category-link-/).first()).toBeVisible({
      timeout: 10000,
    });
    const categoryLinks = page.getByTestId(/^category-link-/);
    const count = await categoryLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(categoryLinks.nth(i)).toBeVisible();
    }
  });

  test("5.2 Click a category to see its products", async ({ page }) => {
    await page.goto("http://localhost:3000/categories");

    const firstCategoryLink = page.getByTestId(/^category-link-/).first();
    await expect(firstCategoryLink).toBeVisible({ timeout: 10000 });
    const categoryName = await firstCategoryLink.innerText();
    await firstCategoryLink.click();

    await expect(page).toHaveURL(/\/category\/.+/);
    await expect(page.getByTestId("category-name")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("category-name")).toContainText(categoryName);
    await expect(page.getByTestId("product-count")).toBeVisible();
    await expect(page.getByTestId("product-count")).toContainText(
      /\d+ results found/
    );
    await expect(page.locator(".card").first()).toBeVisible({ timeout: 10000 });
  });

  test("5.3 Add to cart from category page", async ({ page }) => {
    await page.goto("http://localhost:3000/categories");

    await expect(page.getByTestId(/^category-link-/).first()).toBeVisible({
      timeout: 10000,
    });
    await page.getByTestId(/^category-link-/).first().click();
    await expect(page).toHaveURL(/\/category\/.+/);

    const addToCartButton = page
      .locator("button")
      .filter({ hasText: /add to cart/i })
      .first();
    await expect(addToCartButton).toBeVisible({ timeout: 10000 });

    const initialCartText = await page
      .locator("sup")
      .first()
      .innerText()
      .catch(() => "0");
    const initialCount = parseInt(initialCartText) || 0;

    await addToCartButton.click({ force: true });

    await expect(page.getByText("Item Added to cart")).toBeVisible();
    await expect(page.locator("sup").first()).toContainText(
      (initialCount + 1).toString()
    );
  });

  test("5.4 Navigate to product detail from category page", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/categories");

    await expect(page.getByTestId(/^category-link-/).first()).toBeVisible({
      timeout: 10000,
    });
    await page.getByTestId(/^category-link-/).first().click();
    await expect(page).toHaveURL(/\/category\/.+/);

    const firstCard = page.locator(".card").first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    const productName = await firstCard
      .locator(".card-title")
      .first()
      .innerText();

    await firstCard
      .locator("button")
      .filter({ hasText: /more details/i })
      .click({ force: true });

    await expect(page).toHaveURL(/\/product\/.+/);
    await expect(page.getByTestId("product-title")).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByTestId("product-title")).toContainText(productName);
  });

  test("5.5 Categories dropdown in header shows all categories and navigates", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/");

    const categoriesToggle = page
      .locator(".nav-link.dropdown-toggle")
      .filter({ hasText: /^categories$/i });
    await expect(categoriesToggle).toBeVisible({ timeout: 10000 });

    await categoriesToggle.click();

    const dropdownMenu = page.locator(".dropdown-menu");
    await expect(dropdownMenu).toBeVisible();

    await expect(
      dropdownMenu.locator("a").filter({ hasText: /^all categories$/i })
    ).toBeVisible();

    const categoryItems = dropdownMenu.locator("a").filter({
      hasNotText: /^all categories$/i,
    });
    const count = await categoryItems.count();
    expect(count).toBeGreaterThan(0);

    const firstCategoryName = await categoryItems.first().innerText();
    await categoryItems.first().click();

    await expect(page).toHaveURL(/\/category\/.+/);
    await expect(page.getByTestId("category-name")).toContainText(
      firstCategoryName,
      { ignoreCase: true }
    );
  });
});
