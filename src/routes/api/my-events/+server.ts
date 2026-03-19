import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

interface BackendEvent {
	event_id: string;
	title: string;
	start_time: string;
	end_time?: string;
	timezone?: string;
	slug?: string;
	is_host?: number;
	my_rsvp?: string;
	going_count?: number;
	[key: string]: unknown;
}

interface BackendResponse {
	upcoming: BackendEvent[];
	past: BackendEvent[];
}

export const GET: RequestHandler = async ({ cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);

	try {
		// GET /v1/events returns { upcoming: [...], past: [...] } with is_host and my_rsvp fields
		const data = await apiRequest<BackendResponse>(ctx, '/v1/events');

		// Merge upcoming and past into a single events array for the page component
		const allEvents = [...(data.upcoming || []), ...(data.past || [])];

		return json({ events: allEvents });
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
