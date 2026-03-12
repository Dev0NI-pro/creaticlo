import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('http://localhost:4321/admin');
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD!);
  await page.click('#login-btn');
  await page.waitForURL('http://localhost:4321/admin/dashboard');
  await page.context().storageState({ path: 'tests/.auth/admin.json' });
});