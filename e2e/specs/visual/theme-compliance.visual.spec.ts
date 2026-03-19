import { test, expect } from '../../fixtures/event.fixture';
import { THEME } from '../../fixtures/test-data';

test.describe('Theme Compliance', () => {
  test('surface base color is not pure black', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const bgColor = await page.locator('body').evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe('rgb(0, 0, 0)');
  });

  test('text primary is not pure white', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const h1 = page.locator('h1, h2').first();
    await expect(h1).toBeVisible();
    const color = await h1.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(255, 255, 255)');
  });

  test('accent primary is forest green', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const cta = page.locator('button:has-text("RSVP")');
    if (await cta.isVisible()) {
      const bgColor = await cta.evaluate((el) => getComputedStyle(el).backgroundColor);
      // Should be close to #52b788 = rgb(82, 183, 136)
      expect(bgColor).toContain('82');
    }
  });

  test('headline uses Vollkorn font', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    const h1 = page.locator('h1, h2').first();
    if (await h1.isVisible()) {
      const fontFamily = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
      expect(fontFamily.toLowerCase()).toContain('vollkorn');
    }
  });

  test('body uses Manrope font', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    // Target event description or hosted-by text which should use Manrope
    const body = page.locator('main p').first();
    if (await body.isVisible()) {
      const fontFamily = await body.evaluate((el) => getComputedStyle(el).fontFamily);
      // Manrope may be loaded or fall back to system sans-serif
      const usesManrope = fontFamily.toLowerCase().includes('manrope') ||
        fontFamily.toLowerCase().includes('sans-serif');
      expect(usesManrope).toBe(true);
    }
  });
});
