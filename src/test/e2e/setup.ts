import { beforeAll } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

// Note: E2E tests share backend state -- test isolation is via unique phone numbers
const BACKEND_URL = 'http://127.0.0.1:8787';

/**
 * Clear rate limit entries from the local wrangler KV SQLite store.
 * This allows E2E tests to make many auth calls without hitting rate limits.
 */
function clearRateLimits(): void {
	const kvDir = join(
		__dirname,
		'../../../../ephemeral_backend/.wrangler/state/v3/kv/miniflare-KVNamespaceObject'
	);

	if (!existsSync(kvDir)) {
		console.warn('KV directory not found, skipping rate limit clearing');
		return;
	}

	const files = readdirSync(kvDir).filter((f) => f.endsWith('.sqlite'));
	for (const file of files) {
		const dbPath = join(kvDir, file);
		try {
			execSync(`sqlite3 "${dbPath}" "DELETE FROM _mf_entries WHERE key LIKE 'rl:%';"`, {
				stdio: 'pipe'
			});
		} catch {
			// Ignore errors (table might not exist)
		}
	}
}

beforeAll(async () => {
	// Clear rate limits so auth calls don't get 429'd
	clearRateLimits();

	// Health check backend
	try {
		const res = await fetch(`${BACKEND_URL}/health`);
		if (!res.ok) {
			console.warn(
				`Backend health check returned ${res.status}. E2E tests require a local backend running.`
			);
		}
	} catch {
		throw new Error(
			`Cannot reach backend at ${BACKEND_URL}. Start with: cd ../ephemeral_backend && npx wrangler dev`
		);
	}

	// Verify dev mode auth bypass works (code 123456 should be accepted)
	try {
		const sendRes = await fetch(`${BACKEND_URL}/v1/auth/phone/send-code`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				phone_e164: '+15550000001',
				phone_country_code: '1',
				phone_national_number: '5550000001'
			})
		});

		if (!sendRes.ok) {
			console.warn('Dev mode auth may not be enabled. Some E2E tests may fail.');
		}
	} catch {
		console.warn('Could not verify dev mode auth. Backend may not be in development mode.');
	}
});
