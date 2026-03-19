# Spec 11 — Event Connections (Claude Code Implementation Guide)

**Stack:** SvelteKit + Cloudflare (Pages, Workers, D1, KV, Queues)
**UI:** shadcn-svelte, Tailwind CSS v4 (dark-mode only), Vollkorn + Manrope, Phosphor icons
**Auth:** Phone verification via Twilio (session cookies in KV)

---

## Overview

Build an end-to-end encrypted connection tracking system. When users attend events together, we store an encrypted record of that co-attendance. Only the user can decrypt their connections via a 4-digit PIN (with biometric enhancement when available). The server never holds decryption keys.

The feature has four surfaces:
1. **Onboarding** — PIN setup after phone verification
2. **Event creation** — suggested invites from past co-attendees
3. **Settings page** — connection management with D3 force graph visualization
4. **Background job** — connection extraction during event TTL cleanup

---

## Phase 1: Database Migration

Create a new migration file. All tables go in one migration.

### File: `migrations/0002_connections.sql`

```sql
-- Connection encryption keys (one row per user)
CREATE TABLE user_connection_keys (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    public_key_jwk TEXT NOT NULL,
    encrypted_private_key TEXT NOT NULL,
    pin_salt TEXT NOT NULL,
    pepper TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Append-only encrypted entries (server writes, client reads + decrypts)
CREATE TABLE connection_entries (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    encrypted_payload TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX idx_conn_entries_user ON connection_entries(user_id, created_at);

-- Compacted encrypted store (client writes after merging entries)
CREATE TABLE connection_store (
    user_id TEXT PRIMARY KEY,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
);

-- Feature toggle per user
CREATE TABLE connection_settings (
    user_id TEXT PRIMARY KEY,
    connections_enabled INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
);

-- Audit log (no connection content, just action types)
CREATE TABLE connection_audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entry_count INTEGER,
    created_at INTEGER NOT NULL
);
CREATE INDEX idx_conn_audit_user ON connection_audit_log(user_id, created_at);
```

Run: `wrangler d1 migrations apply ephemeral-db`

### Wrangler Bindings

Add to `wrangler.toml` if not present:
```toml
[[d1_databases]]
binding = "DB"
database_name = "ephemeral-db"
database_id = "your-db-id"

[vars]
# No connection secrets in vars — use wrangler secret

# Cron trigger (add to existing crons)
[triggers]
crons = ["0 3 * * *"]
```

---

## Phase 2: Crypto Library (Client-Side)

### File: `src/lib/crypto/connections.ts`

This is the core cryptographic module. All encryption/decryption runs in the browser. The server NEVER sees plaintext connection data or the user's PIN.

```typescript
/**
 * Connection encryption utilities.
 * All operations use Web Crypto API (available in all modern browsers).
 * Private keys stored in IndexedDB as non-exportable CryptoKey objects.
 */

// ── Key Derivation ──

export async function derivePinKey(
    pin: string,
    pepper: Uint8Array,
    salt: Uint8Array
): Promise<CryptoKey> {
    const combined = new Uint8Array([
        ...new TextEncoder().encode(pin),
        ...pepper
    ]);
    const baseKey = await crypto.subtle.importKey(
        'raw', combined, 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

// ── Key Generation (called once during PIN setup) ──

export async function generateConnectionKeys(pin: string, pepper: Uint8Array, salt: Uint8Array) {
    const pinKey = await derivePinKey(pin, pepper, salt);

    // Generate RSA keypair for asymmetric encryption
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

    // Export public key (safe to store on server)
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

    // Export + encrypt private key with PIN-derived key
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const privateKeyBytes = new TextEncoder().encode(JSON.stringify(privateKeyJwk));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedPrivateKey = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        pinKey,
        privateKeyBytes
    );

    // Re-import private key as NON-exportable for local storage
    const localPrivateKey = await crypto.subtle.importKey(
        'jwk',
        privateKeyJwk,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false, // NON-exportable — JS cannot read this back
        ['decrypt']
    );

    // Also derive a symmetric key for compacted store encryption
    // (separate from PIN key — derived from private key material)
    const symKeyMaterial = new TextEncoder().encode(JSON.stringify(privateKeyJwk).slice(0, 32));
    const symKey = await crypto.subtle.importKey(
        'raw',
        await crypto.subtle.digest('SHA-256', symKeyMaterial),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );

    return {
        publicKeyJwk,
        encryptedPrivateKeyBlob: JSON.stringify({
            iv: bytesToBase64(iv),
            data: bytesToBase64(new Uint8Array(encryptedPrivateKey))
        }),
        localPrivateKey,  // CryptoKey, non-exportable — store in IndexedDB
        localPublicKey: keyPair.publicKey,
        localSymKey: symKey  // For encrypting compacted store
    };
}

// ── Restore keys on new device ──

export async function restorePrivateKey(
    pin: string,
    pepper: Uint8Array,
    salt: Uint8Array,
    encryptedBlob: string
): Promise<{ privateKey: CryptoKey; symKey: CryptoKey } | null> {
    try {
        const pinKey = await derivePinKey(pin, pepper, salt);
        const blob = JSON.parse(encryptedBlob);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: base64ToBytes(blob.iv) },
            pinKey,
            base64ToBytes(blob.data)
        );

        const privateKeyJwk = JSON.parse(new TextDecoder().decode(decrypted));

        const privateKey = await crypto.subtle.importKey(
            'jwk', privateKeyJwk,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false,
            ['decrypt']
        );

        const symKeyMaterial = new TextEncoder().encode(JSON.stringify(privateKeyJwk).slice(0, 32));
        const symKey = await crypto.subtle.importKey(
            'raw',
            await crypto.subtle.digest('SHA-256', symKeyMaterial),
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );

        return { privateKey, symKey };
    } catch {
        return null; // Wrong PIN
    }
}

// ── Decrypt individual entry (RSA-OAEP) ──

export async function decryptEntry(
    encryptedPayload: string,
    privateKey: CryptoKey
): Promise<any[]> {
    const ciphertext = base64ToBytes(encryptedPayload);
    const plaintext = await crypto.subtle.decrypt(
        { name: 'RSA-OAEP' },
        privateKey,
        ciphertext
    );
    return JSON.parse(new TextDecoder().decode(plaintext));
}

// ── Encrypt/decrypt compacted store (AES-GCM) ──

export async function encryptStore(
    data: any,
    symKey: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
    const plaintext = new TextEncoder().encode(JSON.stringify(data));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        symKey,
        plaintext
    );
    return {
        ciphertext: bytesToBase64(new Uint8Array(encrypted)),
        iv: bytesToBase64(iv)
    };
}

export async function decryptStore(
    ciphertext: string,
    iv: string,
    symKey: CryptoKey
): Promise<any> {
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(iv) },
        symKey,
        base64ToBytes(ciphertext)
    );
    return JSON.parse(new TextDecoder().decode(decrypted));
}

// ── Biometric detection ──

export async function checkBiometrics(): Promise<{
    available: boolean;
    type: 'face' | 'fingerprint' | 'platform' | null;
}> {
    if (!window.PublicKeyCredential) return { available: false, type: null };
    const ok = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!ok) return { available: false, type: null };

    const ua = navigator.userAgent;
    let type: 'face' | 'fingerprint' | 'platform' = 'platform';
    if (/iPhone/.test(ua)) {
        type = window.screen.height >= 812 ? 'face' : 'fingerprint';
    } else if (/iPad|Macintosh/.test(ua)) {
        type = 'fingerprint';
    } else if (/Android/.test(ua)) {
        type = 'fingerprint';
    }
    return { available: true, type };
}

export function biometricLabel(type: string | null): string {
    switch (type) {
        case 'face': return 'Face ID';
        case 'fingerprint': return 'fingerprint';
        case 'platform': return 'biometrics';
        default: return '';
    }
}

// ── WebAuthn registration & assertion ──

export async function registerBiometric(userId: string): Promise<boolean> {
    try {
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                rp: { name: 'Ephemeral', id: window.location.hostname },
                user: {
                    id: new TextEncoder().encode(userId),
                    name: `ephemeral-${userId}`,
                    displayName: 'Ephemeral Connections'
                },
                pubKeyCredParams: [
                    { alg: -7, type: 'public-key' },
                    { alg: -257, type: 'public-key' }
                ],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                    residentKey: 'preferred'
                },
                timeout: 60000
            }
        });
        if (credential) {
            await idbSet('ephemeral-webauthn', {
                credentialId: (credential as PublicKeyCredential).id,
                rawId: new Uint8Array((credential as PublicKeyCredential).rawId)
            });
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

export async function assertBiometric(): Promise<boolean> {
    try {
        const stored = await idbGet('ephemeral-webauthn');
        if (!stored) return false;
        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                allowCredentials: [{
                    id: stored.rawId,
                    type: 'public-key',
                    transports: ['internal']
                }],
                userVerification: 'required',
                timeout: 60000
            }
        });
        return !!assertion;
    } catch {
        return false;
    }
}

// ── IndexedDB helpers ──

const DB_NAME = 'ephemeral-connections';
const STORE_NAME = 'keys';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            req.result.createObjectStore(STORE_NAME);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function idbSet(key: string, value: any): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function idbGet(key: string): Promise<any> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
    });
}

export async function idbDelete(key: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function idbClear(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ── Base64 helpers ──

export function bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
}

export function base64ToBytes(b64: string): Uint8Array {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
```

