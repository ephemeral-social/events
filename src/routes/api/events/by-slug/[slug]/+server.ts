import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform }) => {
	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';

	try {
		const res = await fetch(`${backendUrl}/v1/events/by-slug/${encodeURIComponent(params.slug)}`);

		if (!res.ok) {
			if (res.status === 404) {
				return json({ error: 'Event not found' }, { status: 404 });
			}
			return json({ error: 'Failed to load event' }, { status: res.status });
		}

		const data = await res.json();
		return json(data);
	} catch {
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
