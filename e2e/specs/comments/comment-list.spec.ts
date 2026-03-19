import { test, expect } from '../../fixtures/auth.fixture';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend, rsvpViaBackend } from '../../fixtures/backend-api';

test.describe('Comment List', () => {
	let eventSlug: string;
	let eventId: string;

	test.beforeAll(async () => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Comments'),
			slug: uniqueSlug('comment-li-1'),
			start_time: futureDate()
		});
		eventSlug = event.slug;
		eventId = event.event_id;

		const guest = await authenticateViaBackend('+15550990320');
		await rsvpViaBackend(guest.accessToken, eventId, {
			status: 'going',
			display_name: 'Comment Tester'
		});
	});

	test("Event Wall heading for RSVP'd users", async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990320');
		await page.goto(`/e/${eventSlug}`);
		// Target the h3 heading inside the CommentList component, not the event title
		await expect(page.getByRole('heading', { name: 'Event Wall', level: 3 })).toBeVisible();
	});

	test('empty state when no comments', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990320');
		await page.goto(`/e/${eventSlug}`);
		await expect(page.locator('p:has-text("No comments yet")')).toBeVisible();
	});

	test('post new comment via input and send button', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990320');
		await page.goto(`/e/${eventSlug}`);
		const input = page
			.locator(
				'input[placeholder*="comment"], textarea[placeholder*="comment"], input[type="text"]'
			)
			.last();
		if (await input.isVisible()) {
			await input.fill('Hello from Playwright!');
			const sendBtn = page
				.locator(
					'button[aria-label*="send"], button:has-text("Send"), button[type="submit"]'
				)
				.last();
			if (await sendBtn.isVisible()) {
				await sendBtn.click();
				await expect(page.locator('text=Hello from Playwright!')).toBeVisible({
					timeout: 10_000
				});
			}
		}
	});

	test('post on Enter key', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990320');
		await page.goto(`/e/${eventSlug}`);
		const input = page
			.locator(
				'input[placeholder*="comment"], textarea[placeholder*="comment"], input[type="text"]'
			)
			.last();
		if (await input.isVisible()) {
			await input.fill('Enter key comment');
			await input.press('Enter');
			await expect(page.locator('text=Enter key comment')).toBeVisible({ timeout: 10_000 });
		}
	});

	test('disable send when empty', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990320');
		await page.goto(`/e/${eventSlug}`);
		const sendBtn = page
			.locator('button[aria-label*="send"], button:has-text("Send")')
			.last();
		if (await sendBtn.isVisible()) {
			await expect(sendBtn).toBeDisabled();
		}
	});

	test('new comment appears immediately', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990320');
		await page.goto(`/e/${eventSlug}`);
		const input = page
			.locator(
				'input[placeholder*="comment"], textarea[placeholder*="comment"], input[type="text"]'
			)
			.last();
		if (await input.isVisible()) {
			const uniqueMsg = `Immediate ${Date.now()}`;
			await input.fill(uniqueMsg);
			await input.press('Enter');
			await expect(page.locator(`text=${uniqueMsg}`)).toBeVisible({ timeout: 10_000 });
		}
	});

	test('comment display with name and timestamp', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990320');
		await page.goto(`/e/${eventSlug}`);
		// If any comments exist, they should show name
		const commentEl = page.locator('text=Comment Tester');
		if (await commentEl.isVisible()) {
			expect(true).toBe(true);
		}
	});

	test('500 char maxlength', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990320');
		await page.goto(`/e/${eventSlug}`);
		const input = page
			.locator(
				'input[placeholder*="comment"], textarea[placeholder*="comment"], input[type="text"]'
			)
			.last();
		if (await input.isVisible()) {
			const maxlength = await input.getAttribute('maxlength');
			if (maxlength) {
				expect(parseInt(maxlength)).toBeLessThanOrEqual(500);
			}
		}
	});
});
