import type { EventTheme, EventMode, EventAesthetic } from './types';
import { DEFAULT_PALETTES, DEFAULT_MODES, THEME_TO_AESTHETIC } from './types';

export const EVENT_TYPE_DEFAULTS: Record<string, { theme: EventTheme; mode: EventMode }> = {
	hangout: { theme: 'forest', mode: 'dark' },
	birthday: { theme: 'neon', mode: 'dark' },
	dinner_party: { theme: 'ember', mode: 'dark' },
	wedding: { theme: 'bloom', mode: 'light' },
	bridal_shower: { theme: 'bloom', mode: 'light' },
	baby_shower: { theme: 'bloom', mode: 'light' },
	corporate: { theme: 'slate', mode: 'light' },
	networking: { theme: 'slate', mode: 'light' },
	concert: { theme: 'midnight', mode: 'dark' },
	art_show: { theme: 'dusk', mode: 'dark' },
	fundraiser: { theme: 'gilded', mode: 'dark' },
	holiday_party: { theme: 'gilded', mode: 'dark' },
	game_night: { theme: 'neon', mode: 'dark' },
	brunch: { theme: 'sand', mode: 'light' },
	wellness: { theme: 'sand', mode: 'light' },
	watch_party: { theme: 'midnight', mode: 'dark' },
	potluck: { theme: 'forest', mode: 'dark' },
	book_club: { theme: 'dusk', mode: 'dark' },
	other: { theme: 'forest', mode: 'dark' }
};

const THEME_DEFAULT_MODES: Record<EventTheme, EventMode> = {
	forest: 'dark',
	midnight: 'dark',
	ember: 'dark',
	slate: 'light',
	bloom: 'light',
	gilded: 'dark',
	neon: 'dark',
	dusk: 'dark',
	sand: 'light',
	mono: 'dark'
};

export function getDefaultTheme(
	eventType: string | undefined
): { theme: EventTheme; mode: EventMode } {
	if (!eventType) return { theme: 'forest', mode: 'dark' };
	return EVENT_TYPE_DEFAULTS[eventType] ?? { theme: 'forest', mode: 'dark' };
}

export function getDefaultMode(theme: EventTheme): EventMode {
	return THEME_DEFAULT_MODES[theme] ?? 'dark';
}

// ── Aesthetic System Defaults ───────────────────────────────────────

export function getDefaultAesthetic(): {
	aesthetic: EventAesthetic;
	palette: string;
	mode: EventMode;
} {
	return { aesthetic: 'fun', palette: 'party', mode: 'dark' };
}

export function getDefaultPalette(aesthetic: EventAesthetic): string {
	return DEFAULT_PALETTES[aesthetic];
}

export function getDefaultModeForAesthetic(aesthetic: EventAesthetic): EventMode {
	return DEFAULT_MODES[aesthetic];
}

/** Convert a legacy theme to aesthetic+palette. Returns null if theme unknown. */
export function themeToAesthetic(
	theme: string
): { aesthetic: EventAesthetic; palette: string } | null {
	return THEME_TO_AESTHETIC[theme] ?? null;
}
