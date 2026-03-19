/**
 * WCAG Contrast Verification Script
 *
 * Verifies all 20 theme configurations (10 themes x 2 modes) meet
 * WCAG AA contrast requirements:
 * - Text on backgrounds: >= 4.5:1
 * - UI components (primary on background): >= 3.0:1
 *
 * Run: npx tsx scripts/verify-theme-contrast.ts
 */

import { getThemeTokens, type ThemeTokens } from '../src/lib/themes/tokens';
import { VALID_THEMES } from '../src/lib/themes/types';
import { parse, converter } from 'culori';

const toRgb = converter('rgb');

// Convert oklch string to sRGB-relative luminance
function oklchToRelativeLuminance(colorStr: string): number {
	const parsed = parse(colorStr);
	if (!parsed) throw new Error(`Cannot parse color: ${colorStr}`);

	const rgb = toRgb(parsed);
	if (!rgb) throw new Error(`Cannot convert to RGB: ${colorStr}`);

	const r = linearize(Math.max(0, Math.min(1, rgb.r)));
	const g = linearize(Math.max(0, Math.min(1, rgb.g)));
	const b = linearize(Math.max(0, Math.min(1, rgb.b)));

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function linearize(c: number): number {
	return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function contrastRatio(l1: number, l2: number): number {
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}

interface ContrastCheck {
	pair: string;
	fg: string;
	bg: string;
	minRatio: number;
}

function getChecks(tokens: ThemeTokens): ContrastCheck[] {
	return [
		{
			pair: 'foreground on background',
			fg: tokens.foreground,
			bg: tokens.background,
			minRatio: 4.5
		},
		{
			pair: 'cardForeground on card',
			fg: tokens.cardForeground,
			bg: tokens.card,
			minRatio: 4.5
		},
		{
			pair: 'primaryForeground on primary',
			fg: tokens.primaryForeground,
			bg: tokens.primary,
			minRatio: 4.5
		},
		{
			pair: 'mutedForeground on background',
			fg: tokens.mutedForeground,
			bg: tokens.background,
			minRatio: 4.5
		},
		{
			pair: 'mutedForeground on card',
			fg: tokens.mutedForeground,
			bg: tokens.card,
			minRatio: 4.5
		},
		{
			pair: 'primary on background (UI)',
			fg: tokens.primary,
			bg: tokens.background,
			minRatio: 3.0
		}
	];
}

let failures = 0;
let passes = 0;

console.log('WCAG Contrast Verification');
console.log('==========================\n');

for (const theme of VALID_THEMES) {
	for (const mode of ['dark', 'light'] as const) {
		const tokens = getThemeTokens(theme, mode);
		const checks = getChecks(tokens);

		let themePass = true;

		for (const check of checks) {
			try {
				const fgLum = oklchToRelativeLuminance(check.fg);
				const bgLum = oklchToRelativeLuminance(check.bg);
				const ratio = contrastRatio(fgLum, bgLum);

				if (ratio < check.minRatio) {
					console.log(
						`  FAIL  ${theme}/${mode}: ${check.pair} — ${ratio.toFixed(2)}:1 (need ${check.minRatio}:1)`
					);
					failures++;
					themePass = false;
				} else {
					passes++;
				}
			} catch (e) {
				console.log(
					`  ERROR ${theme}/${mode}: ${check.pair} — ${(e as Error).message}`
				);
				failures++;
				themePass = false;
			}
		}

		if (themePass) {
			console.log(`  PASS  ${theme}/${mode} — all ${checks.length} checks passed`);
		}
	}
}

console.log(`\n${passes} passed, ${failures} failed out of ${passes + failures} checks`);

if (failures > 0) {
	console.log('\nContrast verification FAILED. Fix the failing pairs above.');
	process.exit(1);
} else {
	console.log('\nAll contrast checks passed!');
}
