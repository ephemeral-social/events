import { test, expect } from '../../fixtures/event.fixture';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend, rsvpViaBackend } from '../../fixtures/backend-api';

test.describe('Event Page Visual', () => {
  test('desktop event page', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('event-page-desktop.png', {
      mask: [page.locator('time, [data-testid="timestamp"]')],
      fullPage: true
    });
  });

  test('mobile event page', async ({ page, seededEvent }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('event-page-mobile.png', {
      mask: [page.locator('time, [data-testid="timestamp"]')],
      fullPage: true
    });
  });

  test('event page with RSVP status going', async ({ page, seededEvent, authenticateAs }) => {
    const auth = await authenticateViaBackend('+15550990600');
    await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
      status: 'going',
      display_name: 'Visual Going'
    });
    await authenticateAs('+15550990600');
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('event-page-rsvp-going.png', {
      mask: [page.locator('time, [data-testid="timestamp"]')],
      fullPage: true
    });
  });

  test('event page with RSVP status maybe', async ({ page, seededEvent, authenticateAs }) => {
    const auth = await authenticateViaBackend('+15550990601');
    await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
      status: 'maybe',
      display_name: 'Visual Maybe'
    });
    await authenticateAs('+15550990601');
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('event-page-rsvp-maybe.png', {
      mask: [page.locator('time, [data-testid="timestamp"]')],
      fullPage: true
    });
  });

  test('event page capacity warning', async ({ page }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Visual Capacity'),
      slug: uniqueSlug('event-page-1'),
      start_time: futureDate(),
      max_attendees: 3
    });
    const guest = await authenticateViaBackend('+15550990602');
    await rsvpViaBackend(guest.accessToken, event.event_id, {
      status: 'going',
      display_name: 'Filler'
    });
    await page.goto(`/e/${event.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('event-page-capacity.png', {
      mask: [page.locator('time, [data-testid="timestamp"]')],
      fullPage: true
    });
  });

  test('event page full', async ({ page }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Visual Full'),
      slug: uniqueSlug('event-page-2'),
      start_time: futureDate(),
      max_attendees: 2
    });
    const guest = await authenticateViaBackend('+15550990603');
    await rsvpViaBackend(guest.accessToken, event.event_id, {
      status: 'going',
      display_name: 'Full Filler'
    });
    await page.goto(`/e/${event.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('event-page-full.png', {
      mask: [page.locator('time, [data-testid="timestamp"]')],
      fullPage: true
    });
  });

  test('tombstone or not-found page', async ({ page }) => {
    await page.goto('/e/nonexistent-visual-test');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('event-page-not-found.png', { fullPage: true });
  });

  test('event page without cover photo', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('event-page-no-cover.png', {
      mask: [page.locator('time, [data-testid="timestamp"]')],
      fullPage: true
    });
  });
});
