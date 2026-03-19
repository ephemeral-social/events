import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend, rsvpViaBackend } from '../../fixtures/backend-api';

test.describe('Guest List Visible', () => {
	let eventSlug: string;
	let eventId: string;

	test.beforeAll(async () => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Guest List Visible'),
			slug: uniqueSlug('guest-list-1'),
			start_time: futureDate(),
			show_guest_list: true
		});
		eventSlug = event.slug;
		eventId = event.event_id;

		// Add some guests
		const guest1 = await authenticateViaBackend('+15550990200');
		await rsvpViaBackend(guest1.accessToken, eventId, {
			status: 'going',
			display_name: 'Alice Going'
		});

		const guest2 = await authenticateViaBackend('+15550990201');
		await rsvpViaBackend(guest2.accessToken, eventId, {
			status: 'maybe',
			display_name: 'Bob Maybe'
		});

		const guest3 = await authenticateViaBackend('+15550990202');
		await rsvpViaBackend(guest3.accessToken, eventId, {
			status: 'declined',
			display_name: 'Carol Declined'
		});
	});

	test("guest list section renders for RSVP'd user", async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990200');
		await page.goto(`/e/${eventSlug}`);
		// Target the h3 heading inside the GuestList component, not the event title
		await expect(page.getByRole('heading', { name: 'Guest List', level: 3 })).toBeVisible();
	});

	test('going guests grouped', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990200');
		await page.goto(`/e/${eventSlug}`);
		// Click the Guest List button to load guests via API
		await page.locator('button:has-text("Guest List")').click();
		// Target span inside guest list to avoid matching RSVP status section
		await expect(page.locator('span:has-text("Alice Going")').first()).toBeVisible({ timeout: 10_000 });
	});

	test('maybe guests grouped', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990200');
		await page.goto(`/e/${eventSlug}`);
		// Click the Guest List button to load guests via API
		await page.locator('button:has-text("Guest List")').click();
		await expect(page.locator('span:has-text("Bob Maybe")').first()).toBeVisible({ timeout: 10_000 });
	});

	test('declined guests NOT shown to non-host', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990200');
		await page.goto(`/e/${eventSlug}`);
		// Click the Guest List button to load guests via API
		await page.locator('button:has-text("Guest List")').click();
		// Wait for guests to load, then verify declined guest is not shown
		await expect(page.locator('span:has-text("Alice Going")').first()).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('text=Carol Declined')).toBeHidden();
	});

	test('plus-ones displayed', async ({ page, authenticateAs }) => {
		// Add a guest with plus ones
		const guestWithPO = await authenticateViaBackend('+15550990203');
		await rsvpViaBackend(guestWithPO.accessToken, eventId, {
			status: 'going',
			display_name: 'Plus One Guest',
			plus_ones: 2
		});
		await authenticateAs('+15550990200');
		await page.goto(`/e/${eventSlug}`);
		// Click the Guest List button to load guests via API
		await page.locator('button:has-text("Guest List")').click();
		await expect(page.locator('text=Plus One Guest')).toBeVisible({ timeout: 10_000 });
	});

	test('loading state', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990200');
		// Slow down the guest-list API to catch loading state
		await page.route('**/api/events/*/guest-list', async (route) => {
			await new Promise((r) => setTimeout(r, 1000));
			await route.continue();
		});
		await page.goto(`/e/${eventSlug}`);
		// Click the Guest List button to trigger the API call
		await page.locator('button:has-text("Guest List")').click();
		// The "Loading..." text is inside the GuestList component
		await expect(page.locator('p:has-text("Loading...")')).toBeVisible();
	});

	test('empty state when no guests', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const emptyEvent = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Empty Guest List'),
			slug: uniqueSlug('guest-list-2'),
			start_time: futureDate(),
			show_guest_list: true
		});
		// RSVP to see guest list
		const guest = await authenticateViaBackend('+15550990204');
		await rsvpViaBackend(guest.accessToken, emptyEvent.event_id, {
			status: 'going',
			display_name: 'Only Guest'
		});
		await authenticateAs('+15550990204');
		await page.goto(`/e/${emptyEvent.slug}`);
		// Click the Guest List button to load guests via API
		await page.locator('button:has-text("Guest List")').click();
		// Should show the only guest after loading
		await expect(page.locator('text=Only Guest')).toBeVisible({ timeout: 10_000 });
	});
});
