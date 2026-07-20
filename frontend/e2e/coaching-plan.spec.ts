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

test.describe('Coaching plan', () => {
  test('logged-in user can open /coaching-plan', async ({ page }) => {
    const email = testEmail();
    await registerAndLogin(page, email, 'testpass123', 'E2E Coach');

    await page.goto('/coaching-plan');
    await expect(page.locator('text=Coaching Plan')).toBeVisible();
  });

  test('coaching plan page shows empty/default state or plan', async ({ page }) => {
    const email = testEmail();
    await registerAndLogin(page, email, 'testpass123', 'E2E Coach');

    await page.goto('/coaching-plan');
    await expect(page.locator('text=Coaching Plan')).toBeVisible();

    // New user without sessions should see empty state or goals section
    const emptyState = page.locator('text=No coaching data yet');
    const goalsHeader = page.locator('text=Your Goals');
    await expect(emptyState.or(goalsHeader)).toBeVisible();
  });

  test('create goal', async ({ page }) => {
    const email = testEmail();
    await registerAndLogin(page, email, 'testpass123', 'E2E Goal');

    await page.goto('/coaching-plan');
    await page.locator('button:has-text("New Goal")').click();

    await page.fill('[data-testid="coaching-goal-title"]', 'Improve clarity');
    await page.fill('[data-testid="coaching-goal-metric"]', 'Clarity Score');
    await page.fill('[data-testid="coaching-goal-target"]', '100');
    await page.locator('[data-testid="coaching-goal-save"]').click();

    await expect(page.locator('text=Improve clarity')).toBeVisible();
    await expect(page.locator('text=Clarity Score')).toBeVisible();
  });

  test('complete goal', async ({ page }) => {
    const email = testEmail();
    await registerAndLogin(page, email, 'testpass123', 'E2E Complete');

    await page.goto('/coaching-plan');
    await page.locator('button:has-text("New Goal")').click();
    await page.fill('[data-testid="coaching-goal-title"]', 'Complete me');
    await page.fill('[data-testid="coaching-goal-metric"]', 'Score');
    await page.fill('[data-testid="coaching-goal-target"]', '50');
    await page.locator('[data-testid="coaching-goal-save"]').click();

    await expect(page.locator('text=Complete me')).toBeVisible();

    // Click the complete icon (CheckCircle2) for the goal
    await page.locator('button[title="Mark complete"]').first().click();
    await expect(page.locator('span:text-is("Completed")').first()).toBeVisible();
  });

  test('delete goal', async ({ page }) => {
    const email = testEmail();
    await registerAndLogin(page, email, 'testpass123', 'E2E Delete');

    await page.goto('/coaching-plan');
    await page.locator('button:has-text("New Goal")').click();
    await page.fill('[data-testid="coaching-goal-title"]', 'Delete me');
    await page.fill('[data-testid="coaching-goal-metric"]', 'Score');
    await page.fill('[data-testid="coaching-goal-target"]', '50');
    await page.locator('[data-testid="coaching-goal-save"]').click();

    await expect(page.locator('text=Delete me')).toBeVisible();

    // Click the delete icon (Trash2) for the goal
    await page.locator('button[title="Delete goal"]').first().click();
    await expect(page.locator('text=Delete me')).not.toBeVisible();
  });
});
