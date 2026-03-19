import type { EventTheme, EventMode, EventAesthetic } from './types';

/**
 * Approximate hex background color for each theme × mode combination.
 * Used for <meta name="theme-color"> so the browser chrome matches the page.
 * Values derived from each theme's --background OKLCH value via culori.
 */
const META_COLORS: Record<string, string> = {
	'forest/dark': '#081008',
	'forest/light': '#f8f5ee',
	'midnight/dark': '#030915',
	'midnight/light': '#f3f5f9',
	'ember/dark': '#120805',
	'ember/light': '#faf4ef',
	'slate/dark': '#040a11',
	'slate/light': '#f7f9fa',
	'bloom/dark': '#120b0e',
	'bloom/light': '#fdf6f9',
	'gilded/dark': '#0a0605',
	'gilded/light': '#f9f4f0',
	'neon/dark': '#090715',
	'neon/light': '#f5f4fa',
	'dusk/dark': '#090a15',
	'dusk/light': '#f4f5f9',
	'sand/dark': '#120c07',
	'sand/light': '#faefe8',
	'mono/dark': '#070707',
	'mono/light': '#fcfcfc'
};

/**
 * Approximate hex background color for aesthetic × palette × mode combinations.
 * Derived from each palette CSS file's --background OKLCH value.
 */
const AESTHETIC_META_COLORS: Record<string, string> = {
	// Simple
	'simple/default/dark': '#0a0a0a',
	'simple/default/light': '#fafafa',
	'simple/blue/dark': '#0a0c10',
	'simple/blue/light': '#f5f7fa',
	'simple/sage/dark': '#0a0c0b',
	'simple/sage/light': '#f5f7f5',
	'simple/violet/dark': '#0c0a10',
	'simple/violet/light': '#f7f5fa',
	// Fun
	'fun/party/dark': '#0d0a12',
	'fun/party/light': '#faf8fc',
	'fun/neon/dark': '#080a12',
	'fun/neon/light': '#f5f6fc',
	'fun/sunset/dark': '#120a08',
	'fun/sunset/light': '#fdf6f2',
	'fun/cosmic/dark': '#0a0812',
	'fun/cosmic/light': '#f6f5fc',
	// Warm
	'warm/hearth/dark': '#110e0a',
	'warm/hearth/light': '#faf6f0',
	'warm/clay/dark': '#120c08',
	'warm/clay/light': '#faf4ee',
	'warm/sage/dark': '#0c0f0a',
	'warm/sage/light': '#f5f7f0',
	'warm/wine/dark': '#110a0c',
	'warm/wine/light': '#faf2f4',
	// Elegant
	'elegant/ivory/dark': '#0f0e0c',
	'elegant/ivory/light': '#faf8f5',
	'elegant/champagne/dark': '#100e0a',
	'elegant/champagne/light': '#faf7f0',
	'elegant/midnight/dark': '#08090f',
	'elegant/midnight/light': '#f5f6fa',
	'elegant/rose/dark': '#100a0c',
	'elegant/rose/light': '#faf2f5'
};

/** Default brand color (forest/dark) */
const DEFAULT_COLOR = '#111110';

export function getThemeColor(theme: EventTheme | string, mode: EventMode | string): string {
	return META_COLORS[`${theme}/${mode}`] ?? DEFAULT_COLOR;
}

export function getAestheticMetaColor(
	aesthetic: EventAesthetic | string,
	palette: string,
	mode: EventMode | string
): string {
	return AESTHETIC_META_COLORS[`${aesthetic}/${palette}/${mode}`] ?? DEFAULT_COLOR;
}
