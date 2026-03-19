import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS } from '../../fixtures/test-data';

test.describe('Event Creation Form Validation', () => {
	test.beforeEach(async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto('/create');
	});

	test('error when empty title', async ({ page }) => {
		await page.locator(SEL.CREATE_SUBMIT).click();
		await expect(page.locator('text=/title.*required/i')).toBeVisible();
	});

	test('error when no date', async ({ page }) => {
		await page.locator(SEL.CREATE_TITLE).fill('No Date Event');
		await page.locator(SEL.CREATE_SUBMIT).click();
		await expect(page.locator('text=/date.*required|start.*required/i')).toBeVisible();
	});

	test('maxlength=100 on title field', async ({ page }) => {
		await expect(page.locator(SEL.CREATE_TITLE)).toHaveAttribute('maxlength', '100');
	});

	test('maxlength=2000 on description textarea', async ({ page }) => {
		await expect(page.locator(SEL.CREATE_DESCRIPTION)).toHaveAttribute('maxlength', '2000');
	});

	test('max attendees constraints', async ({ page }) => {
		const capacity = page.locator(SEL.CREATE_CAPACITY);
		await expect(capacity).toHaveAttribute('min', '1');
	});

	test('ticket price min constraint', async ({ page }) => {
		await page.locator(SEL.CREATE_TYPE_TICKETED).click();
		const priceInput = page.locator(SEL.CREATE_PRICE);
		await expect(priceInput).toHaveAttribute('min', '1');
	});

	test('network error re-enables submit', async ({ page }) => {
		await page.route('**/api/events', (route) => route.abort('connectionrefused'));
		await page.locator(SEL.CREATE_TITLE).fill(`Error Event ${Date.now()}`);
		await page.locator(SEL.CREATE_START_DATE).fill('2027-06-15');
		await page.locator(SEL.CREATE_START_TIME).fill('19:00');
		await page.locator(SEL.CREATE_SUBMIT).click();
		// After error, submit should be re-enabled
		await expect(page.locator(SEL.CREATE_SUBMIT)).toBeEnabled({ timeout: 10_000 });
	});
});
