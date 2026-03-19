import { describe, it, expect } from 'vitest';
import { load } from '../../routes/e/[slug]/edit/+page.server';
import { createMockSession, createMockPlatform, createMockEventData } from '../helpers';
import { createMockCookies } from '../mocks/cookies';
import { createMockKV } from '../mocks/kv';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

describe('e/[slug]/edit/+page.server.ts load', () => {
	it('redirects to /e/{slug} when unauthenticated', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const platform = createMockPlatform({ kv });

		try {
			await load({
				params: { slug: 'my-event' },
				cookies,
				platform
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/e/my-event');
		}
	});

	it('returns event data for authenticated host', async () => {
		const eventData = createMockEventData({
			event: { event_id: 'evt-edit', title: 'Editable Event' }
		});
		mockFetch(mockFetchJsonResponse(200, eventData));

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:sid-edit', JSON.stringify(session));
		cookies.set('eph_session', 'sid-edit');
		const platform = createMockPlatform({ kv });

		const result = await load({
			params: { slug: 'editable-event' },
			cookies,
			platform
		} as any);

		expect(result).toEqual({
			event: eventData.event,
			slug: 'editable-event'
		});
	});

	it('throws 404 when event not found', async () => {
		mockFetch(mockFetchJsonResponse(404, { error: 'Not found' }));

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:sid-edit-404', JSON.stringify(session));
		cookies.set('eph_session', 'sid-edit-404');
		const platform = createMockPlatform({ kv });

		try {
			await load({
				params: { slug: 'nonexistent' },
				cookies,
				platform
			} as any);
			expect.fail('Should have thrown 404');
		} catch (e: any) {
			expect(e.status).toBe(404);
			expect(e.body?.message).toBe('Event not found');
		}
	});
});
