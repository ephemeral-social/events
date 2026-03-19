import { describe, it, expect } from 'vitest';
import {
	computeAccentPrimary,
	computeAccentRing,
	hexToAccentHue,
	computeAccentStyle
} from '$lib/themes/accent';

describe('Accent Color Computation', () => {
	it('computeAccentPrimary returns correct oklch for dark mode', () => {
		const result = computeAccentPrimary(150, 'dark');
		expect(result).toBe('oklch(0.65 0.18 150)');
	});

	it('computeAccentPrimary returns correct oklch for light mode', () => {
		const result = computeAccentPrimary(150, 'light');
		expect(result).toBe('oklch(0.48 0.20 150)');
	});

	it('computeAccentRing returns correct oklch for dark mode', () => {
		const result = computeAccentRing(245, 'dark');
		expect(result).toBe('oklch(0.55 0.15 245)');
	});

	it('computeAccentRing returns correct oklch for light mode', () => {
		const result = computeAccentRing(245, 'light');
		expect(result).toBe('oklch(0.55 0.18 245)');
	});

	it('hexToAccentHue extracts hue from forest green', () => {
		const hue = hexToAccentHue('#52b788');
		// Should be around 155-161 (green range in OKLCH)
		expect(hue).toBeGreaterThan(140);
		expect(hue).toBeLessThan(170);
	});

	it('hexToAccentHue extracts hue from red', () => {
		const hue = hexToAccentHue('#ff0000');
		// Red should be around 25-30 in OKLCH
		expect(hue).toBeGreaterThan(15);
		expect(hue).toBeLessThan(35);
	});

	it('hexToAccentHue returns fallback 150 for invalid input', () => {
		expect(hexToAccentHue('invalid')).toBe(150);
		expect(hexToAccentHue('')).toBe(150);
	});

	it('computeAccentStyle returns empty string for null hue', () => {
		expect(computeAccentStyle(null, 'dark')).toBe('');
	});

	it('computeAccentStyle returns CSS inline style string for valid hue', () => {
		const style = computeAccentStyle(245, 'dark');
		expect(style).toContain('--primary:');
		expect(style).toContain('--ring:');
		expect(style).toContain('245');
	});
});
