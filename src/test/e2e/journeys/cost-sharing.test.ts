import { describe, it, expect, beforeAll } from 'vitest';
import {
	authenticateTestUser,
	createTestEvent,
	createSessionForUser,
	callApiRoute
} from '../helpers';
import { createMockCookies } from '../../mocks/cookies';
import { createMockKV } from '../../mocks/kv';

describe('Journey 6: Cost Sharing & Guest List', () => {
	let hostAuth: Awaited<ReturnType<typeof authenticateTestUser>>;
	let guestAuth: Awaited<ReturnType<typeof authenticateTestUser>>;
	let eventId: string;

	beforeAll(async () => {
		hostAuth = await authenticateTestUser('+15550006001');
		guestAuth = await authenticateTestUser('+15550006002');

		const event = await createTestEvent(hostAuth.accessToken, {
			title: 'Cost Sharing Test Event',
			start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			slug: `cost-test-${Date.now()}`,
			show_guest_list: true
		});

		eventId = (event as any).event_id || (event as any).event?.event_id;

		// Guest RSVPs
		const rsvpRes = await fetch(`http://127.0.0.1:8787/v1/events/${eventId}/web-rsvp`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${guestAuth.accessToken}`
			},
			body: JSON.stringify({
				status: 'going',
				display_name: 'Cost Guest',
				plus_ones: 0
			})
		});

		if (!rsvpRes.ok) {
			console.warn('RSVP seeding failed:', rsvpRes.status);
		}
	});

	it('host adds cost items', async () => {
		const { POST } = await import('../../../routes/api/events/[eventId]/costs/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, hostAuth);

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: {
				description: 'Venue rental',
				amount_cents: 5000
			},
			params: { eventId },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
		expect(response.status).toBe(201);
	});

	it('guest can view costs', async () => {
		const { GET } = await import('../../../routes/api/events/[eventId]/costs/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, guestAuth);

		const response = await callApiRoute(GET, {
			params: { eventId },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
	});

	it('guest list with pagination', async () => {
		const { GET } = await import('../../../routes/api/events/[eventId]/guest-list/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, guestAuth);

		const response = await callApiRoute(GET, {
			params: { eventId },
			kv,
			cookies,
			searchParams: { limit: '10' }
		});

		expect(response.ok).toBe(true);
		const data = (await response.json()) as any;
		expect(data).toBeDefined();
	});

	it('unauthenticated user cannot access costs', async () => {
		const { GET } = await import('../../../routes/api/events/[eventId]/costs/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();

		const response = await callApiRoute(GET, {
			params: { eventId },
			kv,
			cookies
		});

		expect(response.status).toBe(401);
	});

	it('unauthenticated user cannot access guest list', async () => {
		const { GET } = await import('../../../routes/api/events/[eventId]/guest-list/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();

		const response = await callApiRoute(GET, {
			params: { eventId },
			kv,
			cookies
		});

		expect(response.status).toBe(401);
	});
});
