# Ephemeral Events Web

A dark-mode-only event platform built with SvelteKit -- part of the [Ephemeral Social](https://ephemeralsocial.com) suite. Think Partiful, but privacy-first: everything auto-deletes 7 days after the event ends.

**License:** AGPL-3.0 (see [LICENSE](./LICENSE))

---

## Overview

Ephemeral Events is a web application for creating, sharing, and managing events. Hosts create events with customizable aesthetics, share short links or QR codes, and guests RSVP via phone verification. Ticketed events use Stripe Connect. All data -- events, photos, comments -- is ephemeral by design, with enforced TTLs and automatic deletion.

Key characteristics:

- **Dark mode only** -- no light mode, no theme toggle
- **4-aesthetic design system** (Simple, Fun, Warm, Elegant) with per-event customization
- **Phone verification required** for all interactions (RSVP, tickets, comments, photos)
- **Auto-deletion** -- events and all associated data are removed 7 days post-event
- **Privacy-first** -- guest lists hidden by default, EXIF data stripped from photos, real-time privacy dashboard on every event page

## Architecture

This is a **SvelteKit frontend** that calls the shared `ephemeral_backend/` API. It does not have its own database, auth system, or API server. All data lives in the shared Cloudflare backend.

```
ephemeral_events_web/        SvelteKit SSR frontend (this repo)
        |
        |  HTTP (server-side only, via +page.server.ts / +server.ts)
        v
ephemeral_backend/           Shared Cloudflare Workers API
        |                    Same backend the Flutter mobile app uses.
        |                    Users, events, auth -- all shared.
        v
D1 + R2 + KV                Shared Cloudflare infrastructure
```

SvelteKit server routes act as thin proxies -- they call the backend API, never implement business logic themselves. JWT tokens are stored in HttpOnly cookies and never exposed to client-side JavaScript.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit 2 with Svelte 5 (runes syntax) |
| Styling | Tailwind CSS 4 |
| Language | TypeScript |
| Hosting | Cloudflare Pages |
| Session Storage | Cloudflare KV |
| Animations | Motion (formerly Framer Motion) |
| UI Components | shadcn-svelte (owned, copied into repo) |
| Icons | Phosphor (phosphor-svelte) |
| Payments | Stripe Connect (@stripe/stripe-js, @stripe/connect-js) |
| Testing | Vitest (unit/integration), Playwright (E2E) |
| Linting | ESLint + Prettier |

## Prerequisites

- **Node.js** >= 18 (tested with v22)
- **pnpm** (tested with v10)
- **Cloudflare account** -- needed for KV (session storage) and Pages deployment
- Access to the `ephemeral_backend/` API (run locally or use the production URL)

## Getting Started

### 1. Install dependencies

```bash
cd ephemeral_events_web
pnpm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

For local development, update `wrangler.toml` with your Cloudflare KV namespace ID and Stripe publishable key.

### 3. Start development servers

You need **both** the SvelteKit frontend and the shared backend running:

```bash
# Terminal 1: Start the backend API (port 8787)
cd ../ephemeral_backend
npx wrangler dev

# Terminal 2: Start the SvelteKit frontend (port 5173)
cd ephemeral_events_web
pnpm dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser. Use `127.0.0.1`, not `localhost` (required for iOS simulator compatibility and consistent cookie behavior).

### 4. Build for production

```bash
CF_PAGES=1 pnpm build
```

## Environment Variables

### SvelteKit App (wrangler.toml / CF Pages dashboard)

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | Yes | Backend API base URL (without `/v1`). Local: `http://127.0.0.1:8787` |
| `SESSIONS` | Yes | Cloudflare KV namespace binding for session storage |
| `STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key for payment UI |
| `HIBP_API_KEY` | Yes | Have I Been Pwned API key |
| `PINTEREST_APP_ID` | Yes | Pinterest app ID for board integration |
| `PINTEREST_APP_SECRET` | Yes | Pinterest app secret |
| `DEBUG_TOKEN` | No | Debug token for development tooling |
| `BEEHIIV_API_KEY` | No | Beehiiv API key for newsletter integration |
| `BEEHIIV_PUBLICATION_ID` | No | Beehiiv publication ID |
| `ADMIN_USER_ID` | No | User ID with admin dashboard access |
| `TAWK_WIDGET_ID` | No | Tawk.to live chat widget ID |
| `OG_WORKER_URL` | No | URL of the OG image generation worker |
| `WAITLIST_API_URL` | No | URL of the waitlist worker API |
| `STRIPE_FOUNDER_LINK` | No | Stripe payment link for founder tier |

## Project Structure

```
ephemeral_events_web/
|-- src/
|   |-- routes/
|   |   |-- (landing)/           # Landing page, privacy policy, terms
|   |   |-- e/[slug]/            # Event pages (SSR, public)
|   |   |   |-- check-in/       # Host QR scanner for ticket check-in
|   |   |   |-- edit/           # Event editing
|   |   |   |-- cohost/[token]/ # Co-host invite acceptance
|   |   |   +-- ticket-confirmed/
|   |   |-- create/              # Event creation (authenticated)
|   |   |-- events/              # Host dashboard
|   |   |-- settings/            # User settings
|   |   |-- admin/               # Admin dashboard
|   |   |-- api/                 # API route proxies to backend
|   |   +-- og/                  # OG image proxy
|   |-- lib/
|   |   |-- components/          # App components (event, auth, gallery, etc.)
|   |   |   +-- ui/             # shadcn-svelte components (owned source)
|   |   |-- server/              # Server-only code (API client, session mgmt)
|   |   |-- stores/              # Svelte 5 rune-based stores
|   |   |-- styles/              # CSS themes, typography, transitions
|   |   |   +-- aesthetics/     # 4-aesthetic design system (simple/fun/warm/elegant)
|   |   |-- themes/              # Theme token system (OKLCh color math)
|   |   |-- motion/              # Animation system (scroll reveal, shared element, etc.)
|   |   |-- types/               # TypeScript type definitions
|   |   +-- utils/               # Shared utilities (date formatting, slug, etc.)
|   +-- test/                    # Vitest test suites (unit, integration, api, pages)
|-- e2e/                         # Playwright E2E tests
|   |-- specs/                   # Test specs by feature area
|   |-- journeys/                # Full user journey tests
|   |-- pages/                   # Page object models
|   +-- fixtures/                # Test fixtures and data
|-- workers/
|   |-- short-link/              # Short link redirect worker (ephmr.al)
|   +-- waitlist/                # Waitlist + founder signup worker
|-- og-worker/                   # OG image generation worker (satori + resvg)
+-- specs/                       # Product specifications (10 spec docs)
```

## Workers

The project includes three standalone Cloudflare Workers deployed separately from the main SvelteKit app:

### Short Link Worker (`workers/short-link/`)

Handles `ephmr.al` short URL redirects. Looks up 6-character nanoid codes in KV and redirects to canonical `ephemeralsocial.com/e/{slug}` URLs. Used for QR codes, SMS sharing, and social media to minimize character count.

### Waitlist Worker (`workers/waitlist/`)

Manages the pre-launch waitlist and founder signup flow. Integrates with Stripe webhooks for founder tier payments and optionally syncs to Beehiiv for email campaigns. Uses its own D1 database.

### OG Image Worker (`og-worker/`)

Generates dynamic Open Graph images (1200x630 PNG) for event pages. Uses satori for SVG generation and resvg (WASM) for PNG rendering. Loads aesthetic-specific fonts and renders event title, date, venue, RSVP counts, and cover images with the event's chosen theme. Connected to the backend via Cloudflare service binding.

## Deployment

### SvelteKit App (Cloudflare Pages)

```bash
# Build
CF_PAGES=1 pnpm build

# Deploy
npx wrangler pages deploy .svelte-kit/cloudflare --project-name=ephemeral-events
```

Set production environment variables in the Cloudflare Pages dashboard under Settings > Environment Variables.

### Workers

Each worker is deployed independently:

```bash
# Short link worker
cd workers/short-link
npx wrangler deploy

# Waitlist worker
cd workers/waitlist
npx wrangler deploy

# OG image worker
cd og-worker
npx wrangler deploy
```

## Testing

### Unit and Integration Tests (Vitest)

```bash
pnpm test              # Run all tests
pnpm test:unit         # Unit tests only
pnpm test:integration  # Integration tests only
pnpm test:api          # API route tests
pnpm test:pages        # Page tests
pnpm test:watch        # Watch mode
```

### E2E Tests (Playwright)

Playwright tests require both the backend and frontend to be running. The Playwright config automatically starts both servers.

```bash
pnpm test:pw           # Run all E2E tests
pnpm test:pw:ui        # Interactive UI mode
pnpm test:pw:mobile    # Mobile viewport tests only
pnpm test:pw:visual    # Visual regression tests
```

Test projects cover mobile Chrome, tablet Safari, desktop Chrome/Firefox/WebKit, and visual regression snapshots.

### Type Checking and Linting

```bash
pnpm check             # svelte-check (type checking)
pnpm lint              # ESLint + Prettier check
pnpm format            # Auto-format with Prettier
```

## Design System

The app uses a **dark-mode-only** design language with warm, never-cold surfaces:

- **Surfaces:** Warm near-blacks (`#111110` base, `#1a1918` cards) -- never pure `#000`
- **Text:** Warm off-whites (`#ede9e3` primary) -- never pure `#fff`
- **Accent:** Forest green (`#52b788` primary)
- **Fonts:** Vollkorn (serif headlines), Manrope (body/UI). Per-aesthetic overrides: DM Sans (Simple), Cormorant Garamond + Raleway (Elegant), Source Sans (Warm)
- **Icons:** Phosphor icons exclusively
- **Border radius:** `0.75rem` containers, pill (`9999px`) buttons

Four event aesthetics provide distinct visual identities: **Simple** (clean, modern), **Fun** (bold, energetic), **Warm** (organic, textured), and **Elegant** (refined, serif-forward). Each has its own typography, color palette, motion personality, and background treatments.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines, coding standards, and pull request process.

## License

This project is licensed under the [GNU Affero General Public License v3.0](./LICENSE) (AGPL-3.0).

If you deploy a modified version of this software as a network service, you must make the complete source code available to users of that service under the same license. See the LICENSE file for full terms.