---

## Phase 3: Server API Routes

All routes use SvelteKit server endpoints (`+server.ts`). Auth is validated via session cookie in KV.

### File: `src/routes/api/connections/keys/init/+server.ts`

Generates pepper + salt. Called once during PIN setup.

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, platform }) => {
    const userId = locals.user?.id;
    if (!userId) throw error(401);

    const env = platform!.env;

    // Check if keys already exist
    const existing = await env.DB.prepare(
        'SELECT user_id FROM user_connection_keys WHERE user_id = ?'
    ).bind(userId).first();
    if (existing) throw error(409, 'Keys already configured');

    // Generate pepper (32 bytes) and salt (16 bytes)
    const pepper = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(16));

    const pepperB64 = btoa(String.fromCharCode(...pepper));
    const saltB64 = btoa(String.fromCharCode(...salt));

    // Store pepper + salt (private key comes in the next request)
    // Use KV as temp storage until key setup completes
    await env.KV.put(
        `conn-init:${userId}`,
        JSON.stringify({ pepper: pepperB64, salt: saltB64 }),
        { expirationTtl: 300 } // 5 min TTL
    );

    return json({ pepper: pepperB64, salt: saltB64 });
};
```

### File: `src/routes/api/connections/keys/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Store public key + encrypted private key (completes PIN setup)
export const POST: RequestHandler = async ({ request, locals, platform }) => {
    const userId = locals.user?.id;
    if (!userId) throw error(401);

    const env = platform!.env;
    const { public_key_jwk, encrypted_private_key } = await request.json();

    if (!public_key_jwk || !encrypted_private_key) throw error(400);

    // Retrieve pepper + salt from temp KV storage
    const initData = await env.KV.get(`conn-init:${userId}`, 'json') as any;
    if (!initData) throw error(410, 'Init expired, call /keys/init again');

    await env.DB.prepare(`
        INSERT INTO user_connection_keys
        (user_id, public_key_jwk, encrypted_private_key, pin_salt, pepper, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
        userId,
        JSON.stringify(public_key_jwk),
        encrypted_private_key,
        initData.salt,
        initData.pepper,
        Math.floor(Date.now() / 1000)
    ).run();

    // Clean up temp KV
    await env.KV.delete(`conn-init:${userId}`);

    // Enable connections by default
    await env.DB.prepare(`
        INSERT INTO connection_settings (user_id, connections_enabled, updated_at)
        VALUES (?, 1, ?)
        ON CONFLICT (user_id) DO UPDATE SET connections_enabled = 1, updated_at = ?
    `).bind(userId, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)).run();

    // Audit
    await env.DB.prepare(`
        INSERT INTO connection_audit_log (id, user_id, action, created_at)
        VALUES (?, ?, 'keys_created', ?)
    `).bind(crypto.randomUUID(), userId, Math.floor(Date.now() / 1000)).run();

    return json({ success: true }, { status: 201 });
};

// Retrieve encrypted backup + pepper for restore
export const GET: RequestHandler = async ({ locals, platform }) => {
    const userId = locals.user?.id;
    if (!userId) throw error(401);

    const env = platform!.env;

    // Rate limit: 5/hour on this endpoint (pepper = brute force vector)
    const rateLimitKey = `conn-keys-rate:${userId}`;
    const count = parseInt(await env.KV.get(rateLimitKey) || '0');
    if (count >= 5) throw error(429, 'Too many attempts. Try again later.');
    await env.KV.put(rateLimitKey, String(count + 1), { expirationTtl: 3600 });

    const row = await env.DB.prepare(`
        SELECT encrypted_private_key, pin_salt, pepper
        FROM user_connection_keys WHERE user_id = ?
    `).bind(userId).first();

    if (!row) return json({ has_keys: false });

    return json({
        encrypted_private_key: row.encrypted_private_key,
        pin_salt: row.pin_salt,
        pepper: row.pepper,
        has_keys: true
    });
};
```

### File: `src/routes/api/connections/entries/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform }) => {
    const userId = locals.user?.id;
    if (!userId) throw error(401);

    const rows = await platform!.env.DB.prepare(`
        SELECT id, encrypted_payload, created_at
        FROM connection_entries
        WHERE user_id = ?
        ORDER BY created_at ASC
    `).bind(userId).all();

    return json({ entries: rows.results });
};
```

### File: `src/routes/api/connections/store/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform }) => {
    const userId = locals.user?.id;
    if (!userId) throw error(401);

    const row = await platform!.env.DB.prepare(`
        SELECT ciphertext, iv, version, updated_at
        FROM connection_store WHERE user_id = ?
    `).bind(userId).first();

    if (!row) throw error(404);
    return json(row);
};
```

### File: `src/routes/api/connections/compact/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
    const userId = locals.user?.id;
    if (!userId) throw error(401);

    const env = platform!.env;
    const { ciphertext, iv, processed_entry_ids } = await request.json();

    if (!ciphertext || !iv || !Array.isArray(processed_entry_ids)) throw error(400);

    const now = Math.floor(Date.now() / 1000);

    // Atomic: upsert store + delete processed entries
    const statements = [
        env.DB.prepare(`
            INSERT INTO connection_store (user_id, ciphertext, iv, version, updated_at)
            VALUES (?1, ?2, ?3, 1, ?4)
            ON CONFLICT (user_id) DO UPDATE SET
                ciphertext = ?2, iv = ?3, version = version + 1, updated_at = ?4
        `).bind(userId, ciphertext, iv, now),
    ];

    // Delete processed entries in batches
    for (const entryId of processed_entry_ids) {
        statements.push(
            env.DB.prepare('DELETE FROM connection_entries WHERE id = ? AND user_id = ?')
                .bind(entryId, userId)
        );
    }

    // Audit
    statements.push(
        env.DB.prepare(`
            INSERT INTO connection_audit_log (id, user_id, action, entry_count, created_at)
            VALUES (?, ?, 'store_compacted', ?, ?)
        `).bind(crypto.randomUUID(), userId, processed_entry_ids.length, now)
    );

    // D1 batch limit: 100
    for (let i = 0; i < statements.length; i += 100) {
        await env.DB.batch(statements.slice(i, i + 100));
    }

    return json({ success: true });
};
```

### File: `src/routes/api/connections/settings/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform }) => {
    const userId = locals.user?.id;
    if (!userId) throw error(401);

    const env = platform!.env;
    const setting = await env.DB.prepare(
        'SELECT connections_enabled FROM connection_settings WHERE user_id = ?'
    ).bind(userId).first();

    const hasKeys = await env.DB.prepare(
        'SELECT 1 FROM user_connection_keys WHERE user_id = ?'
    ).bind(userId).first();

    return json({
        connections_enabled: setting ? !!setting.connections_enabled : true,
        has_keys: !!hasKeys
    });
};

