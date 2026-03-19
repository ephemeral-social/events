import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession } from '../helpers';
import { mockFetch, mockFetchTextResponse } from '../mocks/fetch';

// D15: Calendar route tests

async function seedSession(
	kv: ReturnType<typeof createMockKV>,
	cookies: ReturnType<typeof createMockCookies>
) {
	const session = createMockSession();
	await kv.put('session:test-sid', JSON.stringify(session));
	cookies.set('eph_session', 'test-sid');
}

describe('GET /api/events/[eventId]/calendar', () => {
	let handler: typeof import('../../routes/api/events/[eventId]/calendar/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/[eventId]/calendar/+server');
		handler = mod.GET;
	});

	it('returns 401 without session', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		// No session seeded

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(401);
		const text = await response.text();
		expect(text).toBe('Not authenticated');
	});

	it('returns text/calendar Content-Type and Content-Disposition', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		const icsContent = [
			'BEGIN:VCALENDAR',
			'VERSION:2.0',
			'BEGIN:VEVENT',
			'SUMMARY:Test Event',
			'END:VEVENT',
			'END:VCALENDAR'
		].join('\r\n');

		mockFetch(mockFetchTextResponse(200, icsContent, 'text/calendar'));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);

		const contentType = response.headers.get('Content-Type');
		expect(contentType).toBe('text/calendar; charset=utf-8');

		const disposition = response.headers.get('Content-Disposition');
		expect(disposition).toBe('attachment; filename="event.ics"');

		const body = await response.text();
		expect(body).toContain('BEGIN:VCALENDAR');
	});

	it('returns 503 without KV', async () => {
		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } } as any
		});
		(event.platform as any).env.SESSIONS = undefined;

		const response = await handler(event as any);
		expect(response.status).toBe(503);
		const text = await response.text();
		expect(text).toBe('Service unavailable');
	});

	it('returns 503 on network error', async () => {
		const kv = createMockKV();
		const cookies = createMockCookies();
		await seedSession(kv, cookies);

		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network fail'));

		const event = createMockRequestEvent({
			params: { eventId: 'evt-001' },
			cookies,
			platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(503);
		const text = await response.text();
		expect(text).toBe('Service unavailable');
	});
});
