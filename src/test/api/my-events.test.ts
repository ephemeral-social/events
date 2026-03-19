import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D16: My events route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('GET /api/my-events', () => {
	let handler: typeof import('../../routes/api/my-events/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/my-events/+server');
		handler = mod.GET;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('calls /v1/events (not /v1/events/my-events) and returns data', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const eventsData = {
			upcoming: [
				{ event_id: 'evt-001', title: 'My Party' }
			],
			past: [
				{ event_id: 'evt-002', title: 'Another Event' }
			]
		};
		const spy = mockFetch(mockFetchJsonResponse(200, eventsData));

		const event = createMockRequestEvent({
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.events).toHaveLength(2);

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		// Verify it calls /v1/events, NOT /v1/events/my-events
		expect(url).toBe('http://127.0.0.1:8787/v1/events');
	});

	it('returns 503 without KV', async () => {
		const event = createMockRequestEvent({
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } } as any
		});
		(event.platform as any).env.SESSIONS = undefined;

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});
});
