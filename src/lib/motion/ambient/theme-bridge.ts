import type { ThemeColors } from './types';

const THEME_MAP: Record<string, string> = {
	forest: 'forest',
	sakura: 'sakura',
	garden: 'garden',
	midnight: 'forest',
	sunset: 'garden'
};

const PALETTES: Record<string, ThemeColors> = {
	forest: { primary: '#52b788', secondary: '#40916c', surface: '#111110', accent: '#95d5b2' },
	sakura: { primary: '#f4a0b5', secondary: '#e07a93', surface: '#1a1118', accent: '#fcd5e0' },
	garden: { primary: '#e9b44c', secondary: '#c8963e', surface: '#171510', accent: '#f2d98b' }
};

export function getAmbientTheme(eventTheme: string): string {
	return THEME_MAP[eventTheme] ?? 'forest';
}

export function getThemeColors(eventTheme: string): ThemeColors {
	return PALETTES[getAmbientTheme(eventTheme)] ?? PALETTES.forest;
}

/** Linearly interpolate between two hex colors. t in [0, 1]. */
export function lerpColor(a: string, b: string, t: number): string {
	const parseHex = (h: string) => [
		parseInt(h.slice(1, 3), 16),
		parseInt(h.slice(3, 5), 16),
		parseInt(h.slice(5, 7), 16)
	];
	const [r1, g1, b1] = parseHex(a);
	const [r2, g2, b2] = parseHex(b);
	const r = Math.round(r1 + (r2 - r1) * t);
	const g = Math.round(g1 + (g2 - g1) * t);
	const bl = Math.round(b1 + (b2 - b1) * t);
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

/** Interpolate all colors in a ThemeColors object. */
export function lerpThemeColors(from: ThemeColors, to: ThemeColors, t: number): ThemeColors {
	return {
		primary: lerpColor(from.primary, to.primary, t),
		secondary: lerpColor(from.secondary, to.secondary, t),
		surface: lerpColor(from.surface, to.surface, t),
		accent: lerpColor(from.accent, to.accent, t)
	};
}
