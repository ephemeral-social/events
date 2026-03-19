/**
 * Connection store — Svelte 5 runes module for managing encrypted connections.
 *
 * Flow: PIN unlock → restore keys from IDB (or backend) → decrypt entries →
 * merge into compacted store → resolve user profiles → display.
 *
 * All crypto happens client-side. The backend only stores encrypted blobs.
 */

import type { Connection, CompactedStore, CoAttendeePayload } from '$lib/crypto/connections';
import {
	isCryptoAvailable,
	restorePrivateKey,
	decryptEntry,
	encryptStore,
	decryptStore,
	idbGet,
	idbSet,
	idbDelete,
	idbClear
} from '$lib/crypto/connections';

// --- Module-level reactive state ---

let connections = $state<Connection[]>([]);
let unlocked = $state(false);
let loading = $state(false);
let hasKeys = $state(false);
let needsRestore = $state(false);
let error = $state<string | null>(null);
let enabled = $state(true);
let debugInfo = $state<string | null>(null);

// Internal (non-reactive) state
let privateKey: CryptoKey | null = null;
let storeKey: CryptoKey | null = null;
let lockTimer: ReturnType<typeof setTimeout> | null = null;
let compactedData: CompactedStore | null = null;

const LOCK_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

// --- Getters (reactive) ---

export function getConnections(): Connection[] {
	return connections;
}

export function isUnlocked(): boolean {
	return unlocked;
}

export function isLoading(): boolean {
	return loading;
}

export function getHasKeys(): boolean {
	return hasKeys;
}

export function getNeedsRestore(): boolean {
	return needsRestore;
}

export function getError(): string | null {
	return error;
}

export function isEnabled(): boolean {
	return enabled;
}

export function getDebugInfo(): string | null {
	return debugInfo;
}

// --- Lock management ---

function resetLockTimer() {
	if (lockTimer) clearTimeout(lockTimer);
	lockTimer = setTimeout(() => {
		lock();
	}, LOCK_TIMEOUT_MS);
}

export function extendLockTimer() {
	if (unlocked) resetLockTimer();
}

export function lock() {
	if (lockTimer) clearTimeout(lockTimer);
	lockTimer = null;
	privateKey = null;
	storeKey = null;
	compactedData = null;
	connections = [];
	unlocked = false;
	error = null;
}

// --- Initialization check ---

export async function checkLocal(): Promise<void> {
	if (!isCryptoAvailable()) {
		hasKeys = false;
		return;
	}

	try {
		// Check IDB for locally cached keys
		const localPrivateKey = await idbGet<CryptoKey>('privateKey');
		const localStoreKey = await idbGet<CryptoKey>('storeKey');

		if (localPrivateKey && localStoreKey) {
			hasKeys = true;
			needsRestore = false;
			return;
		}

		// No local keys — check backend via settings endpoint (NOT rate-limited)
		const res = await fetch('/api/connections/settings');
		if (res.ok) {
			const data = (await res.json()) as { has_keys?: boolean; connections_enabled?: boolean };
			enabled = data.connections_enabled !== false;
			if (data.has_keys) {
				hasKeys = true;
				needsRestore = true; // IDB evicted, need PIN to restore
				return;
			}
		}

		hasKeys = false;
		needsRestore = false;
	} catch (e) {
		console.error('[connections] checkLocal failed:', e);
		hasKeys = false;
	}
}

// --- Load settings from backend ---

export async function loadSettings(): Promise<void> {
	try {
		const res = await fetch('/api/connections/settings');
		if (res.ok) {
			const data = (await res.json()) as { connections_enabled?: boolean };
			enabled = data.connections_enabled !== false;
		}
	} catch {
		// Default to enabled
	}
}

export async function updateEnabled(value: boolean): Promise<void> {
	const previous = enabled;
	enabled = value;
	try {
		const res = await fetch('/api/connections/settings', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ connections_enabled: value })
		});
		if (!res.ok) {
			enabled = previous;
			error = 'Failed to update settings';
		}
	} catch {
		enabled = previous;
		error = 'Network error updating settings';
	}
}

// --- Unlock with PIN ---

