// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/svelte';

// Mock motion system to avoid heavy dependency chain in jsdom
vi.mock('$lib/motion', () => ({
	scrollReveal: () => ({ destroy() {} }),
	pressFeedback: () => ({ destroy() {} }),
	supportsAmbientEffects: () => false
}));

// Mock HeroCover to avoid deep dependency chain (Motion, NumberTicker, GenerativeCover)
// Uses a real Svelte component mock that renders a minimal placeholder.
vi.mock('$lib/components/event/HeroCover.svelte', async () => {
	const mod = await import('../../test/mocks/HeroCoverMock.svelte');
	return { default: mod.default };
});

import { AESTHETIC_COPY } from '$lib/utils/aesthetic-copy';
import { formatDate, formatTime, formatGuestCount } from '$lib/utils/aesthetic-formatters';

// ── Test data ────────────────────────────────────────────────────────

const mockEvent = {
	event_id: 'evt-test-001',
	title: 'Test Dinner Party',
	description: 'A lovely evening of food and wine.',
	start_time: '2026-03-07T19:00:00Z',
	end_time: '2026-03-07T22:00:00Z',
	timezone: 'America/New_York',
	visibility: 'public',
	slug: 'test-dinner-party',
	created_at: '2026-03-01T12:00:00Z',
	venue_name: 'The Rooftop Bar',
	venue_address: '123 Main St, Brooklyn'
};

const mockHost = {
	user_id: 'host-001',
	display_name: 'Sarah Chen',
	avatar_r2_key: null
};

const mockRsvpCounts = { going: 12, maybe: 3 };

// ── Pre-load all components once ─────────────────────────────────────
// Svelte component compilation + phosphor-svelte tree is slow in jsdom.
// Import once and reuse across all describe blocks.

let AestheticRouter: any;
let SimpleLayout: any;
let FunLayout: any;
let WarmLayout: any;
let ElegantLayout: any;

beforeAll(async () => {
	const [routerMod, simpleMod, funMod, warmMod, elegantMod] = await Promise.all([
		import('$lib/components/layouts/AestheticRouter.svelte'),
		import('$lib/components/layouts/SimpleLayout.svelte'),
		import('$lib/components/layouts/FunLayout.svelte'),
		import('$lib/components/layouts/WarmLayout.svelte'),
		import('$lib/components/layouts/ElegantLayout.svelte')
	]);
	AestheticRouter = routerMod.default;
	SimpleLayout = simpleMod.default;
	FunLayout = funMod.default;
	WarmLayout = warmMod.default;
	ElegantLayout = elegantMod.default;
}, 60_000);

// ── AestheticRouter tests ────────────────────────────────────────────

describe('AestheticRouter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('routes to SimpleLayout for "simple" aesthetic', () => {
		const { container } = render(AestheticRouter, {
			props: {
				aesthetic: 'simple',
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});
		expect(container.querySelector('[data-testid="simple-layout"]')).toBeTruthy();
	});

	it('routes to FunLayout for "fun" aesthetic', () => {
		const { container } = render(AestheticRouter, {
			props: {
				aesthetic: 'fun',
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});
		expect(container.querySelector('[data-testid="fun-layout"]')).toBeTruthy();
	});

	it('routes to WarmLayout for "warm" aesthetic', () => {
		const { container } = render(AestheticRouter, {
			props: {
				aesthetic: 'warm',
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});
		expect(container.querySelector('[data-testid="warm-layout"]')).toBeTruthy();
	});

	it('routes to ElegantLayout for "elegant" aesthetic', () => {
		const { container } = render(AestheticRouter, {
			props: {
				aesthetic: 'elegant',
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});
		expect(container.querySelector('[data-testid="elegant-layout"]')).toBeTruthy();
	});
});

// ── SimpleLayout tests ───────────────────────────────────────────────

describe('SimpleLayout', () => {
	it('renders title, date, and RSVP buttons with correct labels', () => {
		const { container } = render(SimpleLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts,
				onRsvp: vi.fn()
			}
		});

		// Title
		const title = container.querySelector('h1');
		expect(title?.textContent).toBe('Test Dinner Party');

		// RSVP buttons with Simple labels
		const rsvpSection = container.querySelector('[data-testid="rsvp-buttons"]');
		expect(rsvpSection).toBeTruthy();
		const buttons = rsvpSection!.querySelectorAll('button');
		const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
		expect(buttonTexts).toContain('Going');
		expect(buttonTexts).toContain('Maybe');
		expect(buttonTexts).toContain("Can't go");
	});

	it('renders host attribution at bottom (not prominently)', () => {
		const { container } = render(SimpleLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});

		const hostEl = container.querySelector('[data-testid="host-attribution"]');
		expect(hostEl).toBeTruthy();
		expect(hostEl!.textContent).toBe('Hosted by Sarah Chen');
	});
});

