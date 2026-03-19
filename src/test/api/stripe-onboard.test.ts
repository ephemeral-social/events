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

describe('POST /api/payments/stripe-onboard', () => {
	let handler: typeof import('../../routes/api/payments/stripe-onboard/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/payments/stripe-onboard/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({ method: 'POST' });
		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('proxies to POST /v1/payments/stripe-onboard', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(200, { account_id: 'acct_xxx' }));

		const request = new Request('http://localhost:5173/api/payments/stripe-onboard', {
			method: 'POST'
		});

		const event = createMockRequestEvent({
			method: 'POST',
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});
		(event as any).request = request;

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.account_id).toBe('acct_xxx');

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/payments/stripe-onboard');
	});

	it('forwards event_id in request body to backend', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(200, { account_id: 'acct_xxx' }));

		const request = new Request('http://localhost:5173/api/payments/stripe-onboard', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ event_id: 'evt_123' })
		});

		const event = createMockRequestEvent({
			method: 'POST',
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});
		(event as any).request = request;

		const response = await handler(event as any);
		expect(response.status).toBe(200);

		expect(spy).toHaveBeenCalled();
		const [, fetchOpts] = spy.mock.calls[0];
		const body = JSON.parse(fetchOpts.body as string);
		expect(body.event_id).toBe('evt_123');
	});

	it('forwards backend errors with code', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		mockFetch(
			mockFetchJsonResponse(400, {
				error: { code: 'ALREADY_EXISTS', message: 'Account already exists' }
			})
		);

		const event = createMockRequestEvent({
			method: 'POST',
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.code).toBe('ALREADY_EXISTS');
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
