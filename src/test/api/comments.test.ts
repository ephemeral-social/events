import { describe, it, expect, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

// D11: Comments route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('GET /api/events/[eventId]/comments', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/comments/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/comments/+server');
		handler = mod.GET;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('fetches comments with pagination', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const commentData = {
			comments: [{ comment_id: 'cmt-001', body: 'Excited!', user_id: 'u-002' }],
			has_more: false
		};
		const spy = mockFetch(mockFetchJsonResponse(200, commentData));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			searchParams: { limit: '15', after: 'cursor-abc' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data.comments).toHaveLength(1);

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/comments');
		expect(url).toContain('limit=15');
		expect(url).toContain('after=cursor-abc');
	});
});

describe('POST /api/events/[eventId]/comments', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/comments/+server').POST;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/comments/+server');
		handler = mod.POST;
	});

	it('returns 401 without session', async () => {
		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { body: 'Great event!' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
	});

	it('creates comment and returns 201', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const spy = mockFetch(
			mockFetchJsonResponse(201, { comment_id: 'cmt-new', body: 'Great event!' })
		);

		const event = createMockRequestEvent({
			method: 'POST',
			params: { eventId: 'evt-001' },
			body: { body: 'Great event!' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(201);
		const data = await response.json();
		expect(data.comment_id).toBe('cmt-new');

		expect(spy).toHaveBeenCalled();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/evt-001/comments');
	});
});
