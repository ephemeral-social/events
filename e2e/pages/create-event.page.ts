import type { Page, Locator } from '@playwright/test';
import { SEL } from '../helpers/selectors';

export class CreateEventPage {
	readonly page: Page;
	readonly titleInput: Locator;
	readonly startDate: Locator;
	readonly startTime: Locator;
	readonly endDate: Locator;
	readonly endTime: Locator;
	readonly venueInput: Locator;
	readonly addressInput: Locator;
	readonly descriptionInput: Locator;
	readonly capacityInput: Locator;
	readonly freeToggle: Locator;
	readonly ticketedToggle: Locator;
	readonly priceInput: Locator;
	readonly submitButton: Locator;
	readonly backArrow: Locator;

	constructor(page: Page) {
		this.page = page;
		this.titleInput = page.locator(SEL.CREATE_TITLE);
		this.startDate = page.locator(SEL.CREATE_START_DATE);
		this.startTime = page.locator(SEL.CREATE_START_TIME);
		this.endDate = page.locator(SEL.CREATE_END_DATE);
		this.endTime = page.locator(SEL.CREATE_END_TIME);
		this.venueInput = page.locator(SEL.CREATE_VENUE);
		this.addressInput = page.locator(SEL.CREATE_ADDRESS);
		this.descriptionInput = page.locator(SEL.CREATE_DESCRIPTION);
		this.capacityInput = page.locator(SEL.CREATE_CAPACITY);
		this.freeToggle = page.locator(SEL.CREATE_TYPE_FREE);
		this.ticketedToggle = page.locator(SEL.CREATE_TYPE_TICKETED);
		this.priceInput = page.locator(SEL.CREATE_PRICE);
		this.submitButton = page.locator(SEL.CREATE_SUBMIT);
		this.backArrow = page.locator(SEL.BACK_ARROW);
	}

	async goto() {
		await this.page.goto('/create');
	}

	async fillRequired(title: string, date: string, time: string) {
		await this.titleInput.fill(title);
		await this.startDate.fill(date);
		await this.startTime.fill(time);
	}

	async submit() {
		await this.submitButton.click();
	}
}
