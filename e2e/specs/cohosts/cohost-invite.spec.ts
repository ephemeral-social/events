import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import {
	authenticateViaBackend,
	createEventViaBackend,
	createCohostInviteViaBackend
} from '../../fixtures/backend-api';

test.describe('Cohost Invite', () => {
	let eventSlug: string;
	let inviteToken: string;

	test.beforeAll(async () => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Cohost Invite'),
			slug: uniqueSlug('cohost-inv-1'),
			start_time: futureDate()
		});
		eventSlug = event.slug;

		const invite = await createCohostInviteViaBackend(host.accessToken, event.event_id);
		inviteToken = invite.invite_token;
	});

	test('Crown icon and Co-host Invite heading', async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.COHOST);
		await page.goto(`/e/${eventSlug}/cohost/${inviteToken}`);
		await expect(page.locator('h1:has-text("Co-host Invite")')).toBeVisible();
	});

	test('invitation message', async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.COHOST);
		await page.goto(`/e/${eventSlug}/cohost/${inviteToken}`);
		await expect(page.locator('text=invited to co-host')).toBeVisible();
	});

	test('Accept Invite button visible', async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.COHOST);
		await page.goto(`/e/${eventSlug}/cohost/${inviteToken}`);
		await expect(page.locator(SEL.COHOST_ACCEPT)).toBeVisible();
	});

	test('Accepting loading state', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Cohost Loading'),
			slug: uniqueSlug('cohost-inv-2'),
			start_time: futureDate()
		});
		const invite = await createCohostInviteViaBackend(host.accessToken, event.event_id);
		await authenticateAs('+15550990340');
		await page.goto(`/e/${event.slug}/cohost/${invite.invite_token}`);
		await page.locator(SEL.COHOST_ACCEPT).click();
		await expect(page.locator('button:has-text("Accepting...")')).toBeVisible();
	});

	test('success state after accepting', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Cohost Success'),
			slug: uniqueSlug('cohost-inv-3'),
			start_time: futureDate()
		});
		const invite = await createCohostInviteViaBackend(host.accessToken, event.event_id);
		await authenticateAs('+15550990341');
		await page.goto(`/e/${event.slug}/cohost/${invite.invite_token}`);
		await page.locator(SEL.COHOST_ACCEPT).click();
		await expect(page.locator(SEL.COHOST_SUCCESS)).toBeVisible({ timeout: 10_000 });
	});

	test('redirect to event page after 2 seconds', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Cohost Redirect'),
			slug: uniqueSlug('cohost-inv-4'),
			start_time: futureDate()
		});
		const invite = await createCohostInviteViaBackend(host.accessToken, event.event_id);
		await authenticateAs('+15550990342');
		await page.goto(`/e/${event.slug}/cohost/${invite.invite_token}`);
		await page.locator(SEL.COHOST_ACCEPT).click();
		await expect(page.locator(SEL.COHOST_SUCCESS)).toBeVisible({ timeout: 10_000 });
		await expect(page).toHaveURL(`/e/${event.slug}`, { timeout: 5_000 });
	});

	test('error state for invalid token', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990343');
		await page.goto(`/e/${eventSlug}/cohost/invalid-token-xxx`);
		await page.locator(SEL.COHOST_ACCEPT).click();
		await expect(page.locator(SEL.COHOST_ERROR)).toBeVisible({ timeout: 10_000 });
	});
});
