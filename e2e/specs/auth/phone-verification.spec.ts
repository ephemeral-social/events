import { test, expect } from '../../fixtures/event.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, DEV_CODE } from '../../fixtures/test-data';
import { clearRateLimits } from '../../fixtures/backend-api';

test.describe('Phone Verification', () => {
  test.beforeEach(async () => {
    clearRateLimits();
  });

  test('displays auth modal when unauthenticated RSVP click', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible();
  });

  test('phone input submit enabled at 10+ digits', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('555');
    await expect(page.locator(SEL.PHONE_SUBMIT)).toBeDisabled();
    await page.locator(SEL.PHONE_INPUT).fill('5550990011');
    await expect(page.locator(SEL.PHONE_SUBMIT)).toBeEnabled();
  });

  test('shows Sending loading state then transitions to code step', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990011');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await expect(page.locator('button:has-text("Sending...")')).toBeVisible();
    await expect(page.locator(SEL.CODE_INPUT)).toBeVisible({ timeout: 10_000 });
  });

  test('shows formatted phone on code step', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990011');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await expect(page.locator(SEL.CODE_INPUT)).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Code sent to')).toBeVisible();
  });

  test('shows Verifying loading state then modal closes on success', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990011');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator(SEL.CODE_INPUT).fill(DEV_CODE);
    await page.locator(SEL.CODE_SUBMIT).click();
    await expect(page.locator('button:has-text("Verifying...")')).toBeVisible();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeHidden({ timeout: 10_000 });
  });

  test('page data refreshes after auth - RSVP form appears', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990012');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator(SEL.CODE_INPUT).fill(DEV_CODE);
    await page.locator(SEL.CODE_SUBMIT).click();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeHidden({ timeout: 10_000 });
    // After invalidateAll(), RSVP form should appear (needs more time on mobile)
    await expect(page.locator(SEL.RSVP_GOING)).toBeVisible({ timeout: 15_000 });
  });

  test('shows error for wrong verification code', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990013');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator(SEL.CODE_INPUT).fill('000000');
    await page.locator(SEL.CODE_SUBMIT).click();
    await expect(page.locator('text=/invalid|incorrect|wrong|failed/i')).toBeVisible({ timeout: 10_000 });
  });

  test('Use a different number back navigation', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible();
    await page.locator(SEL.PHONE_INPUT).fill('5550990014');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator(SEL.CODE_BACK).click();
    await expect(page.locator(SEL.PHONE_INPUT)).toBeVisible();
  });

  test('auto-focus phone input on modal open', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible();
    // Wait for requestAnimationFrame focus
    await page.waitForTimeout(100);
    await expect(page.locator(SEL.PHONE_INPUT)).toBeFocused();
  });

  test('auto-focus code input on code step', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990015');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await page.waitForTimeout(100);
    await expect(page.locator(SEL.CODE_INPUT)).toBeFocused();
  });

  test('code input has numeric inputmode', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990016');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await expect(page.locator(SEL.CODE_INPUT)).toHaveAttribute('inputmode', 'numeric');
  });

  test('verify button disabled when code not 6 digits', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990017');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
    await page.locator(SEL.CODE_INPUT).fill('123');
    await expect(page.locator(SEL.CODE_SUBMIT)).toBeDisabled();
    await page.locator(SEL.CODE_INPUT).fill('123456');
    await expect(page.locator(SEL.CODE_SUBMIT)).toBeEnabled();
  });

  test('network error shows user-friendly message', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    // Block auth API to simulate network error
    await page.route('**/api/auth/send-code', (route) => route.abort('connectionrefused'));
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990018');
    await page.locator(SEL.PHONE_SUBMIT).click();
    await expect(page.locator('text=/error|failed|try again/i')).toBeVisible({ timeout: 10_000 });
  });

  test('close modal on Escape key', async ({ page, seededEvent, isMobile }) => {
    test.skip(!!isMobile, 'Escape key not applicable on mobile devices');
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeHidden();
  });

  test('close modal on backdrop click', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible();
    // Click backdrop (role="presentation" overlay)
    await page.locator('[role="presentation"]').click({ position: { x: 10, y: 10 } });
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeHidden();
  });

  test('phone input formatting', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await page.locator(SEL.PHONE_INPUT).fill('5550990019');
    // Verify input contains the number
    await expect(page.locator(SEL.PHONE_INPUT)).toHaveValue(/555/);
  });
});
