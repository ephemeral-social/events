import type { Page, Locator } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

export class RsvpFormComponent {
	readonly page: Page;
	readonly goingButton: Locator;
	readonly maybeButton: Locator;
	readonly declinedButton: Locator;
	readonly nameInput: Locator;
	readonly submitGoing: Locator;
	readonly submitMaybe: Locator;
	readonly submitDeclined: Locator;
	readonly plusOnesInc: Locator;
	readonly plusOnesDec: Locator;
	readonly changeButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.goingButton = page.locator(SEL.RSVP_GOING);
		this.maybeButton = page.locator(SEL.RSVP_MAYBE);
		this.declinedButton = page.locator(SEL.RSVP_DECLINED);
		this.nameInput = page.locator(SEL.RSVP_NAME);
		this.submitGoing = page.locator(SEL.RSVP_SUBMIT_GOING);
		this.submitMaybe = page.locator(SEL.RSVP_SUBMIT_MAYBE);
		this.submitDeclined = page.locator(SEL.RSVP_SUBMIT_DECLINED);
		this.plusOnesInc = page.locator(SEL.PLUS_ONES_INC);
		this.plusOnesDec = page.locator(SEL.PLUS_ONES_DEC);
		this.changeButton = page.locator(SEL.RSVP_CHANGE);
	}

	async submitAsGoing(name: string) {
		await this.nameInput.fill(name);
		await this.submitGoing.click();
	}

	async submitAsMaybe(name: string) {
		await this.maybeButton.click();
		await this.nameInput.fill(name);
		await this.submitMaybe.click();
	}
}
