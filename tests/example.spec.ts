import { test, expect, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4321';

// --- Page d'accueil ---
test('la page d accueil se charge', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page).toHaveTitle(/Créati'Clo/);
});

test('le header est visible', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('header').first()).toBeVisible();
});

test('le logo est visible', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('header img[alt="Creaticlo"]')).toBeVisible();
});

test('le hero affiche le titre principal', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.getByRole('heading', { name: /Ajustement/, level: 1 })).toBeVisible();
});

test('la section about est visible', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('#about')).toBeVisible();
});

test('la section services est visible', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('#services')).toBeVisible();
});

test('la section gallery est visible', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('#gallery')).toBeVisible();
});

test('la section contact est visible', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('#contact')).toBeVisible();
});

test('le footer est visible', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('footer')).toBeVisible();
});

// --- Modale ---
test('la modale s\'ouvre au clic sur prendre rendez-vous', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.locator('#open-modal').first().click();
  await expect(page.locator('#modal-overlay')).not.toHaveClass(/hidden/);
});

test('la modale se ferme avec la croix', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.locator('#open-modal').first().click();
  await page.locator('#close-modal').click();
  await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);
});

test('la modale se ferme avec Escape', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.locator('#open-modal').first().click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modal-overlay')).toHaveClass(/hidden/);
});

// --- Navigation ---
test('le lien galerie fonctionne', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.locator('a[href="/gallery"]').first().click();
  await expect(page).toHaveURL(/gallery/);
});

// --- Page galerie ---
test('la page galerie se charge', async ({ page }) => {
  await page.goto(`${BASE_URL}/gallery`);
  await expect(page).toHaveTitle(/Galerie/);
});

test('la page galerie affiche des images', async ({ page }) => {
  await page.goto(`${BASE_URL}/gallery`);
  const images = page.locator('.grid img');
  await expect(images.first()).toBeVisible();
});

// --- Formulaire ---
test('le formulaire de contact est present', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('#contact-form').first()).toBeVisible();
});

test('le bouton envoyer est present', async ({ page }) => {
  await page.goto(BASE_URL);
  await expect(page.locator('#submit-btn').first()).toBeVisible();
});

// --- Gallery hover ---
test('le voile apparait au hover sur desktop', async ({ page }) => {
  await page.goto(BASE_URL);
  const card = page.locator('.gallery-card').first();
  const veil = page.locator('.gallery-veil').first();
  await card.hover();
  await expect(veil).not.toHaveCSS('transform', /translateY\(100/);
});

test('le voile apparait au clic sur mobile', async ({ browser, browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox ne supporte pas isMobile');
  const context = await browser.newContext({
    ...devices['iPhone 13'],
  });
  const page = await context.newPage();
  await page.goto(BASE_URL);

  const card = page.locator('.gallery-card').first();
  const veil = page.locator('.gallery-veil').first();

  await card.tap();
  await expect(veil).toHaveCSS('transform', /matrix/);

  await context.close();
});

test('le voile se ferme quand on tape sur une autre carte', async ({ browser, browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox ne supporte pas isMobile');
  const context = await browser.newContext({
    ...devices['iPhone 13'],
  });
  const page = await context.newPage();
  await page.goto(BASE_URL);

  const card1 = page.locator('.gallery-card').nth(0);
  const card2 = page.locator('.gallery-card').nth(1);
  const veil1 = page.locator('.gallery-veil').nth(0);

  await card1.tap();
  await card2.tap();
  await expect(veil1).toHaveCSS('transform', /matrix\(1, 0, 0, 1, 0,/);

  await context.close();
});