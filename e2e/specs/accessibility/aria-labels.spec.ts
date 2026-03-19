import { test, expect } from '../../fixtures/event.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS } from '../../fixtures/test-data';

test.describe('ARIA Labels', () => {
  test('role=dialog and aria-modal on AuthModal', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('aria-label on AuthModal', async ({ page, seededEvent }) => {
    await page.goto(`/e/${seededEvent.slug}`);
    await page.locator(SEL.CTA_RSVP).click();
    await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible();
  });

  test('aria-pressed on RSVP status buttons', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs('+15550990440');
    await page.goto(`/e/${seededEvent.slug}`);
    const goingBtn = page.locator('button[aria-pressed]:has-text("Going")');
    await expect(goingBtn).toBeVisible();
    const pressed = await goingBtn.getAttribute('aria-pressed');
    expect(pressed).toMatch(/true|false/);
  });

  test('aria-pressed on event type toggles', async ({ page, authenticateAs }) => {
    await authenticateAs('+15550990441');
    await page.goto('/create');
    const freeBtn = page.locator('button[aria-pressed]:has-text("Free")');
    await expect(freeBtn).toBeVisible();
    await expect(freeBtn).toHaveAttribute('aria-pressed', 'true');
  });

  test('aria-label on plus-ones buttons', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs('+15550990442');
    await page.goto(`/e/${seededEvent.slug}`);
    await expect(page.locator(SEL.PLUS_ONES_INC)).toBeVisible();
    await expect(page.locator(SEL.PLUS_ONES_INC)).toHaveAttribute('aria-label', 'Increase plus ones');
    await expect(page.locator(SEL.PLUS_ONES_DEC)).toHaveAttribute('aria-label', 'Decrease plus ones');
  });

  test('aria-label on back arrow links', async ({ page, authenticateAs }) => {
    await authenticateAs('+15550990443');
    await page.goto('/create');
    const backArrow = page.locator(SEL.BACK_ARROW);
    if (await backArrow.isVisible()) {
      await expect(backArrow).toHaveAttribute('aria-label', 'Back');
    }
  });

  test('for/id associations on form inputs', async ({ page, authenticateAs }) => {
    await authenticateAs('+15550990444');
    await page.goto('/create');
    // Check that labels have matching for attributes
    const titleLabel = page.locator('label[for="event-title"]');
    const titleInput = page.locator('#event-title');
    await expect(titleLabel).toBeVisible();
    await expect(titleInput).toBeVisible();
  });

  test('RSVP buttons all have aria-pressed', async ({ page, seededEvent, authenticateAs }) => {
    await authenticateAs('+15550990445');
    await page.goto(`/e/${seededEvent.slug}`);
    const buttons = page.locator('button[aria-pressed]');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3); // Going, Maybe, Can't make it
  });
});
