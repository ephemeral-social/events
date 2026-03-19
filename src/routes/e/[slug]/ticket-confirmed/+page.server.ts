import { redirect } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) redirect(302, `/e/${params.slug}`);

	const session = await getSession(kv, cookies);
	if (!session) redirect(302, `/e/${params.slug}`);

	return { slug: params.slug };
};
