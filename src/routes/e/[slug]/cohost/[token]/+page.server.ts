import { redirect } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) redirect(302, `/e/${params.slug}?cohost_token=${encodeURIComponent(params.token)}`);

	const session = await getSession(kv, cookies);
	if (!session) {
		// Redirect to event page with token — auth flow will resume
		redirect(302, `/e/${params.slug}?cohost_token=${encodeURIComponent(params.token)}`);
	}

	// Resolve slug to event_id for the accept API call
	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';
	const eventRes = await fetch(`${backendUrl}/v1/events/by-slug/${encodeURIComponent(params.slug)}`);
	if (!eventRes.ok) {
		redirect(302, `/e/${params.slug}`);
	}
	const eventData = (await eventRes.json()) as { event: { event_id: string } };

	return {
		slug: params.slug,
		token: params.token,
		eventId: eventData.event.event_id
	};
};
