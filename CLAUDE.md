# Ephemeral Events

Dark-mode-only event platform (Partiful competitor). SvelteKit frontend + shared Ephemeral backend + Stripe Connect.

## Architecture — CRITICAL: Read First

**This is a SvelteKit frontend that calls the existing `ephemeral_backend/` API.** It does NOT have its own database, auth system, or API server. All data lives in the shared backend.

```
ephemeral_events_web/  ← SvelteKit SSR frontend (this repo)
     │
     │ HTTP calls (server-side only, via +page.server.ts / +server.ts)
     ▼
ephemeral_backend/     ← Shared Cloudflare Workers API (existing)
     │                    Same backend the Flutter app uses.
     │                    Users, events, auth — all shared.
     ▼
D1 + R2 + KV           ← Shared Cloudflare infrastructure
```

**Backend API base URL:**

- Production: `https://ephemeral-api.ephemeralsocial.workers.dev/v1`
- Local dev: `http://127.0.0.1:8787/v1` (run `npx wrangler dev` in `ephemeral_backend/`)

**Auth flow:** Phone verification required for all interactions (RSVP, tickets, comments, photos). SvelteKit server routes call the backend's phone auth endpoints, store JWT tokens in HttpOnly cookies, and attach `Authorization: Bearer` headers on subsequent API calls. Client-side JS never sees tokens. No anonymous sessions.

**New backend endpoints** needed for web features (ticketing, co-hosts, gallery, etc.) are added to `ephemeral_backend/src/handlers/`, NOT to this repo. See `BACKEND_INTEGRATION_PLAN.md` for the full endpoint list and `specs/06-technical-architecture.md` for architecture.

## Quick Reference

```bash
# Dev (run both concurrently)
pnpm dev                                         # SvelteKit frontend (port 5173)
cd ../ephemeral_backend && npx wrangler dev       # Backend API (port 8787)

# Build & Deploy (serves ephemeralsocial.com + ephemeral-events.pages.dev)
CF_PAGES=1 pnpm build                                                        # Build for production
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=ephemeral-events  # Deploy to CF Pages

# Backend migrations (run in ephemeral_backend/)
cd ../ephemeral_backend
npx wrangler d1 execute ephemeral-db --local --file=./migrations/XXXX.sql  # Local
npx wrangler d1 execute ephemeral-db --file=./migrations/XXXX.sql          # Remote

# Type Check & Lint
pnpm check                        # svelte-check
pnpm lint                         # eslint + prettier
pnpm format                       # prettier write
```

## Frontend Structure

```
src/
├── routes/
│   ├── e/[slug]/              # Event pages (SSR, public)
│   │   ├── +page.svelte       # Event view
│   │   ├── +page.server.ts    # Load event data from backend API
│   │   ├── check-in/          # Host QR scanner
│   │   └── ticket-confirmed/  # Post-purchase ticket view
│   ├── create/                # Event creation (authenticated)
│   ├── my-events/             # Host dashboard
│   └── +layout.svelte         # Root layout (dark mode, fonts)
├── lib/
│   ├── components/ui/         # shadcn-svelte components (OWNED, not imported)
│   ├── components/            # App-specific components
│   ├── server/
│   │   ├── api.ts             # Backend API client (server-side only)
│   │   └── session.ts         # JWT cookie/session management
│   └── utils/                 # Shared: formatting, constants
└── app.d.ts                   # Type declarations
```

**SvelteKit API routes in `src/routes/api/` are thin proxies to the shared backend.** SvelteKit server routes call the shared backend — they don't implement API logic themselves. The only server-side code is in `+page.server.ts` load functions and form actions.

## Design Rules — READ BEFORE ANY UI WORK

**Dark mode only.** No light mode. No theme toggle. Every surface is dark + warm.

**Fonts:** Vollkorn Variable (serif) for headlines/event titles. Manrope Variable (body/UI/buttons/labels). Never use Inter, system-ui, Arial, or any other font.

**Icons:** Phosphor (`phosphor-svelte`) only. Never Lucide, never Heroicons, never emoji in UI chrome. Use `regular` weight for standard icons, `duotone` for emphasis (accent green secondary tone), `bold` for CTAs, `thin` for passive metadata.

**Colors — warm, not cold:**

- Surfaces: `#111110` base, `#1a1918` cards, `#232220` overlays — warm near-black, NEVER pure #000
- Text: `#ede9e3` primary, `#a39e96` secondary, `#6b6560` muted — warm off-white, NEVER pure #fff or blue-white
- Accent: `#52b788` primary (forest green), `#40916c` hover
- Errors: `#e85d04` (warm orange)
- Borders: `#2e2c2a` default, `#242220` subtle — warm, not gray

**Components:**

- Border radius: `0.75rem` (12px) cards/containers, `9999px` (pill) buttons/badges
- Buttons: pill-shaped, `transition: all 150ms ease`
- Shadows: pure black opacity only (reads warm on warm surfaces)
- Spacing: 16-20px inside cards, 8px between related items, 24-32px between sections
- Transitions: `cubic-bezier(0.25, 0.1, 0.25, 1.0)`, 150-200ms micro, 300ms modals

