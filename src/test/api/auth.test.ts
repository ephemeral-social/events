import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D1: Auth route tests — send-code, verify-code, logout

describe('POST /api/auth/send-code', () => {
	let handler: typeof import('../../routes/api/auth/send-code/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/auth/send-code/+server');
		handler = mod.POST;
	});

	it('returns 400 when phone is missing', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			body: {}
		});

		const response = await handler(event as any);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe('Phone number is required');
	});

	it('returns 400 when phone is not a string', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			body: { phone: 123 }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe('Phone number is required');
	});

	it('transforms phone to phone_e164 in backend request', async () => {
		const spy = mockFetch(mockFetchJsonResponse(200, { verification_id: 'vid-123' }));

		const event = createMockRequestEvent({
			method: 'POST',
			body: { phone: '+15551234567' }
		});

		await handler(event as any);

		expect(spy).toHaveBeenCalledOnce();
		const [url, opts] = spy.mock.calls[0];
		expect(url).toBe('http://127.0.0.1:8787/v1/auth/phone/send-code');
		expect(opts.method).toBe('POST');
		const sentBody = JSON.parse(opts.body as string);
		expect(sentBody.phone_e164).toBe('+15551234567');
		expect(sentBody.phone_country_code).toBe('1');
		expect(sentBody.phone_national_number).toBe('5551234567');
		expect(sentBody.phone).toBeUndefined();
		expect(sentBody.phone_number).toBeUndefined();
	});

	it('returns verification_id on success', async () => {
		mockFetch(mockFetchJsonResponse(200, { verification_id: 'vid-456' }));

		const event = createMockRequestEvent({
			method: 'POST',
			body: { phone: '+15551234567' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.verification_id).toBe('vid-456');
	});

	it('returns generic error message on backend failure', async () => {
		mockFetch(mockFetchJsonResponse(429, { message: 'Rate limit exceeded' }));

		const event = createMockRequestEvent({
			method: 'POST',
			body: { phone: '+15551234567' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(429);
		const data = await response.json();
		// S-I4: Never forward raw backend error messages
		expect(data.error).toBe('Unable to send verification code');
	});

	it('returns 503 on network error', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network fail'));

		const event = createMockRequestEvent({
			method: 'POST',
			body: { phone: '+15551234567' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(503);
		const data = await response.json();
		expect(data.error).toBe('Service unavailable');
	});
});

describe('POST /api/auth/verify-code', () => {
	let handler: typeof import('../../routes/api/auth/verify-code/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/auth/verify-code/+server');
		handler = mod.POST;
	});

	it('returns 400 when verification_id is missing', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			body: { code: '123456' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe('verification_id and code are required');
	});

	it('returns 400 when code is missing', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			body: { verification_id: 'vid-123' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe('verification_id and code are required');
	});

	it('proxies to backend verify-code endpoint', async () => {
		const spy = mockFetch(
			mockFetchJsonResponse(200, {
				access_token: 'at-123',
				refresh_token: 'rt-123',
				user: { user_id: 'u-001', display_name: 'Alice' }
			})
		);

		const kv = createMockKV();
		const cookies = createMockCookies();
		const event = createMockRequestEvent({
			method: 'POST',
			body: { verification_id: 'vid-123', code: '123456' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		await handler(event as any);

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toBe('http://127.0.0.1:8787/v1/auth/phone/verify-code');
	});

	it('creates KV session and sets HttpOnly cookie on success', async () => {
		mockFetch(
			mockFetchJsonResponse(200, {
				access_token: 'at-123',
				refresh_token: 'rt-123',
				user: { user_id: 'u-001', display_name: 'Alice' }
			})
		);

		const kv = createMockKV();
		const cookies = createMockCookies();
		const event = createMockRequestEvent({
			method: 'POST',
			body: { verification_id: 'vid-123', code: '123456' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);

		// Cookie should be set
		const sessionCookie = cookies.get('eph_session');
		expect(sessionCookie).toBeTruthy();

		// KV should have session data
		const sessionData = await kv.get(`session:${sessionCookie}`);
		expect(sessionData).toBeTruthy();
		const parsed = JSON.parse(sessionData!);
		expect(parsed.userId).toBe('u-001');
		expect(parsed.accessToken).toBe('at-123');
		expect(parsed.refreshToken).toBe('rt-123');
		expect(parsed.displayName).toBe('Alice');

		// Cookie should be HttpOnly
		const opts = cookies.getSetOptions('eph_session');
		expect(opts?.httpOnly).toBe(true);
	});

	it('returns success with user data (no user_id exposed)', async () => {
		mockFetch(
			mockFetchJsonResponse(200, {
				access_token: 'at-123',
				refresh_token: 'rt-123',
				user: { user_id: 'u-001', display_name: 'Alice' }
			})
		);

		const kv = createMockKV();
		const cookies = createMockCookies();
		const event = createMockRequestEvent({
			method: 'POST',
			body: { verification_id: 'vid-123', code: '123456' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.user.display_name).toBe('Alice');
		// user_id should NOT be exposed to the client
		expect(data.user.user_id).toBeUndefined();
	});

	it('returns 503 when KV (SESSIONS) is missing', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			body: { verification_id: 'vid-123', code: '123456' },
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } } as any
		});
		(event.platform as any).env.SESSIONS = undefined;

		const response = await handler(event as any);
		expect(response.status).toBe(503);
		const data = await response.json();
		expect(data.error).toBe('Service unavailable');
	});

	it('returns 502 when backend returns incomplete data', async () => {
		mockFetch(mockFetchJsonResponse(200, { access_token: 'at-123' }));

		const event = createMockRequestEvent({
			method: 'POST',
			body: { verification_id: 'vid-123', code: '123456' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(502);
		const data = await response.json();
		expect(data.error).toBe('Invalid response from auth service');
	});

	it('forwards backend error on invalid code', async () => {
		mockFetch(mockFetchJsonResponse(401, { message: 'Invalid verification code' }));

		const event = createMockRequestEvent({
			method: 'POST',
			body: { verification_id: 'vid-123', code: '000000' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
		const data = await response.json();
		expect(data.error).toBe('Invalid verification code');
	});

	it('returns 503 on network error', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network fail'));

		const event = createMockRequestEvent({
			method: 'POST',
			body: { verification_id: 'vid-123', code: '123456' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(503);
		const data = await response.json();
		expect(data.error).toBe('Service unavailable');
	});
});

describe('POST /api/auth/logout', () => {
	let handler: typeof import('../../routes/api/auth/logout/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/auth/logout/+server');
		handler = mod.POST;
	});

	it('destroys session from KV and clears cookie', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		const session = createMockSession();

		await kv.put('session:test-sid', JSON.stringify(session));
		cookies.set('eph_session', 'test-sid');

		const event = createMockRequestEvent({
			method: 'POST',
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);

		// Session should be removed from KV
		const raw = await kv.get('session:test-sid');
		expect(raw).toBeNull();

		// Cookie should be deleted
		expect(cookies.has('eph_session')).toBe(false);
	});

	it('returns success even without active session', async () => {
		const event = createMockRequestEvent({ method: 'POST' });

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);
	});
});
