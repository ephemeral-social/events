import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export interface BlogPost {
	title: string;
	url: string;
	date: string;
	description: string;
	thumbnail: string | null;
}

interface BeehiivPost {
	id: string;
	title: string;
	subtitle: string | null;
	web_url: string;
	thumbnail_url: string | null;
	publish_date: number; // Unix timestamp in seconds
	preview_text: string | null;
	status: string;
}

interface BeehiivResponse {
	data: BeehiivPost[];
	total_results: number;
}

export const GET: RequestHandler = async ({ platform }) => {
	const apiKey = platform?.env?.BEEHIIV_API_KEY ?? env.BEEHIIV_API_KEY;
	const pubId = platform?.env?.BEEHIIV_PUBLICATION_ID ?? env.BEEHIIV_PUBLICATION_ID;

	if (apiKey && pubId) {
		try {
			const res = await fetch(
				`https://api.beehiiv.com/v2/publications/${pubId}/posts?status=confirmed&limit=3&order_by=publish_date&direction=desc`,
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json'
					}
				}
			);

			if (res.ok) {
				const data = (await res.json()) as BeehiivResponse;
				const posts: BlogPost[] = data.data.map((p) => ({
					title: p.title,
					url: p.web_url,
					date: new Date(p.publish_date * 1000).toISOString(),
					description: (p.subtitle || p.preview_text || '').slice(0, 160),
					thumbnail: isDefaultThumbnail(p.thumbnail_url) ? null : p.thumbnail_url
				}));

				if (posts.length > 0) {
					return json(posts, {
						headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' }
					});
				}
			}
		} catch {
			// Fall through to fallback
		}
	}

	// Fallback: static posts until Beehiiv API is configured
	return json(FALLBACK_POSTS, {
		headers: { 'Cache-Control': 'public, max-age=300' }
	});
};

/** Beehiiv assigns a generic landscape thumbnail to posts without a custom image */
function isDefaultThumbnail(url: string | null): boolean {
	if (!url) return true;
	return url.includes('static_assets/defaults/');
}

const FALLBACK_POSTS: BlogPost[] = [
	{
		title: 'Why We Built Ephemeral',
		url: 'https://blog.ephemeralsocial.com',
		date: '2026-02-26',
		description:
			"Social media was supposed to connect us. Instead it monetized our attention, sold our data, and made us miserable. We're building something different.",
		thumbnail: null
	},
	{
		title: 'The Case for Disappearing Content',
		url: 'https://blog.ephemeralsocial.com',
		date: '2026-02-20',
		description:
			'What happens when posts expire, messages delete, and your digital footprint shrinks by default? Less clutter, less anxiety, more presence.',
		thumbnail: null
	},
	{
		title: 'Events Without the Dystopia',
		url: 'https://blog.ephemeralsocial.com',
		date: '2026-02-14',
		description:
			"We launched our free events platform. No ads, no data harvesting, no guest list sold to third parties. Just you and your friends.",
		thumbnail: null
	}
];
