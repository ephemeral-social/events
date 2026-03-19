import type { EventTheme, EventMode } from './types';

export interface ThemeTokens {
	background: string;
	foreground: string;
	primary: string;
	primaryForeground: string;
	card: string;
	cardForeground: string;
	mutedForeground: string;
	fontHeading: string;
	fontBody: string;
	headingWeight: string;
	headingTracking: string;
	headingTransform: string;
}

const FONT_SERIF = "'Vollkorn', Georgia, 'Times New Roman', serif";
const FONT_SANS = "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

// ── Aesthetic-specific font families ──────────────────────────────────
const FONT_DM_SANS = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_CORMORANT = "'Cormorant Garamond', Georgia, serif";
const FONT_SOURCE_SANS = "'Source Sans 3', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_RALEWAY = "'Raleway', -apple-system, BlinkMacSystemFont, sans-serif";

const THEME_MAP: Record<string, Record<string, ThemeTokens>> = {
	forest: {
		dark: {
			background: 'oklch(0.16 0.02 145)',
			foreground: 'oklch(0.93 0.01 90)',
			primary: 'oklch(0.65 0.17 150)',
			primaryForeground: 'oklch(0.15 0.03 150)',
			card: 'oklch(0.19 0.02 145)',
			cardForeground: 'oklch(0.93 0.01 90)',
			mutedForeground: 'oklch(0.65 0.03 90)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '600',
			headingTracking: '0em',
			headingTransform: 'none'
		},
		light: {
			background: 'oklch(0.97 0.01 90)',
			foreground: 'oklch(0.18 0.03 145)',
			primary: 'oklch(0.48 0.15 150)',
			primaryForeground: 'oklch(0.98 0.01 90)',
			card: 'oklch(0.99 0.005 90)',
			cardForeground: 'oklch(0.18 0.03 145)',
			mutedForeground: 'oklch(0.50 0.03 145)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '600',
			headingTracking: '0em',
			headingTransform: 'none'
		}
	},
	midnight: {
		dark: {
			background: 'oklch(0.14 0.03 260)',
			foreground: 'oklch(0.95 0.01 260)',
			primary: 'oklch(0.68 0.19 245)',
			primaryForeground: 'oklch(0.13 0.04 245)',
			card: 'oklch(0.17 0.03 260)',
			cardForeground: 'oklch(0.95 0.01 260)',
			mutedForeground: 'oklch(0.62 0.04 260)',
			fontHeading: FONT_SANS,
			fontBody: FONT_SANS,
			headingWeight: '700',
			headingTracking: '-0.02em',
			headingTransform: 'uppercase'
		},
		light: {
			background: 'oklch(0.97 0.005 260)',
			foreground: 'oklch(0.15 0.04 260)',
			primary: 'oklch(0.50 0.20 245)',
			primaryForeground: 'oklch(0.98 0.005 245)',
			card: 'oklch(0.99 0.003 260)',
			cardForeground: 'oklch(0.15 0.04 260)',
			mutedForeground: 'oklch(0.48 0.04 260)',
			fontHeading: FONT_SANS,
			fontBody: FONT_SANS,
			headingWeight: '700',
			headingTracking: '-0.02em',
			headingTransform: 'uppercase'
		}
	},
	ember: {
		dark: {
			background: 'oklch(0.15 0.02 45)',
			foreground: 'oklch(0.92 0.02 70)',
			primary: 'oklch(0.72 0.15 45)',
			primaryForeground: 'oklch(0.15 0.03 45)',
			card: 'oklch(0.18 0.025 45)',
			cardForeground: 'oklch(0.92 0.02 70)',
			mutedForeground: 'oklch(0.62 0.04 45)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '500',
			headingTracking: '0em',
			headingTransform: 'none'
		},
		light: {
			background: 'oklch(0.97 0.01 60)',
			foreground: 'oklch(0.18 0.03 45)',
			primary: 'oklch(0.52 0.14 45)',
			primaryForeground: 'oklch(0.98 0.01 60)',
			card: 'oklch(0.99 0.008 60)',
			cardForeground: 'oklch(0.18 0.03 45)',
			mutedForeground: 'oklch(0.48 0.04 45)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '500',
			headingTracking: '0em',
			headingTransform: 'none'
		}
	},
	slate: {
		dark: {
			background: 'oklch(0.14 0.02 250)',
			foreground: 'oklch(0.96 0.005 250)',
			primary: 'oklch(0.70 0.12 185)',
			primaryForeground: 'oklch(0.14 0.03 185)',
			card: 'oklch(0.18 0.02 250)',
			cardForeground: 'oklch(0.96 0.005 250)',
			mutedForeground: 'oklch(0.63 0.02 250)',
			fontHeading: FONT_SANS,
			fontBody: FONT_SANS,
			headingWeight: '600',
			headingTracking: '-0.01em',
			headingTransform: 'none'
		},
		light: {
			background: 'oklch(0.98 0.003 250)',
			foreground: 'oklch(0.15 0.03 250)',
			primary: 'oklch(0.50 0.12 185)',
			primaryForeground: 'oklch(0.98 0.005 185)',
			card: 'oklch(1 0 0)',
			cardForeground: 'oklch(0.15 0.03 250)',
			mutedForeground: 'oklch(0.48 0.02 250)',
			fontHeading: FONT_SANS,
			fontBody: FONT_SANS,
			headingWeight: '600',
			headingTracking: '-0.01em',
			headingTransform: 'none'
		}
	},
	bloom: {
		dark: {
			background: 'oklch(0.16 0.015 350)',
			foreground: 'oklch(0.92 0.01 350)',
			primary: 'oklch(0.70 0.12 350)',
			primaryForeground: 'oklch(0.16 0.03 350)',
			card: 'oklch(0.19 0.015 350)',
			cardForeground: 'oklch(0.92 0.01 350)',
			mutedForeground: 'oklch(0.62 0.03 350)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '400',
			headingTracking: '0.01em',
			headingTransform: 'none'
		},
		light: {
			background: 'oklch(0.98 0.008 350)',
			foreground: 'oklch(0.20 0.02 350)',
			primary: 'oklch(0.55 0.13 350)',
			primaryForeground: 'oklch(0.98 0.005 350)',
			card: 'oklch(0.99 0.005 350)',
			cardForeground: 'oklch(0.20 0.02 350)',
			mutedForeground: 'oklch(0.50 0.03 350)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '400',
			headingTracking: '0.01em',
			headingTransform: 'none'
		}
	},
	gilded: {
		dark: {
			background: 'oklch(0.13 0.01 50)',
			foreground: 'oklch(0.90 0.03 85)',
			primary: 'oklch(0.75 0.13 85)',
			primaryForeground: 'oklch(0.13 0.03 85)',
			card: 'oklch(0.16 0.01 50)',
			cardForeground: 'oklch(0.90 0.03 85)',
			mutedForeground: 'oklch(0.59 0.04 60)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '700',
			headingTracking: '0.06em',
			headingTransform: 'uppercase'
		},
		light: {
			background: 'oklch(0.97 0.008 60)',
			foreground: 'oklch(0.17 0.02 50)',
			primary: 'oklch(0.50 0.12 85)',
			primaryForeground: 'oklch(0.98 0.01 60)',
			card: 'oklch(0.99 0.005 60)',
			cardForeground: 'oklch(0.17 0.02 50)',
			mutedForeground: 'oklch(0.50 0.03 50)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '700',
			headingTracking: '0.06em',
			headingTransform: 'uppercase'
		}
	},
	neon: {
		dark: {
			background: 'oklch(0.14 0.03 290)',
			foreground: 'oklch(0.95 0.01 290)',
			primary: 'oklch(0.72 0.22 330)',
			primaryForeground: 'oklch(0.13 0.04 330)',
			card: 'oklch(0.17 0.03 290)',
			cardForeground: 'oklch(0.95 0.01 290)',
			mutedForeground: 'oklch(0.60 0.04 290)',
			fontHeading: FONT_SANS,
			fontBody: FONT_SANS,
			headingWeight: '800',
			headingTracking: '-0.02em',
			headingTransform: 'none'
		},
		light: {
			background: 'oklch(0.97 0.008 290)',
			foreground: 'oklch(0.16 0.04 290)',
			primary: 'oklch(0.55 0.22 330)',
			primaryForeground: 'oklch(0.98 0.005 330)',
			card: 'oklch(0.99 0.005 290)',
			cardForeground: 'oklch(0.16 0.04 290)',
			mutedForeground: 'oklch(0.48 0.04 290)',
			fontHeading: FONT_SANS,
			fontBody: FONT_SANS,
			headingWeight: '800',
			headingTracking: '-0.02em',
			headingTransform: 'none'
		}
	},
	dusk: {
		dark: {
			background: 'oklch(0.15 0.025 280)',
			foreground: 'oklch(0.92 0.01 280)',
			primary: 'oklch(0.68 0.12 290)',
			primaryForeground: 'oklch(0.15 0.03 290)',
			card: 'oklch(0.18 0.025 280)',
			cardForeground: 'oklch(0.92 0.01 280)',
			mutedForeground: 'oklch(0.60 0.04 280)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '500',
			headingTracking: '0.02em',
			headingTransform: 'none'
		},
		light: {
			background: 'oklch(0.97 0.006 280)',
			foreground: 'oklch(0.18 0.03 280)',
			primary: 'oklch(0.52 0.12 290)',
			primaryForeground: 'oklch(0.98 0.005 290)',
			card: 'oklch(0.99 0.003 280)',
			cardForeground: 'oklch(0.18 0.03 280)',
			mutedForeground: 'oklch(0.50 0.03 280)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '500',
			headingTracking: '0.02em',
			headingTransform: 'none'
		}
	},
	sand: {
		dark: {
			background: 'oklch(0.16 0.015 55)',
			foreground: 'oklch(0.90 0.02 55)',
			primary: 'oklch(0.68 0.12 30)',
			primaryForeground: 'oklch(0.15 0.03 30)',
			card: 'oklch(0.19 0.015 55)',
			cardForeground: 'oklch(0.90 0.02 55)',
			mutedForeground: 'oklch(0.60 0.03 55)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '400',
			headingTracking: '0em',
			headingTransform: 'none'
		},
		light: {
			background: 'oklch(0.96 0.015 55)',
			foreground: 'oklch(0.20 0.02 45)',
			primary: 'oklch(0.52 0.12 30)',
			primaryForeground: 'oklch(0.97 0.01 55)',
			card: 'oklch(0.98 0.01 55)',
			cardForeground: 'oklch(0.20 0.02 45)',
			mutedForeground: 'oklch(0.50 0.03 45)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '400',
			headingTracking: '0em',
			headingTransform: 'none'
		}
	},
	mono: {
		dark: {
			background: 'oklch(0.13 0 0)',
			foreground: 'oklch(0.93 0 0)',
			primary: 'oklch(0.93 0 0)',
			primaryForeground: 'oklch(0.13 0 0)',
			card: 'oklch(0.17 0 0)',
			cardForeground: 'oklch(0.93 0 0)',
			mutedForeground: 'oklch(0.60 0 0)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '700',
			headingTracking: '0em',
			headingTransform: 'none'
		},
		light: {
			background: 'oklch(0.99 0 0)',
			foreground: 'oklch(0.13 0 0)',
			primary: 'oklch(0.13 0 0)',
			primaryForeground: 'oklch(0.99 0 0)',
			card: 'oklch(1 0 0)',
			cardForeground: 'oklch(0.13 0 0)',
			mutedForeground: 'oklch(0.45 0 0)',
			fontHeading: FONT_SERIF,
			fontBody: FONT_SANS,
			headingWeight: '700',
			headingTracking: '0em',
			headingTransform: 'none'
		}
	}
};

