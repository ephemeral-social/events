# 07 — URL Structure, Short Links & QR Codes

## URL Scheme

### Canonical URLs (ephemeralsocial.com)

All event pages live on the main domain to consolidate SEO authority:

```
ephemeralsocial.com/e/{slug}
```

**Slug format:** Human-readable, generated from event title + month + year. Deduplicated with a numeric suffix if needed.

Examples:

- `ephemeralsocial.com/e/jakes-birthday-mar-2026`
- `ephemeralsocial.com/e/tuesday-comedy-night-mar-2026`
- `ephemeralsocial.com/e/book-club-feb-2026`
- `ephemeralsocial.com/e/book-club-feb-2026-2` (deduplication)

**Slug generation rules:**

- Lowercase the title
- Replace spaces and special characters with hyphens
- Strip consecutive hyphens
- Append `-{mon}-{year}` (e.g., `-mar-2026`)
- Truncate to 60 characters max (before dedup suffix)
- Check for uniqueness in D1, append `-2`, `-3` etc. if needed
- Store both slug and short_code on the event record

The slug is immutable after event creation. If the host changes the event title, the slug does not change (prevents broken links).

### Short URLs (ephmr.al)

For sharing in text messages, social media, QR codes, and anywhere character count matters:

```
ephmr.al/e/{short_code}
```

**Short code format:** 6-character nanoid using alphabet `0123456789abcdefghijklmnopqrstuvwxyz` (lowercase alphanumeric only — no ambiguous characters, easy to type manually if needed). This gives 2.18 billion possible codes — more than enough.

Examples:

- `ephmr.al/e/xk9m2f`
- `ephmr.al/e/a3b7n1`

### Other Routes

```
ephemeralsocial.com/              -- Landing page / marketing
ephemeralsocial.com/create        -- Create new event (authenticated)
ephemeralsocial.com/my-events     -- Dashboard: user's created/attending events
ephemeralsocial.com/e/{slug}      -- Event detail page (public)
ephemeralsocial.com/e/{slug}/edit -- Edit event (host only)
ephemeralsocial.com/e/{slug}/check-in -- Check-in mode (host only)
ephemeralsocial.com/not-found     -- 404 page (note: deleted events don't 404 — they show tombstone page via event_tombstones table)

ephmr.al/e/{short_code}            -- 301 redirect to canonical URL
ephmr.al/                        -- 301 redirect to ephemeralsocial.com
fuckpartiful.com                  -- Comparison landing page
fuckpartiful.com/*                -- All paths redirect to fuckpartiful.com root
```

---

## Short Link Infrastructure

### DNS Setup

`ephmr.al` is registered at an external registrar (Albania TLD). Configuration:

**Option A (preferred): Nameserver delegation.** Change nameservers at registrar to Cloudflare's assigned nameservers (e.g., `aria.ns.cloudflare.com`, `bob.ns.cloudflare.com`). This gives Cloudflare full DNS control, automatic SSL, and Worker routing. Check that the registrar supports custom nameservers — most do, but some exotic TLD registrars only support DNS record editing.

**Option B (fallback): CNAME/A record.** If the registrar doesn't support custom nameservers, add a CNAME record pointing `ephmr.al` to the Cloudflare Worker's route. Less clean but functional. May require a Cloudflare for SaaS setup for SSL on the custom domain.

### Cloudflare Worker (ephmr.al)

A dedicated Worker deployed on the `ephmr.al` zone handles all requests:

```typescript
// workers/short-link/src/index.ts

export interface Env {
	SHORT_LINKS: KVNamespace; // KV store: short_code → canonical URL
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		const code = url.pathname.slice(1).toLowerCase(); // strip leading /

		// Root domain → main site
		if (!code || code === '/') {
			return Response.redirect('https://ephemeralsocial.com', 301);
		}

		// Look up short code in KV
		const destination = await env.SHORT_LINKS.get(code);

		if (!destination) {
			return Response.redirect('https://ephemeralsocial.com/not-found', 302);
		}

		// 301 permanent redirect to canonical URL
		return Response.redirect(destination, 301);
	}
};
```

