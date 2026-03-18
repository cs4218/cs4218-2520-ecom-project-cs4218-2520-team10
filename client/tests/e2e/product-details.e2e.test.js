/**
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 */

import { test, expect } from '@playwright/test';

test.describe('4. Product Details — product-details.e2e.js', () => {

  const PRODUCT_SLUG = 'laptop';
  const PRODUCT_URL = `http://localhost:3000/product/${PRODUCT_SLUG}`;

  test.beforeEach(async ({ page }) => {
    await page.goto(PRODUCT_URL);
    await expect(page.getByTestId('product-title')).toBeVisible({ timeout: 10000 });
  });

  test('4.1 View product details', async ({ page }) => {
    // Product is already loaded, just verify all elements are visible
    await expect(page.getByTestId('product-title')).toBeVisible();
    await expect(page.getByTestId('product-price')).toBeVisible();
    await expect(page.getByTestId('product-description')).toBeVisible();
    await expect(page.getByTestId('main-product-image')).toBeVisible();
    await expect(page.getByTestId('product-category')).toBeVisible();
  });

  test('4.2 Add to cart from product detail page', async ({ page }) => {
    const initialCartText = await page.locator('sup').first().innerText().catch(() => '0');
    const initialCount = parseInt(initialCartText) || 0;

    await page.locator('[data-testid^="main-add-to-cart-button"]').click({ force: true });

    await expect(page.getByText('Item Added to cart')).toBeVisible();
    await expect(page.locator('sup').first()).toContainText((initialCount + 1).toString());
  });

	test('4.3 View similar/related products', async ({ page }) => {
		const similarSection = page.getByTestId('similar-products');

		await expect(similarSection).toBeVisible();

		const similarProducts = similarSection.getByTestId('similar-products-list').locator('.card');
		const count = await similarProducts.count();
		if (count > 0) {
			await expect(similarProducts.first()).toBeVisible();
		} else {
			await expect(page.getByTestId('no-similar-products')).toBeVisible();
		}
	});

	test('4.4 Navigate to a related product', async ({ page }) => {
		const initialUrl = page.url();

		const similarList = page.getByTestId('similar-products-list');
		await expect(similarList.locator('.card').first()).toBeVisible({ timeout: 10000 });

		const firstRelatedCard = similarList.locator('.card').first();
		const moreDetailsButton = firstRelatedCard.locator('button').filter({ hasText: /more details/i });

		if (await moreDetailsButton.count() > 0) {
			const relatedProductName = await firstRelatedCard.locator('.card-title').first().innerText();
			const expectedSlug = relatedProductName.toLowerCase().replace(/\s+/g, '-');

			await moreDetailsButton.click({ force: true });

			await expect(page).toHaveURL(new RegExp(`/product/${expectedSlug}`));

			await expect(page.getByTestId('product-title')).toBeVisible({ timeout: 10000 });
			await expect(page.getByTestId('product-title')).toContainText(relatedProductName);
		}
	});

	test('4.5 Add related product to cart', async ({ page }) => {
		const similarList = page.getByTestId('similar-products-list');
		await expect(similarList.locator('.card').first()).toBeVisible({ timeout: 10000 });

		const addToCartButtons = similarList.locator('button').filter({ hasText: /add to cart/i });
		const buttonCount = await addToCartButtons.count();

		if (buttonCount > 0) {
			const initialCartText = await page.locator('sup').first().innerText().catch(() => '0');
			const initialCount = parseInt(initialCartText) || 0;

			await addToCartButtons.first().click({ force: true });

			await expect(page.getByText('Item Added to cart')).toBeVisible();
			await expect(page.locator('sup').first()).toContainText((initialCount + 1).toString());
		}
	});

  test('4.6 Product with no similar products', async ({ page }) => {
		await page.goto('http://localhost:3000/product/nus-tshirt');
		await expect(page.getByTestId('product-title')).toBeVisible({ timeout: 10000 });

		await expect(page.getByTestId('no-similar-products')).toBeVisible();
	});
});