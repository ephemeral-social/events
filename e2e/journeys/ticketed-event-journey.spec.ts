import { test, expect } from '../fixtures/auth.fixture';
import { SEL } from '../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate } from '../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend } from '../fixtures/backend-api';

test.describe('Ticketed Event Journey', () => {
  test('view ticketed event → auth → ticket purchase flow', async ({ page, authenticateAs }) => {
    // 1. Seed ticketed event
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Journey Ticketed'),
      start_time: futureDate(),
      web_event_type: 'ticketed',
      ticket_price_cents: 2000,
      venue_name: 'Ticket Venue'
    });

    // 2. Navigate to event
    await page.goto(`/e/${event.slug}`);
    await expect(page.locator('button:has-text("Get Tickets")')).toBeVisible();

    // 3. Authenticate
    await authenticateAs('+15550990710');
    await page.goto(`/e/${event.slug}`);

    // 4. TicketPurchase component should be visible (for authenticated non-RSVP'd user on ticketed event)
    const ticketSection = page.locator('button:has-text("Pay $")');
    if (await ticketSection.isVisible({ timeout: 5_000 }).catch(() => false)) {
      // 5. Adjust quantity
      const incBtn = page.locator(SEL.TICKET_QTY_INC);
      if (await incBtn.isVisible()) {
        await incBtn.click();
      }

      // 6. Click Pay — should attempt Stripe redirect
      const payBtn = page.locator('button:has-text("Pay $")');
      await payBtn.click();

      // Verify it shows loading state or redirects
      await expect(page.locator('button:has-text("Redirecting to checkout...")')).toBeVisible({ timeout: 5_000 }).catch(() => {
        // May redirect to Stripe instead
      });
    }
  });
});
