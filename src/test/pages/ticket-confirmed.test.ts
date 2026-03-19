import { describe, it, expect } from 'vitest';
import { load } from '../../routes/e/[slug]/ticket-confirmed/+page.server';
import { createMockSession, createMockPlatform } from '../helpers';
import { createMockCookies } from '../mocks/cookies';
import { createMockKV } from '../mocks/kv';

describe('e/[slug]/ticket-confirmed/+page.server.ts load', () => {
	it('redirects to /e/{slug} when no KV', async () => {
		const cookies = createMockCookies();

		try {
			await load({
				params: { slug: 'ticket-event' },
				cookies,
				platform: { env: {} }
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/e/ticket-event');
		}
	});

	it('redirects to /e/{slug} when unauthenticated', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const platform = createMockPlatform({ kv });

		try {
			await load({
				params: { slug: 'ticket-event' },
				cookies,
				platform
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/e/ticket-event');
		}
	});

	it('returns { slug } for authenticated user', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();
		await kv.put('session:sid-ticket', JSON.stringify(session));
		cookies.set('eph_session', 'sid-ticket');
		const platform = createMockPlatform({ kv });

		const result = await load({
			params: { slug: 'ticket-event' },
			cookies,
			platform
		} as any);

		expect(result).toEqual({ slug: 'ticket-event' });
	});
});
