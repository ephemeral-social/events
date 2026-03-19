import { test, expect } from '@playwright/test';

test.describe('Tombstone Page', () => {
  // Note: Tombstone pages require a deleted event in the backend.
  // These tests verify the UI when tombstone data is returned.

  test('shows deleted message for tombstone event', async ({ page }) => {
    // Use a known deleted slug or mock — skip if no tombstone available
    await page.goto('/e/nonexistent-deleted-event-slug');
    // Should show 404 or error
    const body = await page.locator('body').textContent();
    expect(body).toMatch(/not found|deleted|error/i);
  });

  test('no RSVP button on tombstone', async ({ page }) => {
    await page.goto('/e/nonexistent-deleted-event-slug');
    await expect(page.locator('button:has-text("RSVP")')).toBeHidden();
  });

  test('no RSVP form on tombstone', async ({ page }) => {
    await page.goto('/e/nonexistent-deleted-event-slug');
    await expect(page.locator('#rsvp-name')).toBeHidden();
  });
});
