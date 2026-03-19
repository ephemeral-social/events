import { describe, it, expect, beforeAll } from 'vitest';
import { authenticateTestUser, createTestEvent, createE2EPlatform } from '../helpers';
import { createMockCookies } from '../../mocks/cookies';
import { createMockKV } from '../../mocks/kv';

describe('Journey 1: Anonymous Event Viewing', () => {
	let hostToken: string;
	let eventSlug: string;
	let eventData: Record<string, unknown>;

	beforeAll(async () => {
		// Create a host and an event
		const host = await authenticateTestUser('+15550001001');
		hostToken = host.accessToken;

		eventData = await createTestEvent(hostToken, {
			title: 'Anonymous Viewing Test Event',
			description: 'Testing anonymous access',
			start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
			slug: `anon-view-test-${Date.now()}`,
			visibility: 'public',
			show_guest_list: false,
			location_hidden: true
		});

		eventSlug = (eventData as any).slug || (eventData as any).event?.slug;
	});

	it('loads event page by slug via page server load', async () => {
		const { load } = await import('../../../routes/e/[slug]/+page.server');
		const platform = createE2EPlatform();
		const cookies = createMockCookies();

		const result = await load({
			params: { slug: eventSlug },
			platform,
			cookies
		} as any);

		expect(result.eventData).toBeDefined();
		expect(result.slug).toBe(eventSlug);
	});

	it('returns RSVP counts in event data', async () => {
		const { load } = await import('../../../routes/e/[slug]/+page.server');
		const platform = createE2EPlatform();
		const cookies = createMockCookies();

		const result = await load({
			params: { slug: eventSlug },
			platform,
			cookies
		} as any);

		const data = result.eventData as any;
		expect(data.rsvp_counts).toBeDefined();
		expect(typeof data.rsvp_counts.going).toBe('number');
	});

	it('does not expose guest list when show_guest_list is false', async () => {
		const { load } = await import('../../../routes/e/[slug]/+page.server');
		const platform = createE2EPlatform();
		const cookies = createMockCookies();

		const result = await load({
			params: { slug: eventSlug },
			platform,
			cookies
		} as any);

		// Guest list is not part of the event page data (it's a separate endpoint)
		// The event data should show that guest list is not enabled
		const data = result.eventData as any;
		expect(data.event.show_guest_list).toBeFalsy();
	});

	it('returns myRsvp as null for anonymous viewer', async () => {
		const { load } = await import('../../../routes/e/[slug]/+page.server');
		const platform = createE2EPlatform();
		const cookies = createMockCookies();

		const result = await load({
			params: { slug: eventSlug },
			platform,
			cookies
		} as any);

		expect(result.myRsvp).toBeNull();
	});

	it('returns 404 for non-existent slug', async () => {
		const { load } = await import('../../../routes/e/[slug]/+page.server');
		const platform = createE2EPlatform();
		const cookies = createMockCookies();

		try {
			await load({
				params: { slug: 'non-existent-event-slug-xyz' },
				platform,
				cookies
			} as any);
			expect.fail('Should have thrown 404');
		} catch (e: any) {
			expect(e.status).toBe(404);
		}
	});
});
