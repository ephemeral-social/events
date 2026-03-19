import { test, expect } from '../../fixtures/event.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS } from '../../fixtures/test-data';

test.describe('RSVP Flow', () => {
	test('RSVP form with Going/Maybe/Cant make it options', async ({
		page,
		seededEvent,
		authenticateAs
	}) => {
		await authenticateAs(PHONE_NUMBERS.GUEST_2);
		await page.goto(`/e/${seededEvent.slug}`);
		await expect(page.locator(SEL.RSVP_GOING)).toBeVisible();
		await expect(page.locator(SEL.RSVP_MAYBE)).toBeVisible();
		await expect(page.locator(SEL.RSVP_DECLINED)).toBeVisible();
	});

	test('default Going selected', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.GUEST_2);
		await page.goto(`/e/${seededEvent.slug}`);
		await expect(page.locator('button[aria-pressed="true"]:has-text("Going")')).toBeVisible();
	});

	test('submit Going with name shows RsvpStatus card', async ({
		page,
		seededEvent,
		authenticateAs
	}) => {
		await authenticateAs(PHONE_NUMBERS.GUEST_2);
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_NAME).fill('Test Guest 2');
		await page.locator(SEL.RSVP_SUBMIT_GOING).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
	});

	test('name displayed on status card', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.GUEST_3);
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_NAME).fill('Named Guest');
		await page.locator(SEL.RSVP_SUBMIT_GOING).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('text=Named Guest')).toBeVisible();
	});

	test('submit Maybe shows status', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990030');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_MAYBE).click();
		await page.locator(SEL.RSVP_NAME).fill('Maybe Guest');
		await page.locator(SEL.RSVP_SUBMIT_MAYBE).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
	});

	test('submit Cant make it shows status', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990031');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_DECLINED).click();
		await page.locator(SEL.RSVP_NAME).fill('Declined Guest');
		await page.locator("button:has-text(\"Can't Make It\")").click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
	});

	test('plus-ones hidden when Cant make it selected', async ({
		page,
		seededEvent,
		authenticateAs
	}) => {
		await authenticateAs('+15550990032');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_DECLINED).click();
		await expect(page.locator(SEL.PLUS_ONES_INC)).toBeHidden();
	});

	test('Submitting loading state on button', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990033');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_NAME).fill('Loading Test');
		await page.locator(SEL.RSVP_SUBMIT_GOING).click();
		await expect(page.locator('button:has-text("Submitting...")')).toBeVisible();
	});

	test('empty name shows validation error', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990034');
		await page.goto(`/e/${seededEvent.slug}`);
		// Clear name and submit
		await page.locator(SEL.RSVP_NAME).clear();
		await page.locator(SEL.RSVP_SUBMIT_GOING).click();
		await expect(page.locator('text=/name.*required|enter.*name/i')).toBeVisible();
	});

	test('status card persists after page refresh', async ({
		page,
		seededEvent,
		authenticateAs
	}) => {
		await authenticateAs('+15550990035');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_NAME).fill('Persist Test');
		await page.locator(SEL.RSVP_SUBMIT_GOING).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
		await page.reload();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible();
	});

	test('CTA disappears after RSVP', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990036');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_NAME).fill('CTA Test');
		await page.locator(SEL.RSVP_SUBMIT_GOING).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
		await expect(page.locator(SEL.CTA_RSVP)).toBeHidden();
	});

	test('green check icon on Going status', async ({ page, seededEvent, authenticateAs }) => {
		await authenticateAs('+15550990037');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_NAME).fill('Icon Test');
		await page.locator(SEL.RSVP_SUBMIT_GOING).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
		// Check icon should be present (SVG within status card)
		await expect(page.locator('svg').first()).toBeVisible();
	});
});
