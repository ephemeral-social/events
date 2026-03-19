import { test, expect } from '../fixtures/event.fixture';
import { SEL } from '../helpers/selectors';
import { DEV_CODE } from '../fixtures/test-data';
import { clearRateLimits } from '../fixtures/backend-api';

test.describe('Guest RSVP Journey', () => {
  test('complete guest RSVP flow: view → auth → RSVP → persist', async ({ page, seededEvent }) => {
    clearRateLimits();

    // 1. Navigate to event page
    await page.goto(`/e/${seededEvent.slug}`);
    await expect(page.locator('h1, h2').first()).toContainText(seededEvent.title);

    // 2. Click RSVP CTA
    await page.locator(SEL.CTA_RSVP).click();

    // 3. Auth modal appears
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible();

    // 4. Enter phone
    await page.locator(SEL.PHONE_INPUT).fill('5550990700');
    await page.locator(SEL.PHONE_SUBMIT).click();

    // 5. Enter code
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator(SEL.CODE_INPUT).fill(DEV_CODE);
    await page.locator(SEL.CODE_SUBMIT).click();

    // 6. Modal closes
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeHidden({ timeout: 10_000 });

    // 7. RSVP form appears (via invalidateAll)
    await expect(page.locator(SEL.RSVP_GOING)).toBeVisible({ timeout: 10_000 });

    // 8. Fill name and submit
    await page.locator(SEL.RSVP_NAME).fill('Journey Guest');
    await page.locator(SEL.RSVP_SUBMIT_GOING).click();

    // 9. Status card appears
    await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Journey Guest')).toBeVisible();

    // 10. Page refresh preserves status
    await page.reload();
    await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible();
    await expect(page.locator('text=Journey Guest')).toBeVisible();
  });
});
