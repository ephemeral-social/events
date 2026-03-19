import { describe, it, expect, beforeAll } from 'vitest';
import {
	authenticateTestUser,
	createTestEvent,
	createSessionForUser,
	createE2EPlatform,
	callApiRoute
} from '../helpers';
import { createMockCookies } from '../../mocks/cookies';
import { createMockKV } from '../../mocks/kv';

describe('Journey 4: Event Creation & Management', () => {
	let hostAuth: Awaited<ReturnType<typeof authenticateTestUser>>;

	beforeAll(async () => {
		hostAuth = await authenticateTestUser('+15550004001');
	});

	it('creates event with all fields', async () => {
		const { POST } = await import('../../../routes/api/events/create/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, hostAuth);

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: {
				title: 'Management Test Event',
				description: 'A fully specified event',
				start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
				timezone: 'America/New_York',
				slug: `mgmt-test-${Date.now()}`,
				visibility: 'public',
				venue_name: 'Test Venue',
				venue_address: '123 Test St'
			},
			kv,
			cookies
		});

		expect(response.status).toBe(201);
		const data = (await response.json()) as any;
		expect(data).toBeDefined();
	});

	it('event accessible by slug after creation', async () => {
		const slug = `access-test-${Date.now()}`;
		await createTestEvent(hostAuth.accessToken, {
			title: 'Access Test Event',
			start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			slug
		});

		const { load } = await import('../../../routes/e/[slug]/+page.server');
		const platform = createE2EPlatform();
		const cookies = createMockCookies();

		const result = await load({
			params: { slug },
			platform,
			cookies
		} as any);

		expect(result.eventData).toBeDefined();
		expect(result.slug).toBe(slug);
	});

	it('updates event settings', async () => {
		const event = await createTestEvent(hostAuth.accessToken, {
			title: 'Settings Test Event',
			start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			slug: `settings-test-${Date.now()}`,
			show_guest_list: false
		});

		const eventId = (event as any).event_id || (event as any).event?.event_id;

		const { PUT } = await import('../../../routes/api/events/[eventId]/settings/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, hostAuth);

		const response = await callApiRoute(PUT, {
			method: 'PUT',
			body: { show_guest_list: 1 },
			params: { eventId },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
	});

	it('my-events shows hosted event', async () => {
		const { GET } = await import('../../../routes/api/my-events/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, hostAuth);

		const response = await callApiRoute(GET, {
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
		const data = (await response.json()) as any;
		expect(data).toBeDefined();
	});

	it('event creation requires auth', async () => {
		const { POST } = await import('../../../routes/api/events/create/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: { title: 'Should Fail' },
			kv,
			cookies
		});

		expect(response.status).toBe(401);
	});

	it('create page redirects when unauthenticated', async () => {
		const { load } = await import('../../../routes/create/+page.server');

		try {
			await load({
				cookies: createMockCookies(),
				platform: createE2EPlatform()
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/?auth=required');
		}
	});

	it('my-events page redirects when unauthenticated', async () => {
		const { load } = await import('../../../routes/my-events/+page.server');

		try {
			await load({
				cookies: createMockCookies(),
				platform: createE2EPlatform()
			} as any);
			expect.fail('Should have redirected');
		} catch (e: any) {
			expect(e.status).toBe(302);
			expect(e.location).toBe('/?auth=required');
		}
	});
});
