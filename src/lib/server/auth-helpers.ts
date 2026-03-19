import { json, type Cookies } from '@sveltejs/kit';
import { createApiContext, type ApiContext } from '$lib/server/api';
import { getSession } from '$lib/server/session';

interface AuthResult {
	ctx: ApiContext;
	session: { userId: string; accessToken: string; refreshToken: string; displayName?: string };
	kv: KVNamespace;
}

/**
 * Extract repeated auth preamble into a reusable helper.
 * Returns ApiContext + session, or a 401/503 JSON response.
 */
export async function withAuth(
	platform: App.Platform | undefined,
	cookies: Cookies
): Promise<AuthResult | Response> {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);
	return { ctx, session, kv };
}
