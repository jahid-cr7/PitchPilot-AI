import { test, expect } from '@playwright/test';

function testEmail(): string {
  return `e2e-user-${Date.now()}@pitchpilot.test`;
}

test.describe('Auth flow', () => {
  test('register new test user, login, dashboard loads, logout clears session', async ({ page }) => {
    const email = testEmail();
    const password = 'testpass123';
    const name = 'E2E Test User';

    // Register
    await page.goto('/register');
    await page.fill('[data-testid="register-name"]', name);
    await page.fill('[data-testid="register-email"]', email);
    await page.fill('[data-testid="register-password"]', password);
    await page.fill('#confirm', password);
    await page.getByRole('button', { name: 'Create account' }).click();

    // Should redirect to dashboard after register
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1:text-is("Analytics Dashboard")')).toBeVisible();

    // Logout
    await page.locator('[data-testid="logout-button"]').click();

    // Wait for redirect to home and guest state
    await page.waitForURL('/');
    await expect(page.locator('text=Login')).toBeVisible();

    // Login
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', email);
    await page.fill('[data-testid="login-password"]', password);
    await page.locator('button:has-text("Sign in")').click();

    // Dashboard loads after login
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1:text-is("Analytics Dashboard")')).toBeVisible();

    // Logout clears session
    await page.locator('[data-testid="logout-button"]').click();
    await page.waitForURL('/');
    await expect(page.locator('text=Login')).toBeVisible();

    // Verify protected page redirects again
    await page.goto('/dashboard');
    await page.waitForURL('/login');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });
});
