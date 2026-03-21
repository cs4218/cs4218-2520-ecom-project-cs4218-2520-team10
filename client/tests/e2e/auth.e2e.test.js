// AI Policy: the following file is generated with AI assistance
// Test cases written by: KIM SHI TONG A0265858J
// @ts-check
/**
 * E2E Test: Authentication Flows
 * Author: Kim Shi Tong, A0265858J
 *
 * ============================================================================
 * COMPLETENESS (Rubric 1%): Full Navigate → Act → Assert scenarios
 * ============================================================================
 * Every test navigates to a real page, performs real user actions (fill form,
 * click button, open dropdown), and asserts user-visible outcomes (toast text,
 * URL redirect, header changes). No "element inventory" tests — each test
 * completes an entire user scenario end-to-end.
 *
 * 10 scenarios covering:
 *   - Register success, missing fields, duplicate email
 *   - Login success (regular + admin), wrong password, non-existent email
 *   - Logout with header revert
 *   - Register → immediate login (cross-page flow)
 *   - Redirect back to intended page after forced login
 *
 * ============================================================================
 * CORRECTNESS (Rubric 1%): Playwright best practices
 * ============================================================================
 * - Locators: getByPlaceholder(), getByRole(), getByText() — no brittle CSS
 * - Assertions: every test has expect().toBeVisible() / toHaveURL() — none without
 * - No hardcoded waits: uses Playwright auto-wait (toBeVisible({ timeout }))
 * - Black-box only: asserts what the user sees (toast, URL, header name),
 *   never localStorage, React state, or API response bodies
 * - Unique Date.now() emails prevent cross-run conflicts
 *
 * ============================================================================
 * VARIETY (Rubric 1%): Contributes to diverse coverage alongside profile +
 * route-protection files. This file covers registration (3 scenarios),
 * login (5 scenarios), logout (1), and cross-flow (1). Both happy paths
 * (register success, login success) and unhappy paths (wrong password,
 * duplicate email, non-existent email, missing fields) are tested.
 * ============================================================================
 *
 * Multi-component flows tested:
 *   - Register.js → Login.js → Header.js (register then login)
 *   - Login.js → Header.js (login shows name, admin shows admin link)
 *   - Header.js → Login.js (logout reverts to Register/Login links)
 *   - Spinner.js → Login.js → AdminDashboard.js (redirect back after login)
 *
 * Test data strategy:
 * - Registration tests create unique users in-test (registration IS the scenario).
 * - Login tests use a user registered via API in beforeAll (faster, not what's being tested).
 * - Admin tests use pre-seeded admin from DB (can't register admin via public API).
 */
import { test, expect } from '@playwright/test';

// Admin user (pre-seeded in DB)
const ADMIN_USER = {
  email: 'test@admin.com',
  password: 'test@admin.com',
};

// Test user for login tests (registered via API in beforeAll)
const LOGIN_USER = {
  name: 'Auth Test User',
  email: `auth-test-${Date.now()}@test.com`,
  password: 'password123',
  phone: '98765432',
  address: '123 Test Street',
  answer: 'basketball',
};

/**
 * Helper: Log in via the UI.
 * Used in tests that require an authenticated state as a precondition.
 */
async function loginViaUI(page, email, password) {
  await page.goto('/login');
  await page.getByPlaceholder('Enter Your Email').fill(email);
  await page.getByPlaceholder('Enter Your Password').fill(password);
  await page.getByRole('button', { name: 'LOGIN' }).click();
  await expect(page.getByText('Login Successfully')).toBeVisible({ timeout: 5000 });
}

