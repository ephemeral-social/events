import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/server/session';

function isValidReturnPath(path: string): boolean {
	if (!path || !path.startsWith('/')) return false;
	if (path.startsWith('//')) return false;
	return true;
}

/**
 * GET /api/pinterest/auth?return_to=/create
 * Initiates Pinterest OAuth2 flow. Requires authenticated session.
 */
export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) {
		return new Response('Service unavailable', { status: 503 });
	}

	const session = await getSession(kv, cookies);
	if (!session) {
		return new Response('Authentication required', { status: 401 });
	}

	const rawReturn = url.searchParams.get('return_to') || '/events';
	const returnTo = isValidReturnPath(rawReturn) ? rawReturn : '/events';
	const appId = platform?.env?.PINTEREST_APP_ID;

	if (!appId) {
		return new Response('Pinterest not configured', { status: 500 });
	}

	// Generate CSRF state token
	const state = crypto.randomUUID();

	// Store state in KV with 5 min TTL
	await kv.put(
		`pinterest_state:${state}`,
		JSON.stringify({ sessionId: session.userId, returnTo }),
		{ expirationTtl: 300 }
	);

	// Build Pinterest OAuth URL
	const origin = url.origin;
	const redirectUri = `${origin}/api/pinterest/callback`;
	const pinterestAuthUrl = new URL('https://www.pinterest.com/oauth/');
	pinterestAuthUrl.searchParams.set('client_id', appId);
	pinterestAuthUrl.searchParams.set('redirect_uri', redirectUri);
	pinterestAuthUrl.searchParams.set('response_type', 'code');
	pinterestAuthUrl.searchParams.set('scope', 'boards:read,pins:read');
	pinterestAuthUrl.searchParams.set('state', state);

	redirect(302, pinterestAuthUrl.toString());
};
