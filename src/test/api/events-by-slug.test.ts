import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRequestEvent } from '../mocks/request-event';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';
import { createMockEventData } from '../helpers';

// D3: Events by-slug route tests (public, no auth required)

describe('GET /api/events/by-slug/[slug]', () => {
	let handler: typeof import('../../routes/api/events/by-slug/[slug]/+server').GET;

	beforeEach(async () => {
		const mod = await import('../../routes/api/events/by-slug/[slug]/+server');
		handler = mod.GET;
	});

	it('proxies to backend with encoded slug', async () => {
		const eventData = createMockEventData();
		const spy = mockFetch(mockFetchJsonResponse(200, eventData));

		const event = createMockRequestEvent({
			method: 'GET',
			params: { slug: 'summer-party-2025' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(200);

		const data = await response.json();
		expect(data.event.event_id).toBe('evt-001');

		expect(spy).toHaveBeenCalledOnce();
		const [url] = spy.mock.calls[0];
		expect(url).toContain('/v1/events/by-slug/summer-party-2025');
	});

	it('returns event data on success', async () => {
		const eventData = createMockEventData({
			event: { title: 'Beach Bonfire' }
		});
		mockFetch(mockFetchJsonResponse(200, eventData));

		const event = createMockRequestEvent({
			method: 'GET',
			params: { slug: 'beach-bonfire' }
		});

		const response = await handler(event as any);
		const data = await response.json();
		expect(data.event.title).toBe('Beach Bonfire');
	});

	it('forwards backend error status', async () => {
		mockFetch(mockFetchJsonResponse(404, { error: 'Not found' }));

		const event = createMockRequestEvent({
			method: 'GET',
			params: { slug: 'nonexistent' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(404);
		const data = await response.json();
		expect(data.error).toBe('Event not found');
	});

	it('returns 503 on network error', async () => {
		vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network fail'));

		const event = createMockRequestEvent({
			method: 'GET',
			params: { slug: 'test-event' }
		});

		const response = await handler(event as any);
		expect(response.status).toBe(503);
		const data = await response.json();
		expect(data.error).toBe('Service unavailable');
	});
});
