import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.1 AA accessibility', () => {
  test.beforeEach(async ({ page }) => {
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

  test('onboarding page has no WCAG 2.1 AA violations', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.goto('/onboarding');
    await page.waitForSelector('.onboarding__submit');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('feed page has no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/app/feed');
    await page.locator('.video-card').first().waitFor({ timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
