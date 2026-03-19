import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { updateSession } from './session';

/** Default fetch timeout in milliseconds */
const FETCH_TIMEOUT_MS = 10_000;

/** Build allowed backend URLs dynamically — prevents SSRF */
function getAllowedBackendUrls(): string[] {
	const urls = [
		'https://ephemeral-api.ephemeralsocial.workers.dev',
		'http://127.0.0.1:8787'
	];
	const configured = env.BACKEND_URL;
	if (configured && !urls.includes(configured)) urls.push(configured);
	return urls;
}

interface ApiOptions {
	method?: string;
	body?: unknown;
	headers?: Record<string, string>;
}

export interface ApiContext {
	backendUrl: string;
	accessToken?: string;
	refreshToken?: string;
	checkinToken?: string;
	kv?: KVNamespace;
	cookies?: Cookies;
}

export class ApiError extends Error {
	constructor(
		public status: number,
		public code: string,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

/**
 * Validate that the backend URL is in the allowlist.
 * Prevents SSRF if BACKEND_URL env var is compromised.
 */
export function validateBackendUrl(url: string): void {
	const allowedUrls = getAllowedBackendUrls();
	if (!allowedUrls.some((allowed) => url === allowed || url.startsWith(allowed + '/'))) {
		throw new Error(`Backend URL not allowed: ${url}`);
	}
}

/**
 * Validate a path parameter (eventId, slug, etc.) to prevent path traversal.
 * Rejects values containing /, .., \, or non-alphanumeric/dash/underscore chars.
 */
export function validatePathParam(id: string): void {
	if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
		throw new ApiError(400, 'INVALID_PARAM', `Invalid path parameter: ${id}`);
	}
}

async function refreshAccessToken(ctx: ApiContext): Promise<string | null> {
	if (!ctx.refreshToken) return null;

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
		const res = await fetch(`${ctx.backendUrl}/v1/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: ctx.refreshToken }),
			signal: controller.signal
		});
		clearTimeout(timeout);

		if (!res.ok) return null;

		const data = (await res.json()) as { access_token: string; refresh_token?: string };

		// Update session with new tokens
		if (ctx.kv && ctx.cookies) {
			await updateSession(ctx.kv, ctx.cookies, {
				accessToken: data.access_token,
				refreshToken: data.refresh_token || ctx.refreshToken
			});
		}

		return data.access_token;
	} catch {
		return null;
	}
}

export async function apiRequest<T = unknown>(
	ctx: ApiContext,
	path: string,
	options: ApiOptions = {}
): Promise<T> {
	const { method = 'GET', body, headers = {} } = options;

	const requestHeaders: Record<string, string> = {
		...headers
	};

	if (ctx.checkinToken) {
		requestHeaders['X-Checkin-Token'] = ctx.checkinToken;
	} else if (ctx.accessToken) {
		requestHeaders['Authorization'] = `Bearer ${ctx.accessToken}`;
	}

	if (body !== undefined) {
		requestHeaders['Content-Type'] = 'application/json';
	}

	const controller1 = new AbortController();
	const timeout1 = setTimeout(() => controller1.abort(), FETCH_TIMEOUT_MS);
	let res = await fetch(`${ctx.backendUrl}${path}`, {
		method,
		headers: requestHeaders,
		body: body !== undefined ? JSON.stringify(body) : undefined,
		signal: controller1.signal
	});
	clearTimeout(timeout1);

	// Auto-refresh on 401
	if (res.status === 401 && ctx.refreshToken) {
		const newToken = await refreshAccessToken(ctx);
		if (newToken) {
			ctx.accessToken = newToken;
			requestHeaders['Authorization'] = `Bearer ${newToken}`;
			const controller2 = new AbortController();
			const timeout2 = setTimeout(() => controller2.abort(), FETCH_TIMEOUT_MS);
			res = await fetch(`${ctx.backendUrl}${path}`, {
				method,
				headers: requestHeaders,
				body: body !== undefined ? JSON.stringify(body) : undefined,
				signal: controller2.signal
			});
			clearTimeout(timeout2);
		}
	}

	if (!res.ok) {
		let errorData: { error?: string | { code?: string; message?: string }; message?: string } = {};
		try {
			errorData = await res.json();
		} catch {
			// response may not be JSON
		}
		const errField = errorData.error;
		const message =
			(typeof errField === 'string' ? errField : errField?.message) ||
			errorData.message ||
			`API error: ${res.status}`;
		const code = (typeof errField === 'object' ? errField?.code : undefined) || 'API_ERROR';
		throw new ApiError(res.status, code, message);
	}

	// Handle 204 No Content — cast through unknown to satisfy generic constraint
	if (res.status === 204) return undefined as unknown as T;

	return res.json() as Promise<T>;
}

/** Create an API context from SvelteKit server-side event */
export function createApiContext(
	platform: App.Platform | undefined,
	session: { accessToken?: string; refreshToken?: string } | null,
	cookies?: import('@sveltejs/kit').Cookies
): ApiContext {
	const backendUrl = platform?.env?.BACKEND_URL || env.BACKEND_URL || 'http://127.0.0.1:8787';
	validateBackendUrl(backendUrl);
	return {
		backendUrl,
		accessToken: session?.accessToken,
		refreshToken: session?.refreshToken,
		kv: platform?.env?.SESSIONS,
		cookies
	};
}

/** Create an API context for checkin-token auth (no user session) */
export function createCheckinApiContext(
	platform: App.Platform | undefined,
	checkinToken: string
): ApiContext {
	const backendUrl = platform?.env?.BACKEND_URL || env.BACKEND_URL || 'http://127.0.0.1:8787';
	validateBackendUrl(backendUrl);
	return {
		backendUrl,
		checkinToken
	};
}
