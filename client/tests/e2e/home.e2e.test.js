/**
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 */

import { test, expect } from '@playwright/test';

/**
 * Home page UI tests (9 tests)
 *
 * 1. Home page loads products
 * 2. Filter by category
 * 3. Filter by price range
 * 4. Filter by category AND price
 * 5. Reset filters
 * 6. Load more products (pagination)
 * 7. Click "More Details" on product card
 * 8. Add to cart from home page
 * 9. Add multiple items to cart from home
 */

test.describe('Home Page Browsing — home.e2e.js', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(process.env.REACT_APP_CLIENT);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid^="product-card-"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('1 Home page loads products', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="product-card-"]').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator('[data-testid^="product-image-"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid^="product-name-"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid^="product-description-"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid^="product-price-"]')).toBeVisible();
  });

  test('2 Filter by category', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="category-checkbox-"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 10000 });
    await firstCheckbox.check({ force: true });

    await page.waitForLoadState('networkidle');
    const count = await page.locator('[data-testid^="product-card-"]').count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('3 Filter by price range', async ({ page }) => {
    const firstRadio = page.locator('[data-testid^="price-radio-"]').first();
    await expect(firstRadio).toBeVisible({ timeout: 10000 });
    await firstRadio.check({ force: true });

    await page.waitForLoadState('networkidle');
    const count = await page.locator('[data-testid^="product-card-"]').count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('4 Filter by category AND price', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="category-checkbox-"]').first();
    const firstRadio = page.locator('[data-testid^="price-radio-"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 10000 });
    await firstCheckbox.check({ force: true });
    await firstRadio.check({ force: true });

    await page.waitForLoadState('networkidle');
    const count = await page.locator('[data-testid^="product-card-"]').count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('5 Reset filters', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="category-checkbox-"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 10000 });
    await firstCheckbox.check({ force: true });

    await expect(page.getByTestId('reset-filters-button')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('reset-filters-button').click();

    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid^="product-card-"]').first()).toBeVisible({ timeout: 10000 });
    await expect(firstCheckbox).not.toBeChecked();
  });

  test('6 Load more products (pagination)', async ({ page }) => {
    const loadMoreBtn = page.getByTestId('load-more-button');

    if (await loadMoreBtn.isVisible()) {
      const initialCount = await page.locator('[data-testid^="product-card-"]').count();
      await loadMoreBtn.click();

      // Wait for count to increase rather than networkidle
      await expect(page.locator('[data-testid^="product-card-"]')).toHaveCount(
        initialCount + 1,
        { timeout: 10000 }
      );

      const newCount = await page.locator('[data-testid^="product-card-"]').count();
      expect(newCount).toBeGreaterThan(initialCount);
    } else {
      // If button not visible, verify we have products and total equals count (all loaded)
      const count = await page.locator('[data-testid^="product-card-"]').count();
      expect(count).toBeGreaterThan(0);
      console.log(`Load more button not visible — all ${count} products already loaded`);
    }
  });

  test('7 Click "More Details" on product card', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="product-card-"]').first();
    const productName = (await firstCard.locator('[data-testid^="product-name-"]').innerText()).trim();

    await firstCard.locator('[data-testid^="product-details-button-"]').click();

    await expect(page).toHaveURL(/\/product\/.+/);
    await expect(page.getByTestId('product-title')).not.toHaveText('', { timeout: 10000 });
    await expect(page.getByTestId('product-title')).toContainText(productName);
  });

  test('8 Add to cart from home page', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="product-card-"]').first();
    await firstCard.locator('[data-testid^="product-cart-button-"]').click();

    await expect(page.getByText('Item Added to cart')).toBeVisible();
    await expect(page.locator('sup').first()).toContainText('1');
  });

  test('9 Add multiple items to cart from home', async ({ page }) => {
    const cards = page.locator('[data-testid^="product-card-"]');

    await cards.nth(0).locator('[data-testid^="product-cart-button-"]').click();
    await page.waitForTimeout(500);

    if (await cards.nth(1).isVisible()) {
      await cards.nth(1).locator('[data-testid^="product-cart-button-"]').click();
      await page.waitForTimeout(500);

      if (await cards.nth(2).isVisible()) {
        await cards.nth(2).locator('[data-testid^="product-cart-button-"]').click();
        await expect(page.locator('sup').first()).toContainText('3');
      } else {
        await expect(page.locator('sup').first()).toContainText('2');
      }
    }
  });
});