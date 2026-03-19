# 06 — Technical Architecture

## Architecture: Shared Backend, Separate Frontend

The events web app is a **SvelteKit frontend** that calls the **existing Ephemeral backend** (`ephemeral_backend/`). It does NOT have its own API server, auth system, or database — it reuses the shared infrastructure that the Flutter app already uses.

```
┌─────────────────────┐     ┌─────────────────────┐
│  ephemeral_flutter   │     │ ephemeral_events_web │
│  (Flutter native)    │     │ (SvelteKit SSR)      │
└─────────┬───────────┘     └─────────┬───────────┘
          │                           │
          │  Same JWT tokens,         │  Same JWT tokens,
          │  same API endpoints       │  same API endpoints
          │                           │
          └───────────┬───────────────┘
                      ▼
          ┌───────────────────────┐
          │  ephemeral_backend     │
          │  (Cloudflare Workers)  │
          │  Hono router, D1, R2,  │
          │  KV, Twilio, Stripe    │
          └───────────────────────┘
```

**What the events web app owns:**

- SvelteKit frontend (SSR on Cloudflare Pages)
- SvelteKit server routes that proxy/orchestrate calls to the shared backend
- Web-specific session management (HttpOnly cookies → KV, wrapping the backend's JWT tokens)
- The `ephmr.al` short link Worker (lightweight redirect, separate deployment)
- Static assets, OG image generation

**What it reuses from the existing backend:**

- Phone auth flow (send-code, verify-code, refresh tokens)
- User records (`users` table — same users as Flutter app)
- Events CRUD (existing endpoints, extended with new web-specific fields)
- JWT token issuance and validation
- R2 media storage
- Rate limiting infrastructure
- Twilio integration

## Infrastructure

| Service                | Purpose                                      | New or Existing?                                                            |
| ---------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| **Pages**              | SvelteKit SSR web app hosting                | **New** — separate CF Pages project                                         |
| **Workers** (backend)  | API logic, auth, events, payments            | **Existing** — `ephemeral_backend`                                          |
| **Workers** (ephmr.al) | Short link redirects                         | **New** — lightweight redirect worker                                       |
| **D1**                 | Shared database (users, events, RSVPs, etc.) | **Existing** — same DB as Flutter app                                       |
| **R2**                 | Photo/media storage                          | **Existing** — same `MEDIA` bucket                                          |
| **KV**                 | Sessions, rate limits, cache, short links    | **Existing** (sessions, rate limits) + **new KV namespace** for short links |
| **Queues**             | Background jobs (EXIF strip, deletion)       | **Existing** — add new job types                                            |
| **Cron Triggers**      | TTL cleanup, reminders, series generation    | **Existing** — add new cron handlers                                        |
| **Turnstile**          | Bot protection on event creation and RSVP    | **New** — frontend integration                                              |

## External Dependencies

| Service                    | Purpose                               | New or Existing?                            |
| -------------------------- | ------------------------------------- | ------------------------------------------- |
| **Twilio**                 | SMS verification and notifications    | **Existing** — same Twilio Verify service   |
| **Stripe Connect Express** | Ticketed event payment processing     | **New** — new Stripe integration in backend |
| **Stripe Checkout**        | Hosted payment page for ticket buyers | **New** — new Stripe integration in backend |

## Frontend Stack

**Framework:** SvelteKit with server-side rendering on Cloudflare Pages.

Event pages must be fast, SEO-friendly (for shared links), and work perfectly on mobile browsers without an app. SSR ensures the event page renders immediately when someone taps a shared link. Cloudflare Pages has a mature SvelteKit adapter.

**Not Flutter Web.** The full Ephemeral app uses Flutter for native iOS/Android. But Flutter Web has poor SEO, large bundle sizes, and slower initial load — all dealbreakers for a web app where the first interaction is tapping a link someone texted you. The events web app is a separate frontend codebase.

| Layer         | Choice                                                                       |
| ------------- | ---------------------------------------------------------------------------- |
| Framework     | SvelteKit (SSR on Cloudflare Pages)                                          |
| UI components | shadcn-svelte (Bits UI + Tailwind — source copied into project, fully owned) |
| Styling       | Tailwind CSS v4, custom theme overriding all shadcn defaults                 |
| Forms         | Superforms + Zod validation                                                  |
| Animations    | Svelte built-in (`transition:`, `in:`, `out:`, `svelte/motion`)              |
| Icons         | Phosphor (`phosphor-svelte`) — regular + duotone weights                     |

### Visual Identity: Not AI Slop

The events web app must not look like a default shadcn/Tailwind template. Every visual default is overridden with Ephemeral's brand identity. The following spec is the source of truth for Claude Code when implementing any UI.

**Core principle:** The events web app is a dark, warm, nature-rooted product that feels like it was designed by a human with strong opinions — not generated by a prompt.

### Dark Mode Only

No light mode. No theme toggle. Dark mode is the only mode. This is a deliberate brand decision:

- Events happen at night — the product should feel native to that context
- Immediately differentiates from Partiful (white/pastel), Eventbrite (white/corporate), and every AI-generated app
- Dark surfaces make the Forest green accent color pop
- Reduces visual noise — content and actions stand out

### Color Palette

Derived from the Ephemeral Forest theme, adapted for dark-mode web. All combinations must meet WCAG AA contrast (4.5:1 text, 3:1 UI components).

**Surfaces (warm, not cold):**

| Token               | Value     | Usage                                            |
| ------------------- | --------- | ------------------------------------------------ |
| `--surface-base`    | `#111110` | Page background — warm near-black, NOT pure #000 |
| `--surface-raised`  | `#1a1918` | Cards, modals, elevated containers               |
| `--surface-overlay` | `#232220` | Dropdowns, popovers, tooltips                    |
| `--surface-input`   | `#1e1d1b` | Input fields, text areas                         |
| `--surface-subtle`  | `#292826` | Hover states, subtle backgrounds                 |

**Text (warm off-whites, not blue-white):**

| Token              | Value     | Usage                                 |
| ------------------ | --------- | ------------------------------------- |
| `--text-primary`   | `#ede9e3` | Headlines, body text, primary content |
| `--text-secondary` | `#a39e96` | Captions, timestamps, supporting text |
| `--text-muted`     | `#6b6560` | Placeholders, disabled text, hints    |
| `--text-inverse`   | `#111110` | Text on accent-colored backgrounds    |

**Accent (Forest green — the brand signature):**

| Token              | Value       | Usage                                              |
| ------------------ | ----------- | -------------------------------------------------- |
| `--accent-primary` | `#52b788`   | Primary buttons, links, active states, focus rings |
| `--accent-hover`   | `#40916c`   | Button hover, link hover                           |
| `--accent-muted`   | `#52b78818` | Subtle accent backgrounds (badges, tags, status)   |
| `--accent-glow`    | `#52b78830` | Focus ring glow, selection highlight               |

**Borders (warm, not gray):**

| Token              | Value     | Usage                           |
| ------------------ | --------- | ------------------------------- |
| `--border-default` | `#2e2c2a` | Card borders, dividers          |
| `--border-subtle`  | `#242220` | Input borders at rest           |
| `--border-focus`   | `#52b788` | Focused inputs, active elements |

**Feedback:**

| Token                | Value     | Usage                                            |
| -------------------- | --------- | ------------------------------------------------ |
| `--feedback-success` | `#52b788` | Confirmations, check-in success (same as accent) |
| `--feedback-error`   | `#e85d04` | Errors, invalid tickets, destructive actions     |
| `--feedback-warning` | `#e8a520` | Host updates, caution states                     |
| `--feedback-info`    | `#64b5f6` | Informational banners                            |

**Shadows (warm-tinted, not gray):**

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.5);
/* All shadows are pure black opacity — on warm dark surfaces this reads warm naturally */
```

### Typography

Fonts are drawn from the Ephemeral design system. Variable fonts for weight flexibility and smaller bundles.

| Role                | Font                  | Fallback              | Load via                   |
| ------------------- | --------------------- | --------------------- | -------------------------- |
| Display / Headlines | **Vollkorn Variable** | Georgia, serif        | Fontsource or Google Fonts |
| Body / UI           | **Manrope Variable**  | system-ui, sans-serif | Fontsource or Google Fonts |

**Why these fonts:**

- **Vollkorn** is an organic serif with calligraphic warmth and visible stroke variation. On dark backgrounds, a serif headline with generous weight creates visual presence that no AI-generated app has. Used for event titles, section headers, and display text.
- **Manrope** is a geometric humanist sans with subtle roundness. Warmer than Inter, more distinctive than Source Sans, excellent legibility at small sizes on dark backgrounds. Used for body text, buttons, labels, form inputs, captions, and all functional UI.

**Type scale (Major Third ratio 1.25, matching Ephemeral design system):**

| Token         | Font     | Size | Weight | Line Height | Usage                         |
| ------------- | -------- | ---- | ------ | ----------- | ----------------------------- |
| `display-lg`  | Vollkorn | 39px | 700    | 1.15        | Hero event titles             |
| `display-md`  | Vollkorn | 31px | 700    | 1.2         | Event page title              |
| `headline-lg` | Vollkorn | 25px | 600    | 1.25        | Section headers               |
| `headline-md` | Vollkorn | 20px | 600    | 1.3         | Card titles, sub-headers      |
| `body-lg`     | Manrope  | 18px | 400    | 1.5         | Emphasized body, descriptions |
| `body-md`     | Manrope  | 16px | 400    | 1.5         | Default body text             |
| `body-sm`     | Manrope  | 14px | 400    | 1.5         | Secondary text, metadata      |
| `caption`     | Manrope  | 12px | 400    | 1.4         | Timestamps, hints             |
| `button`      | Manrope  | 16px | 600    | 1.0         | Button labels                 |
| `label`       | Manrope  | 14px | 500    | 1.2         | Form labels, badges           |

### Icons: Phosphor

**Library:** `phosphor-svelte` (MIT, tree-shakeable, 9,000+ icons)

**Not Lucide. Not Heroicons.** Those are the default for every AI-generated and Tailwind template app. Phosphor has a distinctive silhouette style and — critically — supports 6 weight variants (thin, light, regular, bold, fill, duotone) from the same icon family.

**Usage rules:**

- **Regular weight** for most UI icons (navigation, actions, status)
- **Duotone weight** for featured/emphasized icons (event type badges, empty states, onboarding). Duotone uses `--accent-primary` as the secondary tone — immediately recognizable as Ephemeral brand.
- **Bold weight** for interactive elements (buttons, CTAs) — creates visual weight hierarchy
- **Thin weight** for passive metadata (timestamps, secondary info) — subtle, doesn't compete

This weight-based hierarchy creates visual depth that single-weight icon libraries can't achieve.

### Styling Rules for Claude Code

These rules override shadcn-svelte defaults and must be followed for every component:

**1. Border radius:** `0.75rem` (12px) default for cards and containers. `9999px` (pill) for buttons and badges. NOT the shadcn default of `0.5rem`. Rounder = more organic, matching nature-inspired brand.

**2. Surfaces:** Never use pure white (`#fff`) or pure black (`#000`) anywhere. All surfaces use the warm palette above. Cards use `--surface-raised` with `--border-default` border.

