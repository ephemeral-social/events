import { MockCookies, createMockCookies } from './cookies.js';
import { MockKV, createMockKV } from './kv.js';

interface MockRequestEventOptions {
	method?: string;
	url?: string;
	body?: unknown;
	params?: Record<string, string>;
	cookies?: MockCookies;
	platform?: {
		env: {
			SESSIONS?: MockKV | KVNamespace;
			BACKEND_URL?: string;
			STRIPE_PUBLISHABLE_KEY?: string;
			ADMIN_USER_ID?: string;
			TAWK_WIDGET_ID?: string;
			OG_WORKER_URL?: string;
			WAITLIST_API_URL?: string;
			STRIPE_FOUNDER_LINK?: string;
		};
	};
	searchParams?: Record<string, string>;
}

/**
 * Create a mock SvelteKit RequestEvent for testing server routes.
 */
export function createMockRequestEvent(overrides: MockRequestEventOptions = {}) {
	const { method = 'GET', body, params = {}, searchParams = {} } = overrides;

	const baseUrl = overrides.url || 'http://localhost:5173/api/test';
	const urlObj = new URL(baseUrl);
	for (const [key, value] of Object.entries(searchParams)) {
		urlObj.searchParams.set(key, value);
	}

	const cookies = overrides.cookies || createMockCookies();

	const kv = overrides.platform?.env?.SESSIONS || createMockKV();
	const backendUrl = overrides.platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';
	const stripeKey = overrides.platform?.env?.STRIPE_PUBLISHABLE_KEY || '';
	const platform = {
		env: {
			SESSIONS: kv as unknown as KVNamespace,
			BACKEND_URL: backendUrl,
			STRIPE_PUBLISHABLE_KEY: stripeKey
		}
	};

	const headers = new Headers();
	if (body !== undefined) {
		headers.set('Content-Type', 'application/json');
	}

	const request = new Request(urlObj.toString(), {
		method,
		headers,
		body: body !== undefined ? JSON.stringify(body) : undefined
	});

	return {
		request,
		cookies,
		platform: platform as App.Platform,
		params,
		url: urlObj,
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
}

export function createMockPlatform(overrides?: {
	kv?: MockKV;
	backendUrl?: string;
	stripePublishableKey?: string;
}) {
	return {
		env: {
			SESSIONS: (overrides?.kv || createMockKV()) as unknown as KVNamespace,
			BACKEND_URL: overrides?.backendUrl || 'http://127.0.0.1:8787',
			STRIPE_PUBLISHABLE_KEY: overrides?.stripePublishableKey || ''
		}
	} as App.Platform;
}
