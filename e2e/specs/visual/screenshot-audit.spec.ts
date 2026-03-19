/**
 * Aesthetic screenshot audit script.
 * Usage: npx playwright test e2e/specs/visual/screenshot-audit.spec.ts --project=desktop-chrome
 *
 * Takes full-page and viewport screenshots of each aesthetic for visual audit.
 */
import { test } from '@playwright/test';
import { join } from 'path';

const SCREENSHOT_DIR = join(process.cwd(), '.interface-design/screenshots');

// iPhone 14 Pro viewport — this is a mobile-first event page
const MOBILE_VIEWPORT = { width: 393, height: 852 };

const aesthetics = [
	// Simple — default mode is light
	{ name: 'simple', palette: 'default', mode: 'light' },
	{ name: 'simple', palette: 'blue', mode: 'light' },
	{ name: 'simple', palette: 'sage', mode: 'light' },
	{ name: 'simple', palette: 'violet', mode: 'light' },
	// Fun
	{ name: 'fun', palette: 'party', mode: 'dark' },
	{ name: 'fun', palette: 'neon', mode: 'dark' },
	{ name: 'fun', palette: 'sunset', mode: 'dark' },
	{ name: 'fun', palette: 'cosmic', mode: 'dark' },
	// Warm
	{ name: 'warm', palette: 'hearth', mode: 'dark' },
	{ name: 'warm', palette: 'clay', mode: 'dark' },
	{ name: 'warm', palette: 'sage', mode: 'dark' },
	{ name: 'warm', palette: 'wine', mode: 'dark' },
	// Elegant
	{ name: 'elegant', palette: 'ivory', mode: 'dark' },
	{ name: 'elegant', palette: 'champagne', mode: 'dark' },
	{ name: 'elegant', palette: 'midnight', mode: 'dark' },
	{ name: 'elegant', palette: 'rose', mode: 'dark' },
] as const;

/**
 * The app uses a #scroll-root container with overflow-y: auto and height: 100%,
 * so Playwright's fullPage: true can't detect the real content height.
 * This helper temporarily unlocks the scroll container so fullPage works.
 */
async function unlockScrollForFullPage(page: import('@playwright/test').Page) {
	await page.evaluate(() => {
		const root = document.getElementById('scroll-root');
		if (root) {
			root.style.height = 'auto';
			root.style.overflow = 'visible';
		}
		document.body.style.height = 'auto';
		document.body.style.overflow = 'visible';
		document.documentElement.style.height = 'auto';
		document.documentElement.style.overflow = 'visible';

		// Force all scrollReveal elements to be visible (they start at opacity 0)
		document.querySelectorAll('[style*="opacity: 0"]').forEach((el) => {
			(el as HTMLElement).style.opacity = '1';
			(el as HTMLElement).style.transform = 'none';
		});
	});
	// Let reflow happen
	await page.waitForTimeout(100);
}

for (const { name, palette, mode } of aesthetics) {
	// Without cover image (generative cover)
	test(`screenshot: ${name}/${palette}/${mode}`, async ({ page }) => {
		await page.setViewportSize(MOBILE_VIEWPORT);

		const url = `/preview?aesthetic=${name}&palette=${palette}&mode=${mode}`;
		await page.goto(url, { waitUntil: 'networkidle' });

		// Wait for fonts + animations to settle
		await page.waitForTimeout(3000);

		// Viewport-only screenshot (above the fold)
		await page.screenshot({
			path: join(SCREENSHOT_DIR, `${name}-${palette}-${mode}-viewport.png`),
			fullPage: false
		});

		// Unlock scroll container, then take full-page screenshot
		await unlockScrollForFullPage(page);
		await page.screenshot({
			path: join(SCREENSHOT_DIR, `${name}-${palette}-${mode}-full.png`),
			fullPage: true
		});
	});

	// With cover image (real photo)
	test(`screenshot: ${name}/${palette}/${mode} (with cover)`, async ({ page }) => {
		await page.setViewportSize(MOBILE_VIEWPORT);

		const url = `/preview?aesthetic=${name}&palette=${palette}&mode=${mode}&cover=true`;
		await page.goto(url, { waitUntil: 'networkidle' });

		// Wait for fonts + image + animations to settle
		await page.waitForTimeout(3000);

		// Viewport-only screenshot (above the fold — most important for cover legibility)
		await page.screenshot({
			path: join(SCREENSHOT_DIR, `${name}-${palette}-${mode}-cover-viewport.png`),
			fullPage: false
		});

		// Unlock scroll container, then take full-page screenshot
		await unlockScrollForFullPage(page);
		await page.screenshot({
			path: join(SCREENSHOT_DIR, `${name}-${palette}-${mode}-cover-full.png`),
			fullPage: true
		});
	});
}
