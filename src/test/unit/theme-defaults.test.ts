import { describe, it, expect } from 'vitest';
import { getDefaultTheme, getDefaultMode, EVENT_TYPE_DEFAULTS } from '$lib/themes/defaults';

describe('Theme Defaults', () => {
	it('getDefaultTheme for wedding returns bloom/light', () => {
		expect(getDefaultTheme('wedding')).toEqual({ theme: 'bloom', mode: 'light' });
	});

	it('getDefaultTheme for concert returns midnight/dark', () => {
		expect(getDefaultTheme('concert')).toEqual({ theme: 'midnight', mode: 'dark' });
	});

	it('getDefaultTheme for hangout returns forest/dark', () => {
		expect(getDefaultTheme('hangout')).toEqual({ theme: 'forest', mode: 'dark' });
	});

	it('getDefaultTheme for unknown returns forest/dark', () => {
		expect(getDefaultTheme('unknown')).toEqual({ theme: 'forest', mode: 'dark' });
	});

	it('getDefaultTheme for undefined returns forest/dark', () => {
		expect(getDefaultTheme(undefined)).toEqual({ theme: 'forest', mode: 'dark' });
	});

	it('all event types from spec are mapped', () => {
		const expectedTypes = [
			'hangout',
			'birthday',
			'dinner_party',
			'wedding',
			'bridal_shower',
			'baby_shower',
			'corporate',
			'networking',
			'concert',
			'art_show',
			'fundraiser',
			'holiday_party',
			'game_night',
			'brunch',
			'wellness',
			'watch_party',
			'potluck',
			'book_club',
			'other'
		];
		for (const type of expectedTypes) {
			expect(EVENT_TYPE_DEFAULTS[type]).toBeDefined();
		}
	});

	it('getDefaultMode for forest returns dark', () => {
		expect(getDefaultMode('forest')).toBe('dark');
	});

	it('getDefaultMode for slate returns light', () => {
		expect(getDefaultMode('slate')).toBe('light');
	});

	it('getDefaultMode for bloom returns light', () => {
		expect(getDefaultMode('bloom')).toBe('light');
	});

	it('getDefaultMode for invalid theme returns dark', () => {
		expect(getDefaultMode('nonexistent' as any)).toBe('dark');
	});
});
