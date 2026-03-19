import { redirect } from '@sveltejs/kit';
import type { SessionData } from './session';

/** Require auth — redirects to event page with auth prompt if not logged in */
export function requireAuth(
	session: SessionData | null,
	redirectTo?: string
): asserts session is SessionData {
	if (!session) {
		const url = redirectTo ? `/auth?redirect=${encodeURIComponent(redirectTo)}` : '/auth';
		redirect(302, url);
	}
}