**3. Backgrounds:** `--surface-base` as page background. Consider adding a very subtle CSS noise texture overlay at 2-3% opacity for organic feel (optional, performance-permitting).

**4. Buttons:**

- Primary: `--accent-primary` background, `--text-inverse` text, pill shape, Manrope 600 weight
- Secondary: transparent background, `--accent-primary` border and text, pill shape
- Ghost: transparent, `--text-secondary` text, no border, shows on hover only
- All buttons: `transition: all 150ms ease` — fast but not instant

**5. Inputs:** `--surface-input` background, `--border-subtle` border at rest, `--border-focus` on focus with `--accent-glow` box-shadow ring. Manrope 400 weight. `0.75rem` radius.

**6. Cards:** `--surface-raised` background, `1px solid --border-default`, `--shadow-sm`. No aggressive shadows. Content breathes — `1rem` internal padding minimum.

**7. Warm shadows only:** Shadows use the defined CSS variables. No Tailwind default `shadow-md` (which is cool gray). Override in Tailwind config.

**8. Spacing rhythm:** Generous padding inside containers (16-20px). Tight spacing between related elements (8px). Breathing room between sections (24-32px). Intentional, not cramped.

**9. Transitions:** Svelte built-in `transition:fade` and `transition:slide` for modals, toasts, and state changes. Use a consistent ease curve: `cubic-bezier(0.25, 0.1, 0.25, 1.0)` — slightly softer than default ease. 150-200ms for micro-interactions, 300ms for modals/overlays.

