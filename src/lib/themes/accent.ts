import { oklch, parse } from 'culori';
import type { EventMode, EventAesthetic } from './types';

export function computeAccentPrimary(hue: number, mode: EventMode, aesthetic?: EventAesthetic): string {
	// Fun uses higher chroma per TOKEN_BRIDGE §9.5
	const darkChroma = aesthetic === 'fun' ? 0.20 : 0.18;
	const lightChroma = aesthetic === 'fun' ? 0.22 : 0.20;
	return mode === 'dark'
		? `oklch(0.65 ${darkChroma.toFixed(2)} ${hue})`
		: `oklch(0.48 ${lightChroma.toFixed(2)} ${hue})`;
}

export function computeAccentPrimaryForeground(hue: number, mode: EventMode): string {
	return mode === 'dark'
		? `oklch(0.15 0.03 ${hue})`
		: `oklch(0.98 0.01 ${hue})`;
}

export function computeAccentRing(hue: number, mode: EventMode): string {
	return mode === 'dark'
		? `oklch(0.55 0.15 ${hue})`
		: `oklch(0.55 0.18 ${hue})`;
}

export function hexToAccentHue(hex: string): number {
	try {
		const parsed = parse(hex);
		if (!parsed) return 150;
		const color = oklch(parsed);
		return Math.round(color?.h ?? 150);
	} catch {
		return 150;
	}
}

export function computeAccentStyle(hue: number | null, mode: EventMode, aesthetic?: EventAesthetic): string {
	if (hue === null) return '';
	const primary = computeAccentPrimary(hue, mode, aesthetic);
	const primaryFg = computeAccentPrimaryForeground(hue, mode);
	const ring = computeAccentRing(hue, mode);
	return `--primary: ${primary}; --primary-foreground: ${primaryFg}; --ring: ${ring};`;
}
