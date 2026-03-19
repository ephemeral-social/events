import { describe, it, expect, afterEach, vi } from 'vitest';
import { load } from '../../routes/e/[slug]/check-in/+page.server';
import { createMockSession, createMockPlatform, createMockEventData } from '../helpers';
import { createMockCookies } from '../mocks/cookies';
import { createMockKV } from '../mocks/kv';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

describe('e/[slug]/check-in/+page.server.ts load', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('redirects to /e/{slug} when unauthenticated', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const platform = createMockPlatform({ kv });

		try {
			await load({
				params: { slug: 'check-event' },
				url: new URL('http://localhost/e/check-event/check-in'),
				cookies,
				platform
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/e/check-event');
		}
	});

	it('returns eventId for authenticated host', async () => {
		// Session userId must match host.user_id for the host check to pass
		const session = createMockSession({ userId: 'host-checkin' });
		const eventData = createMockEventData({
			event: { event_id: 'evt-checkin-123', title: 'Checkin Test Event' },
			host: { user_id: 'host-checkin' }
		});
		mockFetch(mockFetchJsonResponse(200, eventData));

		const kv = createMockKV();
		const cookies = createMockCookies();
		await kv.put('session:sid-checkin', JSON.stringify(session));
		cookies.set('eph_session', 'sid-checkin');
		const platform = createMockPlatform({ kv });

		const result = await load({
			params: { slug: 'check-event' },
			url: new URL('http://localhost/e/check-event/check-in'),
			cookies,
			platform
		} as any);

		expect(result).toEqual({
			slug: 'check-event',
			eventId: 'evt-checkin-123',
			eventTitle: 'Checkin Test Event',
			isTokenAuth: false
		});
	});

	it('redirects to /e/{slug} when event not found', async () => {
		mockFetch(mockFetchJsonResponse(404, { error: 'Not found' }));

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:sid-checkin-404', JSON.stringify(session));
		cookies.set('eph_session', 'sid-checkin-404');
		const platform = createMockPlatform({ kv });

		try {
			await load({
				params: { slug: 'missing-event' },
				url: new URL('http://localhost/e/missing-event/check-in'),
				cookies,
				platform
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/e/missing-event');
		}
	});
});