**10. No emoji in UI.** Use Phosphor icons for everything. Emoji can appear in user-generated content (comments, descriptions) but not in the Ephemeral UI itself (buttons, labels, status indicators, empty states). This is a maturity signal.

### shadcn-svelte Theme Override

All shadcn CSS variables must be overridden at the `:root` level to use the Ephemeral palette. Example:

```css
:root {
	/* shadcn variables mapped to Ephemeral tokens */
	--background: 12 10% 7%; /* --surface-base */
	--foreground: 30 15% 92%; /* --text-primary */
	--card: 18 8% 10%; /* --surface-raised */
	--card-foreground: 30 15% 92%; /* --text-primary */
	--primary: 153 47% 52%; /* --accent-primary */
	--primary-foreground: 12 10% 7%; /* --text-inverse */
	--secondary: 20 5% 16%; /* --surface-subtle */
	--muted: 20 5% 16%; /* --surface-subtle */
	--muted-foreground: 25 6% 50%; /* --text-secondary */
	--accent: 153 47% 52%; /* --accent-primary */
	--destructive: 24 95% 46%; /* --feedback-error */
	--border: 18 6% 17%; /* --border-default */
	--input: 18 6% 17%; /* --border-subtle */
	--ring: 153 47% 52%; /* --accent-primary */
	--radius: 0.75rem;
}
```

