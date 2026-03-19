# Final Review Report — Events Web App

**Date:** 2026-02-17
**Reviewed:** `BACKEND_INTEGRATION_PLAN.md`, all specs (`01`–`07`), `CLAUDE.md`, existing backend schema
**Panel:** 5 specialized agents (schema, feature, privacy, stripe, consistency)
**Total findings:** 97 (12 CRITICAL, 26 MAJOR, 25 MINOR, 34 stale references)
**Status:** ALL CRITICAL AND MAJOR FINDINGS RESOLVED

---

## Review History

### Round 1 — "Asshole Panel" (5 agents)

- Found 20 issues (4 CRITICAL, 8 MAJOR, 6 MINOR, 2 notes)
- All fixed. Major architecture change: eliminated Tier 1 anonymous RSVP entirely.

### Round 2 — 35-Question Q&A

- Resolved every assumption and feature decision through direct Q&A with product owner.
- Key decisions: phone-only auth, co-hosts MVP, bearer tickets, guest list hidden by default, etc.
- All specs and integration plan rewritten from scratch.

### Round 3 — Final Review (5 specialized agents)

- schema-reviewer: 20 findings (3 CRITICAL, 7 MAJOR, 10 MINOR)
- feature-reviewer: 12 findings (2 CRITICAL, 6 MAJOR, 4 MINOR)
- privacy-reviewer: 16 findings (4 CRITICAL, 6 MAJOR, 6 MINOR)
- stripe-reviewer: 15 findings (3 CRITICAL, 7 MAJOR, 5 MINOR)
- consistency-reviewer: 34 stale references

---

## Critical Fixes Applied

| #   | Finding                                                          | Fix                                                                                        |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Stripe idempotency key uses `ulid()` (unique = useless)          | Changed to `${event_id}:${user_id}` (deterministic)                                        |
| 2   | `stripe_payment_intent_id` UNIQUE blocks multi-ticket purchase   | Removed UNIQUE, added compound index on `(checkout_session_id, ticket_number)`             |
| 3   | Checkout quantity hardcoded to 1 in code samples                 | Updated to dynamic `quantity` from request, stored in Stripe session metadata              |
| 4   | EXIF proof impossible — CF Images doesn't report stripped fields | Two-step: parse EXIF with `exif-reader` first (for proof), then strip via CF Images        |
| 5   | R2 orphan risk — D1 deleted before R2 confirmed                  | Deletion order reversed: R2 first, D1 last. Failed R2 deletes block D1 cleanup.            |
| 6   | OG images + QR codes never deleted from R2                       | Added to TTL cleanup path. Weekly R2 reconciliation job.                                   |
| 7   | Tombstone page breaks — slug mapping gone on delete              | Added `event_tombstones` table. Inserted before event deletion. Public endpoint checks it. |
| 8   | "Can't make it" vs `declined` DB status mismatch                 | Documented mapping: UI "Can't make it" → DB `'declined'`. No schema change needed.         |
| 9   | `event_photos` table exists but plan ignores it                  | Gallery endpoints now reference existing table. Added `exif_proof` column via migration.   |
| 10  | RSVP change to Can't Make It with active tickets                 | Tickets remain active (bearer instruments). Frontend warned. Host can manually refund.     |
| 11  | Wrong webhook event type                                         | Changed from `payment_intent.succeeded` to `checkout.session.completed`                    |
| 12  | Fee absorption race condition                                    | Documented optimistic approach — max exposure bounded at $57.50/event, acceptable.         |

## Major Fixes Applied

| #   | Finding                              | Fix                                                                                      |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| 1   | No cohost invite expiry              | Added `expires_at` column, 72-hour TTL, 410 Gone on expired tokens                       |
| 2   | Recurring events lack timezone       | Added `timezone` column (IANA format) to `event_series`                                  |
| 3   | `recurrence_rule` format unspecified | Documented as iCal RRULE subset (`FREQ=WEEKLY;BYDAY=TU`)                                 |
| 4   | Capacity rejection undefined         | All-or-nothing: reject entire RSVP if plus_ones exceed remaining, return remaining count |
| 5   | `allow_plus_ones` not checked        | Added validation in RSVP and checkout endpoints                                          |
| 6   | Partial refund for multi-ticket      | Documented per-ticket partial refund via `stripe.refunds.create({ amount })`             |
| 7   | Auto-refund groups by payment_intent | Rewrote `autoRefundAllTickets` to group tickets by payment_intent, full refund per group |
| 8   | 34 stale Tier 1/2/3 references       | Fixed across all 7 spec files + CLAUDE.md                                                |
| 9   | Ticket ID format: nanoid vs ULID     | Standardized to ULID everywhere (matching all other backend IDs)                         |
| 10  | X-Session-Token in code examples     | Replaced with `Authorization: Bearer`                                                    |
| 11  | REVIEW_REPORT.md entirely stale      | Replaced with this document                                                              |
| 12  | "Transparent guest list before RSVP" | Corrected to "RSVP counts visible before RSVP"                                           |

---

## Verdict

**READY FOR IMPLEMENTATION.**

All critical and major findings have been addressed. The architecture is clean:

- Single auth model (phone verification → JWT)
- No anonymous sessions
- Shared backend with additive-only changes
- Zero breaking changes to Flutter app
- 26 migrations (one statement per file, safe to retry)
- Proper R2 lifecycle management with orphan recovery
- Stripe webhook dedup via compound unique index
- Tombstone pages for deleted events
- Two-step EXIF proof for privacy marketing claims

_Last updated: 2026-02-17_
