import { test, expect } from '../../fixtures/auth.fixture';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import {
	authenticateViaBackend,
	createEventViaBackend,
	rsvpViaBackend
} from '../../fixtures/backend-api';

test.describe('Guest List Hidden', () => {
	let eventSlug: string;
	let eventId: string;

	test.beforeAll(async () => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Guest List Hidden'),
			slug: uniqueSlug('guest-list-1'),
			start_time: futureDate(),
			show_guest_list: false
		});
		eventSlug = event.slug;
		eventId = event.event_id;

		const guest = await authenticateViaBackend('+15550990210');
		await rsvpViaBackend(guest.accessToken, eventId, {
			status: 'going',
			display_name: 'Hidden Guest'
		});
	});

	test('hidden message when show_guest_list=false', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990210');
		await page.goto(`/e/${eventSlug}`);
		// The GuestList component shows "Guest list is hidden for this event" when show_guest_list=false
		// Use a specific selector to avoid matching the event title which contains "Guest List Hidden"
		await expect(
			page.locator('p.text-body-sm:has-text("Guest list is hidden for this event")')
		).toBeVisible();
	});

	test('no expandable guest list button', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990210');
		await page.goto(`/e/${eventSlug}`);
		// When show_guest_list=false, the GuestList component shows a static message
		// instead of the clickable "Guest List" button with "View" link
		await expect(page.locator('span:has-text("View")')).toBeHidden();
	});

	test('RSVP counts still visible on main page', async ({ page }) => {
		await page.goto(`/e/${eventSlug}`);
		await expect(page.locator('text=/\\d+\\s+going/i')).toBeVisible();
	});
});
