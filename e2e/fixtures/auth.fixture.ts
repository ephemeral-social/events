import { test as base, type Page } from '@playwright/test';
import { authenticateViaBackend, clearRateLimits } from './backend-api';
import { DEV_CODE, FRONTEND_URL } from './test-data';

interface AuthFixtures {
	/** Authenticate a user via SvelteKit API routes (sets HttpOnly cookies on the page) */
	authenticateAs: (phone: string) => Promise<{ userId: string }>;
	/** Authenticate via the UI auth modal (for testing auth flow) */
	authenticateViaUI: (phone: string) => Promise<void>;
}

export const test = base.extend<AuthFixtures>({
	authenticateAs: async ({ page }, use) => {
		const fn = async (phone: string) => {
			clearRateLimits();

			// Ensure E.164 format for the SvelteKit API route
			const e164 = phone.startsWith('+') ? phone : `+1${phone}`;

			// Step 1: Send code via SvelteKit API route
			const sendRes = await page.request.post(`${FRONTEND_URL}/api/auth/send-code`, {
				data: { phone: e164 }
			});

			if (!sendRes.ok()) {
				const text = await sendRes.text();
				throw new Error(`Send code failed: ${sendRes.status()} ${text}`);
			}

			const sendData = (await sendRes.json()) as { verification_id: string };

			// Step 2: Verify code via SvelteKit API route (sets session cookie)
			const verifyRes = await page.request.post(`${FRONTEND_URL}/api/auth/verify-code`, {
				data: {
					verification_id: sendData.verification_id,
					code: DEV_CODE
				}
			});

			if (!verifyRes.ok()) {
				const text = await verifyRes.text();
				throw new Error(`Verify code failed: ${verifyRes.status()} ${text}`);
			}

			const verifyData = (await verifyRes.json()) as { success: boolean; user?: { display_name?: string } };
			return { userId: '' }; // userId not returned from SvelteKit route
		};

		await use(fn);
	},

	authenticateViaUI: async ({ page }, use) => {
		const fn = async (phone: string) => {
			clearRateLimits();

			const nationalNumber = phone.startsWith('+1') ? phone.slice(2) : phone;

			// Fill phone input
			await page.locator('#phone').fill(nationalNumber);
			await page.locator('button:has-text("Send verification code")').click();

			// Wait for code step
			await page.locator('#code').waitFor({ state: 'visible' });
			await page.locator('#code').fill(DEV_CODE);
			await page.locator('button:has-text("Verify")').click();

			// Wait for modal to close (auth complete)
			await page.locator('[role="dialog"][aria-label="Sign in"]').waitFor({ state: 'hidden' });
		};

		await use(fn);
	}
});

export { expect } from '@playwright/test';
