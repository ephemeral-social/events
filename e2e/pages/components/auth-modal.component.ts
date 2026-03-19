import type { Page, Locator } from '@playwright/test';
import { SEL } from '../../helpers/selectors';

export class AuthModalComponent {
	readonly page: Page;
	readonly dialog: Locator;
	readonly phoneInput: Locator;
	readonly phoneSubmit: Locator;
	readonly codeInput: Locator;
	readonly codeSubmit: Locator;
	readonly backButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.dialog = page.locator(SEL.AUTH_DIALOG);
		this.phoneInput = page.locator(SEL.PHONE_INPUT);
		this.phoneSubmit = page.locator(SEL.PHONE_SUBMIT);
		this.codeInput = page.locator(SEL.CODE_INPUT);
		this.codeSubmit = page.locator(SEL.CODE_SUBMIT);
		this.backButton = page.locator(SEL.CODE_BACK);
	}

	async fillPhoneAndSubmit(phone: string) {
		await this.phoneInput.fill(phone);
		await this.phoneSubmit.click();
	}

	async fillCodeAndSubmit(code: string) {
		await this.codeInput.waitFor({ state: 'visible', timeout: 10_000 });
		await this.codeInput.fill(code);
		await this.codeSubmit.click();
	}

	async waitForClose() {
		await this.dialog.waitFor({ state: 'hidden', timeout: 10_000 });
	}
}
