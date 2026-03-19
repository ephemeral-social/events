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
import type { ApiContext } from '$lib/server/api';

/**
 * POST /api/events/[eventId]/check-in
 *
 * Two-step flow: verify the ticket belongs to this event, then check it in.
 * Accepts user session OR checkin session.
 */
export const POST: RequestHandler = async ({ params, request, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	try {
		validatePathParam(params.eventId);
	} catch {
		return json({ error: 'Invalid event ID' }, { status: 400 });
	}

	// Resolve auth context: user session or checkin session
	let ctx: ApiContext | null = null;

	const session = await getSession(kv, cookies);
	if (session) {
		ctx = createApiContext(platform, session, cookies);
	} else {
		const checkinSession = await getCheckinSession(kv, cookies);
		if (checkinSession && checkinSession.eventId === params.eventId) {
			ctx = createCheckinApiContext(platform, checkinSession.token);
		}
	}

	if (!ctx) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const ticketId = body.ticket_id;
	if (!ticketId || typeof ticketId !== 'string') {
		return json({ error: 'Missing ticket_id' }, { status: 400 });
	}

	try {
		// Step 1: Verify ticket belongs to this event and check status
		const verifyData = (await apiRequest(ctx, `/v1/tickets/${ticketId}/verify`, {
			method: 'POST',
			body: { event_id: params.eventId }
		})) as { status: string; message?: string; checked_in_at?: string };

		if (verifyData.status === 'not_found') {
			return json({ status: 'error', message: 'Ticket not found' });
		}
		if (verifyData.status === 'wrong_event') {
			return json({ status: 'error', message: 'Ticket is for a different event' });
		}
		if (verifyData.status === 'refunded') {
			return json({ status: 'error', message: 'This ticket has been refunded' });
		}
		if (verifyData.status === 'used') {
			return json({
				status: 'already_checked_in',
				message: `Already checked in at ${verifyData.checked_in_at ?? 'unknown time'}`
			});
		}

		// Step 2: Check in the ticket
		const checkinData = (await apiRequest(ctx, `/v1/tickets/${ticketId}/check-in`, {
			method: 'POST',
			body: {}
		})) as { success: boolean; already_checked_in: boolean };

		return json({
			status: checkinData.already_checked_in ? 'already_checked_in' : 'checked_in',
			message: checkinData.already_checked_in ? 'Already checked in' : 'Checked in!'
		});
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message, code: e.code }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
