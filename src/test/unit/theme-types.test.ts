import { describe, it, expect } from 'vitest';
import {
	VALID_THEMES,
	isValidTheme,
	isValidMode,
	isValidAccentHue,
	type EventTheme,
	type EventMode
} from '$lib/themes/types';

describe('Theme Types', () => {
	it('VALID_THEMES contains exactly 10 themes', () => {
		expect(VALID_THEMES).toHaveLength(10);
	});

	it('VALID_THEMES contains all expected themes', () => {
		const expected = [
			'forest',
			'midnight',
			'ember',
			'slate',
			'bloom',
			'gilded',
			'neon',
			'dusk',
			'sand',
			'mono'
		];
		expect([...VALID_THEMES]).toEqual(expected);
	});

	it('isValidTheme returns true for valid themes', () => {
		expect(isValidTheme('forest')).toBe(true);
		expect(isValidTheme('midnight')).toBe(true);
		expect(isValidTheme('mono')).toBe(true);
	});

	it('isValidTheme returns false for invalid strings', () => {
		expect(isValidTheme('invalid')).toBe(false);
		expect(isValidTheme('')).toBe(false);
		expect(isValidTheme('FOREST')).toBe(false);
	});

	it('isValidMode returns true for light and dark', () => {
		expect(isValidMode('light')).toBe(true);
		expect(isValidMode('dark')).toBe(true);
	});

	it('isValidMode returns false for invalid strings', () => {
		expect(isValidMode('auto')).toBe(false);
		expect(isValidMode('')).toBe(false);
	});

	it('isValidAccentHue accepts null', () => {
		expect(isValidAccentHue(null)).toBe(true);
	});

	it('isValidAccentHue accepts 0-360', () => {
		expect(isValidAccentHue(0)).toBe(true);
		expect(isValidAccentHue(150)).toBe(true);
		expect(isValidAccentHue(360)).toBe(true);
	});

	it('isValidAccentHue rejects negatives and >360', () => {
		expect(isValidAccentHue(-1)).toBe(false);
		expect(isValidAccentHue(361)).toBe(false);
		expect(isValidAccentHue(-0.1)).toBe(false);
	});
});
