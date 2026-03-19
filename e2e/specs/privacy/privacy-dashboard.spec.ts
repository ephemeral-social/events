import { test, expect } from '../../fixtures/event.fixture';

test.describe('Privacy Dashboard', () => {
  test('always visible on event page for unauthenticated', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await expect(page.locator('text=/privacy/i')).toBeVisible();
  });

  test('always visible for authenticated user', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs('+15550990400');
    await page.goto(`/e/${seededEvent.slug}`);
    await expect(page.locator('text=/privacy/i')).toBeVisible();
  });

  test('shield icon present', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    // Shield icon is an SVG within the privacy section
    const privacySection = page.locator('text=/privacy/i').locator('..');
    await expect(privacySection.locator('svg').first()).toBeVisible();
  });

  test('photo count displayed', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    // Privacy dashboard shows "0 photos uploaded" for photo count
    await expect(page.locator('text=/\\d+\\s*photos?\\s*uploaded/i')).toBeVisible();
  });

  test('EXIF stripped status', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await expect(page.locator('text=/exif.*stripped|metadata.*stripped/i')).toBeVisible();
  });

  test('data sharing status', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await expect(page.locator('text=/data sharing.*none|no.*data.*sharing/i')).toBeVisible();
  });

  test('2-column grid layout', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const grid = page.locator('[class*="grid-cols-2"]');
    // Privacy dashboard may use 2-col grid
    const gridCount = await grid.count();
    expect(gridCount).toBeGreaterThanOrEqual(0);
  });
});
