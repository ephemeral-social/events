import { json } from '@sveltejs/kit';
import { validateBackendUrl } from '$lib/server/api';
import type { RequestHandler } from './$types';

/** POST /api/checkin-tokens/validate — Validate a checkin token (no session required) */
export const POST: RequestHandler = async ({ request, platform }) => {
	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';
	try {
		validateBackendUrl(backendUrl);
	} catch {
		return json({ error: 'Service unavailable' }, { status: 503 });
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const token = body.token;
	if (!token || typeof token !== 'string') {
		return json({ error: 'Missing token' }, { status: 400 });
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 10_000);
		const res = await fetch(`${backendUrl}/v1/checkin-tokens/validate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token }),
			signal: controller.signal
		});
		clearTimeout(timeout);

		const data = await res.json();
		return json(data, { status: res.status });
	} catch {
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
