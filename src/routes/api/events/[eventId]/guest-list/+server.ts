import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, url, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);
	const qs = new URLSearchParams();
	const rawLimit = parseInt(url.searchParams.get('limit') || '50', 10);
	qs.set('limit', String(Math.max(1, Math.min(100, isNaN(rawLimit) ? 50 : rawLimit))));
	const after = url.searchParams.get('after');
	if (after) qs.set('after', after);

	try {
		const data = await apiRequest(ctx, `/v1/events/${params.eventId}/guest-list?${qs.toString()}`);
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
