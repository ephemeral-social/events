import { describe, it, expect, vi } from 'vitest';
import { load } from '../../routes/e/[slug]/+page.server';
import {
	createMockSession,
	createMockPlatform,
	createMockEventData,
	createMockTombstone,
	createMockRsvp
} from '../helpers';
import { createMockCookies } from '../mocks/cookies';
import { createMockKV } from '../mocks/kv';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

describe('e/[slug]/+page.server.ts load', () => {
	it('returns event data and slug for a valid event', async () => {
		const eventData = createMockEventData();
		mockFetch(mockFetchJsonResponse(200, eventData));

		const cookies = createMockCookies();
		const result = await load({
			params: { slug: 'test-event' },
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } },
			cookies
		} as any);

		expect(result).toEqual({
			eventData,
			slug: 'test-event',
			myRsvp: null,
			isHost: false,
			isAuthenticated: false,
			displayName: null,
			needsTicketingSetup: false
		});
	});

	it('returns tombstone data with myRsvp: null', async () => {
		const tombstone = createMockTombstone();
		mockFetch(mockFetchJsonResponse(200, tombstone));

		const cookies = createMockCookies();
		const result = await load({
			params: { slug: 'deleted-event' },
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } },
			cookies
		} as any);

		expect(result).toEqual({
			eventData: tombstone,
			slug: 'deleted-event',
			myRsvp: null,
			isHost: false,
			isAuthenticated: false
		});
	});

	it('returns myRsvp when authenticated user has RSVP', async () => {
		const eventData = createMockEventData({ event: { event_id: 'evt-999' } });
		const rsvp = createMockRsvp({ status: 'going' });

		const spy = vi.spyOn(globalThis, 'fetch');
		spy.mockImplementation(async (input) => {
			const url = typeof input === 'string' ? input : (input as Request).url;
			if (url.includes('/v1/events/by-slug/')) {
				return mockFetchJsonResponse(200, eventData);
			}
			if (url.includes('/my-rsvp')) {
				return mockFetchJsonResponse(200, rsvp);
			}
			return mockFetchJsonResponse(404, {});
		});

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:sid-rsvp', JSON.stringify(session));
		cookies.set('eph_session', 'sid-rsvp');
		const platform = createMockPlatform({ kv });

		const result = await load({
			params: { slug: 'rsvp-event' },
			platform,
			cookies
		} as any);

		expect((result as any).myRsvp).toEqual(rsvp);
		expect((result as any).slug).toBe('rsvp-event');
	});

	it('returns myRsvp: null when authenticated user has no RSVP (404)', async () => {
		const eventData = createMockEventData({ event: { event_id: 'evt-no-rsvp' } });

		const spy = vi.spyOn(globalThis, 'fetch');
		spy.mockImplementation(async (input) => {
			const url = typeof input === 'string' ? input : (input as Request).url;
			if (url.includes('/v1/events/by-slug/')) {
				return mockFetchJsonResponse(200, eventData);
			}
			if (url.includes('/my-rsvp')) {
				return mockFetchJsonResponse(404, {
					error: { code: 'NOT_FOUND', message: 'No RSVP found' }
				});
			}
			return mockFetchJsonResponse(404, {});
		});

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:sid-no-rsvp', JSON.stringify(session));
		cookies.set('eph_session', 'sid-no-rsvp');
		const platform = createMockPlatform({ kv });

		const result = await load({
			params: { slug: 'no-rsvp-event' },
			platform,
			cookies
		} as any);

		expect((result as any).myRsvp).toBeNull();
	});

	it('silently ignores non-404 RSVP errors', async () => {
		const eventData = createMockEventData({ event: { event_id: 'evt-err' } });

		const spy = vi.spyOn(globalThis, 'fetch');
		spy.mockImplementation(async (input) => {
			const url = typeof input === 'string' ? input : (input as Request).url;
			if (url.includes('/v1/events/by-slug/')) {
				return mockFetchJsonResponse(200, eventData);
			}
			if (url.includes('/my-rsvp')) {
				return mockFetchJsonResponse(500, {
					error: { code: 'SERVER_ERROR', message: 'Internal error' }
				});
			}
			return mockFetchJsonResponse(404, {});
		});

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:sid-err', JSON.stringify(session));
		cookies.set('eph_session', 'sid-err');
		const platform = createMockPlatform({ kv });

		const result = await load({
			params: { slug: 'err-event' },
			platform,
			cookies
		} as any);

		expect((result as any).myRsvp).toBeNull();
		expect((result as any).eventData).toEqual(eventData);
	});

	it('throws 404 for unknown slug', async () => {
		mockFetch(mockFetchJsonResponse(404, { error: 'Not found' }));

		const cookies = createMockCookies();

		try {
			await load({
				params: { slug: 'nonexistent' },
				platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } },
				cookies
			} as any);
			expect.fail('Should have thrown 404');
		} catch (e: any) {
			expect(e.status).toBe(404);
			expect(e.body?.message).toBe('Event not found');
		}
	});

	it('throws 503 for network errors', async () => {
		const spy = vi.spyOn(globalThis, 'fetch');
		spy.mockRejectedValue(new TypeError('fetch failed'));

		const cookies = createMockCookies();

		try {
			await load({
				params: { slug: 'network-error' },
				platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } },
				cookies
			} as any);
			expect.fail('Should have thrown 503');
		} catch (e: any) {
			expect(e.status).toBe(503);
			expect(e.body?.message).toBe('Service unavailable');
		}
	});

	it('re-throws SvelteKit errors (preserves status property objects)', async () => {
		mockFetch(mockFetchJsonResponse(500, { error: 'Server error' }));

		const cookies = createMockCookies();

		try {
			await load({
				params: { slug: 'server-error' },
				platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } },
				cookies
			} as any);
			expect.fail('Should have thrown');
		} catch (e: any) {
			expect(e.status).toBe(500);
			expect(e.body?.message).toBe('Failed to load event');
		}
	});
});
