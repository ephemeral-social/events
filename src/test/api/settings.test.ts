import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D13: Settings route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('PUT /api/events/[eventId]/settings', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/settings/+server').PUT;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/settings/+server');
		handler = mod.PUT;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'PUT',
			params: { eventId: 'evt-001' },
			body: { show_guest_list: true }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('proxies body to PUT /v1/events/{eventId}/settings', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(200, { show_guest_list: true, updated: true }));

		const event = createMockRequestEvent({
			method: 'PUT',
			params: { eventId: 'evt-001' },
			body: { show_guest_list: true },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.updated).toBe(true);

		expect(spy).toHaveBeenCalled();
		const [url, opts] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/settings');
		expect(opts.method).toBe('PUT');
	});

	it('forwards theme/mode/accent_hue to backend settings endpoint', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(mockFetchJsonResponse(200, { updated: true }));

		const event = createMockRequestEvent({
			method: 'PUT',
			params: { eventId: 'evt-001' },
			body: { theme: 'ember', mode: 'dark', accent_hue: 25 },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);

		expect(spy).toHaveBeenCalled();
		const [, opts] = spy.mock.calls[0];
		const sentBody = JSON.parse(opts.body);
		expect(sentBody.theme).toBe('ember');
		expect(sentBody.mode).toBe('dark');
		expect(sentBody.accent_hue).toBe(25);
	});

	it('handles backend errors', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		mockFetch(
			mockFetchJsonResponse(403, {
				error: { code: 'NOT_HOST', message: 'Only hosts can change settings' }
			})
		);

		const event = createMockRequestEvent({
			method: 'PUT',
			params: { eventId: 'evt-001' },
			body: { show_guest_list: true },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(403);
		const data = await response.json();
		expect(data.error).toBe('Only hosts can change settings');
	});
});
