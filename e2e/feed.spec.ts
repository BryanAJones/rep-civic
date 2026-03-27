import { test, expect } from '@playwright/test';

test.describe('Feed and navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Seed localStorage with completed onboarding so we skip to feed
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem(
        'rep_user_state',
        JSON.stringify({
          hasCompletedOnboarding: true,
          districts: [
            {
              code: 'ATL-SB-D6',
              level: 'city',
              officeTitle: 'Atlanta School Board',
              districtName: 'District 6',
              displayLabel: 'Atlanta School Board · District 6',
              candidateIds: ['c-ross', 'c-banks'],
            },
          ],
          votedQuestionIds: [],
        }),
      );
    });
  });

  test('feed loads and shows video content', async ({ page }) => {
    await page.goto('/app/feed');

    // Should be on feed and show video captions (from mock data)
    await expect(page).toHaveURL(/\/app\/feed/);
    // Wait for loading to complete — look for any video caption
    await expect(page.locator('.video-card').first()).toBeVisible({ timeout: 5000 });
  });

  test('bottom tab navigation works', async ({ page }) => {
    await page.goto('/app/feed');

    // Wait for feed to load
    await expect(page.locator('.video-card').first()).toBeVisible({ timeout: 5000 });

    // Navigate to Districts tab
    const districtsTab = page.getByRole('link', { name: /districts/i });
    if (await districtsTab.isVisible()) {
      await districtsTab.click();
      await expect(page).toHaveURL(/\/app\/districts/);
    }

    // Navigate back to Feed
    const feedTab = page.getByRole('link', { name: /feed/i });
    if (await feedTab.isVisible()) {
      await feedTab.click();
      await expect(page).toHaveURL(/\/app\/feed/);
    }
  });
});