export const PUT: RequestHandler = async ({ request, locals, platform }) => {
    const userId = locals.user?.id;
    if (!userId) throw error(401);

    const env = platform!.env;
    const { connections_enabled } = await request.json();
    const now = Math.floor(Date.now() / 1000);

    if (!connections_enabled) {
        // Disable: delete ALL encrypted data immediately
        await env.DB.batch([
            env.DB.prepare('DELETE FROM connection_entries WHERE user_id = ?').bind(userId),
            env.DB.prepare('DELETE FROM connection_store WHERE user_id = ?').bind(userId),
            env.DB.prepare('DELETE FROM user_connection_keys WHERE user_id = ?').bind(userId),
            env.DB.prepare(`
                INSERT INTO connection_settings (user_id, connections_enabled, updated_at)
                VALUES (?, 0, ?) ON CONFLICT (user_id) DO UPDATE SET connections_enabled = 0, updated_at = ?
            `).bind(userId, now, now),
            env.DB.prepare(`
                INSERT INTO connection_audit_log (id, user_id, action, created_at)
                VALUES (?, ?, 'feature_disabled', ?)
            `).bind(crypto.randomUUID(), userId, now),
        ]);
    } else {
        await env.DB.prepare(`
            INSERT INTO connection_settings (user_id, connections_enabled, updated_at)
            VALUES (?, 1, ?) ON CONFLICT (user_id) DO UPDATE SET connections_enabled = 1, updated_at = ?
        `).bind(userId, now, now).run();
    }

    return json({ success: true });
};
```

### File: `src/routes/api/connections/reset/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, platform }) => {
    const userId = locals.user?.id;
    if (!userId) throw error(401);

    const env = platform!.env;
    const now = Math.floor(Date.now() / 1000);

    await env.DB.batch([
        env.DB.prepare('DELETE FROM connection_entries WHERE user_id = ?').bind(userId),
        env.DB.prepare('DELETE FROM connection_store WHERE user_id = ?').bind(userId),
        env.DB.prepare('DELETE FROM user_connection_keys WHERE user_id = ?').bind(userId),
        env.DB.prepare(`
            INSERT INTO connection_audit_log (id, user_id, action, created_at)
            VALUES (?, ?, 'pin_reset', ?)
        `).bind(crypto.randomUUID(), userId, now),
    ]);

    return new Response(null, { status: 204 });
};
```

### File: `src/routes/api/users/batch/+server.ts`

```typescript
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
    if (!locals.user?.id) throw error(401);

    const { user_ids } = await request.json();
    if (!Array.isArray(user_ids) || user_ids.length > 100) throw error(400);
    if (user_ids.length === 0) return json({ users: [] });

    const placeholders = user_ids.map(() => '?').join(',');
    const rows = await platform!.env.DB.prepare(`
        SELECT id as user_id, display_name, avatar_url
        FROM users WHERE id IN (${placeholders})
    `).bind(...user_ids).all();

    return json({ users: rows.results });
};
```

---

## Phase 4: Connection Generation (Server Background Job)

### File: `src/lib/server/jobs/connectionExtractor.ts`

Called from the existing TTL cleanup job before event data is deleted.

```typescript
export async function extractConnections(env: Env, eventId: string): Promise<void> {
    // 1. Get host + all "going" RSVPs
    const event = await env.DB.prepare(
        'SELECT host_id FROM events WHERE id = ?'
    ).bind(eventId).first();
    if (!event) return;

    const rsvps = await env.DB.prepare(
        "SELECT user_id FROM event_rsvps WHERE event_id = ? AND status = 'going'"
    ).bind(eventId).all();

    const allIds = [
        event.host_id as string,
        ...rsvps.results.map((r: any) => r.user_id as string)
    ].filter((id, i, arr) => arr.indexOf(id) === i);

    if (allIds.length < 2) return;

    // 2. Filter: opted out or no keys
    const placeholders = allIds.map(() => '?').join(',');

    const optedOut = await env.DB.prepare(`
        SELECT user_id FROM connection_settings
        WHERE user_id IN (${placeholders}) AND connections_enabled = 0
    `).bind(...allIds).all();
    const optedOutSet = new Set(optedOut.results.map((r: any) => r.user_id));

    const keys = await env.DB.prepare(`
        SELECT user_id, public_key_jwk FROM user_connection_keys
        WHERE user_id IN (${placeholders})
    `).bind(...allIds).all();
    const keyMap = new Map<string, any>(
        keys.results.map((r: any) => [r.user_id, JSON.parse(r.public_key_jwk)])
    );

    const eligible = allIds.filter(id => !optedOutSet.has(id) && keyMap.has(id));
    if (eligible.length < 2) return;

    // 3. For each user, encrypt co-attendee list with their public key
    const now = Math.floor(Date.now() / 1000);
    const statements: any[] = [];

    // Large event optimization: skip guest↔guest for 100+ attendees
    const skipGuestPairs = eligible.length > 100;

    for (const userId of eligible) {
        const jwk = keyMap.get(userId)!;
        const publicKey = await crypto.subtle.importKey(
            'jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']
        );

        let coAttendees: string[];
        if (skipGuestPairs && userId !== event.host_id) {
            // Only connect this guest to host + co-hosts
            coAttendees = [event.host_id as string].filter(id => id !== userId && eligible.includes(id));
        } else {
            coAttendees = eligible.filter(id => id !== userId);
        }

        if (coAttendees.length === 0) continue;

        // RSA-OAEP 2048 can encrypt ~190 bytes. Chunk: 2 co-attendees per entry.
        for (let i = 0; i < coAttendees.length; i += 2) {
            const chunk = coAttendees.slice(i, i + 2).map(id => ({
                user_id: id,
                timestamp: now
            }));

            const plaintext = new TextEncoder().encode(JSON.stringify(chunk));
            const ciphertext = await crypto.subtle.encrypt(
                { name: 'RSA-OAEP' }, publicKey, plaintext
            );

            statements.push(
                env.DB.prepare(`
                    INSERT INTO connection_entries (id, user_id, encrypted_payload, created_at)
                    VALUES (?, ?, ?, ?)
                `).bind(
                    crypto.randomUUID(),
                    userId,
                    btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
                    now
                )
            );
        }
    }

    // D1 batch: 100 per call
    for (let i = 0; i < statements.length; i += 100) {
        await env.DB.batch(statements.slice(i, i + 100));
    }

    // Audit
    await env.DB.prepare(`
        INSERT INTO connection_audit_log (id, user_id, action, entry_count, created_at)
        VALUES (?, 'system', 'entries_appended', ?, ?)
    `).bind(crypto.randomUUID(), statements.length, now).run();
}
```

### Integration with TTL Cleanup

In the existing `ttlCleanup.ts` (or `scheduled` handler in your Worker):

```typescript
import { extractConnections } from '$lib/server/jobs/connectionExtractor';

