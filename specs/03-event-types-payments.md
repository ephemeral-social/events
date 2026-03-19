# 03 — Event Types & Payments

## Simple Events (Default)

**Use cases:** Dinner parties, birthday parties, hangouts, house parties, picnics, game nights, watch parties.

**Payment model:** Peer-to-peer. Host adds their Venmo/Cash App/Zelle handle. No payment processing by Ephemeral. Zero cost to everyone.

**Event creation flow:**

1. Host taps "Create Event"
2. Enter title (required)
3. Enter date and time (required)
4. Enter location — address with map pin (required)
5. Add description (optional)
6. Upload cover photo (optional, EXIF metadata stripped on upload — placeholder pattern shown if none)
7. Set visibility: Public or Private (link only, default: Private)
8. Hide location until RSVP (toggle, default: OFF — for surprise events)
9. Show guest list to RSVP'd guests (toggle, default: OFF — see `02-guest-access-tiers.md`)
10. Set capacity / max attendees (optional — hard cap enforced when set, plus-ones count toward cap)
11. Add co-hosts (optional, via shareable invite link — see Co-Hosts section below)
12. Add cost details (optional): itemized or lump sum
13. Add payment handle: Venmo @username, Cash App $cashtag, or Zelle number
14. Publish → get shareable link + short URL (ephmr.al)

### Co-Hosts

Co-hosts are added via shareable invite links, not by phone number lookup. The host generates an invite link from the event dashboard and sends it however they want (text, DM, etc.). The recipient taps the link, verifies their phone if not already logged in, and becomes a co-host.

**Co-host permissions:** Full parity with the host — edit event details, toggle settings, manage costs, mark payments, send text blasts (shared 3-per-event pool), check in guests, issue refunds. The only thing co-hosts cannot do is **delete the event** — only the original creator can delete.

**Co-host removal:** Only the event creator can remove a co-host.

**Cost sharing flow (if host adds costs):**

Host adds one or more cost items (e.g., "Restaurant reservation: $400", "Wine: $60", "Decorations: $40"). Ephemeral totals the costs and divides by the number of "Going" RSVPs to calculate per-person share. This amount is cached on the event record (`cached_per_person_cents`) and displayed on each guest's event page.

**Visibility:** Cost details (itemized costs + per-person amount) are visible only after RSVP (any status). The host's payment handle is visible only to Going and Maybe guests — "Can't make it" guests don't see payment info.

When a guest taps "Pay [Host Name]", the app deep-links to their chosen payment app (Venmo/Cash App/Zelle) with the host's handle and exact per-person amount pre-filled.

Host and co-hosts see a reconciliation dashboard: list of Going guests with payment status (Unpaid / Marked as Paid). Host/co-host manually confirms payments as they receive them (honor system — same as Partiful's "Chip In" but with better UX). When RSVP count changes (someone new says Going, someone switches to Can't make it), the per-person amount recalculates automatically and all Going guests see updated amounts.

**"Maybe" RSVPs and cost splitting:** Maybe RSVPs are excluded from the split calculation. Only "Going" RSVPs are counted. If a Maybe switches to Going, the split recalculates.

---

## Ticketed Events (Opt-in)

**Use cases:** Comedy shows, house concerts, workshops, supper clubs, performances, ticketed gatherings.

**Payment model:** Stripe Connect Express. Real card payment processing with QR code tickets.

**Fee structure:**

**Actual Stripe cost per ticket:** 3.4% + $0.30 (standard 2.9% + $0.30 processing fee plus 0.5% Connect platform fee on Express accounts).

Two tiers based on ticket price:

**Tickets $25 and under (absorption + recoup):**

| Ticket Number | Who Pays Fee          | Fee Amount                           | Organizer Receives   |
| ------------- | --------------------- | ------------------------------------ | -------------------- |
| Tickets 1-50  | Ephemeral absorbs     | $0.00 to buyer                       | 100% of ticket price |
| Tickets 51+   | Buyer pays recoup fee | 6.8% + $0.60 (2× actual Stripe cost) | 100% of ticket price |

The recoup fee on tickets 51+ covers both the Stripe cost on that ticket AND pays back the fees Ephemeral absorbed on the first 50. At this rate, Ephemeral breaks even on ticket #100 for every event.

| Ticket Price | Stripe cost | Buyer fee (1-50) | Buyer fee (51+) | vs. Eventbrite |
| ------------ | ----------- | ---------------- | --------------- | -------------- |
| $10          | $0.64       | $0.00            | $1.28           | 41% less       |
| $15          | $0.81       | $0.00            | $1.62           | 31% less       |
| $20          | $0.98       | $0.00            | $1.96           | 23% less       |
| $25          | $1.15       | $0.00            | $2.30           | 15% less       |

