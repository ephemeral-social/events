import { test, expect } from '../../fixtures/event.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS } from '../../fixtures/test-data';
import { authenticateViaBackend, rsvpViaBackend } from '../../fixtures/backend-api';

test.describe('RSVP States Visual', () => {
  test('RSVP form with Going selected', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs('+15550990630');
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(SEL.RSVP_GOING)).toBeVisible();
    await expect(page).toHaveScreenshot('rsvp-form-going.png', {
      mask: [page.locator('time')],
      fullPage: true
    });
  });

  test('RSVP form with Maybe selected', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs('+15550990631');
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.RSVP_MAYBE).click();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('rsvp-form-maybe.png', {
      mask: [page.locator('time')],
      fullPage: true
    });
  });

  test('RSVP form with Declined selected', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs('+15550990632');
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.RSVP_DECLINED).click();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('rsvp-form-declined.png', {
      mask: [page.locator('time')],
      fullPage: true
    });
  });

  test('status card Going', async ({ page, seededEvent, authenticateAs }) => {
    const auth = await authenticateViaBackend('+15550990633');
    await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
      status: 'going',
      display_name: 'Visual Status Going',
      plus_ones: 2
    });
    await authenticateAs('+15550990633');
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('rsvp-status-going.png', {
      mask: [page.locator('time')],
      fullPage: true
    });
  });

  test('status card Maybe', async ({ page, seededEvent, authenticateAs }) => {
    const auth = await authenticateViaBackend('+15550990634');
    await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
      status: 'maybe',
      display_name: 'Visual Status Maybe'
    });
    await authenticateAs('+15550990634');
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('rsvp-status-maybe.png', {
      mask: [page.locator('time')],
      fullPage: true
    });
  });

  test('status card Declined', async ({ page, seededEvent, authenticateAs }) => {
    const auth = await authenticateViaBackend('+15550990635');
    await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
      status: 'declined',
      display_name: 'Visual Status Declined'
    });
    await authenticateAs('+15550990635');
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('rsvp-status-declined.png', {
      mask: [page.locator('time')],
      fullPage: true
    });
  });
});
