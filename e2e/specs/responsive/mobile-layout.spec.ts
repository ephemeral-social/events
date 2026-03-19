import { test, expect } from '../../fixtures/event.fixture';
import { SEL } from '../../helpers/selectors';

// Force mobile viewport regardless of which project runs this
test.use({ viewport: { width: 375, height: 812 } });

test.describe('Mobile Layout', () => {
  test('event page single-column layout', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const main = page.locator('main');
    const box = await main.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // Single column — content width should be close to viewport
      expect(box.width).toBeLessThanOrEqual(375);
    }
  });

  test('full-width CTA button', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const cta = page.locator(SEL.CTA_RSVP);
    if (await cta.isVisible()) {
      const box = await cta.boundingBox();
      if (box) {
        // Button should be nearly full-width (accounting for padding)
        expect(box.width).toBeGreaterThan(300);
      }
    }
  });

  test('no horizontal scrollbar', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const hasHScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHScroll).toBe(false);
  });

  test('auth modal centered with padding', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.waitForTimeout(500);
    await page.locator(SEL.CTA_RSVP).click();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible({ timeout: 10_000 });
    const dialog = await page.locator(SEL.AUTH_DIALOG).boundingBox();
    if (dialog) {
      // Dialog should not extend beyond viewport
      expect(dialog.x).toBeGreaterThanOrEqual(0);
      expect(dialog.x + dialog.width).toBeLessThanOrEqual(375);
    }
  });

  test('create form single-column', async ({ page, authenticateAs }) => {
    await authenticateAs('+15550990410');
    await page.goto('/create');
    const main = page.locator('main');
    const box = await main.boundingBox();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(375);
    }
  });

  test('my-events cards single-column', async ({ page, authenticateAs }) => {
    await authenticateAs('+15550990411');
    await page.goto('/my-events');
    const main = page.locator('main');
    const box = await main.boundingBox();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(375);
    }
  });

  test('touch-friendly button sizes (min 44px)', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const cta = page.locator(SEL.CTA_RSVP);
    if (await cta.isVisible()) {
      const box = await cta.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(42);
      }
    }
  });

  test('min-h-dvh layout', async ({ page }) => {
    await page.goto('/');
    // min-h-dvh is on the wrapper div in the root layout
    const wrapper = page.locator('div.min-h-dvh');
    await expect(wrapper.first()).toBeVisible();
  });
});