This ensures every shadcn component — buttons, dialogs, dropdowns, inputs, cards — automatically inherits the Ephemeral dark palette without per-component overrides.

---

## Database Schema — Extending the Existing Backend

The events web app shares the **same D1 database** as the Flutter app backend. It does NOT create a parallel database. The existing `users`, `events`, and `event_invites` tables are reused. New tables and columns are added via migrations in `ephemeral_backend/`.

### Existing Tables (no changes needed)

These tables already exist in the backend and are used as-is:

```sql
-- EXISTING: users table (created by phone auth flow)
-- user_id TEXT PRIMARY KEY (ULID)
-- phone_e164 TEXT UNIQUE NOT NULL
-- phone_country_code, phone_national_number
-- username, display_name, bio, avatar_r2_key
-- subscription_tier, presence fields, moderation fields
-- created_at, updated_at, last_login_at

-- EXISTING: events table
-- event_id TEXT PRIMARY KEY (ULID)
-- creator_user_id, title, description
-- venue_name, venue_address, venue_lat, venue_lng
-- start_time, end_time, timezone
-- visibility ('public', 'followers', 'invites')
-- max_attendees, allow_plus_ones, cover_r2_key
-- creation_cost, expires_at
-- created_at, updated_at, deleted_at

-- EXISTING: event_invites table (used for RSVPs)
-- event_id + user_id (composite PK)
-- status ('pending', 'going', 'maybe', 'declined')
--   NOTE: UI "Can't make it" maps to 'declined' in the DB
-- plus_ones, invited_by_user_id, responded_at
```

### Schema Extensions (new migrations)

New columns on existing tables and new tables for web-specific features. All added as individual migration files in `ephemeral_backend/migrations/`. **One ALTER TABLE per file** — D1 migrations are not transactional across statements.

See `BACKEND_INTEGRATION_PLAN.md` Section 1 for the full list of 24 migrations with exact SQL.

**Summary of changes:**

**Extended existing tables (nullable columns, no breaking changes):**

- `events` + 10 columns: `slug`, `short_code`, `location_hidden`, `show_guest_list`, `web_event_type`, `ticket_price_cents`, `payment_handle`, `payment_platform`, `series_id`, `cached_per_person_cents`
- `event_invites` + 5 columns: `display_name`, `payment_status`, `checked_in`, `checked_in_at`, `series_auto_rsvp`
- `users` + 1 column: `stripe_account_id`

**New tables:**

- `event_cohosts` — co-host relationships with invite tokens + 72hr expiry (PK: event_id + user_id)
- `event_costs` — itemized cost items for simple events
- `event_series` — recurring event series templates with timezone (IANA) and iCal RRULE
- `event_comments` — event wall comments and host updates
- `tickets` — purchased tickets with Stripe checkout_session_id/payment_intent_id, QR R2 keys, and ticket_number for multi-ticket dedup
- `event_notification_log` — SMS deduplication (UNIQUE on user_id + event_id + notification_type)
- `text_blasts` — host SMS blast tracking (max 3 per event, shared pool)
- `event_tombstones` — preserves slug/short_code/title after event deletion for permanent "deleted" page

