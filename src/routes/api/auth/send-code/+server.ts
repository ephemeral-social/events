import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: { phone?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { phone } = body;
	if (!phone || typeof phone !== 'string') {
		return json({ error: 'Phone number is required' }, { status: 400 });
	}

	const { env } = await import('$env/dynamic/private');
	const backendUrl = platform?.env?.BACKEND_URL || env.BACKEND_URL || 'http://127.0.0.1:8787';

	try {
		const res = await fetch(`${backendUrl}/v1/auth/phone/send-code`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				phone_e164: phone,
				phone_country_code: '1',
				phone_national_number: phone.replace(/^\+1/, '')
			})
		});

		const data = await res.json();

		if (!res.ok) {
			return json({ error: 'Unable to send verification code' }, { status: res.status });
		}

		return json({
			verification_id: (data as Record<string, string>).verification_id
		});
	} catch {
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
