/**
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 */

import { test, expect } from '@playwright/test';

/**
 * Search UI tests (5 tests)
 *
 * 1. Search for existing product
 * 2. Search with no results
 * 3. Search then search again
 * 4. Search from product details page
 * 5. Search with partial product name
 */

test.describe('Search Functionality — search.e2e.js', () => {

  const HOME_URL = process.env.REACT_APP_CLIENT;

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto(HOME_URL);

    // Wait for page to load
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
  });

	test('1 Search for existing product', async ({ page }) => {
		// Get a real product name from the API to avoid hardcoding
		const response = await page.request.get(`${process.env.REACT_APP_API}/api/v1/product/get-product`);
		const data = await response.json();
		const firstProduct = data.products[0];
		const searchKeyword = firstProduct.name.split(' ')[0].toLowerCase(); // Use first word of name

		const searchInput = page.getByTestId('search-input');
		await searchInput.waitFor({ state: 'visible', timeout: 10000 });
		await searchInput.fill(searchKeyword);

		const searchButton = page.getByTestId('search-button');
		if (await searchButton.isVisible()) {
			await searchButton.click();
		} else {
			await searchInput.press('Enter');
		}

		await expect(page).toHaveURL(new RegExp(`search.*${searchKeyword}`, 'i'));
		await expect(page.getByTestId('search-results-title')).toBeVisible();

		const firstCard = page.locator('[data-testid^="search-result-card-"]').first();
		await expect(firstCard).toBeVisible({ timeout: 10000 });
		await expect(firstCard.locator('[data-testid^="search-result-image-"]')).toBeVisible();
		await expect(firstCard.locator('[data-testid^="search-result-name-"]')).toBeVisible();
		await expect(firstCard.locator('[data-testid^="search-result-price-"]')).toBeVisible();
	});

	test('2 Search with no results', async ({ page }) => {
		const searchInput = page.getByTestId('search-input');
		await searchInput.waitFor({ state: 'visible', timeout: 10000 });

		const nonsenseKeyword = `xyzabc`;
		await searchInput.fill(nonsenseKeyword);

		const searchButton = page.getByTestId('search-button');
		if (await searchButton.isVisible()) {
			await searchButton.click();
		} else {
			await searchInput.press('Enter');
		}

		// Verify redirect to search results page
		await expect(page).toHaveURL(new RegExp(`search.*${nonsenseKeyword}`, 'i'));

		// Verify results count shows 0
		await expect(page.getByTestId('results-count')).toBeVisible();
		await expect(page.getByTestId('results-count')).toContainText('No Products Found');

		// Verify no product cards are displayed
		await expect(page.locator('[data-testid^="search-result-card-"]').first()).not.toBeVisible();
	});

	test('3 Search then search again', async ({ page }) => {
		const searchInput = page.getByTestId('search-input');
		await searchInput.waitFor({ state: 'visible', timeout: 10000 });
		const searchButton = page.getByTestId('search-button');

		// FIRST SEARCH
		await searchInput.fill('shirt');
		if (await searchButton.isVisible()) {
			await searchButton.click();
		} else {
			await searchInput.press('Enter');
		}

		await expect(page).toHaveURL(/search.*shirt/i);
		const firstCard = page.locator('[data-testid^="search-result-card-"]').first();
		await expect(firstCard).toBeVisible({ timeout: 10000 });
		const firstSearchResults = await page.locator('[data-testid^="search-result-name-"]').allTextContents();
		expect(firstSearchResults.length).toBeGreaterThan(0);

		// SECOND SEARCH
		await searchInput.clear();
		await searchInput.fill('phone');
		if (await searchButton.isVisible()) {
			await searchButton.click();
		} else {
			await searchInput.press('Enter');
		}

		await expect(page).toHaveURL(/search.*phone/i);
		await expect(page.locator('[data-testid^="search-result-card-"]').first()).toBeVisible({ timeout: 10000 });
		const secondSearchResults = await page.locator('[data-testid^="search-result-name-"]').allTextContents();

		expect(JSON.stringify(secondSearchResults)).not.toBe(JSON.stringify(firstSearchResults));
	});

	test('4 Search from product details page', async ({ page }) => {
		const productCards = page.locator('.card');
		await expect(productCards.first()).toBeVisible({ timeout: 10000 });

		await productCards.first().locator('button').filter({ hasText: /more details/i }).click();
		await expect(page).toHaveURL(/\/product\/.+/);

		const searchInput = page.getByTestId('search-input');
		await searchInput.waitFor({ state: 'visible', timeout: 10000 });
		await searchInput.fill('tablet');

		const searchButton = page.getByTestId('search-button');
		if (await searchButton.isVisible()) {
			await searchButton.click();
		} else {
			await searchInput.press('Enter');
		}

		await expect(page).toHaveURL(/search.*tablet/i);
		await expect(page.getByTestId('search-results-title')).toBeVisible();
		await expect(page).not.toHaveURL(/\/product\//);
	});

	test('5 Search with partial product name', async ({ page }) => {
		const searchInput = page.getByTestId('search-input');
		await searchInput.waitFor({ state: 'visible', timeout: 10000 });
		await searchInput.fill('lap');

		const searchButton = page.getByTestId('search-button');
		if (await searchButton.isVisible()) {
			await searchButton.click();
		} else {
			await searchInput.press('Enter');
		}

		await expect(page).toHaveURL(/search.*lap/i);
		await expect(page.getByTestId('search-results-title')).toBeVisible();

		// Partial match should return results
		await expect(page.getByTestId('results-count')).not.toContainText('No Products Found');
		await expect(page.locator('[data-testid^="search-result-card-"]').first()).toBeVisible({ timeout: 10000 });
	});
});