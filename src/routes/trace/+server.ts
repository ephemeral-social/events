import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Breach } from './types';

const HIBP_BASE = 'https://haveibeenpwned.com/api/v3';

async function queryHIBP(
	searchTerm: string,
	apiKey: string
): Promise<{ breaches: Breach[]; error?: string; status?: number }> {
	const response = await fetch(
		`${HIBP_BASE}/breachedaccount/${encodeURIComponent(searchTerm)}?truncateResponse=false`,
		{
			headers: {
				'hibp-api-key': apiKey,
				'user-agent': 'EphemeralTrace'
			}
		}
	);

	if (response.status === 404) {
		return { breaches: [] };
	}

	if (response.status === 429) {
		return { breaches: [], error: 'Rate limited. Try again in a moment.', status: 429 };
	}

	if (!response.ok) {
		return { breaches: [], error: 'Service error', status: 502 };
	}

	const data = (await response.json()) as Record<string, unknown>[];

	const breaches = data.map((b) => ({
		name: b.Name as string,
		title: b.Title as string,
		domain: b.Domain as string,
		date: b.BreachDate as string,
		addedDate: b.AddedDate as string,
		count: b.PwnCount as number,
		dataClasses: b.DataClasses as string[],
		description: b.Description as string,
		isVerified: b.IsVerified as boolean,
		isSensitive: b.IsSensitive as boolean,
		logoPath: b.LogoPath as string
	}));

	return { breaches };
}

export const POST: RequestHandler = async ({ request, platform }) => {
	let body: { email?: string; phone?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { email, phone } = body;

	// Require both
	if (!email || typeof email !== 'string' || !email.includes('@')) {
		return json({ error: 'Valid email is required' }, { status: 400 });
	}

	const phoneDigits = (phone || '').replace(/\D/g, '');
	if (!phone || typeof phone !== 'string' || phoneDigits.length < 10 || phoneDigits.length > 14) {
		return json({ error: 'Valid phone number is required' }, { status: 400 });
	}

	// HIBP enforces its own rate limit (10 RPM). No additional limiting needed.

	// Normalize
	const emailTerm = email.trim().toLowerCase();
	let phoneTerm = phone.replace(/[\s\-\(\)\+]/g, '');
	if (phoneTerm.length === 10) {
		phoneTerm = '1' + phoneTerm;
	}

	// Get API key
	const { env } = await import('$env/dynamic/private');
	const apiKey = platform?.env?.HIBP_API_KEY || env.HIBP_API_KEY;
	if (!apiKey) {
		console.error('HIBP_API_KEY not configured');
		return json({ error: 'Service unavailable' }, { status: 503 });
	}

	try {
		// Query sequentially — HIBP rate limit is 10 RPM (one every ~6s)
		const emailResult = await queryHIBP(emailTerm, apiKey);

		// If email itself was rate-limited, bail entirely
		if (emailResult.status === 429) {
			return json({ error: 'Rate limited. Try again in a moment.' }, { status: 429 });
		}

		// Wait 6.5s between requests to respect HIBP's 10 RPM limit
		await new Promise((r) => setTimeout(r, 6500));
		const phoneResult = await queryHIBP(phoneTerm, apiKey);

		// If phone was rate-limited, still return email results (partial success)
		const phoneBreaches = phoneResult.status === 429 ? [] : phoneResult.breaches;

		// Deduplicate by breach name (same breach may appear in both)
		const seen = new Set<string>();
		const combined: Breach[] = [];

		for (const breach of [...emailResult.breaches, ...phoneBreaches]) {
			if (!seen.has(breach.name)) {
				seen.add(breach.name);
				combined.push(breach);
			}
		}

		// Sort by date descending (most recent first)
		combined.sort((a, b) => b.date.localeCompare(a.date));

		return json({
			breaches: combined,
			count: combined.length,
			emailBreaches: emailResult.breaches.length,
			phoneBreaches: phoneBreaches.length
		});
	} catch (err) {
		console.error('HIBP fetch error:', err);
		return json({ error: 'Network error' }, { status: 502 });
	}
};