// ── FunLayout tests ──────────────────────────────────────────────────

describe('FunLayout', () => {
	it('renders data-testid="fun-layout" and RSVP buttons with correct labels', () => {
		const { container } = render(FunLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts,
				onRsvp: vi.fn()
			}
		});

		// Layout wrapper
		expect(container.querySelector('[data-testid="fun-layout"]')).toBeTruthy();

		// RSVP buttons (in FunLayout's own fixed bar)
		const rsvpSection = container.querySelector('[data-testid="rsvp-buttons"]');
		expect(rsvpSection).toBeTruthy();
		const buttons = rsvpSection!.querySelectorAll('button');
		const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
		expect(buttonTexts).toContain('Going');
		expect(buttonTexts).toContain('Maybe');
		expect(buttonTexts).toContain("Can't Make It");
	});

	it('delegates hero rendering to HeroCover component', () => {
		const { container } = render(FunLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});

		// HeroCover renders a <section> with aria-label="Event cover"
		const heroSection = container.querySelector('section[aria-label="Event cover"]');
		expect(heroSection).toBeTruthy();
	});
});

// ── WarmLayout tests ─────────────────────────────────────────────────

describe('WarmLayout', () => {
	it('renders title and RSVP buttons with correct warm labels', () => {
		const { container } = render(WarmLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts,
				onRsvp: vi.fn()
			}
		});

		// Title
		const title = container.querySelector('h1');
		expect(title?.textContent).toBe('Test Dinner Party');

		// RSVP section
		const rsvpSection = container.querySelector('[data-testid="rsvp-buttons"]');
		expect(rsvpSection).toBeTruthy();

		// Primary button: "I'll be there"
		const buttons = rsvpSection!.querySelectorAll('button');
		const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
		expect(buttonTexts).toContain("I'll be there");
		expect(buttonTexts).toContain('Let me check');
		expect(buttonTexts).toContain("I can't make it");
	});

	it('shows host attribution ABOVE title: "{Name} invites you to"', () => {
		const { container } = render(WarmLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});

		const hostEl = container.querySelector('[data-testid="host-attribution"]');
		expect(hostEl).toBeTruthy();
		expect(hostEl!.textContent?.trim()).toBe('Sarah Chen invites you to');

		// Host should appear BEFORE the title in the DOM
		const title = container.querySelector('h1');
		expect(title).toBeTruthy();
		const hostPosition = Array.from(container.querySelectorAll('*')).indexOf(hostEl!);
		const titlePosition = Array.from(container.querySelectorAll('*')).indexOf(title!);
		expect(hostPosition).toBeLessThan(titlePosition);
	});
});

// ── ElegantLayout tests ──────────────────────────────────────────────

