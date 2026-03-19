import { test, expect } from '../../fixtures/auth.fixture';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import {
	authenticateViaBackend,
	createEventViaBackend,
	rsvpViaBackend,
	addCostViaBackend
} from '../../fixtures/backend-api';

test.describe('Cost Hidden', () => {
	let eventSlug: string;
	let eventId: string;

	test.beforeAll(async () => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Cost Hidden'),
			slug: uniqueSlug('cost-hidde-1'),
			start_time: futureDate()
		});
		eventSlug = event.slug;
		eventId = event.event_id;

		await addCostViaBackend(host.accessToken, eventId, {
			description: 'Hidden Cost',
			amount_cents: 2500
		});
	});

	test('gated message for non-RSVP user', async ({ page, authenticateAs }) => {
		// Authenticate but don't RSVP — CostSummary only renders for authenticated users
		await authenticateAs('+15550990232');
		await page.goto(`/e/${eventSlug}`);
		// Non-RSVP'd users see the gated message instead of cost details
		await expect(
			page.locator('p.text-body-sm:has-text("RSVP to see cost details")')
		).toBeVisible();
	});

	test('gated message for declined RSVP', async ({ page, authenticateAs }) => {
		const auth = await authenticateViaBackend('+15550990230');
		await rsvpViaBackend(auth.accessToken, eventId, {
			status: 'declined',
			display_name: 'Declined Cost Viewer'
		});
		await authenticateAs('+15550990230');
		await page.goto(`/e/${eventSlug}`);
		// The CostSummary component shows this specific gated message for non-RSVP'd users
		await expect(
			page.locator('p.text-body-sm:has-text("RSVP to see cost details")')
		).toBeVisible();
	});

	test("no cost API fetch when not RSVP'd", async ({ page, authenticateAs }) => {
		let costApiCalled = false;
		await page.route('**/api/events/*/costs', (route) => {
			costApiCalled = true;
			route.continue();
		});
		await authenticateAs('+15550990231');
		await page.goto(`/e/${eventSlug}`);
		await page.waitForTimeout(2000);
		expect(costApiCalled).toBe(false);
	});
});
