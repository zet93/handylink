import { test, expect } from '@playwright/test';

// These tests don't use storageState — test auth flows directly
test.use({ storageState: { cookies: [], origins: [] } });

test('unauthenticated user is redirected to /login', async ({ page }) => {
  await page.goto('/jobs');
  await expect(page).toHaveURL(/\/login/);
});

test('login shows error for wrong password', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill('notreal@test.com');
  await page.getByLabel(/password/i).fill('wrongpassword');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 });
});
