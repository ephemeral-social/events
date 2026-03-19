interface Env {
	SHORT_LINKS: KVNamespace;
	FALLBACK_URL: string;
	CANONICAL_ORIGIN: string;
}

const VALID_CODE_PATTERN = /^[A-Za-z0-9_-]{6}$/;
const ALLOWED_PREFIXES = new Set(['e']);

const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Strict-Transport-Security': 'max-age=31536000',
	'Referrer-Policy': 'strict-origin-when-cross-origin'
};

/** Well-known paths that should not be treated as short codes */
const EXCLUDED_PATHS = new Set(['/.well-known/', '/robots.txt', '/favicon.ico', '/sitemap.xml']);

/** Known old origins that should be rewritten to canonical */
const LEGACY_ORIGINS = [
	'https://ephemeral-events.pages.dev',
	'https://ephemeral-events-web.pages.dev',
	'https://ephemeral-landing.pages.dev'
];

function redirect(url: string, status: 301 | 302 = 302): Response {
	return new Response(null, {
		status,
		headers: {
			Location: url,
			'Cache-Control': status === 301 ? 'public, max-age=300' : 'no-cache',
			...SECURITY_HEADERS
		}
	});
}

/**
 * Rewrite destination URL to use canonical origin if it was stored
 * with an old/legacy origin.
 */
function canonicalize(destination: string, canonicalOrigin: string): string {
	if (!canonicalOrigin) return destination;
	try {
		const url = new URL(destination);
		for (const legacy of LEGACY_ORIGINS) {
			const legacyUrl = new URL(legacy);
			if (url.origin === legacyUrl.origin) {
				return `${canonicalOrigin}${url.pathname}${url.search}${url.hash}`;
			}
		}
	} catch {
		// Invalid URL — return as-is
	}
	return destination;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// Root path — redirect to main site
		if (path === '/' || path === '') {
			return redirect(env.FALLBACK_URL);
		}

		// Excluded paths — return 404, not redirect
		if (EXCLUDED_PATHS.has(path) || path.startsWith('/.well-known/')) {
			return new Response('Not found', { status: 404, headers: SECURITY_HEADERS });
		}

		// Parse namespaced path: /{prefix}/{code}
		const match = path.match(/^\/([a-z])\/([A-Za-z0-9_-]{6})$/);
		if (!match) {
			return redirect(env.FALLBACK_URL);
		}

		const [, prefix, code] = match;

		// Validate prefix is in allowed set
		if (!ALLOWED_PREFIXES.has(prefix)) {
			return redirect(env.FALLBACK_URL);
		}

		// Look up the namespaced key in KV
		const destination = await env.SHORT_LINKS.get(`${prefix}:${code}`);

		if (destination) {
			// Rewrite legacy origins to canonical domain
			const finalUrl = canonicalize(destination, env.CANONICAL_ORIGIN);
			return redirect(finalUrl, 301);
		}

		// Code not found — temporary redirect to fallback
		return redirect(env.FALLBACK_URL);
	}
};
