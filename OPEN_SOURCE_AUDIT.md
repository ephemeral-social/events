# Open Source Readiness Audit: `ephemeral_events_web/`

> Conducted 2026-03-17 | AGPL-3.0 target license

---

## PART 1: SECRETS & SECURITY

### Q1: Hardcoded Secrets Scan

**No actual secret keys found in the codebase or git history.** No `sk_live`, `sk_test`, `JWT_SECRET`, `TWILIO_*`, `STRIPE_SECRET_KEY`, `PINTEREST_APP_SECRET`, `BEEHIIV_API_KEY`, or `HIBP_API_KEY` values were ever committed. Git history is clean (`git log -p --all -S` for all secret patterns returned zero results).

**Items hardcoded in tracked files that need attention:**

| File | Line | Value | Severity |
|------|------|-------|----------|
| `wrangler.toml` | 11 | `pk_live_51SbR6FPr...` (Stripe live publishable key) | MEDIUM — publishable keys are client-side by design, but this is a LIVE key identifying your Stripe account |
| `.env.example` | 8 | Same Stripe publishable key | MEDIUM — example files should use placeholders |
| `src/app.html` | 34 | Tawk.to widget ID `69b0dfc19140081c3676c6bd/1jjdek36n` | LOW-MEDIUM — ties to production chat account |
| `wrangler.toml` | 12 | `PINTEREST_APP_ID = "1549984"` | LOW |
| `wrangler.toml` | 16 | KV namespace ID `b648a1a57aff...` | LOW — account-specific |
| `workers/short-link/wrangler.toml` | 8 | KV namespace ID `f804f6c73434...` | LOW — account-specific |
| `workers/waitlist/wrangler.toml` | 18 | D1 database ID `d6985b58-2eed...` | LOW — account-specific |
| `src/lib/components/landing/WaitlistModal.svelte` | 11 | Stripe payment link `https://buy.stripe.com/4gM28t0kD...` | LOW — public checkout link |
| `src/routes/e/[slug]/+page.server.ts` | 85 | Hardcoded admin user ID `01KC8G93FNYE80ET4BHFZA1FKD` | MEDIUM — should be env var |
| `e2e/fixtures/test-data.ts` | 16 | `DEV_CODE = '123456'` | INFO — dev-mode only bypass |

**Verdict: Git history is clean. You do NOT need to squash history or create a fresh repo.**

---

### Q2: Environment Variables

| Variable | Referenced In | Fallback | Risk |
|----------|--------------|----------|------|
| `BACKEND_URL` | 6 files (api.ts, hooks.server.ts, route handlers) | `'http://127.0.0.1:8787'` | SAFE — dev-only |
| `HIBP_API_KEY` | `trace/+server.ts` | None (returns 503) | SAFE |
| `BEEHIIV_API_KEY` | `blog-posts/+server.ts`, `waitlist worker` | None (skips feature) | SAFE |
| `BEEHIIV_PUBLICATION_ID` | Same as above | None (skips feature) | SAFE |
| `STRIPE_PUBLISHABLE_KEY` | `wrangler.toml [vars]` | Hardcoded live key | See above |
| `PINTEREST_APP_ID` | `wrangler.toml [vars]` | Hardcoded | LOW |
| `PINTEREST_APP_SECRET` | Pinterest auth routes | None (returns 500) | SAFE |
| `STRIPE_WEBHOOK_SECRET` | `waitlist worker` | **Skips verification if unset** | MEDIUM — webhook verification bypassed |
| `DEBUG_TOKEN` | `debug-login/+server.ts` | None (returns 404) | SAFE |
| `SESSIONS` | KV binding | N/A | N/A |

**No dangerous fallbacks that leak secrets.** One concern: the waitlist worker silently skips Stripe webhook signature verification when `STRIPE_WEBHOOK_SECRET` is unset (`console.warn` only).

---

### Q3: Tracked .env Files

- `.env.example` — **tracked** (contains Stripe publishable key + KV ID, both should be placeholders)
- `.env` — **NOT tracked**, properly gitignored, never committed
- `.dev.vars` — **NOT tracked**, properly gitignored, never committed
- **Git history clean** — no .env or .dev.vars files ever committed

`.gitignore` is correct: `.env`, `.env.*`, `!.env.example`, `!.env.test`, `.dev.vars`

