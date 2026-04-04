import { test, expect } from '@playwright/test';

test.describe('Mobile layout guardrails', () => {
  test('Browse workers and job detail should not overflow on 390x844 viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Navigate to browse workers if route exists
    await page.goto('/browse-workers');
    const browseContainer = await page.locator('body');
    const scrollHeight = await browseContainer.evaluate(node => node.scrollHeight);
    const clientHeight = await browseContainer.evaluate(node => node.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight * 3); // allow scrolling, ensure no insane overflow

    // Job detail view fallback: use a known job id or first job card link
    const jobLink = await page.locator('a[href^="/jobs/"]').first();
    if (await jobLink.count() > 0) {
      await jobLink.click();
      await page.waitForLoadState('networkidle');
      const detailContainer = await page.locator('body');
      const detailScrollHeight = await detailContainer.evaluate(node => node.scrollHeight);
      const detailClientHeight = await detailContainer.evaluate(node => node.clientHeight);
      expect(detailScrollHeight).toBeLessThanOrEqual(detailClientHeight * 4);
      await expect(page.locator('text=Submit bid')).toBeVisible();
    }
  });
});
