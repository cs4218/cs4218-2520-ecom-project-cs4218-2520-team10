---
name: UI Test Implementer (E2E)
description: Implement end-to-end Playwright tests following MS3 standards
type: agent-implementer
test_tool: Playwright
test_type: e2e
---

# UI Test Implementer - MS3 Standard (Playwright E2E)

**Implement complete end-to-end user scenarios using Playwright.**

---

## Prerequisites

- [ ] Planning complete (See agent.md output)
- [ ] All E2E scenarios defined
- [ ] Test data prepared
- [ ] Environment URLs documented
- [ ] Selector strategy decided
- [ ] Ready to write code

---

## Playwright Test Structure

### Standard: Navigate → Act → Assert

```javascript
test('should complete user journey', async ({ page }) => {
  // NAVIGATE: Go to application
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('[data-testid="login-form"]');

  // ACT: Perform user actions
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  // ASSERT: Verify outcomes
  await page.waitForNavigation();
  await expect(page).toHaveURL(/\/dashboard/);
  const welcomeText = await page.locator('[data-testid="welcome"]').textContent();
  expect(welcomeText).toContain('Welcome');
});
```

### Test File Organization

```javascript
/**
 * E2E Tests: User Authentication
 * Author: [Your Name], [Your ID]
 * Tests: User registration and login flows
 */

import { test, expect } from '@playwright/test';

test.describe('User Authentication E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('http://localhost:3000');
  });

  test('should register new user', async ({ page }) => {
    // Test implementation
  });

  test('should login with valid credentials', async ({ page }) => {
    // Test implementation
  });

  test('should reject invalid email format', async ({ page }) => {
    // Test implementation
  });
});
```

---

## E2E Patterns & Examples

### Pattern 1: Form Submission & Navigation

**Test:** User fills form, submits, gets redirected

```javascript
test('should register user and redirect to dashboard', async ({ page }) => {
  // NAVIGATE
  await page.goto('http://localhost:3000/register');

  // ACT
  await page.fill('[data-testid="email"]', 'newuser@example.com');
  await page.fill('[data-testid="password"]', 'Password123!');
  await page.fill('[data-testid="confirm-password"]', 'Password123!');
  await page.fill('[data-testid="name"]', 'New User');

  await page.click('[data-testid="register-button"]');

  // ASSERT
  await page.waitForNavigation();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator('[data-testid="welcome"]')).toContainText('New User');
});
```

### Pattern 2: Multi-Step User Journey

**Test:** User completes multiple steps (e.g., browse → add to cart → checkout)

```javascript
test('should complete purchase flow', async ({ page }) => {
  // Step 1: Navigate to products
  await page.goto('http://localhost:3000/products');
  await page.waitForSelector('[data-testid="product-list"]');

  // Step 2: Find and click product
  const productCard = page.locator('[data-testid="product-card"]').first();
  const productName = await productCard.locator('[data-testid="product-name"]').textContent();
  await productCard.click();

  // Step 3: View product details
  await expect(page.locator('[data-testid="product-details"]')).toBeVisible();

  // Step 4: Add to cart
  await page.click('[data-testid="add-to-cart"]');
  await expect(page.locator('[data-testid="toast-success"]')).toContainText('Added to cart');

  // Step 5: Navigate to cart
  await page.click('[data-testid="cart-icon"]');
  await page.waitForURL(/\/cart/);

  // Step 6: Verify item in cart
  await expect(page.locator('[data-testid="cart-item"]')).toContainText(productName);

  // Step 7: Proceed to checkout
  await page.click('[data-testid="checkout-button"]');
  await page.waitForNavigation();

  // Step 8: Verify checkout page
  await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();
});
```

### Pattern 3: Error Handling

**Test:** User makes mistake, system shows error message

```javascript
test('should show error for invalid email', async ({ page }) => {
  // NAVIGATE
  await page.goto('http://localhost:3000/register');

  // ACT: Enter invalid email
  await page.fill('[data-testid="email"]', 'invalid-email');
  await page.fill('[data-testid="password"]', 'Password123!');
  await page.click('[data-testid="register-button"]');

  // ASSERT: Verify error message
  const errorMessage = page.locator('[data-testid="email-error"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('Invalid email format');
});
```

### Pattern 4: User Authentication & Protected Pages

**Test:** Unauthenticated user can't access protected pages

```javascript
test('should redirect unauthenticated user to login', async ({ page }) => {
  // NAVIGATE to protected page (no login)
  await page.goto('http://localhost:3000/dashboard');

  // ASSERT: Redirected to login
  await page.waitForURL(/\/login/);
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
});

test('should allow authenticated user to access dashboard', async ({ page, context }) => {
  // Setup: Store auth token
  await context.addCookies([
    {
      name: 'authToken',
      value: 'valid-token-123',
      url: 'http://localhost:3000'
    }
  ]);

  // NAVIGATE to protected page
  await page.goto('http://localhost:3000/dashboard');

  // ASSERT: Can view dashboard
  await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
});
```

### Pattern 5: Data Filtering & Search

**Test:** User searches/filters data, sees correct results

```javascript
test('should filter products by category', async ({ page }) => {
  // NAVIGATE
  await page.goto('http://localhost:3000/products');

  // ACT: Select filter
  await page.click('[data-testid="category-filter"]');
  await page.click('[data-testid="category-electronics"]');

  // ASSERT: Verify filtered results
  const products = page.locator('[data-testid="product-card"]');
  const count = await products.count();

  expect(count).toBeGreaterThan(0);

  // Verify all products are in selected category
  const firstProduct = products.first();
  await expect(firstProduct.locator('[data-testid="category"]')).toContainText('Electronics');
});
```

