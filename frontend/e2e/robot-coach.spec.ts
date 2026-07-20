import { test, expect } from '@playwright/test';

function testEmail(): string {
  return `e2e-user-${Date.now()}@pitchpilot.test`;
}

async function registerAndLogin(page: any, email: string, password: string, name: string) {
  await page.goto('/register');
  await page.fill('[data-testid="register-name"]', name);
  await page.fill('[data-testid="register-email"]', email);
  await page.fill('[data-testid="register-password"]', password);
  await page.fill('#confirm', password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('/dashboard');
}

test.describe('Robot Coach', () => {
  test('protected /robot-coach redirects to login when logged out', async ({ page }) => {
    await page.goto('/robot-coach');
    await page.waitForURL('/login');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('logged-in user sees friendly empty state without session context', async ({ page }) => {
    const email = testEmail();
    await registerAndLogin(page, email, 'testpass123', 'E2E Robot');

    await page.goto('/robot-coach');
    await expect(page.locator('h1:text-is("Robot Coach")')).toBeVisible();
    await expect(page.locator('text=Run a practice session first')).toBeVisible();
    await expect(page.locator('text=Start Practice')).toBeVisible();
  });
});
