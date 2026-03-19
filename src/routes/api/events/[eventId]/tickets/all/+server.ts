import { json } from '@sveltejs/kit';
import {
	createApiContext,
	createCheckinApiContext,
	apiRequest,
	ApiError,
	validatePathParam
} from '$lib/server/api';
import { getSession, getCheckinSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** GET /api/events/[eventId]/tickets/all — All event tickets (user session OR checkin session) */
export const GET: RequestHandler = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	try {
		validatePathParam(params.eventId);
	} catch {
		return json({ error: 'Invalid event ID' }, { status: 400 });
	}

	// Try user session first, then checkin session
	const session = await getSession(kv, cookies);
	if (session) {
		const ctx = createApiContext(platform, session, cookies);
		try {
			const data = await apiRequest(ctx, `/v1/events/${params.eventId}/tickets`);
			return json(data);
		} catch (e) {
			if (e instanceof ApiError) {
				return json({ error: e.message, code: e.code }, { status: e.status });
			}
			return json({ error: 'Service unavailable' }, { status: 503 });
		}
	}

	const checkinSession = await getCheckinSession(kv, cookies);
	if (checkinSession && checkinSession.eventId === params.eventId) {
		const ctx = createCheckinApiContext(platform, checkinSession.token);
		try {
			const data = await apiRequest(ctx, `/v1/events/${params.eventId}/tickets`);
			return json(data);
		} catch (e) {
			if (e instanceof ApiError) {
				return json({ error: e.message, code: e.code }, { status: e.status });
			}
			return json({ error: 'Service unavailable' }, { status: 503 });
		}
	}

	return json({ error: 'Not authenticated' }, { status: 401 });
};
