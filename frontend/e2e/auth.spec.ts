import { test, expect } from '@playwright/test';

test.describe('Auth pages', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1:text-is("PitchPilot AI")').first()).toBeVisible();
    await expect(page.locator('text=Start Practice')).toBeVisible();
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.locator('[data-testid="register-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="register-password"]')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-password"]')).toBeVisible();
  });

  test('protected dashboard redirects to login when logged out', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/login');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });
});
