import { test, expect } from '@playwright/test';
import { TEST_IMAGE_BUFFER } from './fixtures/test-image';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const IS_CI = !!process.env.CI;

// --- Dashboard ---
test('le dashboard affiche les images', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await expect(page.locator('.edit-btn').first()).toBeVisible();
});

test('la modale edit s\'ouvre au clic sur le crayon', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await page.click('.edit-btn');
  await expect(page.locator('#edit-modal')).not.toHaveClass(/hidden/);
});

test('la modale edit se ferme avec la croix', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await page.click('.edit-btn');
  await page.click('#close-edit');
  await expect(page.locator('#edit-modal')).toHaveClass(/hidden/);
});

test('la modale upload s\'ouvre au clic sur +', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await page.click('#upload-zone');
  await expect(page.locator('#upload-modal')).not.toHaveClass(/hidden/);
});

test('la modale upload se ferme avec la croix', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await page.click('#upload-zone');
  await page.click('#close-upload');
  await expect(page.locator('#upload-modal')).toHaveClass(/hidden/);
});

// --- Bouton publier ---
test('le bouton publier est grisé sans modifications', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await expect(page.locator('#publish-btn')).toBeDisabled();
});

// --- CRUD via localStorage + publish ---
test('flux complet : ajout + modification + suppression + publication', async ({ page }) => {
  test.skip(!IS_CI, 'Test CRUD uniquement en CI');

  await page.goto(`${BASE_URL}/admin/dashboard`);

  // 1. Ajout d'une image
  await page.click('#upload-zone');
  await expect(page.locator('#upload-modal')).not.toHaveClass(/hidden/);

  const fileInput = page.locator('#upload-file-input');
  await fileInput.setInputFiles({
    name: 'test.jpg',
    mimeType: 'image/jpeg',
    buffer: TEST_IMAGE_BUFFER,
  });

  await page.waitForSelector('.cropper-container', { timeout: 5000 });
  await page.fill('#upload-alt', 'Image de test Playwright');
  await page.fill('#upload-description', 'Description de test ajoutée par Playwright.');
  await page.click('#upload-btn');

  // Vérifie que la carte apparaît avec contour vert
  await expect(page.locator('[style*="rgb(34, 197, 94)"]').first()).toBeVisible({ timeout: 5000 });

  // Vérifie que le badge publier est à 1
  await expect(page.locator('#publish-badge')).toHaveText('1');

  // 2. Modification d'une image existante
  await page.click('.edit-btn >> nth=0');
  await expect(page.locator('#edit-modal')).not.toHaveClass(/hidden/);
  await page.fill('#edit-alt', 'Alt modifié par Playwright');
  await page.fill('#edit-description', 'Description modifiée par Playwright.');
  await page.click('#save-btn');

  await expect(page.locator('#publish-badge')).toHaveText('2');

  // 3. Suppression d'une image existante
  page.on('dialog', dialog => dialog.accept());
  await page.click('.delete-btn >> nth=0');

  await expect(page.locator('#publish-badge')).toHaveText('3');

  // 4. Ouvre la modale de publication
  await page.click('#publish-btn');
  await expect(page.locator('#publish-modal')).not.toHaveClass(/hidden/);

  // Vérifie que la liste des modifications est visible
  await expect(page.locator('#publish-list')).not.toBeEmpty();

  // 5. Publie
  await page.click('#publish-now-btn');
  await expect(page.locator('#success-modal')).not.toHaveClass(/hidden/, { timeout: 30000 });

  // 6. OK → déconnexion
  await page.click('#ok-btn');
  await expect(page).toHaveURL(`${BASE_URL}/admin`);
});

// --- Déconnexion ---
test('déconnexion redirige vers login', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await page.click('#logout-btn');
  await expect(page).toHaveURL(`${BASE_URL}/admin`);
});