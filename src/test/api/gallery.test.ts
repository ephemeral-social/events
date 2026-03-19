import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D10: Gallery route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('GET /api/events/[eventId]/gallery', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/gallery/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/gallery/+server');
		handler = mod.GET;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('forwards pagination params and returns gallery data', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const galleryData = {
			photos: [{ photo_id: 'ph-001', url: 'https://r2.example.com/photo.jpg' }],
			has_more: true
		};
		const spy = mockFetch(mockFetchJsonResponse(200, galleryData));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			searchParams: { limit: '10', after: 'cursor-xyz' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.photos).toHaveLength(1);

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/gallery');
		expect(url).toContain('limit=10');
		expect(url).toContain('after=cursor-xyz');
	});
});

describe('POST /api/events/[eventId]/gallery', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/gallery/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/gallery/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: {}
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('handles presign → upload → gallery POST flow', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		// Mock fetch for 3 sequential calls: presign, upload, gallery POST
		let callCount = 0;
		const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
			callCount++;
			const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.toString() : (url as Request).url;
			if (urlStr.includes('/v1/media/presign')) {
				// Step 1: presign response
				return new Response(JSON.stringify({
					upload_url: 'http://127.0.0.1:8787/v1/media/upload/tok-123',
					r2_key: 'images/user-123/photo.jpg'
				}), { status: 200 });
			} else if (urlStr.includes('/v1/media/upload/')) {
				// Step 2: upload response
				return new Response(JSON.stringify({ success: true, r2_key: 'images/user-123/photo.jpg' }), { status: 200 });
			} else if (urlStr.includes('/v1/events/evt-001/gallery')) {
				// Step 3: gallery entry creation
				return new Response(JSON.stringify({ photo_id: 'ph-new', media_r2_key: 'images/user-123/photo.jpg' }), { status: 201 });
			}
			return new Response('Not found', { status: 404 });
		});

		// Create a request with FormData
		const formData = new FormData();
		formData.append('photo', new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' }));

		const request = new Request('http://localhost:5173/api/events/evt-001/gallery', {
			method: 'POST',
			body: formData
		});

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});
		(event as any).request = request;

		const response = await handler(event as any);
		expect(response.status).toBe(201);
		const data = await response.json();
		expect(data.photo_id).toBe('ph-new');

		// Verify 3 calls were made: presign, upload, gallery POST
		expect(spy).toHaveBeenCalledTimes(3);

		// Call 1: presign
		const presignUrl = typeof spy.mock.calls[0][0] === 'string' ? spy.mock.calls[0][0] : '';
		expect(presignUrl).toContain('/v1/media/presign');
		expect(presignUrl).toContain('media_type=image');

		// Call 2: upload (PUT)
		const uploadUrl = typeof spy.mock.calls[1][0] === 'string' ? spy.mock.calls[1][0] : '';
		expect(uploadUrl).toContain('/v1/media/upload/tok-123');

		// Call 3: gallery POST with JSON body
		const galleryUrl = typeof spy.mock.calls[2][0] === 'string' ? spy.mock.calls[2][0] : '';
		expect(galleryUrl).toContain('/v1/events/evt-001/gallery');

		spy.mockRestore();
	});

	it('returns 400 when no photo provided', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		// FormData without a photo
		const formData = new FormData();
		const request = new Request('http://localhost:5173/api/events/evt-001/gallery', {
			method: 'POST',
			body: formData
		});

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});
		(event as any).request = request;

		const response = await handler(event as any);
		expect(response.status).toBe(400);
		const data = await response.json();
		expect(data.error).toBe('No photo provided');
	});

	it('returns 503 without KV', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: {},
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } } as any
		});
		(event.platform as any).env.SESSIONS = undefined;

		const response = await handler(event as any);
		expect(response.status).toBe(503);
	});
});
