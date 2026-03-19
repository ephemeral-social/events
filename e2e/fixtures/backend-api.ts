import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BACKEND_URL, DEV_CODE } from './test-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Clear rate limit entries from local wrangler KV SQLite.
 * Called before auth calls to prevent 429 during test runs.
 */
export function clearRateLimits(): void {
	const kvDir = join(
		__dirname,
		'../../../ephemeral_backend/.wrangler/state/v3/kv/miniflare-KVNamespaceObject'
	);

	if (!existsSync(kvDir)) return;

	const files = readdirSync(kvDir).filter((f) => f.endsWith('.sqlite'));
	for (const file of files) {
		const dbPath = join(kvDir, file);
		try {
			execSync(`sqlite3 "${dbPath}" "DELETE FROM _mf_entries WHERE key LIKE 'rl:%';"`, {
				stdio: 'pipe'
			});
		} catch {
			// Ignore errors
		}
	}
}

/**
 * Authenticate a test user via the backend directly.
 * Uses dev mode bypass (code 123456).
 */
export async function authenticateViaBackend(phone: string): Promise<{
	accessToken: string;
	refreshToken: string;
	userId: string;
	displayName?: string;
}> {
	clearRateLimits();

	const nationalNumber = phone.startsWith('+1') ? phone.slice(2) : phone;

	const sendRes = await fetch(`${BACKEND_URL}/v1/auth/phone/send-code`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			phone_e164: phone,
			phone_country_code: '1',
			phone_national_number: nationalNumber
		})
	});

	if (!sendRes.ok) {
		const err = await sendRes.text();
		throw new Error(`Failed to send code: ${sendRes.status} ${err}`);
	}

	const sendData = (await sendRes.json()) as { verification_id: string };

	const verifyRes = await fetch(`${BACKEND_URL}/v1/auth/phone/verify-code`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			verification_id: sendData.verification_id,
			code: DEV_CODE
		})
	});

	if (!verifyRes.ok) {
		const err = await verifyRes.text();
		throw new Error(`Failed to verify code: ${verifyRes.status} ${err}`);
	}

	const verifyData = (await verifyRes.json()) as {
		access_token: string;
		refresh_token: string;
		user: { user_id: string; display_name?: string };
	};

	return {
		accessToken: verifyData.access_token,
		refreshToken: verifyData.refresh_token,
		userId: verifyData.user.user_id,
		displayName: verifyData.user.display_name
	};
}

/**
 * Create an event via the backend API.
 */
export async function createEventViaBackend(
	token: string,
	eventData: {
		title: string;
		description?: string;
		start_time: string;
		end_time?: string;
		timezone?: string;
		slug?: string;
		visibility?: string;
		max_attendees?: number;
		show_guest_list?: boolean;
		location_hidden?: boolean;
		web_event_type?: string;
		ticket_price_cents?: number;
		venue_name?: string;
		venue_address?: string;
	}
): Promise<{ event_id: string; slug: string; [key: string]: unknown }> {
	const res = await fetch(`${BACKEND_URL}/v1/events`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify({
			visibility: 'public',
			timezone: 'America/New_York',
			...eventData
		})
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Failed to create event: ${res.status} ${err}`);
	}

	const data = (await res.json()) as { event: { event_id: string; slug: string; [key: string]: unknown } };
	return data.event;
}

/**
 * RSVP to an event via the backend API.
 */
export async function rsvpViaBackend(
	token: string,
	eventId: string,
	data: {
		status: string;
		display_name: string;
		plus_ones?: number;
	}
): Promise<void> {
	const res = await fetch(`${BACKEND_URL}/v1/events/${eventId}/web-rsvp`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Failed to RSVP: ${res.status} ${err}`);
	}
}

/**
 * Add a cost item to an event via the backend API.
 */
export async function addCostViaBackend(
	token: string,
	eventId: string,
	data: {
		description: string;
		amount_cents: number;
	}
): Promise<void> {
	const res = await fetch(`${BACKEND_URL}/v1/events/${eventId}/costs`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Failed to add cost: ${res.status} ${err}`);
	}
}

/**
 * Generate a cohost invite token via the backend API.
 */
export async function createCohostInviteViaBackend(
	token: string,
	eventId: string
): Promise<{ invite_token: string }> {
	const res = await fetch(`${BACKEND_URL}/v1/events/${eventId}/cohosts/invite`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		}
	});

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`Failed to create cohost invite: ${res.status} ${err}`);
	}

	return (await res.json()) as { invite_token: string };
}

/**
 * Backend health check.
 */
export async function backendHealthCheck(): Promise<boolean> {
	try {
		const res = await fetch(`${BACKEND_URL}/health`);
		return res.ok;
	} catch {
		return false;
	}
}