export function getThemeTokens(theme: string, mode: string): ThemeTokens {
	return THEME_MAP[theme]?.[mode] ?? THEME_MAP.forest.dark;
}

// ── Aesthetic Map (4 aesthetics × 4 palettes × 2 modes = 32 entries) ──

const AESTHETIC_MAP: Record<string, Record<string, Record<string, ThemeTokens>>> = {
	simple: {
		default: {
			dark: {
				background: 'oklch(0.13 0 0)',
				foreground: 'oklch(0.93 0 0)',
				primary: 'oklch(0.93 0 0)',
				primaryForeground: 'oklch(0.13 0 0)',
				card: 'oklch(0.17 0 0)',
				cardForeground: 'oklch(0.93 0 0)',
				mutedForeground: 'oklch(0.65 0 0)',
				fontHeading: FONT_DM_SANS,
				fontBody: FONT_DM_SANS,
				headingWeight: '500',
				headingTracking: '-0.025em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.985 0 0)',
				foreground: 'oklch(0.14 0 0)',
				primary: 'oklch(0.14 0 0)',
				primaryForeground: 'oklch(0.985 0 0)',
				card: 'oklch(0.97 0 0)',
				cardForeground: 'oklch(0.14 0 0)',
				mutedForeground: 'oklch(0.40 0 0)',
				fontHeading: FONT_DM_SANS,
				fontBody: FONT_DM_SANS,
				headingWeight: '500',
				headingTracking: '-0.025em',
				headingTransform: 'none'
			}
		},
		blue: {
			dark: {
				background: 'oklch(0.13 0.02 250)',
				foreground: 'oklch(0.93 0.008 250)',
				primary: 'oklch(0.68 0.16 240)',
				primaryForeground: 'oklch(0.98 0.005 240)',
				card: 'oklch(0.17 0.025 250)',
				cardForeground: 'oklch(0.93 0.008 250)',
				mutedForeground: 'oklch(0.64 0.015 250)',
				fontHeading: FONT_DM_SANS,
				fontBody: FONT_DM_SANS,
				headingWeight: '500',
				headingTracking: '-0.025em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.985 0.008 250)',
				foreground: 'oklch(0.15 0.015 250)',
				primary: 'oklch(0.50 0.18 245)',
				primaryForeground: 'oklch(0.98 0.005 245)',
				card: 'oklch(0.97 0.01 250)',
				cardForeground: 'oklch(0.15 0.015 250)',
				mutedForeground: 'oklch(0.42 0.01 250)',
				fontHeading: FONT_DM_SANS,
				fontBody: FONT_DM_SANS,
				headingWeight: '500',
				headingTracking: '-0.025em',
				headingTransform: 'none'
			}
		},
		sage: {
			dark: {
				background: 'oklch(0.13 0.02 155)',
				foreground: 'oklch(0.93 0.01 155)',
				primary: 'oklch(0.66 0.14 155)',
				primaryForeground: 'oklch(0.98 0.005 155)',
				card: 'oklch(0.17 0.025 155)',
				cardForeground: 'oklch(0.93 0.01 155)',
				mutedForeground: 'oklch(0.64 0.015 155)',
				fontHeading: FONT_DM_SANS,
				fontBody: FONT_DM_SANS,
				headingWeight: '500',
				headingTracking: '-0.025em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.985 0.01 155)',
				foreground: 'oklch(0.16 0.02 155)',
				primary: 'oklch(0.50 0.14 155)',
				primaryForeground: 'oklch(0.98 0.005 155)',
				card: 'oklch(0.97 0.012 155)',
				cardForeground: 'oklch(0.16 0.02 155)',
				mutedForeground: 'oklch(0.42 0.02 155)',
				fontHeading: FONT_DM_SANS,
				fontBody: FONT_DM_SANS,
				headingWeight: '500',
				headingTracking: '-0.025em',
				headingTransform: 'none'
			}
		},
		violet: {
			dark: {
				background: 'oklch(0.13 0.02 290)',
				foreground: 'oklch(0.93 0.01 290)',
				primary: 'oklch(0.68 0.16 285)',
				primaryForeground: 'oklch(0.98 0.005 285)',
				card: 'oklch(0.17 0.025 290)',
				cardForeground: 'oklch(0.93 0.01 290)',
				mutedForeground: 'oklch(0.64 0.015 290)',
				fontHeading: FONT_DM_SANS,
				fontBody: FONT_DM_SANS,
				headingWeight: '500',
				headingTracking: '-0.025em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.985 0.01 290)',
				foreground: 'oklch(0.16 0.02 290)',
				primary: 'oklch(0.52 0.16 285)',
				primaryForeground: 'oklch(0.98 0.005 285)',
				card: 'oklch(0.97 0.012 290)',
				cardForeground: 'oklch(0.16 0.02 290)',
				mutedForeground: 'oklch(0.42 0.02 290)',
				fontHeading: FONT_DM_SANS,
				fontBody: FONT_DM_SANS,
				headingWeight: '500',
				headingTracking: '-0.025em',
				headingTransform: 'none'
			}
		}
	},
	fun: {
		party: {
			dark: {
				background: 'oklch(0.14 0.03 290)',
				foreground: 'oklch(0.95 0.01 290)',
				primary: 'oklch(0.72 0.22 330)',
				primaryForeground: 'oklch(0.13 0.04 330)',
				card: 'oklch(0.17 0.03 290)',
				cardForeground: 'oklch(0.95 0.01 290)',
				mutedForeground: 'oklch(0.60 0.04 290)',
				fontHeading: FONT_SANS,
				fontBody: FONT_SANS,
				headingWeight: '800',
				headingTracking: '0em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.97 0.008 290)',
				foreground: 'oklch(0.16 0.04 290)',
				primary: 'oklch(0.55 0.22 330)',
				primaryForeground: 'oklch(0.98 0.005 330)',
				card: 'oklch(0.99 0.005 290)',
				cardForeground: 'oklch(0.16 0.04 290)',
				mutedForeground: 'oklch(0.48 0.04 290)',
				fontHeading: FONT_SANS,
				fontBody: FONT_SANS,
				headingWeight: '800',
				headingTracking: '0em',
				headingTransform: 'none'
			}
		},
		neon: {
			dark: {
				background: 'oklch(0.14 0.03 260)',
				foreground: 'oklch(0.95 0.01 260)',
				primary: 'oklch(0.68 0.19 245)',
				primaryForeground: 'oklch(0.13 0.04 245)',
				card: 'oklch(0.17 0.03 260)',
				cardForeground: 'oklch(0.95 0.01 260)',
				mutedForeground: 'oklch(0.62 0.04 260)',
				fontHeading: FONT_SANS,
				fontBody: FONT_SANS,
				headingWeight: '800',
				headingTracking: '0em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.97 0.005 260)',
				foreground: 'oklch(0.15 0.04 260)',
				primary: 'oklch(0.50 0.20 245)',
				primaryForeground: 'oklch(0.98 0.005 245)',
				card: 'oklch(0.99 0.003 260)',
				cardForeground: 'oklch(0.15 0.04 260)',
				mutedForeground: 'oklch(0.48 0.04 260)',
				fontHeading: FONT_SANS,
				fontBody: FONT_SANS,
				headingWeight: '800',
				headingTracking: '0em',
				headingTransform: 'none'
			}
		},
		sunset: {
			dark: {
				background: 'oklch(0.14 0.025 40)',
				foreground: 'oklch(0.94 0.015 60)',
				primary: 'oklch(0.70 0.18 25)',
				primaryForeground: 'oklch(0.14 0.03 25)',
				card: 'oklch(0.17 0.025 40)',
				cardForeground: 'oklch(0.94 0.015 60)',
				mutedForeground: 'oklch(0.62 0.04 40)',
				fontHeading: FONT_SANS,
				fontBody: FONT_SANS,
				headingWeight: '800',
				headingTracking: '0em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.97 0.01 55)',
				foreground: 'oklch(0.17 0.03 40)',
				primary: 'oklch(0.52 0.18 25)',
				primaryForeground: 'oklch(0.98 0.01 55)',
				card: 'oklch(0.99 0.006 55)',
				cardForeground: 'oklch(0.17 0.03 40)',
				mutedForeground: 'oklch(0.48 0.04 40)',
				fontHeading: FONT_SANS,
				fontBody: FONT_SANS,
				headingWeight: '800',
				headingTracking: '0em',
				headingTransform: 'none'
			}
		},
		cosmic: {
			dark: {
				background: 'oklch(0.13 0.025 220)',
				foreground: 'oklch(0.95 0.008 220)',
				primary: 'oklch(0.75 0.16 180)',
				primaryForeground: 'oklch(0.13 0.04 180)',
				card: 'oklch(0.16 0.025 220)',
				cardForeground: 'oklch(0.95 0.008 220)',
				mutedForeground: 'oklch(0.62 0.03 220)',
				fontHeading: FONT_SANS,
				fontBody: FONT_SANS,
				headingWeight: '800',
				headingTracking: '0em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.97 0.005 220)',
				foreground: 'oklch(0.15 0.035 220)',
				primary: 'oklch(0.48 0.14 180)',
				primaryForeground: 'oklch(0.98 0.005 180)',
				card: 'oklch(0.99 0.003 220)',
				cardForeground: 'oklch(0.15 0.035 220)',
				mutedForeground: 'oklch(0.48 0.03 220)',
				fontHeading: FONT_SANS,
				fontBody: FONT_SANS,
				headingWeight: '800',
				headingTracking: '0em',
				headingTransform: 'none'
			}
		}
	},
	warm: {
		hearth: {
			dark: {
				background: 'oklch(0.17 0.015 50)',
				foreground: 'oklch(0.91 0.02 60)',
				primary: 'oklch(0.68 0.10 145)',
				primaryForeground: 'oklch(0.17 0.03 145)',
				card: 'oklch(0.20 0.015 50)',
				cardForeground: 'oklch(0.91 0.02 60)',
				mutedForeground: 'oklch(0.62 0.03 50)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_SOURCE_SANS,
				headingWeight: '300',
				headingTracking: '0em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.97 0.012 55)',
				foreground: 'oklch(0.20 0.02 45)',
				primary: 'oklch(0.48 0.10 145)',
				primaryForeground: 'oklch(0.98 0.01 55)',
				card: 'oklch(0.99 0.008 55)',
				cardForeground: 'oklch(0.20 0.02 45)',
				mutedForeground: 'oklch(0.48 0.03 45)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_SOURCE_SANS,
				headingWeight: '300',
				headingTracking: '0em',
				headingTransform: 'none'
			}
		},
		clay: {
			dark: {
				background: 'oklch(0.16 0.018 45)',
				foreground: 'oklch(0.90 0.02 55)',
				primary: 'oklch(0.68 0.13 28)',
				primaryForeground: 'oklch(0.16 0.03 28)',
				card: 'oklch(0.19 0.018 45)',
				cardForeground: 'oklch(0.90 0.02 55)',
				mutedForeground: 'oklch(0.60 0.03 45)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_SOURCE_SANS,
				headingWeight: '300',
				headingTracking: '0em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.96 0.015 55)',
				foreground: 'oklch(0.20 0.025 40)',
				primary: 'oklch(0.50 0.13 28)',
				primaryForeground: 'oklch(0.97 0.01 55)',
				card: 'oklch(0.98 0.01 55)',
				cardForeground: 'oklch(0.20 0.025 40)',
				mutedForeground: 'oklch(0.48 0.03 40)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_SOURCE_SANS,
				headingWeight: '300',
				headingTracking: '0em',
				headingTransform: 'none'
			}
		},
		sage: {
			dark: {
				background: 'oklch(0.17 0.015 55)',
				foreground: 'oklch(0.90 0.02 60)',
				primary: 'oklch(0.66 0.10 140)',
				primaryForeground: 'oklch(0.17 0.03 140)',
				card: 'oklch(0.20 0.015 55)',
				cardForeground: 'oklch(0.90 0.02 60)',
				mutedForeground: 'oklch(0.60 0.03 55)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_SOURCE_SANS,
				headingWeight: '300',
				headingTracking: '0em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.97 0.01 60)',
				foreground: 'oklch(0.20 0.02 50)',
				primary: 'oklch(0.46 0.10 140)',
				primaryForeground: 'oklch(0.98 0.01 60)',
				card: 'oklch(0.99 0.008 60)',
				cardForeground: 'oklch(0.20 0.02 50)',
				mutedForeground: 'oklch(0.48 0.03 50)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_SOURCE_SANS,
				headingWeight: '300',
				headingTracking: '0em',
				headingTransform: 'none'
			}
		},
		wine: {
			dark: {
				background: 'oklch(0.16 0.018 40)',
				foreground: 'oklch(0.90 0.02 50)',
				primary: 'oklch(0.62 0.14 10)',
				primaryForeground: 'oklch(0.95 0.01 10)',
				card: 'oklch(0.19 0.018 40)',
				cardForeground: 'oklch(0.90 0.02 50)',
				mutedForeground: 'oklch(0.60 0.03 40)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_SOURCE_SANS,
				headingWeight: '300',
				headingTracking: '0em',
				headingTransform: 'none'
			},
			light: {
				background: 'oklch(0.96 0.012 50)',
				foreground: 'oklch(0.20 0.025 35)',
				primary: 'oklch(0.42 0.14 10)',
				primaryForeground: 'oklch(0.97 0.01 50)',
				card: 'oklch(0.98 0.008 50)',
				cardForeground: 'oklch(0.20 0.025 35)',
				mutedForeground: 'oklch(0.48 0.03 35)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_SOURCE_SANS,
				headingWeight: '300',
				headingTracking: '0em',
				headingTransform: 'none'
			}
		}
	},
	elegant: {
		ivory: {
			dark: {
				background: 'oklch(0.155 0.008 55)',
				foreground: 'oklch(0.92 0.012 70)',
				primary: 'oklch(0.68 0.06 145)',
				primaryForeground: 'oklch(0.15 0.015 145)',
				card: 'oklch(0.185 0.008 55)',
				cardForeground: 'oklch(0.92 0.012 70)',
				mutedForeground: 'oklch(0.55 0.008 60)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_RALEWAY,
				headingWeight: '300',
				headingTracking: '0.08em',
				headingTransform: 'uppercase'
			},
			light: {
				background: 'oklch(0.975 0.008 85)',
				foreground: 'oklch(0.22 0.015 55)',
				primary: 'oklch(0.52 0.06 145)',
				primaryForeground: 'oklch(0.98 0.005 85)',
				card: 'oklch(0.99 0.005 85)',
				cardForeground: 'oklch(0.22 0.015 55)',
				mutedForeground: 'oklch(0.58 0.010 55)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_RALEWAY,
				headingWeight: '300',
				headingTracking: '0.08em',
				headingTransform: 'uppercase'
			}
		},
		champagne: {
			dark: {
				background: 'oklch(0.14 0.010 50)',
				foreground: 'oklch(0.91 0.015 70)',
				primary: 'oklch(0.72 0.10 75)',
				primaryForeground: 'oklch(0.14 0.02 75)',
				card: 'oklch(0.17 0.010 50)',
				cardForeground: 'oklch(0.91 0.015 70)',
				mutedForeground: 'oklch(0.53 0.010 60)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_RALEWAY,
				headingWeight: '300',
				headingTracking: '0.08em',
				headingTransform: 'uppercase'
			},
			light: {
				background: 'oklch(0.97 0.010 75)',
				foreground: 'oklch(0.20 0.015 50)',
				primary: 'oklch(0.52 0.08 75)',
				primaryForeground: 'oklch(0.98 0.005 75)',
				card: 'oklch(0.985 0.007 75)',
				cardForeground: 'oklch(0.20 0.015 50)',
				mutedForeground: 'oklch(0.56 0.012 50)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_RALEWAY,
				headingWeight: '300',
				headingTracking: '0.08em',
				headingTransform: 'uppercase'
			}
		},
		midnight: {
			dark: {
				background: 'oklch(0.145 0.020 250)',
				foreground: 'oklch(0.93 0.008 250)',
				primary: 'oklch(0.72 0.04 250)',
				primaryForeground: 'oklch(0.145 0.02 250)',
				card: 'oklch(0.175 0.020 250)',
				cardForeground: 'oklch(0.93 0.008 250)',
				mutedForeground: 'oklch(0.55 0.006 250)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_RALEWAY,
				headingWeight: '300',
				headingTracking: '0.08em',
				headingTransform: 'uppercase'
			},
			light: {
				background: 'oklch(0.97 0.006 250)',
				foreground: 'oklch(0.18 0.025 250)',
				primary: 'oklch(0.48 0.04 250)',
				primaryForeground: 'oklch(0.97 0.004 250)',
				card: 'oklch(0.985 0.004 250)',
				cardForeground: 'oklch(0.18 0.025 250)',
				mutedForeground: 'oklch(0.56 0.014 250)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_RALEWAY,
				headingWeight: '300',
				headingTracking: '0.08em',
				headingTransform: 'uppercase'
			}
		},
		rose: {
			dark: {
				background: 'oklch(0.155 0.010 350)',
				foreground: 'oklch(0.92 0.008 10)',
				primary: 'oklch(0.70 0.07 350)',
				primaryForeground: 'oklch(0.155 0.015 350)',
				card: 'oklch(0.185 0.010 350)',
				cardForeground: 'oklch(0.92 0.008 10)',
				mutedForeground: 'oklch(0.55 0.006 350)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_RALEWAY,
				headingWeight: '300',
				headingTracking: '0.08em',
				headingTransform: 'uppercase'
			},
			light: {
				background: 'oklch(0.975 0.008 10)',
				foreground: 'oklch(0.22 0.012 350)',
				primary: 'oklch(0.55 0.06 350)',
				primaryForeground: 'oklch(0.98 0.005 10)',
				card: 'oklch(0.99 0.005 10)',
				cardForeground: 'oklch(0.22 0.012 350)',
				mutedForeground: 'oklch(0.58 0.008 350)',
				fontHeading: FONT_CORMORANT,
				fontBody: FONT_RALEWAY,
				headingWeight: '300',
				headingTracking: '0.08em',
				headingTransform: 'uppercase'
			}
		}
	}
};

export function getAestheticTokens(aesthetic: string, palette: string, mode: string): ThemeTokens {
	return (
		AESTHETIC_MAP[aesthetic]?.[palette]?.[mode] ??
		AESTHETIC_MAP.fun?.party?.dark ??
		THEME_MAP.forest.dark
	);
}
