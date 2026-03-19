import { test, expect } from '../../fixtures/auth.fixture';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend } from '../../fixtures/backend-api';

test.describe('Ticket Flow Visual', () => {
  test('ticketed event page', async ({ page }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Visual Ticketed'),
      slug: uniqueSlug('ticket-flo-1'),
      start_time: futureDate(),
      web_event_type: 'ticketed',
      ticket_price_cents: 2500
    });
    await page.goto(`/e/${event.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('ticket-event-page.png', {
      mask: [page.locator('time')],
      fullPage: true
    });
  });

  test('ticket confirmed page', async ({ page, authenticateAs }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Visual Confirmed'),
      slug: uniqueSlug('ticket-flo-2'),
      start_time: futureDate(),
      web_event_type: 'ticketed',
      ticket_price_cents: 1500
    });
    await authenticateAs(PHONE_NUMBERS.TICKETED_BUYER);
    await page.goto(`/e/${event.slug}/ticket-confirmed`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('ticket-confirmed-page.png', { fullPage: true });
  });

  test('check-in page', async ({ page, authenticateAs }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Visual CheckIn'),
      slug: uniqueSlug('ticket-flo-3'),
      start_time: futureDate()
    });
    await authenticateAs(PHONE_NUMBERS.HOST);
    await page.goto(`/e/${event.slug}/check-in`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('check-in-page.png', { fullPage: true });
  });

  test('ticketed event with TicketPurchase component', async ({ page, authenticateAs }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Visual Purchase'),
      slug: uniqueSlug('ticket-flo-4'),
      start_time: futureDate(),
      web_event_type: 'ticketed',
      ticket_price_cents: 3000
    });
    await authenticateAs('+15550990640');
    await page.goto(`/e/${event.slug}`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot('ticket-purchase-component.png', {
      mask: [page.locator('time')],
      fullPage: true
    });
  });
});
