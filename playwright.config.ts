import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	workers: 1,
	timeout: 30_000,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? 'html' : 'list',
	use: {
		baseURL: 'http://127.0.0.1:5173',
		colorScheme: 'dark',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure'
	},
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.02,
			animations: 'disabled'
		}
	},
	projects: [
		{
			name: 'mobile-chrome',
			use: { ...devices['iPhone 14'] },
			testMatch: /specs\/.*/
		},
		{
			name: 'tablet-safari',
			use: { ...devices['iPad (gen 7)'] },
			testMatch: /specs\/responsive\/.*/
		},
		{
			name: 'desktop-chrome',
			use: { viewport: { width: 1280, height: 720 } },
			testMatch: /specs\/.*/
		},
		{
			name: 'desktop-firefox',
			use: { ...devices['Desktop Firefox'] },
			testMatch: /journeys\/.*/
		},
		{
			name: 'desktop-webkit',
			use: { ...devices['Desktop Safari'] },
			testMatch: /journeys\/.*/
		},
		{
			name: 'visual',
			use: { viewport: { width: 1280, height: 720 } },
			testMatch: /specs\/visual\/.*/
		}
	],
	webServer: [
		{
			command: 'npx wrangler dev --port 8787',
			cwd: '../ephemeral_backend',
			port: 8787,
			reuseExistingServer: !process.env.CI,
			timeout: 30_000
		},
		{
			command:
				'pnpm build && npx wrangler pages dev .svelte-kit/cloudflare --port 5173 --compatibility-date 2025-12-01 --compatibility-flag nodejs_compat --binding BACKEND_URL=http://127.0.0.1:8787',
			port: 5173,
			reuseExistingServer: !process.env.CI,
			timeout: 120_000
		}
	]
});