**shadcn-svelte:** Components are copied into `src/lib/components/ui/`. They are owned source code, not a dependency. Override all CSS variables at `:root` with the Ephemeral palette. See `specs/06-technical-architecture.md` for exact HSL values.

## Specs (Progressive Disclosure)

Full specs live in `specs/`. Read the relevant file BEFORE implementing any feature:

| When working on...                       | Read first                           |
| ---------------------------------------- | ------------------------------------ |
| Event page, RSVP flow, tier gating       | `specs/02-guest-access-tiers.md`     |
| Payments, Stripe, fee logic              | `specs/03-event-types-payments.md`   |
| Gallery, comments, recurring events, SMS | `specs/04-features.md`               |
| Data deletion, privacy dashboard         | `specs/05-privacy-architecture.md`   |
| DB schema, API routes, cron jobs         | `specs/06-technical-architecture.md` |
| URLs, short links, QR codes, check-in    | `specs/07-url-structure-qr-codes.md` |

## Key Patterns

**Shared backend.** All API calls go to `ephemeral_backend/`. Same users table, same auth flow, same D1 database as the Flutter app. New web-specific endpoints are added to `ephemeral_backend/src/handlers/`, not here.

**Phone verification for all interactions.** Viewing an event page is public (no auth). RSVPing, buying tickets, commenting, uploading photos — all require phone verification via the existing backend SMS auth flow (same Twilio Verify as Flutter app, creates real user in shared `users` table). No anonymous sessions, no cookie-based identity. Read `specs/02` for the feature matrix.

**Guest list hidden by default.** RSVP counts are always visible, but the guest list (names) is hidden unless the host explicitly enables "Show guest list to RSVP'd guests." This is a privacy-first default. See `specs/02` for details.

**Fee absorption logic.** Tickets ≤$25: first 50 free (Ephemeral eats 3.4% + $0.30), tickets 51+ charge 6.8% + $0.60 (2× Stripe cost to recoup). Tickets >$25: buyer pays 3.4% + $0.30 from ticket 1. The 3.4% includes Stripe's 0.5% Connect platform fee. See `specs/03` for code.

**Dual URL system.** Canonical: `ephemeralsocial.com/e/{slug}` (SEO). Short: `ephmr.al/e/{6-char-nanoid}` (sharing, QR, SMS). Short links stored in KV with TTL matching event lifecycle. Slugs are immutable after creation.

**Co-hosts.** Added via shareable invite links. Full host permissions except event deletion (creator only). Co-hosts share the 3-per-event text blast pool.

**Everything auto-deletes.** Events, photos, comments, QR codes, KV entries — all have TTLs. 7 days after event ends = deletion. This is the product, not a bug. Post-event pages show a countdown to deletion. After deletion: permanent tombstone page.

**Privacy dashboard always visible.** Real-time stats on every event page (photo count, metadata stripped, data sharing: none). Not just post-event — always.

## Gotchas

- **No direct D1/R2 access from SvelteKit.** All data access goes through the backend API. The SvelteKit app does NOT bind to D1 or R2 directly — it's a pure frontend.
- **Run backend locally for dev.** You need `npx wrangler dev` running in `ephemeral_backend/` alongside `pnpm dev` here. Use `127.0.0.1:8787` not `localhost`.
- **Backend uses ULID for all IDs**, not nanoid. Match this convention when creating new entities.
- **Backend uses Hono router**, not Express. New endpoints follow the existing handler pattern in `ephemeral_backend/src/handlers/`.
- **JWT tokens are HS256** signed with `JWT_SECRET` env var. Access tokens expire in 1 hour, refresh tokens in 30 days.
- Stripe webhooks must be verified with `stripe.webhooks.constructEvent()`. Raw body, not parsed JSON.
- `@sveltejs/adapter-cloudflare` bundles to a single `_worker.js`. Keep server-side imports small. Import heavy client libs dynamically.
- EXIF stripping happens in the backend BEFORE R2 storage. Never store unprocessed user photos.
- SMS via Twilio: use `ephmr.al` short URLs to minimize segment count (160 char limit per segment).
- shadcn-svelte components are Svelte 5 runes syntax (`$state`, `$derived`, `$effect`). Do not use Svelte 4 stores syntax.

## Commit Style

```
feat(events): add recurring event series generation
fix(tickets): correct fee calculation for >$25 tickets
chore(db): add migration for short_code column
```

Conventional commits. Scope in parens. Imperative mood. No period at end.

## Motion & Animation Rules — MUST FOLLOW

**All content animations MUST use scroll reveal.** Never animate elements on mount/page load unless they are immediately visible above the fold. Use `use:scrollReveal` from `$lib/motion` on every section or content block that could be below the viewport when the page loads.

```svelte
<!-- CORRECT: below-fold sections use scrollReveal -->
<div use:scrollReveal={{ y: 15 }}>
  <SomeComponent />
</div>

<!-- WRONG: staggerChildren fires immediately on mount, animates off-screen content -->
<div use:staggerChildren>
  <LongListOfItems />
</div>
```

