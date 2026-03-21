/**
 * All tests written by: Ong Chang Heng Bertrand A0253013X
 */

import { test, expect } from '@playwright/test';

/**
 * Admin Products UI tests (9 tests)
 *
 * 1. View product list
 * 2. Navigate from product list to update page
 * 3. Create a new product
 * 4. Create product with missing fields
 * 5. Update product name and price
 * 6. Update product photo
 * 7. Delete a product
 * 8. Cancel delete product
 * 9. Full product lifecycle (create → view → update → view → delete)
 */

test.describe('Admin — Product CRUD — admin-products.e2e.test.js', () => {

  const ADMIN_LOGIN_URL = `${process.env.REACT_APP_CLIENT}/login`;
  const ADMIN_PRODUCTS_URL = `${process.env.REACT_APP_CLIENT}/dashboard/admin/products`;
  const ADMIN_CREATE_PRODUCT_URL = `${process.env.REACT_APP_CLIENT}/dashboard/admin/create-product`;

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  // Helper: Login as admin
  async function loginAsAdmin(page) {
    await page.goto(ADMIN_LOGIN_URL);
    await page.getByTestId('email-input').fill(ADMIN_EMAIL);
    await page.getByTestId('password-input').fill(ADMIN_PASSWORD);
    await page.getByTestId('login-button').click();
    await page.waitForURL(`${process.env.REACT_APP_CLIENT}/`, { timeout: 10000 });
  }

  // Helper: Click a product link and wait for form to be fully populated
  async function gotoProductUpdatePage(page, locator) {
    await locator.click();
    await expect(page).toHaveURL(/\/dashboard\/admin\/product\/.+/);
    await expect(page.getByTestId('name-input')).not.toHaveValue('', { timeout: 10000 });
  }

  test('1 View product list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_PRODUCTS_URL);

    await expect(page.getByTestId('all-products-title')).toBeVisible();

    await page.waitForLoadState('networkidle');

    const productCards = page.locator('.card');
    const cardCount = await productCards.count();

    if (cardCount > 0) {
      const firstCard = productCards.first();
      await expect(firstCard.locator('img')).toBeVisible();
      await expect(firstCard.locator('.card-title')).toBeVisible();
      await expect(firstCard.locator('.card-text')).toBeVisible();
    }
  });

  test('2 Navigate from product list to update page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_PRODUCTS_URL);

    const firstProductLink = page.locator('[data-testid^="product-link-"]').first();
    await gotoProductUpdatePage(page, firstProductLink);

    // Native input - toHaveValue works fine
    await expect(page.getByTestId('name-input')).toHaveValue(/.+/);

    // Ant Design Select renders as a div, check its displayed text instead
    await expect(page.getByTestId('category-select')).toBeVisible();
    await expect(page.getByTestId('category-select')).not.toBeEmpty();
  });

  test('3 Create a new product', async ({ page }) => {
    let createdProductSlug;
    await loginAsAdmin(page);
    await page.goto(ADMIN_CREATE_PRODUCT_URL);

    // Select category
    await page.getByTestId('category-select').click();
    const firstCategory = page.getByTestId(/^category-option-/).first();
    await firstCategory.click();

    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('client/tests/fixtures/test-product.jpg');

    // Fill form fields
    const productName = `Test Product Name`;
    await page.getByTestId('name-input').fill(productName);
    await page.getByTestId('description-input').fill('This is a test product description');
    await page.getByTestId('price-input').fill('99.99');
    await page.getByTestId('quantity-input').fill('10');
    await page.getByTestId('shipping-select').click();
    await page.getByTestId('select-shipping-yes').click();

    // Click CREATE PRODUCT
    await page.getByTestId('create-button').click();

    // Verify success toast
    await expect(page.getByText(/product created successfully/i)).toBeVisible();

    // Verify redirect to products list
    await expect(page).toHaveURL(ADMIN_PRODUCTS_URL);

    // Verify new product appears in list
    await expect(page.getByText(productName)).toBeVisible();
  });

  test('4 Create product with missing fields', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_CREATE_PRODUCT_URL);

    // Fill only name
    await page.getByTestId('name-input').fill('Incomplete Product');

    // Try to create without other fields
    await page.getByTestId('create-button').click();

    // Expect either validation error or error toast
    const errorMessage = page.getByText(/wrong/i);
    await expect(errorMessage).toBeVisible();

    // Verify NOT redirected (still on create page)
    await expect(page).toHaveURL(ADMIN_CREATE_PRODUCT_URL);
  });

  test('5 Update product name and price', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_PRODUCTS_URL);

    // Click on test product to open update page and wait for form to load
    await gotoProductUpdatePage(
      page,
      page.locator('[data-testid^="product-link-"]').filter({ hasText: 'Test Product Name' }).first()
    );

    // Get original values
    const originalName = await page.getByTestId('name-input').inputValue();

    // Update name and price
    const newName = `Updated ${originalName} ${Date.now()}`;
    await page.getByTestId('name-input').clear();
    await page.getByTestId('name-input').fill(newName);
    await page.getByTestId('price-input').clear();
    await page.getByTestId('price-input').fill('149.99');

    // Click UPDATE PRODUCT
    await page.getByTestId('update-button').click();

    // Verify success toast
    await expect(page.getByText(/product updated successfully/i)).toBeVisible();

    // Verify redirect to products list
    await expect(page).toHaveURL(ADMIN_PRODUCTS_URL);

    // Verify updated product shows new values
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('6 Update product photo', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_PRODUCTS_URL);

    // Click on first product and wait for form to load
    await gotoProductUpdatePage(
      page,
      page.locator('[data-testid^="product-link-"]').first()
    );

    // Get current image src
    const currentImg = page.locator('img[alt="product_photo"]').first();
    const originalSrc = await currentImg.getAttribute('src');

    // Upload new photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('client/tests/fixtures/test-product-2.jpg');

    // Wait for preview to update
    await page.waitForTimeout(500);

    // Verify image preview changed (if using URL.createObjectURL)
    const previewImg = page.locator('img[alt="product_photo"]').first();
    const newSrc = await previewImg.getAttribute('src');

    // If using object URL, it should be a blob: URL now
    const isObjectUrl = newSrc?.includes('blob:');
    expect(isObjectUrl || newSrc !== originalSrc).toBeTruthy();

    // Click UPDATE PRODUCT
    await page.getByTestId('update-button').click();

    // Verify success and redirect
    await expect(page.getByText(/product updated successfully/i)).toBeVisible();
    await expect(page).toHaveURL(ADMIN_PRODUCTS_URL);
  });

  test('7 Delete a product', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_PRODUCTS_URL);

    // Get the name of first product before deletion
    const firstProduct = page.locator('[data-testid^="product-link-"]').first();
    const productName = await firstProduct.getByTestId(/^product-name-/).innerText();

    // Click on first product and wait for form to load
    await gotoProductUpdatePage(page, firstProduct);

    // Set up listener for confirm dialog before clicking delete
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('sure');
      dialog.accept();
    });
    await page.getByTestId('delete-button').click();

    // Verify success toast
    await expect(page.getByText(/product deleted successfully/i)).toBeVisible();

    // Verify redirect to products list
    await expect(page).toHaveURL(ADMIN_PRODUCTS_URL);

    // Verify product no longer in list
    await expect(page.getByText(productName)).not.toBeVisible();
  });

  test('8 Cancel delete product', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(ADMIN_PRODUCTS_URL);

    // Click on first product and wait for form to load
    await gotoProductUpdatePage(
      page,
      page.locator('[data-testid^="product-link-"]').first()
    );

    const currentUrl = page.url();

    // Get product name from the form input — already on update page
    const productName = await page.getByTestId('name-input').inputValue();

    page.once('dialog', dialog => {
      dialog.dismiss();
    });

    await page.getByTestId('delete-button').click();

    // Verify still on update page
    await expect(page).toHaveURL(currentUrl);

    // Verify form is still populated with same value
    await expect(page.getByTestId('name-input')).toHaveValue(productName);
  });

  test('9 Full product lifecycle', async ({ page }) => {
    const testProductName = `Lifecycle Test Name`;

    // STEP 1: Create product
    await loginAsAdmin(page);
    await page.goto(ADMIN_CREATE_PRODUCT_URL);

    // Select category
    await page.getByTestId('category-select').click();
    await page.getByTestId(/^category-option-/).first().click();

    // Upload photo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('client/tests/fixtures/test-product.jpg');

    // Fill form
    await page.getByTestId('name-input').fill(testProductName);
    await page.getByTestId('description-input').fill('Lifecycle test product');
    await page.getByTestId('price-input').fill('199.99');
    await page.getByTestId('quantity-input').fill('5');

    // Select shipping
    await page.getByTestId('shipping-select').click();
    await page.getByTestId('select-shipping-no').click();

    // Create product
    await page.getByTestId('create-button').click();
    await expect(page.getByText(/product created successfully/i)).toBeVisible();
    await expect(page).toHaveURL(ADMIN_PRODUCTS_URL);

    // STEP 2: View in list
    await expect(page.getByText(testProductName)).toBeVisible();

    // STEP 3: Update details — wait for form to be populated
    await gotoProductUpdatePage(
      page,
      page.locator(`[data-testid*="product-link"]`).filter({ hasText: testProductName })
    );

    const updatedName = `${testProductName} Updated`;
    await page.getByTestId('name-input').clear();
    await page.getByTestId('name-input').fill(updatedName);
    await page.getByTestId('price-input').clear();
    await page.getByTestId('price-input').fill('249.99');

    await page.getByTestId('update-button').click();
    await expect(page.getByText(/product updated successfully/i)).toBeVisible();

    // STEP 4: View updated in list
    await expect(page).toHaveURL(ADMIN_PRODUCTS_URL);
    await expect(page.getByText(updatedName)).toBeVisible();

    // STEP 5: Delete product — wait for form to be populated
    await gotoProductUpdatePage(
      page,
      page.locator(`[data-testid*="product-link"]`).filter({ hasText: updatedName })
    );

    page.once('dialog', dialog => {
      dialog.accept();
    });

    await page.getByTestId('delete-button').click();
    await expect(page.getByText(/product deleted successfully/i)).toBeVisible();
    await expect(page).toHaveURL(ADMIN_PRODUCTS_URL);

    // Verify product no longer exists
    await expect(page.getByText(updatedName)).not.toBeVisible();
  });
});