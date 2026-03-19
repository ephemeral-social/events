import { test, expect } from '../../fixtures/auth.fixture';
import { PHONE_NUMBERS, uniqueEventTitle, futureDate, uniqueSlug } from '../../fixtures/test-data';
import { authenticateViaBackend, createEventViaBackend } from '../../fixtures/backend-api';

test.describe('Comment Gated', () => {
	let eventSlug: string;

	test.beforeAll(async () => {
		const host = await authenticateViaBackend(PHONE_NUMBERS.HOST);
		const event = await createEventViaBackend(host.accessToken, {
			title: uniqueEventTitle('Comment Gated'),
			slug: uniqueSlug('comment-ga-1'),
			start_time: futureDate()
		});
		eventSlug = event.slug;
	});

	test("gated card shown when not RSVP'd", async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990330');
		await page.goto(`/e/${eventSlug}`);
		await expect(page.locator('text=/RSVP to join the conversation/i')).toBeVisible();
	});

	test('no comment input visible', async ({ page, authenticateAs }) => {
		await authenticateAs('+15550990330');
		await page.goto(`/e/${eventSlug}`);
		// Should not see comment input when gated
		const commentInput = page.locator(
			'input[placeholder*="comment"], textarea[placeholder*="comment"]'
		);
		await expect(commentInput).toBeHidden();
	});
});
