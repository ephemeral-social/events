import { test, expect } from '../fixtures/auth.fixture';
import { SEL } from '../helpers/selectors';
import { PHONE_NUMBERS, futureDateInput, futureTimeInput } from '../fixtures/test-data';

test.describe('Host Create & Manage Journey', () => {
  test('create event → view → edit → verify', async ({ page, authenticateAs }) => {
    // 1. Authenticate
    await authenticateAs(PHONE_NUMBERS.HOST);

    // 2. Navigate to create page
    await page.goto('/create');
    await expect(page.locator(SEL.CREATE_TITLE)).toBeVisible();

    // 3. Fill form
    const title = `Journey Event ${Date.now()}`;
    await page.locator(SEL.CREATE_TITLE).fill(title);
    await page.locator(SEL.CREATE_START_DATE).fill(futureDateInput());
    await page.locator(SEL.CREATE_START_TIME).fill(futureTimeInput());
    await page.locator(SEL.CREATE_VENUE).fill('Journey Venue');
    await page.locator(SEL.CREATE_DESCRIPTION).fill('A journey test event');

    // 4. Submit
    await page.locator(SEL.CREATE_SUBMIT).click();

    // 5. Redirect to event page
    await expect(page).toHaveURL(/\/e\//, { timeout: 15_000 });
    const slug = new URL(page.url()).pathname.split('/').pop()!;
    await expect(page.locator('h1, h2').first()).toContainText(title);

    // 6. Navigate to my-events
    await page.goto('/my-events');
    await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 10_000 });

    // 7. Go to edit page
    await page.goto(`/e/${slug}/edit`);
    await expect(page.locator(SEL.EDIT_TITLE)).toHaveValue(title);

    // 8. Update title
    const updatedTitle = `Updated ${title}`;
    await page.locator(SEL.EDIT_TITLE).clear();
    await page.locator(SEL.EDIT_TITLE).fill(updatedTitle);
    await page.locator(SEL.EDIT_SUBMIT).click();

    // 9. Verify update on event page
    await expect(page).toHaveURL(`/e/${slug}`, { timeout: 15_000 });
    await expect(page.locator('h1, h2').first()).toContainText(updatedTitle);
  });
});
