import { json } from '@sveltejs/kit';
import { createSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, platform, url }) => {
	let body: { verification_id?: string; code?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { verification_id, code } = body;
	if (!verification_id || !code) {
		return json({ error: 'verification_id and code are required' }, { status: 400 });
	}

	const backendUrl = platform?.env?.BACKEND_URL || 'http://127.0.0.1:8787';
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	try {
		const res = await fetch(`${backendUrl}/v1/auth/phone/verify-code`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ verification_id, code })
		});

		const data = (await res.json()) as {
			access_token?: string;
			refresh_token?: string;
			user?: {
				user_id: string;
				display_name?: string;
				first_name?: string | null;
				last_name?: string | null;
			};
			message?: string;
		};

		if (!res.ok) {
			return json({ error: data.message || 'Verification failed' }, { status: res.status });
		}

		if (!data.access_token || !data.refresh_token || !data.user) {
			return json({ error: 'Invalid response from auth service' }, { status: 502 });
		}

		await createSession(kv, cookies, {
			userId: data.user.user_id,
			accessToken: data.access_token,
			refreshToken: data.refresh_token,
			displayName: data.user.display_name,
			firstName: data.user.first_name ?? undefined,
			lastName: data.user.last_name ?? undefined
		}, url);

		return json({
			success: true,
			user: {
				display_name: data.user.display_name,
				first_name: data.user.first_name ?? null,
				last_name: data.user.last_name ?? null
			}
		});
	} catch {
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
