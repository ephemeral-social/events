# 05 — Privacy Architecture

## Data Lifecycle

| Data                 | Created               | Visible                                | Deleted                                                    |
| -------------------- | --------------------- | -------------------------------------- | ---------------------------------------------------------- |
| Event page           | On creation           | Until 7 days after event ends          | 7 days after event ends                                    |
| RSVP records         | On RSVP               | Until event deletion                   | With event                                                 |
| Photo gallery        | On upload             | 7 days after event ends                | Photos: 14 days after event. Metadata: stripped on upload. |
| Event wall comments  | On post               | Until event deletion                   | With event                                                 |
| Host payment handles | On event creation     | Until event deletion                   | With event                                                 |
| Guest phone numbers  | On phone verification | Never publicly visible                 | On user request or account deletion                        |
| Stripe payment data  | On ticket purchase    | Via Stripe dashboard (host only)       | Per Stripe retention policies                              |
| Short link mappings  | On event creation     | Never directly visible (redirect only) | With event                                                 |

## What Ephemeral Never Does

- Build a social graph from guest lists
- Show guest names by default — guest list is hidden unless the host explicitly enables it
- Track which events a user attends across different hosts
- Analyze guest list overlaps to infer social connections
- Retain event data after the deletion window
- Share guest data with third parties
- Serve ads or sell data
- Use guest behavior for algorithmic recommendations

## What Ephemeral Always Does

- Strip EXIF/GPS metadata from uploaded photos before storage — **with detailed proof shown to the uploader** (list of specific fields removed: GPS coordinates, camera model, datetime, software version, etc.)
- Encrypt data at rest on Cloudflare infrastructure
- Use TLS for all data in transit
- Delete event data on schedule (7 days after event ends)
- Show users exactly what data exists and when it will be deleted
- Display a real-time privacy dashboard on every event page (not just post-event)

## Privacy Dashboard (Always Visible)

The privacy dashboard is displayed on every event page at all times — before, during, and after the event. It updates in real time as data changes.

**Before/during event:**

> **Privacy Report for [Event Name]**
> 12 photos uploaded so far — all GPS/EXIF metadata stripped on upload
> 4 comments posted — will be deleted with event
> Your phone number: stored for your account only, never shared
> Data shared with third parties: none
> Data sold: none

**After event ends (7-day window):**

> **Privacy Report for [Event Name]**
> 47 photos uploaded — all GPS/EXIF metadata stripped on upload
> Photos stored encrypted — **deletion in 5 days, 14 hours**
> 12 comments posted — will be deleted with event
> Your phone number: stored for your account only, never shared
> Data shared with third parties: none
> Data sold: none

**After deletion:**

> **This event has been deleted permanently, forever, and ever.**

The dashboard is displayed prominently on the event page. It reinforces Ephemeral's privacy claims with concrete, verifiable data — not vague promises.
