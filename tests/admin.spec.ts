import { test, expect } from '@playwright/test';
import { TEST_IMAGE_BUFFER } from './fixtures/test-image';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';
const IS_CI = !!process.env.CI;

// --- Helpers ---
async function uploadImage(page: any): Promise<string> {
  await page.click('#upload-zone');
  await expect(page.locator('#upload-modal')).not.toHaveClass(/hidden/);

  await page.locator('#upload-file-input').setInputFiles({
    name: 'test.jpg',
    mimeType: 'image/jpeg',
    buffer: TEST_IMAGE_BUFFER,
  });

  await page.waitForSelector('.cropper-container', { timeout: 5000 });
  await page.fill('#upload-alt', 'Image de test Playwright');
  await page.fill('#upload-description', 'Description de test ajoutée par Playwright.');
  await page.click('#upload-btn');

  const addedId = await page.evaluate(() => {
    const store = JSON.parse(localStorage.getItem('creaticlo_pending') || '{}');
    return store.added?.[0]?.id ?? '';
  });
  expect(addedId).not.toBe('');
  return addedId;
}

async function reconnect(page: any) {
  await page.waitForURL(`${BASE_URL}/admin`, { timeout: 15000 });
  await page.waitForSelector('#password-input', { timeout: 15000 })
  await page.fill('#password-input', process.env.ADMIN_PASSWORD || '');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(`${BASE_URL}/admin/dashboard`);
}

async function publish(page: any, waitForId?: { id: string; shouldExist: boolean }) {
  await page.click('#publish-btn');
  await expect(page.locator('#publish-modal')).not.toHaveClass(/hidden/);
  await expect(page.locator('#publish-list')).not.toBeEmpty();
  await page.click('#publish-now-btn');
  await expect(page.locator('#success-modal')).not.toHaveClass(/hidden/, { timeout: 30000 });
  await page.click('#ok-btn');
  await expect(page).toHaveURL(`${BASE_URL}/admin`);

  // Attend que Netlify ait fini de déployer
  if (waitForId) {
    await reconnect(page);
    if (waitForId.shouldExist) {
      await expect(page.locator(`[data-id="${waitForId.id}"]`))
        .toBeAttached({ timeout: 60000 });
    } else {
      await expect(page.locator(`[data-id="${waitForId.id}"]`))
        .not.toBeAttached({ timeout: 60000 });
    }
  } else {
    await reconnect(page);
  }
}

// --- Dashboard ---
test('le dashboard affiche les images', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await expect(page.locator('.edit-btn').first()).toBeVisible();
});

test("la modale edit s'ouvre au clic sur le crayon", async ({ page }) => {
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

test("la modale upload s'ouvre au clic sur +", async ({ page }) => {
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

test('le bouton publier est grisé sans modifications', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await expect(page.locator('#publish-btn')).toBeDisabled();
});

// --- Test 1 : ajout + modif + suppression de la même image → zéro trace, zéro publication ---
test('ajout + modif + suppression sans publication = zéro trace', async ({ page }) => {
  test.skip(!IS_CI, 'Test CRUD uniquement en CI');

  await page.goto(`${BASE_URL}/admin/dashboard`);

  // Ajout
  const addedId = await uploadImage(page);
  await expect(page.locator('#publish-badge')).toHaveText('1');

  // Modification de l'image ajoutée
  await page.click(`[data-id="${addedId}"] .edit-btn`);
  await expect(page.locator('#edit-modal')).not.toHaveClass(/hidden/);
  await page.fill('#edit-alt', 'Alt modifié par Playwright');
  await page.fill('#edit-description', 'Description modifiée par Playwright.');
  await page.click('#save-btn');

  // Badge toujours à 1 (modif d'une image "added" ne crée pas d'entrée "updated")
  await expect(page.locator('#publish-badge')).toHaveText('1');

  // Suppression de l'image ajoutée
  page.on('dialog', dialog => dialog.accept());
  await page.click(`[data-id="${addedId}"] .delete-btn`);

  // Badge revient à 0, bouton grisé
  await expect(page.locator('#publish-btn')).toBeDisabled();

  // Store vide
  const store = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('creaticlo_pending') || '{}');
  });
  expect(store.added?.length ?? 0).toBe(0);
  expect(store.updated?.length ?? 0).toBe(0);
  expect(store.deleted?.length ?? 0).toBe(0);
});

// --- Test 2 : ajout → publish, modif → publish, suppression → publish = zéro trace ---
test('ajout + publish, modif + publish, suppression + publish = zéro trace', async ({ page }) => {
  test.skip(!IS_CI, 'Test CRUD uniquement en CI');

  await page.goto(`${BASE_URL}/admin/dashboard`);

  // 1. Ajout → Publication → attend que l'image apparaisse sur le site
  const addedId = await uploadImage(page);
  await expect(page.locator('#publish-badge')).toHaveText('1');
  await publish(page, { id: addedId, shouldExist: true });

  // 2. Modification de l'image publiée → Publication → attend que la modif soit visible
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await page.click(`[data-id="${addedId}"] .edit-btn`);
  await expect(page.locator('#edit-modal')).not.toHaveClass(/hidden/);
  await page.fill('#edit-alt', 'Alt modifié par Playwright');
  await page.fill('#edit-description', 'Description modifiée par Playwright.');
  await page.click('#save-btn');
  await expect(page.locator('#publish-badge')).toHaveText('1');
  await publish(page, { id: addedId, shouldExist: true });

  // 3. Suppression de l'image modifiée → Publication → attend que l'image disparaisse
  await page.goto(`${BASE_URL}/admin/dashboard`);
  page.on('dialog', dialog => dialog.accept());
  await page.click(`[data-id="${addedId}"] .delete-btn`);
  await expect(page.locator('#publish-badge')).toHaveText('1');
  await publish(page, { id: addedId, shouldExist: false });

  // Vérifie que l'image n'existe plus sur le dashboard
  await expect(page.locator(`[data-id="${addedId}"]`)).not.toBeAttached();
});

// --- Déconnexion ---
test('déconnexion redirige vers login', async ({ page }) => {
  await page.goto(`${BASE_URL}/admin/dashboard`);
  await page.click('#logout-btn');
  await expect(page).toHaveURL(`${BASE_URL}/admin`);
});