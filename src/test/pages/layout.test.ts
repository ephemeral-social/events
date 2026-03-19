import { describe, it, expect, vi } from 'vitest';
import { load } from '../../routes/+layout.server';
import { createMockSession, createMockPlatform } from '../helpers';
import { createMockCookies } from '../mocks/cookies';
import { createMockKV } from '../mocks/kv';

describe('+layout.server.ts load', () => {
	it('returns user: null when platform is undefined', async () => {
		const cookies = createMockCookies();
		const result = await load({
			cookies,
			platform: undefined
		} as any);

		expect(result).toEqual({ user: null, tawkWidgetId: '' });
	});

	it('returns user: null when SESSIONS KV is missing', async () => {
		const cookies = createMockCookies();
		const result = await load({
			cookies,
			platform: { env: {} }
		} as any);

		expect(result).toEqual({ user: null, tawkWidgetId: '' });
	});

	it('returns user: null when no session cookie exists', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const platform = createMockPlatform({ kv });

		const result = await load({ cookies, platform } as any);

		expect(result).toEqual({ user: null, tawkWidgetId: '' });
	});

	it('returns user with userId and displayName for valid session', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession({ userId: 'user-123', displayName: 'Alice' });
		await kv.put('session:sid-abc', JSON.stringify(session));
		cookies.set('eph_session', 'sid-abc');
		const platform = createMockPlatform({ kv });

		const result = await load({ cookies, platform } as any);

		expect(result).toEqual({
			user: { userId: 'user-123', displayName: 'Alice', firstName: undefined, lastName: undefined },
			tawkWidgetId: ''
		});
	});

	it('returns user: null when session is expired', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession({ expiresAt: Date.now() - 1000 });
		await kv.put('session:sid-expired', JSON.stringify(session));
		cookies.set('eph_session', 'sid-expired');
		const platform = createMockPlatform({ kv });

		const result = await load({ cookies, platform } as any);

		expect(result).toEqual({ user: null, tawkWidgetId: '' });
	});
});
