import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';
import { getSession, updateSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** PUT /api/users/me — Update current user profile */
export const PUT: RequestHandler = async ({ request, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	try {
		const data = await apiRequest(ctx, '/v1/users/me', {
			method: 'PUT',
			body
		}) as Record<string, unknown>;

		// Update session with name fields from backend response
		const sessionUpdates: Record<string, string | undefined> = {};
		if (data.display_name && typeof data.display_name === 'string') {
			sessionUpdates.displayName = data.display_name;
		}
		if (data.first_name && typeof data.first_name === 'string') {
			sessionUpdates.firstName = data.first_name;
		}
		if (data.last_name && typeof data.last_name === 'string') {
			sessionUpdates.lastName = data.last_name;
		}
		if (Object.keys(sessionUpdates).length > 0) {
			await updateSession(kv, cookies, sessionUpdates);
		}

		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
