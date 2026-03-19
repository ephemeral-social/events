import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError, validatePathParam } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

/** GET — List survey questions (public, no auth required) */
export const GET: RequestHandler = async ({ params, platform }) => {
	const eventId = params.eventId;
	try {
		validatePathParam(eventId);
	} catch {
		return json({ error: 'Invalid event ID' }, { status: 400 });
	}

	const backendUrl = platform?.env?.BACKEND_URL || env.BACKEND_URL || 'http://127.0.0.1:8787';

	try {
		const res = await fetch(`${backendUrl}/v1/events/${eventId}/survey/questions`);
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			return json(err, { status: res.status });
		}
		return json(await res.json());
	} catch {
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};

/** POST — Batch create/replace questions (host only) */
export const POST: RequestHandler = async ({ params, request, cookies, platform }) => {
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

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	try {
		const data = await apiRequest(ctx, `/v1/events/${params.eventId}/survey/questions`, {
			method: 'POST',
			body
		});
		return json(data, { status: 201 });
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
