import { test, expect } from '../../fixtures/event.fixture';
import { SEL } from '../../helpers/selectors';
import { DEV_CODE } from '../../fixtures/test-data';
import { clearRateLimits } from '../../fixtures/backend-api';

test.describe('Auth Modal Visual', () => {
  test('phone step', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('auth-modal-phone.png');
  });

  test('code step', async ({ page, seededEvent }) => {
    clearRateLimits();
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990620');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('auth-modal-code.png');
  });

  test('error state', async ({ page, seededEvent }) => {
    clearRateLimits();
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990621');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator(SEL.CODE_INPUT).fill('000000');
    await page.locator(SEL.CODE_SUBMIT).click();
    await page.waitForTimeout(2000);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('auth-modal-error.png');
  });

  test('loading state', async ({ page, seededEvent }) => {
    clearRateLimits();
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990622');
    // Slow down the API to capture loading state
    await page.route('**/api/auth/send-code', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.continue();
    });
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('auth-modal-loading.png');
  });
});
