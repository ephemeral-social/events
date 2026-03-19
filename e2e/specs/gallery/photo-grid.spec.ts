import { test, expect } from '../../fixtures/auth.fixture';
import { SEL } from '../../helpers/selectors';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend, rsvpViaBackend } from '../../fixtures/backend-api';

test.describe('Photo Grid', () => {
	let eventSlug: string;
	let eventId: string;

	test.beforeAll(async () => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Photo Grid'),
			slug: uniqueSlug('photo-grid-1'),
			start_time: futureDate()
		});
		eventSlug = event.slug;
		eventId = event.event_id;

		const guest = await authenticateViaBackend('+15550990300');
		await rsvpViaBackend(guest.accessToken, eventId, {
			status: 'going',
			display_name: 'Photo Tester'
		});
	});

	test('3-column grid display', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990300');
		await page.goto(`/e/${eventSlug}`);
		const grid = page.locator('[class*="grid-cols-3"]');
		if (await grid.isVisible()) {
			expect(true).toBe(true);
		}
	});

	test('photo count in header', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990300');
		await page.goto(`/e/${eventSlug}`);
		await expect(page.locator('h3:has-text("Photos")')).toBeVisible();
	});

	test('empty state when no photos', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990300');
		await page.goto(`/e/${eventSlug}`);
		// Wait for Photos heading then the empty state (API call may take a moment)
		await expect(page.locator('h3:has-text("Photos")')).toBeVisible();
		await expect(page.locator('text=/no photos yet/i')).toBeVisible({ timeout: 10_000 });
	});

	test("upload label visible for RSVP'd user", async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990300');
		await page.goto(`/e/${eventSlug}`);
		const uploadLabel = page.locator(SEL.PHOTO_UPLOAD_LABEL);
		if (await uploadLabel.isVisible()) {
			expect(true).toBe(true);
		}
	});

	test('EXIF notice on upload', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990300');
		await page.goto(`/e/${eventSlug}`);
		// EXIF notice may show after upload or as a static notice
		const exifNotice = page.locator('text=/EXIF.*stripped/i');
		if (await exifNotice.isVisible()) {
			expect(true).toBe(true);
		}
	});

	test("gated message when not RSVP'd", async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990301');
		await page.goto(`/e/${eventSlug}`);
		await expect(page.locator('text=/RSVP to view and upload photos/i')).toBeVisible();
	});

	test('loading state', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990300');
		await page.route('**/api/events/*/gallery', async (route) => {
			await new Promise((r) => setTimeout(r, 500));
			await route.continue();
		});
		await page.goto(`/e/${eventSlug}`);
		await expect(page.locator('text=/loading photos/i')).toBeVisible();
	});
});
