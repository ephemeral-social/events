import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('renders Ephemeral h1 heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Ephemeral');
  });

  test('renders subtitle', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Events that disappear')).toBeVisible();
  });

  test('centered vertically', async ({ page }) => {
    await page.goto('/');
    const main = page.locator('main');
    const classes = await main.getAttribute('class');
    expect(classes).toContain('min-h-dvh');
    expect(classes).toContain('items-center');
    expect(classes).toContain('justify-center');
  });

  test('correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Ephemeral.*Events that disappear/);
  });
});
