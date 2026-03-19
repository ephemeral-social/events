import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ── Helpers ──────────────────────────────────────────────────────────────────

function readCssFile(aesthetic: string, palette: string, mode: string): string {
	const filePath = resolve('src/lib/styles/aesthetics', aesthetic, `${palette}-${mode}.css`);
	return readFileSync(filePath, 'utf-8');
}

function extractProperty(css: string, property: string): string | null {
	const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`${escaped}\\s*:\\s*([^;]+)\\s*;`);
	const match = css.match(regex);
	return match ? match[1].trim() : null;
}

// ── Palette map ──────────────────────────────────────────────────────────────

const AESTHETICS: Record<string, string[]> = {
	simple: ['default', 'blue', 'sage', 'violet'],
	fun: ['party', 'neon', 'sunset', 'cosmic'],
	warm: ['hearth', 'clay', 'sage', 'wine'],
	elegant: ['ivory', 'champagne', 'midnight', 'rose']
};

const MODES = ['dark', 'light'] as const;

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CSS palette files exist and have content', () => {
	for (const [aesthetic, palettes] of Object.entries(AESTHETICS)) {
		for (const palette of palettes) {
			for (const mode of MODES) {
				it(`${aesthetic}/${palette}-${mode}.css exists and has content`, () => {
					const css = readCssFile(aesthetic, palette, mode);
					expect(css.length).toBeGreaterThan(100);
				});
			}
		}
	}
});

describe('Font families per aesthetic', () => {
	it('fun uses Manrope for headings and body', () => {
		const css = readCssFile('fun', 'party', 'dark');
		expect(extractProperty(css, '--font-heading')).toContain('Manrope');
		expect(extractProperty(css, '--font-body')).toContain('Manrope');
	});

	it('simple uses Inter for headings and body', () => {
		const css = readCssFile('simple', 'default', 'light');
		expect(extractProperty(css, '--font-heading')).toContain('Inter');
		expect(extractProperty(css, '--font-body')).toContain('Inter');
	});

	it('warm uses Cormorant Garamond for headings and Source Sans 3 for body', () => {
		const css = readCssFile('warm', 'hearth', 'dark');
		expect(extractProperty(css, '--font-heading')).toContain('Cormorant Garamond');
		expect(extractProperty(css, '--font-body')).toContain('Source Sans 3');
	});

	it('elegant uses Cormorant Garamond for headings and Raleway for body', () => {
		const css = readCssFile('elegant', 'ivory', 'light');
		expect(extractProperty(css, '--font-heading')).toContain('Cormorant Garamond');
		expect(extractProperty(css, '--font-body')).toContain('Raleway');
	});

	it('font families are consistent across all palettes within each aesthetic', () => {
		const expectedHeading: Record<string, string> = {
			simple: 'Inter',
			fun: 'Manrope',
			warm: 'Cormorant Garamond',
			elegant: 'Cormorant Garamond'
		};
		const expectedBody: Record<string, string> = {
			simple: 'Inter',
			fun: 'Manrope',
			warm: 'Source Sans 3',
			elegant: 'Raleway'
		};

		for (const [aesthetic, palettes] of Object.entries(AESTHETICS)) {
			for (const palette of palettes) {
				for (const mode of MODES) {
					const css = readCssFile(aesthetic, palette, mode);
					const heading = extractProperty(css, '--font-heading');
					const body = extractProperty(css, '--font-body');
					expect(heading, `${aesthetic}/${palette}-${mode} heading font`).toContain(
						expectedHeading[aesthetic]
					);
					expect(body, `${aesthetic}/${palette}-${mode} body font`).toContain(
						expectedBody[aesthetic]
					);
				}
			}
		}
	});
});

describe('Structural tokens per aesthetic', () => {
	const expected: Record<string, { radiusCard: string; radiusButton: string }> = {
		simple: { radiusCard: '12px', radiusButton: '8px' },
		fun: { radiusCard: '16px', radiusButton: '9999px' },
		warm: { radiusCard: '10px', radiusButton: '8px' },
		elegant: { radiusCard: '6px', radiusButton: '3px' }
	};

	for (const [aesthetic, palettes] of Object.entries(AESTHETICS)) {
		for (const palette of palettes) {
			for (const mode of MODES) {
				it(`${aesthetic}/${palette}-${mode} has correct radius-card and radius-button`, () => {
					const css = readCssFile(aesthetic, palette, mode);
					expect(
						extractProperty(css, '--radius-card'),
						`${aesthetic}/${palette}-${mode} --radius-card`
					).toBe(expected[aesthetic].radiusCard);
					expect(
						extractProperty(css, '--radius-button'),
						`${aesthetic}/${palette}-${mode} --radius-button`
					).toBe(expected[aesthetic].radiusButton);
				});
			}
		}
	}
});

