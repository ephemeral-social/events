import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D14: Text blast route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('POST /api/events/[eventId]/text-blast', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/text-blast/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/text-blast/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { message: 'Hey everyone!' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('proxies message to backend and returns data', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(200, { sent_count: 15, remaining_blasts: 2 }));

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { message: 'Hey everyone!' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.sent_count).toBe(15);

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/text-blast');
	});

	it('forwards BLAST_LIMIT_REACHED error code', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		mockFetch(
			mockFetchJsonResponse(429, {
				error: { code: 'BLAST_LIMIT_REACHED', message: 'Text blast limit reached' }
			})
		);

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { message: 'Another update' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(429);
		const data = await response.json();
		expect(data.code).toBe('BLAST_LIMIT_REACHED');
	});

	it('returns 503 without KV', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { message: 'Hello' },
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } } as any
		});
		(event.platform as any).env.SESSIONS = undefined;

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});
});
