import { test, expect } from '../../fixtures/event.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS } from '../../fixtures/test-data';
import { rsvpViaBackend, authenticateViaBackend } from '../../fixtures/backend-api';

test.describe('RSVP Update', () => {
	test('Change button visible on status card', async ({
		page,
		seededEvent,
		authenticateAs
	}) => {
		const auth = await authenticateViaBackend('+15550990040');
		await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
			status: 'going',
			display_name: 'Update Tester'
		});
		await authenticateAs('+15550990040');
		await page.goto(`/e/${seededEvent.slug}`);
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible();
	});

	test('opens RSVP form on Change click', async ({ page, seededEvent, authenticateAs }) => {
		const auth = await authenticateViaBackend('+15550990041');
		await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
			status: 'going',
			display_name: 'Form Opener'
		});
		await authenticateAs('+15550990041');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_CHANGE).click();
		await expect(page.locator(SEL.RSVP_GOING)).toBeVisible();
	});

	test('Going to Maybe update', async ({ page, seededEvent, authenticateAs }) => {
		const auth = await authenticateViaBackend('+15550990042');
		await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
			status: 'going',
			display_name: 'Going to Maybe'
		});
		await authenticateAs('+15550990042');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_CHANGE).click();
		await page.locator(SEL.RSVP_MAYBE).click();
		await page.locator(SEL.RSVP_SUBMIT_MAYBE).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
	});

	test('Maybe to Declined update', async ({ page, seededEvent, authenticateAs }) => {
		const auth = await authenticateViaBackend('+15550990043');
		await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
			status: 'maybe',
			display_name: 'Maybe to Declined'
		});
		await authenticateAs('+15550990043');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_CHANGE).click();
		await page.locator(SEL.RSVP_DECLINED).click();
		await page.locator("button:has-text(\"Can't Make It\")").click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
	});

	test('Declined to Going update', async ({ page, seededEvent, authenticateAs }) => {
		const auth = await authenticateViaBackend('+15550990044');
		await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
			status: 'declined',
			display_name: 'Declined to Going'
		});
		await authenticateAs('+15550990044');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_CHANGE).click();
		await page.locator(SEL.RSVP_GOING).click();
		await page.locator(SEL.RSVP_SUBMIT_GOING).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
	});

	test('updated status displayed after change', async ({
		page,
		seededEvent,
		authenticateAs
	}) => {
		const auth = await authenticateViaBackend('+15550990045');
		await rsvpViaBackend(auth.accessToken, seededEvent.eventId, {
			status: 'going',
			display_name: 'Status Display'
		});
		await authenticateAs('+15550990045');
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.RSVP_CHANGE).click();
		await page.locator(SEL.RSVP_MAYBE).click();
		await page.locator(SEL.RSVP_SUBMIT_MAYBE).click();
		await expect(page.locator(SEL.RSVP_CHANGE)).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('text=Status Display')).toBeVisible();
	});
});
