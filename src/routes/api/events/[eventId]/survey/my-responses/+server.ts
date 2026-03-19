import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError, validatePathParam } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** GET — Get current user's survey responses */
export const GET: RequestHandler = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		validatePathParam(params.eventId);
	} catch {
		return json({ error: 'Invalid event ID' }, { status: 400 });
	}

	const ctx = createApiContext(platform, session, cookies);

	try {
		const data = await apiRequest(ctx, `/v1/events/${params.eventId}/survey/my-responses`);
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
