/**
 * Test phone numbers: +1555099XXXX range (Playwright tests).
 * Avoids collision with vitest E2E tests (+1555000XXXX).
 */
export const PHONE_NUMBERS = {
	HOST: '+15550990001',
	GUEST_1: '+15550990002',
	GUEST_2: '+15550990003',
	GUEST_3: '+15550990004',
	COHOST: '+15550990005',
	TICKETED_BUYER: '+15550990006',
	UNAUTHED: '+15550990099'
} as const;

/** Dev mode bypass code — accepted by backend in dev/local mode */
export const DEV_CODE = '123456';

/** Backend API base URL */
export const BACKEND_URL = 'http://127.0.0.1:8787';

/** Frontend base URL */
export const FRONTEND_URL = 'http://127.0.0.1:5173';

/** Theme constants for visual/style assertions */
export const THEME = {
	SURFACE_BASE: 'rgb(17, 17, 16)', // #111110
	TEXT_PRIMARY: 'rgb(237, 233, 227)', // #ede9e3
	ACCENT_PRIMARY: 'rgb(82, 183, 136)', // #52b788
	ACCENT_HOVER: 'rgb(64, 145, 108)', // #40916c
	FEEDBACK_ERROR: 'rgb(232, 93, 4)', // #e85d04
	BORDER_DEFAULT: 'rgb(46, 44, 42)', // #2e2c2a
	PILL_RADIUS: '9999px',
	CARD_RADIUS: '12px' // 0.75rem
} as const;

/** Generate a unique event title with timestamp to avoid slug collisions */
export function uniqueEventTitle(prefix = 'PW Test Event'): string {
	return `${prefix} ${Date.now().toString(36)}`;
}

/** Generate a unique slug for event creation (lowercase alphanumeric + hyphens) */
export function uniqueSlug(prefix = 'pw-test'): string {
	return `${prefix}-${Date.now().toString(36)}`;
}

/** Generate a future ISO datetime string */
export function futureDate(daysFromNow = 7): string {
	const d = new Date();
	d.setDate(d.getDate() + daysFromNow);
	d.setHours(19, 0, 0, 0);
	return d.toISOString();
}

/** Generate a date string for HTML date inputs (YYYY-MM-DD) */
export function futureDateInput(daysFromNow = 7): string {
	const d = new Date();
	d.setDate(d.getDate() + daysFromNow);
	return d.toISOString().split('T')[0];
}

/** Generate a time string for HTML time inputs (HH:MM) */
export function futureTimeInput(): string {
	return '19:00';
}
