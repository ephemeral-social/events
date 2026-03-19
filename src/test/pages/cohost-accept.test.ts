import { describe, it, expect } from 'vitest';
import { load } from '../../routes/e/[slug]/cohost/[token]/+page.server';
import { createMockSession, createMockPlatform } from '../helpers';
import { createMockCookies } from '../mocks/cookies';
import { createMockKV } from '../mocks/kv';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

describe('e/[slug]/cohost/[token]/+page.server.ts load', () => {
	it('returns slug, token, and eventId for authenticated user', async () => {
		mockFetch(mockFetchJsonResponse(200, { event: { event_id: 'evt-party' } }));

		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:sid-cohost', JSON.stringify(session));
		cookies.set('eph_session', 'sid-cohost');
		const platform = createMockPlatform({ kv });

		const result = await load({
			params: { slug: 'party-event', token: 'invite-abc-123' },
			cookies,
			platform
		} as any);

		expect(result).toEqual({
			slug: 'party-event',
			token: 'invite-abc-123',
			eventId: 'evt-party'
		});
	});

	it('redirects with cohost_token when unauthenticated', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const platform = createMockPlatform({ kv });

		try {
			await load({
				params: { slug: 'party-event', token: 'invite-xyz-789' },
				cookies,
				platform
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/e/party-event?cohost_token=invite-xyz-789');
		}
	});

	it('redirects with cohost_token when no KV', async () => {
		const cookies = createMockCookies();

		try {
			await load({
				params: { slug: 'party-event', token: 'invite-no-kv' },
				cookies,
				platform: { env: {} }
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/e/party-event?cohost_token=invite-no-kv');
		}
	});
});
