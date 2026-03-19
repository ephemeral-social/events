import { json } from '@sveltejs/kit';
import { createApiContext, ApiError } from '$lib/server/api';
import { getSession } from '$lib/server/session';
import type { RequestHandler } from './$types';

/** POST /api/media/upload — Presign + upload file to backend R2 in one step */
export const POST: RequestHandler = async ({ request, cookies, platform }) => {
	const kv = platform?.env?.SESSIONS;
	if (!kv) return json({ error: 'Service unavailable' }, { status: 503 });

	const session = await getSession(kv, cookies);
	if (!session) return json({ error: 'Not authenticated' }, { status: 401 });

	const ctx = createApiContext(platform, session, cookies);

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		if (!file) return json({ error: 'No file provided' }, { status: 400 });

		const mediaType = 'image';
		const fileName = file.name || 'upload.jpg';
		const contentType = file.type || 'image/jpeg';

		// Step 1: Get presigned upload URL from backend
		const presignRes = await fetch(
			`${ctx.backendUrl}/v1/media/presign?media_type=${encodeURIComponent(mediaType)}&file_name=${encodeURIComponent(fileName)}&content_type=${encodeURIComponent(contentType)}`,
			{
				headers: { Authorization: `Bearer ${ctx.accessToken}` }
			}
		);

		if (!presignRes.ok) {
			const err = await presignRes.json().catch(() => ({}));
			throw new ApiError(
				presignRes.status,
				'PRESIGN_FAILED',
				(err as any).message || 'Failed to get upload URL'
			);
		}

		const { upload_url, r2_key } = (await presignRes.json()) as {
			upload_url: string;
			r2_key: string;
			expires_at: string;
		};

		// Step 2: Upload file bytes to the presigned URL
		const fileBuffer = await file.arrayBuffer();
		const uploadRes = await fetch(upload_url, {
			method: 'PUT',
			headers: { 'Content-Type': contentType },
			body: fileBuffer
		});

		if (!uploadRes.ok) {
			throw new ApiError(uploadRes.status, 'UPLOAD_FAILED', 'Failed to upload file');
		}

		return json({ key: r2_key });
	} catch (e) {
		if (e instanceof ApiError) {
			return json({ error: e.message }, { status: e.status });
		}
		console.error('Upload error:', e);
		return json({ error: 'Upload failed' }, { status: 500 });
	}
};
