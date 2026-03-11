import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD!;

// Helper pour se connecter
async function login(page: any) {
  await page.goto(`${BASE_URL}/admin`);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('#login-btn');
  await page.waitForURL(`${BASE_URL}/admin/dashboard`);
}

// --- Login ---
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
  await login(page);
  await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
});

// --- Dashboard ---
test('le dashboard affiche les images', async ({ page }) => {
  await login(page);
  await expect(page.locator('.edit-btn').first()).toBeVisible();
});

test('la modale edit s\'ouvre au clic sur le crayon', async ({ page }) => {
  await login(page);
  await page.click('.edit-btn');
  await expect(page.locator('#edit-modal')).not.toHaveClass(/hidden/);
});

test('la modale edit se ferme avec la croix', async ({ page }) => {
  await login(page);
  await page.click('.edit-btn');
  await page.click('#close-edit');
  await expect(page.locator('#edit-modal')).toHaveClass(/hidden/);
});

test('la modale upload s\'ouvre au clic sur +', async ({ page }) => {
  await login(page);
  await page.click('#upload-zone');
  await expect(page.locator('#upload-modal')).not.toHaveClass(/hidden/);
});

test('la modale upload se ferme avec la croix', async ({ page }) => {
  await login(page);
  await page.click('#upload-zone');
  await page.click('#close-upload');
  await expect(page.locator('#upload-modal')).toHaveClass(/hidden/);
});

// --- CRUD ---
test('ajout d\'une image avec alt et description', async ({ page }) => {
  await login(page);

  // Ouvre modale upload
  await page.click('#upload-zone');

  // Upload une image de test
  const fileInput = page.locator('#upload-file-input');
  await fileInput.setInputFiles({
    name: 'test.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('fake-image-content'),
  });

  // Remplit les champs
  await page.fill('#upload-alt', 'Image de test Playwright');
  await page.fill('#upload-description', 'Description de test ajoutée par Playwright.');

  // Soumet
  await page.click('#upload-btn');
  await expect(page.locator('#upload-status')).toContainText('✓');
});

test('modification d\'une image', async ({ page }) => {
  await login(page);

  await page.click('.edit-btn');
  await page.fill('#edit-alt', 'Alt modifié par Playwright');
  await page.fill('#edit-description', 'Description modifiée par Playwright.');
  await page.click('#save-btn');
  await expect(page.locator('#edit-status')).toContainText('✓');
});

test('suppression d\'une image avec confirmation', async ({ page }) => {
  await login(page);

  // Accepte la boîte de confirmation
  page.on('dialog', dialog => dialog.accept());
  await page.click('.delete-btn');

  // Vérifie que la page se recharge sans erreur
  await page.waitForURL(`${BASE_URL}/admin/dashboard`);
  await expect(page.locator('#gallery-grid')).toBeVisible();
});

test('déconnexion redirige vers login', async ({ page }) => {
  await login(page);
  await page.click('#logout-btn');
  await expect(page).toHaveURL(`${BASE_URL}/admin`);
});