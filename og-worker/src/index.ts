/**
 * Ephemeral OG Image Worker
 *
 * Standalone Cloudflare Worker that generates hero-accurate OG images (PNG)
 * for event pages. Deployed separately from the SvelteKit Pages app to avoid
 * WASM bundling issues with adapter-cloudflare.
 *
 * Route: GET /:slug
 */

import { Resvg } from '@cf-wasm/resvg/workerd';
import satori, { init as initSatori } from 'satori/standalone';
// @ts-expect-error — WASM import handled by wrangler
import yogaWasm from '../node_modules/satori/yoga.wasm';

// Initialize yoga (satori/standalone requires manual init with pre-compiled WASM)
const yogaReady = initSatori(yogaWasm);

import { getThemeTokens, getAestheticTokens } from '../../src/lib/themes/tokens';
import { THEME_TO_AESTHETIC } from '../../src/lib/themes/types';
import { computeAccentPrimary, computeAccentPrimaryForeground } from '../../src/lib/themes/accent';
import type { EventAesthetic } from '../../src/lib/themes/types';
import { formatEventDateShort } from '../../src/lib/utils/date-format';
import {
	oklchToHex,
	oklchToRgba,
	buildGenerativeGradient,
	buildScrimGradient
} from '../../src/lib/utils/og-helpers';

interface Env {
	BACKEND: Fetcher;
}

interface PublicEventData {
	event: {
		title: string;
		slug: string;
		theme?: string;
		mode?: string;
		aesthetic?: string;
		palette?: string;
		accent_hue?: number | null;
		start_time?: string;
		end_time?: string;
		timezone?: string;
		venue_name?: string;
		location_hidden?: boolean;
		cover_r2_key?: string;
		cover_thumb_r2_key?: string;
	};
	host?: {
		display_name?: string;
		username?: string;
	};
	rsvp_counts?: {
		going?: number;
		maybe?: number;
	};
}

const WIDTH = 1200;
const HEIGHT = 630;

// ── Font URL registry (Google Fonts static TTFs) ──────────────────
const FONT_URLS: Record<string, string> = {
	'dm-sans-400':
		'https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAopxhTg.ttf',
	'dm-sans-500':
		'https://fonts.gstatic.com/s/dmsans/v17/rP2tp2ywxg089UriI5-g4vlH9VoD8CmcqZG40F9JadbnoEwAkJxhTg.ttf',
	'manrope-600':
		'https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk4jE-_F.ttf',
	'manrope-700':
		'https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk4aE-_F.ttf',
	'manrope-800':
		'https://fonts.gstatic.com/s/manrope/v20/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk59E-_F.ttf',
	'cormorant-300':
		'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_qE6GnM.ttf',
	'cormorant-400':
		'https://fonts.gstatic.com/s/cormorantgaramond/v21/co3umX5slCNuHLi8bLeY9MK7whWMhyjypVO7abI26QOD_v86GnM.ttf',
	'source-sans-400':
		'https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Ky461EN.ttf',
	'source-sans-600':
		'https://fonts.gstatic.com/s/sourcesans3/v19/nwpBtKy2OAdR1K-IwhWudF-R9QMylBJAV3Bo8Kxm7FEN.ttf',
	'raleway-300':
		'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVuEooCP.ttf',
	'raleway-400':
		'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaooCP.ttf',
	'raleway-500':
		'https://fonts.gstatic.com/s/raleway/v37/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvoooCP.ttf',
	'vollkorn-400':
		'https://fonts.gstatic.com/s/vollkorn/v30/0ybgGDoxxrvAnPhYGzMlQLzuMasz6Df2MHGuGQ.ttf',
	'vollkorn-700':
		'https://fonts.gstatic.com/s/vollkorn/v30/0ybgGDoxxrvAnPhYGzMlQLzuMasz6Df213auGQ.ttf'
};

