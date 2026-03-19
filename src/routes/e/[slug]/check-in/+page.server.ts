import { redirect } from '@sveltejs/kit';
import { getSession, getCheckinSession, createCheckinSession } from '$lib/server/session';
import { validateBackendUrl } from '$lib/server/api';
import type { PageServerLoad } from './$types';
import type { PublicEventData } from '$lib/utils/event-helpers';

export const load: PageServerLoad = async ({ params, url, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) redirect(302, `/e/${params.slug}`);

	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';
	validateBackendUrl(backendUrl);

	// Path 1: ?token=X query param -> validate -> create checkin session -> redirect clean
	const tokenParam = url.searchParams.get('token');
	if (tokenParam) {
		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 10_000);
			const res = await fetch(`${backendUrl}/v1/checkin-tokens/validate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: tokenParam }),
				signal: controller.signal
			});
			clearTimeout(timeout);

			if (res.ok) {
				const data = (await res.json()) as {
					valid: boolean;
					event_id: string;
					expires_at: string;
				};
				if (data.valid) {
					const ttl = Math.max(
						Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000),
						60
					);
					await createCheckinSession(
						kv,
						cookies,
						{ token: tokenParam, eventId: data.event_id },
						ttl,
						url
					);
					// Redirect to same URL without the token param
					const cleanUrl = new URL(url);
					cleanUrl.searchParams.delete('token');
					redirect(302, cleanUrl.pathname);
				}
			}
		} catch (e) {
			// If redirect, re-throw
			if (e && typeof e === 'object' && 'status' in e) throw e;
			// Validation failed — fall through to other auth paths
		}
	}

	// Path 2: Checkin session cookie exists
	const checkinSession = await getCheckinSession(kv, cookies);
	if (checkinSession) {
		try {
			const res = await fetch(
				`${backendUrl}/v1/events/by-slug/${encodeURIComponent(params.slug)}`
			);
			if (res.ok) {
				const data = (await res.json()) as PublicEventData;
				if (data.event.event_id === checkinSession.eventId) {
					return {
						slug: params.slug,
						eventId: data.event.event_id,
						eventTitle: data.event.title,
						isTokenAuth: true
					};
				}
			}
		} catch {
			// Fall through
		}
	}

	// Path 3: User session exists -> verify host/cohost
	const session = await getSession(kv, cookies);
	if (session) {
		try {
			const res = await fetch(
				`${backendUrl}/v1/events/by-slug/${encodeURIComponent(params.slug)}`
			);
			if (res.ok) {
				const data = (await res.json()) as PublicEventData;
				const isHost = session.userId === data.host?.user_id;
				// Allow hosts to access check-in
				if (isHost) {
					return {
						slug: params.slug,
						eventId: data.event.event_id,
						eventTitle: data.event.title,
						isTokenAuth: false
					};
				}
			}
		} catch {
			// Fall through
		}
	}

	// Path 4: No valid auth -> redirect to event page
	redirect(302, `/e/${params.slug}`);
};
