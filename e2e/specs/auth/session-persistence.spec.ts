import { test, expect } from '../../fixtures/event.fixture';
import { PHONE_NUMBERS } from '../../fixtures/test-data';

test.describe('Session Persistence', () => {
  test('session persists across page navigations', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs(PHONE_NUMBERS.GUEST_2);
    await page.goto(`/e/${seededEvent.slug}`);
    // Should see RSVP form (authenticated)
    await expect(page.locator('button[aria-pressed]:has-text("Going")')).toBeVisible();
    // Navigate away and back
    await page.goto('/');
    await page.goto(`/e/${seededEvent.slug}`);
    // Still authenticated
    await expect(page.locator('button[aria-pressed]:has-text("Going")')).toBeVisible();
  });

  test('session persists on page refresh', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs(PHONE_NUMBERS.GUEST_2);
    await page.goto(`/e/${seededEvent.slug}`);
    await expect(page.locator('button[aria-pressed]:has-text("Going")')).toBeVisible();
    await page.reload();
    await expect(page.locator('button[aria-pressed]:has-text("Going")')).toBeVisible();
  });

  test('RSVP status shown after re-navigation', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs(PHONE_NUMBERS.GUEST_2);
    await page.goto(`/e/${seededEvent.slug}`);
    // Submit RSVP
    await page.locator('#rsvp-name').fill('Session Test');
    await page.locator("button:has-text(\"I'm Going\")").click();
    await expect(page.locator('button:has-text("Change")')).toBeVisible({ timeout: 10_000 });
    // Navigate away and back
    await page.goto('/');
    await page.goto(`/e/${seededEvent.slug}`);
    // RSVP status persists
    await expect(page.locator('button:has-text("Change")')).toBeVisible();
  });

  test('re-authentication works after clearing cookies', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs(PHONE_NUMBERS.GUEST_2);
    await page.goto(`/e/${seededEvent.slug}`);
    await expect(page.locator('button[aria-pressed]:has-text("Going")')).toBeVisible();
    // Clear cookies
    await page.context().clearCookies();
    await page.reload();
    // Should see CTA button (unauthenticated)
    await expect(page.locator('button:has-text("RSVP")')).toBeVisible();
    // Re-authenticate
    await authenticateAs(PHONE_NUMBERS.GUEST_2);
    await page.reload();
    await expect(page.locator('button[aria-pressed]:has-text("Going"), button:has-text("Change")')).toBeVisible();
  });

  test('session state reflected in layout data', async ({ page, authenticateAs }) => {
    await authenticateAs(PHONE_NUMBERS.GUEST_2);
    // Navigate to my-events (requires auth)
    await page.goto('/my-events');
    // Should NOT redirect (authenticated)
    await expect(page).toHaveURL(/my-events/);
  });
});
