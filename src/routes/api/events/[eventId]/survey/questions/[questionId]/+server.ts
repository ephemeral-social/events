import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError, validatePathParam } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** PUT — Update a single question (host only) */
export const PUT: RequestHandler = async ({ params, request, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		validatePathParam(params.eventId);
		validatePathParam(params.questionId);
	} catch {
		return json({ error: 'Invalid parameters' }, { status: 400 });
	}

	const ctx = createApiContext(platform, session, cookies);

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	try {
		const data = await apiRequest(
			ctx,
			`/v1/events/${params.eventId}/survey/questions/${params.questionId}`,
			{ method: 'PUT', body }
		);
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};

/** DELETE — Delete a question (host only) */
export const DELETE: RequestHandler = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	try {
		validatePathParam(params.eventId);
		validatePathParam(params.questionId);
	} catch {
		return json({ error: 'Invalid parameters' }, { status: 400 });
	}

	const ctx = createApiContext(platform, session, cookies);

	try {
		await apiRequest(
			ctx,
			`/v1/events/${params.eventId}/survey/questions/${params.questionId}`,
			{ method: 'DELETE' }
		);
		return new Response(null, { status: 204 });
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
