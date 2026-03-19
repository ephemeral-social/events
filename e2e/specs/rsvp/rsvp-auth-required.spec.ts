import { test, expect } from '../../fixtures/event.fixture';
import { SEL } from '../../helpers/selectors';
import { DEV_CODE } from '../../fixtures/test-data';
import { clearRateLimits } from '../../fixtures/backend-api';

test.describe('RSVP Auth Required', () => {
	test.beforeEach(async () => {
		clearRateLimits();
	});

	test('auth modal opens when unauthenticated clicks RSVP CTA', async ({
		page,
		seededEvent
	}) => {
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.CTA_RSVP).click();
		await expect(page.locator(SEL.AUTH_DIALOG)).toBeVisible();
	});

	test('RSVP form shown after auth completes', async ({ page, seededEvent }) => {
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.CTA_RSVP).click();
		await page.locator(SEL.PHONE_INPUT).fill('5550990050');
		await page.locator(SEL.PHONE_SUBMIT).click();
		await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
		await page.locator(SEL.CODE_INPUT).fill(DEV_CODE);
		await page.locator(SEL.CODE_SUBMIT).click();
		await expect(page.locator(SEL.AUTH_DIALOG)).toBeHidden({ timeout: 10_000 });
		await expect(page.locator(SEL.RSVP_GOING)).toBeVisible({ timeout: 10_000 });
	});

	test('page refreshes with user state after auth', async ({ page, seededEvent }) => {
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.CTA_RSVP).click();
		await page.locator(SEL.PHONE_INPUT).fill('5550990051');
		await page.locator(SEL.PHONE_SUBMIT).click();
		await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
		await page.locator(SEL.CODE_INPUT).fill(DEV_CODE);
		await page.locator(SEL.CODE_SUBMIT).click();
		await expect(page.locator(SEL.AUTH_DIALOG)).toBeHidden({ timeout: 10_000 });
		// CTA should be gone, RSVP form visible
		await expect(page.locator(SEL.CTA_RSVP)).toBeHidden();
		await expect(page.locator(SEL.RSVP_NAME)).toBeVisible({ timeout: 10_000 });
	});

	test('no extra clicks needed to see RSVP form post-auth', async ({ page, seededEvent }) => {
		await page.goto(`/e/${seededEvent.slug}`);
		await page.locator(SEL.CTA_RSVP).click();
		await page.locator(SEL.PHONE_INPUT).fill('5550990052');
		await page.locator(SEL.PHONE_SUBMIT).click();
		await page.locator(SEL.CODE_INPUT).waitFor({ state: 'visible', timeout: 10_000 });
		await page.locator(SEL.CODE_INPUT).fill(DEV_CODE);
		await page.locator(SEL.CODE_SUBMIT).click();
		// After auth and invalidateAll(), RSVP form should appear automatically
		await expect(page.locator(SEL.RSVP_GOING)).toBeVisible({ timeout: 10_000 });
	});
});