// In the event expiry loop, BEFORE deleting event data:
for (const event of expiredEvents) {
    await extractConnections(env, event.id);
    // ... then delete event data as before
}
```

### Cron: Stale Entry Cleanup + Audit Log Cleanup

Add to the scheduled handler:

```typescript
// Clean connection entries older than 7 months
const sevenMonthsAgo = Math.floor(Date.now() / 1000) - (210 * 86400);
await env.DB.prepare(
    'DELETE FROM connection_entries WHERE created_at < ?'
).bind(sevenMonthsAgo).run();

// Clean audit logs older than 30 days
const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 86400);
await env.DB.prepare(
    'DELETE FROM connection_audit_log WHERE created_at < ?'
).bind(thirtyDaysAgo).run();
```

---

## Phase 5: Svelte Client — Connection Store

### File: `src/lib/stores/connections.ts`

Svelte writable store that manages the full decrypt → merge → compact lifecycle.

```typescript
import { writable, derived } from 'svelte/store';
import {
    decryptEntry, decryptStore, encryptStore,
    idbGet, idbSet, idbDelete, idbClear,
    restorePrivateKey, base64ToBytes, assertBiometric, checkBiometrics
} from '$lib/crypto/connections';

export interface Connection {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    shared_events: number;
    first_shared: number;
    last_shared: number;
}

interface ConnectionState {
    connections: Connection[];
    unlocked: boolean;
    loading: boolean;
    hasKeys: boolean;
    needsRestore: boolean;
    error: string | null;
}

const SIX_MONTHS = 180 * 86400;
const MIN_EVENTS = 2;

function createConnectionStore() {
    const { subscribe, set, update } = writable<ConnectionState>({
        connections: [],
        unlocked: false,
        loading: false,
        hasKeys: false,
        needsRestore: false,
        error: null
    });

    return {
        subscribe,

        // Check if keys exist locally (call on mount)
        async checkLocal() {
            const localKeys = await idbGet('ephemeral-keys');
            const settingsRes = await fetch('/api/connections/settings');
            const settings = await settingsRes.json();

            update(s => ({
                ...s,
                hasKeys: settings.has_keys,
                needsRestore: settings.has_keys && !localKeys
            }));
        },

        // Unlock via biometric
        async unlockBiometric(): Promise<boolean> {
            const ok = await assertBiometric();
            if (!ok) return false;
            return this.loadConnections();
        },

        // Unlock via PIN
        async unlockWithPin(pin: string): Promise<boolean> {
            update(s => ({ ...s, loading: true, error: null }));

            try {
                // Check if we need to restore (no local keys)
                const localKeys = await idbGet('ephemeral-keys');

                if (!localKeys) {
                    // Fetch from server
                    const res = await fetch('/api/connections/keys');
                    if (!res.ok) {
                        update(s => ({ ...s, loading: false, error: 'Too many attempts' }));
                        return false;
                    }
                    const { encrypted_private_key, pin_salt, pepper } = await res.json();
                    const result = await restorePrivateKey(
                        pin,
                        base64ToBytes(pepper),
                        base64ToBytes(pin_salt),
                        encrypted_private_key
                    );
                    if (!result) {
                        update(s => ({ ...s, loading: false, error: 'Wrong PIN' }));
                        return false;
                    }
                    // Store locally
                    await idbSet('ephemeral-keys', {
                        privateKey: result.privateKey,
                        symKey: result.symKey
                    });
                }

                return this.loadConnections();
            } catch (e) {
                update(s => ({ ...s, loading: false, error: 'Unlock failed' }));
                return false;
            }
        },

        // Load, decrypt, merge, resolve names
        async loadConnections(): Promise<boolean> {
            update(s => ({ ...s, loading: true }));

            try {
                const keys = await idbGet('ephemeral-keys');
                if (!keys) {
                    update(s => ({ ...s, loading: false, needsRestore: true }));
                    return false;
                }

                let connections: Connection[] = [];

                // 1. Load compacted store
                const storeRes = await fetch('/api/connections/store');
                if (storeRes.ok) {
                    const store = await storeRes.json();
                    const decrypted = await decryptStore(store.ciphertext, store.iv, keys.symKey);
                    connections = decrypted.connections || [];
                }

                // 2. Load + decrypt new entries
                const entriesRes = await fetch('/api/connections/entries');
                if (entriesRes.ok) {
                    const { entries } = await entriesRes.json();
                    if (entries.length > 0) {
                        for (const entry of entries) {
                            const decrypted = await decryptEntry(entry.encrypted_payload, keys.privateKey);
                            mergeConnections(connections, decrypted);
                        }
                        // Compact
                        const encrypted = await encryptStore(
                            { connections, updated_at: Date.now() },
                            keys.symKey
                        );
                        await fetch('/api/connections/compact', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...encrypted,
                                processed_entry_ids: entries.map((e: any) => e.id)
                            })
                        });
                    }
                }

                // 3. Resolve display names
                if (connections.length > 0) {
                    const userRes = await fetch('/api/users/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_ids: connections.map(c => c.user_id) })
                    });
                    if (userRes.ok) {
                        const { users } = await userRes.json();
                        const map = new Map(users.map((u: any) => [u.user_id, u]));
                        for (const conn of connections) {
                            const u = map.get(conn.user_id);
                            if (u) {
                                conn.display_name = u.display_name;
                                conn.avatar_url = u.avatar_url;
                            }
                        }
                    }
                }

                // 4. Filter: 6-month expiry + 2-event minimum
                const cutoff = Math.floor(Date.now() / 1000) - SIX_MONTHS;
                connections = connections
                    .filter(c => c.last_shared > cutoff && c.shared_events >= MIN_EVENTS)
                    .sort((a, b) => b.shared_events - a.shared_events || b.last_shared - a.last_shared);

                update(s => ({
                    ...s,
                    connections,
                    unlocked: true,
                    loading: false,
                    error: null
                }));
                return true;
            } catch (e) {
                update(s => ({ ...s, loading: false, error: 'Failed to load connections' }));
                return false;
            }
        },

        // Remove a single connection (client re-encrypts)
        async removeConnection(userId: string) {
            update(s => ({
                ...s,
                connections: s.connections.filter(c => c.user_id !== userId)
            }));
            // Re-encrypt and compact
            const keys = await idbGet('ephemeral-keys');
            let current: Connection[] = [];
            update(s => { current = s.connections; return s; });
            const encrypted = await encryptStore({ connections: current, updated_at: Date.now() }, keys.symKey);
            await fetch('/api/connections/compact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...encrypted, processed_entry_ids: [] })
            });
        },

        // Lock (clear in-memory data)
        lock() {
            set({
                connections: [],
                unlocked: false,
                loading: false,
                hasKeys: true,
                needsRestore: false,
                error: null
            });
        }
    };
}