describe('Motion tokens per aesthetic', () => {
	const expected: Record<string, string> = {
		simple: '200ms',
		fun: '300ms',
		warm: '400ms',
		elegant: '400ms'
	};

	for (const [aesthetic, palettes] of Object.entries(AESTHETICS)) {
		for (const palette of palettes) {
			for (const mode of MODES) {
				it(`${aesthetic}/${palette}-${mode} has correct motion-duration-standard`, () => {
					const css = readCssFile(aesthetic, palette, mode);
					expect(
						extractProperty(css, '--motion-duration-standard'),
						`${aesthetic}/${palette}-${mode} --motion-duration-standard`
					).toBe(expected[aesthetic]);
				});
			}
		}
	}
});

describe('Heading weight per aesthetic', () => {
	const expected: Record<string, string> = {
		simple: '600',
		fun: '800',
		warm: '300',
		elegant: '300'
	};

	for (const [aesthetic, palettes] of Object.entries(AESTHETICS)) {
		for (const palette of palettes) {
			for (const mode of MODES) {
				it(`${aesthetic}/${palette}-${mode} has correct heading-weight`, () => {
					const css = readCssFile(aesthetic, palette, mode);
					expect(
						extractProperty(css, '--heading-weight'),
						`${aesthetic}/${palette}-${mode} --heading-weight`
					).toBe(expected[aesthetic]);
				});
			}
		}
	}
});

describe('Required shadcn primitives present in all 32 files', () => {
	const requiredTokens = ['--background', '--foreground', '--primary', '--card', '--border'];

	for (const [aesthetic, palettes] of Object.entries(AESTHETICS)) {
		for (const palette of palettes) {
			for (const mode of MODES) {
				it(`${aesthetic}/${palette}-${mode} defines all required shadcn primitives`, () => {
					const css = readCssFile(aesthetic, palette, mode);
					for (const token of requiredTokens) {
						const value = extractProperty(css, token);
						expect(value, `${aesthetic}/${palette}-${mode} missing ${token}`).not.toBeNull();
						expect(value, `${aesthetic}/${palette}-${mode} ${token} is empty`).not.toBe('');
					}
				});
			}
		}
	}
});

describe('Heading tracking per aesthetic', () => {
	const expected: Record<string, string> = {
		simple: '-0.02em',
		fun: '0em',
		warm: '0em',
		elegant: '0.08em'
	};

	for (const [aesthetic, palettes] of Object.entries(AESTHETICS)) {
		for (const palette of palettes) {
			for (const mode of MODES) {
				it(`${aesthetic}/${palette}-${mode} has correct heading-tracking`, () => {
					const css = readCssFile(aesthetic, palette, mode);
					expect(
						extractProperty(css, '--heading-tracking'),
						`${aesthetic}/${palette}-${mode} --heading-tracking`
					).toBe(expected[aesthetic]);
				});
			}
		}
	}
});

describe('Section gap and page padding per aesthetic', () => {
	const expected: Record<string, { sectionGap: string; pagePadding: string }> = {
		simple: { sectionGap: '24px', pagePadding: '16px' },
		fun: { sectionGap: '24px', pagePadding: '16px' },
		warm: { sectionGap: '48px', pagePadding: '28px' },
		elegant: { sectionGap: '48px', pagePadding: '32px' }
	};

	for (const [aesthetic, palettes] of Object.entries(AESTHETICS)) {
		for (const palette of palettes) {
			for (const mode of MODES) {
				it(`${aesthetic}/${palette}-${mode} has correct section-gap and page-padding`, () => {
					const css = readCssFile(aesthetic, palette, mode);
					expect(
						extractProperty(css, '--section-gap'),
						`${aesthetic}/${palette}-${mode} --section-gap`
					).toBe(expected[aesthetic].sectionGap);
					expect(
						extractProperty(css, '--page-padding'),
						`${aesthetic}/${palette}-${mode} --page-padding`
					).toBe(expected[aesthetic].pagePadding);
				});
			}
		}
	}
});
