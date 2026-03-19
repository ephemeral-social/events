import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/server/session';
import { pinterestApiFetch } from '$lib/server/pinterest';

/**
 * GET /api/pinterest/boards
 * Fetch user's Pinterest boards using token from KV.
 */
export const GET: RequestHandler = async ({ platform, cookies }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) {
		return json({ boards: [] });
	}

	const session = await getSession(kv, cookies);
	if (!session) {
		return json({ boards: [] }, { status: 401 });
	}

	try {
		const res = await pinterestApiFetch(kv, session.userId, '/boards?page_size=50', platform);
		if (!res.ok) {
			return json({ boards: [] });
		}

		const data = (await res.json()) as {
			items: Array<{
				id: string;
				name: string;
				url: string;
				pin_count: number;
				media?: { image_cover_url?: string };
			}>;
		};

		return json({
			boards: (data.items || []).map((b) => ({
				id: b.id,
				name: b.name,
				url: b.url,
				pin_count: b.pin_count,
				cover_image: b.media?.image_cover_url || null
			}))
		});
	} catch {
		return json({ boards: [] });
	}
};
