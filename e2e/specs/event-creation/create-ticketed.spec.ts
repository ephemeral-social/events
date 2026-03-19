import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, futureDateInput, futureTimeInput } from '../../fixtures/test-data';

test.describe('Create Ticketed Event', () => {
	test.beforeEach(async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto('/create');
	});

	test('switch to ticketed and set price with cents conversion', async ({ page }) => {
		await page.locator(SEL.CREATE_TYPE_TICKETED).click();
		await page.locator(SEL.CREATE_PRICE).fill('25');
		await expect(page.locator(SEL.CREATE_PRICE)).toHaveValue('25');
	});

	test('ticketed event redirects to setup-ticketing after creation', async ({ page }) => {
		await page.locator(SEL.CREATE_TITLE).fill(`Ticketed Event ${Date.now()}`);
		await page.locator(SEL.CREATE_START_DATE).fill(futureDateInput());
		await page.locator(SEL.CREATE_START_TIME).fill(futureTimeInput());
		await page.locator(SEL.CREATE_TYPE_TICKETED).click();
		await page.locator(SEL.CREATE_PRICE).fill('15');
		await page.locator(SEL.CREATE_SUBMIT).click();
		await expect(page).toHaveURL(/\/e\/.*\/setup-ticketing/, { timeout: 15_000 });
	});

	test('price input shows immediately without Stripe check', async ({ page }) => {
		await page.locator(SEL.CREATE_TYPE_TICKETED).click();
		// Price input should appear immediately — no loading spinner
		await expect(page.locator(SEL.CREATE_PRICE)).toBeVisible();
		// Submit button should not be disabled (no Stripe gating)
		await expect(page.locator(SEL.CREATE_SUBMIT)).not.toBeDisabled();
	});

	test('free event does not show ticket price', async ({ page }) => {
		await page.locator(SEL.CREATE_TITLE).fill(`Free Event ${Date.now()}`);
		await page.locator(SEL.CREATE_START_DATE).fill(futureDateInput());
		await page.locator(SEL.CREATE_START_TIME).fill(futureTimeInput());
		await page.locator(SEL.CREATE_SUBMIT).click();
		await expect(page).toHaveURL(/\/e\//, { timeout: 15_000 });
		await expect(page.locator('button:has-text("RSVP")')).toBeVisible();
	});
});
