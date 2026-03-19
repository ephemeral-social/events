/**
 * Pinterest API helpers. Reads tokens from KV, handles auto-refresh.
 */

const PINTEREST_API = 'https://api.pinterest.com/v5';

export interface PinterestTokenData {
	access_token: string;
	refresh_token: string;
	scopes: string;
	username: string;
	expires_at: number;
	stored_at: number;
}

/**
 * Get Pinterest tokens for a user from KV.
 */
export async function getPinterestTokens(
	kv: KVNamespace,
	userId: string
): Promise<PinterestTokenData | null> {
	const raw = await kv.get(`pinterest:${userId}`);
	if (!raw) return null;
	return JSON.parse(raw) as PinterestTokenData;
}

/**
 * Refresh a Pinterest access token, update KV.
 */
async function refreshToken(
	kv: KVNamespace,
	userId: string,
	tokens: PinterestTokenData,
	platform: App.Platform | undefined
): Promise<string | null> {
	const appId = platform?.env?.PINTEREST_APP_ID;
	const appSecret = platform?.env?.PINTEREST_APP_SECRET;
	if (!appId || !appSecret) return null;

	try {
		const res = await fetch(`${PINTEREST_API}/oauth/token`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${btoa(`${appId}:${appSecret}`)}`
			},
			body: new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: tokens.refresh_token
			})
		});

		if (!res.ok) return null;

		const data = (await res.json()) as {
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		};

		const updated: PinterestTokenData = {
			...tokens,
			access_token: data.access_token,
			refresh_token: data.refresh_token || tokens.refresh_token,
			expires_at: Date.now() + data.expires_in * 1000
		};

		await kv.put(`pinterest:${userId}`, JSON.stringify(updated), {
			expirationTtl: 60 * 24 * 60 * 60
		});

		return data.access_token;
	} catch {
		return null;
	}
}

/**
 * Make a Pinterest API request for a given user. Handles auto-refresh on 401.
 */
export async function pinterestApiFetch(
	kv: KVNamespace,
	userId: string,
	path: string,
	platform: App.Platform | undefined
): Promise<Response> {
	const tokens = await getPinterestTokens(kv, userId);
	if (!tokens) {
		return new Response(JSON.stringify({ error: 'not_connected' }), { status: 401 });
	}

	let accessToken = tokens.access_token;

	// Proactively refresh if token is expired or about to expire (5 min buffer)
	if (tokens.expires_at < Date.now() + 5 * 60 * 1000) {
		const newToken = await refreshToken(kv, userId, tokens, platform);
		if (newToken) {
			accessToken = newToken;
		}
	}

	let res = await fetch(`${PINTEREST_API}${path}`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});

	// Retry on 401 with refreshed token
	if (res.status === 401) {
		const newToken = await refreshToken(kv, userId, tokens, platform);
		if (newToken) {
			res = await fetch(`${PINTEREST_API}${path}`, {
				headers: { Authorization: `Bearer ${newToken}` }
			});
		}
	}

	return res;
}
