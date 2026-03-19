# Ephemeral Events — Web App MVP Specification

## Document Index

This specification is split into individual files for easier editing and reference. Each file is self-contained but cross-references others where relevant.

**Prepared for:** Ephemeral Foundation / Ephemeral PBC
**Date:** February 2026

**Strategic context:** Events are the primary user acquisition channel for the broader Ephemeral platform. The events web app ships first as a standalone product, validates product-market fit, builds a user base, and provides real traction data for grant applications (NLnet, Mozilla Fellowship, AWS IMAGINE Grant). When the full Ephemeral app launches, event users migrate seamlessly — solving the cold start problem.

### Spec Files

| File                           | Contents                                                                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `01-product-positioning.md`    | Marketing pillars, fuckpartiful.com, target beachhead, Partiful complaint resolution map                                                                                                      |
| `02-guest-access-tiers.md`     | Visitor vs Verified Guest access, feature matrix, guest list visibility                                                                                                                       |
| `03-event-types-payments.md`   | Simple events, ticketed events, Stripe Connect config, fee absorption logic, deep links                                                                                                       |
| `04-features.md`               | Recurring events, photo gallery, event wall, notification system                                                                                                                              |
| `05-privacy-architecture.md`   | Data lifecycle, privacy guarantees, privacy dashboard                                                                                                                                         |
| `06-technical-architecture.md` | Frontend stack (SvelteKit, shadcn-svelte, Phosphor icons), dark mode design system (colors, typography, styling rules), Cloudflare infrastructure, database schema, API routes, cron schedule |
| `07-url-structure-qr-codes.md` | URL scheme, ephmr.al short links, QR code generation, ticket scanning                                                                                                                         |
| `08-validation-metrics.md`     | Hypotheses, success metrics by phase, failure signals                                                                                                                                         |
| `09-cost-projections.md`       | Infrastructure costs, Twilio costs, Stripe fee absorption projections                                                                                                                         |
| `10-roadmap-and-scope.md`      | Implementation phases, migration path, out-of-scope features                                                                                                                                  |
