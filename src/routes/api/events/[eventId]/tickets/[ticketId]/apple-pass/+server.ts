import { getSession } from '$lib/server/session';
import { validateBackendUrl, validatePathParam } from '$lib/server/api';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

/** GET /api/events/[eventId]/tickets/[ticketId]/apple-pass — Proxy to backend PKPass generation */
export const GET: RequestHandler = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return new Response('Service unavailable', { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return new Response('Not authenticated', { status: 401 });

	validatePathParam(params.eventId);
	validatePathParam(params.ticketId);

	const backendUrl = platform?.env?.BACKEND_URL || env.BACKEND_URL || 'http://127.0.0.1:8787';
	validateBackendUrl(backendUrl);

	try {
		const res = await fetch(
			`${backendUrl}/v1/events/${params.eventId}/tickets/${params.ticketId}/apple-pass`,
			{
				headers: {
					Authorization: `Bearer ${session.accessToken}`
				}
			}
		);

		if (!res.ok) {
			const text = await res.text();
			return new Response(text, { status: res.status });
		}

		const body = await res.arrayBuffer();
		return new Response(body, {
			headers: {
				'Content-Type': 'application/vnd.apple.pkpass',
				'Content-Disposition': 'attachment; filename="ticket.pkpass"'
			}
		});
	} catch {
		return new Response('Service unavailable', { status: 503 });
	}
};
