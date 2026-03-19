import { test, expect } from '../../fixtures/event.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS } from '../../fixtures/test-data';
import { rsvpViaBackend, authenticateViaBackend } from '../../fixtures/backend-api';

test.describe('Plus Ones', () => {
	test('plus-ones controls visible when Going', async ({
		page,
		seededEvent,
		authenticateAs
	}) => {
		await authenticateAs('+15550990060');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_GOING).click();
		await expect(page.locator(SEL.PLUS_ONES_INC)).toBeVisible();
		await expect(page.locator(SEL.PLUS_ONES_DEC)).toBeVisible();
	});

	test('plus-ones controls visible when Maybe', async ({
		page,
		seededEvent,
		authenticateAs
	}) => {
		await authenticateAs('+15550990061');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_MAYBE).click();
		await expect(page.locator(SEL.PLUS_ONES_INC)).toBeVisible();
	});

	test('plus-ones controls hidden when Declined', async ({
		page,
		seededEvent,
		authenticateAs
	}) => {
		await authenticateAs('+15550990062');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_DECLINED).click();
		await expect(page.locator(SEL.PLUS_ONES_INC)).toBeHidden();
	});

	test('plus-ones start at 0', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990063');
		await page.goto(`/e/${seededEvent.slug}`);
		await expect(page.locator('text=/\\b0\\b/')).toBeVisible();
	});

	test('increment plus-ones', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990064');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.PLUS_ONES_INC).click();
		await expect(page.locator('text=/\\b1\\b/')).toBeVisible();
	});

	test('decrement disabled at 0', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990065');
		await page.goto(`/e/${seededEvent.slug}`);
		await expect(page.locator(SEL.PLUS_ONES_DEC)).toBeDisabled();
	});

	test('increment disabled at 10', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990066');
		await page.goto(`/e/${seededEvent.slug}`);
		for (let i = 0; i < 10; i++) {
			await page.locator(SEL.PLUS_ONES_INC).click();
		}
		await expect(page.locator(SEL.PLUS_ONES_INC)).toBeDisabled();
	});

	test('plus-ones count on status card', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990067');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.PLUS_ONES_INC).click();
		await page.locator(SEL.PLUS_ONES_INC).click();
		await page.locator(SEL.RSVP_NAME).fill('Plus Ones Test');
		await page.locator(SEL.RSVP_SUBMIT_GOING).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('text=/\\+2|2 guest/i')).toBeVisible();
	});
});
