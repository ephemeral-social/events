import type { Page, Locator } from '@playwright/test';
import { SEL } from '../helpers/selectors';

export class EventPage {
	readonly page: Page;
	readonly title: Locator;
	readonly hostName: Locator;
	readonly ctaRsvp: Locator;
	readonly ctaTickets: Locator;
	readonly ctaFull: Locator;
	readonly rsvpForm: Locator;
	readonly rsvpStatus: Locator;
	readonly privacyDashboard: Locator;

	constructor(page: Page) {
		this.page = page;
		this.title = page.locator('h1, h2').first();
		this.hostName = page.locator('text=Hosted by');
		this.ctaRsvp = page.locator(SEL.CTA_RSVP);
		this.ctaTickets = page.locator(SEL.CTA_TICKETS);
		this.ctaFull = page.locator(SEL.CTA_FULL);
		this.rsvpForm = page.locator(SEL.RSVP_GOING);
		this.rsvpStatus = page.locator(SEL.RSVP_CHANGE);
		this.privacyDashboard = page.locator('text=/privacy/i');
	}

	async goto(slug: string) {
		await this.page.goto(`/e/${slug}`);
	}

	async clickRsvp() {
		await this.ctaRsvp.click();
	}
}
