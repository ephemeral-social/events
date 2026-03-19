// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track matchMedia listener callbacks
let matchMediaCallback: ((e: { matches: boolean }) => void) | null = null;
let matchMediaMatches = false;

function setupMatchMedia(matches: boolean) {
	matchMediaMatches = matches;
	matchMediaCallback = null;
	vi.stubGlobal(
		'matchMedia',
		vi.fn().mockImplementation((query: string) => ({
			matches: matchMediaMatches,
			media: query,
			addEventListener: vi.fn((_event: string, cb: (e: { matches: boolean }) => void) => {
				matchMediaCallback = cb;
			}),
			removeEventListener: vi.fn()
		}))
	);
}

describe('reduced-motion', () => {
	beforeEach(() => {
		vi.resetModules();
		setupMatchMedia(false);
	});

	it('defaults to false when matchMedia matches=false', async () => {
		vi.doMock('$app/environment', () => ({ browser: true }));
		const { prefersReducedMotion } = await import('$lib/motion/utils/reduced-motion.svelte');
		expect(prefersReducedMotion()).toBe(false);
	});

	it('returns true when matchMedia matches=true', async () => {
		setupMatchMedia(true);
		vi.doMock('$app/environment', () => ({ browser: true }));
		const { prefersReducedMotion } = await import('$lib/motion/utils/reduced-motion.svelte');
		expect(prefersReducedMotion()).toBe(true);
	});

	it('responds to matchMedia change events', async () => {
		vi.doMock('$app/environment', () => ({ browser: true }));
		const { prefersReducedMotion } = await import('$lib/motion/utils/reduced-motion.svelte');
		expect(prefersReducedMotion()).toBe(false);

		// Simulate OS preference change
		matchMediaCallback?.({ matches: true });
		expect(prefersReducedMotion()).toBe(true);
	});

	it('motionOk() is inverse of prefersReducedMotion()', async () => {
		vi.doMock('$app/environment', () => ({ browser: true }));
		const { prefersReducedMotion, motionOk } = await import(
			'$lib/motion/utils/reduced-motion.svelte'
		);
		expect(motionOk()).toBe(!prefersReducedMotion());

		matchMediaCallback?.({ matches: true });
		expect(motionOk()).toBe(!prefersReducedMotion());
	});

	it('getMotionDuration returns full duration when motion OK', async () => {
		vi.doMock('$app/environment', () => ({ browser: true }));
		const { getMotionDuration } = await import('$lib/motion/utils/reduced-motion.svelte');
		expect(getMotionDuration(300)).toBe(300);
	});

	it('getMotionDuration returns 0 when reduced motion', async () => {
		setupMatchMedia(true);
		vi.doMock('$app/environment', () => ({ browser: true }));
		const { getMotionDuration } = await import('$lib/motion/utils/reduced-motion.svelte');
		expect(getMotionDuration(300)).toBe(0);
	});

	it('SSR: defaults to false (browser=false)', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));
		const { prefersReducedMotion } = await import('$lib/motion/utils/reduced-motion.svelte');
		expect(prefersReducedMotion()).toBe(false);
	});
});

describe('motionConfig', () => {
	beforeEach(() => {
		vi.resetModules();
		setupMatchMedia(false);
	});

	it('returns full config when motion OK', async () => {
		vi.doMock('$app/environment', () => ({ browser: true }));
		const { motionConfig } = await import('$lib/motion/utils/reduced-motion.svelte');
		const full = { duration: 0.8, y: 20, scale: 0.96, opacity: 0 };
		expect(motionConfig(full)).toEqual(full);
	});

	it('returns reduced config when reduced motion preferred', async () => {
		setupMatchMedia(true);
		vi.doMock('$app/environment', () => ({ browser: true }));
		const { motionConfig } = await import('$lib/motion/utils/reduced-motion.svelte');
		const full = { duration: 0.8, y: 20, x: 10, scale: 0.96, rotation: 45, opacity: 0 };
		const result = motionConfig(full);
		expect(result).toEqual({
			duration: 0.15,
			y: 0,
			x: 0,
			scale: 1,
			rotation: 0,
			opacity: 0
		});
	});

	it('merges custom reduced overrides', async () => {
		setupMatchMedia(true);
		vi.doMock('$app/environment', () => ({ browser: true }));
		const { motionConfig } = await import('$lib/motion/utils/reduced-motion.svelte');
		const full = { duration: 0.8, y: 20, opacity: 0 };
		const result = motionConfig(full, { duration: 0.2, opacity: 0.5 });
		expect(result).toEqual({
			duration: 0.2,
			y: 0,
			opacity: 0.5,
			x: 0,
			scale: 1,
			rotation: 0
		});
	});
});
