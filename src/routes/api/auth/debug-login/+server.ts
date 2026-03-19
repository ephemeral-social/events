import { json } from '@sveltejs/kit';
import { createSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, platform, url }) => {
	const debugSecret = platform?.env?.DEBUG_TOKEN;
	if (!debugSecret) return json({ error: 'Debug login not configured' }, { status: 404 });

	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	let body: { phone?: string; display_name?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	try {
		const res = await fetch(`${backendUrl}/v1/auth/debug/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Debug-Secret': debugSecret
			},
			body: JSON.stringify({
				phone: body.phone || '+15555550099',
				display_name: body.display_name || 'Debug User'
			})
		});

		const data = (await res.json()) as {
			access_token?: string;
			refresh_token?: string;
			user?: { user_id: string; display_name?: string };
			error?: { message?: string };
		};

		if (!res.ok) {
			return json({ error: data.error?.message || 'Debug login failed' }, { status: res.status });
		}

		if (!data.access_token || !data.refresh_token || !data.user) {
			return json({ error: 'Invalid response from auth service' }, { status: 502 });
		}

		await createSession(kv, cookies, {
			userId: data.user.user_id,
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			displayName: data.user.display_name
		}, url);

		return json({
			success: true,
			user: {
				user_id: data.user.user_id,
				display_name: data.user.display_name
			}
		});
	} catch {
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