### Short Link Creation

When an event is created, the API generates both slug and short code, then stores the mapping in KV:

```typescript
// lib/short-link.ts

import { nanoid, customAlphabet } from 'nanoid';

const generateShortCode = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6);

export async function createShortLink(
	kv: KVNamespace,
	shortCode: string,
	canonicalUrl: string,
	expiresAt: number // Unix timestamp — same as event expiry
): Promise<void> {
	// Store with TTL so KV auto-cleans after event deletion
	const ttlSeconds = expiresAt - Math.floor(Date.now() / 1000);

	await kv.put(shortCode, canonicalUrl, {
		expirationTtl: Math.max(ttlSeconds, 60) // minimum 60 seconds
	});
}

// Called during event creation:
const shortCode = generateShortCode();
const canonicalUrl = `https://ephemeralsocial.com/e/${slug}`;
await createShortLink(env.SHORT_LINKS, shortCode, canonicalUrl, event.expires_at);
```

**KV auto-expiration:** Short link mappings are stored with a TTL matching the event's expiration (7 days after event ends). When the event is deleted, the KV entry auto-expires too. No separate cleanup job needed for short links.

### Where Short URLs Are Used

- **SMS notifications:** All SMS messages use `ephmr.al/e/{code}` links (shorter = fewer SMS segments = lower Twilio cost)
- **Share buttons:** "Share Event" generates the short URL for clipboard/share sheet
- **QR codes:** All QR codes encode `https://ephmr.al/e/{code}` (fewer characters = denser, more scannable QR)
- **Social sharing:** Open Graph meta tags on the canonical URL; short URL is the shareable link
- **Ticket confirmation:** Ticket QR codes link to a ticket-specific URL (see QR Codes section below)

---

## QR Code Generation

### Two Types of QR Codes

**1. Event Share QR Code** — for sharing the event page (printed on flyers, posted in venues, shown on screen)

**2. Ticket QR Code** — for entry to ticketed events (shown at door, scanned by host)

These serve different purposes and encode different data.

### Event Share QR Code

**Payload:** `https://ephmr.al/e/{event_short_code}`

**When generated:** On demand when host taps "Get QR Code" on event dashboard, or automatically included on the event page as a shareable asset.

**Visual style:**

- Ephemeral branded — not a plain black-and-white grid
- Dark modules on light background (high contrast for scanning reliability)
- Ephemeral logo or "E" mark centered in the QR code (using the error correction capacity — QR codes can tolerate up to 30% obscured with H-level error correction)
- Rounded module corners for softer aesthetic
- Ephemeral brand color for modules (dark enough for contrast — test with scanner)
- Small text below QR code: event title + date

**Generation approach:** Server-side generation using a QR code library with customization support. Store the generated image in R2. Return the R2 URL for display/download.

```typescript
// lib/qr-generate.ts

interface QROptions {
	data: string; // URL to encode
	size: number; // pixel dimensions (default: 1024)
	errorCorrection: 'L' | 'M' | 'Q' | 'H'; // H for logo overlay
	logoUrl?: string; // Ephemeral logo to center
	moduleColor?: string; // hex color for dark modules
	backgroundColor?: string;
	moduleRadius?: number; // 0-0.5, corner rounding
	caption?: string; // text below QR code
}

// Event share QR
const eventQR = await generateQR({
	data: `https://ephmr.al/e/${event.short_code}`,
	size: 1024,
	errorCorrection: 'H',
	logoUrl: EPHEMERAL_LOGO_URL,
	moduleColor: '#1a1a1a', // near-black for reliability
	backgroundColor: '#ffffff',
	moduleRadius: 0.4,
	caption: `${event.title} — ${formatDate(event.starts_at)}`
});
```

**Output formats:**

- PNG at 1024x1024 (default, for digital sharing)
- SVG (for print — infinitely scalable)
- Both stored in R2, URLs returned to host

### Ticket QR Code

**Payload:** `https://ephemeralsocial.com/ticket/{ticket_id}`

