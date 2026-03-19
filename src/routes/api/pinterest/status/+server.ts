import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/server/session';

/**
 * GET /api/pinterest/status
 * Check Pinterest connection status from KV.
 */
export const GET: RequestHandler = async ({ platform, cookies }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) {
		return json({ connected: false, pinterest_username: null });
	}

	const session = await getSession(kv, cookies);
	if (!session) {
		return json({ connected: false, pinterest_username: null });
	}

	try {
		const raw = await kv.get(`pinterest:${session.userId}`);
		if (!raw) {
			return json({ connected: false, pinterest_username: null });
		}
		const data = JSON.parse(raw) as { username?: string };
		return json({ connected: true, pinterest_username: data.username || null });
	} catch {
		return json({ connected: false, pinterest_username: null });
	}
};
