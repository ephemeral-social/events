import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** GET /api/events/[eventId]/rsvp-reminder — Get current user's RSVP reminder */
export const GET: RequestHandler = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);

	try {
		const data = await apiRequest(ctx, `/v1/events/${params.eventId}/rsvp-reminder`);
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};

/** POST /api/events/[eventId]/rsvp-reminder — Create or update RSVP reminder */
export const POST: RequestHandler = async ({ params, request, cookies, platform }) => {
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
		const data = await apiRequest(ctx, `/v1/events/${params.eventId}/rsvp-reminder`, {
			method: 'POST',
			body
		});
		return json(data, { status: 201 });
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message, code: e.code }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};

/** DELETE /api/events/[eventId]/rsvp-reminder — Cancel RSVP reminder */
export const DELETE: RequestHandler = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);

	try {
		const data = await apiRequest(ctx, `/v1/events/${params.eventId}/rsvp-reminder`, {
			method: 'DELETE'
		});
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message, code: e.code }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