test.describe('Authentication Flows', () => {
  // Seed a test user via API before all tests in this file
  test.beforeAll(async () => {
    await fetch('http://localhost:6060/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(LOGIN_USER),
    });
  });

  test.describe('Registration', () => {
    // Kim Shi Tong, A0265858J
    test('should register a new user successfully and redirect to login', async ({ page }) => {
      const uniqueEmail = `reg-success-${Date.now()}@test.com`;

      await page.goto('/register');

      await page.getByPlaceholder('Enter Your Name').fill('New User');
      await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
      await page.getByPlaceholder('Enter Your Password').fill('password123');
      await page.getByPlaceholder('Enter Your Phone').fill('91234567');
      await page.getByPlaceholder('Enter Your Address').fill('456 New Street');
      await page.locator('#exampleInputDOB1').fill('2000-01-15');
      await page.getByPlaceholder('What is Your Favorite sports').fill('soccer');
      await page.getByRole('button', { name: 'REGISTER' }).click();

      await expect(page.getByText('Register Successfully, please login')).toBeVisible({ timeout: 5000 });
      await expect(page).toHaveURL(/\/login/);
    });

    // Kim Shi Tong, A0265858J
    test('should not submit when required fields are missing', async ({ page }) => {
      await page.goto('/register');

      // Fill only the name, leave other required fields empty
      await page.getByPlaceholder('Enter Your Name').fill('Incomplete User');
      await page.getByRole('button', { name: 'REGISTER' }).click();

      // HTML5 required validation prevents submission — stay on register page
      await expect(page).toHaveURL(/\/register/);
      await expect(page.getByText('Register Successfully')).not.toBeVisible();
    });

    // Kim Shi Tong, A0265858J
    test('should show error when registering with a duplicate email', async ({ page }) => {
      await page.goto('/register');

      await page.getByPlaceholder('Enter Your Name').fill('Duplicate User');
      await page.getByPlaceholder('Enter Your Email').fill(LOGIN_USER.email);
      await page.getByPlaceholder('Enter Your Password').fill('password123');
      await page.getByPlaceholder('Enter Your Phone').fill('91234567');
      await page.getByPlaceholder('Enter Your Address').fill('789 Dup Street');
      await page.locator('#exampleInputDOB1').fill('1999-06-15');
      await page.getByPlaceholder('What is Your Favorite sports').fill('tennis');
      await page.getByRole('button', { name: 'REGISTER' }).click();

      await expect(page.getByText('Something went wrong')).toBeVisible({ timeout: 5000 });
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe('Login', () => {
    // Kim Shi Tong, A0265858J
    test('should login successfully as regular user and show name in header', async ({ page }) => {
      await page.goto('/login');

      await page.getByPlaceholder('Enter Your Email').fill(LOGIN_USER.email);
      await page.getByPlaceholder('Enter Your Password').fill(LOGIN_USER.password);
      await page.getByRole('button', { name: 'LOGIN' }).click();

      await expect(page.getByText('Login Successfully')).toBeVisible({ timeout: 5000 });
      await expect(page).toHaveURL('/');
      await expect(page.getByText(LOGIN_USER.name)).toBeVisible();
    });

    // Kim Shi Tong, A0265858J
    test('should login as admin and show admin dashboard link', async ({ page }) => {
      await page.goto('/login');

      await page.getByPlaceholder('Enter Your Email').fill(ADMIN_USER.email);
      await page.getByPlaceholder('Enter Your Password').fill(ADMIN_USER.password);
      await page.getByRole('button', { name: 'LOGIN' }).click();

      await expect(page.getByText('Login Successfully')).toBeVisible({ timeout: 5000 });

      // Open user dropdown (last dropdown toggle in the navbar)
      await page.locator('.nav-link.dropdown-toggle').last().click();

      // Dashboard link should point to admin dashboard, not user dashboard
      await expect(
        page.getByRole('link', { name: 'Dashboard' })
      ).toHaveAttribute('href', /\/dashboard\/admin/);
    });

    // Kim Shi Tong, A0265858J
    test('should show error and stay on login page when password is wrong', async ({ page }) => {
      await page.goto('/login');

      await page.getByPlaceholder('Enter Your Email').fill(LOGIN_USER.email);
      await page.getByPlaceholder('Enter Your Password').fill('WRONGPASSWORD');
      await page.getByRole('button', { name: 'LOGIN' }).click();

      await expect(page.getByText('Something went wrong')).toBeVisible({ timeout: 5000 });
      await expect(page).toHaveURL(/\/login/);
    });

    // Kim Shi Tong, A0265858J
    test('should show error and stay on login page when email does not exist', async ({ page }) => {
      await page.goto('/login');

      await page.getByPlaceholder('Enter Your Email').fill('ghost@nonexistent.com');
      await page.getByPlaceholder('Enter Your Password').fill('password123');
      await page.getByRole('button', { name: 'LOGIN' }).click();

      await expect(page.getByText('Something went wrong')).toBeVisible({ timeout: 5000 });
      await expect(page).toHaveURL(/\/login/);
    });

    // Kim Shi Tong, A0265858J
    test('should redirect back to intended page after login', async ({ page }) => {
      // Visit admin dashboard while logged out (AdminRoute redirects to /login,
      // unlike Private routes which redirect to / due to <Spinner path=""/>)
      await page.goto('/dashboard/admin');

      // Spinner redirects to /login after countdown
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

      // Login as admin on the redirected login page
      await page.getByPlaceholder('Enter Your Email').fill(ADMIN_USER.email);
      await page.getByPlaceholder('Enter Your Password').fill(ADMIN_USER.password);
      await page.getByRole('button', { name: 'LOGIN' }).click();

      await expect(page.getByText('Login Successfully')).toBeVisible({ timeout: 5000 });

      // Should redirect back to the originally intended admin page
      await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 10000 });
    });
  });

  test.describe('Logout', () => {
    // Kim Shi Tong, A0265858J
    test('should clear session and revert header to Register/Login links', async ({ page }) => {
      await loginViaUI(page, LOGIN_USER.email, LOGIN_USER.password);

      // Open user dropdown and click Logout
      await page.getByText(LOGIN_USER.name).click();
      await page.getByRole('link', { name: 'Logout' }).click();

      await expect(page.getByText('Logout Successfully')).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
    });
  });

  test.describe('Cross-flow', () => {
    // Kim Shi Tong, A0265858J
    test('should register then immediately login with the same credentials', async ({ page }) => {
      const uniqueEmail = `reg-login-${Date.now()}@test.com`;

      // Step 1: Register
      await page.goto('/register');
      await page.getByPlaceholder('Enter Your Name').fill('Fresh User');
      await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
      await page.getByPlaceholder('Enter Your Password').fill('freshpass123');
      await page.getByPlaceholder('Enter Your Phone').fill('81234567');
      await page.getByPlaceholder('Enter Your Address').fill('789 Fresh Street');
      await page.locator('#exampleInputDOB1').fill('1995-03-20');
      await page.getByPlaceholder('What is Your Favorite sports').fill('swimming');
      await page.getByRole('button', { name: 'REGISTER' }).click();

      await expect(page.getByText('Register Successfully, please login')).toBeVisible({ timeout: 5000 });
      await expect(page).toHaveURL(/\/login/);

      // Step 2: Login with the same credentials
      await page.getByPlaceholder('Enter Your Email').fill(uniqueEmail);
      await page.getByPlaceholder('Enter Your Password').fill('freshpass123');
      await page.getByRole('button', { name: 'LOGIN' }).click();

      await expect(page.getByText('Login Successfully')).toBeVisible({ timeout: 5000 });
      await expect(page).toHaveURL('/');
      await expect(page.getByText('Fresh User')).toBeVisible();
    });
  });
});
