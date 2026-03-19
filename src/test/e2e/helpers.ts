import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { createMockKV, MockKV } from '../mocks/kv.js';
import { createMockCookies, MockCookies } from '../mocks/cookies.js';
import { createMockSession } from '../helpers.js';

const BACKEND_URL = 'http://127.0.0.1:8787';

/**
 * Clear rate limit entries from local wrangler KV SQLite.
 * Called before each auth call to prevent 429 during test runs.
 */
function clearRateLimits(): void {
	const kvDir = join(
		__dirname,
		'../../../../ephemeral_backend/.wrangler/state/v3/kv/miniflare-KVNamespaceObject'
	);

	if (!existsSync(kvDir)) return;

	const files = readdirSync(kvDir).filter((f) => f.endsWith('.sqlite'));
	for (const file of files) {
		const dbPath = join(kvDir, file);
		try {
			execSync(`sqlite3 "${dbPath}" "DELETE FROM _mf_entries WHERE key LIKE 'rl:%';"`, {
				stdio: 'pipe'
			});
		} catch {
			// Ignore errors
		}
	}
}

/**
 * Verify backend is reachable.
 */
export async function backendHealthCheck(): Promise<boolean> {
	try {
		const res = await fetch(`${BACKEND_URL}/health`);
		return res.ok;
	} catch {
		return false;
	}
}

/**
 * Authenticate a test user via the backend directly.
 * Uses dev mode bypass (code 123456).
 * Clears rate limits before each call to avoid 429 during test runs.
 */
export async function authenticateTestUser(phone: string): Promise<{
	accessToken: string;
	refreshToken: string;
	userId: string;
	displayName?: string;
}> {
	// Clear rate limits before auth calls
	clearRateLimits();

	// Extract national number from E.164 format (+1XXXXXXXXXX)
	const nationalNumber = phone.startsWith('+1') ? phone.slice(2) : phone;

	// Send code
	const sendRes = await fetch(`${BACKEND_URL}/v1/auth/phone/send-code`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			phone_e164: phone,
			phone_country_code: '1',
			phone_national_number: nationalNumber
		})
	});

	if (!sendRes.ok) {
		const err = await sendRes.text();
		throw new Error(`Failed to send code: ${sendRes.status} ${err}`);
	}

	const sendData = (await sendRes.json()) as { verification_id: string };

	// Verify with dev bypass code
	const verifyRes = await fetch(`${BACKEND_URL}/v1/auth/phone/verify-code`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			verification_id: sendData.verification_id,
			code: '123456'
		})
	});

	if (!verifyRes.ok) {
		const err = await verifyRes.text();
		throw new Error(`Failed to verify code: ${verifyRes.status} ${err}`);
	}

	const verifyData = (await verifyRes.json()) as {
		access_token: string;
		refresh_token: string;
		user: { user_id: string; display_name?: string };
	};

	return {
		accessToken: verifyData.access_token,
		refreshToken: verifyData.refresh_token,
		userId: verifyData.user.user_id,
		displayName: verifyData.user.display_name
	};
}

/**
 * Create an event via the backend API.
 */
export async function createTestEvent(
	token: string,
	eventData: {
		title: string;
		description?: string;
		start_time: string;
		end_time?: string;
		timezone?: string;
		slug?: string;
		visibility?: string;
		max_attendees?: number;
		show_guest_list?: boolean;
		location_hidden?: boolean;
	}
): Promise<Record<string, unknown>> {
	const res = await fetch(`${BACKEND_URL}/v1/events`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			visibility: 'public',
			timezone: 'America/New_York',
			...eventData
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Failed to create event: ${res.status} ${err}`);
	}

	return (await res.json()) as Record<string, unknown>;
}

/**
 * Create a KV session + cookie for an authenticated user.
 * Returns objects usable with SvelteKit route tests.
 */
export async function createSessionForUser(
	kv: MockKV,
	cookies: MockCookies,
	authResult: {
		accessToken: string;
		refreshToken: string;
		userId: string;
		displayName?: string;
	}
): Promise<void> {
	const sessionId = 'e2e-session-' + Math.random().toString(36).slice(2);
	const session = createMockSession({
		userId: authResult.userId,
		accessToken: authResult.accessToken,
		refreshToken: authResult.refreshToken,
		displayName: authResult.displayName
	});

	await kv.put(`session:${sessionId}`, JSON.stringify(session));
	cookies.set('eph_session', sessionId);
}

/**
 * Create a platform mock for E2E tests.
 */
export function createE2EPlatform(kv?: MockKV) {
	return {
		env: {
			SESSIONS: (kv || createMockKV()) as KVNamespace,
			BACKEND_URL
		}
	} as App.Platform;
}

/**
 * Call a SvelteKit API route handler for E2E testing.
 */
export async function callApiRoute(
	handler: (event: any) => Promise<Response>,
	options: {
		method?: string;
		body?: unknown;
		params?: Record<string, string>;
		kv?: MockKV;
		cookies?: MockCookies;
		searchParams?: Record<string, string>;
	} = {}
): Promise<Response> {
	const {
		method = 'GET',
		body,
		params = {},
		kv = createMockKV(),
		cookies = createMockCookies(),
		searchParams = {}
	} = options;

	const url = new URL('http://localhost:5173/api/test');
	for (const [key, value] of Object.entries(searchParams)) {
		url.searchParams.set(key, value);
	}

	const headers = new Headers();
	if (body !== undefined) {
		headers.set('Content-Type', 'application/json');
	}

	const request = new Request(url.toString(), {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined
	});

	const event = {
		request,
		cookies,
		platform: {
			env: {
				SESSIONS: kv as KVNamespace,
				BACKEND_URL
			}
		} as App.Platform,
		params,
		url,
		locals: {},
		route: { id: '' },
		isDataRequest: false,
		isSubRequest: false,
		getClientAddress: () => '127.0.0.1',
		fetch: globalThis.fetch,
		setHeaders: () => {},
		depends: () => {},
		untrack: ((fn: () => unknown) => fn()) as any
	};

	return handler(event);
}
