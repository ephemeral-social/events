import { describe, it, expect } from 'vitest';
import { load } from '../../routes/create/+page.server';
import { createMockSession, createMockPlatform } from '../helpers';
import { createMockCookies } from '../mocks/cookies';
import { createMockKV } from '../mocks/kv';

describe('create/+page.server.ts load', () => {
	it('redirects to /?auth=required when no KV', async () => {
		const cookies = createMockCookies();

		try {
			await load({
				cookies,
				platform: { env: {} }
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/?auth=required');
		}
	});

	it('redirects to /?auth=required when unauthenticated', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const platform = createMockPlatform({ kv });

		try {
			await load({ cookies, platform } as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/?auth=required');
		}
	});

	it('returns user data for authenticated users', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession({ userId: 'user-creator', displayName: 'Creator' });
		await kv.put('session:sid-create', JSON.stringify(session));
		cookies.set('eph_session', 'sid-create');
		const platform = createMockPlatform({ kv });

		const result = await load({ cookies, platform } as any);

		expect(result).toEqual({
			user: { userId: 'user-creator', displayName: 'Creator' }
		});
	});
});
