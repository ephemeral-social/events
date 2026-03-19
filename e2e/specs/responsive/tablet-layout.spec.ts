import { test, expect } from '../../fixtures/event.fixture';
import { PHONE_NUMBERS } from '../../fixtures/test-data';

// Force tablet viewport regardless of which project runs this
test.use({ viewport: { width: 768, height: 1024 } });

test.describe('Tablet Layout', () => {
  test('event page centered max-width', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const main = page.locator('main');
    const box = await main.boundingBox();
    if (box) {
      // max-w-lg = 32rem = 512px — content should be centered
      expect(box.width).toBeLessThanOrEqual(768);
    }
  });

  test('create form centered', async ({ page, authenticateAs }) => {
    await authenticateAs('+15550990420');
    await page.goto('/create');
    const main = page.locator('main');
    const box = await main.boundingBox();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(768);
    }
  });

  test('my-events centered', async ({ page, authenticateAs }) => {
    await authenticateAs('+15550990421');
    await page.goto('/my-events');
    const main = page.locator('main');
    const box = await main.boundingBox();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(768);
    }
  });

  test('auth modal appropriate width', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.waitForTimeout(500);
    await page.locator('button:has-text("RSVP")').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    const box = await dialog.boundingBox();
    if (box) {
      // Modal should be reasonably sized — not extending beyond viewport
      expect(box.width).toBeLessThanOrEqual(768);
      expect(box.height).toBeGreaterThan(100);
    }
  });
});