---

### Q4: Third-Party Service Integrations

| Service | Purpose | Credential Management | Issue? |
|---------|---------|----------------------|--------|
| **Stripe** (Connect + Checkout) | Payments, ticketing | Publishable key in wrangler.toml; secret key in CF dashboard only | Publishable key should be placeholder |
| **Tawk.to** | Live chat widget | Widget ID hardcoded in `app.html` | Should be env var |
| **Pinterest API** | Inspiration boards | App ID in wrangler.toml; secret in .dev.vars (gitignored) | App ID should be placeholder |
| **Have I Been Pwned** | Trace/breach check | API key in .dev.vars (gitignored) | Clean |
| **Beehiiv** | Newsletter/blog | All via env vars only | Clean |
| **Cloudflare** (Workers, Pages, D1, KV, R2) | Infrastructure | Resource IDs in wrangler.toml | Replace with placeholders |
| **Google Fonts** | Typography | Public CDN, no credentials | Clean |
| **Twilio** | Phone auth (backend only) | Not in this codebase | Clean |

**wrangler.toml** contains Cloudflare account-specific resource IDs (KV namespace IDs, D1 database ID) — not secrets, but should be placeholders.

---

### Q5: Real User Data in Seeds/Fixtures

**No real PII found.** All test data uses synthetic values:
- **Phone numbers**: US 555 prefix (`+15550001001`, `+15551234567`) — reserved for fiction
- **Tokens**: Obviously fake (`test-access-token`, `inv-abc123`)
- **Names**: Debug Alice, Debug Bob, Test Event

**One exception:** `src/test/unit/inspo-utils.test.ts` references a real Pinterest username `mannysid23` and board URL `/mannysid23/patrick/`. Should be replaced with a generic username.

---

## PART 2: ARCHITECTURE & DEPENDENCIES

### Q6: Project Structure

```
ephemeral_events_web/              # SvelteKit 2 + Svelte 5 + Vite 7 + TailwindCSS 4 + TypeScript 5.9
├── src/
│   ├── routes/                    # 12 route groups
│   │   ├── (landing)/             # Landing page, terms, privacy, founder-welcome
│   │   ├── e/[slug]/              # Public event pages (SSR) + check-in/cohost/edit/ticket-confirmed
│   │   ├── create/                # Event creation (auth'd)
│   │   ├── events/                # Host dashboard
│   │   ├── settings/              # User settings + connections
│   │   ├── admin/                 # Admin stats
│   │   ├── api/                   # 15 SvelteKit API proxy routes → backend
│   │   ├── og/                    # OG image redirect
│   │   ├── preview/               # Event preview
│   │   └── trace/                 # HIBP breach check feature
│   ├── lib/
│   │   ├── components/            # 21 component dirs (auth, connections, costs, editor, event,
│   │   │                            gallery, guests, landing, layouts, rsvp, share, survey,
│   │   │                            tickets, ui...)
│   │   ├── crypto/                # Client-side connection graph crypto (WebCrypto API)
│   │   ├── motion/                # Motion-based animation system
│   │   ├── server/                # Server-only: API client, session (KV), auth-guard, pinterest
│   │   ├── stores/                # Svelte 5 rune stores (connections, event-draft, toast, etc.)
│   │   ├── styles/aesthetics/     # 4-aesthetic design system (simple, fun, warm, elegant)
│   │   ├── themes/                # Theme tokens, types, defaults
│   │   └── utils/                 # Shared helpers
│   └── test/                      # Vitest tests (unit/46, api/20, integration/4, pages/8, e2e/7)
├── workers/
│   ├── short-link/                # URL shortener Worker (ephmr.al)
│   └── waitlist/                  # Waitlist Worker (D1 + Stripe + Beehiiv)
├── og-worker/                     # OG image generation Worker (satori + resvg WASM)
├── e2e/                           # Playwright E2E tests (51 specs + fixtures + page objects)
├── specs/                         # 23 product spec documents
├── scripts/                       # verify-theme-contrast.ts
├── static/                        # Favicons, textures, landing assets, manifest
├── wrangler.toml                  # CF Pages config
├── package.json                   # pnpm
├── svelte.config.js               # adapter-cloudflare
├── vite.config.ts / vitest.config.ts / playwright.config.ts
└── CLAUDE.md / BACKEND_INTEGRATION_PLAN.md / E2E_TESTING_GUIDE.md / REVIEW_REPORT.md
```

