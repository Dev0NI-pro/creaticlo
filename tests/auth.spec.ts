import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

test('la page login s\'affiche', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin`);
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await expect(page.locator('#login-btn')).toBeVisible();
});

test('redirection vers login si non authentifié', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await expect(page).toHaveURL(`${BASE_URL}/admin`);
});

test('mot de passe incorrect affiche une erreur', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin`);
  await page.fill('input[name="password"]', 'mauvais_mot_de_passe');
  await page.click('#login-btn');
  await expect(page.locator('#login-error')).toBeVisible();
});

test('mot de passe correct redirige vers dashboard', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin`);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('#login-btn');
  await page.waitForURL(`${BASE_URL}/admin/dashboard`);
  await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
});