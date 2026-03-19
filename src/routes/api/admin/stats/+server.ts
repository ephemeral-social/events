import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/server/session';
import { apiRequest, createApiContext, ApiError } from '$lib/server/api';

export const GET: RequestHandler = async ({ cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);

	try {
		const data = (await apiRequest(ctx, '/v1/admin/stats')) as { stats?: Record<string, unknown> };

		// Fetch waitlist stats directly (worker-to-worker fetch may fail from backend)
		if (data.stats) {
			try {
				const waitlistUrl = platform?.env?.WAITLIST_API_URL || 'https://ephemeral-waitlist.ephemeralsocial.workers.dev';
				const wlRes = await fetch(`${waitlistUrl}/api/stats`);
				if (wlRes.ok) {
					const wl = (await wlRes.json()) as { total?: number; founders?: number };
					data.stats.waitlist_total = wl.total ?? 0;
					data.stats.waitlist_founders = wl.founders ?? 0;
				}
			} catch {
				// Waitlist fetch failed — leave existing values
			}
		}

		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