// Font sets per aesthetic (only load what's needed)
type AestheticFontSet = 'simple' | 'fun' | 'warm' | 'elegant' | 'legacy';
const AESTHETIC_FONT_SETS: Record<AestheticFontSet, string[]> = {
	simple: ['dm-sans-400', 'dm-sans-500'],
	fun: ['manrope-600', 'manrope-700', 'manrope-800'],
	warm: ['cormorant-300', 'cormorant-400', 'source-sans-400', 'source-sans-600'],
	elegant: ['cormorant-300', 'cormorant-400', 'raleway-300', 'raleway-400', 'raleway-500'],
	legacy: ['vollkorn-400', 'vollkorn-700', 'manrope-600', 'manrope-700']
};

// Module-level lazy font cache
const fontBufferCache = new Map<string, ArrayBuffer>();

async function fetchFont(url: string): Promise<ArrayBuffer> {
	const r = await fetch(url);
	if (!r.ok) throw new Error(`Font fetch failed: ${r.status} for ${url}`);
	const ct = r.headers.get('content-type') || '';
	if (ct.includes('html')) throw new Error(`Font returned HTML (${r.status}): ${url}`);
	return r.arrayBuffer();
}

async function loadFontsForAesthetic(type: AestheticFontSet): Promise<void> {
	const keys = AESTHETIC_FONT_SETS[type];
	const toFetch = keys.filter((k) => !fontBufferCache.has(k));
	if (toFetch.length === 0) return;

	const buffers = await Promise.all(toFetch.map((k) => fetchFont(FONT_URLS[k])));
	toFetch.forEach((k, i) => fontBufferCache.set(k, buffers[i]));
}

// ── Font name resolution ──────────────────────────────────────────
function resolveHeadingFontName(fontHeading: string): string {
	if (fontHeading.includes('DM Sans')) return 'DM Sans';
	if (fontHeading.includes('Cormorant Garamond')) return 'Cormorant Garamond';
	if (fontHeading.includes('Vollkorn')) return 'Vollkorn';
	return 'Manrope';
}

function resolveBodyFontName(fontBody: string): string {
	if (fontBody.includes('DM Sans')) return 'DM Sans';
	if (fontBody.includes('Source Sans 3')) return 'Source Sans 3';
	if (fontBody.includes('Raleway')) return 'Raleway';
	if (fontBody.includes('Vollkorn')) return 'Vollkorn';
	return 'Manrope';
}

type SatoriWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