export async function unlockWithPin(pin: string): Promise<boolean> {
	loading = true;
	error = null;
	debugInfo = null;

	try {
		// Check IDB first for cached non-extractable keys
		let restoredPrivateKey = await idbGet<CryptoKey>('privateKey');
		let restoredStoreKey = await idbGet<CryptoKey>('storeKey');

		if (!restoredPrivateKey || !restoredStoreKey) {
			// Need to restore from backend
			const keysRes = await fetch('/api/connections/keys');
			if (!keysRes.ok) throw new Error('Failed to fetch keys');

			const keysData = (await keysRes.json()) as {
				encrypted_private_key?: string;
				pepper?: string;
				pin_salt?: string;
			};

			if (!keysData.encrypted_private_key || !keysData.pepper || !keysData.pin_salt) {
				throw new Error('No keys found on server');
			}

			try {
				const restored = await restorePrivateKey(
					pin,
					keysData.pepper,
					keysData.pin_salt,
					keysData.encrypted_private_key
				);
				restoredPrivateKey = restored.privateKey;
				restoredStoreKey = restored.storeKey;
			} catch {
				error = 'Incorrect PIN';
				loading = false;
				return false;
			}

			// Cache in IDB for faster future unlocks
			await idbSet('privateKey', restoredPrivateKey);
			await idbSet('storeKey', restoredStoreKey);
		}

		privateKey = restoredPrivateKey;
		storeKey = restoredStoreKey;
		needsRestore = false;

		resetLockTimer();

		// Load connections BEFORE setting unlocked (UI re-render was blocking fetches)
		await loadConnections();

		unlocked = true;
		loading = false;
		return true;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Unlock failed';
		loading = false;
		return false;
	}
}

// --- Load and decrypt connections ---

async function loadConnections(): Promise<void> {
	// Set debugInfo immediately so UI always shows something
	debugInfo = 'Loading...';

	if (!privateKey || !storeKey) {
		debugInfo = 'No keys available';
		return;
	}

	const dp: string[] = [];
	const updateDebug = () => { debugInfo = dp.join(' | ') || 'Empty'; };

	try {
		// Step 1: Load compacted store (previously decrypted+compacted data)
		dp.push('S1:store');
		updateDebug();

		try {
			const storeController = new AbortController();
			const storeTimeout = setTimeout(() => storeController.abort(), 8000);
			const storeRes = await fetch('/api/connections/store', { signal: storeController.signal });
			clearTimeout(storeTimeout);

			if (storeRes.ok) {
				const storeData = (await storeRes.json()) as {
					ciphertext?: string;
					iv?: string;
					has_store?: boolean;
				};

				if (storeData.ciphertext && storeData.iv && storeKey) {
					compactedData = await decryptStore(storeData.ciphertext, storeData.iv, storeKey);
					dp.push(`store-ok:${Object.keys(compactedData.connections).length}`);
				} else {
					compactedData = { connections: {}, processed_event_ids: [] };
					dp.push('store-empty');
				}
			} else {
				compactedData = { connections: {}, processed_event_ids: [] };
				dp.push(`store-http:${storeRes.status}`);
			}
		} catch (e) {
			compactedData = { connections: {}, processed_event_ids: [] };
			dp.push(`store-err:${e instanceof Error ? e.name : 'unknown'}`);
		}
		updateDebug();

		// Step 2: Load entries
		dp.push('S2:entries');
		updateDebug();

		let entries: Array<{
			id: string;
			encrypted_payload: string;
			encrypted_aes_key: string;
			aes_iv: string;
		}> = [];

		try {
			const entriesController = new AbortController();
			const entriesTimeout = setTimeout(() => entriesController.abort(), 8000);
			const entriesRes = await fetch('/api/connections/entries', { signal: entriesController.signal });
			clearTimeout(entriesTimeout);
			if (!entriesRes.ok) {
				const errText = await entriesRes.text().catch(() => '');
				dp.push(`entries-http:${entriesRes.status} ${errText.slice(0, 50)}`);
				updateDebug();
				return;
			}

			const entriesData = (await entriesRes.json()) as {
				entries?: typeof entries;
			};
			entries = entriesData.entries || [];
		} catch (e) {
			dp.push(`entries-timeout:${e instanceof Error ? e.name : 'unknown'}`);
			updateDebug();
			return;
		}

		dp.push(`fetched=${entries.length}`);
		updateDebug();

		// Step 3: Decrypt entries
		const processedEntryIds: string[] = [];
		const decryptErrors: string[] = [];

		for (const entry of entries) {
			try {
				const payload: CoAttendeePayload = await decryptEntry(
					entry.encrypted_payload,
					entry.encrypted_aes_key,
					entry.aes_iv,
					privateKey
				);

				const ts = Math.floor(new Date(payload.extracted_at).getTime() / 1000);

				for (const coAttendee of payload.co_attendees) {
					const existing = compactedData.connections[coAttendee.user_id];
					const eventAlreadyCounted = existing?.event_ids.includes(payload.event_id);

					if (existing) {
						if (!eventAlreadyCounted) {
							existing.shared_events += 1;
							existing.event_ids.push(payload.event_id);
						}
						existing.last_shared = Math.max(existing.last_shared, ts);
						existing.first_shared = Math.min(existing.first_shared, ts);
					} else {
						compactedData.connections[coAttendee.user_id] = {
							shared_events: 1,
							first_shared: ts,
							last_shared: ts,
							event_ids: [payload.event_id]
						};
					}
				}

				processedEntryIds.push(entry.id);
			} catch (e) {
				const msg = e instanceof Error ? e.message : String(e);
				decryptErrors.push(msg);
			}
		}

		dp.push(`dec=${processedEntryIds.length}/${entries.length}`);
		if (decryptErrors.length > 0) {
			dp.push(`decErr:${decryptErrors[0].slice(0, 60)}`);
		}
		updateDebug();

		// Step 4: Compact
		if (processedEntryIds.length > 0) {
			compactedData.processed_event_ids = [
				...new Set([...compactedData.processed_event_ids, ...processedEntryIds])
			];
			await compactStore(processedEntryIds);
		}

		// Step 5: Resolve profiles
		const userIds = Object.keys(compactedData.connections);
		dp.push(`users=${userIds.length}`);
		updateDebug();

		if (userIds.length > 0) {
			await resolveProfiles(userIds);
			dp.push(`resolved=${connections.length}`);
		} else {
			connections = [];
			dp.push('no-users');
		}

		updateDebug();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		dp.push(`FATAL:${msg.slice(0, 80)}`);
		error = msg;
		updateDebug();
	}
}

