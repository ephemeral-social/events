import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import {
	authenticateViaBackend,
	createEventViaBackend,
	createCohostInviteViaBackend
} from '../../fixtures/backend-api';

test.describe('Cohost Flow', () => {
	test('accept invite via page and verify success', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Cohost Flow Accept'),
			slug: uniqueSlug('cohost-flo-1'),
			start_time: futureDate()
		});
		const invite = await createCohostInviteViaBackend(host.accessToken, event.event_id);

		await authenticateAs('+15550990350');
		await page.goto(`/e/${event.slug}/cohost/${invite.invite_token}`);
		await expect(page.locator(SEL.COHOST_ACCEPT)).toBeVisible();
		await page.locator(SEL.COHOST_ACCEPT).click();
		await expect(page.locator(SEL.COHOST_SUCCESS)).toBeVisible({ timeout: 10_000 });
	});

	test('invalid/expired token shows error state', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Cohost Flow Error'),
			slug: uniqueSlug('cohost-flo-2'),
			start_time: futureDate()
		});

		await authenticateAs('+15550990351');
		await page.goto(`/e/${event.slug}/cohost/expired-invalid-token`);
		await page.locator(SEL.COHOST_ACCEPT).click();
		await expect(page.locator(SEL.COHOST_ERROR)).toBeVisible({ timeout: 10_000 });
		await expect(page.locator('a:has-text("View Event")')).toBeVisible();
	});
});