**Extended existing table:**

- `event_photos` + `exif_proof` column — stores JSON of stripped EXIF metadata fields for privacy proof display

### Key Schema Decisions

**Why extend `events` instead of a new table?** The existing `events` table already has the core fields (title, description, venue, times, visibility, creator). Web-specific features (slug, short_code, ticketing, cost sharing) are added as nullable columns. Flutter events have these columns as NULL — no conflict.

**Why use `event_invites` directly for web RSVPs?** All RSVPs require phone verification, so every guest has a `user_id`. The existing composite PK `(event_id, user_id)` works perfectly. New columns (`display_name`, `payment_status`, `checked_in`, etc.) are nullable — Flutter RSVPs leave them NULL.

**No anonymous guests table.** The original plan included `anonymous_guests` and `web_rsvps` tables for name-only RSVPs. This was eliminated — phone verification is required for all RSVPs. This dramatically simplifies the auth model (no session tokens, no anonymous middleware, no RSVP upgrade path).

**ID format:** All new IDs use ULID (matching existing backend convention), NOT nanoid.

---

## API: Extending the Existing Backend

The events web app adds new endpoints to the **existing `ephemeral_backend/` Hono router**. No separate API server. New handler files are added under the existing `src/handlers/` directory.

### Existing Endpoints (Reused As-Is)

These already work and the SvelteKit frontend calls them directly:

```
POST /v1/auth/phone/send-code      -- Send Twilio Verify SMS (3/phone/hour)
POST /v1/auth/phone/verify-code    -- Verify SMS code → JWT tokens + auto-create user
POST /v1/auth/refresh              -- Rotate refresh token → new token pair
POST /v1/events                    -- Create event (requireAuth)
GET  /v1/events                    -- List user's events (requireAuth)
GET  /v1/events/:eventId           -- Get event details (requireAuth)
PUT  /v1/events/:eventId           -- Update event (host only)
DELETE /v1/events/:eventId         -- Cancel event (host only)
POST /v1/events/:eventId/rsvp     -- RSVP to event (requireAuth)
GET  /v1/events/:eventId/guests   -- Get guest list (requireAuth)
POST /v1/media                     -- Upload media to R2
```

### New Endpoints (Added to `ephemeral_backend/`)

New handler files in `ephemeral_backend/src/handlers/`:

