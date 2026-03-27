import { test, expect } from '@playwright/test';

test.describe('Onboarding flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start unauthenticated
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('unauthenticated user is redirected to onboarding', async ({ page }) => {
    await page.goto('/app/feed');

    // Should redirect to /onboarding
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.getByRole('button', { name: /find my representatives/i })).toBeVisible();
  });

  test('completing onboarding navigates to feed', async ({ page }) => {
    await page.goto('/onboarding');

    // Fill address and submit
    await page.getByLabel(/home address/i).fill('123 Main St, Atlanta, GA 30315');
    await page.getByRole('button', { name: /find my representatives/i }).click();

    // Should navigate to feed after district resolution
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 5000 });
  });

  test('onboarding state persists across page reload', async ({ page }) => {
    await page.goto('/onboarding');

    // Complete onboarding
    await page.getByLabel(/home address/i).fill('123 Main St, Atlanta, GA 30315');
    await page.getByRole('button', { name: /find my representatives/i }).click();
    await expect(page).toHaveURL(/\/app\/feed/, { timeout: 5000 });

    // Reload — should stay on feed, not redirect to onboarding
    await page.reload();
    await expect(page).toHaveURL(/\/app\/feed/);
    await expect(page.getByRole('button', { name: /find my representatives/i })).not.toBeVisible();
  });
});
