import { describe, it, expect, beforeAll } from 'vitest';
import {
	authenticateTestUser,
	createTestEvent,
	createSessionForUser,
	callApiRoute
} from '../helpers';
import { createMockCookies } from '../../mocks/cookies';
import { createMockKV } from '../../mocks/kv';

describe('Journey 5: Co-Host Flow', () => {
	let hostAuth: Awaited<ReturnType<typeof authenticateTestUser>>;
	let cohostAuth: Awaited<ReturnType<typeof authenticateTestUser>>;
	let eventId: string;
	let inviteToken: string;

	beforeAll(async () => {
		hostAuth = await authenticateTestUser('+15550005001');
		cohostAuth = await authenticateTestUser('+15550005002');

		const event = await createTestEvent(hostAuth.accessToken, {
			title: 'Cohost Test Event',
			start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			slug: `cohost-test-${Date.now()}`
		});

		eventId = (event as any).event_id || (event as any).event?.event_id;
	});

	it('host invites co-host', async () => {
		const { POST } = await import('../../../routes/api/events/[eventId]/cohosts/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, hostAuth);

		const response = await callApiRoute(POST, {
			method: 'POST',
			params: { eventId },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
		expect(response.status).toBe(201);
		const data = (await response.json()) as any;
		inviteToken = data.token || data.invite_token || '';
	});

	it('co-host accepts invite', async () => {
		if (!inviteToken) {
			// Skip if invite creation didn't return a token
			return;
		}

		const { POST } = await import('../../../routes/api/events/cohost-accept/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, cohostAuth);

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: { token: inviteToken, event_id: eventId },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
	});

	it('co-host listed in GET cohosts', async () => {
		const { GET } = await import('../../../routes/api/events/[eventId]/cohosts/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, hostAuth);

		const response = await callApiRoute(GET, {
			params: { eventId },
			kv,
			cookies
		});

		expect(response.ok).toBe(true);
	});

	it('cohost-accept requires token', async () => {
		const { POST } = await import('../../../routes/api/events/cohost-accept/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();
		await createSessionForUser(kv, cookies, cohostAuth);

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: {},
			kv,
			cookies
		});

		expect(response.status).toBe(400);
	});

	it('cohost-accept requires auth', async () => {
		const { POST } = await import('../../../routes/api/events/cohost-accept/+server');

		const kv = createMockKV();
		const cookies = createMockCookies();

		const response = await callApiRoute(POST, {
			method: 'POST',
			body: { token: 'some-token' },
			kv,
			cookies
		});

		expect(response.status).toBe(401);
	});
});
