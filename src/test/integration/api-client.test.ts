import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, apiRequest, createApiContext } from '$lib/server/api';
import * as sessionModule from '$lib/server/session';
import {
	mockFetch,
	mockFetchSequence,
	mockFetchJsonResponse,
	mockFetchTextResponse,
	expectFetchCalledWith
} from '../mocks/fetch';
import { createMockKV, MockKV } from '../mocks/kv';
import { createMockCookies, MockCookies } from '../mocks/cookies';
import { createMockPlatform, createMockSession } from '../helpers';

describe('ApiError', () => {
	it('has correct status, code, and message properties', () => {
		const err = new ApiError(404, 'NOT_FOUND', 'Resource not found');

		expect(err.status).toBe(404);
		expect(err.code).toBe('NOT_FOUND');
		expect(err.message).toBe('Resource not found');
	});

	it('has name set to ApiError', () => {
		const err = new ApiError(500, 'SERVER_ERROR', 'Internal error');
		expect(err.name).toBe('ApiError');
	});
});

describe('apiRequest', () => {
	const baseCtx = {
		backendUrl: 'http://127.0.0.1:8787',
		accessToken: 'test-access-token'
	};

	it('sends GET with Authorization: Bearer header', async () => {
		const spy = mockFetch(mockFetchJsonResponse(200, { ok: true }));

		await apiRequest(baseCtx, '/v1/events');

		expectFetchCalledWith(spy, '/v1/events');
		const [, opts] = spy.mock.calls[0];
		expect(opts.method).toBe('GET');
		expect(opts.headers).toHaveProperty('Authorization', 'Bearer test-access-token');
	});

	it('sends POST with JSON body and Content-Type header', async () => {
		const spy = mockFetch(mockFetchJsonResponse(200, { created: true }));

		await apiRequest(baseCtx, '/v1/events', {
			method: 'POST',
			body: { title: 'My Event' }
		});

		const [, opts] = spy.mock.calls[0];
		expect(opts.method).toBe('POST');
		expect(opts.headers).toHaveProperty('Content-Type', 'application/json');
		expect(opts.body).toBe(JSON.stringify({ title: 'My Event' }));
	});

	it('does NOT set Content-Type when no body', async () => {
		const spy = mockFetch(mockFetchJsonResponse(200, { ok: true }));

		await apiRequest(baseCtx, '/v1/events');

		const [, opts] = spy.mock.calls[0];
		expect(opts.headers).not.toHaveProperty('Content-Type');
	});

	it('returns parsed JSON for 200', async () => {
		mockFetch(mockFetchJsonResponse(200, { event_id: 'evt-001', title: 'Party' }));

		const result = await apiRequest<{ event_id: string; title: string }>(
			baseCtx,
			'/v1/events/evt-001'
		);

		expect(result).toEqual({ event_id: 'evt-001', title: 'Party' });
	});

	it('returns undefined for 204 No Content', async () => {
		mockFetch(new Response(null, { status: 204 }));

		const result = await apiRequest(baseCtx, '/v1/events/evt-001', { method: 'DELETE' });

		expect(result).toBeUndefined();
	});

	it('throws ApiError for 4xx with parsed error body', async () => {
		mockFetch(() =>
			mockFetchJsonResponse(404, {
				error: { code: 'NOT_FOUND', message: 'Event not found' }
			})
		);

		try {
			await apiRequest(baseCtx, '/v1/events/bad-id');
			expect.unreachable('Expected ApiError to be thrown');
		} catch (e) {
			expect(e).toBeInstanceOf(ApiError);
			const err = e as ApiError;
			expect(err.status).toBe(404);
			expect(err.code).toBe('NOT_FOUND');
			expect(err.message).toBe('Event not found');
		}
	});

	it('throws ApiError for 5xx', async () => {
		mockFetch(
			mockFetchJsonResponse(500, {
				error: { code: 'INTERNAL_ERROR', message: 'Server crashed' }
			})
		);

		await expect(apiRequest(baseCtx, '/v1/events')).rejects.toThrow(ApiError);
	});

	it('throws ApiError with fallback message for non-JSON error responses', async () => {
		mockFetch(mockFetchTextResponse(502, 'Bad Gateway'));

		try {
			await apiRequest(baseCtx, '/v1/events');
			expect.unreachable('Expected ApiError to be thrown');
		} catch (e) {
			const err = e as ApiError;
			expect(err.status).toBe(502);
			expect(err.code).toBe('API_ERROR');
			expect(err.message).toBe('API error: 502');
		}
	});

	describe('auto-refresh on 401', () => {
		let kv: MockKV;
		let cookies: MockCookies;

		beforeEach(() => {
			kv = createMockKV();
			cookies = createMockCookies({ eph_session: 'sess-123' });
		});

		it('calls /v1/auth/refresh and retries original request with new token', async () => {
			const spy = mockFetchSequence([
				// 1st call: original request returns 401
				mockFetchJsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Expired' } }),
				// 2nd call: refresh endpoint
				mockFetchJsonResponse(200, { access_token: 'new-access-token' }),
				// 3rd call: retried original request
				mockFetchJsonResponse(200, { data: 'success' })
			]);

			const ctx = {
				backendUrl: 'http://127.0.0.1:8787',
				accessToken: 'old-token',
				refreshToken: 'refresh-tok',
				kv: kv as unknown as KVNamespace,
				cookies
			};

			// Seed session in KV so updateSession can find it
			await kv.put(
				'session:sess-123',
				JSON.stringify({
					userId: 'user-001',
					accessToken: 'old-token',
					refreshToken: 'refresh-tok',
					expiresAt: Date.now() + 86400000
				})
			);

			const result = await apiRequest(ctx, '/v1/events');

			expect(result).toEqual({ data: 'success' });
			expect(spy).toHaveBeenCalledTimes(3);

			// Verify refresh call
			const [refreshUrl, refreshOpts] = spy.mock.calls[1];
			expect(refreshUrl).toBe('http://127.0.0.1:8787/v1/auth/refresh');
			expect(refreshOpts.method).toBe('POST');
			expect(JSON.parse(refreshOpts.body as string)).toEqual({
				refresh_token: 'refresh-tok'
			});

			// Verify retried call uses new token
			const [, retryOpts] = spy.mock.calls[2];
			expect(retryOpts.headers).toHaveProperty('Authorization', 'Bearer new-access-token');
		});

		it('updates session with new tokens via updateSession', async () => {
			const updateSessionSpy = vi.spyOn(sessionModule, 'updateSession');

			mockFetchSequence([
				mockFetchJsonResponse(401, { error: { code: 'UNAUTHORIZED' } }),
				mockFetchJsonResponse(200, {
					access_token: 'new-access',
					refresh_token: 'new-refresh'
				}),
				mockFetchJsonResponse(200, { ok: true })
			]);

			const ctx = {
				backendUrl: 'http://127.0.0.1:8787',
				accessToken: 'old-token',
				refreshToken: 'refresh-tok',
				kv: kv as unknown as KVNamespace,
				cookies
			};

			await kv.put(
				'session:sess-123',
				JSON.stringify({
					userId: 'user-001',
					accessToken: 'old-token',
					refreshToken: 'refresh-tok',
					expiresAt: Date.now() + 86400000
				})
			);

			await apiRequest(ctx, '/v1/events');

			expect(updateSessionSpy).toHaveBeenCalledWith(
				ctx.kv,
				cookies,
				expect.objectContaining({
					accessToken: 'new-access',
					refreshToken: 'new-refresh'
				})
			);
		});

		it('preserves existing refresh token if backend does not return one', async () => {
			const updateSessionSpy = vi.spyOn(sessionModule, 'updateSession');

			mockFetchSequence([
				mockFetchJsonResponse(401, { error: { code: 'UNAUTHORIZED' } }),
				// Refresh response WITHOUT a new refresh_token
				mockFetchJsonResponse(200, { access_token: 'new-access' }),
				mockFetchJsonResponse(200, { ok: true })
			]);

			const ctx = {
				backendUrl: 'http://127.0.0.1:8787',
				accessToken: 'old-token',
				refreshToken: 'original-refresh',
				kv: kv as unknown as KVNamespace,
				cookies
			};

			await kv.put(
				'session:sess-123',
				JSON.stringify({
					userId: 'user-001',
					accessToken: 'old-token',
					refreshToken: 'original-refresh',
					expiresAt: Date.now() + 86400000
				})
			);

			await apiRequest(ctx, '/v1/events');

			expect(updateSessionSpy).toHaveBeenCalledWith(
				ctx.kv,
				cookies,
				expect.objectContaining({
					refreshToken: 'original-refresh'
				})
			);
		});

		it('does NOT retry if no refreshToken in context', async () => {
			const spy = mockFetchSequence([
				mockFetchJsonResponse(401, {
					error: { code: 'UNAUTHORIZED', message: 'No token' }
				})
			]);

			const ctxNoRefresh = {
				backendUrl: 'http://127.0.0.1:8787',
				accessToken: 'old-token'
				// no refreshToken
			};

			await expect(apiRequest(ctxNoRefresh, '/v1/events')).rejects.toThrow(ApiError);
			expect(spy).toHaveBeenCalledTimes(1);
		});

		it('does NOT retry if refresh endpoint itself fails', async () => {
			const spy = mockFetchSequence([
				mockFetchJsonResponse(401, { error: { code: 'UNAUTHORIZED' } }),
				// Refresh endpoint returns 403
				mockFetchJsonResponse(403, { error: { message: 'Refresh denied' } })
			]);

			const ctx = {
				backendUrl: 'http://127.0.0.1:8787',
				accessToken: 'old-token',
				refreshToken: 'bad-refresh'
			};

			await expect(apiRequest(ctx, '/v1/events')).rejects.toThrow(ApiError);
			// 1 original + 1 refresh attempt = 2 calls (no retry of original)
			expect(spy).toHaveBeenCalledTimes(2);
		});
	});
});

