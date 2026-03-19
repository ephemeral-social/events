import { redirect } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';
import { createApiContext, apiRequest, ApiError } from '$lib/server/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, cookies }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) redirect(302, `/e/${params.slug}`);

	const session = await getSession(kv, cookies);
	if (!session) redirect(302, `/e/${params.slug}`);

	// Fetch event by slug
	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';
	const res = await fetch(`${backendUrl}/v1/events/by-slug/${encodeURIComponent(params.slug)}`);
	if (!res.ok) redirect(302, `/e/${params.slug}`);

	const data = (await res.json()) as {
		event: { event_id: string; title: string; start_time: string; end_time?: string; timezone?: string; venue_name?: string; web_event_type?: string; ticket_price_cents?: number; slug: string };
		host?: { user_id: string };
	};

	// Verify user is host
	if (session.userId !== data.host?.user_id) {
		redirect(302, `/e/${params.slug}`);
	}

	// Verify event is ticketed
	if (data.event.web_event_type !== 'ticketed') {
		redirect(302, `/e/${params.slug}`);
	}

	// Check Stripe status — if already onboarded, redirect to event page
	const ctx = createApiContext(platform, session, cookies);
	try {
		const stripeStatus = await apiRequest<{ charges_enabled: boolean; details_submitted: boolean }>(ctx, '/v1/payments/stripe-status');
		if (stripeStatus.charges_enabled) {
			redirect(302, `/e/${params.slug}?ticketing=ready`);
		}
		// If details were submitted but charges not yet enabled, Stripe is verifying.
		// Redirect back to event page which shows the "verification in progress" banner.
		if (stripeStatus.details_submitted) {
			redirect(302, `/e/${params.slug}`);
		}
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		// Stripe status check failed — continue to show onboarding
	}

	return {
		event: data.event,
		slug: params.slug,
		stripePublishableKey: platform?.env?.STRIPE_PUBLISHABLE_KEY || ''
	};
};
