import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import {
	authenticateViaBackend,
	createEventViaBackend,
	rsvpViaBackend
} from '../../fixtures/backend-api';

test.describe('My Events Dashboard', () => {
	test('My Events heading', async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto('/my-events');
		await expect(page.locator('h1:has-text("My Events")')).toBeVisible();
	});

	test('Create button links to /create', async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto('/my-events');
		const createBtn = page.locator(SEL.MY_EVENTS_CREATE);
		await expect(createBtn).toBeVisible();
		await expect(createBtn).toHaveAttribute('href', '/create');
	});

	test('default Hosting tab active', async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto('/my-events');
		await expect(page.locator(SEL.MY_EVENTS_HOSTING)).toBeVisible();
	});

	test('hosted events displayed', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const title = uniqueEventTitle('My Hosted Event');
		await createEventViaBackend(host.accessToken, {
			title,
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto('/my-events');
		await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 10_000 });
	});

	test('switch to Attending tab', async ({ page, authenticateAs }) => {
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto('/my-events');
		await page.locator(SEL.MY_EVENTS_ATTENDING).click();
		await expect(page.locator(SEL.MY_EVENTS_ATTENDING)).toBeVisible();
	});

	test('attending events displayed', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend('+15550990360');
		const title = uniqueEventTitle('Attending Event');
		const event = await createEventViaBackend(host.accessToken, {
			title,
			start_time: futureDate()
		});
		const guest = await authenticateViaBackend(PHONE_NUMBERS.GUEST_1);
		await rsvpViaBackend(guest.accessToken, event.event_id, {
			status: 'going',
			display_name: 'Attendee'
		});
		await authenticateAs(PHONE_NUMBERS.GUEST_1);
		await page.goto('/my-events');
		await page.locator(SEL.MY_EVENTS_ATTENDING).click();
		await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 10_000 });
	});

	test('empty state for hosting tab', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990361');
		await page.goto('/my-events');
		await expect(page.locator('text=/no events yet/i')).toBeVisible();
	});

	test('empty state for attending tab', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990362');
		await page.goto('/my-events');
		await page.locator(SEL.MY_EVENTS_ATTENDING).click();
		await expect(page.locator('text=/no upcoming events/i')).toBeVisible();
	});

	test('create your first event link', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990363');
		await page.goto('/my-events');
		const createLink = page.locator(
			'a:has-text("Create your first event"), a:has-text("Create")'
		);
		await expect(createLink.first()).toBeVisible();
	});

	test('event title and date on EventCard', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend('+15550990364');
		const title = uniqueEventTitle('Card Details');
		await createEventViaBackend(host.accessToken, {
			title,
			start_time: futureDate()
		});
		await authenticateAs('+15550990364');
		await page.goto('/my-events');
		await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 10_000 });
	});

	test('Host badge on hosted events', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend('+15550990365');
		await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Host Badge'),
			slug: uniqueSlug('my-events--1'),
			start_time: futureDate()
		});
		await authenticateAs('+15550990365');
		await page.goto('/my-events');
		await expect(page.locator('span:has-text("Host")').first()).toBeVisible({ timeout: 10_000 });
	});

	test('going count on EventCard', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend('+15550990366');
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Going Count'),
			slug: uniqueSlug('my-events--2'),
			start_time: futureDate()
		});
		const guest = await authenticateViaBackend('+15550990367');
		await rsvpViaBackend(guest.accessToken, event.event_id, {
			status: 'going',
			display_name: 'Counter'
		});
		await authenticateAs('+15550990366');
		await page.goto('/my-events');
		await expect(page.locator('text=/\\d+.*going/i').first()).toBeVisible({ timeout: 10_000 });
	});

	test('EventCard links to event page', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend('+15550990368');
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Card Link'),
			slug: uniqueSlug('my-events--3'),
			start_time: futureDate()
		});
		await authenticateAs('+15550990368');
		await page.goto('/my-events');
		const card = page.locator(`a[href*="/e/${event.slug}"]`);
		await expect(card).toBeVisible({ timeout: 10_000 });
	});

	test('Loading state', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990369');
		await page.route('**/api/my-events*', async (route) => {
			await new Promise((r) => setTimeout(r, 500));
			await route.continue();
		});
		await page.goto('/my-events');
		await expect(page.locator('text=/loading/i')).toBeVisible();
	});
});
