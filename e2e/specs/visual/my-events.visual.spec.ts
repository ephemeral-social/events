import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend, rsvpViaBackend } from '../../fixtures/backend-api';

test.describe('My Events Visual', () => {
  test('hosting tab with events', async ({ page, authenticateAs }) => {
    const host = await authenticateViaBackend('+15550990610');
    await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Visual Event 1'),
      slug: uniqueSlug('my-eventsv-1'),
      start_time: futureDate()
    });
    await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Visual Event 2'),
      slug: uniqueSlug('my-eventsv-2'),
      start_time: futureDate(14)
    });
    await authenticateAs('+15550990610');
    await page.goto('/my-events');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000); // Wait for events to load
    await expect(page).toHaveScreenshot('my-events-hosting.png', {
      mask: [page.locator('time, [data-testid="timestamp"]')],
      fullPage: true
    });
  });

  test('attending tab with events', async ({ page, authenticateAs }) => {
    const host = await authenticateViaBackend('+15550990611');
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Visual Attending'),
      slug: uniqueSlug('my-eventsv-3'),
      start_time: futureDate()
    });
    const guest = await authenticateViaBackend('+15550990612');
    await rsvpViaBackend(guest.accessToken, event.event_id, {
      status: 'going',
      display_name: 'Visual Attendee'
    });
    await authenticateAs('+15550990612');
    await page.goto('/my-events');
    await page.locator(SEL.MY_EVENTS_ATTENDING).click();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('my-events-attending.png', {
      mask: [page.locator('time, [data-testid="timestamp"]')],
      fullPage: true
    });
  });

  test('hosting empty state', async ({ page, authenticateAs }) => {
    await authenticateAs('+15550990613');
    await page.goto('/my-events');
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('my-events-empty-hosting.png', { fullPage: true });
  });

  test('attending empty state', async ({ page, authenticateAs }) => {
    await authenticateAs('+15550990614');
    await page.goto('/my-events');
    await page.locator(SEL.MY_EVENTS_ATTENDING).click();
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('my-events-empty-attending.png', { fullPage: true });
  });
});
