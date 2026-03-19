import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pinterestApiFetch } from '$lib/server/pinterest';

/**
 * GET /api/pinterest-board?board_id={id}&host_id={user_id}
 * Fetches board pins using the host's stored Pinterest token from KV.
 * Returns pin data for the InspoDialog masonry grid.
 */
export const GET: RequestHandler = async ({ url, platform }) => {
	const boardId = url.searchParams.get('board_id');
	const hostId = url.searchParams.get('host_id');

	if (!boardId || !hostId) {
		return json({ error: 'board_id and host_id are required' }, { status: 400 });
	}

	if (!/^\d+$/.test(boardId)) {
		return json({ error: 'board_id must be numeric' }, { status: 400 });
	}

	const kv = platform?.env?.SESSIONS;
	if (!kv) {
		return json({ board: null, pins: [] });
	}

	try {
		// Fetch board info
		let boardName = '';
		let pinCount = 0;
		try {
			const boardRes = await pinterestApiFetch(kv, hostId, `/boards/${boardId}`, platform);
			if (boardRes.ok) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const bd = (await boardRes.json()) as any;
				boardName = bd.name || '';
				pinCount = bd.pin_count || 0;
			}
		} catch {
			// Non-critical
		}

		// Fetch pins
		const pinsRes = await pinterestApiFetch(kv, hostId, `/boards/${boardId}/pins?page_size=25`, platform);
		if (!pinsRes.ok) {
			return json({ board: { id: boardId, name: boardName, url: null, pin_count: pinCount }, pins: [] }, {
				headers: { 'Cache-Control': 'public, max-age=300' }
			});
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pinsData = (await pinsRes.json()) as { items: any[] };

		// Extract board_owner username from first pin to build board URL
		const boardOwnerUsername = pinsData.items?.[0]?.board_owner?.username;
		let boardUrl: string | null = null;
		if (boardOwnerUsername && boardName) {
			// Pinterest board URL: /username/board-name-slug/
			const boardSlug = boardName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
			boardUrl = `https://www.pinterest.com/${boardOwnerUsername}/${boardSlug}/`;
		}

		const pins = (pinsData.items || []).map((pin) => {
			// Pinterest API v5 actual image keys: 150x150, 400x300, 600x, 1200x
			const images = pin.media?.images;
			const img = images?.['600x'] || images?.['1200x'] || images?.['400x300'] || images?.['150x150'];
			return {
				id: pin.id,
				title: pin.title || null,
				image_url: img?.url || null,
				width: img?.width || 600,
				height: img?.height || 600
			};
		});

		const boardInfo = { id: boardId, name: boardName, url: boardUrl, pin_count: pinCount };

		return json({ board: boardInfo, pins }, {
			headers: { 'Cache-Control': 'public, max-age=3600' }
		});
	} catch {
		return json({ board: null, pins: [] }, {
			headers: { 'Cache-Control': 'public, max-age=300' }
		});
	}
};
