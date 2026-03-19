import { parse, formatHex } from 'culori';

/**
 * Convert an OKLCH color string to hex.
 * Falls back to the provided fallback (or #111110) on parse error.
 */
export function oklchToHex(oklchStr: string, fallback = '#111110'): string {
	try {
		const color = parse(oklchStr);
		if (!color) return fallback;
		return formatHex(color);
	} catch {
		return fallback;
	}
}

/**
 * Convert an OKLCH color string to rgba() with a given alpha.
 * Falls back to a default rgba string on parse error.
 */
export function oklchToRgba(oklchStr: string, alpha: number, fallback = 'rgba(17, 17, 16, 1)'): string {
	try {
		const color = parse(oklchStr);
		if (!color) return fallback;
		const hex = formatHex(color);
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	} catch {
		return fallback;
	}
}

/**
 * Always returns the absolute OG image URL for a given slug.
 * The OG endpoint handles cover embedding internally.
 */
export function getAbsoluteOgImageUrl(slug?: string, ogWorkerUrl?: string): string | null {
	if (!slug) return null;
	const baseUrl = ogWorkerUrl || 'https://ephemeral-og.ephemeralsocial.workers.dev';
	return `${baseUrl}/${slug}`;
}

// ─── Generative gradient (port of GenerativeCover.svelte) ───

const PALETTES = [
	['#52b788', '#2d6a4f', '#95d5b2'], // Forest canopy
	['#c9a96e', '#e8a520', '#deb887'], // Golden hour
	['#e85d04', '#f48c06', '#ffba08'], // Ember glow
	['#7b2cbf', '#4361ee', '#9d4edd'], // Twilight
	['#0096c7', '#48bfe3', '#023e8a'], // Ocean depths
	['#ff6b8a', '#e56b6f', '#b5838d'], // Rose garden
	['#2ec4b6', '#17c3b2', '#0f766e'], // Teal waters
	['#ffb703', '#fb8500', '#fca311']  // Citrus
];

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

/**
 * Build a CSS background string matching GenerativeCover.svelte:
 * 3 radial color gradients + 2 ring gradients + 1 ambient + base color.
 */
export function buildGenerativeGradient(seed: string, bgHex: string): string {
	const hash = hashString(seed);
	const palette = PALETTES[hash % PALETTES.length];

	const g1 = {
		x: 10 + ((hash >> 4) % 45),
		y: 10 + ((hash >> 8) % 35),
		size: 55 + ((hash >> 3) % 30)
	};
	const g2 = {
		x: 40 + ((hash >> 12) % 50),
		y: 5 + ((hash >> 16) % 30),
		size: 45 + ((hash >> 7) % 25)
	};
	const g3 = {
		x: 15 + ((hash >> 20) % 55),
		y: 30 + ((hash >> 24) % 35),
		size: 40 + ((hash >> 11) % 30)
	};

	const ring1 = {
		x: 60 + ((hash >> 5) % 30),
		y: 15 + ((hash >> 9) % 25),
		r: 12 + ((hash >> 13) % 10)
	};
	const ring2 = {
		x: 20 + ((hash >> 17) % 30),
		y: 50 + ((hash >> 21) % 25),
		r: 16 + ((hash >> 25) % 12)
	};

	return (
		`radial-gradient(ellipse ${g1.size}% ${g1.size}% at ${g1.x}% ${g1.y}%, ${palette[0]}60 0%, transparent 70%), ` +
		`radial-gradient(ellipse ${g2.size}% ${g2.size}% at ${g2.x}% ${g2.y}%, ${palette[1]}50 0%, transparent 65%), ` +
		`radial-gradient(ellipse ${g3.size}% ${g3.size}% at ${g3.x}% ${g3.y}%, ${palette[2]}40 0%, transparent 60%), ` +
		`radial-gradient(circle at ${ring1.x}% ${ring1.y}%, transparent ${ring1.r - 0.5}%, rgba(255,255,255,0.03) ${ring1.r}%, transparent ${ring1.r + 0.5}%), ` +
		`radial-gradient(circle at ${ring2.x}% ${ring2.y}%, transparent ${ring2.r - 0.5}%, rgba(255,255,255,0.025) ${ring2.r}%, transparent ${ring2.r + 0.5}%), ` +
		`radial-gradient(ellipse 120% 80% at 50% 30%, rgba(200, 180, 150, 0.04) 0%, transparent 70%), ` +
		bgHex
	);
}

/**
 * Build the 5-stop scrim gradient matching HeroCover.svelte's .scrim-gradient,
 * using rgba() instead of color-mix() (Satori/resvg don't support color-mix).
 */
export function buildScrimGradient(bgOklch: string): string {
	const bgRgba0 = oklchToRgba(bgOklch, 0);
	const bgRgba20 = oklchToRgba(bgOklch, 0.20);
	const bgRgba70 = oklchToRgba(bgOklch, 0.70);
	const bgRgba95 = oklchToRgba(bgOklch, 0.95);
	const bgRgba100 = oklchToRgba(bgOklch, 1);

	return `linear-gradient(180deg, ${bgRgba0} 20%, ${bgRgba20} 40%, ${bgRgba70} 60%, ${bgRgba95} 80%, ${bgRgba100} 100%)`;
}

// Export PALETTES for testing
export { PALETTES };
