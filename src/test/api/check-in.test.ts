import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchSequence, mockFetchJsonResponse } from '../mocks/fetch';

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('POST /api/events/[eventId]/check-in', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/check-in/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/check-in/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { ticket_id: 'tkt-001' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('calls verify then check-in and returns checked_in status', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetchSequence([
			// First call: POST /v1/tickets/tkt-001/verify → active
			mockFetchJsonResponse(200, { status: 'active', ticket_id: 'tkt-001', event_id: 'evt-001' }),
			// Second call: POST /v1/tickets/tkt-001/check-in → success
			mockFetchJsonResponse(200, { success: true, already_checked_in: false })
		]);

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { ticket_id: 'tkt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.status).toBe('checked_in');
		expect(data.message).toBe('Checked in!');

		// Verify both backend calls were made
		expect(spy).toHaveBeenCalledTimes(2);
		const [verifyUrl] = spy.mock.calls[0];
		const [checkinUrl] = spy.mock.calls[1];
		expect(verifyUrl).toContain('/v1/tickets/tkt-001/verify');
		expect(checkinUrl).toContain('/v1/tickets/tkt-001/check-in');
	});

	it('returns error for refunded ticket without calling check-in', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(
			mockFetchJsonResponse(200, { status: 'refunded', message: 'This ticket has been refunded' })
		);

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { ticket_id: 'tkt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.status).toBe('error');
		expect(data.message).toContain('refunded');

		// Only verify was called, not check-in
		expect(spy).toHaveBeenCalledTimes(1);
	});

	it('returns 503 on network error', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network fail'));

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { ticket_id: 'tkt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});
});
