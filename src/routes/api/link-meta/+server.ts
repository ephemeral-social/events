import type { RequestHandler } from './$types';

/**
 * GET /api/link-meta?url=...
 * Server-side proxy to fetch OG metadata (title, image) from a URL.
 * Needed because Pinterest blocks client-side CORS for HTML pages.
 */
export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');
	if (!targetUrl) {
		return Response.json({ error: 'url parameter required' }, { status: 400 });
	}

	// Only allow Pinterest URLs to avoid being an open proxy
	try {
		const parsed = new URL(targetUrl);
		const host = parsed.hostname.replace(/^www\./, '');
		if (host !== 'pinterest.com' && host !== 'pin.it') {
			return Response.json({ error: 'Only Pinterest URLs supported' }, { status: 400 });
		}
	} catch {
		return Response.json({ error: 'Invalid URL' }, { status: 400 });
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000);

	try {
		// Follow redirects (pin.it -> pinterest.com)
		const res = await fetch(targetUrl, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
			},
			redirect: 'follow',
			signal: controller.signal
		});

		if (!res.ok) {
			return Response.json({ title: null, image: null });
		}

		const html = await res.text();

		// Extract og:title
		const titleMatch = html.match(
			/<meta[^>]+property="og:title"[^>]+content="([^"]*)"[^>]*>/i
		) || html.match(
			/<meta[^>]+content="([^"]*)"[^>]+property="og:title"[^>]*>/i
		);

		// Extract og:image
		const imageMatch = html.match(
			/<meta[^>]+property="og:image"[^>]+content="([^"]*)"[^>]*>/i
		) || html.match(
			/<meta[^>]+content="([^"]*)"[^>]+property="og:image"[^>]*>/i
		);

		// Clean up title — remove " on Pinterest" suffix
		let title = titleMatch?.[1] || null;
		if (title) {
			title = title.replace(/\s+on Pinterest$/, '');
		}

		return Response.json(
			{ title, image: imageMatch?.[1] || null },
			{
				headers: {
					'Cache-Control': 'public, max-age=86400' // cache 24h
				}
			}
		);
	} catch (err) {
		if (err instanceof DOMException && err.name === 'AbortError') {
			return Response.json({ error: 'Request timeout' }, { status: 504 });
		}
		return Response.json({ title: null, image: null });
	} finally {
		clearTimeout(timeout);
	}
};