function getSatoriFonts(type: AestheticFontSet) {
	const fontDefs: Record<string, { name: string; weight: SatoriWeight }> = {
		'dm-sans-400': { name: 'DM Sans', weight: 400 },
		'dm-sans-500': { name: 'DM Sans', weight: 500 },
		'manrope-600': { name: 'Manrope', weight: 600 },
		'manrope-700': { name: 'Manrope', weight: 700 },
		'manrope-800': { name: 'Manrope', weight: 800 },
		'cormorant-300': { name: 'Cormorant Garamond', weight: 300 },
		'cormorant-400': { name: 'Cormorant Garamond', weight: 400 },
		'source-sans-400': { name: 'Source Sans 3', weight: 400 },
		'source-sans-600': { name: 'Source Sans 3', weight: 600 },
		'raleway-300': { name: 'Raleway', weight: 300 },
		'raleway-400': { name: 'Raleway', weight: 400 },
		'raleway-500': { name: 'Raleway', weight: 500 },
		'vollkorn-400': { name: 'Vollkorn', weight: 400 },
		'vollkorn-700': { name: 'Vollkorn', weight: 700 }
	};

	return AESTHETIC_FONT_SETS[type].map((key) => ({
		name: fontDefs[key].name,
		data: fontBufferCache.get(key)!,
		weight: fontDefs[key].weight,
		style: 'normal' as const
	}));
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function bufferToBase64(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const slug = url.pathname.replace(/^\//, '');

		if (!slug) {
			return new Response('Missing slug', { status: 400 });
		}

		try {
			// 1. Fetch event data via service binding (avoids CF 1042 error)
			const res = await env.BACKEND.fetch(
				`https://backend/v1/events/by-slug/${encodeURIComponent(slug)}`
			);

			if (!res.ok) {
				return new Response('Event not found', { status: res.status === 404 ? 404 : 500 });
			}

			const data = (await res.json()) as PublicEventData;

			if (!data.event) {
				return new Response('Event not found', { status: 404 });
			}

			const mode = data.event.mode || 'dark';
			const accentHue = data.event.accent_hue ?? null;

			// 2. Resolve aesthetic → tokens (new system) or fall back to legacy theme
			let tokens;
			let aestheticType: AestheticFontSet;
			let resolvedAesthetic: string | undefined;

			if (data.event.aesthetic && data.event.palette) {
				// New aesthetic system
				tokens = getAestheticTokens(data.event.aesthetic, data.event.palette, mode);
				aestheticType = data.event.aesthetic as AestheticFontSet;
				resolvedAesthetic = data.event.aesthetic;
			} else if (data.event.theme && THEME_TO_AESTHETIC[data.event.theme]) {
				// Legacy theme → map to aesthetic
				const mapped = THEME_TO_AESTHETIC[data.event.theme];
				tokens = getAestheticTokens(mapped.aesthetic, mapped.palette, mode);
				aestheticType = mapped.aesthetic as AestheticFontSet;
				resolvedAesthetic = mapped.aesthetic;
			} else {
				// Pure legacy fallback
				const theme = data.event.theme || 'forest';
				tokens = getThemeTokens(theme, mode);
				aestheticType = 'legacy';
				resolvedAesthetic = undefined;
			}

			// 3. Convert all theme tokens to hex/rgba
			const bgHex = oklchToHex(tokens.background);
			const fgHex = oklchToHex(tokens.foreground);
			const primaryHex = oklchToHex(
				accentHue !== null
					? computeAccentPrimary(accentHue, mode as 'light' | 'dark', resolvedAesthetic as EventAesthetic | undefined)
					: tokens.primary
			);
			oklchToHex(
				accentHue !== null
					? computeAccentPrimaryForeground(accentHue, mode as 'light' | 'dark')
					: tokens.primaryForeground
			);
			const mutedFgHex = oklchToHex(tokens.mutedForeground);
			const cardBgRgba = oklchToRgba(tokens.card, 0.72);
			const cardBorderRgba = oklchToRgba(tokens.foreground, 0.08);

			// 4. Fetch cover image (if available)
			// Priority: video thumbnail > image cover > generative gradient
			let coverDataUri: string | null = null;
			const thumbKey = data.event.cover_thumb_r2_key || '';
			const coverKey = data.event.cover_r2_key || '';
			const coverImageKey = thumbKey || (coverKey && /\.(jpe?g|png|webp|gif|avif)$/i.test(coverKey) ? coverKey : '');
			if (coverImageKey) {
				try {
					const coverRes = await env.BACKEND.fetch(
						`https://backend/v1/media/${coverImageKey}`,
						{ signal: AbortSignal.timeout(3000) }
					);
					if (coverRes.ok) {
						const buf = await coverRes.arrayBuffer();
						const contentType = coverRes.headers.get('Content-Type') || 'image/jpeg';
						const base64 = bufferToBase64(buf);
						coverDataUri = `data:${contentType};base64,${base64}`;
					}
				} catch {
					// Timeout or fetch error — fall back to generative gradient
				}
			}

			// 5. Build content
			const title = data.event.title;
			const dateStr = data.event.start_time
				? formatEventDateShort(data.event.start_time, data.event.timezone)
				: '';
			const hostName = data.host?.display_name || data.host?.username || '';
			const venueName =
				!data.event.location_hidden && data.event.venue_name
					? data.event.venue_name
					: '';
			const goingCount = data.rsvp_counts?.going ?? 0;
			const maybeCount = data.rsvp_counts?.maybe ?? 0;

			let rsvpText = `${goingCount} going`;
			if (maybeCount > 0) {
				rsvpText += `, ${maybeCount} maybe`;
			}

			const scrimGradient = buildScrimGradient(tokens.background);
			const generativeGradient = !coverDataUri
				? buildGenerativeGradient(title, bgHex)
				: '';

			// Font settings from theme tokens
			const headingFont = resolveHeadingFontName(tokens.fontHeading);
			const bodyFont = resolveBodyFontName(tokens.fontBody);
			const headingWeight = tokens.headingWeight;
			const headingTracking = tokens.headingTracking;
			const headingTransform = tokens.headingTransform;

			const titleFontSize = title.length > 60 ? 52 : title.length > 40 ? 64 : title.length > 20 ? 76 : 88;

			// 6. Build Satori markup
			const coverLayer = coverDataUri
				? {
						type: 'img',
						props: {
							src: coverDataUri,
							style: {
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: '100%',
								objectFit: 'cover' as const
							}
						}
					}
				: {
						type: 'div',
						props: {
							style: {
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: '100%',
								background: generativeGradient
							}
						}
					};

			// Helper to build a bullet-point row (accent circle + text)
			const infoRow = (text: string) => ({
				type: 'div',
				props: {
					style: {
						display: 'flex',
						alignItems: 'center',
						gap: 14
					},
					children: [
						{
							type: 'div',
							props: {
								style: {
									width: 12,
									height: 12,
									borderRadius: '50%',
									background: primaryHex,
									flexShrink: 0
								}
							}
						},
						{
							type: 'div',
							props: {
								style: {
									fontFamily: bodyFont,
									fontSize: 28,
									fontWeight: 600,
									color: fgHex
								},
								children: escapeHtml(text)
							}
						}
					]
				}
			});

			const infoCardChildren = [
				...(dateStr ? [infoRow(dateStr)] : []),
				...(venueName ? [infoRow(venueName)] : []),
				infoRow(rsvpText)
			];

			const markup = {
				type: 'div',
				props: {
					style: {
						display: 'flex',
						flexDirection: 'column',
						width: WIDTH,
						height: HEIGHT,
						background: bgHex,
						position: 'relative',
						overflow: 'hidden'
					},
					children: [
						coverLayer,
						// Scrim gradient overlay
						{
							type: 'div',
							props: {
								style: {
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									background: scrimGradient
								}
							}
						},
						// Accent bar at top
						{
							type: 'div',
							props: {
								style: {
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									height: 8,
									background: primaryHex
								}
							}
						},
						// Content overlay — bottom-aligned
						{
							type: 'div',
							props: {
								style: {
									position: 'absolute',
									bottom: 0,
									left: 0,
									right: 0,
									display: 'flex',
									flexDirection: 'column',
									padding: '0 56px 48px 56px',
									gap: 24
								},
								children: [
									// Title
									{
										type: 'div',
										props: {
											style: {
												display: 'flex',
												fontFamily: headingFont,
												fontSize: titleFontSize,
												fontWeight: headingWeight,
												letterSpacing: headingTracking,
												textTransform: headingTransform as any,
												color: fgHex,
												lineHeight: 1.15
											},
											children: escapeHtml(title)
										}
									},
									// Hosted by
									...(hostName
										? [
												{
													type: 'div',
													props: {
														style: {
															display: 'flex',
															fontFamily: bodyFont,
															fontSize: 32,
															fontWeight: 600,
															color: mutedFgHex
														},
														children: `Hosted by ${escapeHtml(hostName)}`
													}
												}
											]
										: []),
									// Info card
									{
										type: 'div',
										props: {
											style: {
												display: 'flex',
												flexDirection: 'column',
												background: cardBgRgba,
												border: `1px solid ${cardBorderRgba}`,
												borderRadius: 20,
												padding: '24px 32px',
												gap: 14
											},
											children: infoCardChildren
										}
									}
								]
							}
						}
					]
				}
			};

			// 7. Load fonts for the resolved aesthetic
			await loadFontsForAesthetic(aestheticType);

			// 8. Render SVG via satori (ensure yoga WASM is ready)
			await yogaReady;
			const svg = await satori(markup as any, {
				width: WIDTH,
				height: HEIGHT,
				fonts: getSatoriFonts(aestheticType)
			});

			// 9. Convert SVG to PNG via resvg
			const resvg = new Resvg(svg, {
				fitTo: { mode: 'width' as const, value: WIDTH }
			});
			const pngData = resvg.render();
			const pngBuffer = pngData.asPng();

			return new Response(pngBuffer, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'public, max-age=86400, s-maxage=86400',
					'Access-Control-Allow-Origin': '*'
				}
			});
		} catch (err: any) {
			console.error('[og] Error:', err);
			return new Response(
				JSON.stringify({ error: String(err?.message || err) }),
				{ status: 500, headers: { 'Content-Type': 'application/json' } }
			);
		}
	}
};
