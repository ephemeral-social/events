import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import {
	authenticateViaBackend,
	createEventViaBackend,
	rsvpViaBackend
} from '../../fixtures/backend-api';

test.describe('Text Blast', () => {
	test('text blast form renders for host, hidden for non-hosts', async ({
		page,
		authenticateAs
	}) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Text Blast Host'),
			slug: uniqueSlug('text-blast-1'),
			start_time: futureDate()
		});

		// As host — should see TextBlastForm
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}`);
		await expect(page.locator(SEL.TEXT_BLAST_MESSAGE)).toBeVisible();

		// As non-host guest — should NOT see it
		const guest = await authenticateViaBackend('+15550990370');
		await rsvpViaBackend(guest.accessToken, event.event_id, {
			status: 'going',
			display_name: 'Non-Host'
		});
		await page.context().clearCookies();
		await authenticateAs('+15550990370');
		await page.goto(`/e/${event.slug}`);
		await expect(page.locator(SEL.TEXT_BLAST_MESSAGE)).toBeHidden();
	});

	test('send message with confirm dialog', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Text Blast Send'),
			slug: uniqueSlug('text-blast-2'),
			start_time: futureDate()
		});

		// Add a guest RSVP so the text blast has recipients
		const guest = await authenticateViaBackend(PHONE_NUMBERS.GUEST_1);
		await rsvpViaBackend(guest.accessToken, event.event_id, {
			status: 'going',
			display_name: 'Blast Guest'
		});

		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}`);

		await page.locator(SEL.TEXT_BLAST_MESSAGE).fill('Hello everyone!');

		// Accept the confirm dialog
		page.on('dialog', (dialog) => dialog.accept());
		await page.locator(SEL.TEXT_BLAST_SEND).click();

		// Verify success message appears
		await expect(
			page.locator('text=Message sent to all guests!')
		).toBeVisible({ timeout: 10_000 });
	});
});
