# 10 — Roadmap & Scope

## Implementation Roadmap

### Phase 1 — Foundation (Weeks 1-2)

- Cloudflare Workers + D1 + R2 + KV setup
- Database schema creation and migrations
- SMS authentication flow (Twilio)
- Session management
- Basic API routing and middleware
- Turnstile bot protection
- ephmr.al Worker deployment + DNS configuration
- Short link generation and KV storage

### Phase 2 — Core Events (Weeks 3-4)

- Event creation form (web UI)
- Slug generation + short code generation
- Event detail page (public, SSR for fast loads and link previews)
- Open Graph meta tags + OG image generation
- RSVP flow: phone verification → Going/Maybe/Can't make it + plus-ones
- Guest list display (counts before RSVP, names after)
- Share button with short URL (ephmr.al)
- Event share QR code generation (branded, with logo)
- ICS calendar export (verified guests)
- Event wall (comments/updates)

### Phase 3 — Payments (Weeks 5-6)

- Simple event cost sharing: add costs, per-person split calculation
- Peer-to-peer deep links (Venmo/Cash App/Zelle)
- Host reconciliation dashboard
- Stripe Connect Express onboarding flow
- Stripe Checkout for ticket purchases
- Ticket QR code generation (branded, with guest name)
- Check-in scanning page (BarcodeDetector + html5-qrcode fallback)
- Check-in dashboard (real-time counter, guest list, manual check-in)
- Refund flow
- Fee absorption logic (first 50 tickets per event)

### Phase 4 — Gallery & Privacy (Weeks 7-8)

- Photo upload with EXIF stripping
- Gallery display (grid, full-screen viewer)
- 7-day auto-deletion (cron job)
- Host download link (zip generation, 14-day expiry)
- Privacy dashboard display on event page
- Individual photo download

### Phase 5 — Recurring Events & Notifications (Weeks 9-10)

- Recurring event series creation (weekly/biweekly/monthly/custom)
- Series template management
- Auto-generation of future instances (with their own slugs + short codes)
- Per-instance and series-level RSVP
- SMS reminders (24hr, 1hr) using short URLs
- Host text blast capability
- RSVP confirmation SMS

### Phase 6 — fuckpartiful.com & Polish (Weeks 11-12)

- Comparison landing page
- SEO optimization for event pages (Open Graph tags, structured data)
- Mobile responsiveness polish
- Error handling and edge cases
- Rate limiting tuning
- Performance optimization (edge caching, image CDN)
- Security audit (OWASP top 10)
- Launch preparation

### Total: ~12 weeks to launch-ready MVP

---

## Data Migration Path to Full Ephemeral App

When the full Ephemeral app launches:

**User accounts carry over.** Phone-verified users on the events web app have a user record with a phone number. When they download the Ephemeral app, they verify their phone number and add a passkey. Their account upgrades — same user ID, same phone number, all event history accessible.

**Auth upgrade path.** Events web app: phone + SMS code. Full Ephemeral app: passkey-primary with SMS fallback. The phone number is the bridge. Users don't create a new account — they upgrade their existing one.

**Database compatibility.** The events web app database schema is designed as a subset of the full Ephemeral schema. Users table, events table, and RSVPs table share the same structure. When the full platform launches, additional tables (messages, posts, stories, presence_windows, etc.) are added. No migration needed for existing event data.

**URL stability.** Event page URLs (`ephemeralsocial.com/e/{slug}`) and short links (`ephmr.al/e/{code}`) remain stable through the transition. When events become a feature within the full platform, the `/e/` route continues to work. No broken links.

**Brand continuity.** Events web app launches as "Ephemeral" from day one. When the full app launches, the events web app becomes one feature within the broader platform. Shared links continue to work. No brand confusion.

---

## What This Spec Does NOT Cover

The following features are part of the full Ephemeral social platform and are NOT in scope for the events web app MVP:

- E2EE messaging (Signal Protocol / vodozemac)
- Presence windows (30-minute ritual sessions)
- Timeline / feed (chronological, finite)
- Stories (24-hour TTL)
- Thoughts (text posts)
- Content sponsorship system
- Notes (E2EE personal notes)
- Nature-inspired design system (Forest/Garden/Sakura themes)
- Dissolution shader animations
- Flutter native app
- Client-side Rust cryptography
- Token economy / carbon offset
- Human content verification
- Apple IAP / Google Play Billing subscription management

These ship with the full Ephemeral app, after the events web app has validated product-market fit and built an initial user base.

---

_Ephemeral Events MVP Specification_
_Prepared for Ephemeral Foundation / Ephemeral PBC_
_Mission-locked for user wellbeing, privacy, and sustainability_
