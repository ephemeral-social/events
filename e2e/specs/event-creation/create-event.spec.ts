import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, futureDateInput, futureTimeInput } from '../../fixtures/test-data';

test.describe('Create Event', () => {
	test.beforeEach(async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto('/create');
	});

	test('form displays with all fields', async ({ page }) => {
		await expect(page.locator(SEL.CREATE_TITLE)).toBeVisible();
		await expect(page.locator(SEL.CREATE_START_DATE)).toBeVisible();
		await expect(page.locator(SEL.CREATE_START_TIME)).toBeVisible();
		await expect(page.locator(SEL.CREATE_DESCRIPTION)).toBeVisible();
	});

	test('shows slug preview as user types title', async ({ page }) => {
		await page.locator(SEL.CREATE_TITLE).fill('My Test Party');
		await expect(page.locator('text=ephemeralsocial.com/e/')).toBeVisible();
	});

	test('creates event with required fields only', async ({ page }) => {
		await page.locator(SEL.CREATE_TITLE).fill(`Minimal Event ${Date.now()}`);
		await page.locator(SEL.CREATE_START_DATE).fill(futureDateInput());
		await page.locator(SEL.CREATE_START_TIME).fill(futureTimeInput());
		await page.locator(SEL.CREATE_SUBMIT).click();
		await expect(page).toHaveURL(/\/e\//, { timeout: 15_000 });
	});

	test('creates event with all fields and redirects', async ({ page }) => {
		const title = `Full Event ${Date.now()}`;
		await page.locator(SEL.CREATE_TITLE).fill(title);
		await page.locator(SEL.CREATE_START_DATE).fill(futureDateInput());
		await page.locator(SEL.CREATE_START_TIME).fill(futureTimeInput());
		await page.locator(SEL.CREATE_VENUE).fill('Party Venue');
		await page.locator(SEL.CREATE_ADDRESS).fill('456 Party St');
		await page.locator(SEL.CREATE_DESCRIPTION).fill('A great party!');
		await page.locator(SEL.CREATE_SUBMIT).click();
		await expect(page).toHaveURL(/\/e\//, { timeout: 15_000 });
		await expect(page.locator('h1, h2').first()).toContainText(title);
	});

	test('default type is Free', async ({ page }) => {
		await expect(page.locator('button[aria-pressed="true"]:has-text("Free")')).toBeVisible();
	});

	test('toggle to Ticketed shows price field', async ({ page }) => {
		await page.locator(SEL.CREATE_TYPE_TICKETED).click();
		await expect(page.locator(SEL.CREATE_PRICE)).toBeVisible();
	});

	test('toggle back to Free hides price field', async ({ page }) => {
		await page.locator(SEL.CREATE_TYPE_TICKETED).click();
		await expect(page.locator(SEL.CREATE_PRICE)).toBeVisible();
		await page.locator(SEL.CREATE_TYPE_FREE).click();
		await expect(page.locator(SEL.CREATE_PRICE)).toBeHidden();
	});

	test('max attendees number input', async ({ page }) => {
		await page.locator(SEL.CREATE_CAPACITY).fill('50');
		await expect(page.locator(SEL.CREATE_CAPACITY)).toHaveValue('50');
	});

	test('shows Creating loading state', async ({ page }) => {
		await page.locator(SEL.CREATE_TITLE).fill(`Loading Test ${Date.now()}`);
		await page.locator(SEL.CREATE_START_DATE).fill(futureDateInput());
		await page.locator(SEL.CREATE_START_TIME).fill(futureTimeInput());
		await page.locator(SEL.CREATE_SUBMIT).click();
		await expect(page.locator('button:has-text("Creating...")')).toBeVisible();
	});

	test('back arrow links to home', async ({ page }) => {
		const backLink = page.locator(SEL.BACK_ARROW);
		await expect(backLink).toBeVisible();
		await expect(backLink).toHaveAttribute('href', '/');
	});

	test('page title', async ({ page }) => {
		await expect(page).toHaveTitle(/Create Event.*Ephemeral/);
	});

	test('created event displayed at redirected URL', async ({ page }) => {
		const title = `Redirect Verify ${Date.now()}`;
		await page.locator(SEL.CREATE_TITLE).fill(title);
		await page.locator(SEL.CREATE_START_DATE).fill(futureDateInput());
		await page.locator(SEL.CREATE_START_TIME).fill(futureTimeInput());
		await page.locator(SEL.CREATE_SUBMIT).click();
		await expect(page).toHaveURL(/\/e\//, { timeout: 15_000 });
		await expect(page.locator('h1, h2').first()).toContainText(title);
	});

	test('location hidden checkbox toggle', async ({ page }) => {
		const checkbox = page.locator('input[type="checkbox"]').first();
		if (await checkbox.isVisible()) {
			const initialState = await checkbox.isChecked();
			await checkbox.click();
			expect(await checkbox.isChecked()).toBe(!initialState);
		}
	});

	test('show guest list checkbox toggle', async ({ page }) => {
		const checkboxes = page.locator('input[type="checkbox"]');
		const count = await checkboxes.count();
		if (count > 1) {
			const checkbox = checkboxes.nth(1);
			const initialState = await checkbox.isChecked();
			await checkbox.click();
			expect(await checkbox.isChecked()).toBe(!initialState);
		}
	});
});
