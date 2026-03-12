import { test, expect } from '@playwright/test';
import { TEST_IMAGE_BUFFER } from './fixtures/test-image';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const IS_CI = !!process.env.CI;

let createdImageId: string = '';

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

// --- CRUD ---
test('ajout d\'une image avec alt et description', async ({ page }) => {
  test.skip(!IS_CI, 'Test CRUD uniquement en CI');

  await page.goto(`${BASE_URL}/admin/dashboard`);

  await page.click('#upload-zone');

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
  await expect(page.locator('#upload-status')).toContainText('✓', { timeout: 10000 });

  // Récupère l'id de l'image créée depuis l'API
  const response = await page.request.get(`${BASE_URL}/api/admin/last-image`);
  const data = await response.json();
  createdImageId = data.id;
});

test('modification de l\'image créée par le test', async ({ page }) => {
  test.skip(!IS_CI, 'Test CRUD uniquement en CI');
  test.skip(!createdImageId, 'Dépend du test d\'ajout');

  // On teste l'API directement, pas le dashboard
  const response = await page.request.put(`${BASE_URL}/api/admin/update`, {
    data: {
      id: createdImageId,
      alt: 'Alt modifié par Playwright',
      description: 'Description modifiée par Playwright.',
      featured: false,
    },
  });

  expect(response.ok()).toBeTruthy();
});

test('suppression de l\'image créée par le test', async ({ page }) => {
  test.skip(!IS_CI, 'Test CRUD uniquement en CI');
  test.skip(!createdImageId, 'Dépend du test d\'ajout');

  const response = await page.request.delete(`${BASE_URL}/api/admin/delete`, {
    data: {
      id: createdImageId,
      src: `/images/gallery/gallery-${createdImageId}.jpg`,
    },
  });

  expect(response.ok()).toBeTruthy();
});

test('déconnexion redirige vers login', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await page.click('#logout-btn');
  await expect(page).toHaveURL(`${BASE_URL}/admin`);
});