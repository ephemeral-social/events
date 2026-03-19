import { test as authTest } from './auth.fixture';
import {
	authenticateViaBackend,
	createEventViaBackend,
	rsvpViaBackend
} from './backend-api';
import { PHONE_NUMBERS, uniqueEventTitle, uniqueSlug, futureDate } from './test-data';

interface EventFixtures {
	/** Create a seeded event via backend API. Returns event data + host auth. */
	seededEvent: {
		eventId: string;
		slug: string;
		title: string;
		hostToken: string;
		hostUserId: string;
	};
	/** Create a seeded event with an RSVP'd guest. Returns event + guest auth. */
	seededEventWithGuest: {
		eventId: string;
		slug: string;
		title: string;
		hostToken: string;
		hostUserId: string;
		guestToken: string;
		guestUserId: string;
	};
}

export const test = authTest.extend<EventFixtures>({
	seededEvent: async ({}, use) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const title = uniqueEventTitle();
		const slug = uniqueSlug();
		const event = await createEventViaBackend(host.accessToken, {
			title,
			slug,
			description: 'A test event for Playwright E2E testing',
			start_time: futureDate(7),
			venue_name: 'Test Venue',
			venue_address: '123 Test St'
		});

		await use({
			eventId: event.event_id,
			slug: event.slug,
			title,
			hostToken: host.accessToken,
			hostUserId: host.userId
		});
	},

	seededEventWithGuest: async ({}, use) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const title = uniqueEventTitle();
		const slug = uniqueSlug('pw-guest');
		const event = await createEventViaBackend(host.accessToken, {
			title,
			slug,
			description: 'A test event with guest for Playwright E2E testing',
			start_time: futureDate(7),
			show_guest_list: true,
			venue_name: 'Test Venue',
			venue_address: '123 Test St'
		});

		const guest = await authenticateViaBackend(PHONE_NUMBERS.GUEST_1);
		await rsvpViaBackend(guest.accessToken, event.event_id, {
			status: 'going',
			display_name: 'Test Guest'
		});

		await use({
			eventId: event.event_id,
			slug: event.slug,
			title,
			hostToken: host.accessToken,
			hostUserId: host.userId,
			guestToken: guest.accessToken,
			guestUserId: guest.userId
		});
	}
});

export { expect } from '@playwright/test';
