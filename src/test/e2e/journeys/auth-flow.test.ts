import { describe, it, expect, beforeAll } from 'vitest';
import {
	authenticateTestUser,
	createSessionForUser,
	createE2EPlatform,
	callApiRoute
} from '../helpers';
import { createMockCookies } from '../../mocks/cookies';
import { createMockKV } from '../../mocks/kv';

describe('Journey 2: Auth & Session Flow', () => {
	it('authenticates via backend directly (dev mode)', async () => {
		const result = await authenticateTestUser('+15550002001');
		expect(result.accessToken).toBeTruthy();
		expect(result.refreshToken).toBeTruthy();
		expect(result.userId).toBeTruthy();
	});

	it('send-code via SvelteKit route sends phone_e164 field to backend', async () => {
		const { POST } = await import('../../../routes/api/auth/send-code/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: { phone: '+15550002002' },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
		const data = (await response.json()) as any;
		expect(data.verification_id).toBeDefined();
	});

	it('verifies code and creates session via SvelteKit route', async () => {
		// First authenticate directly to get a verification_id
		const phone = '+15550002003';
		const nationalNumber = phone.slice(2);

		const sendRes = await fetch('http://127.0.0.1:8787/v1/auth/phone/send-code', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				phone_e164: phone,
				phone_country_code: '1',
				phone_national_number: nationalNumber
			})
		});

		const sendData = (await sendRes.json()) as { verification_id: string };

		// Now verify via SvelteKit route
		const { POST } = await import('../../../routes/api/auth/verify-code/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: {
				verification_id: sendData.verification_id,
				code: '123456'
			},
			kv,
			cookies
		});

		expect(response.status).toBe(200);
		const data = (await response.json()) as any;
		expect(data.success).toBe(true);
		expect(data.user).toBeDefined();

		// Verify session was created in KV
		const sessionCookie = cookies.get('eph_session');
		expect(sessionCookie).toBeTruthy();
	});

	it('session persists - layout returns user', async () => {
		const auth = await authenticateTestUser('+15550002004');
		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, auth);

		const { load } = await import('../../../routes/+layout.server');
		const result = await load({
			cookies,
			platform: createE2EPlatform(kv)
		} as any);

		expect(result.user).not.toBeNull();
		expect(result.user?.userId).toBe(auth.userId);
	});

	it('logout destroys session', async () => {
		const auth = await authenticateTestUser('+15550002005');
		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, auth);

		const { POST } = await import('../../../routes/api/auth/logout/+server');

		const response = await callApiRoute(POST, {
			method: 'POST',
			kv,
			cookies
		});

		expect(response.status).toBe(200);
		const data = (await response.json()) as any;
		expect(data.success).toBe(true);
	});

	it('session gone after logout - layout returns null', async () => {
		const auth = await authenticateTestUser('+15550002006');
		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, auth);

		// Logout
		const { POST } = await import('../../../routes/api/auth/logout/+server');
		await callApiRoute(POST, { method: 'POST', kv, cookies });

		// Check layout
		const { load } = await import('../../../routes/+layout.server');
		const result = await load({
			cookies,
			platform: createE2EPlatform(kv)
		} as any);

		expect(result.user).toBeNull();
	});

	it('re-auth creates new session', async () => {
		const phone = '+15550002007';
		const auth1 = await authenticateTestUser(phone);
		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, auth1);

		// Logout
		const { POST: logout } = await import('../../../routes/api/auth/logout/+server');
		await callApiRoute(logout, { method: 'POST', kv, cookies });

		// Re-authenticate
		const auth2 = await authenticateTestUser(phone);
		await createSessionForUser(kv, cookies, auth2);

		// Verify new session works
		const { load } = await import('../../../routes/+layout.server');
		const result = await load({
			cookies,
			platform: createE2EPlatform(kv)
		} as any);

		expect(result.user).not.toBeNull();
		expect(result.user?.userId).toBe(auth2.userId);
	});
});
