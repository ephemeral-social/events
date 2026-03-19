import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D6: Costs route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('GET /api/events/[eventId]/costs', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/costs/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/costs/+server');
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

	it('returns cost data on success', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const costData = { total: 150.0, per_person: 15.0, items: [] };
		mockFetch(mockFetchJsonResponse(200, costData));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.total).toBe(150.0);
	});
});

describe('POST /api/events/[eventId]/costs', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/costs/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/costs/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { description: 'Food', amount: 50 }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('proxies body and returns 201', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(
			mockFetchJsonResponse(201, { cost_id: 'cost-001', description: 'Food', amount: 50 })
		);

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { description: 'Food', amount: 50 },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(201);
		const data = await response.json();
		expect(data.cost_id).toBe('cost-001');

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/costs');
	});
});
