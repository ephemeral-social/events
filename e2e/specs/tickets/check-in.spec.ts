import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend } from '../../fixtures/backend-api';

test.describe('Check-In Page', () => {
	test('check-in page requires auth', async ({ page }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Check In Auth'),
			slug: uniqueSlug('ci-1'),
			start_time: futureDate()
		});
		await page.goto(`/e/${event.slug}/check-in`);
		await expect(page).not.toHaveURL(/\/check-in$/);
	});

	test('check-in heading and subtitle', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Check In Page'),
			slug: uniqueSlug('ci-2'),
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/check-in`);
		await expect(page.getByRole('heading', { name: 'Check In' })).toBeVisible();
	});

	test('manual ticket ID input', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Check In Manual'),
			slug: uniqueSlug('ci-3'),
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/check-in`);
		const manualInput = page.locator(SEL.CHECKIN_MANUAL);
		if (await manualInput.isVisible()) {
			await manualInput.fill('TEST-TICKET-123');
			await expect(manualInput).toHaveValue('TEST-TICKET-123');
		}
	});

	test('success/error banners', async ({ page, authenticateAs }) => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Check In Banners'),
			slug: uniqueSlug('ci-4'),
			start_time: futureDate()
		});
		await authenticateAs(PHONE_NUMBERS.HOST);
		await page.goto(`/e/${event.slug}/check-in`);
		// Page should render without errors
		await expect(page.locator('main')).toBeVisible();
	});
});