// --- Compact and save store ---

async function compactStore(processedEntryIds: string[]): Promise<void> {
	if (!storeKey || !compactedData) return;

	try {
		const encrypted = await encryptStore(compactedData, storeKey);
		await fetch('/api/connections/compact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ciphertext: encrypted.ciphertext,
				iv: encrypted.iv,
				processed_entry_ids: processedEntryIds
			})
		});
	} catch {
		// Non-critical — compaction will be retried on next unlock
	}
}

// --- Resolve user profiles via batch API ---

async function resolveProfiles(userIds: string[]): Promise<void> {
	if (!compactedData) return;

	try {
		const res = await fetch('/api/users/batch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ user_ids: userIds })
		});

		if (!res.ok) throw new Error('Failed to resolve profiles');

		const data = (await res.json()) as {
			users?: Array<{
				user_id: string;
				display_name: string;
				first_name: string | null;
				last_name: string | null;
				avatar_r2_key: string | null;
			}>;
		};

		const userMap = new Map(
			(data.users || []).map((u) => [u.user_id, u])
		);

		const resolved: Connection[] = [];
		for (const [userId, connData] of Object.entries(compactedData.connections)) {
			const profile = userMap.get(userId);
			if (!profile) continue; // User deleted or blocked

			resolved.push({
				user_id: userId,
				display_name: profile.display_name,
				first_name: profile.first_name,
				last_name: profile.last_name,
				avatar_r2_key: profile.avatar_r2_key,
				shared_events: connData.shared_events,
				first_shared: connData.first_shared,
				last_shared: connData.last_shared,
				event_ids: connData.event_ids
			});
		}

		// Sort by last_shared descending
		resolved.sort((a, b) => b.last_shared - a.last_shared);
		connections = resolved;
	} catch {
		// Build connections without profile data as fallback
		const fallback: Connection[] = Object.entries(compactedData.connections).map(
			([userId, connData]) => ({
				user_id: userId,
				display_name: userId.slice(0, 8),
				first_name: null,
				last_name: null,
				avatar_r2_key: null,
				shared_events: connData.shared_events,
				first_shared: connData.first_shared,
				last_shared: connData.last_shared,
				event_ids: connData.event_ids
			})
		);
		fallback.sort((a, b) => b.last_shared - a.last_shared);
		connections = fallback;
	}
}

// --- Remove a connection (optimistic) ---

export async function removeConnection(userId: string): Promise<void> {
	if (!compactedData || !storeKey) return;

	// Optimistic removal
	const previousConnections = connections;
	const previousCompacted = { ...compactedData };

	connections = connections.filter((c) => c.user_id !== userId);
	delete compactedData.connections[userId];

	try {
		// Re-encrypt and compact
		const encrypted = await encryptStore(compactedData, storeKey);
		const res = await fetch('/api/connections/compact', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				ciphertext: encrypted.ciphertext,
				iv: encrypted.iv,
				processed_entry_ids: compactedData.processed_event_ids
			})
		});

		if (!res.ok) throw new Error('Failed to save');
	} catch {
		// Rollback on failure
		connections = previousConnections;
		compactedData = previousCompacted;
		error = 'Failed to remove connection';
	}
}

// --- Full reset (forgot PIN) ---

export async function fullReset(): Promise<void> {
	try {
		await fetch('/api/connections/reset', { method: 'DELETE' });
	} catch {
		// Continue with local cleanup even if backend fails
	}
	await idbClear();
	lock();
	hasKeys = false;
	needsRestore = false;
}

// --- Reset + re-extract ---

export async function resetAndReextract(): Promise<void> {
	loading = true;
	error = null;
	try {
		const res = await fetch('/api/connections/reset-reextract', { method: 'POST' });
		if (!res.ok) throw new Error('Failed to reset and re-extract');
		await idbClear();
		lock();
		hasKeys = false;
		needsRestore = false;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Reset failed';
	} finally {
		loading = false;
	}
}
