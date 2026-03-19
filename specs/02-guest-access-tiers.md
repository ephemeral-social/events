# 02 — Guest Access Tiers

## Visitor — No Account (View Only)

**How it works:** Anyone with the event link can see the event page. No login, no phone number, no account needed to VIEW an event.

**What they can see:**

- Event details: title, date/time, description, cover photo
- Location (unless host has enabled `location_hidden` — then location is shown only after RSVP)
- RSVP counts — "23 going, 8 maybe"

**What they cannot do:**

- RSVP
- See guest list names
- See cost details or payment handles
- View photo gallery
- Read or post comments on event wall
- Buy tickets
- Add to calendar
- Anything that requires interaction with the event

**Why this still matters:** The event page renders instantly via SSR when someone taps a shared link. They see what the event is, when/where it is, and how many people are going. The phone verification prompt appears only when they try to interact (RSVP, buy ticket).

---

## Verified Guest — Phone Number Required (All Interactions)

**How it works:** When a visitor taps "RSVP" or "Get Ticket", they're prompted to verify their phone number. Enter phone → receive SMS code → verify → interaction completes.

**What they can do:**

- RSVP (Going / Maybe / Can't make it) with plus-ones
- Change RSVP status after initial response
- See guest list with names (only if host has enabled guest list visibility)
- See cost details and per-person split (after RSVP)
- See payment handle and access one-tap payment deep link (Going + Maybe only)
- View and upload photos to gallery
- Read and post comments on event wall
- Buy tickets (ticketed events) — each plus-one needs their own ticket
- Add to calendar (ICS download)
- Receive SMS reminders (24hr, 1hr)
- Receive host text blasts
- Auto-RSVP ("always going") for recurring event series

**Technical implementation:** Uses the **existing Ephemeral backend SMS auth flow** — same endpoints, same user records, same JWT tokens. The SvelteKit server routes proxy auth requests to the shared backend:

1. `POST /v1/auth/phone/send-code` → sends Twilio Verify SMS
2. `POST /v1/auth/phone/verify-code` → returns `access_token` + `refresh_token`, auto-creates user if new
3. SvelteKit stores `refresh_token` in an HttpOnly cookie (KV-backed session), uses `access_token` for API calls

This creates a real user record in the shared `users` table (same table the Flutter app uses). The user's phone number, user_id (ULID), and all profile data carry over seamlessly to the full Ephemeral app. Phone number used only for event reminders, verification, and account identity — not sold, not shared, deleted when user requests.

---

## Guest List Visibility (Host Setting)

**Default: Hidden.** The guest list (names of who's going/maybe) is not shown to anyone except the host and co-hosts. Only RSVP counts are visible.

**Host can toggle: "Show guest list to RSVP'd guests."** When enabled, any verified guest who has RSVP'd can see the names of other attendees. This toggle is available during event creation and can be changed at any time from the event settings.

**Why hidden by default:**

- Respects attendee privacy — some people don't want others to know they're attending
- Prevents social pressure dynamics ("I'll only go if so-and-so is going")
- Aligns with Ephemeral's no-social-graph philosophy
- Host can always enable it for casual events (birthday parties, hangouts) where knowing who's coming is helpful

**When enabled, guest list shows:**

- Display name (from RSVP)
- Grouped by status: Going, Maybe
- "Can't make it" RSVPs are never shown to other guests (their decision is private)

**Host/co-host view (always visible regardless of toggle):**

- All RSVP statuses including "Can't make it"
- Ticket purchase status (for ticketed events)
- Payment status (for cost-sharing events)
- Plus-one counts

---

## Feature Matrix

| Feature                                 | Visitor (no account) | Verified Guest (phone)                      |
| --------------------------------------- | -------------------- | ------------------------------------------- |
| Event details, description, cover photo | Yes                  | Yes                                         |
| Location (if not hidden)                | Yes                  | Yes                                         |
| RSVP count ("23 going, 8 maybe")        | Yes                  | Yes                                         |
| RSVP                                    | No                   | Yes (Going/Maybe/Can't make it + plus-ones) |
| Change RSVP after initial response      | No                   | Yes                                         |
| Guest list with names (if host enabled) | No                   | Yes                                         |
| Cost details and per-person split       | No                   | Yes (after RSVP)                            |
| Payment handle + deep link              | No                   | Yes (Going + Maybe only)                    |
| Photo gallery (view + upload)           | No                   | Yes (Going + Maybe)                         |
| Read comments on event wall             | No                   | Yes                                         |
| Post comments on event wall             | No                   | Yes                                         |
| Buy tickets                             | No                   | Yes                                         |
| Add to calendar (ICS)                   | No                   | Yes                                         |
| SMS reminders (24hr, 1hr)               | No                   | Yes                                         |
| Host text blasts                        | No                   | Yes                                         |
| Recurring event auto-RSVP               | No                   | Yes                                         |

**Design principle:** Phone verification is the single gate. Once verified, you have full access. The verification serves three purposes: (1) bot protection, (2) enables SMS delivery, (3) creates a real user record for the Ephemeral platform. Every gate has a legitimate product reason — this isn't a growth hack, it's how the product works.

---

## Future: Full Ephemeral Account

**Not built in events MVP.** When the full Ephemeral app launches, verified guests can upgrade by downloading the app and creating a passkey. Their phone number carries over as their identity. All past event history is available.
