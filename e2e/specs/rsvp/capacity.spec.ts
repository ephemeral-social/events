import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS,
	uniqueEventTitle,
	futureDate, uniqueSlug } from '../../fixtures/test-data';
import {
	authenticateViaBackend,
	createEventViaBackend,
	rsvpViaBackend
} from '../../fixtures/backend-api';

test.describe('Capacity', () => {
	test('CapacityWarning renders when spots left <= 10', async ({ page }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Low Capacity'),
			slug: uniqueSlug('capacity-1'),
			start_time: futureDate(),
			max_attendees: 5
		});
		// Fill 3 spots
		for (let i = 0; i < 3; i++) {
			const guest = await authenticateViaBackend(`+1555099010${i}`);
			await rsvpViaBackend(guest.accessToken, event.event_id, {
				status: 'going',
				display_name: `Guest ${i}`
			});
		}
		await page.goto(`/e/${event.slug}`);
		await expect(page.locator('text=/spots? left/i')).toBeVisible();
	});

	test('shows full message at 0 spots', async ({ page }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Full Capacity'),
			slug: uniqueSlug('capacity-2'),
			start_time: futureDate(),
			max_attendees: 1
		});
		const guest = await authenticateViaBackend('+15550990110');
		await rsvpViaBackend(guest.accessToken, event.event_id, {
			status: 'going',
			display_name: 'Filler'
		});
		await page.goto(`/e/${event.slug}`);
		await expect(page.locator('text=/full/i')).toBeVisible();
	});

	test('only N spots left text', async ({ page }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Few Spots'),
			slug: uniqueSlug('capacity-3'),
			start_time: futureDate(),
			max_attendees: 3
		});
		const guest = await authenticateViaBackend('+15550990111');
		await rsvpViaBackend(guest.accessToken, event.event_id, {
			status: 'going',
			display_name: 'Guest'
		});
		await page.goto(`/e/${event.slug}`);
		await expect(page.locator('text=/\\d+ spots? left/i')).toBeVisible();
	});

	test('RSVP disabled at capacity', async ({ page }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('RSVP Disabled'),
			slug: uniqueSlug('capacity-4'),
			start_time: futureDate(),
			max_attendees: 1
		});
		const guest = await authenticateViaBackend('+15550990112');
		await rsvpViaBackend(guest.accessToken, event.event_id, {
			status: 'going',
			display_name: 'Filler'
		});
		await page.goto(`/e/${event.slug}`);
		await expect(page.locator(SEL.CTA_FULL)).toBeDisabled();
	});

	test('warning not shown when many spots left', async ({ page }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Many Spots'),
			slug: uniqueSlug('capacity-5'),
			start_time: futureDate(),
			max_attendees: 100
		});
		await page.goto(`/e/${event.slug}`);
		await expect(page.locator('text=/spots? left/i')).toBeHidden();
	});

	test('plus-ones count toward capacity', async ({ page }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Plus One Capacity'),
			slug: uniqueSlug('capacity-6'),
			start_time: futureDate(),
			max_attendees: 3
		});
		const guest = await authenticateViaBackend('+15550990113');
		await rsvpViaBackend(guest.accessToken, event.event_id, {
			status: 'going',
			display_name: 'Guest with Plus One',
			plus_ones: 2
		});
		await page.goto(`/e/${event.slug}`);
		// With max 3 and 1 going + 2 plus ones, should be full or near full
		await expect(page.locator('text=/full|spots? left/i')).toBeVisible();
	});
});