Note: Ticket QR codes use the **full canonical domain**, not ephmr.al. Reason: the ticket verification endpoint needs to hit the API directly. The short link redirect adds unnecessary latency to the check-in scanning flow. The ticket URL is never typed manually — it's only ever scanned.

**When generated:** Immediately after successful Stripe payment. Stored in R2. URL saved to `tickets.qr_code_url`.

**What the ticket URL returns:**

- If accessed by the ticket holder (via browser): shows a ticket confirmation page with event details, ticket status, and the QR code itself
- If accessed by the check-in scanner (via scanning API): returns JSON with ticket validity, guest name, and check-in status

**Visual style:**

- Same branded styling as event share QR (Ephemeral logo centered, rounded modules)
- Distinct color accent to differentiate from event share QR (e.g., slightly different module color or border treatment)
- Caption below: guest display name + event title
- Larger quiet zone (white border) for reliable scanning in low-light venue conditions

**Security considerations:**

- Ticket ID is a ULID (26 characters) — not guessable, time-sortable, matching all other IDs in the backend
- QR code payload is a URL, not raw ticket data — the server validates on scan
- Ticket status checked server-side on every scan (prevents screenshot sharing after use)
- Used tickets return "Already checked in" on re-scan

```typescript
// Ticket QR generation (called after Stripe payment webhook)
const ticketQR = await generateQR({
	data: `https://ephemeralsocial.com/ticket/${ticket.id}`,
	size: 1024,
	errorCorrection: 'H',
	logoUrl: EPHEMERAL_LOGO_URL,
	moduleColor: '#1a1a1a',
	backgroundColor: '#ffffff',
	moduleRadius: 0.4,
	caption: `${rsvp.display_name} — ${event.title}`
});

// Store in R2 and save key to ticket record
const r2Key = `tickets/${ticket.id}/qr.svg`;
await env.R2.put(r2Key, ticketQR.svgBuffer);
await db.prepare('UPDATE tickets SET qr_code_r2_key = ? WHERE id = ?').bind(r2Key, ticket.id).run();
```

---

## Ticket Check-In System

### Host Check-In Mode

Host opens `ephemeralsocial.com/e/{slug}/check-in` on their phone. This page:

1. Requests camera permission (one-time)
2. Opens a live camera viewfinder with a scanning overlay
3. Continuously scans for QR codes in the camera frame
4. On successful detection, calls the ticket verification API

### Scanning Implementation

**Browser-based scanning using the BarcodeDetector API** (supported in Chrome, Edge, Samsung Browser — covers majority of Android). Fallback to `html5-qrcode` library for browsers without native support (Safari, Firefox).

```typescript
// Check-in page scanning logic

async function startScanning(videoElement: HTMLVideoElement) {
	// Try native BarcodeDetector first
	if ('BarcodeDetector' in window) {
		const detector = new BarcodeDetector({ formats: ['qr_code'] });
		const stream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: 'environment' } // rear camera
		});
		videoElement.srcObject = stream;

		const scan = async () => {
			const barcodes = await detector.detect(videoElement);
			for (const barcode of barcodes) {
				if (barcode.rawValue.includes('/ticket/')) {
					await verifyTicket(barcode.rawValue);
					return;
				}
			}
			requestAnimationFrame(scan);
		};
		scan();
	} else {
		// Fallback to html5-qrcode library
		// ... library-based scanning
	}
}
```

### Ticket Verification Flow

```
Guest shows QR code → Host scans → Browser extracts URL → POST /api/tickets/verify

