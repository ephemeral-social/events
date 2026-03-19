import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D2: Event creation route tests

describe('POST /api/events/create', () => {
	let handler: typeof import('../../routes/api/events/create/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/create/+server');
		handler = mod.POST;
	});

	async function createAuthenticatedEvent(body: Record<string, unknown>, fetchResponse?: Response) {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:test-sid', JSON.stringify(session));
		cookies.set('eph_session', 'test-sid');

		if (fetchResponse) {
			mockFetch(fetchResponse);
		}

		const event = createMockRequestEvent({
			method: 'POST',
			body,
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});
		return handler(event as any);
	}

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			body: { title: 'My Event' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
		const data = await response.json();
		expect(data.error).toBe('Not authenticated');
	});

	it('returns 503 when KV is missing', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			body: { title: 'My Event' },
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } } as any
		});
		// Override platform to have no SESSIONS
		(event.platform as any).env.SESSIONS = undefined;

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});

	it('proxies body to POST /v1/events and returns 201', async () => {
		const eventBody = { title: 'Party Time', start_time: '2025-06-15T20:00:00Z' };
		const spy = mockFetch(mockFetchJsonResponse(201, { event_id: 'evt-new', ...eventBody }));

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:test-sid', JSON.stringify(session));
		cookies.set('eph_session', 'test-sid');

		const event = createMockRequestEvent({
			method: 'POST',
			body: eventBody,
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(201);

		const data = await response.json();
		expect(data.event_id).toBe('evt-new');

		// Verify backend was called with /v1/events
		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events');
	});

	it('forwards backend errors with code', async () => {
		const response = await createAuthenticatedEvent(
			{ title: '' },
			mockFetchJsonResponse(400, {
				error: { code: 'VALIDATION_ERROR', message: 'Title is required' }
			})
		);

		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe('Title is required');
		expect(data.code).toBe('VALIDATION_ERROR');
	});

	it('forwards theme/mode/accent_hue fields to backend', async () => {
		const eventBody = {
			title: 'Themed Party',
			start_time: '2025-06-15T20:00:00Z',
			theme: 'midnight',
			mode: 'dark',
			accent_hue: 245
		};
		const spy = mockFetch(
			mockFetchJsonResponse(201, { event_id: 'evt-themed', ...eventBody })
		);

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:test-sid', JSON.stringify(session));
		cookies.set('eph_session', 'test-sid');

		const event = createMockRequestEvent({
			method: 'POST',
			body: eventBody,
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(201);

		// Verify theme fields were forwarded in the request body
		expect(spy).toHaveBeenCalled();
		const [, opts] = spy.mock.calls[0];
		const sentBody = JSON.parse(opts.body);
		expect(sentBody.theme).toBe('midnight');
		expect(sentBody.mode).toBe('dark');
		expect(sentBody.accent_hue).toBe(245);
	});

	it('forwards null accent_hue when not provided', async () => {
		const eventBody = {
			title: 'Default Theme Party',
			start_time: '2025-06-15T20:00:00Z',
			theme: 'forest',
			mode: 'dark'
		};
		const spy = mockFetch(
			mockFetchJsonResponse(201, { event_id: 'evt-default', ...eventBody })
		);

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:test-sid', JSON.stringify(session));
		cookies.set('eph_session', 'test-sid');

		const event = createMockRequestEvent({
			method: 'POST',
			body: eventBody,
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(201);

		const [, opts] = spy.mock.calls[0];
		const sentBody = JSON.parse(opts.body);
		expect(sentBody.theme).toBe('forest');
		expect(sentBody.mode).toBe('dark');
		expect(sentBody.accent_hue).toBeUndefined();
	});

	it('returns 503 on unexpected error', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:test-sid', JSON.stringify(session));
		cookies.set('eph_session', 'test-sid');

		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network fail'));

		const event = createMockRequestEvent({
			method: 'POST',
			body: { title: 'Test' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});
});
