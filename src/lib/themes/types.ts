// ── Aesthetic System (new) ──────────────────────────────────────────

export const VALID_AESTHETICS = ['simple', 'fun', 'warm', 'elegant'] as const;
export type EventAesthetic = (typeof VALID_AESTHETICS)[number];

export const VALID_PALETTES: Record<EventAesthetic, readonly string[]> = {
	simple: ['default', 'blue', 'sage', 'violet'],
	fun: ['party', 'neon', 'sunset', 'cosmic'],
	warm: ['hearth', 'clay', 'sage', 'wine'],
	elegant: ['ivory', 'champagne', 'midnight', 'rose']
};
export type EventPalette = string;
export type EventMode = 'light' | 'dark';

export interface EventTheming {
	aesthetic: EventAesthetic;
	palette: EventPalette;
	mode: EventMode;
	accent_hue: number | null;
	/** Legacy theme field — used during transition period */
	theme?: EventTheme;
}

export const DEFAULT_PALETTES: Record<EventAesthetic, string> = {
	simple: 'default',
	fun: 'party',
	warm: 'hearth',
	elegant: 'ivory'
};

export const DEFAULT_MODES: Record<EventAesthetic, EventMode> = {
	simple: 'light',
	fun: 'dark',
	warm: 'dark',
	elegant: 'dark'
};

/** Map legacy 10-theme names to new aesthetic+palette combos */
export const THEME_TO_AESTHETIC: Record<
	string,
	{ aesthetic: EventAesthetic; palette: string }
> = {
	neon: { aesthetic: 'fun', palette: 'party' },
	midnight: { aesthetic: 'fun', palette: 'party' },
	forest: { aesthetic: 'fun', palette: 'party' },
	ember: { aesthetic: 'fun', palette: 'party' },
	sand: { aesthetic: 'fun', palette: 'party' },
	slate: { aesthetic: 'fun', palette: 'party' },
	mono: { aesthetic: 'fun', palette: 'party' },
	bloom: { aesthetic: 'fun', palette: 'party' },
	gilded: { aesthetic: 'fun', palette: 'party' },
	dusk: { aesthetic: 'fun', palette: 'party' }
};

export function isValidAesthetic(value: string): value is EventAesthetic {
	return (VALID_AESTHETICS as readonly string[]).includes(value);
}

export function isValidPaletteForAesthetic(aesthetic: EventAesthetic, palette: string): boolean {
	return (VALID_PALETTES[aesthetic] as readonly string[]).includes(palette);
}

export function isValidMode(value: string): value is EventMode {
	return value === 'light' || value === 'dark';
}

export function isValidAccentHue(value: number | null): boolean {
	if (value === null) return true;
	return typeof value === 'number' && value >= 0 && value <= 360;
}

/** Primary color for each (aesthetic, palette) pair — used for swatch previews */
export const PALETTE_COLORS: Record<string, Record<string, string>> = {
	simple: {
		default: 'oklch(0.93 0 0)',
		blue: 'oklch(0.68 0.16 240)',
		sage: 'oklch(0.66 0.12 155)',
		violet: 'oklch(0.68 0.14 285)'
	},
	fun: {
		party: 'oklch(0.72 0.22 330)',
		neon: 'oklch(0.68 0.19 245)',
		sunset: 'oklch(0.70 0.18 25)',
		cosmic: 'oklch(0.75 0.16 180)'
	},
	warm: {
		hearth: 'oklch(0.68 0.10 145)',
		clay: 'oklch(0.68 0.13 28)',
		sage: 'oklch(0.66 0.10 140)',
		wine: 'oklch(0.62 0.14 10)'
	},
	elegant: {
		ivory: 'oklch(0.68 0.06 145)',
		champagne: 'oklch(0.72 0.10 75)',
		midnight: 'oklch(0.72 0.04 250)',
		rose: 'oklch(0.70 0.07 350)'
	}
};

// ── Legacy Theme System (backwards compat) ─────────────────────────

export const VALID_THEMES = [
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
] as const;

export type EventTheme = (typeof VALID_THEMES)[number];

export function isValidTheme(value: string): value is EventTheme {
	return (VALID_THEMES as readonly string[]).includes(value);
}
