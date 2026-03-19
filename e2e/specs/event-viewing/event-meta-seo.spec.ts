import { test, expect } from '../../fixtures/event.fixture';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend } from '../../fixtures/backend-api';

test.describe('Event Meta & SEO', () => {
  test('og:title meta tag present', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain(seededEvent.title);
  });

  test('og:description meta tag present', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const ogDesc = await page.locator('meta[property="og:description"]').getAttribute('content');
    expect(ogDesc).toBeTruthy();
  });

  test('og:url contains canonical URL format', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(ogUrl).toContain(`ephemeralsocial.com/e/${seededEvent.slug}`);
  });

  test('og:type is website', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    const ogType = await page.locator('meta[property="og:type"]').getAttribute('content');
    expect(ogType).toBe('website');
  });

  test('correct page title format', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await expect(page).toHaveTitle(new RegExp(`${seededEvent.title}.*Ephemeral`));
  });
});
