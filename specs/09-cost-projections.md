# 09 — Cost Projections

## Infrastructure Costs (Cloudflare)

| Component    | Estimated Monthly Cost | Notes                                                                        |
| ------------ | ---------------------- | ---------------------------------------------------------------------------- |
| Workers      | $5 (paid plan)         | 10M requests/mo included. Covers both main API and ephmr.al redirect worker. |
| D1           | $5                     | 5B rows read, 25M rows written                                               |
| R2           | $0-15                  | Storage scales with photos + QR code images, auto-delete bounds it           |
| Images       | $5-20                  | Resize/transform on upload                                                   |
| KV           | $5                     | Sessions, cache, rate limits, short link mappings                            |
| Pages        | $0 (free tier)         | Static hosting                                                               |
| Queues       | $0-5                   | Background job processing                                                    |
| **Subtotal** | **$20-55/month**       |                                                                              |

## External Service Costs

| Service                      | Estimated Monthly Cost | Notes                                                                                                                                                   |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Twilio SMS                   | $50-200                | ~$0.0079/SMS segment. At 1,000 events with 2 reminders each to 10 verified guests: ~20,000 SMS = ~$158. Short URLs (ephmr.al) reduce SMS segment count. |
| Stripe                       | Platform fee only      | $0/month for Connect. Per-transaction fees absorbed as CAC.                                                                                             |
| Domain (ephemeralsocial.com) | ~$15/year              |                                                                                                                                                         |
| Domain (ephmr.al)            | TBD/year               | Albania TLD pricing varies by registrar                                                                                                                 |
| Domain (fuckpartiful.com)    | Already owned          |                                                                                                                                                         |
| **Subtotal**                 | **$50-200/month**      |                                                                                                                                                         |

## Stripe Fee Absorption (Customer Acquisition Cost)

Fee absorption only applies to tickets $25 and under, and only for the first 50 tickets per event. Actual Stripe cost per ticket: 3.4% + $0.30 (includes 0.5% Connect platform fee). Maximum exposure per event: $57.50. Recoup fees on tickets 51+ (6.8% + $0.60) pay back absorbed costs by ticket #100.

| Scale    | Ticketed Events/Mo | Avg Tickets Sold | Monthly Absorbed (worst case) | Recouped from 51+ fees              |
| -------- | ------------------ | ---------------- | ----------------------------- | ----------------------------------- |
| Launch   | 5                  | 25 each          | ~$101                         | $0 (all under 50)                   |
| Growing  | 20                 | 30 each          | ~$486                         | $0 (all under 50)                   |
| Traction | 50                 | 30 each          | ~$1,215                       | $0 (all under 50)                   |
| Scaling  | 50                 | 80 each          | ~$1,215 absorbed              | ~$1,215 recouped from tickets 51-80 |

At scale with events selling 80+ tickets, recoup fees fully offset absorption costs. Net Stripe cost trends toward zero as events grow past 100 tickets.

## Total Monthly Burn

| Phase     | Infrastructure | Twilio | Stripe Absorption | Total   |
| --------- | -------------- | ------ | ----------------- | ------- |
| Month 1-2 | $25            | $50    | $101              | ~$176   |
| Month 3-4 | $35            | $100   | $486              | ~$621   |
| Month 5-6 | $50            | $200   | $1,215            | ~$1,465 |

**These costs are manageable on grant funding and even on personal budget during early months.** Total first-year infrastructure cost estimated at $5,000-$10,000 — far below any grant funding target.

## Cost per Acquired User

At $0.64 per absorbed Stripe cost (on a $10 ticket), the cost per phone-verified user via ticket purchase is $0.64. Maximum $1.15 (on a $25 ticket). This compares favorably to industry benchmarks of $2-5 for app installs and $5-15 for Facebook lead generation campaigns. At scale, recoup fees on tickets 51+ offset these costs entirely.
