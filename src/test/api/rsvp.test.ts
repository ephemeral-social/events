import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D4: RSVP route tests — GET, POST, PUT

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('GET /api/events/[eventId]/rsvp', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/rsvp/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/rsvp/+server');
		handler = mod.GET;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('returns 503 without KV', async () => {
		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } } as any
		});
		(event.platform as any).env.SESSIONS = undefined;

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});

	it('proxies to /v1/events/{eventId}/my-rsvp', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const rsvpData = { status: 'going', plus_ones: 1 };
		const spy = mockFetch(mockFetchJsonResponse(200, rsvpData));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.status).toBe('going');

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/my-rsvp');
	});
});

describe('POST /api/events/[eventId]/rsvp', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/rsvp/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/rsvp/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { status: 'going' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('proxies to POST /v1/events/{eventId}/web-rsvp and returns 201', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(201, { rsvp_id: 'rsvp-new', status: 'going' }));

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { status: 'going', display_name: 'Alice' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(201);

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/web-rsvp');
	});

	it('forwards capacity error codes', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		mockFetch(
			mockFetchJsonResponse(409, {
				error: { code: 'EVENT_AT_CAPACITY', message: 'Event is at capacity' }
			})
		);

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { status: 'going' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(409);
		const data = await response.json();
		expect(data.code).toBe('EVENT_AT_CAPACITY');
	});
});

describe('PUT /api/events/[eventId]/rsvp', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/rsvp/+server').PUT;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/rsvp/+server');
		handler = mod.PUT;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'PUT',
			params: { eventId: 'evt-001' },
			body: { status: 'maybe' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('returns 503 without KV', async () => {
		const event = createMockRequestEvent({
			method: 'PUT',
			params: { eventId: 'evt-001' },
			body: { status: 'maybe' },
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } } as any
		});
		(event.platform as any).env.SESSIONS = undefined;

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});

	it('proxies to PUT /v1/events/{eventId}/web-rsvp', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(200, { status: 'maybe' }));

		const event = createMockRequestEvent({
			method: 'PUT',
			params: { eventId: 'evt-001' },
			body: { status: 'maybe' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);

		expect(spy).toHaveBeenCalled();
		const [url, opts] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/web-rsvp');
		expect(opts.method).toBe('PUT');
	});
});
