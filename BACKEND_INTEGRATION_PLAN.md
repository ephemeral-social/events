# Backend Integration Plan — Events Web App

**Purpose:** Single source of truth for all backend changes needed to support the events web app. Hand this to a Claude Code agent working on `ephemeral_backend/` or `ephemeral_flutter/`.

**Status:** FINAL — All review findings resolved. Ready for implementation.

---

## Overview

The events web app (`ephemeral_events_web/`) is a SvelteKit frontend that calls the existing `ephemeral_backend/` API. This document tracks every backend modification needed — schema migrations, new endpoints, extended endpoints, new cron jobs, and new env vars.

**Golden rule:** Nothing here breaks the Flutter app. All changes are additive. Existing endpoints, tables, and behavior remain unchanged.

---

## 0. Decisions

| Question                          | Decision                                                                                                                                                                                                                               | Rationale                                                                                                                                                                                     |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous (name-only) RSVP?       | **No.** Phone verification required for all RSVPs.                                                                                                                                                                                     | Eliminates cookie identity issues, duplicate RSVPs, and massive complexity (anonymous_guests table, web_rsvps table, session middleware, upgrade path). Phone verification is bot protection. |
| Slug/short_code for all events?   | Only when explicitly provided (web creates them, Flutter doesn't)                                                                                                                                                                      | Don't impose web concepts on the Flutter flow                                                                                                                                                 |
| RSVP table?                       | Use existing `event_invites` directly. All users have `user_id`.                                                                                                                                                                       | No anonymous guests means composite PK (event_id, user_id) works.                                                                                                                             |
| Public event endpoint?            | New `/v1/events/by-slug/:slug` route (separate from existing)                                                                                                                                                                          | Don't modify existing auth-required endpoint                                                                                                                                                  |
| Token cost for web events?        | Free (`creation_cost = 0`). Check for `slug` presence to determine source.                                                                                                                                                             | Token economy is a Flutter/full-platform feature                                                                                                                                              |
| Guest list visibility?            | Hidden by default. Host toggles `show_guest_list`. Host/co-hosts always see all statuses including declines. Other guests see Going + Maybe only.                                                                                      | Privacy-first default                                                                                                                                                                         |
| RSVP + ticket purchase?           | Separate actions. Host dashboard shows who RSVP'd Going but hasn't bought a ticket.                                                                                                                                                    | Better planning for hosts                                                                                                                                                                     |
| Plus-ones?                        | Exposed in RSVP flow. Each plus-one needs own ticket (ticketed events). Plus-ones count toward max_attendees hard cap.                                                                                                                 | Hard cap enforced                                                                                                                                                                             |
| Ticket identity check?            | None. Tickets are bearer instruments — whoever shows valid QR gets in.                                                                                                                                                                 | Simpler check-in, no ID verification                                                                                                                                                          |
| Co-hosts?                         | MVP. Full host permissions except event deletion. Added via shareable invite link.                                                                                                                                                     | Creator-only deletion protects event ownership                                                                                                                                                |
| Text blasts?                      | 3 total per event, shared pool among host + all co-hosts.                                                                                                                                                                              | Prevents SMS spam                                                                                                                                                                             |
| Event cancellation?               | Irreversible. Auto-refunds all tickets. SMS to all RSVP'd guests.                                                                                                                                                                      | Clean, no ambiguity                                                                                                                                                                           |
| Event editing?                    | Everything editable freely. SMS to ticket holders on date/time/location changes.                                                                                                                                                       | Flexible for hosts, transparent for guests                                                                                                                                                    |
| Slug immutability?                | Strict. No editing after creation. Both slug and short_code are UNIQUE. Short URL is primary sharing mechanism.                                                                                                                        | Prevents broken links                                                                                                                                                                         |
| Check-in?                         | Ticketed events only. No check-in for simple events.                                                                                                                                                                                   | Reduces scope                                                                                                                                                                                 |
| Event discovery?                  | None. Link-based distribution only.                                                                                                                                                                                                    | MVP scope                                                                                                                                                                                     |
| Post-event page?                  | Live for 7 days with "event has ended" banner, countdown to deletion, privacy dashboard. Comments and photo uploads still active. After deletion: permanent tombstone page ("deleted permanently, forever, and ever").                 | Privacy philosophy                                                                                                                                                                            |
| Privacy dashboard?                | Always visible on event page, real-time updates. Not just post-event.                                                                                                                                                                  | Reinforces privacy marketing claims at all times                                                                                                                                              |
| EXIF stripping?                   | Returns detailed proof of what was stripped (GPS coordinates, camera model, timestamp, etc.). Not just "metadata removed."                                                                                                             | Receipts, not trust                                                                                                                                                                           |
| Cover photo?                      | Optional. Placeholder pattern when absent. Changeable anytime.                                                                                                                                                                         | Flexible                                                                                                                                                                                      |
| Cost details visibility?          | Visible only after RSVP (any status). Payment handle visible to Going + Maybe only. Can't make it guests don't see payment handles.                                                                                                    | Privacy for host financial info                                                                                                                                                               |
| Location hidden toggle?           | Exists, defaults OFF. When ON, location hidden until after RSVP.                                                                                                                                                                       | Surprise events                                                                                                                                                                               |
| SMS opt-out?                      | Standard Twilio STOP handling (global opt-out).                                                                                                                                                                                        | Industry standard, TCPA compliant                                                                                                                                                             |
| Recurring auto-RSVP notification? | Silent. Guests find out via normal 24hr/1hr reminders.                                                                                                                                                                                 | Reduces SMS noise                                                                                                                                                                             |
| Recurring instance changes?       | SMS only on date/time/location changes. Description-only edits are silent.                                                                                                                                                             | Only notify on material changes                                                                                                                                                               |
| Ticket SMS?                       | Plain SMS with link to ticket page (not MMS). Purchase confirmation links to ticket. Event changes link to event page via short URL.                                                                                                   | Cost-effective                                                                                                                                                                                |
| "Can't make it" mapping?          | Maps to `'declined'` in DB. UI shows "Can't make it" but backend stores `'declined'`.                                                                                                                                                  | Existing `event_invites.status` CHECK constraint allows: 'pending', 'going', 'maybe', 'declined'. No new values needed.                                                                       |
| Ticket ID format?                 | **ULID** (matching all other IDs in the backend). NOT nanoid.                                                                                                                                                                          | Consistency. ULIDs are 26 chars, time-sortable, and match every other ID in the system.                                                                                                       |
| `event_photos` table?             | **Reuse existing table.** The backend already has `event_photos` with `photo_id`, `event_id`, `user_id`, `r2_key`, `created_at`. Gallery endpoints query this table directly. Add new columns for EXIF proof.                          | Don't create a duplicate table.                                                                                                                                                               |
| Tombstone after deletion?         | **Soft-delete with `event_tombstones` table.** When TTL cleanup deletes an event, insert a tombstone row (slug, short_code, title, deleted_at). The public endpoint checks tombstones when no live event is found.                     | Preserves slug mapping so the URL still resolves to "deleted permanently, forever" page.                                                                                                      |
| RSVP with active tickets?         | If user changes RSVP from Going to Can't Make It and has active tickets: **tickets remain active** (bearer instruments). User is warned that tickets are non-refundable unless host issues refund. Changing RSVP does not auto-refund. | Host can manually refund via dashboard if desired.                                                                                                                                            |
| Capacity rejection?               | **All-or-nothing.** If user requests 3 plus-ones but only 1 spot remains, reject the entire RSVP with remaining capacity in the error. User must reduce plus-ones to fit.                                                              | Prevents partial-fill confusion.                                                                                                                                                              |
| `allow_plus_ones`?                | Check existing `events.allow_plus_ones` column. If `0`, reject any RSVP with `plus_ones > 0`.                                                                                                                                          | Respects existing host setting.                                                                                                                                                               |
| Cohost invite expiry?             | **72 hours.** Invite tokens expire after 72 hours. `event_cohosts.expires_at` column enforced on accept.                                                                                                                               | Prevents stale invite links circulating indefinitely.                                                                                                                                         |
| Recurring timezone?               | `event_series.timezone` column (IANA format, e.g., `America/New_York`). All instance generation uses this timezone for DST-safe scheduling.                                                                                            | Prevents 1-hour drift across DST boundaries.                                                                                                                                                  |
| Recurrence rule format?           | **iCal RRULE** subset: `FREQ=WEEKLY;BYDAY=TU`, `FREQ=WEEKLY;INTERVAL=2;BYDAY=TH`, `FREQ=MONTHLY;BYDAY=1SA`. Stored as text, parsed by backend.                                                                                         | Industry standard, well-documented, handles edge cases.                                                                                                                                       |
| Visibility mapping?               | Web 'private' = backend 'invites'.                                                                                                                                                                                                     | Existing schema has 'public'/'followers'/'invites', no 'private' value.                                                                                                                       |
| CORS?                             | Exact origin allowlist, credentials: true. See Section 8.                                                                                                                                                                              | Security requirement                                                                                                                                                                          |
| My-events dashboard?              | MVP. Shows events hosting + events attending.                                                                                                                                                                                          | Essential user experience                                                                                                                                                                     |
| Event creation?                   | Any phone-verified user. No gates, no waitlist.                                                                                                                                                                                        | Low friction                                                                                                                                                                                  |
| Bulk zip download?                | Fast-follow, not MVP. Individual photo download is MVP.                                                                                                                                                                                | Reduces scope                                                                                                                                                                                 |

---

## 1. Schema Migrations

All migrations run in `ephemeral_backend/` against the shared D1 database.

**CRITICAL: One ALTER TABLE per migration file.** D1 migrations are NOT transactional across statements. Each file must be independently safe to retry. Name sequentially: `0XX_description.sql`.

### Migration 001: events — add slug

```sql
ALTER TABLE events ADD COLUMN slug TEXT;
```

### Migration 002: events — add short_code

```sql
ALTER TABLE events ADD COLUMN short_code TEXT;
```

### Migration 003: events — add location_hidden

```sql
-- Defaults OFF. When ON, location is hidden until user RSVPs.
ALTER TABLE events ADD COLUMN location_hidden INTEGER DEFAULT 0;
```

### Migration 004: events — add show_guest_list

```sql
-- Defaults OFF (hidden). Host can toggle ON to show names to RSVP'd guests.
ALTER TABLE events ADD COLUMN show_guest_list INTEGER DEFAULT 0;
```

### Migration 005: events — add web_event_type

```sql
-- 'simple' (peer-to-peer payments) or 'ticketed' (Stripe Connect)
ALTER TABLE events ADD COLUMN web_event_type TEXT DEFAULT 'simple';
```

### Migration 006: events — add ticket_price_cents

```sql
ALTER TABLE events ADD COLUMN ticket_price_cents INTEGER;
```

### Migration 007: events — add payment_handle

```sql
-- Venmo @handle, Cash App $cashtag, or Zelle phone/email
ALTER TABLE events ADD COLUMN payment_handle TEXT;
```

### Migration 008: events — add payment_platform

```sql
-- 'venmo', 'cashapp', or 'zelle'
ALTER TABLE events ADD COLUMN payment_platform TEXT;
```

### Migration 009: events — add series_id

```sql
ALTER TABLE events ADD COLUMN series_id TEXT;
```

### Migration 010: events — add cached_per_person_cents

```sql
-- Cached cost-per-person to avoid recomputing on every page load
-- Recalculated when costs change or Going count changes
ALTER TABLE events ADD COLUMN cached_per_person_cents INTEGER;
```

### Migration 011: events — create indexes

```sql
-- SQLite treats NULLs as distinct in UNIQUE indexes.
-- Flutter events have slug=NULL and short_code=NULL — no conflicts.
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_short_code ON events(short_code);
CREATE INDEX IF NOT EXISTS idx_events_series_id ON events(series_id);
```

### Migration 012: users — add stripe_account_id

```sql
ALTER TABLE users ADD COLUMN stripe_account_id TEXT;
```

### Migration 013: event_invites — add display_name

```sql
-- Name shown on guest list (set during web RSVP)
ALTER TABLE event_invites ADD COLUMN display_name TEXT;
```

### Migration 014: event_invites — add payment_status

```sql
-- 'none' (default), 'unpaid', 'marked_paid' — for cost sharing reconciliation
ALTER TABLE event_invites ADD COLUMN payment_status TEXT DEFAULT 'none';
```

### Migration 015: event_invites — add checked_in

```sql
-- Ticketed events: 1 = checked in at door
ALTER TABLE event_invites ADD COLUMN checked_in INTEGER DEFAULT 0;
```

### Migration 016: event_invites — add checked_in_at

```sql
ALTER TABLE event_invites ADD COLUMN checked_in_at TIMESTAMP;
```

### Migration 017: event_invites — add series_auto_rsvp

```sql
-- 1 = "always going" for recurring series (auto-RSVP to new instances)
ALTER TABLE event_invites ADD COLUMN series_auto_rsvp INTEGER DEFAULT 0;
```

### Migration 018: New event_cohosts table

```sql
CREATE TABLE IF NOT EXISTS event_cohosts (
    event_id TEXT NOT NULL REFERENCES events(event_id),
    user_id TEXT NOT NULL REFERENCES users(user_id),
    invite_token TEXT UNIQUE NOT NULL,
    invited_by_user_id TEXT NOT NULL REFERENCES users(user_id),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_cohosts_token ON event_cohosts(invite_token);
CREATE INDEX IF NOT EXISTS idx_event_cohosts_user ON event_cohosts(user_id);
```

**Co-host invite flow:**

1. Host/co-host generates invite → creates `event_cohosts` row with `status='pending'`, unique `invite_token` (crypto-random, 32 bytes hex), and `expires_at = now() + 72 hours`
2. Invite link: `ephemeralsocial.com/e/{slug}/cohost/{invite_token}`
3. Recipient taps link → verifies phone if not already logged in → backend validates token AND `expires_at > now()` → sets `status='accepted'`, `accepted_at=now()`
4. Token is single-use — once accepted, expired, or revoked, the link is dead
5. Co-host can be removed by the event creator only

**Permission check helpers:**

```typescript
// Used on all host/co-host endpoints (settings, costs, mark-paid, text-blast, check-in, etc.)
async function requireHostOrCohost(eventId: string, userId: string, db: D1Database): Promise<void> {
	const event = await db
		.prepare('SELECT creator_user_id FROM events WHERE event_id = ?')
		.bind(eventId)
		.first();
	if (!event) throw new NotFoundError('Event not found');
	if (event.creator_user_id === userId) return;
	const cohost = await db
		.prepare(
			"SELECT 1 FROM event_cohosts WHERE event_id = ? AND user_id = ? AND status = 'accepted'"
		)
		.bind(eventId, userId)
		.first();
	if (!cohost) throw new ForbiddenError('Host or co-host access required');
}

// Used ONLY on event deletion
async function requireCreator(eventId: string, userId: string, db: D1Database): Promise<void> {
	const event = await db
		.prepare('SELECT creator_user_id FROM events WHERE event_id = ?')
		.bind(eventId)
		.first();
	if (!event) throw new NotFoundError('Event not found');
	if (event.creator_user_id !== userId)
		throw new ForbiddenError('Only the event creator can do this');
}
```

### Migration 019: New event_costs table

```sql
CREATE TABLE IF NOT EXISTS event_costs (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(event_id),
    description TEXT NOT NULL,
    amount_cents INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_costs_event ON event_costs(event_id);
```

### Migration 020: New event_series table

```sql
CREATE TABLE IF NOT EXISTS event_series (
    id TEXT PRIMARY KEY,
    host_user_id TEXT NOT NULL REFERENCES users(user_id),
    title TEXT NOT NULL,
    recurrence_rule TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    template_data TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_series_host ON event_series(host_user_id);
```

### Migration 021: New event_comments table

```sql
CREATE TABLE IF NOT EXISTS event_comments (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(event_id),
    user_id TEXT NOT NULL REFERENCES users(user_id),
    display_name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_host_update INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_comments_event ON event_comments(event_id);
```

### Migration 022: New tickets table

```sql
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(event_id),
    user_id TEXT NOT NULL REFERENCES users(user_id),
    stripe_checkout_session_id TEXT,
    stripe_payment_intent_id TEXT,
    ticket_number INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,
    stripe_fee_cents INTEGER NOT NULL,
    fee_absorbed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    qr_code_r2_key TEXT,
    purchased_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_status ON tickets(event_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_session_number ON tickets(stripe_checkout_session_id, ticket_number);
```

**Note:** `stripe_payment_intent_id` is NOT unique — a single checkout session purchasing N tickets creates N rows with the same payment_intent_id. Webhook dedup uses the UNIQUE compound index on `(stripe_checkout_session_id, ticket_number)` — if the webhook fires twice, the INSERT for ticket_number 1 of the same session fails with a constraint violation, catching the duplicate. `ticket_number` is 1-indexed within each checkout (1, 2, 3 for a 3-ticket purchase).

### Migration 023: New event_notification_log table

```sql
CREATE TABLE IF NOT EXISTS event_notification_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    event_id TEXT NOT NULL REFERENCES events(event_id),
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_notif_dedup ON event_notification_log(user_id, event_id, notification_type);
```

### Migration 024: New text_blasts table

```sql
CREATE TABLE IF NOT EXISTS text_blasts (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(event_id),
    sent_by_user_id TEXT NOT NULL REFERENCES users(user_id),
    message TEXT NOT NULL,
    recipient_count INTEGER NOT NULL,
    sent_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_text_blasts_event ON text_blasts(event_id);
```

### Migration 025: New event_tombstones table

```sql
CREATE TABLE IF NOT EXISTS event_tombstones (
    slug TEXT PRIMARY KEY,
    short_code TEXT,
    title TEXT NOT NULL,
    deleted_at TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_tombstones_short_code ON event_tombstones(short_code);
```

**Purpose:** When TTL cleanup deletes an event, insert a tombstone row preserving slug → title mapping. The public event endpoint checks tombstones when no live event is found and returns the permanent "This event has been deleted permanently, forever, and ever" page. Without this, the slug URL returns 404 after deletion — breaking the privacy messaging.

### Migration 026: event_photos — add exif_proof

```sql
-- Stores the JSON list of metadata fields that were stripped
ALTER TABLE event_photos ADD COLUMN exif_proof TEXT;
```

**Note:** The `event_photos` table already exists in the backend with columns: `photo_id` (ULID PK), `event_id`, `uploaded_by_user_id`, `media_r2_key`, `media_mime_type`, `media_size_bytes`, `media_width`, `media_height`, `caption`, `expires_at`, `created_at`. The gallery endpoints use this existing table directly. The `exif_proof` column stores a JSON array of stripped field descriptions (e.g., `["GPS: 40.7128, -74.0060", "Camera: iPhone 15 Pro", "DateTime: 2026-03-15 21:34:12"]`).

**Flutter impact for ALL migrations:** None. All new columns on existing tables are nullable with defaults. All new tables are unreferenced by Flutter. Existing behavior is unchanged.

---

## 2. Middleware Strategy

**Two auth levels** — every endpoint must declare which one it uses:

| Middleware       | Accepts                                       | Use for                                                                        |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| `requireAuth(c)` | JWT Bearer token only                         | All authenticated actions: RSVP, host actions, comments, photos, tickets, etc. |
| `publicEvent(c)` | No auth. Validates event exists, not deleted. | Public event page view (`by-slug` endpoint)                                    |

**No anonymous session middleware.** All RSVPs require phone verification → JWT token.

**Host/co-host permission:** A helper function (`requireHostOrCohost`) used inside route handlers. Checks `events.creator_user_id` or `event_cohosts` with `status='accepted'`.

**Creator-only permission:** A helper function (`requireCreator`) used only on event deletion and co-host removal. Only the original creator.

---

## 3. New Backend Endpoints

### Public Endpoints (publicEvent middleware)

| Method | Route                      | Handler File       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------ | -------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/v1/events/by-slug/:slug` | `events/public.ts` | SSR event page data. Returns: event details, RSVP counts (going/maybe), privacy dashboard stats (photo count, metadata stripped), cover photo URL. Does NOT return: guest names, cost details, payment handles. Respects `location_hidden` (returns location only if `location_hidden=0`). **Tombstone fallback:** if no live event matches the slug, checks `event_tombstones` table. If found, returns `{ deleted: true, title, deleted_at }` so the frontend renders "This event has been deleted permanently, forever, and ever." |

### Authenticated Endpoints (requireAuth middleware)

#### RSVP & Guest List

| Method | Route                            | Handler File             | Permission      | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------ | -------------------------------- | ------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/events/:eventId/web-rsvp`   | `web-rsvp/create.ts`     | Any authed user | RSVP to event. Body: `{ status, display_name, plus_ones }`. **Status mapping:** UI "Can't make it" → DB `'declined'`, UI "Going" → `'going'`, UI "Maybe" → `'maybe'`. Creates `event_invites` row with `status` set directly (NOT 'pending'). Checks `allow_plus_ones` — if `0`, rejects any `plus_ones > 0`. Enforces `max_attendees` hard cap: counts all Going RSVPs + their plus_ones. **All-or-nothing:** if `1 + plus_ones` exceeds remaining capacity, reject entire RSVP with `{ error: "at_capacity", remaining: N }`. Returns 409 if at capacity. |
| PUT    | `/v1/events/:eventId/web-rsvp`   | `web-rsvp/update.ts`     | RSVP owner      | Change RSVP status or plus_ones. Recalculates `cached_per_person_cents` if Going count changes. Re-checks capacity if changing to Going or increasing plus_ones. **If changing from Going to 'declined' and user has active tickets:** tickets remain active (bearer instruments). Response includes `{ warning: "active_tickets_remain", ticket_count: N }` so frontend can show a warning. Host can manually refund via dashboard.                                                                                                                        |
| GET    | `/v1/events/:eventId/guest-list` | `web-rsvp/guest-list.ts` | Any authed user | If requester is host/co-host: returns all RSVPs including Can't make it, plus ticket purchase status. If `show_guest_list=1` and requester has RSVP'd: returns Going + Maybe names only. If `show_guest_list=0` and requester is not host/co-host: returns 403. Paginated.                                                                                                                                                                                                                                                                                  |
| GET    | `/v1/events/:eventId/my-rsvp`    | `web-rsvp/my-rsvp.ts`    | Any authed user | Returns current user's RSVP for this event (status, plus_ones, display_name) or 404 if not RSVP'd. Used by frontend to render correct state.                                                                                                                                                                                                                                                                                                                                                                                                                |

#### Event Settings & Dashboard

| Method | Route                          | Handler File          | Permission      | Description                                                                                     |
| ------ | ------------------------------ | --------------------- | --------------- | ----------------------------------------------------------------------------------------------- |
| PUT    | `/v1/events/:eventId/settings` | `events/settings.ts`  | Host/co-host    | Toggle `show_guest_list`, `location_hidden`.                                                    |
| GET    | `/v1/my-events`                | `events/my-events.ts` | Any authed user | User dashboard: events hosting (created + co-hosting) and events attending (RSVP'd). Paginated. |

#### Co-Hosts

| Method | Route                                 | Handler File        | Permission      | Description                                                                                                                                                                                                  |
| ------ | ------------------------------------- | ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/v1/events/:eventId/cohosts/invite`  | `cohosts/invite.ts` | Host/co-host    | Generate co-host invite link. Returns `{ invite_url, invite_token }`.                                                                                                                                        |
| POST   | `/v1/events/:eventId/cohosts/accept`  | `cohosts/accept.ts` | Any authed user | Accept co-host invite. Body: `{ invite_token }`. Validates: token matches event, `status='pending'`, `expires_at > now()`. Sets `status='accepted'`, `accepted_at=now()`. Returns 410 Gone if token expired. |
| DELETE | `/v1/events/:eventId/cohosts/:userId` | `cohosts/remove.ts` | Creator only    | Remove a co-host. Sets `status='removed'`.                                                                                                                                                                   |
| GET    | `/v1/events/:eventId/cohosts`         | `cohosts/list.ts`   | Host/co-host    | List accepted co-hosts.                                                                                                                                                                                      |

#### Cost Sharing (Simple Events)

| Method | Route                               | Handler File            | Permission   | Description                                                                                                      |
| ------ | ----------------------------------- | ----------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/events/:eventId/costs`         | `payments/costs.ts`     | Host/co-host | Add cost item. Recalculates `cached_per_person_cents` (total costs / Going count).                               |
| GET    | `/v1/events/:eventId/costs`         | `payments/costs.ts`     | RSVP'd user  | List cost items + `cached_per_person_cents`. Payment handle included only if requester status is Going or Maybe. |
| PUT    | `/v1/events/:eventId/costs/:costId` | `payments/costs.ts`     | Host/co-host | Update cost item. Recalculates split.                                                                            |
| DELETE | `/v1/events/:eventId/costs/:costId` | `payments/costs.ts`     | Host/co-host | Delete cost item. Recalculates split.                                                                            |
| POST   | `/v1/events/:eventId/mark-paid`     | `payments/mark-paid.ts` | Host/co-host | Mark guest as paid. Body: `{ user_id }`. Updates `event_invites.payment_status='marked_paid'`.                   |

#### Stripe / Ticketing

| Method | Route                            | Handler File                  | Permission                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------ | -------------------------------- | ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| POST   | `/v1/payments/stripe-onboard`    | `payments/stripe-onboard.ts`  | Any authed user                         | Start Stripe Connect Express onboarding. Returns Stripe-hosted onboarding URL.                                                                                                                                                                                                                                                                                                                                                                                                       |
| GET    | `/v1/payments/stripe-status`     | `payments/stripe-status.ts`   | Any authed user                         | Check if user's Stripe Connect account is fully onboarded (`charges_enabled && payouts_enabled`).                                                                                                                                                                                                                                                                                                                                                                                    |
| POST   | `/v1/events/:eventId/checkout`   | `payments/stripe-checkout.ts` | Any authed user                         | Create Stripe Checkout session. Body: `{ quantity }`. Validates `allow_plus_ones`. Quantity must be <= user's `plus_ones + 1`. Validates capacity (all-or-nothing). Checks for existing active tickets (`SELECT COUNT(*) FROM tickets WHERE event_id=? AND user_id=? AND status='active'`). **Idempotency key = `${event_id}:${user_id}`** (deterministic, prevents double-click duplicates). Stores `quantity` in Stripe session metadata for webhook. Returns Stripe Checkout URL. |
| GET    | `/v1/events/:eventId/my-ticket`  | `tickets/my-ticket.ts`        | Any authed user                         | Get current user's ticket(s) for this event. Frontend polls after checkout redirect (up to 10s) waiting for webhook to create ticket.                                                                                                                                                                                                                                                                                                                                                |
| POST   | `/v1/tickets/:ticketId/verify`   | `tickets/verify.ts`           | Host/co-host                            | Verify ticket QR code on scan. Returns: `{ valid, status, event_id }`. Status: 'active', 'used', 'refunded', 'not_found', 'wrong_event'.                                                                                                                                                                                                                                                                                                                                             |
| POST   | `/v1/tickets/:ticketId/check-in` | `tickets/check-in.ts`         | Host/co-host                            | Mark ticket as used. Sets `status='used'`. Returns guest info for confirmation screen. Idempotent — re-scanning a used ticket returns "Already checked in at [time]".                                                                                                                                                                                                                                                                                                                |
| POST   | `/v1/events/:eventId/refund`     | `payments/refund.ts`          | Host/co-host                            | Refund a specific ticket. Body: `{ ticket_id }`. For multi-ticket purchases: issues a **partial refund** via `stripe.refunds.create({ payment_intent, amount: single_ticket_amount_cents })`. Sets the specific ticket's `status='refunded'`. Other tickets from the same purchase remain active.                                                                                                                                                                                    |
| POST   | `/v1/payments/stripe-webhook`    | `payments/stripe-webhook.ts`  | **No auth — Stripe signature verified** | Handle Stripe webhook events. See Section 5 for details.                                                                                                                                                                                                                                                                                                                                                                                                                             |

#### Photo Gallery

| Method | Route                        | Handler File        | Permission                | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------ | ---------------------------- | ------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/events/:eventId/photos` | `gallery/upload.ts` | RSVP'd user (Going/Maybe) | Upload photo. Two-step EXIF handling: (1) parse EXIF with `exif-reader` to extract field list for proof, (2) strip + upload to R2 via Cloudflare Images. Creates row in **existing `event_photos` table** with `exif_proof` JSON column. Returns detailed proof: list of metadata fields that were removed (GPS lat/lng, camera model, datetime, software, etc.). Max 200 photos per event (counted from `event_photos`). Max 15MB per photo. Accepts JPEG, PNG, HEIC, WebP. |
| GET    | `/v1/events/:eventId/photos` | `gallery/list.ts`   | RSVP'd user               | List event photos from **existing `event_photos` table**. Returns R2 URLs + upload timestamps + EXIF proof. Paginated.                                                                                                                                                                                                                                                                                                                                                       |

#### Comments / Event Wall

| Method | Route                          | Handler File               | Permission  | Description                                                                                           |
| ------ | ------------------------------ | -------------------------- | ----------- | ----------------------------------------------------------------------------------------------------- |
| POST   | `/v1/events/:eventId/comments` | `event-comments/create.ts` | RSVP'd user | Post comment (any RSVP'd user) or host update (`is_host_update=1`, host/co-host only). Max 500 chars. |
| GET    | `/v1/events/:eventId/comments` | `event-comments/list.ts`   | RSVP'd user | List comments chronologically. Paginated.                                                             |

#### Recurring Events

| Method | Route                        | Handler File       | Permission      | Description                                                                                                                                                                                                                                         |
| ------ | ---------------------------- | ------------------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/event-series`           | `events/series.ts` | Any authed user | Create recurring series. Body: `{ title, recurrence_rule, timezone, template_data }`. `recurrence_rule` is iCal RRULE format (e.g., `FREQ=WEEKLY;BYDAY=TU`). `timezone` is IANA format (e.g., `America/New_York`). Creates series + first instance. |
| GET    | `/v1/event-series/:seriesId` | `events/series.ts` | Any authed user | Get series metadata + list of instances (past and upcoming).                                                                                                                                                                                        |
| PUT    | `/v1/event-series/:seriesId` | `events/series.ts` | Host/co-host    | Update series template. Does NOT retroactively change existing instances.                                                                                                                                                                           |
| DELETE | `/v1/event-series/:seriesId` | `events/series.ts` | Creator only    | End series. Sets `active=0`. Existing instances remain. No new instances generated.                                                                                                                                                                 |

#### Notifications

| Method | Route                            | Handler File                  | Permission   | Description                                                                                                                                                                                              |
| ------ | -------------------------------- | ----------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/v1/events/:eventId/text-blast` | `notifications/text-blast.ts` | Host/co-host | Send SMS to all Going + Maybe guests. Body: `{ message }`. Max 500 chars. **3 total per event** (shared pool, app-enforced by counting `text_blasts` rows for this event). Returns 429 if limit reached. |

#### Calendar Export

| Method | Route                              | Handler File           | Permission  | Description                               |
| ------ | ---------------------------------- | ---------------------- | ----------- | ----------------------------------------- |
| GET    | `/v1/events/:eventId/calendar.ics` | `events/ics-export.ts` | RSVP'd user | Download ICS calendar file for the event. |

### Modified Existing Endpoints

| Endpoint                     | Change                                                                                                                                                                                                                                                                                                                          | Flutter Impact                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `POST /v1/events`            | Accept optional `slug`, `short_code`, `web_event_type`, `ticket_price_cents`, `payment_handle`, `payment_platform`, `location_hidden`, `show_guest_list`, `series_id`. If `slug` provided: validate uniqueness, generate `short_code`, store short link in KV, set `creation_cost = 0`. If no `slug`: behave exactly as before. | None — new fields are optional, unset by Flutter.                                                    |
| `GET /v1/events/:eventId`    | Include new fields in response. Include privacy dashboard stats (photo count, metadata fields stripped).                                                                                                                                                                                                                        | None — Freezed ignores unknown JSON keys.                                                            |
| `PUT /v1/events/:eventId`    | Allow updating new fields. If date/time/location changed AND event has sold tickets → enqueue SMS notification to all ticket holders + RSVP'd guests via Queue. Host/co-host permission required (existing host check extended to include co-hosts).                                                                            | None — Flutter doesn't send these fields.                                                            |
| `DELETE /v1/events/:eventId` | **Creator-only** (NOT co-hosts). If ticketed with active tickets → auto-refund all via Stripe (async via Queue). SMS cancellation notice to all RSVP'd guests. Irreversible — no undelete.                                                                                                                                      | None — existing behavior preserved. New side effects only trigger for events with web-specific data. |

**Note:** The existing `GET /v1/events/:eventId/guests` endpoint is NOT modified. It continues to query `event_invites` as before. The new `/guest-list` endpoint adds web-specific logic (show_guest_list toggle, host sees declines, pagination).

---

## 4. Input Validation & Sanitization

All user-provided strings MUST be sanitized before storage:

| Field                        | Max Length | Sanitization                                        | Validation                                                                                            |
| ---------------------------- | ---------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `event_invites.display_name` | 50 chars   | Strip HTML tags. Trim whitespace.                   | Reject if empty after trim.                                                                           |
| `event_comments.content`     | 500 chars  | Strip HTML tags. Trim whitespace.                   | Reject if empty after trim.                                                                           |
| `events.slug`                | 60 chars   | Lowercase, strip non-alphanumeric (except hyphens). | Must match `^[a-z0-9][a-z0-9-]*[a-z0-9]$`.                                                            |
| `events.title`               | 100 chars  | Strip HTML tags. Trim whitespace.                   | Reject if empty after trim.                                                                           |
| `events.description`         | 2000 chars | Strip HTML tags. Trim whitespace.                   | Optional (can be empty).                                                                              |
| `text_blasts.message`        | 500 chars  | Strip HTML tags.                                    | No URLs allowed (prevent phishing via host SMS). Reject if contains `http://`, `https://`, or `www.`. |
| `event_costs.description`    | 100 chars  | Strip HTML tags. Trim whitespace.                   | Reject if empty after trim.                                                                           |
| `events.payment_handle`      | 50 chars   | Trim whitespace.                                    | Must start with `@` (Venmo), `$` (Cash App), or be a valid phone/email (Zelle).                       |
| `event_invites.plus_ones`    | —          | —                                                   | Integer >= 0, max 10.                                                                                 |

---

## 5. Stripe Robustness

### Checkout Flow

1. Validate: user has RSVP'd to this event (status = 'going' or 'maybe').
2. Validate: `events.allow_plus_ones` — if `0`, reject any `quantity > 1`.
3. Validate: `quantity` <= user's `plus_ones + 1` (self + declared plus-ones).
4. Validate: capacity — `current Going count + current Going plus_ones + quantity` <= `max_attendees` (if set). **All-or-nothing:** if `quantity` exceeds remaining capacity, reject entirely (don't partially fill). Return remaining capacity in error response.
5. Check if user already has `active` tickets for this event. If `existing_count >= quantity`, return existing tickets (don't create new checkout).
6. Create Stripe Checkout session with `quantity`, **`idempotency_key: ${event_id}:${user_id}`** (deterministic — same user + event always produces same key, preventing duplicate checkouts from double-clicks).
7. On success redirect, frontend polls `GET /v1/events/:eventId/my-ticket` for up to 10 seconds.

### Fee Absorption Race Condition

Two concurrent checkouts can both read "45 active tickets" and both conclude they're within the first 50. Mitigation: **optimistic check with post-payment correction.**

1. At checkout creation time, read the current ticket count and set the price optimistically.
2. In the webhook handler (after payment), re-read the actual ticket count. If the count crossed 50 between checkout creation and payment completion, the price difference is small enough to absorb (max exposure: a few tickets at $1.15 each = negligible).
3. This is acceptable because: (a) concurrent purchases on small social events are rare, (b) the maximum financial exposure per event is already capped at $57.50, (c) D1 doesn't support SELECT FOR UPDATE.

### Webhook Handling

1. Verify `stripe-signature` header using `STRIPE_WEBHOOK_SECRET`. Reject on failure with 400.
2. On **`checkout.session.completed`** (NOT `payment_intent.succeeded` — Checkout Sessions are the right event for this flow):
   - Extract `session.id`, `session.payment_intent`, and `session.metadata.quantity` from the event.
   - Check `stripe_checkout_session_id` against `tickets` table. If tickets already exist for this session → webhook retry, return 200 OK.
   - Create ticket row(s) — one per quantity purchased. Each gets its own ULID as `id`, sequential `ticket_number` (1, 2, 3...), its own QR code.
   - Compound UNIQUE index `(stripe_checkout_session_id, ticket_number)` prevents duplicates on webhook retry.
   - Enqueue QR code generation (SVG, stored in R2 at `tickets/{ticket_id}/qr.svg`).
   - Enqueue SMS: "Your ticket for [Event]: ephemeralsocial.com/e/{slug}/ticket/{ticket_id}" (link to ticket page, not MMS). One SMS per checkout, not per ticket.
3. On `charge.refunded`:
   - Find ticket(s) by `stripe_payment_intent_id`, set `status='refunded'`.
   - **Partial refunds:** If host refunds a single ticket from a multi-ticket purchase, use `stripe.refunds.create({ payment_intent, amount: single_ticket_amount_cents })` for partial refund. Mark only the specific ticket as 'refunded', not all tickets from that payment.
   - If event is already deleted (expired), still process refund in Stripe but skip DB update — return 200 OK.
4. Log all webhook events: `{ event_type, checkout_session_id, payment_intent_id, timestamp, processed: true/false }`.

### Fee Absorption Logic

```typescript
async function getTicketPriceForBuyer(event: Event, db: D1Database): Promise<number> {
	// Actual Stripe cost: 2.9% + $0.30 processing + 0.5% Connect platform fee = 3.4% + $0.30
	const stripeCost = Math.ceil(event.ticket_price_cents * 0.034 + 30);

	// Tickets over $25: buyer always pays Stripe cost from ticket 1
	if (event.ticket_price_cents > 2500) {
		return event.ticket_price_cents + stripeCost;
	}

	// Tickets $25 and under: check how many sold
	const result = await db
		.prepare("SELECT COUNT(*) as count FROM tickets WHERE event_id = ? AND status = 'active'")
		.bind(event.event_id)
		.first<{ count: number }>();
	const count = result?.count ?? 0;

	if (count < 50) {
		return event.ticket_price_cents; // First 50: Ephemeral absorbs fee
	} else {
		return event.ticket_price_cents + stripeCost * 2; // 51+: 2x Stripe cost to recoup
	}
}
```

### Auto-Refund on Event Cancellation

```typescript
async function autoRefundAllTickets(
	eventId: string,
	db: D1Database,
	stripe: Stripe
): Promise<void> {
	const tickets = await db
		.prepare(
			"SELECT id, stripe_payment_intent_id, amount_cents FROM tickets WHERE event_id = ? AND status = 'active'"
		)
		.bind(eventId)
		.all();

	// Group tickets by payment_intent to handle multi-ticket purchases correctly
	const byPaymentIntent = new Map<string, typeof tickets.results>();
	for (const ticket of tickets.results) {
		const pi = ticket.stripe_payment_intent_id;
		if (!pi) continue;
		if (!byPaymentIntent.has(pi)) byPaymentIntent.set(pi, []);
		byPaymentIntent.get(pi)!.push(ticket);
	}

	for (const [paymentIntentId, piTickets] of byPaymentIntent) {
		try {
			// Full refund of the entire payment intent (covers all tickets in that purchase)
			await stripe.refunds.create({ payment_intent: paymentIntentId });
			// Mark all tickets from this purchase as refunded
			for (const ticket of piTickets) {
				await db
					.prepare("UPDATE tickets SET status = 'refunded' WHERE id = ?")
					.bind(ticket.id)
					.run();
			}
		} catch (err) {
			// Log error but continue refunding remaining payment intents
			console.error(`Refund failed for payment_intent ${paymentIntentId}:`, err);
		}
	}
}
```

---

## 6. Processing Architecture

| Operation                   | Approach                                                                                                                                                                                                                                                                                                                                                                                                     | Sync/Async |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| EXIF stripping + proof      | **Two-step:** (1) Parse EXIF headers from uploaded bytes using `exif-reader` or `piexifjs` to extract metadata fields BEFORE stripping. Store the extracted field list as JSON in `event_photos.exif_proof`. (2) Upload stripped image to R2 via Cloudflare Images transform (which strips EXIF automatically). The proof comes from step 1, not from CF Images (CF Images doesn't report what it stripped). | Sync       |
| Photo resize                | Cloudflare Images variants                                                                                                                                                                                                                                                                                                                                                                                   | Sync       |
| QR code generation          | SVG generation in-request (lightweight, no rasterization needed). Store SVG in R2 at `tickets/{ticket_id}/qr.svg`.                                                                                                                                                                                                                                                                                           | Sync       |
| OG image generation         | Queue consumer or on-demand with R2 caching. Store at `og/{event_id}.png` in R2.                                                                                                                                                                                                                                                                                                                             | Async      |
| SMS sending                 | Queue consumer (prevents Twilio latency from blocking response)                                                                                                                                                                                                                                                                                                                                              | Async      |
| Auto-refund on cancellation | Queue consumer (may be many tickets)                                                                                                                                                                                                                                                                                                                                                                         | Async      |
| Event change notifications  | Queue consumer (fan-out to many recipients)                                                                                                                                                                                                                                                                                                                                                                  | Async      |

---

## 7. New Environment Variables

Added to `wrangler.toml` and/or Cloudflare dashboard:

```toml
[vars]
STRIPE_SECRET_KEY = ""          # Secret, set via CF dashboard
STRIPE_WEBHOOK_SECRET = ""      # Secret, set via CF dashboard
WEB_APP_ORIGIN = "https://ephemeralsocial.com"

[[kv_namespaces]]
binding = "SHORT_LINKS"
id = "xxx"                       # Create via `wrangler kv:namespace create SHORT_LINKS`
```

**Existing vars reused:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, `DB`, `MEDIA` (R2), `CACHE` (KV), `RATE_LIMITS` (KV).

---

## 8. CORS Configuration

Add to the Hono app in `ephemeral_backend/src/index.ts`:

```typescript
import { cors } from 'hono/cors';

app.use(
	'/v1/*',
	cors({
		origin: [env.WEB_APP_ORIGIN], // https://ephemeralsocial.com
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
		maxAge: 86400
	})
);
```

**CRITICAL:** Do NOT use `origin: '*'` with `credentials: true`. Exact origin only.

**Note:** SvelteKit server routes calling the backend server-side (from `+page.server.ts`) bypass CORS entirely — it's server-to-server. Only client-side `fetch()` calls from Svelte components go through the browser and need CORS. Prefer server-side calls where possible.

---

## 9. Rate Limiting

| Endpoint                              | Limit             | Key          | Implementation                         |
| ------------------------------------- | ----------------- | ------------ | -------------------------------------- |
| `POST /v1/events/:eventId/web-rsvp`   | 10/hour           | user_id      | KV-backed                              |
| `POST /v1/events/:eventId/comments`   | 20/hour           | user_id      | KV-backed                              |
| `POST /v1/events/:eventId/text-blast` | 3 total per event | event_id     | App-enforced: count `text_blasts` rows |
| `POST /v1/events/:eventId/photos`     | 50/hour           | user_id      | KV-backed                              |
| `POST /v1/events`                     | 10/hour           | user_id      | KV-backed                              |
| All public GET endpoints              | 100/min           | IP address   | KV-backed                              |
| `POST /v1/auth/phone/send-code`       | 3/hour per phone  | phone number | Already exists                         |

---

## 10. Cron Jobs

| Job                      | Schedule       | File                    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------ | -------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Event reminders (24hr)   | Every 15 min   | `event-reminders.ts`    | Query events starting in 23h45m–24h15m. Join `event_invites` for Going + Maybe users. Check `event_notification_log` dedup before sending.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Event reminders (1hr)    | Every 5 min    | `event-reminders.ts`    | Same, for events starting in 55m–65m.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Gallery notify           | Daily 10am ET  | `gallery-notify.ts`     | Events ended 1 day ago with photos. SMS host with gallery link.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Series generator         | Daily midnight | `series-generator.ts`   | Active series needing instances within 4 weeks. Auto-RSVP "always going" users **silently** (no SMS — normal reminders will fire later). Max 50 instances per cron run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Event data cleanup       | Hourly         | Extend `ttl-cleanup.ts` | **Deletion order matters — R2 first, D1 last.** For events with `expires_at < now`: (1) Delete R2 photos using `media_r2_key` from `event_photos` rows. (2) Delete R2 QR code SVGs using `qr_code_r2_key` from `tickets` rows. (3) Delete R2 OG images at `og/{event_id}.png`. (4) Log any R2 deletion failures (do NOT proceed to D1 deletion for failed R2 keys — retry on next cron run). (5) Only after ALL R2 deletes succeed: insert `event_tombstones` row (slug, short_code, title, deleted_at). (6) Delete D1 rows: `event_comments`, `tickets`, `event_costs`, `event_cohosts`, `text_blasts`, `event_notification_log`, `event_photos`. (7) Delete the `events` row itself. (8) Clean up `SHORT_LINKS` KV entries (though KV TTL handles most of this). **R2 orphan prevention:** If R2 delete fails, the event row stays in D1 (preserving the R2 key references for retry). Weekly reconciliation job scans `event_photos` (column: `media_r2_key`) and `tickets` (column: `qr_code_r2_key`) for events past expiry that still have R2 keys, and retries deletion. |
| R2 orphan reconciliation | Weekly         | `r2-reconciliation.ts`  | Scan `event_photos` and `tickets` tables for rows where the parent event's `expires_at` is past but R2 keys are still present. Retry R2 deletion. Log failures for manual review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

**Idempotency:** All cron jobs must be safe to run multiple times. The `event_notification_log` UNIQUE index prevents duplicate SMS. Deletion uses `WHERE expires_at < now` — already-deleted rows are no-ops.

---

## 11. Library Files

Added to `ephemeral_backend/src/lib/`:

| File               | Purpose                                                                                                                                                                                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exif-strip.ts`    | Two-step EXIF handling: (1) Parse EXIF from raw bytes using `exif-reader` to extract field names + values for proof (GPS coords, camera model, datetime, software, etc.), returning structured JSON. (2) Upload to R2 via Cloudflare Images transform which strips EXIF. The proof JSON is stored in `event_photos.exif_proof`. |
| `qr-generate.ts`   | Generate branded QR codes as SVG (Ephemeral logo centered, rounded modules, H-level error correction).                                                                                                                                                                                                                          |
| `deep-link.ts`     | Generate Venmo/CashApp/Zelle payment deep links with pre-filled amount and event code.                                                                                                                                                                                                                                          |
| `short-link.ts`    | Generate 6-char nanoid short codes (lowercase alphanumeric), store in SHORT_LINKS KV with TTL = event expiry + 24 hours.                                                                                                                                                                                                        |
| `slug.ts`          | Generate human-readable URL slugs from event title + month + year. Deduplicate with `-2`, `-3` suffix. Immutable after creation.                                                                                                                                                                                                |
| `ics-export.ts`    | Generate ICS calendar files for event download.                                                                                                                                                                                                                                                                                 |
| `stripe.ts`        | Stripe Connect onboarding, Checkout session creation, webhook handling, auto-refund.                                                                                                                                                                                                                                            |
| `cohost.ts`        | Co-host invite token generation (crypto-random), permission check helpers.                                                                                                                                                                                                                                                      |
| `privacy-stats.ts` | Compute real-time privacy dashboard stats: photo count, unique metadata fields stripped, comment count, data deletion schedule.                                                                                                                                                                                                 |
| `capacity.ts`      | Enforce max_attendees hard cap. Counts Going RSVPs + their plus_ones. Returns remaining capacity.                                                                                                                                                                                                                               |
| `cost-split.ts`    | Recalculate `cached_per_person_cents`: sum of event_costs / count of Going RSVPs. Called on cost CRUD and RSVP status changes.                                                                                                                                                                                                  |

---

## 12. Pagination Strategy

All list endpoints use cursor-based pagination:

```
GET /v1/events/:eventId/guest-list?limit=50&after=<last_id>
GET /v1/events/:eventId/comments?limit=50&after=<last_id>
GET /v1/events/:eventId/photos?limit=50&after=<last_id>
GET /v1/my-events?limit=20&after=<last_id>
GET /v1/event-series/:seriesId?limit=20&after=<last_id>
```

Response format:

```json
{
  "data": [...],
  "pagination": {
    "has_more": true,
    "next_cursor": "01HXYZ..."
  }
}
```

SSR loads the first page. Client fetches subsequent pages on scroll.

---

## 13. Flutter App Impact Assessment

### No Breaking Changes

All backend modifications are additive:

- New nullable columns on `events` table (slug, short_code, etc.) — NULL for Flutter events
- New nullable columns on `event_invites` table (display_name, payment_status, etc.) — NULL for Flutter RSVPs
- New nullable column on `users` table (stripe_account_id) — NULL for non-organizers
- New tables (`event_cohosts`, `event_costs`, `tickets`, etc.) — unreferenced by Flutter
- New endpoints — uncalled by Flutter
- Existing endpoints return additional nullable fields — **Freezed models ignore unknown JSON keys by default**
- Extended host permission checks on `PUT/DELETE /v1/events/:eventId` now also check `event_cohosts` — this only affects web events with co-hosts. Flutter events have no co-hosts, so the existing `creator_user_id` check still works identically.

### Future Flutter Opportunities

| Feature                  | What Flutter Could Use                   | Effort |
| ------------------------ | ---------------------------------------- | ------ |
| `show_guest_list` toggle | Add to event creation/edit UI            | Low    |
| `slug` / `short_code`    | Deep link into web event pages from app  | Low    |
| Cost sharing             | Add to event details screen              | Medium |
| Co-hosts                 | Add co-host management to event creation | Medium |
| Recurring events         | Series creation in Flutter               | Medium |
| Event wall / comments    | Comment thread on event detail           | Medium |
| Ticketing                | Ticket QR display in Flutter             | Medium |
| Gallery                  | Photo upload/view in Flutter             | Medium |

### Required Flutter Changes

**None.** The Flutter app works unchanged after all migrations and code changes.

---

## 14. Deployment Order

1. **Create KV namespace** — `wrangler kv:namespace create SHORT_LINKS`
2. **Add env vars** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `WEB_APP_ORIGIN`, `SHORT_LINKS` binding
3. **Run migrations 001–026** — One at a time, verify each: `wrangler d1 execute ephemeral-db --file=migrations/001_events_add_slug.sql`
4. **Deploy backend code** — New handlers, lib files, cron job extensions
5. **Stripe setup** — Configure Connect settings in Stripe Dashboard, set webhook endpoint URL
6. **Point ephmr.al to Cloudflare** — Nameserver delegation at Albanian registrar (preferred) or CNAME fallback
7. **Deploy ephmr.al Worker** — Short link redirect worker
8. **Deploy SvelteKit frontend** — Cloudflare Pages

**Safe to run in a single deploy session.** Steps 1–3 can be done days before step 4. The Flutter app is unaffected at every step.

---

## 15. Monitoring & Observability

| What to Monitor         | How                                                               |
| ----------------------- | ----------------------------------------------------------------- |
| Stripe webhook failures | Log all events. Alert on 3+ consecutive failures for same event.  |
| Auto-refund failures    | Log per-ticket. Alert if any ticket in a batch fails to refund.   |
| Cron job execution      | Log start/end + row counts. Alert if run exceeds 5 min or errors. |
| D1 query latency        | CF dashboard → D1 metrics. Alert on p99 > 50ms.                   |
| R2 deletion failures    | Log in TTL cleanup. Weekly reconciliation for orphaned objects.   |
| SMS delivery failures   | Log Twilio errors. Retry once via Queue.                          |
| Capacity enforcement    | Log when max_attendees reached.                                   |
| Text blast limit        | Log when 3/3 used for an event.                                   |

---

## 16. SMS Notification Matrix

| Trigger                                  | Recipients                  | SMS Link Target                                 | When Sent                             |
| ---------------------------------------- | --------------------------- | ----------------------------------------------- | ------------------------------------- |
| RSVP confirmation                        | RSVP'd user                 | Event page (`ephmr.al/e/{code}`)                  | Immediately after RSVP                |
| Ticket purchase confirmation             | Ticket buyer                | Ticket page (`ephemeralsocial.com/ticket/{id}`) | After Stripe webhook confirms payment |
| 24-hour reminder                         | Going + Maybe               | Event page (`ephmr.al/e/{code}`)                  | 24hr before event start               |
| 1-hour reminder                          | Going + Maybe               | Event page (`ephmr.al/e/{code}`)                  | 1hr before event start                |
| Event detail change (date/time/location) | All RSVP'd + ticket holders | Event page (`ephmr.al/e/{code}`)                  | On edit save                          |
| Host text blast                          | Going + Maybe               | Event page (`ephmr.al/e/{code}`)                  | On send (max 3/event shared pool)     |
| Event cancellation                       | All RSVP'd                  | None                                            | On cancellation                       |
| Ticket refund                            | Ticket holder               | None                                            | On refund (auto or manual)            |
| Gallery ready (host)                     | Host only                   | Event page (`ephmr.al/e/{code}`)                  | 1 day after event ends                |

**No SMS sent for:** description-only edits, new comments, new photos, co-host invites, recurring instance auto-RSVP creation, cost item changes.

---

_Last updated: 2026-02-17_
_Status: FINAL — All review findings resolved. Ready for implementation._
