import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend } from '../../fixtures/backend-api';

test.describe('Edit Event', () => {
	test('form pre-populated with event data', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const title = uniqueEventTitle('Edit Pre-pop');
		const event = await createEventViaBackend(host.accessToken, {
			title,
			slug: uniqueSlug('edit-prepop'),
			description: 'Original description',
			start_time: futureDate(),
			venue_name: 'Original Venue',
			venue_address: '123 Original St'
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/edit`);
		await expect(page.locator(SEL.EDIT_TITLE)).toHaveValue(title);
		await expect(page.locator(SEL.EDIT_DESCRIPTION)).toHaveValue('Original description');
		await expect(page.locator(SEL.EDIT_VENUE)).toHaveValue('Original Venue');
		await expect(page.locator(SEL.EDIT_ADDRESS)).toHaveValue('123 Original St');
	});

	test('update title and verify on event page', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Edit Title'),
			slug: uniqueSlug('edit-event-1'),
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/edit`);
		const newTitle = `Updated Title ${Date.now()}`;
		await page.locator(SEL.EDIT_TITLE).clear();
		await page.locator(SEL.EDIT_TITLE).fill(newTitle);
		await page.locator(SEL.EDIT_SUBMIT).click();
		await expect(page).toHaveURL(`/e/${event.slug}`, { timeout: 15_000 });
		await expect(page.locator('h1, h2').first()).toContainText(newTitle);
	});

	test('update description and verify', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Edit Desc'),
			slug: uniqueSlug('edit-event-2'),
			description: 'Old description',
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/edit`);
		await page.locator(SEL.EDIT_DESCRIPTION).clear();
		await page.locator(SEL.EDIT_DESCRIPTION).fill('New description text');
		await page.locator(SEL.EDIT_SUBMIT).click();
		await expect(page).toHaveURL(`/e/${event.slug}`, { timeout: 15_000 });
		await expect(page.locator('text=New description text')).toBeVisible();
	});

	test('update venue and verify', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Edit Venue'),
			slug: uniqueSlug('edit-event-3'),
			start_time: futureDate(),
			venue_name: 'Old Venue'
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/edit`);
		await page.locator(SEL.EDIT_VENUE).clear();
		await page.locator(SEL.EDIT_VENUE).fill('New Venue');
		await page.locator(SEL.EDIT_SUBMIT).click();
		await expect(page).toHaveURL(`/e/${event.slug}`, { timeout: 15_000 });
		await expect(page.locator('text=New Venue')).toBeVisible();
	});

	test('update address and verify', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Edit Address'),
			slug: uniqueSlug('edit-event-4'),
			start_time: futureDate(),
			venue_address: 'Old Address'
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/edit`);
		await page.locator(SEL.EDIT_ADDRESS).clear();
		await page.locator(SEL.EDIT_ADDRESS).fill('789 New Address Ave');
		await page.locator(SEL.EDIT_SUBMIT).click();
		await expect(page).toHaveURL(`/e/${event.slug}`, { timeout: 15_000 });
		await expect(page.locator('text=789 New Address Ave')).toBeVisible();
	});

	test('Saving loading state', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Edit Loading'),
			slug: uniqueSlug('edit-event-5'),
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/edit`);
		await page.locator(SEL.EDIT_SUBMIT).click();
		await expect(page.locator('button:has-text("Saving...")')).toBeVisible();
	});

	test('redirect to event page after save', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Edit Redirect'),
			slug: uniqueSlug('edit-event-6'),
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/edit`);
		await page.locator(SEL.EDIT_SUBMIT).click();
		await expect(page).toHaveURL(`/e/${event.slug}`, { timeout: 15_000 });
	});

	test('error message on failure', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Edit Error'),
			slug: uniqueSlug('edit-event-7'),
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/edit`);
		await page.route('**/api/events/*', (route) => {
			if (route.request().method() === 'PUT') {
				return route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Server error' })
				});
			}
			return route.continue();
		});
		await page.locator(SEL.EDIT_SUBMIT).click();
		await expect(page.locator('text=/error|failed/i')).toBeVisible({ timeout: 10_000 });
	});

	test('back arrow links to event page', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Edit Back'),
			slug: uniqueSlug('edit-event-8'),
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/edit`);
		await expect(page.locator(SEL.BACK_ARROW)).toHaveAttribute('href', `/e/${event.slug}`);
	});
});
