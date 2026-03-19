import type { Handle } from '@sveltejs/kit';
import { isValidTheme, isValidMode, type EventMode } from '$lib/themes/types';
import { computeAccentStyle } from '$lib/themes/accent';

// Forks: update these to your own domains
const CANONICAL_ORIGIN = 'https://ephemeralsocial.com';

/** *.pages.dev hosts that should 301 to the canonical domain */
// Forks: update to your own *.pages.dev hostnames
const PAGES_DEV_HOSTS = ['ephemeral-events.pages.dev', 'ephemeral-landing.pages.dev'];

// Forks: update to your own allowed origins
const ALLOWED_ORIGINS = [
	'https://ephemeralsocial.com',
	'https://ephmr.al',
	'https://ephemeral-events.pages.dev'
];

/** Security response headers applied to all responses */
const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	// CSP for Stripe Connect.js embedded components
	// 'unsafe-inline' required for Stripe Connect.js inline styles and SvelteKit hydration
	// Do NOT set Cross-Origin-Opener-Policy — Express accounts use popups for identity verification
	'Content-Security-Policy': [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect-js.stripe.com https://js.stripe.com https://static.cloudflareinsights.com https://embed.tawk.to https://*.tawk.to",
		'frame-src https://connect-js.stripe.com https://js.stripe.com https://docs.google.com https://tawk.to https://*.tawk.to',
		"connect-src 'self' https://*.stripe.com https://ephemeral-waitlist.ephemeralsocial.workers.dev https://cloudflareinsights.com https://*.tawk.to wss://*.tawk.to",
		"img-src 'self' data: https://*.stripe.com https://b.stripecdn.com https://i.pinimg.com https://*.tawk.to",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to",
		"font-src 'self' https://fonts.gstatic.com https://*.tawk.to",
		"child-src blob: https://*.tawk.to",
		"worker-src blob:",
		"media-src https://*.tawk.to"
	].join('; ')
};

export const handle: Handle = async ({ event, resolve }) => {
	// Redirect *.pages.dev to canonical domain
	const host = event.url.host;
	if (PAGES_DEV_HOSTS.includes(host)) {
		return new Response(null, {
			status: 301,
			headers: {
				Location: `${CANONICAL_ORIGIN}${event.url.pathname}${event.url.search}`,
				'Cache-Control': 'public, max-age=3600'
			}
		});
	}

	// CSRF origin check on state-changing methods
	if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.request.method)) {
		const origin = event.request.headers.get('origin');
		const referer = event.request.headers.get('referer');

		// In production, validate origin matches expected hosts
		if (origin) {
			const isAllowed =
				ALLOWED_ORIGINS.some((allowed) => origin === allowed) ||
				origin.startsWith('http://localhost:') ||
				origin.startsWith('http://127.0.0.1:');

			if (!isAllowed) {
				return new Response('Forbidden', { status: 403 });
			}
		} else if (referer) {
			const refererOrigin = new URL(referer).origin;
			const isAllowed =
				ALLOWED_ORIGINS.some((allowed) => refererOrigin === allowed) ||
				refererOrigin.startsWith('http://localhost:') ||
				refererOrigin.startsWith('http://127.0.0.1:');

			if (!isAllowed) {
				return new Response('Forbidden', { status: 403 });
			}
		}
		// If neither origin nor referer is present, allow the request
		// (same-origin requests from some browsers don't include these)
	}

	// SSR theme injection for event pages to prevent FOUC
	let themeAttrs = '';
	let accentInlineStyle = '';
	const eventSlugMatch = event.url.pathname.match(/^\/e\/([^/]+)\/?$/);
	if (eventSlugMatch) {
		try {
			const { env } = await import('$env/dynamic/private');
			const backendUrl = event.platform?.env?.BACKEND_URL || env.BACKEND_URL || 'http://127.0.0.1:8787';
			const slug = eventSlugMatch[1];
			const res = await fetch(`${backendUrl}/v1/events/by-slug/${encodeURIComponent(slug)}`);
			if (res.ok) {
				const data = (await res.json()) as {
					event?: { theme?: string; mode?: string; accent_hue?: number | null };
				};
				const theme = data.event?.theme;
				const mode = data.event?.mode;
				if (theme && isValidTheme(theme)) {
					themeAttrs += ` data-theme="${theme}"`;
				}
				if (mode && isValidMode(mode)) {
					themeAttrs += ` data-mode="${mode}"`;
				}
				const hue = data.event?.accent_hue ?? null;
				if (hue !== null) {
					accentInlineStyle = computeAccentStyle(hue, (mode as EventMode) || 'dark');
				}
			}
		} catch {
			// Theme fetch failed — SSR falls back to default, client-side $effect will fix
		}
	}

	const response = await resolve(event, {
		transformPageChunk: themeAttrs
			? ({ html }) => {
					let replacement = `<html lang="en" class="dark"${themeAttrs}`;
					if (accentInlineStyle) {
						replacement += ` style="${accentInlineStyle}"`;
					}
					return html.replace('<html lang="en" class="dark"', replacement);
				}
			: undefined
	});

	// Apply security headers to all responses
	for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
		response.headers.set(key, value);
	}

	return response;
};