```
src/handlers/
├── events/
│   ├── index.ts                    -- EXISTING: extend with slug/short_code on create
│   ├── public.ts                   -- NEW: public event page by slug (no auth)
│   ├── settings.ts                 -- NEW: toggle show_guest_list, location_hidden
│   ├── series.ts                   -- NEW: recurring event series CRUD
│   ├── my-events.ts                -- NEW: user dashboard (hosting + attending)
│   └── ics-export.ts               -- NEW: ICS calendar file download
├── web-rsvp/
│   ├── create.ts                   -- NEW: RSVP to web event (requireAuth)
│   ├── update.ts                   -- NEW: change RSVP status (requireAuth)
│   ├── my-rsvp.ts                  -- NEW: get current user's RSVP
│   └── guest-list.ts               -- NEW: guest list (respects show_guest_list toggle)
├── cohosts/
│   ├── invite.ts                   -- NEW: generate co-host invite link
│   ├── accept.ts                   -- NEW: accept co-host invite via token
│   ├── remove.ts                   -- NEW: remove co-host (creator only)
│   └── list.ts                     -- NEW: list co-hosts
├── payments/
│   ├── costs.ts                    -- NEW: cost items CRUD for simple events
│   ├── mark-paid.ts                -- NEW: host confirms payment received
│   ├── stripe-onboard.ts           -- NEW: Stripe Connect Express onboarding
│   ├── stripe-status.ts            -- NEW: check Stripe onboarding completion
│   ├── stripe-checkout.ts          -- NEW: create Checkout session (supports quantity)
│   ├── stripe-webhook.ts           -- NEW: handle Stripe webhook events
│   └── refund.ts                   -- NEW: host-initiated refund
├── gallery/
│   ├── upload.ts                   -- NEW: photo upload + EXIF strip + proof
│   └── list.ts                     -- NEW: list event photos
├── event-comments/
│   ├── create.ts                   -- NEW: post comment / host update
│   └── list.ts                     -- NEW: list comments
├── tickets/
│   ├── my-ticket.ts                -- NEW: get current user's ticket(s)
│   ├── verify.ts                   -- NEW: verify ticket QR on scan
│   └── check-in.ts                 -- NEW: mark ticket used
└── notifications/
    └── text-blast.ts               -- NEW: host/co-host sends custom SMS (3/event pool)

src/jobs/
├── ttl-cleanup.ts                  -- EXISTING: extend to clean web event data + R2 photos
├── event-reminders.ts              -- NEW: 24hr + 1hr SMS reminders
├── gallery-notify.ts               -- NEW: notify host when gallery is ready
├── series-generator.ts             -- NEW: auto-generate recurring instances + silent auto-RSVP
└── r2-reconciliation.ts            -- NEW: weekly scan for orphaned R2 objects after failed deletions

src/lib/
├── exif-strip.ts                   -- NEW: Two-step EXIF: parse fields for proof (exif-reader), then strip via CF Images
├── qr-generate.ts                  -- NEW: branded QR code SVG generation
├── deep-link.ts                    -- NEW: Venmo/CashApp/Zelle payment deep links
├── short-link.ts                   -- NEW: ephmr.al short code gen + KV storage
├── slug.ts                         -- NEW: human-readable slug generation (immutable)
├── ics-export.ts                   -- NEW: ICS calendar file generation
├── stripe.ts                       -- NEW: Stripe Connect + Checkout + auto-refund
├── cohost.ts                       -- NEW: co-host invite tokens + permission checks
├── privacy-stats.ts                -- NEW: real-time privacy dashboard stats
├── capacity.ts                     -- NEW: max_attendees hard cap enforcement
├── cost-split.ts                   -- NEW: per-person cost recalculation
└── tombstone.ts                    -- NEW: insert tombstone on event deletion, query for deleted event pages
```

### New API Routes

See `BACKEND_INTEGRATION_PLAN.md` Section 3 for the full endpoint table with middleware, permissions, and descriptions.

```
-- Public (no auth required)
GET  /v1/events/by-slug/:slug              -- Event page data (SSR, public)

-- Authenticated (JWT required for all below)
POST /v1/events/:eventId/web-rsvp          -- RSVP (status + display_name + plus_ones)
PUT  /v1/events/:eventId/web-rsvp          -- Change RSVP status
GET  /v1/events/:eventId/my-rsvp           -- Get current user's RSVP
GET  /v1/events/:eventId/guest-list        -- Guest names (host sees all, others see Going+Maybe if enabled)
GET  /v1/my-events                         -- User dashboard (hosting + attending)

-- Co-hosts
POST /v1/events/:eventId/cohosts/invite    -- Generate invite link (host/co-host)
POST /v1/events/:eventId/cohosts/accept    -- Accept invite via token
DELETE /v1/events/:eventId/cohosts/:userId -- Remove co-host (creator only)
GET  /v1/events/:eventId/cohosts           -- List co-hosts

-- Cost sharing (host/co-host)
POST /v1/events/:eventId/costs             -- Add cost item
GET  /v1/events/:eventId/costs             -- List costs + per-person split
PUT  /v1/events/:eventId/costs/:id         -- Update cost item
DELETE /v1/events/:eventId/costs/:id       -- Remove cost item
POST /v1/events/:eventId/mark-paid         -- Mark guest as paid

-- Settings (host/co-host)
PUT  /v1/events/:eventId/settings          -- Toggle show_guest_list, location_hidden

-- Gallery (RSVP'd Going/Maybe)
POST /v1/events/:eventId/photos            -- Upload photo (EXIF stripped, returns proof)
GET  /v1/events/:eventId/photos            -- List photos

-- Comments (RSVP'd users)
POST /v1/events/:eventId/comments          -- Post comment or host update
GET  /v1/events/:eventId/comments          -- List comments

-- Ticketing
POST /v1/payments/stripe-onboard           -- Start Stripe Connect onboarding
GET  /v1/payments/stripe-status            -- Check onboarding completion
POST /v1/events/:eventId/checkout          -- Create Checkout session (quantity for plus-ones)
GET  /v1/events/:eventId/my-ticket         -- Get user's ticket(s) (poll after checkout)
POST /v1/tickets/:ticketId/verify          -- Verify QR code (host/co-host)
POST /v1/tickets/:ticketId/check-in        -- Mark ticket used (host/co-host)
POST /v1/events/:eventId/refund            -- Refund ticket (host/co-host)
POST /v1/payments/stripe-webhook           -- Stripe webhook (signature verified, no JWT)

-- Recurring
POST /v1/event-series                      -- Create series
GET  /v1/event-series/:seriesId            -- Get series + instances
PUT  /v1/event-series/:seriesId            -- Update template (host/co-host)
DELETE /v1/event-series/:seriesId          -- End series (creator only)

-- Notifications
POST /v1/events/:eventId/text-blast        -- SMS blast (host/co-host, 3/event shared pool)

-- Calendar
GET  /v1/events/:eventId/calendar.ics      -- Download ICS file (RSVP'd users)
```