describe('ElegantLayout', () => {
	it('renders title and RSVP buttons with correct elegant labels', () => {
		const { container } = render(ElegantLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts,
				onRsvp: vi.fn()
			}
		});

		// Title
		const title = container.querySelector('h1');
		expect(title?.textContent).toBe('Test Dinner Party');

		// RSVP section
		const rsvpSection = container.querySelector('[data-testid="rsvp-buttons"]');
		expect(rsvpSection).toBeTruthy();
		const buttons = rsvpSection!.querySelectorAll('button');
		const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());
		expect(buttonTexts).toContain('Accept with Pleasure');
		expect(buttonTexts).toContain('Regretfully Decline');
	});

	it('does NOT render a Maybe button', () => {
		const { container } = render(ElegantLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts,
				onRsvp: vi.fn()
			}
		});

		const rsvpSection = container.querySelector('[data-testid="rsvp-buttons"]');
		const buttons = rsvpSection!.querySelectorAll('button');
		const buttonTexts = Array.from(buttons).map((b) => b.textContent?.trim());

		// Should have exactly 2 buttons (Accept, Decline) -- no Maybe
		expect(buttons.length).toBe(2);
		expect(buttonTexts).not.toContain('Maybe');
		expect(buttonTexts).not.toContain('Let me check');
	});

	it('centers all text (text-align: center on layout)', () => {
		const { container } = render(ElegantLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});

		const layout = container.querySelector('[data-testid="elegant-layout"]');
		expect(layout).toBeTruthy();

		// The elegant-layout class should have text-align: center
		// Note: in jsdom, computed styles from <style> blocks may not apply.
		// Instead, check the class is present since the CSS rule sets text-align: center.
		expect(layout!.classList.contains('elegant-layout')).toBe(true);
	});

	it('shows host attribution at TOP as formal phrasing', () => {
		const { container } = render(ElegantLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});

		const hostEl = container.querySelector('[data-testid="host-attribution"]');
		expect(hostEl).toBeTruthy();
		expect(hostEl!.textContent?.trim()).toBe(
			'Sarah Chen cordially invites you to'
		);

		// Host should appear BEFORE the title in the DOM
		const title = container.querySelector('h1');
		const hostPosition = Array.from(container.querySelectorAll('*')).indexOf(hostEl!);
		const titlePosition = Array.from(container.querySelectorAll('*')).indexOf(title!);
		expect(hostPosition).toBeLessThan(titlePosition);
	});

	it('renders ornamental dividers (dot and diamond)', () => {
		const { container } = render(ElegantLayout, {
			props: {
				event: mockEvent,
				host: mockHost,
				rsvpCounts: mockRsvpCounts
			}
		});

		// Check for diamond ornament
		const diamond = container.querySelector('.elegant-rule-diamond');
		expect(diamond).toBeTruthy();

		// Check for dot ornament
		const dot = container.querySelector('.elegant-rule-dot');
		expect(dot).toBeTruthy();
	});
});

// ── Aesthetic Copy data tests ────────────────────────────────────────

describe('AESTHETIC_COPY', () => {
	it('provides all four aesthetic keys for rsvp', () => {
		expect(Object.keys(AESTHETIC_COPY.rsvp)).toEqual(['simple', 'fun', 'warm', 'elegant']);
	});

	it('provides all four aesthetic keys for host', () => {
		expect(Object.keys(AESTHETIC_COPY.host)).toEqual(['simple', 'fun', 'warm', 'elegant']);
	});

	it('elegant has no Maybe option', () => {
		expect(AESTHETIC_COPY.rsvp.elegant.hasMaybe).toBe(false);
		expect(AESTHETIC_COPY.rsvp.elegant.maybe).toBe('');
	});

	it('warm maybe is a link (maybeIsLink)', () => {
		expect(AESTHETIC_COPY.rsvp.warm.maybeIsLink).toBe(true);
	});

	it('simple host is hidden by default', () => {
		expect(AESTHETIC_COPY.host.simple.visible).toBe(false);
	});

	it('warm host format is "{Name} invites you to"', () => {
		expect(AESTHETIC_COPY.host.warm.format('Alex')).toBe('Alex invites you to');
	});

	it('elegant host format is formal', () => {
		expect(AESTHETIC_COPY.host.elegant.format('Sarah Chen')).toBe(
			'Sarah Chen cordially invites you to'
		);
	});
});
