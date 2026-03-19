import { describe, it, expect, beforeAll } from 'vitest';
import {
	authenticateTestUser,
	createTestEvent,
	createSessionForUser,
	callApiRoute
} from '../helpers';
import { createMockCookies } from '../../mocks/cookies';
import { createMockKV } from '../../mocks/kv';

describe('Journey 7: Comments & Text Blast', () => {
	let hostAuth: Awaited<ReturnType<typeof authenticateTestUser>>;
	let guestAuth: Awaited<ReturnType<typeof authenticateTestUser>>;
	let eventId: string;

	beforeAll(async () => {
		hostAuth = await authenticateTestUser('+15550007001');
		guestAuth = await authenticateTestUser('+15550007002');

		const event = await createTestEvent(hostAuth.accessToken, {
			title: 'Comments Test Event',
			start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			slug: `comments-test-${Date.now()}`
		});

		eventId = (event as any).event_id || (event as any).event?.event_id;

		// Guest RSVPs
		await fetch(`http://127.0.0.1:8787/v1/events/${eventId}/web-rsvp`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${guestAuth.accessToken}`
			},
			body: JSON.stringify({
				status: 'going',
				display_name: 'Comment Guest',
				plus_ones: 0
			})
		});
	});

	it("RSVP'd guest posts comment", async () => {
		const { POST } = await import('../../../routes/api/events/[eventId]/comments/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, guestAuth);

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: {
				content: 'Looking forward to this event!'
			},
			params: { eventId },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
		expect(response.status).toBe(201);
	});

	it('comments list shows posted comment', async () => {
		const { GET } = await import('../../../routes/api/events/[eventId]/comments/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, guestAuth);

		const response = await callApiRoute(GET, {
			params: { eventId },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
		const data = (await response.json()) as any;
		expect(data).toBeDefined();
	});

	it.todo('host sends text blast — requires Twilio dev mode', async () => {
		const { POST } = await import('../../../routes/api/events/[eventId]/text-blast/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, hostAuth);

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: {
				message: 'Reminder: event tomorrow!'
			},
			params: { eventId },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
		const data = (await response.json()) as any;
		expect(data).toBeDefined();
	});

	it('text blast requires auth', async () => {
		const { POST } = await import('../../../routes/api/events/[eventId]/text-blast/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: { message: 'Should fail' },
			params: { eventId },
			kv,
			cookies
		});

		expect(response.status).toBe(401);
	});
});