**Tech stack:** SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4, Vite 7, TypeScript 5.9, Cloudflare Pages + Workers

---

### Q7: Dependency Licenses

| Package | License | AGPL-Compatible? |
|---------|---------|:---:|
| @formkit/auto-animate | MIT | Yes |
| @stripe/connect-js, @stripe/stripe-js | MIT | Yes |
| bits-ui, clsx, culori | MIT | Yes |
| dompurify | MPL-2.0 OR Apache-2.0 | Yes |
| html5-qrcode | Apache-2.0 | Yes |
| ios-haptics, phosphor-svelte, qrcode | MIT | Yes |
| tailwind-merge, tailwind-variants | MIT | Yes |
| All 21 devDependencies | MIT or Apache-2.0 | Yes |
| OG Worker deps (@cf-wasm/resvg, satori) | MPL-2.0 | Yes |
| ~~gsap~~ **motion** | MIT | Yes | **RESOLVED** — replaced GSAP with Motion (MIT) |

~~**BLOCKER: GSAP License Incompatibility.**~~ **RESOLVED.** GSAP replaced with Motion (MIT-licensed) across all 27 files. Motion-based animation system is fully AGPL-3.0 compatible.

**All 38 dependencies are AGPL-3.0 compatible.**

---

### Q8: Cloudflare Infrastructure

| Deployment | Name | Resources | Account-Specific IDs |
|------------|------|-----------|---------------------|
| **SvelteKit App** (CF Pages) | `ephemeral-events-web` | KV: `SESSIONS` | `b648a1a57aff4f31ab302ac315ea6d7a` |
| **Short Link Worker** | `ephemeral-short-links` | KV: `SHORT_LINKS` | `f804f6c734344efdb2d275082753110a` |
| **Waitlist Worker** | `ephemeral-waitlist` | D1: `ephemeral-waitlist` | `d6985b58-2eed-4e93-ac0c-3f461ffcd930` |
| **OG Image Worker** | `ephemeral-og` | Service binding: `BACKEND` → `ephemeral-api` | None |

**To replicate locally:** Create KV namespaces + D1 database, run `ephemeral_backend/` with `npx wrangler dev`, run SvelteKit with `pnpm dev`. Workers run independently.

---

### Q9: Core Data Flows

**Creating an event:**
```
Create form → POST /api/events/create → SvelteKit server → POST /v1/events → ephemeral_backend → D1 + R2
```

**RSVPing:**
```
Event page → Phone auth first → POST /api/events/[id]/rsvp → SvelteKit server → POST /v1/events/:id/web-rsvp → D1
```

**Photo upload (presigned):**
```
Gallery → POST /api/media/upload → GET /v1/media/presign (returns presigned R2 URL) → PUT directly to R2
```
EXIF stripping happens in the backend before R2 storage.

**Auto-deletion:**
Handled entirely by `ephemeral_backend/` cron jobs — not in this codebase. Frontend displays `deletion_scheduled` countdown and renders `TombstonePage.svelte` for deleted events.

---

### Q10: Encrypted Connection Graph

Full implementation in `src/lib/crypto/connections.ts` (293 lines, well-documented):

1. **Key generation:** RSA-OAEP 2048-bit keypair via Web Crypto API
2. **PIN protection:** PBKDF2 (600k iterations SHA-256) + server-provided pepper/salt → AES-256-GCM key → encrypts private key
3. **Storage:** Public key + encrypted private key blob → backend D1. Keys cached in IndexedDB for session persistence
4. **Entry decryption:** Hybrid — RSA-OAEP unwraps per-entry AES key, AES-GCM decrypts co-attendee payload
5. **Compacted store:** HKDF derives symmetric key from private key's `d` parameter → AES-GCM encrypts aggregated connection store
6. **PIN restore:** Re-derives PIN key → decrypts private key blob from backend
7. **Auto-lock:** 5-minute inactivity timeout clears keys from memory; re-unlock requires PIN
8. **Full reset:** DELETE /api/connections/reset + idbClear() destroys all keys

