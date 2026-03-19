import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);
	const body = (await request.json()) as { token?: string; event_id?: string };

	if (!body.token) {
		return json({ error: 'Token is required' }, { status: 400 });
	}

	if (!body.event_id) {
		return json({ error: 'event_id is required' }, { status: 400 });
	}

	try {
		const data = await apiRequest(ctx, `/v1/events/${body.event_id}/cohosts/accept`, {
			method: 'POST',
			body: { invite_token: body.token }
		});
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
