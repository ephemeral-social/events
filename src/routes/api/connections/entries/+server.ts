import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** GET /api/connections/entries — Get encrypted connection entries */
export const GET: RequestHandler = async ({ url, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);

	// Forward query params (since, limit)
	const since = url.searchParams.get('since');
	const limit = url.searchParams.get('limit');
	const params = new URLSearchParams();
	if (since) params.set('since', since);
	if (limit) params.set('limit', limit);
	const qs = params.toString();

	try {
		const data = await apiRequest(ctx, `/v1/connections/entries${qs ? `?${qs}` : ''}`);
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message, code: e.code }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
