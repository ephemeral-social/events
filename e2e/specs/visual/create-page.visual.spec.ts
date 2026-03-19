import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, futureDateInput, futureTimeInput } from '../../fixtures/test-data';

test.describe('Create Page Visual', () => {
  test.beforeEach(async ({ page, authenticateAs }) => {
    await authenticateAs(PHONE_NUMBERS.HOST);

    // Mock Stripe status as already onboarded for consistent snapshots
    await page.route('**/api/payments/stripe-status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          onboarded: true,
          charges_enabled: true,
          payouts_enabled: true
        })
      });
    });

    await page.goto('/create');
    await page.evaluate(() => document.fonts.ready);
  });

  test('empty create form', async ({ page }) => {
    await expect(page).toHaveScreenshot('create-form-empty.png', { fullPage: true });
  });

  test('create form with slug preview', async ({ page }) => {
    await page.locator(SEL.CREATE_TITLE).fill('Summer BBQ Party');
    await expect(page).toHaveScreenshot('create-form-slug-preview.png', { fullPage: true });
  });

  test('ticketed form', async ({ page }) => {
    await page.locator(SEL.CREATE_TYPE_TICKETED).click();
    await expect(page).toHaveScreenshot('create-form-ticketed.png', { fullPage: true });
  });

  test('form with validation errors', async ({ page }) => {
    await page.locator(SEL.CREATE_SUBMIT).click();
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('create-form-validation.png', { fullPage: true });
  });

  test('form filled out', async ({ page }) => {
    await page.locator(SEL.CREATE_TITLE).fill('Visual Test Event');
    await page.locator(SEL.CREATE_START_DATE).fill(futureDateInput());
    await page.locator(SEL.CREATE_START_TIME).fill(futureTimeInput());
    await page.locator(SEL.CREATE_VENUE).fill('Visual Venue');
    await page.locator(SEL.CREATE_DESCRIPTION).fill('A beautiful event description for visual testing.');
    await expect(page).toHaveScreenshot('create-form-filled.png', { fullPage: true });
  });
});
