import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** POST /api/events/[eventId]/invites/release — Release pending SMS */
export const POST: RequestHandler = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);

	try {
		const data = await apiRequest(ctx, `/v1/events/${params.eventId}/invites/release`, {
			method: 'POST'
		});
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message, code: e.code }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
