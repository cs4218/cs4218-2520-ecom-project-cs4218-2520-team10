// @ts-check
/**
 * E2E Test: User Profile Management
 * Author: Kim Shi Tong, A0265858J
 *
 * Black-box UI tests using Playwright.
 * Tests navigate real pages, perform real user actions, and assert visible outcomes.
 * No implementation details tested — only what the end user sees.
 *
 * Test data strategy:
 * - A dedicated user is registered via API in beforeAll (faster than UI, not what's being tested).
 * - Each test logs in via UI in beforeEach (fresh browser context per test).
 * - Tests that modify profile data (name, password) clean up after themselves.
 */
import { test, expect } from '@playwright/test';

// Dedicated profile test user (registered via API in beforeAll)
const PROFILE_USER = {
  name: 'Profile Test User',
  email: `profile-test-${Date.now()}@test.com`,
  password: 'password123',
  phone: '91112222',
  address: '100 Profile Street',
  answer: 'tennis',
};

/**
 * Helper: Log in via the UI.
 */
async function loginViaUI(page, email, password) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter Your Email').fill(email);
  await page.getByPlaceholder('Enter Your Password').fill(password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByText('Login Successfully')).toBeVisible({ timeout: 5000 });
}

test.describe('User Profile Management', () => {
  // Register a dedicated user for profile tests
  test.beforeAll(async () => {
    await fetch('http://localhost:6060/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(PROFILE_USER),
    });
  });

  // Login before each test
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page, PROFILE_USER.email, PROFILE_USER.password);
  });

  test.describe('Dashboard', () => {
    // Kim Shi Tong, A0265858J
    test('should display user name, email, and address on the dashboard', async ({ page }) => {
      // Navigate to dashboard (multi-component: Login → Header → Dashboard)
      await page.goto('/dashboard/user');

      await expect(page).toHaveURL(/\/dashboard\/user/);
      await expect(page.getByText(PROFILE_USER.name).first()).toBeVisible();
      await expect(page.getByText(PROFILE_USER.email)).toBeVisible();
      await expect(page.getByText(PROFILE_USER.address)).toBeVisible();
    });

    // Kim Shi Tong, A0265858J
    test('should navigate to profile page from the dashboard sidebar', async ({ page }) => {
      await page.goto('/dashboard/user');

      // Click Profile link in the sidebar (UserMenu)
      await page.getByRole('link', { name: 'Profile' }).click();

      // Profile form loads with pre-filled user data
      await expect(page).toHaveURL(/\/dashboard\/user\/profile/);
      await expect(page.getByPlaceholder('Enter Your Name')).toHaveValue(PROFILE_USER.name);
      await expect(page.getByPlaceholder('Enter Your Email')).toHaveValue(PROFILE_USER.email);
      await expect(page.getByPlaceholder('Enter Your Phone')).toHaveValue(PROFILE_USER.phone);
      await expect(page.getByPlaceholder('Enter Your Address')).toHaveValue(PROFILE_USER.address);
    });
  });

  test.describe('Profile Updates', () => {
    // Kim Shi Tong, A0265858J
    test('should update name and reflect the change in the header', async ({ page }) => {
      await page.goto('/dashboard/user/profile');

      const nameField = page.getByPlaceholder('Enter Your Name');
      await nameField.clear();
      await nameField.fill('Updated Kim');
      // Must include a valid password (>=6 chars) to pass backend validation
      await page.getByPlaceholder('Enter Your Password').fill(PROFILE_USER.password);
      await page.getByRole('button', { name: 'UPDATE', exact: true }).click();

      await expect(page.getByText('Profile Updated Successfully')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Updated Kim')).toBeVisible();
    });

    // Kim Shi Tong, A0265858J
    test('should update phone and address, then verify on dashboard', async ({ page }) => {
      await page.goto('/dashboard/user/profile');

      const phoneField = page.getByPlaceholder('Enter Your Phone');
      const addressField = page.getByPlaceholder('Enter Your Address');
      await phoneField.clear();
      await phoneField.fill('88889999');
      await addressField.clear();
      await addressField.fill('200 Updated Avenue');
      // Must include a valid password (>=6 chars) to pass backend validation
      await page.getByPlaceholder('Enter Your Password').fill(PROFILE_USER.password);
      await page.getByRole('button', { name: 'UPDATE', exact: true }).click();

      await expect(page.getByText('Profile Updated Successfully')).toBeVisible({ timeout: 5000 });

      // Verify updated address appears on dashboard
      await page.goto('/dashboard/user');
      await expect(page.getByText('200 Updated Avenue')).toBeVisible();

      // CLEANUP — reset phone and address (navigate back to profile from dashboard)
      await page.goto('/dashboard/user/profile');
      await expect(page.getByRole('button', { name: 'UPDATE', exact: true })).toBeVisible({ timeout: 5000 });
      const phoneFieldReset = page.getByPlaceholder('Enter Your Phone');
      const addressFieldReset = page.getByPlaceholder('Enter Your Address');
      await phoneFieldReset.clear();
      await phoneFieldReset.fill(PROFILE_USER.phone);
      await addressFieldReset.clear();
      await addressFieldReset.fill(PROFILE_USER.address);
      await page.getByPlaceholder('Enter Your Password').fill(PROFILE_USER.password);
      await page.getByRole('button', { name: 'UPDATE', exact: true }).click();
      await expect(page.getByText('Profile Updated Successfully')).toBeVisible({ timeout: 5000 });
    });

    // Kim Shi Tong, A0265858J
    test('should update password, then logout and login with the new password', async ({ page }) => {
      await page.goto('/dashboard/user/profile');

      // Change password
      await page.getByPlaceholder('Enter Your Password').fill('newpassword456');
      await page.getByRole('button', { name: 'UPDATE', exact: true }).click();
      await expect(page.getByText('Profile Updated Successfully')).toBeVisible({ timeout: 5000 });

      // Logout
      await page.locator('.nav-link.dropdown-toggle').last().click();
      await page.getByRole('link', { name: 'Logout' }).click();
      await expect(page.getByText('Logout Successfully')).toBeVisible({ timeout: 5000 });

      // Login with NEW password (spans Login + Profile + Header components)
      await page.goto('/login');
      await page.getByPlaceholder('Enter Your Email').fill(PROFILE_USER.email);
      await page.getByPlaceholder('Enter Your Password').fill('newpassword456');
      await page.getByRole('button', { name: 'LOGIN' }).click();

      await expect(page.getByText('Login Successfully')).toBeVisible({ timeout: 5000 });

      // CLEANUP — reset password to original
      await page.goto('/dashboard/user/profile');
      await page.getByPlaceholder('Enter Your Password').fill(PROFILE_USER.password);
      await page.getByRole('button', { name: 'UPDATE', exact: true }).click();
      await expect(page.getByText('Profile Updated Successfully')).toBeVisible({ timeout: 5000 });
    });

    // Kim Shi Tong, A0265858J
    test('should have the email field disabled so it cannot be edited', async ({ page }) => {
      await page.goto('/dashboard/user/profile');

      await expect(page.getByPlaceholder('Enter Your Email')).toBeDisabled();
    });
  });
});