**When to use each action:**
- `use:scrollReveal` — Default for ALL content sections. Reveals on scroll into viewport via IntersectionObserver.
- `use:staggerChildren` — Only for content that is **fully visible on mount** (e.g., a short list at the top of a page). Never for below-fold content.
- `use:animateIn` — Only for above-the-fold hero content that should animate immediately on page load.
- `use:focusLift` — On form inputs for subtle lift on focus.
- `use:sharedElement` — On elements that morph between pages via View Transitions.
- `use:swipeDismiss` — On dismissible overlays (toasts, modals).

**Hero sections are the exception.** The hero/cover area (visible on load) can use an upfront Motion timeline or `use:animateIn`. Everything below the hero MUST use `use:scrollReveal`.

**Import from the barrel:** `import { scrollReveal } from '$lib/motion'`

## Aesthetic Design System — Anti-Slop Rules

The 4-aesthetic system (Simple, Fun, Warm, Elegant) lives in `src/lib/styles/aesthetics/`. These rules apply when creating or modifying aesthetic palettes, layouts, or event page UI.

### Distributional Convergence Warning

You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive designs that surprise and delight. Every aesthetic must feel like it was designed by a human designer with a strong point of view, not generated by a model.

**Typography**: Each aesthetic's font pairing must be distinctive and intentional. Avoid overused AI defaults (Inter, Roboto, Open Sans, Space Grotesk). Use extreme weight contrasts (100-300 vs 700-900, not 400 vs 600). Size jumps of 3x+, not 1.5x.

**Color & Theme**: Commit fully to each aesthetic's color world. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Always tint neutrals toward the palette's hue — never use pure gray. Use OKLCh for perceptually uniform color.

**Motion**: Each aesthetic has its own motion personality. Focus on one well-orchestrated entrance, not scattered micro-interactions. Never use bounce or elastic easing (dated and tacky).

**Backgrounds**: Create atmosphere and depth. Layer gradients, use textures (like Warm's linen grain), add contextual effects that match the aesthetic's world.

### Banned AI Tells (adapted from Taste-Skill)

These patterns immediately signal "AI-generated". Never use them:

**Visual:**
- Neon outer glows or default box-shadow glows
- Pure black (#000000) or pure white (#ffffff) — always tint
- Oversaturated accents that don't blend with neutrals
- Gradient text on headings or metrics
- Purple-to-blue gradients, cyan-on-dark ("AI palette")
- Glassmorphism used decoratively rather than purposefully
- Rounded rectangles with generic drop shadows

**Typography:**
- Inter as a "design choice" (it's the absence of a choice)
- Oversized H1s that scream — control hierarchy with weight and color, not just scale
- Using the same font pair across aesthetics that should feel different

**Layout:**
- 3-equal-column card grids (the most common AI layout)
- Centering everything — left-aligned text with asymmetry feels more designed
- Cards nested inside cards (flatten the hierarchy)
- Hero metric layout template (big number, small label, gradient accent)
- Same spacing everywhere — without rhythm, layouts feel monotonous

**Content:**
- Generic placeholder names ("John Doe", "Sarah Chen")
- Round numbers (99.99%, 50%, 1,234) — use organic numbers (47.2%, 1,847)
- Filler words: "Elevate", "Seamless", "Unleash", "Next-Gen"

### Per-Aesthetic Quality Tests (from Interface Design)

Before shipping any aesthetic change, apply these 4 tests:

1. **Swap Test**: If you swapped this aesthetic's typeface for Inter, would anyone notice? If you swapped the layout for a generic template, would it feel different? The places where swapping wouldn't matter are the places you defaulted.

2. **Squint Test**: Blur your eyes. Can you still perceive hierarchy? Is anything jumping out harshly? Good design whispers.

3. **Signature Test**: Can you point to 5 specific elements where this aesthetic's signature appears? Not "the overall feel" — actual components. A signature you can't locate doesn't exist.

4. **Token Test**: Read the CSS variable names out loud. Do they sound like they belong to this aesthetic's world, or could they belong to any project?

## Do NOT

- Add a light mode or theme toggle
- Use any icon library other than Phosphor
- Use emoji in UI elements (buttons, labels, badges, status indicators, nav, empty states)
- Use Lucide, Heroicons, or any default shadcn icon imports
- Use pure black (#000000) or pure white (#ffffff) anywhere
- Use Inter, Roboto, Arial, system-ui, or any font other than Vollkorn/Manrope
- Add Firebase, Supabase, or any non-Cloudflare backend service
- Build a separate auth system — use the existing backend's phone auth flow
- Build a separate API server — add new endpoints to `ephemeral_backend/`
- Access D1/R2 directly from SvelteKit — all data goes through the backend API
- Create a separate `users` table — use the existing shared one
- Use localStorage or sessionStorage — use HttpOnly cookies + server-side sessions
- Expose JWT tokens to client-side JavaScript — all auth is server-side
- Skip EXIF stripping on photo uploads
- Show guest list by default — it's hidden unless host enables it
- Allow anonymous RSVPs — phone verification is required for ALL interactions
- Build anonymous session middleware or cookie-based identity — eliminated from the plan
- Create `anonymous_guests` or `web_rsvps` tables — eliminated, use `event_invites` directly
