import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend } from '../../fixtures/backend-api';

test.describe('Gallery Gated', () => {
	let eventSlug: string;

	test.beforeAll(async () => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Gallery Gated'),
			slug: uniqueSlug('gallery-ga-1'),
			start_time: futureDate()
		});
		eventSlug = event.slug;
	});

	test("gated card shown when not RSVP'd", async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990310');
		await page.goto(`/e/${eventSlug}`);
		await expect(page.locator('text=/RSVP to view and upload photos/i')).toBeVisible();
	});

	test('no upload label visible', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990310');
		await page.goto(`/e/${eventSlug}`);
		await expect(page.locator(SEL.PHOTO_UPLOAD_LABEL)).toBeHidden();
	});

	test("no gallery API fetch when not RSVP'd", async ({ page, authenticateAs }) => {
		let galleryCalled = false;
		await page.route('**/api/events/*/gallery', (route) => {
			galleryCalled = true;
			route.continue();
		});
		await authenticateAs('+15550990311');
		await page.goto(`/e/${eventSlug}`);
		await page.waitForTimeout(2000);
		expect(galleryCalled).toBe(false);
	});
});
