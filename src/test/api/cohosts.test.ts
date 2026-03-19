import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D12: Cohosts route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('GET /api/events/[eventId]/cohosts', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/cohosts/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/cohosts/+server');
		handler = mod.GET;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('returns co-host list', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const cohostData = {
			cohosts: [{ user_id: 'u-002', display_name: 'Co-Host Alice', role: 'cohost' }]
		};
		mockFetch(mockFetchJsonResponse(200, cohostData));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.cohosts).toHaveLength(1);
		expect(data.cohosts[0].display_name).toBe('Co-Host Alice');
	});
});

describe('POST /api/events/[eventId]/cohosts (invite)', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/cohosts/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/cohosts/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('calls POST /cohosts/invite with no body and returns 201', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(
			mockFetchJsonResponse(201, {
				invite_token: 'inv-abc123',
				invite_url: 'https://example.com/invite/abc123'
			})
		);

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(201);
		const data = await response.json();
		expect(data.invite_token).toBe('inv-abc123');

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/cohosts/invite');
	});
});

describe('POST /api/events/cohost-accept', () => {
	let handler: typeof import('../../routes/api/events/cohost-accept/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/cohost-accept/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			body: { token: 'inv-abc123' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('returns 400 when token is missing', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const event = createMockRequestEvent({
			method: 'POST',
			body: {},
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe('Token is required');
	});

	it('returns 400 when event_id is missing', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const event = createMockRequestEvent({
			method: 'POST',
			body: { token: 'inv-abc123' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe('event_id is required');
	});

	it('proxies { token, event_id } to POST /v1/events/:eventId/cohosts/accept', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(200, { success: true }));

		const event = createMockRequestEvent({
			method: 'POST',
			body: { token: 'inv-abc123', event_id: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/cohosts/accept');
	});
});
