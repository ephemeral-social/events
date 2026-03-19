import { test, expect } from '../fixtures/auth.fixture';
import { SEL } from '../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend, createCohostInviteViaBackend } from '../fixtures/backend-api';

test.describe('Cohost Collaboration Journey', () => {
  test('seed event → invite → accept → redirect', async ({ page, authenticateAs }) => {
    // 1. Seed event + invite token
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Journey Cohost'),
      slug: uniqueSlug('j-cohost'),
      start_time: futureDate()
    });
    const invite = await createCohostInviteViaBackend(host.accessToken, event.event_id);

    // 2. Authenticate as cohost
    await authenticateAs('+15550990720');

    // 3. Navigate to cohost invite page
    await page.goto(`/e/${event.slug}/cohost/${invite.invite_token}`);

    // 4. See invite page
    await expect(page.locator('h1:has-text("Co-host Invite")')).toBeVisible();
    await expect(page.locator('text=invited to co-host')).toBeVisible();

    // 5. Accept
    await page.locator(SEL.COHOST_ACCEPT).click();

    // 6. Success
    await expect(page.locator(SEL.COHOST_SUCCESS)).toBeVisible({ timeout: 10_000 });

    // 7. Redirect to event page
    await expect(page).toHaveURL(`/e/${event.slug}`, { timeout: 5_000 });
  });
});
