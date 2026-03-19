import type { Cookies } from '@sveltejs/kit';

const SESSION_COOKIE = 'eph_session';
const SESSION_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

export interface SessionData {
	userId: string;
	accessToken: string;
	refreshToken: string;
	displayName?: string;
	firstName?: string;
	lastName?: string;
	expiresAt: number;
}

export async function createSession(
	kv: KVNamespace,
	cookies: Cookies,
	data: Omit<SessionData, 'expiresAt'>,
	requestUrl?: URL
): Promise<string> {
	const sessionId = crypto.randomUUID();
	const session: SessionData = {
		...data,
		expiresAt: Date.now() + SESSION_TTL * 1000
	};

	await kv.put(`session:${sessionId}`, JSON.stringify(session), {
		expirationTtl: SESSION_TTL
	});

	const isSecure = requestUrl ? requestUrl.protocol === 'https:' : true;
	cookies.set(SESSION_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		secure: isSecure,
		sameSite: 'lax',
		maxAge: SESSION_TTL
	});

	return sessionId;
}

export async function getSession(kv: KVNamespace, cookies: Cookies): Promise<SessionData | null> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (!sessionId) return null;

	const raw = await kv.get(`session:${sessionId}`);
	if (!raw) return null;

	const session: SessionData = JSON.parse(raw);
	if (session.expiresAt < Date.now()) {
		await destroySession(kv, cookies);
		return null;
	}

	return session;
}

export async function updateSession(
	kv: KVNamespace,
	cookies: Cookies,
	updates: Partial<SessionData>
): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (!sessionId) return;

	const raw = await kv.get(`session:${sessionId}`);
	if (!raw) return;

	const session: SessionData = JSON.parse(raw);
	// Reset expiresAt alongside KV TTL so the two stay in sync.
	// Note: KV has no CAS — concurrent updates may race, but session
	// data is user-scoped and low-contention in practice.
	const updated = { ...session, ...updates, expiresAt: Date.now() + SESSION_TTL * 1000 };

	await kv.put(`session:${sessionId}`, JSON.stringify(updated), {
		expirationTtl: SESSION_TTL
	});
}

export async function destroySession(kv: KVNamespace, cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId) {
		await kv.delete(`session:${sessionId}`);
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

// --- Checkin session (separate cookie for token-based check-in access) ---

const CHECKIN_COOKIE = 'eph_checkin';

export interface CheckinSessionData {
	token: string;
	eventId: string;
	expiresAt: number;
}

export async function createCheckinSession(
	kv: KVNamespace,
	cookies: Cookies,
	data: { token: string; eventId: string },
	ttlSeconds: number,
	requestUrl?: URL
): Promise<string> {
	const sessionId = crypto.randomUUID();
	const session: CheckinSessionData = {
		...data,
		expiresAt: Date.now() + ttlSeconds * 1000
	};

	await kv.put(`checkin:${sessionId}`, JSON.stringify(session), {
		expirationTtl: ttlSeconds
	});

	const isSecure = requestUrl ? requestUrl.protocol === 'https:' : true;
	cookies.set(CHECKIN_COOKIE, sessionId, {
		path: '/',
		httpOnly: true,
		secure: isSecure,
		sameSite: 'lax',
		maxAge: ttlSeconds
	});

	return sessionId;
}

export async function getCheckinSession(
	kv: KVNamespace,
	cookies: Cookies
): Promise<CheckinSessionData | null> {
	const sessionId = cookies.get(CHECKIN_COOKIE);
	if (!sessionId) return null;

	const raw = await kv.get(`checkin:${sessionId}`);
	if (!raw) return null;

	const session: CheckinSessionData = JSON.parse(raw);
	if (session.expiresAt < Date.now()) {
		await destroyCheckinSession(kv, cookies);
		return null;
	}

	return session;
}

export async function destroyCheckinSession(kv: KVNamespace, cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(CHECKIN_COOKIE);
	if (sessionId) {
		await kv.delete(`checkin:${sessionId}`);
	}
	cookies.delete(CHECKIN_COOKIE, { path: '/' });
}
