import { test as setup } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

setup('authenticate', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin`);
  await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD!);
  await page.click('#login-btn');
  await page.waitForURL(`${BASE_URL}/admin/dashboard`);
  await page.context().storageState({ path: 'tests/.auth/admin.json' });
});