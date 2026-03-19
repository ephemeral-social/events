import { json } from '@sveltejs/kit';
import { createApiContext, apiRequest, ApiError, validatePathParam } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** GET — List gallery photos */
export const GET: RequestHandler = async ({ params, url, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);
	const qs = new URLSearchParams();
	const rawLimit = parseInt(url.searchParams.get('limit') || '20', 10);
	qs.set('limit', String(Math.max(1, Math.min(100, isNaN(rawLimit) ? 20 : rawLimit))));
	const after = url.searchParams.get('after');
	if (after) qs.set('after', after);

	try {
		const data = await apiRequest(ctx, `/v1/events/${params.eventId}/gallery?${qs.toString()}`);
		return json(data);
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};

/** POST — Upload photo (handles presign → R2 upload → gallery entry) */
export const POST: RequestHandler = async ({ params, request, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	validatePathParam(params.eventId);

	const ctx = createApiContext(platform, session, cookies);

	try {
		// 1. Parse the uploaded file from FormData
		const formData = await request.formData();
		const file = formData.get('photo') as File | null;
		if (!file) return json({ error: 'No photo provided' }, { status: 400 });

		// 2. Get presigned upload URL from backend
		const presignQs = `?media_type=image&file_name=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`;
		const presign = await apiRequest<{ upload_url: string; r2_key: string }>(
			ctx,
			`/v1/media/presign${presignQs}`
		);

		// 3. Upload file to R2 via the presigned URL
		const uploadRes = await fetch(presign.upload_url, {
			method: 'PUT',
			headers: { 'Content-Type': file.type },
			body: await file.arrayBuffer()
		});
		if (!uploadRes.ok) {
			return json({ error: 'Failed to upload photo' }, { status: 502 });
		}

		// 4. Create gallery entry with the R2 key
		const data = await apiRequest(ctx, `/v1/events/${params.eventId}/gallery`, {
			method: 'POST',
			body: {
				media_r2_key: presign.r2_key,
				media_mime_type: file.type,
				media_size_bytes: file.size
			}
		});
		return json(data, { status: 201 });
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message, code: e.code }, { status: e.status });
		}
		return json({ error: 'Service unavailable' }, { status: 503 });
	}
};
