import { test as setup } from '@playwright/test';

setup('authenticate as client', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(process.env.E2E_CLIENT_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_CLIENT_PASSWORD!);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/jobs');
  await page.context().storageState({ path: 'e2e/.auth/client-user.json' });
});
