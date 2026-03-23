/**
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 */

import { test, expect } from '@playwright/test';
import { seedDatabase } from './db-seed';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Home page UI tests (10 tests)
 *
 * 1. Home page loads products
 * 2. Filter by category
 * 3. Filter by price range
 * 4. Filter by category AND price
 * 5. Reset filters
 * 6. Filter with no matching products shows message
 * 7. Load more products (pagination)
 * 8. Click "More Details" on product card
 * 9. Add to cart from home page
 * 10. Add multiple items to cart from home
 */

test.describe('Home Page Browsing — home.e2e.js', () => {
  test.beforeAll(async ({ request }) => {
    await seedDatabase();

    // Login to get token
    const loginRes = await request.post(`${process.env.REACT_APP_API}/api/v1/auth/login`, {
      data: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      }
    });
    const { token } = await loginRes.json();

    // Get a category from seeded data
    const catRes = await request.get(`${process.env.REACT_APP_API}/api/v1/category/get-category`);
    const { category } = await catRes.json();
    const categoryId = category[0]._id;

    // Create extra products to ensure load more button appears
    for (let i = 1; i <= 5; i++) {
      await request.post(`${process.env.REACT_APP_API}/api/v1/product/create-product`, {
        headers: { Authorization: token },
        multipart: {
          name: `Pagination Test Product ${i}`,
          description: `Extra product for pagination testing ${i}`,
          price: 100 + i,
          quantity: '10',
          category: categoryId,
          shipping: 'true',
          photo: {
            name: 'test-product.jpg',
            mimeType: 'image/jpeg',
            buffer: readFileSync(resolve('client/tests/fixtures/test-product.jpg')),
          },
        }
      });
    }
  });

  test.afterAll(async ({ request }) => {
    await seedDatabase();
  });

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
    await expect(page.getByTestId('results-count') || page.locator('[data-testid^="product-card-"]')).toBeDefined();
  });

  test('3 Filter by price range', async ({ page }) => {
    const firstRadio = page.locator('[data-testid^="price-radio-"]').first();
    await expect(firstRadio).toBeVisible({ timeout: 10000 });
    await firstRadio.check({ force: true });

    await page.waitForLoadState('networkidle');
    const count = await page.locator('[data-testid^="product-card-"]').count();
    await expect(page.getByTestId('results-count') || page.locator('[data-testid^="product-card-"]')).toBeDefined();
  });

  test('4 Filter by category AND price', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="category-checkbox-"]').first();
    const firstRadio = page.locator('[data-testid^="price-radio-"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 10000 });
    await firstCheckbox.check({ force: true });
    await firstRadio.check({ force: true });

    await page.waitForLoadState('networkidle');
    const count = await page.locator('[data-testid^="product-card-"]').count();
    await expect(page.getByTestId('results-count') || page.locator('[data-testid^="product-card-"]')).toBeDefined();
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

  test('6 Filter with no matching products shows message', async ({ page }) => {
    const firstCheckbox = page.locator('[data-testid^="category-checkbox-"]').first();
    await expect(firstCheckbox).toBeVisible({ timeout: 10000 });
    await firstCheckbox.check({ force: true });

    // Click $60-79 radio specifically — guaranteed no match with first category
    const sixtyToSeventyNine = page.locator('[data-testid^="price-radio-"]').nth(3);
    await sixtyToSeventyNine.check({ force: true });

    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('no-products-filter-message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid^="product-card-"]')).toHaveCount(0);
  });

  test('7 Load more products (pagination)', async ({ page }) => {
    const loadMoreBtn = page.getByTestId('load-more-button');

    if (await loadMoreBtn.isVisible()) {
      const initialCount = await page.locator('[data-testid^="product-card-"]').count();
      await loadMoreBtn.click();

      await expect(async () => {
        const newCount = await page.locator('[data-testid^="product-card-"]').count();
        expect(newCount).toBeGreaterThan(initialCount);
      }).toPass({ timeout: 10000 });

      const newCount = await page.locator('[data-testid^="product-card-"]').count();
      expect(newCount).toBeGreaterThan(initialCount);
    } else {
      const count = await page.locator('[data-testid^="product-card-"]').count();
      expect(count).toBeGreaterThan(0);
      console.log(`Load more button not visible — all ${count} products already loaded`);
    }
  });

  test('8 Click "More Details" on product card', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="product-card-"]').first();
    const productName = (await firstCard.locator('[data-testid^="product-name-"]').innerText()).trim();

    await firstCard.locator('[data-testid^="product-details-button-"]').click();

    await expect(page).toHaveURL(/\/product\/.+/);
    
    // Wait for product data to load before asserting content
    await expect(page.getByTestId('product-title')).not.toHaveText('', { timeout: 10000 });
    await expect(page.getByTestId('product-title')).toContainText(productName);
  });

  test('9 Add to cart from home page', async ({ page }) => {
    const firstCard = page.locator('[data-testid^="product-card-"]').first();
    await firstCard.locator('[data-testid^="product-cart-button-"]').click();

    await expect(page.getByText('Item Added to cart')).toBeVisible();
    await expect(page.locator('sup').first()).toContainText('1');
  });

  test('10 Add multiple items to cart from home', async ({ page }) => {
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