function mergeConnections(existing: Connection[], newEntries: any[]) {
    for (const entry of newEntries) {
        const found = existing.find(c => c.user_id === entry.user_id);
        if (found) {
            found.shared_events += 1;
            found.last_shared = Math.max(found.last_shared, entry.timestamp);
        } else {
            existing.push({
                user_id: entry.user_id,
                display_name: '',
                avatar_url: null,
                shared_events: 1,
                first_shared: entry.timestamp,
                last_shared: entry.timestamp
            });
        }
    }
}

export const connectionStore = createConnectionStore();
```

---

## Phase 6: Svelte Components

### File: `src/lib/components/connections/UnlockGate.svelte`

Wraps any content that requires connection access. Shows biometric/PIN prompt.

```svelte
<script lang="ts">
    import { connectionStore } from '$lib/stores/connections';
    import { checkBiometrics, biometricLabel } from '$lib/crypto/connections';
    import { onMount } from 'svelte';
    import PinInput from './PinInput.svelte';

    let bio: { available: boolean; type: string | null } = { available: false, type: null };
    let showPin = false;
    let restoring = false;

    onMount(async () => {
        await connectionStore.checkLocal();
        bio = await checkBiometrics();
    });

    async function handleBiometric() {
        const ok = await connectionStore.unlockBiometric();
        if (!ok) showPin = true;
    }

    async function handlePin(pin: string) {
        await connectionStore.unlockWithPin(pin);
    }
</script>

