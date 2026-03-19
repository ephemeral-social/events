import { describe, it, expect } from 'vitest';
import { getThemeTokens, type ThemeTokens } from '$lib/themes/tokens';
import { VALID_THEMES } from '$lib/themes/types';

describe('Theme Tokens', () => {
	it('getThemeTokens for forest/dark returns complete token set', () => {
		const tokens = getThemeTokens('forest', 'dark');
		expect(tokens.background).toBeDefined();
		expect(tokens.foreground).toBeDefined();
		expect(tokens.primary).toBeDefined();
		expect(tokens.mutedForeground).toBeDefined();
		expect(tokens.fontHeading).toBeDefined();
		expect(tokens.fontBody).toBeDefined();
		expect(tokens.headingWeight).toBeDefined();
		expect(tokens.headingTracking).toBeDefined();
		expect(tokens.headingTransform).toBeDefined();
	});

	it('getThemeTokens for forest/light returns light-mode tokens', () => {
		const tokens = getThemeTokens('forest', 'light');
		expect(tokens.background).toContain('0.97');
	});

	it('getThemeTokens for midnight/dark has correct values', () => {
		const tokens = getThemeTokens('midnight', 'dark');
		expect(tokens.background).toBeDefined();
		expect(tokens.foreground).toBeDefined();
		expect(tokens.primary).toBeDefined();
	});

	it('getThemeTokens for invalid theme falls back to forest/dark', () => {
		const tokens = getThemeTokens('invalid', 'dark');
		const forest = getThemeTokens('forest', 'dark');
		expect(tokens).toEqual(forest);
	});

	it('all 10 themes x 2 modes return valid token objects', () => {
		const requiredFields: (keyof ThemeTokens)[] = [
			'background',
			'foreground',
			'primary',
			'mutedForeground',
			'fontHeading',
			'fontBody',
			'headingWeight',
			'headingTracking',
			'headingTransform'
		];

		for (const theme of VALID_THEMES) {
			for (const mode of ['dark', 'light'] as const) {
				const tokens = getThemeTokens(theme, mode);
				for (const field of requiredFields) {
					expect(tokens[field], `${theme}/${mode} missing ${field}`).toBeDefined();
					expect(tokens[field], `${theme}/${mode} ${field} is empty`).not.toBe('');
				}
			}
		}
	});
});
