import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D5: Guest list route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('GET /api/events/[eventId]/guest-list', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/guest-list/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/guest-list/+server');
		handler = mod.GET;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('forwards limit and after query params', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(200, { guests: [], has_more: false }));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			searchParams: { limit: '10', after: 'cursor-abc' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/guest-list');
		expect(url).toContain('limit=10');
		expect(url).toContain('after=cursor-abc');
	});

	it('returns guest list data', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const guestData = {
			guests: [{ display_name: 'Alice', status: 'going' }],
			has_more: false
		};
		mockFetch(mockFetchJsonResponse(200, guestData));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		const data = await response.json();
		expect(data.guests).toHaveLength(1);
		expect(data.guests[0].display_name).toBe('Alice');
	});

	it('forwards 403 when guest list is hidden', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		mockFetch(
			mockFetchJsonResponse(403, {
				error: { code: 'GUEST_LIST_HIDDEN', message: 'Guest list is not visible' }
			})
		);

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(403);
	});
});
