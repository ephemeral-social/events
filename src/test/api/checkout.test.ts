import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D7: Checkout route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('POST /api/events/[eventId]/checkout', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/checkout/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/checkout/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { ticket_tier: 'general' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('proxies to POST /v1/events/{eventId}/checkout', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(
			mockFetchJsonResponse(200, { checkout_url: 'https://checkout.stripe.com/sess_123' })
		);

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { ticket_tier: 'general' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.checkout_url).toContain('stripe.com');

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/checkout');
	});

	it('forwards backend errors with code', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		mockFetch(
			mockFetchJsonResponse(400, {
				error: { code: 'TICKETS_SOLD_OUT', message: 'Tickets are sold out' }
			})
		);

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { ticket_tier: 'vip' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.code).toBe('TICKETS_SOLD_OUT');
	});

	it('returns 503 on network error', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network fail'));

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { ticket_tier: 'general' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});
});
