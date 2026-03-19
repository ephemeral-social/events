import { test, expect } from '../../fixtures/auth.fixture';
import { PHONE_NUMBERS, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend } from '../../fixtures/backend-api';
import { uniqueEventTitle, futureDate } from '../../fixtures/test-data';

test.describe('Auth Guards', () => {
  test('/create redirects when unauthenticated', async ({ page }) => {
    await page.goto('/create');
    await expect(page).toHaveURL(/\?auth=required/);
  });

  test('/my-events redirects when unauthenticated', async ({ page }) => {
    await page.goto('/my-events');
    await expect(page).toHaveURL(/\?auth=required/);
  });

  test('/e/[slug]/edit redirects when unauthenticated', async ({ page }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle(),
      slug: uniqueSlug('auth-guard-1'),
      start_time: futureDate()
    });
    await page.goto(`/e/${event.slug}/edit`);
    await expect(page).toHaveURL(`/e/${event.slug}`);
  });

  test('/e/[slug]/check-in redirects when unauthenticated', async ({ page }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle(),
      slug: uniqueSlug('auth-guard-2'),
      start_time: futureDate()
    });
    await page.goto(`/e/${event.slug}/check-in`);
    await expect(page).not.toHaveURL(/check-in/);
  });

  test('/e/[slug]/ticket-confirmed redirects when unauthenticated', async ({ page }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle(),
      slug: uniqueSlug('auth-guard-3'),
      start_time: futureDate()
    });
    await page.goto(`/e/${event.slug}/ticket-confirmed`);
    await expect(page).not.toHaveURL(/ticket-confirmed/);
  });

  test('/e/[slug]/cohost/[token] redirects to event page with token', async ({ page }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle(),
      slug: uniqueSlug('auth-guard-4'),
      start_time: futureDate()
    });
    await page.goto(`/e/${event.slug}/cohost/fake-token`);
    await expect(page).toHaveURL(new RegExp(`/e/${event.slug}\\?cohost_token=fake-token`));
  });

  test('/ accessible unauthenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Ephemeral');
  });

  test('/e/[slug] accessible unauthenticated', async ({ page }) => {
    const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
    const event = await createEventViaBackend(host.accessToken, {
      title: uniqueEventTitle('Public Event'),
      slug: uniqueSlug('auth-guard-5'),
      start_time: futureDate()
    });
    await page.goto(`/e/${event.slug}`);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('/create accessible when authenticated', async ({ page, authenticateAs }) => {
    await authenticateAs(PHONE_NUMBERS.HOST);
    await page.goto('/create');
    await expect(page).toHaveURL(/create/);
    await expect(page.locator('#event-title')).toBeVisible();
  });
});