Request:  { ticket_url: "https://ephemeralsocial.com/ticket/abc123..." }
Response: { valid: true, guest_name: "Jake", status: "active", event_id: "..." }
```

**Verification API response states:**

| Status              | Screen                                                    | Color        |
| ------------------- | --------------------------------------------------------- | ------------ |
| Valid + first scan  | Guest name, large checkmark, "Welcome, Jake!"             | Green flash  |
| Already checked in  | Guest name, warning icon, "Already checked in at 8:47 PM" | Yellow flash |
| Invalid / not found | "Invalid ticket"                                          | Red flash    |
| Wrong event         | "This ticket is for a different event"                    | Red flash    |
| Refunded            | Guest name, "Ticket refunded"                             | Red flash    |

**On successful first scan:**

- API sets `checked_in = 1` and `checked_in_at = now()` on the RSVP record
- API sets ticket status to `'used'`
- Response includes guest name for the host's confirmation screen
- Host's phone vibrates briefly (haptic feedback via Vibration API)

### Manual Check-In Fallback

Below the camera viewfinder, the check-in page shows a searchable guest list. Host can tap a guest's name to manually check them in (for cases where the QR code won't scan — cracked screen, low brightness, etc.).

The guest list shows real-time check-in status:

- Unchecked names with a hollow circle
- Checked-in names with a filled green circle and timestamp
- Counter at top: "14 / 23 checked in"

### Check-In Dashboard (Host View)

Available during and after the event at `ephemeralsocial.com/e/{slug}/check-in`:

- Total tickets sold vs. checked in (e.g., "14 / 23 checked in")
- List of all ticket holders with check-in status and timestamp
- Revenue summary: total collected, fees absorbed, net to organizer
- Export guest list as CSV (name, email if provided, check-in time, ticket price)

---

## Open Graph & Social Sharing

When an event URL is shared on iMessage, Instagram, Twitter, Slack, etc., the preview card should show rich event information.

**Meta tags on event pages (SSR-rendered):**

```html
<meta property="og:title" content="Jake's Birthday Party" />
<meta
	property="og:description"
	content="Saturday, March 15 at 8:00 PM — The Rooftop Bar, Brooklyn"
/>
<meta property="og:image" content="https://ephemeralsocial.com/og/{event_id}.png" />
<meta property="og:url" content="https://ephemeralsocial.com/e/jakes-birthday-mar-2026" />
<meta property="og:type" content="website" />

<!-- Twitter/X card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Jake's Birthday Party" />
<meta
	name="twitter:description"
	content="Saturday, March 15 at 8:00 PM — The Rooftop Bar, Brooklyn"
/>
<meta name="twitter:image" content="https://ephemeralsocial.com/og/{event_id}.png" />
```

**OG image generation:** Dynamically generated image (1200x630) showing event title, date/time, location, RSVP count, and Ephemeral branding. Generated server-side on event creation and updated when event details change. Stored in R2.

---

## Implementation Library Recommendations

| Purpose                     | Library                            | Why                                                                                                                                                |
| --------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| QR code generation          | `qr-code-styling` (npm)            | Supports logo overlay, rounded modules, color customization, SVG + PNG output. Works in Workers with canvas polyfill or can generate SVG directly. |
| QR code scanning (primary)  | Native `BarcodeDetector` API       | Zero bundle size, hardware-accelerated, supported on Chrome/Edge/Samsung                                                                           |
| QR code scanning (fallback) | `html5-qrcode` (npm)               | Covers Safari and Firefox where BarcodeDetector isn't available                                                                                    |
| Slug generation             | `slugify` (npm)                    | Handles unicode, special chars, configurable separator                                                                                             |
| Short code generation       | `nanoid` with custom alphabet      | Collision-resistant, configurable character set                                                                                                    |
| OG image generation         | `@vercel/og` or `satori` + `resvg` | Generates images from JSX/HTML templates, runs in edge workers                                                                                     |
