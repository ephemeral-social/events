import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('POST /api/payments/account-session', () => {
	let handler: typeof import('../../routes/api/payments/account-session/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/payments/account-session/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({ method: 'POST' });
		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('proxies to POST /v1/payments/account-session', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(200, { client_secret: 'acs_secret_xxx' }));

		const event = createMockRequestEvent({
			method: 'POST',
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.client_secret).toBe('acs_secret_xxx');

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/payments/account-session');
	});

	it('returns 502 when Stripe API is unavailable', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		mockFetch(mockFetchJsonResponse(502, { error: 'Stripe unavailable' }));

		const event = createMockRequestEvent({
			method: 'POST',
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(502);
	});

	it('returns 503 on network error', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network fail'));

		const event = createMockRequestEvent({
			method: 'POST',
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});
});
