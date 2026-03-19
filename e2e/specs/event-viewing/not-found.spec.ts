import { test, expect } from '@playwright/test';

test.describe('Event Not Found', () => {
  test('404 for nonexistent slug', async ({ page }) => {
    const res = await page.goto('/e/this-event-does-not-exist-xyz123');
    expect(res?.status()).toBe(404);
  });

  test('error for malformed slug', async ({ page }) => {
    const res = await page.goto('/e/!!!invalid!!!');
    // Should get 404 or error page
    expect(res?.status()).toBeGreaterThanOrEqual(400);
  });
});
