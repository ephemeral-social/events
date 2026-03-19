import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D8: Tickets route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('GET /api/events/[eventId]/tickets', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/tickets/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/tickets/+server');
		handler = mod.GET;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('calls /v1/events/{eventId}/my-ticket and returns data', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const ticketData = { ticket_id: 'tkt-001', tier: 'general', status: 'confirmed' };
		const spy = mockFetch(mockFetchJsonResponse(200, ticketData));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.ticket_id).toBe('tkt-001');

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/my-ticket');
	});

	it('returns { tickets: [] } when backend returns 404', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		mockFetch(
			mockFetchJsonResponse(404, { error: { code: 'NOT_FOUND', message: 'No ticket found' } })
		);

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.tickets).toEqual([]);
	});

	it('forwards non-404 backend errors', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		mockFetch(mockFetchJsonResponse(500, { error: { code: 'INTERNAL', message: 'Server error' } }));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(500);
	});
});