### Pattern 6: Dynamic Content & Waiting

**Test:** Wait for content to load, then verify

```javascript
test('should load and display user comments', async ({ page }) => {
  // NAVIGATE
  await page.goto('http://localhost:3000/post/123');

  // ACT: Expand comments section
  await page.click('[data-testid="load-comments"]');

  // ASSERT: Wait for comments to load
  await page.waitForSelector('[data-testid="comment-item"]', { timeout: 5000 });

  const comments = page.locator('[data-testid="comment-item"]');
  const count = await comments.count();
  expect(count).toBeGreaterThan(0);

  // Verify first comment content
  const firstComment = comments.first();
  await expect(firstComment.locator('[data-testid="comment-text"]')).toBeVisible();
  await expect(firstComment.locator('[data-testid="comment-author"]')).toBeVisible();
});
```

---

## Playwright Selectors Best Practices

### Recommended: data-testid (Most Explicit)

```javascript
// HTML
<button data-testid="login-button">Login</button>

// Test
await page.click('[data-testid="login-button"]');
```

### Alternative: Role-Based (Most Semantic)

```javascript
// Test using button role
await page.click('button:has-text("Login")');

// Using getByRole (recommended for accessibility)
await page.getByRole('button', { name: /login/i }).click();
```

### Alternative: Text Content

```javascript
// Find by visible text
await page.click('text=Login');
await page.click('button:has-text("Login")');
```

### Last Resort: CSS Selectors

```javascript
// Avoid brittle selectors
await page.click('.form-group > button.primary'); // Not robust

// Better: use more specific attribute
await page.click('[data-action="login"]'); // Better
```

---

## Wait Strategies in Playwright

### Wait for Navigation

```javascript
// Wait for page navigation
await page.click('[data-testid="login"]');
await page.waitForNavigation();

// Or: Wait for specific URL
await page.click('[data-testid="login"]');
await page.waitForURL(/\/dashboard/);
```

### Wait for Elements

```javascript
// Wait for element to be visible
await page.waitForSelector('[data-testid="success-message"]');

// Or: Using locator
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
```

### Wait for Network

```javascript
// Wait for network to be idle
await page.goto('http://localhost:3000');
await page.waitForLoadState('networkidle');
```

### Wait for Function

```javascript
// Wait for custom condition
await page.waitForFunction(() => {
  return document.querySelectorAll('[data-testid="item"]').length > 0;
});
```

---

## Assertion Examples

### URL Assertions

```javascript
await expect(page).toHaveURL(/\/dashboard/);
await expect(page).toHaveTitle('Dashboard');
```

### Element Visibility

```javascript
await expect(page.locator('[data-testid="message"]')).toBeVisible();
await expect(page.locator('[data-testid="error"]')).not.toBeVisible();
```

### Text Content

```javascript
await expect(page.locator('[data-testid="welcome"]')).toContainText('Welcome, John');
await expect(page.locator('[data-testid="price"]')).toHaveText('$99.99');
```

### Form Values

```javascript
await expect(page.locator('[data-testid="email"]')).toHaveValue('user@example.com');
```

### Count/Existence

```javascript
await expect(page.locator('[data-testid="item"]')).toHaveCount(5);
await expect(page.locator('[data-testid="error"]')).toHaveCount(0);
```

---

## Test Data & Fixtures

### Using Fixtures for Authentication

```javascript
import { test as base } from '@playwright/test';

type TestFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login before test
    await page.goto('http://localhost:3000/login');
    await page.fill('[data-testid="email"]', 'testuser@example.com');
    await page.fill('[data-testid="password"]', 'Password123!');
    await page.click('[data-testid="login-button"]');
    await page.waitForNavigation();

    // Use page in test
    await use(page);

    // Logout after test (cleanup)
    await page.click('[data-testid="logout-button"]');
  },
});

// Use in test
test('should view dashboard', async ({ authenticatedPage: page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

---

## Test File Structure

```javascript
/**
 * E2E Tests: [Feature Name]
 * Author: [Your Name], [Your ID]
 * Tests: [Feature description]
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('[Feature Name] E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Common setup
    await page.goto(`${BASE_URL}/[initial-page]`);
  });

  test.describe('Happy Path', () => {
    test('should complete successful flow', async ({ page }) => {
      // Test implementation
    });
  });

  test.describe('Error Scenarios', () => {
    test('should show error for invalid input', async ({ page }) => {
      // Test implementation
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle special characters', async ({ page }) => {
      // Test implementation
    });
  });
});
```

---

## Playwright Configuration

```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/login.spec.js

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Generate HTML report
npx playwright show-report
```

---

## Best Practices

✅ **DO:**
- Test COMPLETE user flows (navigate → act → assert)
- Use `data-testid` for reliable selectors
- Wait for elements/navigation explicitly
- Assert on visible/observable outcomes
- Include error and edge case scenarios
- Organize tests by feature/user flow
- Use descriptive test names
- Keep tests independent

❌ **DON'T:**
- Just check that elements exist
- Assume instant responses
- Use brittle selectors (CSS nth-child, etc.)
- Test implementation details
- Skip waiting for content
- Forget to clean up (logout, etc.)
- Test multiple scenarios in one test
- Hardcode values (use constants/config)

---

## Debugging Tips

```javascript
// Pause execution and open inspector
await page.pause();

// Take screenshot
await page.screenshot({ path: 'screenshot.png' });

// Log element content
const text = await page.locator('[data-testid="message"]').textContent();
console.log(text);

// Inspect what's happening
await page.evaluate(() => {
  console.log('From browser console:', document.title);
});
```

