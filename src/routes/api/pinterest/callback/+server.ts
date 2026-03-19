import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/server/session';

function isValidReturnPath(path: string): boolean {
	if (!path || !path.startsWith('/')) return false;
	if (path.startsWith('//')) return false;
	return true;
}

/**
 * GET /api/pinterest/callback?code=...&state=...
 * Pinterest OAuth2 callback. Exchanges code for tokens, stores in KV.
 */
export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) {
		return new Response('Service unavailable', { status: 503 });
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	if (error) {
		redirect(302, '/events');
	}

	if (!code || !state) {
		return new Response('Missing code or state', { status: 400 });
	}

	// Validate CSRF state
	const stateKey = `pinterest_state:${state}`;
	const stateRaw = await kv.get(stateKey);
	if (!stateRaw) {
		return new Response('Invalid or expired state', { status: 400 });
	}
	await kv.delete(stateKey);

	const stateData = JSON.parse(stateRaw) as { sessionId: string; returnTo: string };
	const safeReturnTo = isValidReturnPath(stateData.returnTo) ? stateData.returnTo : '/events';

	const session = await getSession(kv, cookies);
	if (!session) {
		redirect(302, '/');
	}

	const appId = platform?.env?.PINTEREST_APP_ID;
	const appSecret = platform?.env?.PINTEREST_APP_SECRET;

	if (!appId || !appSecret) {
		return new Response('Pinterest not configured', { status: 500 });
	}

	// Exchange code for tokens with Pinterest
	const redirectUri = `${url.origin}/api/pinterest/callback`;

	const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${btoa(`${appId}:${appSecret}`)}`
		},
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri
		})
	});

	if (!tokenRes.ok) {
		console.error('Pinterest token exchange failed:', tokenRes.status);
		const errUrl = new URL(safeReturnTo, url.origin);
		errUrl.searchParams.set('pinterest_error', 'token_exchange');
		redirect(302, errUrl.pathname + errUrl.search);
	}

	const tokenData = (await tokenRes.json()) as {
		access_token: string;
		refresh_token: string;
		expires_in: number;
		scope: string;
	};

	// Fetch Pinterest user info
	let pinterestUsername = '';
	try {
		const userRes = await fetch('https://api.pinterest.com/v5/user_account', {
			headers: { Authorization: `Bearer ${tokenData.access_token}` }
		});
		if (userRes.ok) {
			const userData = (await userRes.json()) as { username?: string };
			pinterestUsername = userData.username || '';
		}
	} catch {
		// Non-critical
	}

	// Store Pinterest tokens directly in KV (no backend auth needed)
	const kvKey = `pinterest:${session.userId}`;
	const kvData = {
		access_token: tokenData.access_token,
		refresh_token: tokenData.refresh_token,
		scopes: tokenData.scope || 'boards:read,pins:read',
		username: pinterestUsername,
		expires_at: Date.now() + tokenData.expires_in * 1000,
		stored_at: Date.now()
	};

	// Store with 60-day TTL (refresh token lifetime)
	await kv.put(kvKey, JSON.stringify(kvData), { expirationTtl: 60 * 24 * 60 * 60 });

	const returnUrl = new URL(safeReturnTo, url.origin);
	returnUrl.searchParams.set('pinterest_connected', 'true');
	redirect(302, returnUrl.pathname + returnUrl.search);
};
