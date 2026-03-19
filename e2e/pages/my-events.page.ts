import type { Page, Locator } from '@playwright/test';
import { SEL } from '../helpers/selectors';

export class MyEventsPage {
	readonly page: Page;
	readonly heading: Locator;
	readonly createButton: Locator;
	readonly hostingTab: Locator;
	readonly attendingTab: Locator;

	constructor(page: Page) {
		this.page = page;
		this.heading = page.locator('h1:has-text("My Events")');
		this.createButton = page.locator(SEL.MY_EVENTS_CREATE);
		this.hostingTab = page.locator(SEL.MY_EVENTS_HOSTING);
		this.attendingTab = page.locator(SEL.MY_EVENTS_ATTENDING);
	}

	async goto() {
		await this.page.goto('/my-events');
	}

	async switchToAttending() {
		await this.attendingTab.click();
	}
}
