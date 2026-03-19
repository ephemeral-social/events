import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/server/session';

/**
 * POST /api/pinterest/disconnect
 * Disconnects Pinterest integration (deletes tokens from KV).
 */
export const POST: RequestHandler = async ({ platform, cookies }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) {
		return json({ error: 'Service unavailable' }, { status: 503 });
	}

	const session = await getSession(kv, cookies);
	if (!session) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	await kv.delete(`pinterest:${session.userId}`);
	return json({ success: true });
};
