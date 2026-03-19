import { json } from '@sveltejs/kit';
import { destroySession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (kv) {
		await destroySession(kv, cookies);
	}
	return json({ success: true });
};