### SvelteKit Server Routes

The SvelteKit frontend uses `+page.server.ts` load functions and form actions that call the backend API. It does NOT access D1 directly.

```typescript
// Example: src/routes/e/[slug]/+page.server.ts
export async function load({ params, cookies, fetch }) {
	// Fetch public event data from shared backend (no auth needed)
	const res = await fetch(`${BACKEND_URL}/v1/events/by-slug/${params.slug}`);
	const event = await res.json();

	// Check for authenticated session (JWT stored in HttpOnly cookie)
	const accessToken = await getAccessToken(cookies);

	// If authenticated and RSVP'd, fetch guest list (if host enabled it)
	let guestList = null;
	if (accessToken && event.show_guest_list) {
		const glRes = await fetch(`${BACKEND_URL}/v1/events/${event.event_id}/guest-list`, {
			headers: { Authorization: `Bearer ${accessToken}` }
		});
		guestList = await glRes.json();
	}

	return { event, guestList };
}
```

### Authentication Flow (Web-Specific)

**All interactions require phone verification.** There are no anonymous sessions. The SvelteKit app wraps the backend's JWT auth in HttpOnly cookies for web security:

```
1. Visitor views event page (no auth needed — public endpoint)
2. Visitor taps "RSVP" or "Get Ticket"
3. Phone verification prompt appears
4. SvelteKit server route calls POST /v1/auth/phone/send-code
5. User enters SMS code
6. SvelteKit server route calls POST /v1/auth/phone/verify-code
7. Backend returns { access_token, refresh_token, user }
8. SvelteKit stores refresh_token in HttpOnly secure cookie
9. SvelteKit stores access_token in KV session (short-lived)
10. Original action (RSVP/ticket purchase) completes
11. Subsequent requests: SvelteKit server routes read tokens from cookie/KV,
    attach Authorization header when calling backend API
12. On access_token expiry: SvelteKit auto-calls POST /v1/auth/refresh

Client-side JavaScript NEVER sees JWT tokens — all API calls go through
SvelteKit server routes which attach auth headers server-side.
```

This is more secure than the Flutter app's approach (which stores tokens on-device) because web apps are vulnerable to XSS. HttpOnly cookies + server-side token management is the web best practice.

**No anonymous middleware.** The previous plan included `requireSession` middleware and `X-Session-Token` headers for cookie-based anonymous sessions. This has been eliminated. The only two auth levels are: `publicEvent` (no auth, read-only event page data) and `requireAuth` (JWT Bearer token for all interactions).

---

## Cron Schedule

| Job              | Schedule          | Purpose                                                                                                                                                |
| ---------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TTL Cleanup      | Every hour        | Delete expired events (R2 first, then D1), photos, comments, tickets, QR codes, OG images, KV short links. Insert tombstone row before deleting event. |
| Reminder - 24hr  | Every 15 minutes  | Send 24-hour reminders for upcoming events                                                                                                             |
| Reminder - 1hr   | Every 5 minutes   | Send 1-hour reminders for upcoming events                                                                                                              |
| Gallery Notify   | Daily at 10am ET  | Send gallery download links to hosts (1 day after event)                                                                                               |
| Series Generator | Daily at midnight | Generate recurring event instances 4 weeks ahead                                                                                                       |
