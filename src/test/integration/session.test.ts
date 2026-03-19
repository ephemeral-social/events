import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSession, getSession, updateSession, destroySession } from '$lib/server/session';
import { createMockKV, MockKV } from '../mocks/kv';
import { createMockCookies, MockCookies } from '../mocks/cookies';

describe('session', () => {
	let kv: MockKV;
	let cookies: MockCookies;

	beforeEach(() => {
		kv = createMockKV();
		cookies = createMockCookies();
	});

	describe('createSession', () => {
		const sessionInput = {
			userId: 'user-001',
			accessToken: 'access-tok',
			refreshToken: 'refresh-tok',
			displayName: 'Test User'
		};

		it('stores JSON in KV with session:{uuid} key', async () => {
			const sessionId = await createSession(kv as unknown as KVNamespace, cookies, sessionInput);

			const raw = await kv.get(`session:${sessionId}`);
			expect(raw).not.toBeNull();

			const stored = JSON.parse(raw!);
			expect(stored.userId).toBe('user-001');
			expect(stored.accessToken).toBe('access-tok');
			expect(stored.refreshToken).toBe('refresh-tok');
			expect(stored.displayName).toBe('Test User');
		});

		it('sets expirationTtl to 30 days (2592000 seconds)', async () => {
			const sessionId = await createSession(kv as unknown as KVNamespace, cookies, sessionInput);

			const ttl = kv.getExpirationTtl(`session:${sessionId}`);
			expect(ttl).toBe(2592000);
		});

		it('sets HttpOnly cookie with correct options', async () => {
			await createSession(kv as unknown as KVNamespace, cookies, sessionInput);

			const opts = cookies.getSetOptions('eph_session');
			expect(opts).toBeDefined();
			expect(opts!.httpOnly).toBe(true);
			expect(opts!.secure).toBe(true);
			expect(opts!.sameSite).toBe('lax');
			expect(opts!.maxAge).toBe(2592000);
		});

		it('sets cookie path to /', async () => {
			await createSession(kv as unknown as KVNamespace, cookies, sessionInput);

			const opts = cookies.getSetOptions('eph_session');
			expect(opts!.path).toBe('/');
		});

		it('returns a valid UUID session ID', async () => {
			const sessionId = await createSession(kv as unknown as KVNamespace, cookies, sessionInput);

			// UUID v4 format: 8-4-4-4-12 hex chars
			expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
		});

		it('adds expiresAt to session data (Date.now() + 30 days)', async () => {
			vi.useFakeTimers();
			const now = new Date('2026-01-15T12:00:00Z').getTime();
			vi.setSystemTime(now);

			try {
				const sessionId = await createSession(kv as unknown as KVNamespace, cookies, sessionInput);

				const raw = await kv.get(`session:${sessionId}`);
				const stored = JSON.parse(raw!);
				const expectedExpiry = now + 30 * 24 * 60 * 60 * 1000;
				expect(stored.expiresAt).toBe(expectedExpiry);
			} finally {
				vi.useRealTimers();
			}
		});
	});

	describe('getSession', () => {
		it('returns parsed session for valid cookie + KV entry', async () => {
			// Seed a session directly in KV and cookie
			const sessionData = {
				userId: 'user-001',
				accessToken: 'access-tok',
				refreshToken: 'refresh-tok',
				displayName: 'Test User',
				expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
			};
			await kv.put('session:sess-123', JSON.stringify(sessionData));
			cookies.set('eph_session', 'sess-123');

			const result = await getSession(kv as unknown as KVNamespace, cookies);

			expect(result).toEqual(sessionData);
		});

		it('returns null when no cookie is set', async () => {
			const result = await getSession(kv as unknown as KVNamespace, cookies);
			expect(result).toBeNull();
		});

		it('returns null when cookie exists but KV entry is missing', async () => {
			cookies.set('eph_session', 'nonexistent-session');

			const result = await getSession(kv as unknown as KVNamespace, cookies);
			expect(result).toBeNull();
		});

		it('destroys session and returns null when expiresAt < Date.now()', async () => {
			vi.useFakeTimers();
			const now = new Date('2026-01-15T12:00:00Z').getTime();
			vi.setSystemTime(now);

			try {
				const sessionData = {
					userId: 'user-001',
					accessToken: 'access-tok',
					refreshToken: 'refresh-tok',
					expiresAt: now - 1000 // expired 1 second ago
				};
				await kv.put('session:sess-expired', JSON.stringify(sessionData));
				cookies.set('eph_session', 'sess-expired');

				const result = await getSession(kv as unknown as KVNamespace, cookies);

				expect(result).toBeNull();
				// Verify session was destroyed
				expect(kv.has('session:sess-expired')).toBe(false);
				expect(cookies.has('eph_session')).toBe(false);
			} finally {
				vi.useRealTimers();
			}
		});
	});

	describe('updateSession', () => {
		const originalSession = {
			userId: 'user-001',
			accessToken: 'old-token',
			refreshToken: 'old-refresh',
			displayName: 'Original Name',
			expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
		};

		beforeEach(async () => {
			await kv.put('session:sess-update', JSON.stringify(originalSession));
			cookies.set('eph_session', 'sess-update');
		});

		it('merges updates into existing session in KV', async () => {
			await updateSession(kv as unknown as KVNamespace, cookies, {
				accessToken: 'new-token'
			});

			const raw = await kv.get('session:sess-update');
			const updated = JSON.parse(raw!);
			expect(updated.accessToken).toBe('new-token');
		});

		it('preserves unmodified fields (but resets expiresAt)', async () => {
			await updateSession(kv as unknown as KVNamespace, cookies, {
				accessToken: 'new-token'
			});

			const raw = await kv.get('session:sess-update');
			const updated = JSON.parse(raw!);
			expect(updated.userId).toBe('user-001');
			expect(updated.refreshToken).toBe('old-refresh');
			expect(updated.displayName).toBe('Original Name');
			// expiresAt is intentionally reset on every update to stay in sync with KV TTL
			expect(updated.expiresAt).toBeGreaterThan(0);
		});

		it('no-ops if no cookie is set', async () => {
			const emptyCookies = createMockCookies();

			await updateSession(kv as unknown as KVNamespace, emptyCookies, {
				accessToken: 'new-token'
			});

			// Original session unchanged
			const raw = await kv.get('session:sess-update');
			const stored = JSON.parse(raw!);
			expect(stored.accessToken).toBe('old-token');
		});

		it('no-ops if no KV entry found', async () => {
			const cookiesWithBadSession = createMockCookies({ eph_session: 'nonexistent' });

			await updateSession(kv as unknown as KVNamespace, cookiesWithBadSession, {
				accessToken: 'new-token'
			});

			// Should not throw, just silently return
			expect(kv.has('session:nonexistent')).toBe(false);
		});

		it('resets expiresAt alongside KV TTL on update', async () => {
			vi.useFakeTimers();
			try {
				const initialTime = new Date('2026-01-15T12:00:00Z').getTime();
				vi.setSystemTime(initialTime);

				// Re-seed session with fake timer so originalExpiresAt uses fake time
				const seededSession = {
					userId: 'user-001',
					accessToken: 'old-token',
					refreshToken: 'old-refresh',
					displayName: 'Original Name',
					expiresAt: initialTime + 30 * 24 * 60 * 60 * 1000
				};
				await kv.put('session:sess-update', JSON.stringify(seededSession));
				const originalExpiresAt = seededSession.expiresAt;

				// Advance time by 1 day
				const advancedTime = initialTime + 24 * 60 * 60 * 1000;
				vi.setSystemTime(advancedTime);

				await updateSession(kv as unknown as KVNamespace, cookies, {
					accessToken: 'refreshed-token'
				});

				const raw = await kv.get('session:sess-update');
				const updated = JSON.parse(raw!);

				// expiresAt should be recalculated from "now" (initial + 1 day) + 30 days
				const expectedExpiry = advancedTime + 30 * 24 * 60 * 60 * 1000;
				expect(updated.expiresAt).toBe(expectedExpiry);
				// The updated expiresAt should be later than the original
				expect(updated.expiresAt).toBeGreaterThan(originalExpiresAt);
			} finally {
				vi.useRealTimers();
			}
		});
	});

	describe('destroySession', () => {
		it('deletes KV entry', async () => {
			await kv.put('session:sess-destroy', JSON.stringify({ userId: 'user-001' }));
			cookies.set('eph_session', 'sess-destroy');

			await destroySession(kv as unknown as KVNamespace, cookies);

			expect(kv.has('session:sess-destroy')).toBe(false);
		});

		it('deletes cookie with path /', async () => {
			cookies.set('eph_session', 'sess-destroy');

			await destroySession(kv as unknown as KVNamespace, cookies);

			expect(cookies.has('eph_session')).toBe(false);
		});

		it('handles missing cookie gracefully (no throw)', async () => {
			// No cookie set — should not throw
			await expect(destroySession(kv as unknown as KVNamespace, cookies)).resolves.toBeUndefined();
		});
	});
});
