import { describe, it, expect } from 'vitest';
import {
	oklchToHex,
	oklchToRgba,
	getAbsoluteOgImageUrl,
	buildGenerativeGradient,
	buildScrimGradient
} from '$lib/utils/og-helpers';

describe('oklchToHex()', () => {
	it('converts oklch(0.65 0.17 150) to approximately #52b788', () => {
		const hex = oklchToHex('oklch(0.65 0.17 150)');
		// Allow some tolerance in conversion — should be close to #52b788
		expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
		// The green channel should be dominant
		const g = parseInt(hex.slice(3, 5), 16);
		expect(g).toBeGreaterThan(150);
	});

	it('returns fallback #111110 for invalid input', () => {
		expect(oklchToHex('not-a-color')).toBe('#111110');
		expect(oklchToHex('')).toBe('#111110');
	});

	it('returns custom fallback when provided', () => {
		expect(oklchToHex('invalid', '#ffffff')).toBe('#ffffff');
	});
});

describe('oklchToRgba()', () => {
	it('converts OKLCH string to rgba() with given alpha', () => {
		const result = oklchToRgba('oklch(0.65 0.17 150)', 0.5);
		expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\.5\)$/);
	});

	it('returns fallback rgba for invalid input', () => {
		expect(oklchToRgba('invalid', 0.5)).toBe('rgba(17, 17, 16, 1)');
	});

	it('handles alpha of 0', () => {
		const result = oklchToRgba('oklch(0.65 0.17 150)', 0);
		expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 0\)$/);
	});

	it('handles alpha of 1', () => {
		const result = oklchToRgba('oklch(0.16 0.02 145)', 1);
		expect(result).toMatch(/^rgba\(\d+, \d+, \d+, 1\)$/);
	});
});

describe('getAbsoluteOgImageUrl()', () => {
	it('returns the standalone OG worker URL for a slug', () => {
		expect(getAbsoluteOgImageUrl('summer-party')).toBe(
			'https://ephemeral-og.ephemeralsocial.workers.dev/summer-party'
		);
	});

	it('returns null when slug is undefined or empty', () => {
		expect(getAbsoluteOgImageUrl(undefined)).toBeNull();
		expect(getAbsoluteOgImageUrl('')).toBeNull();
	});
});

describe('buildGenerativeGradient()', () => {
	it('returns deterministic gradient CSS for same seed', () => {
		const a = buildGenerativeGradient('test-event', '#111110');
		const b = buildGenerativeGradient('test-event', '#111110');
		expect(a).toBe(b);
	});

	it('returns different gradient CSS for different seeds', () => {
		const a = buildGenerativeGradient('event-alpha', '#111110');
		const b = buildGenerativeGradient('event-beta', '#111110');
		expect(a).not.toBe(b);
	});

	it('includes all 6 gradient layers (3 radials + 2 rings + 1 ambient)', () => {
		const css = buildGenerativeGradient('test-seed', '#111110');
		// Count radial-gradient occurrences (3 color + 2 ring + 1 ambient = 6)
		const radialCount = (css.match(/radial-gradient/g) || []).length;
		expect(radialCount).toBe(6);
	});

	it('uses warm palette colors from PALETTES array', () => {
		const css = buildGenerativeGradient('test', '#111110');
		// Should contain hex colors with alpha suffix (e.g., #52b78860)
		expect(css).toMatch(/#[0-9a-f]{6}[0-9a-f]{2}/i);
	});

	it('ends with the base color', () => {
		const css = buildGenerativeGradient('test', '#1a1918');
		expect(css.endsWith('#1a1918')).toBe(true);
	});
});

describe('buildScrimGradient()', () => {
	it('returns 5-stop linear-gradient with rgba values', () => {
		const css = buildScrimGradient('oklch(0.16 0.02 145)');
		expect(css).toContain('linear-gradient(180deg');
		// Should have 5 percentage stops: 20%, 40%, 60%, 80%, 100%
		expect(css).toContain('20%');
		expect(css).toContain('40%');
		expect(css).toContain('60%');
		expect(css).toContain('80%');
		expect(css).toContain('100%');
	});

	it('uses theme background RGB values for opacity stops', () => {
		const css = buildScrimGradient('oklch(0.16 0.02 145)');
		// All stops should use rgba() format
		const rgbaCount = (css.match(/rgba\(/g) || []).length;
		expect(rgbaCount).toBe(5);
	});

	it('does not contain color-mix()', () => {
		const css = buildScrimGradient('oklch(0.16 0.02 145)');
		expect(css).not.toContain('color-mix');
	});

	it('first stop has alpha 0 (transparent)', () => {
		const css = buildScrimGradient('oklch(0.16 0.02 145)');
		// First rgba should have alpha 0
		const firstRgba = css.match(/rgba\(\d+, \d+, \d+, 0\)/);
		expect(firstRgba).not.toBeNull();
	});

	it('last stop has alpha 1 (opaque)', () => {
		const css = buildScrimGradient('oklch(0.16 0.02 145)');
		// Last rgba should have alpha 1
		expect(css).toContain(', 1) 100%');
	});
});
