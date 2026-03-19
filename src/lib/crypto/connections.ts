/**
 * Client-side crypto module for Connections feature.
 *
 * All functions use the Web Crypto API (crypto.subtle).
 * This is a pure TypeScript module with no Svelte dependencies.
 *
 * Key operations:
 * - PBKDF2 PIN key derivation (600k iterations SHA-256)
 * - RSA-OAEP 2048 key pair generation
 * - AES-GCM encryption/decryption for private key storage
 * - HKDF-derived symmetric key for compacted store encryption
 * - Hybrid decryption (RSA-OAEP unwrap + AES-GCM decrypt) for entries
 * - IndexedDB persistence for keys
 */

// --- Types ---

export interface CoAttendeePayload {
	event_id: string;
	extracted_at: string; // ISO 8601
	co_attendees: Array<{ user_id: string; display_name?: string | null }>;
}

export interface Connection {
	user_id: string;
	display_name: string;
	first_name: string | null;
	last_name: string | null;
	avatar_r2_key: string | null;
	shared_events: number;
	first_shared: number; // unix seconds
	last_shared: number; // unix seconds
	event_ids: string[];
}

export interface CompactedStore {
	connections: Record<
		string,
		{
			shared_events: number;
			first_shared: number;
			last_shared: number;
			event_ids: string[];
		}
	>;
	processed_event_ids: string[];
}

// --- Base64 helpers (chunked to avoid stack overflow on large payloads) ---

export function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize);
		binary += String.fromCharCode(...chunk);
	}
	return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
	const raw = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
	// Ensure the returned buffer is an ArrayBuffer (not SharedArrayBuffer)
	// for compatibility with Web Crypto API's BufferSource requirements
	return new Uint8Array(raw.buffer.slice(0)) as Uint8Array<ArrayBuffer>;
}

// --- PBKDF2 PIN key derivation ---

export async function derivePinKey(pin: string, pepper: string, salt: string): Promise<CryptoKey> {
	const combined = new TextEncoder().encode(pin + pepper);
	const keyMaterial = await crypto.subtle.importKey('raw', combined, 'PBKDF2', false, [
		'deriveKey'
	]);
	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			hash: 'SHA-256',
			salt: base64ToBytes(salt),
			iterations: 600000
		},
		keyMaterial,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

// --- HKDF symmetric key from private key (for encrypting compacted store) ---

export async function deriveStoreKey(privateKeyJwk: JsonWebKey): Promise<CryptoKey> {
	const keyMaterial = new TextEncoder().encode(privateKeyJwk.d);
	const hkdfKey = await crypto.subtle.importKey('raw', keyMaterial, 'HKDF', false, ['deriveKey']);
	return crypto.subtle.deriveKey(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: new TextEncoder().encode('ephemeral-connections-store'),
			info: new TextEncoder().encode('aes-256-gcm')
		},
		hkdfKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

// --- RSA-OAEP key pair generation + PIN encryption ---

export async function generateConnectionKeys(pin: string, pepper: string, salt: string) {
	const pinKey = await derivePinKey(pin, pepper, salt);
	const keyPair = await crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: 'SHA-256'
		},
		true, // extractable for export
		['encrypt', 'decrypt']
	);

	// Export keys to JWK format
	const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
	const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

	// Encrypt private key with PIN-derived AES key
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encoded = new TextEncoder().encode(JSON.stringify(privateKeyJwk));
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, pinKey, encoded);

	// Derive store key from private key (for compacted store encryption)
	const storeKey = await deriveStoreKey(privateKeyJwk);

	return {
		publicKeyJwk,
		encryptedPrivateKey: bytesToBase64(new Uint8Array(ciphertext)) + ':' + bytesToBase64(iv),
		privateKey: await crypto.subtle.importKey(
			'jwk',
			privateKeyJwk,
			{ name: 'RSA-OAEP', hash: 'SHA-256' },
			false,
			['decrypt']
		),
		storeKey
	};
}

// --- Restore private key from encrypted blob using PIN ---

export async function restorePrivateKey(
	pin: string,
	pepper: string,
	salt: string,
	encryptedBlob: string
) {
	const pinKey = await derivePinKey(pin, pepper, salt);
	const [ciphertextB64, ivB64] = encryptedBlob.split(':');
	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: base64ToBytes(ivB64) },
		pinKey,
		base64ToBytes(ciphertextB64)
	);
	const privateKeyJwk: JsonWebKey = JSON.parse(new TextDecoder().decode(plaintext));
	const privateKey = await crypto.subtle.importKey(
		'jwk',
		privateKeyJwk,
		{ name: 'RSA-OAEP', hash: 'SHA-256' },
		false,
		['decrypt']
	);
	const storeKey = await deriveStoreKey(privateKeyJwk);
	return { privateKey, storeKey, privateKeyJwk };
}

// --- Hybrid decryption for connection entries ---

export async function decryptEntry(
	encryptedPayload: string,
	encryptedAesKey: string,
	aesIv: string,
	privateKey: CryptoKey
): Promise<CoAttendeePayload> {
	// Unwrap the per-entry AES key with RSA-OAEP private key
	const rawAesKey = await crypto.subtle.decrypt(
		{ name: 'RSA-OAEP' },
		privateKey,
		base64ToBytes(encryptedAesKey)
	);
	// Import the unwrapped AES key
	const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, [
		'decrypt'
	]);
	// Decrypt the payload
	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: base64ToBytes(aesIv) },
		aesKey,
		base64ToBytes(encryptedPayload)
	);
	return JSON.parse(new TextDecoder().decode(plaintext));
}

// --- AES-GCM encrypt/decrypt for compacted store ---

export async function encryptStore(
	data: unknown,
	symKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ciphertext = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv },
		symKey,
		new TextEncoder().encode(JSON.stringify(data))
	);
	return {
		ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
		iv: bytesToBase64(iv)
	};
}

export async function decryptStore<T = unknown>(
	ciphertext: string,
	iv: string,
	symKey: CryptoKey
): Promise<T> {
	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: base64ToBytes(iv) },
		symKey,
		base64ToBytes(ciphertext)
	);
	return JSON.parse(new TextDecoder().decode(plaintext));
}

// --- Web Crypto availability check ---

export function isCryptoAvailable(): boolean {
	return typeof window !== 'undefined' && typeof window.crypto?.subtle !== 'undefined';
}

// --- IndexedDB helpers for key persistence ---

const DB_NAME = 'ephemeral-connections';
const STORE_NAME = 'keys';

function openIDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function idbSet(key: string, value: unknown): Promise<void> {
	const db = await openIDB();
	const tx = db.transaction(STORE_NAME, 'readwrite');
	tx.objectStore(STORE_NAME).put(value, key);
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
	const db = await openIDB();
	const tx = db.transaction(STORE_NAME, 'readonly');
	const req = tx.objectStore(STORE_NAME).get(key);
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function idbDelete(key: string): Promise<void> {
	const db = await openIDB();
	const tx = db.transaction(STORE_NAME, 'readwrite');
	tx.objectStore(STORE_NAME).delete(key);
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

export async function idbClear(): Promise<void> {
	const db = await openIDB();
	const tx = db.transaction(STORE_NAME, 'readwrite');
	tx.objectStore(STORE_NAME).clear();
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
