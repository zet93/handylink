import { test, expect } from '@playwright/test';

test('jobs page loads without error', async ({ page }) => {
  await page.goto('/jobs');
  await expect(page).toHaveURL('/jobs');
  await expect(page.locator('body')).not.toContainText('Something went wrong');
});

test('client can post a new job', async ({ page }) => {
  await page.goto('/post-job');
  await page.getByLabel(/title/i).fill('Fix electrical panel');
  await page.getByLabel(/description/i).fill('Sparks when I flip the switch');
  await page.getByLabel(/category/i).selectOption('Electrical');
  await page.getByLabel(/city/i).fill('Bucharest');
  await page.getByLabel(/country/i).fill('RO');
  await page.getByRole('button', { name: /post job/i }).click();
  await expect(page).toHaveURL(/\/jobs\/.+/, { timeout: 5000 });
});

test('post job shows validation error for short title', async ({ page }) => {
  await page.goto('/post-job');
  await page.getByLabel(/title/i).fill('Hi');
  await page.getByRole('button', { name: /post job/i }).click();
  await expect(page.getByText(/title/i)).toBeVisible();
});