**Tickets over $25 (pass-through from ticket #1):**

| Ticket Number | Who Pays Fee           | Fee Amount   | Organizer Receives   |
| ------------- | ---------------------- | ------------ | -------------------- |
| All tickets   | Buyer pays Stripe cost | 3.4% + $0.30 | 100% of ticket price |

No absorption on tickets over $25. Buyer pays actual Stripe cost from the first ticket. Still significantly cheaper than Eventbrite (33-54% less at $30-$100 price points).

**No configuration required.** The host doesn't set capacity, choose a fee option, or think about this at all. It's automatic.

**Maximum exposure per event:** $57.50 (50 × $1.15 at the $25 ceiling). Predictable and bounded.

**Budget guardrail:** Monitor monthly absorbed Stripe fees. If total exceeds $1,500/month, consider lowering the absorption threshold (e.g., first 30 tickets or cap at $20).

### Organizer Stripe Onboarding (One-Time)

When an organizer toggles "Sell Tickets" for the first time, they are redirected to Stripe's hosted onboarding form. Required information: email, phone number, legal name, date of birth, last four digits of SSN, home address, bank account or debit card for payouts. Estimated time: 3-5 minutes. This is a one-time setup — subsequent ticketed events use the same connected account.

### Ticketed Event Creation Flow

Steps 1-9 are identical to simple events (including co-host and visibility toggles). Then:

10. Toggle "Sell Tickets" on
11. Set ticket price (single tier for MVP)
12. Set capacity (optional — hard cap enforced, plus-ones' tickets count toward cap)
13. Complete Stripe Connect onboarding (if first time)
14. Publish → get shareable event page with "Get Ticket" button

**RSVP and ticket purchase are separate actions.** A guest RSVPs first (Going/Maybe/Can't make it), then separately buys ticket(s). The host dashboard shows RSVP status alongside ticket purchase status — so they can see who said "Going" but hasn't bought a ticket yet. Each plus-one declared in the RSVP needs their own purchased ticket.

### Buyer Ticket Purchase Flow

1. Guest visits event page via shared link
2. Sees event details, guest list, "Get Ticket" button with price
3. Taps "Get Ticket" → Stripe Checkout (hosted by Stripe, card/Apple Pay/Google Pay)
4. Payment completes → guest receives QR code ticket on-screen and via SMS
5. Guest is automatically RSVPed as "Going"
6. For tickets $25 and under: tickets 1-50 are charged exact ticket price (e.g., $15.00); ticket 51+ shows ticket price + recoup fee (e.g., $16.62). For tickets over $25: buyer always sees ticket price + processing fee (e.g., $52.00 on a $50 ticket).

### Check-In Flow

See `07-url-structure-qr-codes.md` for full ticket QR code and scanning specification.

### Ticket Transferability

Tickets are bearer instruments. No identity verification at check-in — whoever shows a valid, unused QR code gets in. If the purchaser shares their QR code, that's their choice. No explicit transfer mechanism in the product.

### Refunds

Host or co-host can issue full refunds from event dashboard. Stripe handles the mechanical refund to buyer's card. Ephemeral does not recover the absorbed processing fee on refunded tickets (cost of doing business).

### Event Cancellation

If the host (creator only, not co-hosts) cancels/deletes an event with sold tickets:

1. **All active tickets are automatically refunded** via Stripe (async, processed in queue).
2. **All RSVP'd guests receive an SMS** notifying them of the cancellation.
3. **Cancellation is irreversible** — no undelete, no undo.

---

## Stripe Connect Configuration

**Stripe cost breakdown per transaction:**

- 2.9% + $0.30 — standard processing fee
- 0.5% — Connect platform fee (charged by Stripe for Express accounts)
- **Total: 3.4% + $0.30 per transaction**

**Platform responsibility:** Ephemeral is responsible for fraud losses and chargebacks on Express connected accounts. Low risk for small social events ($10-25 tickets, known social circles) but Stripe Radar rules should be configured for monitoring.

### Platform Setup (One-Time)

1. Create Stripe account under Ephemeral PBC (or personal account to start, migrate later)
2. Go to Settings → Connect Settings in Stripe Dashboard
3. Upload Ephemeral logo, brand name, brand color (shown on organizer onboarding form)
4. Set Connect onboarding type to Express
5. Configure default payout schedule (daily recommended)
6. Grab API keys from Developers section → store as Cloudflare Worker environment variables
7. Set webhook endpoint URL → point to `stripe-webhook.ts` Worker route

### Organizer Onboarding Flow

When host toggles "Sell Tickets" for the first time:

```typescript
// Step 1: Create a connected account
const account = await stripe.accounts.create({
	type: 'express',
	country: 'US',
	capabilities: {
		card_payments: { requested: true },
		transfers: { requested: true }
	},
	business_type: 'individual',
	settings: {
		payouts: {
			schedule: {
				interval: 'daily' // Fastest possible payout
			}
		}
	},
	controller: {
		fees: { payer: 'application' }, // Platform pays all Stripe fees
		losses: { payments: 'application' }, // Platform absorbs chargebacks
		stripe_dashboard: { type: 'express' }
	}
});
// Save account.id to users.stripe_account_id

// Step 2: Generate onboarding link (Stripe hosts the entire form)
const accountLink = await stripe.accountLinks.create({
	account: account.id,
	refresh_url: `${BASE_URL}/stripe/refresh`, // If link expires, regenerate
	return_url: `${BASE_URL}/stripe/complete`, // After onboarding finishes
	type: 'account_onboarding'
});
// Redirect organizer to accountLink.url

// Step 3: On return, verify onboarding is complete
const connected = await stripe.accounts.retrieve(stripeAccountId);
if (connected.charges_enabled && connected.payouts_enabled) {
	// Good to go — organizer can sell tickets
} else {
	// Stripe needs more info — show "complete your setup" prompt
}
```

Stripe collects: legal name, DOB, last four SSN digits, address, bank account. Ephemeral never sees or stores this data. Onboarding takes 3-5 minutes. One-time per organizer — subsequent events reuse the same connected account.

### Checkout Session for Ticket Purchase

```typescript
// Creating a checkout session for a ticket buyer
// quantity = 1 (self) + plus_ones declared in RSVP
const quantity = requestedQuantity; // validated: <= user's plus_ones + 1

const session = await stripe.checkout.sessions.create(
	{
		mode: 'payment',
		line_items: [
			{
				price_data: {
					currency: 'usd',
					product_data: {
						name: `Ticket: ${event.title}`,
						description: `${event.date} at ${event.location}`
					},
					unit_amount: await getTicketPriceForBuyer(event, db)
				},
				quantity: quantity
			}
		],
		payment_intent_data: {
			application_fee_amount: 0, // Zero platform fee
			transfer_data: {
				destination: organizer.stripe_account_id
			}
		},
		metadata: {
			event_id: event.event_id,
			user_id: userId,
			quantity: String(quantity)
		},
		success_url: `${BASE_URL}/e/${event.slug}/ticket-confirmed?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${BASE_URL}/e/${event.slug}`
	},
	{
		idempotencyKey: `${event.event_id}:${userId}`
	}
);
```

### Fee Absorption Logic

```typescript
async function getTicketPriceForBuyer(event: Event, db: D1Database): Promise<number> {
	// Actual Stripe cost: 2.9% + $0.30 processing + 0.5% Connect platform fee = 3.4% + $0.30
	const stripeCost = Math.ceil(event.ticket_price_cents * 0.034 + 30);

	// Tickets over $25: buyer always pays Stripe cost, no absorption
	if (event.ticket_price_cents > 2500) {
		return event.ticket_price_cents + stripeCost;
	}

	// Tickets $25 and under: check how many sold
	const { count } = await db
		.prepare("SELECT COUNT(*) as count FROM tickets WHERE event_id = ? AND status = 'active'")
		.bind(event.event_id)
		.first();

	if (count < 50) {
		// First 50 tickets: Ephemeral absorbs fee — buyer pays exact ticket price
		return event.ticket_price_cents;
	} else {
		// Ticket 51+: buyer pays 2× Stripe cost (covers processing + recoups absorbed fees)
		return event.ticket_price_cents + stripeCost * 2;
	}
}
```

---

## Deep Link Generation (Peer-to-Peer Payments)

### Venmo Deep Links

```
venmo://paycharge?txn=pay&recipients={venmo_handle}&amount={amount}&note={event_code}
```

Fallback for users without the Venmo app:

```
https://venmo.com/?txn=pay&recipients={venmo_handle}&amount={amount}&note={event_code}
```

### Cash App Deep Links

```
https://cash.app/$cashtag/{amount}
```

### Zelle

Zelle does not support universal deep links. Display the host's Zelle-registered phone number or email with the amount, and instruct the guest to send via their banking app.

### Event Code Format

Pre-filled payment note for reconciliation: `Ephemeral-{guest_first_name}-{event_id_short}`

Example: `Ephemeral-Jake-xk9m2f`

This standardized note format helps hosts match payments to guests on their reconciliation dashboard.
