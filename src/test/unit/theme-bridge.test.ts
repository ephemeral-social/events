// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
	getAmbientTheme,
	getThemeColors,
	lerpColor,
	lerpThemeColors
} from '$lib/motion/ambient/theme-bridge';

describe('getAmbientTheme', () => {
	it('returns "forest" for forest theme', () => {
		expect(getAmbientTheme('forest')).toBe('forest');
	});

	it('returns "sakura" for sakura theme', () => {
		expect(getAmbientTheme('sakura')).toBe('sakura');
	});

	it('returns "garden" for garden theme', () => {
		expect(getAmbientTheme('garden')).toBe('garden');
	});

	it('maps "midnight" to "forest"', () => {
		expect(getAmbientTheme('midnight')).toBe('forest');
	});

	it('falls back to "forest" for unknown themes', () => {
		expect(getAmbientTheme('unknown')).toBe('forest');
	});
});

describe('getThemeColors', () => {
	it('returns forest palette for "forest"', () => {
		expect(getThemeColors('forest').primary).toBe('#52b788');
	});

	it('returns sakura palette for "sakura"', () => {
		expect(getThemeColors('sakura').primary).toBe('#f4a0b5');
	});

	it('returns a valid ThemeColors shape with all 4 fields', () => {
		const colors = getThemeColors('garden');
		expect(colors).toHaveProperty('primary');
		expect(colors).toHaveProperty('secondary');
		expect(colors).toHaveProperty('surface');
		expect(colors).toHaveProperty('accent');
	});
});

describe('lerpColor', () => {
	it('returns start color at t=0', () => {
		expect(lerpColor('#000000', '#ffffff', 0)).toBe('#000000');
	});

	it('returns end color at t=1', () => {
		expect(lerpColor('#000000', '#ffffff', 1)).toBe('#ffffff');
	});

	it('returns midpoint at t=0.5', () => {
		const mid = lerpColor('#000000', '#ffffff', 0.5);
		// Math.round(127.5) = 128 = 0x80
		expect(mid).toBe('#808080');
	});
});

describe('lerpThemeColors', () => {
	it('interpolates all 4 fields between two palettes', () => {
		const from = { primary: '#000000', secondary: '#000000', surface: '#000000', accent: '#000000' };
		const to = { primary: '#ffffff', secondary: '#ffffff', surface: '#ffffff', accent: '#ffffff' };
		const result = lerpThemeColors(from, to, 0.5);

		expect(result.primary).toBe('#808080');
		expect(result.secondary).toBe('#808080');
		expect(result.surface).toBe('#808080');
		expect(result.accent).toBe('#808080');
	});
});