describe('createApiContext', () => {
	it('uses BACKEND_URL from platform env', () => {
		const platform = createMockPlatform({ backendUrl: 'https://ephemeral-api.ephemeralsocial.workers.dev' });
		const session = createMockSession();

		const ctx = createApiContext(platform, session);

		expect(ctx.backendUrl).toBe('https://ephemeral-api.ephemeralsocial.workers.dev');
	});

	it('falls back to http://127.0.0.1:8787 when platform is undefined', () => {
		const ctx = createApiContext(undefined, null);

		expect(ctx.backendUrl).toBe('http://127.0.0.1:8787');
	});

	it('extracts tokens from session object', () => {
		const platform = createMockPlatform();
		const session = createMockSession({
			accessToken: 'my-access',
			refreshToken: 'my-refresh'
		});

		const ctx = createApiContext(platform, session);

		expect(ctx.accessToken).toBe('my-access');
		expect(ctx.refreshToken).toBe('my-refresh');
	});

	it('passes kv and cookies from platform to context', () => {
		const kv = createMockKV();
		const platform = createMockPlatform({ kv });
		const session = createMockSession();
		const mockCookies = createMockCookies();

		const ctx = createApiContext(platform, session, mockCookies as any);

		expect(ctx.kv).toBe(platform.env.SESSIONS);
		expect(ctx.cookies).toBe(mockCookies);
	});
});

describe('apiRequest without accessToken', () => {
	it('does not set Authorization header when accessToken is undefined', async () => {
		const spy = mockFetch(mockFetchJsonResponse(200, { ok: true }));

		const ctx = {
			backendUrl: 'http://127.0.0.1:8787'
			// no accessToken
		};

		await apiRequest(ctx, '/v1/events');

		const [, opts] = spy.mock.calls[0];
		expect(opts.headers).not.toHaveProperty('Authorization');
	});
});