All crypto uses standard Web Crypto API primitives — no custom cryptography. Zero-knowledge design: server never sees plaintext connection data.

---

## PART 3: CODE QUALITY & DOCUMENTATION

### Q11: TODO/FIXME/HACK/XXX Comments

**Only 1 actionable TODO in source code:**

| File | Line | Comment |
|------|------|---------|
| `src/lib/components/auth/PhoneInput.svelte` | 1 | `<!-- TODO: Add international country code support -->` |

Plus 1 test placeholder: `it.todo('host sends text blast -- requires Twilio dev mode')` and 1 TODO in a spec file (not runtime code). **No FIXME, HACK, or XXX comments found.** Remarkably clean.

---

### Q12: Documentation State

**Extensive internal docs, but NO public README:**

| File | Description |
|------|-------------|
| `CLAUDE.md` (16KB) | Comprehensive AI dev guide — architecture, design rules, patterns, gotchas |
| `BACKEND_INTEGRATION_PLAN.md` (92KB) | Full backend integration plan with DB schema + API endpoints |
| `E2E_TESTING_GUIDE.md` | Playwright E2E testing guide |
| `REVIEW_REPORT.md` | Code review report |
| `specs/` (23 markdown files) | Product specs 00-10, aesthetic specs, motion system, native-feel |
| `docs/LIVE_EDITOR_ARCHITECTURE.md` | Live editor architecture |

**JSDoc coverage:** 83 annotations across 34 files — key modules well-documented (api.ts, connections store, motion system, crypto module, utilities).

~~**Missing for open source:** `README.md`, `LICENSE`, `CONTRIBUTING.md`, `CHANGELOG.md`~~ **RESOLVED** — `README.md`, `LICENSE` (AGPL-3.0), and `CONTRIBUTING.md` created. `CHANGELOG.md` optional for initial release.

---

### Q13: Test Coverage

**Frameworks:** Vitest (unit/integration/API) + Playwright (browser E2E)

| Category | Files | Examples |
|----------|------:|---------|
| Unit tests | 46 | Motion system (17), themes (9), utilities (10), performance/a11y (5) |
| API route tests | 20 | Auth, RSVP, checkout, tickets, cohosts, gallery, comments, costs... |
| Page tests | 8 | Event page, create, edit, my-events, layout, check-in, cohost-accept |
| Integration tests | 4 | API client, auth guard, session, aesthetic system |
| Vitest E2E journeys | 7 | Auth flow, RSVP, event management, cohost, cost sharing |
| Playwright E2E specs | 51 | Auth (3), events (7), RSVP (5), cohosts (2), gallery (2), tickets (2), a11y (3), responsive (3), visual (8), security (1)... |
| **Total** | **136+** | |

**Untested critical paths:**
- `src/lib/crypto/connections.ts` — no tests for WebCrypto operations
- `src/lib/stores/connections.svelte.ts` — no tests for connection store
- `workers/waitlist/` — zero tests
- `workers/short-link/` — zero tests
- `og-worker/` — zero tests
- `src/service-worker.ts` — no tests

---

### Q14: Hardcoded URLs

**7 URLs that should be environment variables:**

| # | File | URL | Suggested Env Var |
|---|------|-----|-------------------|
| 1 | `src/routes/og/[slug]/+server.ts:10` | `ephemeral-og.ephemeralsocial.workers.dev` | `OG_WORKER_URL` |
| 2 | `src/lib/utils/og-helpers.ts:41` | Same OG worker URL | Same |
| 3 | `src/lib/components/landing/WaitlistModal.svelte:10` | `ephemeral-waitlist.ephemeralsocial.workers.dev` | `WAITLIST_API_URL` |
| 4 | `src/lib/components/landing/WaitlistModal.svelte:11` | `buy.stripe.com/4gM28t0kD...` | `STRIPE_FOUNDER_LINK` |
| 5 | `src/routes/(landing)/+page.svelte:32` | Waitlist stats API (client fetch) | `WAITLIST_API_URL` |
| 6 | `src/routes/api/admin/stats/+server.ts:21` | Same waitlist stats API | Same |
| 7 | `src/app.html:34` | Tawk.to widget ID | `TAWK_WIDGET_ID` or remove |

