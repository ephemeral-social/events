import { redirect } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) {
		redirect(302, '/?auth=required');
	}

	const session = await getSession(kv, cookies);
	if (!session) {
		redirect(302, '/?auth=required');
	}

	return {
		user: {
			userId: session.userId,
			displayName: session.displayName
		}
	};
};
