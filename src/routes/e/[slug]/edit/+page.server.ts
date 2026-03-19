import { error, redirect } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';
import type { PageServerLoad } from './$types';
import type { PublicEventData } from '$lib/utils/event-helpers';

export const load: PageServerLoad = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) redirect(302, `/e/${params.slug}`);

	const session = await getSession(kv, cookies);
	if (!session) redirect(302, `/e/${params.slug}`);

	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';

	try {
		const res = await fetch(`${backendUrl}/v1/events/by-slug/${encodeURIComponent(params.slug)}`);
		if (!res.ok) error(404, { message: 'Event not found' });

		const data = (await res.json()) as PublicEventData;
		return {
			event: data.event,
			slug: params.slug
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		error(503, { message: 'Service unavailable' });
	}
};