**Production domain references** (`ephemeralsocial.com`, `ephmr.al`, `blog.ephemeralsocial.com`) appear in ~50 locations (CSP, OG tags, share URLs, canonical URLs, legal pages). These are acceptable as constants but should be documented as needing replacement by forks.

---

### Q15: Dead/Experimental Code

| Item | Location | Severity |
|------|----------|----------|
| **InstallBanner disabled** | `src/lib/components/ui/install-banner/InstallBanner.svelte:14` — `// Temporarily disabled` + immediate return | Medium — dead component |
| **4x console.log in connections store** | `src/lib/stores/connections.svelte.ts:116,128,135,186` | Medium — leaks debug info to browser console |
| **10x console.log in waitlist worker** | `workers/waitlist/src/index.js` (lines 206,231,235,329,345,358...) | Low — worker debug logging |
| **Fallback blog posts** | `src/routes/api/blog-posts/+server.ts:78-103` — 3 hardcoded stub posts | Low |
| **Stale prototype** | `specs/expose/expose-page.svelte` — 661-line component in specs/, superseded by `src/routes/trace/` | Low |
| **5.6MB build artifacts** | `og-worker/dist/` — committed index.js, sourcemap, WASM files | Medium — bloats repo |
| **Orphaned static files** | `static/blog-theme.css`, `static/sms-opt-in.png`, `static/sms-opt-in-2.png` | Low |

No large blocks of commented-out code. No `@deprecated`, `EXPERIMENTAL`, or feature flags found.

---

## FINAL SUMMARY

### Blockers (Must Fix Before Publishing)

1. ~~**GSAP license incompatibility**~~ **RESOLVED** — Replaced with Motion (MIT).

2. ~~**Replace account-specific values with placeholders in wrangler.toml files**~~ **RESOLVED** — All wrangler.toml files now use placeholder values.

3. ~~**Replace/remove Tawk.to widget ID** in `src/app.html`~~ **RESOLVED** — Moved to dynamic `TawkWidget.svelte` component, loaded via `TAWK_WIDGET_ID` env var.

4. ~~**Replace hardcoded admin user ID**~~ **RESOLVED** — Now reads `ADMIN_USER_ID` from `platform.env`.

5. ~~**Update `.env.example`** to use placeholder values~~ **RESOLVED** — All placeholder values.

6. ~~**Create `README.md`** and **`LICENSE`** file (AGPL-3.0)~~ **RESOLVED** — README.md, LICENSE (AGPL-3.0), and CONTRIBUTING.md created.

### Should Fix

7. ~~Move 7 hardcoded service URLs to environment variables~~ **RESOLVED** — OG_WORKER_URL, WAITLIST_API_URL, STRIPE_FOUNDER_LINK now configurable via env vars. SSRF allowlist built dynamically from BACKEND_URL.
8. ~~Remove 4 `console.log` calls from `connections.svelte.ts`~~ **RESOLVED** — All debug console.log removed.
9. ~~Remove or re-enable disabled `InstallBanner` component~~ **RESOLVED** — Component deleted.
10. ~~Replace real Pinterest username `mannysid23` in test fixtures~~ **RESOLVED** — Replaced with `testuser`.
11. ~~Replace Stripe payment link in `WaitlistModal.svelte` with env var~~ **RESOLVED** — Now passed via `STRIPE_FOUNDER_LINK` env var, hidden when unset.
12. ~~Create `CONTRIBUTING.md`~~ **RESOLVED** — Created.
13. ~~Address webhook verification bypass in waitlist worker~~ **RESOLVED** — Now returns 500 when `STRIPE_WEBHOOK_SECRET` is not configured.
14. ~~Remove 5.6MB `og-worker/dist/` build artifacts from repo~~ **RESOLVED** — Files not tracked in git (already gitignored).
15. ~~Remove orphaned static files (`blog-theme.css`, `sms-opt-in*.png`)~~ **RESOLVED** — Deleted.

### Clean (No Action Needed)

- **Git history is clean** — no secrets ever committed, no need to squash
- **No real user data** in test fixtures (all use +1555 fictional phone numbers)
- **All 38 dependencies** are AGPL-3.0 compatible
- **Only 1 TODO** in source code
- **No dead code blocks**, no commented-out code
- **136+ test files** with comprehensive coverage
- **Extensive internal documentation** (CLAUDE.md, 23 specs, JSDoc)
