import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, platform, request }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);

	// Forward optional JSON body (e.g. { event_id }) to backend
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		// No body or invalid JSON — fine, send without body
	}

	try {
		const data = await apiRequest(ctx, '/v1/payments/stripe-onboard', { method: 'POST', body });
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message, code: e.code }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