{#if $connectionStore.unlocked}
    <slot />
{:else if $connectionStore.loading}
    <div class="flex items-center justify-center min-h-[300px]">
        <div class="animate-pulse text-secondary">Decrypting...</div>
    </div>
{:else if !$connectionStore.hasKeys}
    <!-- No PIN set up yet -->
    <slot name="no-keys" />
{:else if $connectionStore.needsRestore || showPin}
    <!-- PIN entry (new device or biometric failed) -->
    <div class="flex flex-col items-center justify-center px-6 py-12">
        <div class="text-4xl mb-4 opacity-80">🔒</div>
        <h2 class="font-vollkorn text-xl font-semibold mb-2">
            {$connectionStore.needsRestore ? 'Restore your connections' : 'Enter your PIN'}
        </h2>
        <p class="text-sm text-secondary mb-8 text-center max-w-[260px] leading-relaxed">
            {$connectionStore.needsRestore
                ? 'Enter your Connections PIN to decrypt your data on this device.'
                : 'Your social graph is encrypted. Enter your PIN to view.'}
        </p>
        {#if $connectionStore.error}
            <p class="text-sm text-danger mb-4">{$connectionStore.error}</p>
        {/if}
        <PinInput on:complete={e => handlePin(e.detail)} />
        <button class="mt-4 text-sm text-tertiary hover:text-secondary transition-colors"
            on:click={() => { /* Navigate to forgot PIN flow */ }}>
            Forgot PIN?
        </button>
        {#if $connectionStore.needsRestore}
            <p class="mt-6 text-xs text-tertiary text-center">
                💡 Add to Home Screen to keep your connections unlocked.
            </p>
        {/if}
    </div>
{:else}
    <!-- Biometric prompt -->
    <div class="flex flex-col items-center justify-center px-6 py-12">
        <div class="text-4xl mb-4 opacity-80">🔒</div>
        <h2 class="font-vollkorn text-xl font-semibold mb-2">Unlock your connections</h2>
        <p class="text-sm text-secondary mb-8 text-center max-w-[260px] leading-relaxed">
            Your social graph is encrypted. Verify to view suggestions.
        </p>
        {#if bio.available}
            <button
                class="w-full max-w-[280px] py-3 rounded-xl bg-warm text-bg font-bold text-sm"
                on:click={handleBiometric}
            >
                Unlock with {biometricLabel(bio.type)}
            </button>
            <button
                class="mt-3 text-sm text-tertiary hover:text-secondary transition-colors"
                on:click={() => { showPin = true; }}
            >
                Use PIN instead
            </button>
        {:else}
            <PinInput on:complete={e => handlePin(e.detail)} />
        {/if}
    </div>
{/if}
```

### File: `src/lib/components/connections/PinInput.svelte`

```svelte
<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    let pin = '';

    function press(n: number | string) {
        if (n === 'del') {
            pin = pin.slice(0, -1);
        } else if (pin.length < 4) {
            pin += n;
            if (pin.length === 4) {
                setTimeout(() => dispatch('complete', pin), 150);
            }
        }
    }

    const keys = [1,2,3,4,5,6,7,8,9,null,0,'del'] as const;
</script>

<div class="flex gap-3 mb-7">
    {#each [0,1,2,3] as i}
        <div class="w-12 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-200"
            class:border-warm={pin.length > i}
            class:border-tertiary={pin.length <= i}
            class:bg-warm/8={pin.length > i}
            class:bg-surface={pin.length <= i}
            style:color="var(--warm)">
            {pin.length > i ? '•' : ''}
        </div>
    {/each}
</div>
<div class="grid grid-cols-3 gap-2.5">
    {#each keys as k}
        {#if k === null}
            <div></div>
        {:else}
            <button
                class="w-16 h-13 rounded-xl bg-surface text-primary text-xl font-semibold
                       hover:bg-surface-hover transition-colors active:scale-95"
                on:click={() => press(k)}
            >
                {k === 'del' ? '⌫' : k}
            </button>
        {/if}
    {/each}
</div>
```

### File: `src/lib/components/connections/SocialGraph.svelte`

The D3 force-directed graph. D3 owns the SVG, Svelte owns the bottom sheet. They communicate via a callback — never shared reactive state.

```svelte
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as d3 from 'd3';
    import { connectionStore, type Connection } from '$lib/stores/connections';

    export let onSelect: (conn: Connection | null) => void = () => {};

    let svgEl: SVGSVGElement;
    let sim: d3.Simulation<any, any> | null = null;
    let w = 400, h = 500;
    let selectedId: string | null = null;

    const SIX_MONTHS = 180 * 86400;
    const now = Date.now() / 1000;

    function recency(lastShared: number) {
        return Math.max(0, 1 - (now - lastShared) / SIX_MONTHS);
    }

    function buildGraph(connections: Connection[]) {
        if (!svgEl) return;

        const svg = d3.select(svgEl);
        svg.selectAll('*').remove();

        const cx = w / 2, cy = h / 2;
        const maxEv = Math.max(...connections.map(c => c.shared_events), 1);

        // Defs
        const defs = svg.append('defs');
        const glow = defs.append('filter').attr('id', 'glow');
        glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
        glow.append('feMerge').call(m => {
            m.append('feMergeNode').attr('in', 'blur');
            m.append('feMergeNode').attr('in', 'SourceGraphic');
        });
        const cGlow = defs.append('filter').attr('id', 'cGlow');
        cGlow.append('feGaussianBlur').attr('stdDeviation', '8').attr('result', 'blur');
        cGlow.append('feMerge').call(m => {
            m.append('feMergeNode').attr('in', 'blur');
            m.append('feMergeNode').attr('in', 'SourceGraphic');
        });
        const rg = defs.append('radialGradient').attr('id', 'cGrad');
        rg.append('stop').attr('offset', '0%').attr('stop-color', '#E8A87C');
        rg.append('stop').attr('offset', '100%').attr('stop-color', '#C4956A');

        // Orbital rings
        [0.22, 0.42, 0.65, 0.85].forEach(r => {
            svg.append('circle')
                .attr('cx', cx).attr('cy', cy)
                .attr('r', Math.min(w, h) * r * 0.48)
                .attr('fill', 'none')
                .attr('stroke', 'rgba(232,168,124,0.06)')
                .attr('stroke-width', 1)
                .attr('stroke-dasharray', '2,6');
        });

        // Nodes + links
        const center = { id: 'me', x: cx, y: cy, fx: cx, fy: cy };
        const persons = connections.map(c => {
            const rf = recency(c.last_shared);
            const minD = 50, maxD = Math.min(w, h) * 0.43;
            return {
                id: c.user_id, data: c, recency: rf,
                targetDist: minD + (1 - rf) * (maxD - minD),
                radius: 10 + (c.shared_events / maxEv) * 16,
            };
        });
        const nodes = [center, ...persons];
        const links = persons.map(n => ({
            source: 'me', target: n.id, distance: n.targetDist, recency: n.recency,
        }));

        // Links
        const linkLines = svg.append('g').selectAll('line')
            .data(links).join('line')
            .attr('stroke', d => `rgba(232,168,124,${0.08 + d.recency * 0.35})`)
            .attr('stroke-width', d => 0.5 + d.recency * 2);

        // Node groups
        const nodeGs = svg.append('g').selectAll('g')
            .data(persons).join('g')
            .style('cursor', 'pointer')
            .attr('data-uid', d => d.id);

        // Selection ring
        nodeGs.append('circle').attr('class', 'sel-ring')
            .attr('r', d => d.radius + 4)
            .attr('fill', 'none')
            .attr('stroke', '#E8A87C')
            .attr('stroke-width', 2)
            .attr('opacity', 0);

        // Fill
        nodeGs.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', d => {
                const t = d.recency;
                return `rgb(${Math.round(232-(1-t)*125)},${Math.round(168-(1-t)*91)},${Math.round(124-(1-t)*68)})`;
            })
            .attr('opacity', d => 0.35 + d.recency * 0.65)
            .attr('filter', d => d.recency > 0.6 ? 'url(#glow)' : null);

        // Label
        nodeGs.append('text')
            .text(d => d.data.display_name?.split(' ')[0] || '?')
            .attr('text-anchor', 'middle')
            .attr('dy', d => d.radius + 14)
            .attr('fill', d => d.recency > 0.5 ? '#A89B8C' : '#6B6259')
            .attr('font-size', '11px')
            .attr('font-family', 'Manrope, sans-serif')
            .attr('font-weight', '500')
            .style('pointer-events', 'none');

        // Count badge
        nodeGs.append('text')
            .text(d => `${d.data.shared_events}×`)
            .attr('text-anchor', 'middle').attr('dy', '0.35em')
            .attr('fill', '#F5F0EB')
            .attr('font-size', d => d.radius > 18 ? '10px' : '8px')
            .attr('font-family', 'Manrope, sans-serif')
            .attr('font-weight', '700')
            .attr('opacity', d => d.radius > 12 ? 1 : 0)
            .style('pointer-events', 'none');

        // Center
        const cg = svg.append('g');
        cg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 22)
            .attr('fill', 'url(#cGrad)').attr('filter', 'url(#cGlow)').attr('opacity', 0.9);
        cg.append('text').attr('x', cx).attr('y', cy)
            .attr('text-anchor', 'middle').attr('dy', '0.35em')
            .attr('fill', '#0D0D0D').attr('font-size', '11px')
            .attr('font-family', 'Manrope, sans-serif').attr('font-weight', '800').text('You');

        // Click (D3 visuals only, then callback to Svelte)
        nodeGs.on('click', function (event, d) {
            event.stopPropagation();
            const newSel = selectedId === d.data.user_id ? null : d.data.user_id;
            selectedId = newSel;
            svg.selectAll('.sel-ring')
                .transition().duration(200)
                .attr('opacity', function () {
                    return d3.select(this.parentNode).attr('data-uid') === newSel ? 1 : 0;
                });
            onSelect(newSel ? d.data : null);
        });

        svg.on('click', () => {
            selectedId = null;
            svg.selectAll('.sel-ring').transition().duration(200).attr('opacity', 0);
            onSelect(null);
        });

        // Drag
        nodeGs.call(
            d3.drag()
                .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
                .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
                .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
        );

        // Simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id((d: any) => d.id).distance((d: any) => d.distance).strength(0.8))
            .force('charge', d3.forceManyBody().strength(-80))
            .force('collision', d3.forceCollide().radius((d: any) => (d.radius || 20) + 8))
            .force('center', d3.forceCenter(cx, cy).strength(0.01))
            .alphaDecay(0.02)
            .velocityDecay(0.4)
            .on('tick', () => {
                linkLines.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                    .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
                nodeGs.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
            });

        sim = simulation;
    }

    // Remove with animation
    export function animateRemove(userId: string) {
        const svg = d3.select(svgEl);
        svg.selectAll('g g').filter(function() {
            return d3.select(this).attr('data-uid') === userId;
        }).transition().duration(400)
            .style('opacity', 0)
            .attr('transform', (d: any) => `translate(${d.x},${d.y}) scale(0)`);
        svg.selectAll('line').filter((d: any) => d?.target?.id === userId)
            .transition().duration(300).attr('opacity', 0);
    }

    onMount(() => {
        w = Math.min(window.innerWidth, 500);
        h = Math.min(window.innerHeight - 200, 550);
    });

    // Rebuild when connections change (but NOT on selection change)
    $: if (svgEl && $connectionStore.connections.length > 0) {
        buildGraph($connectionStore.connections);
    }

    onDestroy(() => { sim?.stop(); });
</script>

<svg bind:this={svgEl} {w} {h}
    class="block mx-auto touch-none"
    viewBox="0 0 {w} {h}" />
```

### Page: `src/routes/settings/connections/+page.svelte`

```svelte
<script lang="ts">
    import UnlockGate from '$lib/components/connections/UnlockGate.svelte';
    import SocialGraph from '$lib/components/connections/SocialGraph.svelte';
    import { connectionStore, type Connection } from '$lib/stores/connections';
    import { onDestroy } from 'svelte';

    let selected: Connection | null = null;
    let graphRef: SocialGraph;

    function handleSelect(conn: Connection | null) {
        selected = conn;
    }

    async function handleRemove(userId: string) {
        graphRef?.animateRemove(userId);
        setTimeout(() => {
            connectionStore.removeConnection(userId);
            selected = null;
        }, 450);
    }

    const SIX_MONTHS = 180 * 86400;
    const now = Date.now() / 1000;
    function recency(ts: number) { return Math.max(0, 1 - (now - ts) / SIX_MONTHS); }
    function daysAgo(ts: number) { return Math.floor((now - ts) / 86400); }
    function expiresIn(ts: number) {
        const d = Math.floor((SIX_MONTHS - (now - ts)) / 86400);
        return d > 30 ? `${Math.floor(d/30)}mo` : `${d}d`;
    }

    onDestroy(() => connectionStore.lock());
</script>

<svelte:head>
    <title>Connections — Ephemeral</title>
</svelte:head>

<div class="min-h-screen bg-bg text-primary">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4">
        <div class="flex items-center gap-2">
            <a href="/settings" class="text-lg opacity-60">←</a>
            <h1 class="font-vollkorn text-lg font-semibold">Connections</h1>
        </div>
        {#if $connectionStore.unlocked}
            <span class="text-xs text-tertiary bg-surface px-2.5 py-1 rounded-full">
                {$connectionStore.connections.length} people
            </span>
        {/if}
    </div>

    <UnlockGate>
        <!-- Unlocked content -->
        <div class="px-5 pb-2 flex gap-4 text-[11px] text-tertiary">
            <span>● closer = more recent</span>
            <span>● larger = more events</span>
        </div>

        <SocialGraph bind:this={graphRef} onSelect={handleSelect} />

        <!-- Bottom sheet -->
        <div class="fixed bottom-0 left-0 right-0 bg-surface rounded-t-2xl z-20
                    transition-all duration-350 ease-out-expo overflow-hidden"
            class:max-h-0={!selected}
            class:max-h-60={!!selected}
            class:shadow-2xl={!!selected}
            style:padding={selected ? '20px 24px 32px' : '0 24px'}>
            {#if selected}
                <div class="w-9 h-1 bg-tertiary/40 rounded-full mx-auto mb-4" />
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-vollkorn text-xl font-semibold mb-1">{selected.display_name}</h3>
                        <p class="text-sm text-secondary mb-3">
                            {selected.shared_events} shared event{selected.shared_events !== 1 ? 's' : ''}
                            · Last {daysAgo(selected.last_shared)}d ago
                        </p>
                    </div>
                    <span class="text-xs font-semibold text-accent bg-warm/10 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                        Expires in {expiresIn(selected.last_shared)}
                    </span>
                </div>
                <!-- Recency bar -->
                <div class="bg-white/4 rounded h-1.5 mb-4 overflow-hidden">
                    <div class="h-full rounded bg-gradient-to-r from-warmFaint to-warm transition-all duration-400"
                        style:width="{recency(selected.last_shared) * 100}%" />
                </div>
                <div class="flex gap-2.5">
                    <button class="flex-1 py-3 rounded-xl bg-warm text-bg font-bold text-sm">
                        Invite to Event
                    </button>
                    <button
                        on:click={() => selected && handleRemove(selected.user_id)}
                        class="px-4 py-3 rounded-xl border border-danger/30 bg-danger/8
                               text-danger font-semibold text-sm hover:bg-danger/15
                               hover:border-danger/50 transition-all">
                        Remove
                    </button>
                </div>
                <p class="text-[11px] text-tertiary text-center mt-2.5">
                    They won't be notified if you remove them.
                </p>
            {/if}
        </div>

        <!-- E2E badge -->
        <div class="fixed left-1/2 -translate-x-1/2 z-15 bg-surface rounded-full
                    px-3.5 py-1.5 text-[11px] text-tertiary flex items-center gap-1.5
                    border border-white/4 transition-all duration-350 ease-out-expo"
            class:bottom-5={!selected}
            class:bottom-64={!!selected}>
            🔒 End-to-end encrypted · Only you can see this
        </div>

        <!-- No keys slot -->
        <svelte:fragment slot="no-keys">
            <div class="flex flex-col items-center px-6 py-16 text-center">
                <p class="text-sm text-secondary mb-4 max-w-[280px] leading-relaxed">
                    Set up a Connections PIN to start tracking who you've been to events with.
                </p>
                <a href="/settings/connections/setup" class="py-3 px-8 rounded-xl bg-warm text-bg font-bold text-sm">
                    Set Up PIN
                </a>
            </div>
        </svelte:fragment>
    </UnlockGate>
</div>
```

---

## Phase 7: Onboarding PIN Setup

### Page: `src/routes/auth/setup-pin/+page.svelte`

Shown after phone verification during account creation. Also reachable from `/settings/connections/setup`.

```svelte
<script lang="ts">
    import { goto } from '$app/navigation';
    import PinInput from '$lib/components/connections/PinInput.svelte';
    import {
        generateConnectionKeys, idbSet, checkBiometrics,
        biometricLabel, registerBiometric, bytesToBase64, base64ToBytes
    } from '$lib/crypto/connections';

    let step: 'pin' | 'confirm' | 'biometric' | 'done' = 'pin';
    let firstPin = '';
    let error = '';
    let bioInfo: { available: boolean; type: string | null } = { available: false, type: null };

    async function handleFirstPin(pin: string) {
        firstPin = pin;
        step = 'confirm';
    }

    async function handleConfirmPin(pin: string) {
        if (pin !== firstPin) {
            error = "PINs don't match. Try again.";
            step = 'pin';
            firstPin = '';
            return;
        }

        // 1. Get pepper + salt from server
        const initRes = await fetch('/api/connections/keys/init', { method: 'POST' });
        if (!initRes.ok) {
            error = 'Setup failed. Try again.';
            step = 'pin';
            firstPin = '';
            return;
        }
        const { pepper, salt } = await initRes.json();

        // 2. Generate keys
        const result = await generateConnectionKeys(
            pin,
            base64ToBytes(pepper),
            base64ToBytes(salt)
        );

        // 3. Store locally
        await idbSet('ephemeral-keys', {
            privateKey: result.localPrivateKey,
            symKey: result.localSymKey
        });

        // 4. Send public key + encrypted backup to server
        await fetch('/api/connections/keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                public_key_jwk: result.publicKeyJwk,
                encrypted_private_key: result.encryptedPrivateKeyBlob
            })
        });

        // 5. Check biometrics
        bioInfo = await checkBiometrics();
        if (bioInfo.available) {
            step = 'biometric';
        } else {
            step = 'done';
            setTimeout(() => goto('/'), 500);
        }
    }

    async function enableBiometric() {
        await registerBiometric('current-user-id'); // TODO: get real userId
        step = 'done';
        setTimeout(() => goto('/'), 500);
    }

    function skipBiometric() {
        step = 'done';
        setTimeout(() => goto('/'), 500);
    }
</script>

<div class="min-h-screen bg-bg text-primary flex flex-col items-center justify-center px-6">
    {#if step === 'pin'}
        <h2 class="font-vollkorn text-[22px] font-semibold mb-2">Protect your connections</h2>
        <p class="text-sm text-secondary mb-8 text-center max-w-[280px] leading-relaxed">
            When you go to events, we'll remember who was there — encrypted so only you can see. Set a PIN.
        </p>
        {#if error}
            <p class="text-sm text-danger mb-4">{error}</p>
        {/if}
        <PinInput on:complete={e => handleFirstPin(e.detail)} />
        <button class="mt-6 text-sm text-tertiary" on:click={() => goto('/')}>Skip for now</button>
        <div class="mt-10 text-xs text-tertiary space-y-2 text-left max-w-[260px]">
            <p>○ Event details auto-delete after 7 days</p>
            <p>○ Photo metadata stripped on upload</p>
            <p>○ Connections expire after 6 months</p>
        </div>
    {:else if step === 'confirm'}
        <h2 class="font-vollkorn text-[22px] font-semibold mb-2">Confirm your PIN</h2>
        <p class="text-sm text-secondary mb-8">Enter it again to confirm.</p>
        <PinInput on:complete={e => handleConfirmPin(e.detail)} />
    {:else if step === 'biometric'}
        <div class="text-4xl mb-4 opacity-80">🔓</div>
        <h2 class="font-vollkorn text-[22px] font-semibold mb-2">Unlock faster</h2>
        <p class="text-sm text-secondary mb-8 text-center max-w-[280px] leading-relaxed">
            Use {biometricLabel(bioInfo.type)} to unlock your connections without entering your PIN.
        </p>
        <button class="w-full max-w-[280px] py-3 rounded-xl bg-warm text-bg font-bold text-sm mb-3"
            on:click={enableBiometric}>
            Enable {biometricLabel(bioInfo.type)}
        </button>
        <button class="text-sm text-tertiary" on:click={skipBiometric}>Skip</button>
    {:else}
        <div class="text-4xl mb-4">✓</div>
        <h2 class="font-vollkorn text-[22px] font-semibold">You're set</h2>
    {/if}
</div>
```

---

## Phase 8: Invite Flow Integration

### In event creation invite step

Wherever the "Invite People" UI currently lives, wrap it with `<UnlockGate>` and consume the connection store for suggestions:

```svelte
<script>
    import UnlockGate from '$lib/components/connections/UnlockGate.svelte';
    import { connectionStore } from '$lib/stores/connections';

    let invitedIds: Set<string> = new Set();

    function toggleInvite(userId: string) {
        if (invitedIds.has(userId)) invitedIds.delete(userId);
        else invitedIds.add(userId);
        invitedIds = invitedIds; // trigger reactivity
    }
</script>

<UnlockGate>
    {#if $connectionStore.connections.length > 0}
        <h3 class="text-xs font-semibold text-tertiary uppercase tracking-wider mb-3 px-1">
            People you've been to events with
        </h3>
        {#each $connectionStore.connections as conn}
            <button
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                class:bg-warm/8={invitedIds.has(conn.user_id)}
                on:click={() => toggleInvite(conn.user_id)}>
                <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center
                            transition-colors"
                    class:border-warm={invitedIds.has(conn.user_id)}
                    class:bg-warm={invitedIds.has(conn.user_id)}
                    class:border-tertiary={!invitedIds.has(conn.user_id)}>
                    {#if invitedIds.has(conn.user_id)}
                        <span class="text-bg text-xs">✓</span>
                    {/if}
                </div>
                <div class="flex-1 text-left">
                    <span class="text-sm font-medium">{conn.display_name}</span>
                    <span class="text-xs text-tertiary ml-1">{conn.shared_events}×</span>
                </div>
            </button>
        {/each}
    {:else}
        <p class="text-sm text-secondary text-center px-6 py-8">
            Share your event link and we'll remember who you've been to events with next time.
        </p>
    {/if}

    <svelte:fragment slot="no-keys">
        <p class="text-sm text-secondary text-center px-6 py-8">
            Share your event link and we'll remember who you've been to events with next time.
        </p>
    </svelte:fragment>
</UnlockGate>
```

---

## Tailwind Config Additions

Add these custom values to your Tailwind config to support the connection components:

```javascript
// In tailwind.config.js, extend theme:
{
    colors: {
        bg: '#0D0D0D',
        surface: '#1A1A1A',
        'surface-hover': '#252525',
        warm: '#E8A87C',
        warmFaint: '#6B4D38',
        accent: '#D4A574',
        primary: '#F5F0EB',
        secondary: '#A89B8C',
        tertiary: '#6B6259',
        danger: '#C75050',
    },
    fontFamily: {
        vollkorn: ['Vollkorn Variable', 'serif'],
        manrope: ['Manrope Variable', 'sans-serif'],
    }
}
```

---

## NPM Dependencies

```bash
npm install d3 @types/d3
```

D3 is the only new dependency. Web Crypto API and IndexedDB are built into browsers.

---

## Build Order

| Order | What | Est. Time |
|---|---|---|
| 1 | Database migration | 15 min |
| 2 | `src/lib/crypto/connections.ts` | 1 day |
| 3 | All API routes (`src/routes/api/connections/...`) | 1 day |
| 4 | Connection extractor + TTL integration | 0.5 day |
| 5 | Svelte connection store | 0.5 day |
| 6 | `PinInput.svelte` + `UnlockGate.svelte` | 0.5 day |
| 7 | `setup-pin` page + onboarding integration | 0.5 day |
| 8 | `SocialGraph.svelte` (D3) | 1 day |
| 9 | Settings connections page (full assembly) | 0.5 day |
| 10 | Invite flow integration | 0.5 day |
| 11 | Cron jobs (stale entry cleanup, audit cleanup) | 0.5 day |
| 12 | Cross-browser testing (Safari PWA, Chrome, Firefox) | 1.5 days |
| **Total** | | **~8 days** |

---

## Testing Checklist

- [ ] Web Crypto key generation works: Safari 16+, Chrome 90+, Firefox 100+
- [ ] IndexedDB stores non-exportable CryptoKey across page reloads
- [ ] IndexedDB persists on installed PWA (iOS home screen)
- [ ] IndexedDB eviction detected gracefully in Safari browser tab
- [ ] PIN brute force: 5 failed attempts → 429 from `/api/connections/keys`
- [ ] Wrong PIN returns null from `restorePrivateKey` (no crash)
- [ ] Opted-out users excluded from `extractConnections`
- [ ] Users without keys excluded from `extractConnections`
- [ ] Feature disable deletes all 3 tables for that user
- [ ] PIN reset deletes keys + entries + store
- [ ] Compaction correctly merges duplicate user IDs
- [ ] 6-month expiry filters applied client-side
- [ ] 2-event minimum filters applied client-side
- [ ] Event with 50+ attendees generates entries without timeout
- [ ] Event with 100+ attendees only generates host↔guest pairs
- [ ] D3 graph doesn't re-render on node selection (check: no jank)
- [ ] D3 removal animation plays before React state update
- [ ] Bottom sheet transitions smoothly on select/deselect
- [ ] WebAuthn biometric registration succeeds on iOS Safari PWA
- [ ] WebAuthn assertion gates IndexedDB access correctly
- [ ] Biometric label shows "Face ID" on iPhone X+, "fingerprint" on others
- [ ] Audit log captures: keys_created, store_compacted, feature_disabled, pin_reset
- [ ] Stale entry cron deletes entries older than 7 months
- [ ] Audit log cron deletes logs older than 30 days
