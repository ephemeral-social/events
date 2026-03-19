import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { EventPageData } from '$lib/utils/event-helpers';
import { isTombstone } from '$lib/utils/event-helpers';
import { getSession } from '$lib/server/session';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';

interface MyRsvp {
	status: string;
	plus_ones: number;
	display_name: string;
	payment_status?: string;
	responded_at?: string;
	sms_reminders?: number;
	sms_blasts?: number;
}

export const load: PageServerLoad = async ({ params, platform, cookies }) => {
	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';

	try {
		// Check session early so we can pass auth on the initial fetch
		// (needed for location_hidden reveal for RSVP'd users)
		const kv = platform?.env?.SESSIONS;
		const session = kv ? await getSession(kv, cookies) : null;

		const fetchHeaders: Record<string, string> = {};
		if (session?.accessToken) {
			fetchHeaders['Authorization'] = `Bearer ${session.accessToken}`;
		}

		const res = await fetch(
			`${backendUrl}/v1/events/by-slug/${encodeURIComponent(params.slug)}`,
			{ headers: fetchHeaders }
		);

		if (res.status === 404) {
			error(404, { message: 'Event not found' });
		}

		if (!res.ok) {
			error(res.status, { message: 'Failed to load event' });
		}

		const data = (await res.json()) as EventPageData;

		// If tombstone, no need to check RSVP
		if (isTombstone(data)) {
			return { eventData: data, slug: params.slug, myRsvp: null, isHost: false, isAuthenticated: false };
		}

		// Check for authenticated user's RSVP
		let myRsvp: MyRsvp | null = null;
		let myRsvpReminder: { id: string; remind_date: string } | null = null;
		let isAuthenticated = false;
		let isHost = false;
		let isAdmin = false;
		let userDisplayName: string | null = null;
		let userFirstName: string | null = null;
		let userLastName: string | null = null;
		let needsTicketingSetup = false;
		let ticketingPending = false;

		// ticketing_ready comes from the public API (no auth needed)
		const ticketingReady = data.ticketing_ready ?? true;

		// Fetch survey questions (public, no auth needed)
		let surveyQuestions: any[] = [];
		try {
			const sqRes = await fetch(`${backendUrl}/v1/events/${data.event.event_id}/survey/questions`);
			if (sqRes.ok) {
				const sqData = await sqRes.json() as { questions?: any[] };
				surveyQuestions = sqData.questions || [];
			}
		} catch {
			// Non-critical — survey questions not available
		}

		let mySurveyResponses: any[] = [];

		if (session) {
			isAuthenticated = true;
			isHost = session.userId === data.host?.user_id;
			// Admin user — grants host-like access on all events
			const adminUserId = platform?.env?.ADMIN_USER_ID;
			if (adminUserId && session.userId === adminUserId) {
				isAdmin = true;
			}
			userDisplayName = session.displayName ?? null;
			userFirstName = session.firstName ?? null;
			userLastName = session.lastName ?? null;
			const ctx = createApiContext(platform, session, cookies);
			try {
				myRsvp = await apiRequest<MyRsvp>(ctx, `/v1/events/${data.event.event_id}/my-rsvp`);
			} catch (e) {
				if (e instanceof ApiError && e.status === 404) {
					// No RSVP yet — that's fine
				}
				// Other errors silently ignored for page load
			}

			// Check for RSVP reminder (only if no RSVP yet)
			if (!myRsvp) {
				try {
					myRsvpReminder = await apiRequest<{ id: string; remind_date: string }>(
						ctx, `/v1/events/${data.event.event_id}/rsvp-reminder`
					);
				} catch (e) {
					if (e instanceof ApiError && e.status === 404) {
						// No reminder set — fine
					}
				}
			}

			// Fetch user's survey responses if authenticated and questions exist
			if (surveyQuestions.length > 0) {
				try {
					const srData = await apiRequest<{ responses?: any[] }>(ctx, `/v1/events/${data.event.event_id}/survey/my-responses`);
					mySurveyResponses = srData.responses || [];
				} catch {
					// Non-critical
				}
			}

			// Only call /stripe-status when ticketing isn't ready AND user is the host
			// (to distinguish "pending verification" from "not started")
			if (isHost && data.event.web_event_type === 'ticketed' && !ticketingReady) {
				try {
					const stripeStatus = await apiRequest<{ charges_enabled: boolean; details_submitted: boolean }>(ctx, '/v1/payments/stripe-status');
					if (!stripeStatus.charges_enabled) {
						needsTicketingSetup = true;
						ticketingPending = stripeStatus.details_submitted;
					}
				} catch {
					needsTicketingSetup = true;
				}
			}
		}

		return {
			eventData: data,
			slug: params.slug,
			myRsvp,
			myRsvpReminder,
			isHost,
			isAdmin,
			isAuthenticated,
			displayName: userDisplayName,
			firstName: userFirstName,
			lastName: userLastName,
			needsTicketingSetup,
			ticketingPending,
			ticketingReady,
			stripePublishableKey: platform?.env?.STRIPE_PUBLISHABLE_KEY || '',
			surveyQuestions,
			mySurveyResponses
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		error(503, { message: 'Service unavailable' });
	}
};
