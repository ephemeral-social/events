import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return new Response('Service unavailable', { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return new Response('Not authenticated', { status: 401 });

	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';

	try {
		const res = await fetch(`${backendUrl}/v1/events/${params.eventId}/ics`, {
			headers: {
				Authorization: `Bearer ${session.accessToken}`
			}
		});

		if (!res.ok) {
			return new Response('Failed to generate calendar', { status: res.status });
		}

		const icsContent = await res.text();
		return new Response(icsContent, {
			headers: {
				'Content-Type': 'text/calendar; charset=utf-8',
				'Content-Disposition': 'attachment; filename="event.ics"'
			}
		});
	} catch {
		return new Response('Service unavailable', { status: 503 });
	}
};
