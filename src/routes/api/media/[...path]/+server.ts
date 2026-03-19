import type { RequestHandler } from './$types';

/** GET /api/media/[...path] — Proxy media from backend R2 */
export const GET: RequestHandler = async ({ params, platform }) => {
	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';
	const key = params.path;

	if (!key) {
		return new Response('Not found', { status: 404 });
	}

	try {
		const res = await fetch(`${backendUrl}/v1/media/${key}`);

		if (!res.ok) {
			return new Response('Not found', { status: 404 });
		}

		return new Response(res.body, {
			headers: {
				'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
				'Cache-Control': 'public, max-age=31536000',
				...(res.headers.get('ETag') ? { ETag: res.headers.get('ETag')! } : {})
			}
		});
	} catch {
		return new Response('Service unavailable', { status: 503 });
	}
};
