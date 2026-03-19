import type { Page, Locator } from '@playwright/test';
import { SEL } from '../helpers/selectors';

export class EditEventPage {
	readonly page: Page;
	readonly titleInput: Locator;
	readonly descriptionInput: Locator;
	readonly venueInput: Locator;
	readonly addressInput: Locator;
	readonly submitButton: Locator;
	readonly backArrow: Locator;

	constructor(page: Page) {
		this.page = page;
		this.titleInput = page.locator(SEL.EDIT_TITLE);
		this.descriptionInput = page.locator(SEL.EDIT_DESCRIPTION);
		this.venueInput = page.locator(SEL.EDIT_VENUE);
		this.addressInput = page.locator(SEL.EDIT_ADDRESS);
		this.submitButton = page.locator(SEL.EDIT_SUBMIT);
		this.backArrow = page.locator(SEL.BACK_ARROW);
	}

	async goto(slug: string) {
		await this.page.goto(`/e/${slug}/edit`);
	}

	async updateTitle(newTitle: string) {
		await this.titleInput.clear();
		await this.titleInput.fill(newTitle);
	}

	async save() {
		await this.submitButton.click();
	}
}
