# Aesthetic Spec Gap Analysis

**Date**: February 2026
**Purpose**: Identify every UI element, state, interaction, and component in the codebase that is NOT fully specified across all 4 aesthetic specs (Simple, Fun, Warm, Elegant).
**Method**: Exhaustive code inventory compared element-by-element against each spec document.

---

## Table of Contents

1. [Elements Fully Specified](#1-elements-fully-specified)
2. [Elements Partially Specified](#2-elements-partially-specified)
3. [Elements NOT Specified At All](#3-elements-not-specified-at-all)
4. [States & Interactions Not Covered](#4-states--interactions-not-covered)
5. [Cross-Category Consistency Issues](#5-cross-category-consistency-issues)
6. [Recommendations](#6-recommendations)

---

## 1. Elements Fully Specified

These elements have clear specification across all 4 aesthetic categories for typography, spacing, colors, border radius, shadows, copy/language, layout, and animation.

### 1.1 Core Typography System
- **Heading font family**: All 4 specs define heading fonts (Simple: Inter, Fun: Manrope 800, Warm: Cormorant Garamond, Elegant: Cormorant Garamond)
- **Body font family**: All 4 specs define body fonts (Simple: Inter, Fun: Manrope, Warm: Source Sans 3, Elegant: Raleway)
- **Type scale tokens**: All 4 specs define title, section, body, caption, label sizes and weights
- **Line height**: All 4 specs define body-line-height values

### 1.2 Color Palettes
- **Surface colors** (background, card, overlay): All 4 specs define complete surface stacks in OKLCH
- **Text colors** (primary, secondary, muted): All 4 specs define foreground hierarchy
- **Accent colors** (primary, hover, ring): All 4 specs define accent system
- **Error/destructive colors**: All 4 specs define error states
- **Light/dark mode**: All 4 specs provide both modes for each palette

### 1.3 RSVP CTA Buttons (Going / Maybe / Can't Make It)
- **Button shape**: All 4 specs define radius (Simple: 8px, Fun: 16px, Warm: 10px, Elegant: 3px)
- **Button copy labels**: All 4 specs define RSVP labels (Simple: "Going"/"Maybe"/"Can't go", Fun: "Going"/"Maybe"/"Can't Make It", Warm: "I'll be there"/"Maybe"/"Can't make it", Elegant: "Accept with Pleasure"/"Regretfully Decline"/no Maybe)
- **Active/pressed states**: All 4 specs define press feedback

### 1.4 Border Radius System
- **Cards/containers**: All 4 define card radius (Simple: 12px, Fun: 16px, Warm: 10px, Elegant: 3px)
- **Buttons**: All 4 define button radius
- **Inputs**: All 4 define input radius
- **Badges**: All 4 define badge radius

### 1.5 Shadow System
- **Shadow tokens**: All 4 define shadow philosophy (Simple: none, Fun: accent-colored glow, Warm: warm diffused, Elegant: minimal precise)

### 1.6 Divider/Separator Style
- All 4 specs define divider approach (Simple: hairline primary, Fun: cards replace dividers, Warm: soft warm lines, Elegant: ornamental centered rules)

### 1.7 Animation & Motion Philosophy
- All 4 specs define overall motion approach (Simple: near-zero, Fun: bouncy/staggered, Warm: gentle/organic, Elegant: refined/deliberate)

### 1.8 Guest Count Format
- All 4 specs define count display format

### 1.9 Date/Time Format
- Standard across all aesthetics (no per-aesthetic change needed)

---

## 2. Elements Partially Specified

These elements are addressed in some specs but missing in others, or are specified at the conceptual level without implementation-level detail.

### 2.1 Hero Cover Section (`HeroCover.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Cover visibility | Specified: "Hidden by default, optional small 200px image" | Specified: "Full-bleed 100dvh with parallax" | Partially: "warm, integrated" but no px specs | Partially: "full-bleed hero" but no px specs |
| Parallax effect | Specified: "None" | Specified: "GSAP yPercent: -20" | Missing: not specified | Missing: not specified |
| Progressive blur on scroll | Specified: "None" | Specified: "0px to 8px" | Missing | Missing |
| Gradient scrim stops | Not applicable (no hero) | Specified: "5-stop gradient" | Missing | Missing |
| Hero text shadow | Not applicable | Existing code carries forward (per spec) | Missing | Missing |
| Vignette overlay per theme | Not applicable | Not specified (exists in code) | Missing | Missing |
| GenerativeCover fallback | Not specified for any aesthetic | Not specified | Not specified | Not specified |
| Cover video support | Not mentioned in any spec | Not mentioned | Not mentioned | Not mentioned |

**Code reference**: `HeroCover.svelte` contains gradient scrim with 5 stops, parallax via GSAP, progressive blur, theme-specific vignette overlays, video cover support, and a GenerativeCover fallback. Only Fun specifies most of these. Simple says "no hero." Warm and Elegant mention hero conceptually but provide no implementation details.

### 2.2 RSVP Status Bar (`RsvpStatus.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Bar layout/position | Specified: "Sticky bottom, 1px top divider" | Specified: "Fixed z-50, frosted glass on scroll" | Missing | Missing |
| Host mode display | Not specified | Partially: "Hosting" label mentioned | Missing | Missing |
| Crown icon for host | Not specified in any aesthetic | Not specified | Not specified | Not specified |
| Settings gear icon | Not specified | Partially mentioned in copy table | Not specified | Not specified |
| Change/Done toggle | Simple: "Change" link | Fun: "Change"/"Done" labels | Missing | Missing |
| Icon pop animation on change | Not specified | Mentioned as existing, keeps | Missing | Missing |
| Frosted glass transition | Not applicable | Specified | Missing | Missing |

**Code reference**: `RsvpStatus.svelte` has 3 states (host with Crown icon + Settings gear, RSVP'd with status icon + Change/Done toggle, plus-one display, icon pop animation on status change). No spec fully defines the host-mode UI treatment per aesthetic.

### 2.3 RSVP Form Bottom Sheet (`RsvpForm.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Status button labels | Specified | Specified | Specified | Specified |
| Plus-one stepper UI | Not specified | Not specified | Not specified | Not specified |
| SMS reminders checkbox | Not specified | Not specified | Not specified | Not specified |
| Text blasts opt-in checkbox | Not specified | Not specified | Not specified | Not specified |
| Custom checkbox styling | Not specified | Not specified | Not specified | Not specified |
| Custom stepper styling | Not specified | Not specified | Not specified | Not specified |

**Code reference**: `RsvpForm.svelte` contains a plus-one stepper (Minus/Plus buttons with counter), an SMS reminders checkbox, and a text blasts checkbox. The checkboxes use custom accent-colored styling. None of the 4 specs address these form elements.

### 2.4 Bottom Sheet (`BottomSheet.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Corner radius (top) | Not specified | Specified: "24px top" | Not specified | Not specified |
| Background color | Not specified | Specified: "var(--popover)" | Not specified | Not specified |
| Drag handle style | Not specified | Not specified | Not specified | Not specified |
| Dismiss threshold | Not specified | Not specified | Not specified | Not specified |
| Animation timing | Not specified | Specified: "300ms cubic-bezier" | Not specified | Not specified |
| Backdrop blur | Not specified | Not specified | Not specified | Not specified |
| Max height | Not specified | Not specified | Not specified | Not specified |

**Code reference**: `BottomSheet.svelte` uses `rounded-t-2xl`, `var(--surface-overlay)` background, 4px blur backdrop, 120px dismiss threshold, 300ms cubic-bezier animation. The drag handle is a 9px x 1px rounded pill in `var(--text-muted)` at 40% opacity. Only Fun partially addresses the bottom sheet radius.

### 2.5 Auth Modal (`AuthModal.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Modal overall styling | Not specified | Not specified | Not specified | Not specified |
| Phone input step | Not specified | Not specified | Not specified | Not specified |
| Code verification step | Not specified | Not specified | Not specified | Not specified |
| Name entry step | Not specified | Not specified | Not specified | Not specified |
| Backdrop blur | Not specified | Not specified | Not specified | Not specified |
| iOS keyboard proxy input | Not specified | Not specified | Not specified | Not specified |
| Focus trapping | Not specified | Not specified | Not specified | Not specified |

**Code reference**: `AuthModal.svelte` is a 3-step auth flow (phone input, code verification, name entry) with modal backdrop blur, custom rounded card container, and iOS keyboard proxy handling. No spec addresses this component at all.

### 2.6 Ticket Purchase Flow (`TicketPurchase.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Quantity stepper UI | Not specified | Not specified | Not specified | Not specified |
| Stripe Elements appearance | Not specified | Not specified | Not specified | Not specified |
| Payment stage layout | Not specified | Not specified | Not specified | Not specified |
| Success stage ("You're in!") | Not specified | Not specified | Not specified | Not specified |
| Price display format | Not specified | Not specified | Not specified | Not specified |
| Back button on payment | Not specified | Not specified | Not specified | Not specified |
| "Secure payment via Stripe" badge | Not specified | Not specified | Not specified | Not specified |

**Code reference**: `TicketPurchase.svelte` has 3 stages (select with quantity stepper, payment with Stripe Elements, success with checkmark and ticket cards). The Stripe appearance is themed to match the current dark warm palette. No spec addresses any part of the ticketing UI.

### 2.7 Guest List (`GuestList.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Tab bar (Going/Maybe/Declined) | Not specified | Not specified | Not specified | Not specified |
| Guest row layout | Not specified | Fun mentions avatar stack but not the list | Not specified | Not specified |
| Payment status badges (Paid/Unpaid/Refunded) | Not specified | Not specified | Not specified | Not specified |
| Check-in indicator | Not specified | Not specified | Not specified | Not specified |
| Plus-one display in list | Not specified | Not specified | Not specified | Not specified |
| Host vs guest visibility difference | Not specified | Not specified | Not specified | Not specified |

**Code reference**: `GuestList.svelte` has a 3-tab bar (Going/Maybe/Declined), guest rows with initials, display names, plus-one counts, payment status badges, and check-in status indicators. Host sees all 3 tabs; guests see Going/Maybe only. No spec addresses this component.

### 2.8 Share Panel (`SharePanel.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| QR code toggle | Not specified | Not specified | Not specified | Not specified |
| Native share button | Simple: "Ghost button, share" | Not specified | Not specified | Not specified |
| Copy link button | Not specified | Not specified | Not specified | Not specified |
| URL display text | Not specified | Not specified | Not specified | Not specified |

**Code reference**: `SharePanel.svelte` has a QR code toggle (expanding to `QrCodeDisplay`), a native share button, and a copy-link button with URL display. Simple mentions a share button exists but not the panel contents.

### 2.9 Event Feed (`EventFeed.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Photo stories strip | Not specified | Not specified | Not specified | Not specified |
| Upload circle in strip | Not specified | Not specified | Not specified | Not specified |
| Comment list display | Simple: "Hidden if empty" | Fun: "After RSVP" | Not specified | Not specified |
| Host update styling (Megaphone icon) | Not specified | Not specified | Not specified | Not specified |
| Comment input + send button | Not specified | Not specified | Not specified | Not specified |
| Photo viewer integration | Not specified | Not specified | Not specified | Not specified |

**Code reference**: `EventFeed.svelte` contains a photo stories horizontal strip (with upload circle and photo thumbnails), a comments list with host-update styling (Megaphone icon, accent left border), and a comment input with send button. Photo thumbnails link to a full-screen `PhotoViewer`. Specs only say whether comments/photos sections are visible or hidden.

### 2.10 Capacity Warning (`CapacityWarning.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Banner styling | Not specified | Not specified | Not specified | Not specified |
| Warning icon | Not specified | Not specified | Not specified | Not specified |
| Color for <=10 vs 0 spots | Not specified | Not specified | Not specified | Not specified |
| Copy text | Not specified | Not specified | Not specified | Not specified |

**Code reference**: `CapacityWarning.svelte` displays two severity levels: orange warning for <=10 spots, red for 0 spots. Uses Warning icon from Phosphor. No spec addresses this banner.

### 2.11 Privacy Dashboard (`PrivacyDashboard.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Overall visibility | Simple: "Hidden, accessible via link" | Fun: "Always" (privacy badge) | Not specified | Not specified |
| Grid layout | Not specified | Not specified | Not specified | Not specified |
| Auto-delete countdown | Not specified | Not specified | Not specified | Not specified |
| Photo count display | Not specified | Not specified | Not specified | Not specified |
| EXIF status display | Not specified | Not specified | Not specified | Not specified |

**Code reference**: `PrivacyDashboard.svelte` is a 2-column grid card showing: photo count, EXIF strip status, data sharing status, and auto-delete countdown. Simple says it is hidden. Fun mentions a "privacy badge" (simplified text). Warm and Elegant do not address it.

### 2.12 Confetti Component (`Confetti.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Whether confetti fires | Simple: "No confetti" | Fun: "Confetti on RSVP Going" | Warm: not specified | Elegant: not specified |
| Particle count | Not applicable | Not specified (code: 18) | Not specified | Not specified |
| Particle colors | Not applicable | Specified per palette | Not specified | Not specified |
| Particle size | Not applicable | Not specified (code: 8x8px) | Not specified | Not specified |

**Code reference**: `Confetti.svelte` fires 18 particles from click origin on RSVP "Going." Simple spec says no confetti. Fun spec says keep confetti and specifies palette-based colors. Warm and Elegant do not say whether confetti is used.

### 2.13 NumberTicker (`NumberTicker.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Whether ticker animates | Simple: "No number ticker" | Fun: "NumberTicker animated" | Not specified | Not specified |
| Animation duration | Not applicable | Not specified (uses motion tokens) | Not specified | Not specified |

**Code reference**: `NumberTicker.svelte` animates RSVP count values with GSAP interpolation. Simple says no ticker. Fun says keep it. Warm and Elegant do not specify.

### 2.14 Ambient Canvas (`CanvasAmbient.svelte`)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Whether particles render | Simple: "No ambient" | Fun: "Always if supported" | Not specified | Not specified |
| Renderer mapping | Not applicable | Specified: sparkle/garden per palette | Not specified | Not specified |
| Opacity | Not applicable | Not specified (code: 0.4) | Not specified | Not specified |

**Code reference**: `CanvasAmbient.svelte` renders themed particle effects (forest, sakura, garden renderers). Simple says no ambient. Fun says keep and maps palettes to renderers. Warm and Elegant do not specify whether ambient effects exist.

---

## 3. Elements NOT Specified At All

These elements exist in the codebase but are not mentioned or addressed in ANY of the 4 aesthetic specs.

### 3.1 Ticket Card (`TicketCard.svelte`)
- QR code display (white background, rounded container)
- Ticket status labels (Active, Checked In, Used, Refunded)
- Status color coding (accent for active, error for refunded, muted for used)
- Ticket ID truncated display
- "Show this QR code at the door" caption
- QR error/loading states

### 3.2 Ticket Actions (`TicketActions.svelte`)
- Apple Wallet "Add to Wallet" badge button
- Loading spinner overlay on wallet generation
- iOS-only conditional rendering
- Wallet error message display

### 3.3 Check-in Link Card (`CheckinLinkCard.svelte`)
- Generate check-in link form (label input + generate button)
- Active token list with expiry countdown
- Copy link button with checkmark feedback
- Revoke link button (trash icon, destructive)
- QrCode section heading icon

### 3.4 Check-in Scanner Page (`CheckinScanner.svelte` + route)
- QR camera feed container
- Scan cooldown overlay with countdown ring animation
- Summary bar ("X of Y checked in")
- Result banner (success/warning/error states)
- Manual ticket ID input
- Search guests input with MagnifyingGlass icon
- Guest row with initials circle, name, status, check-in button

### 3.5 Check-in Guest Row (`CheckinGuestRow.svelte`)
- Initials circle with color states (accent for checked in, error for refunded, muted for pending)
- Ticket number display
- Check-in action button

### 3.6 Photo Grid (`PhotoGrid.svelte`)
- 3-column grid layout
- Upload button/label with Upload icon
- Upload success banner with EXIF stripped message
- "No photos yet" empty state
- "RSVP to view and upload photos" gated state
- Photo thumbnail aspect-square containers

### 3.7 Photo Viewer (`PhotoViewer.svelte`)
- Full-screen overlay (rgba(0,0,0,0.95) background)
- Close button (X icon, top-right)
- Navigation arrows (CaretLeft/CaretRight)
- Swipe navigation (horizontal for photos, vertical for dismiss)
- Photo counter ("1 / 5")
- Swipe-down-to-close with opacity/scale transition

### 3.8 Comment List (`CommentList.svelte`)
- Comment row layout (display name, timestamp, content)
- Host update styling (left accent border + Megaphone icon)
- Comment input with send button (PaperPlaneTilt icon)
- "RSVP to join the conversation" gated state
- "No comments yet" empty state
- Max-height scrollable container (320px)

### 3.9 QR Code Display (`QrCodeDisplay.svelte`)
- QR code with theme-derived colors (reads CSS variables)
- SVG/PNG download buttons (pill-shaped)
- URL display below QR code
- Loading/error states
- MutationObserver for theme change detection

### 3.10 Toast System (`Toast.svelte` + `ToastContainer.svelte`)
- Toast variant styling (success: green, error: orange/warning, info: blue)
- Slide-up animation (250ms cubic-bezier)
- Dismiss button (X icon)
- Swipe-to-dismiss interaction
- Container positioning (fixed bottom, z-9999)
- Exit animation (fade-out 200ms)

### 3.11 Action Sheet (`ActionSheet.svelte`)
- iOS-style grouped action buttons
- Destructive action color (error)
- Cancel button (separate card below actions)
- Backdrop blur overlay
- Slide-up animation

### 3.12 Install Banner (`InstallBanner.svelte`)
- PWA install prompt banner
- iOS "Add to Home Screen" instructions
- Dismiss/close functionality (currently disabled)

### 3.13 Navigation Progress Bar (`NavigationProgress.svelte`)
- 2px accent-colored bar at viewport top
- Indeterminate progress animation
- Accent glow shadow
- Completion animation (snap to 100%, fade out)

### 3.14 Pull-to-Refresh (`PullToRefresh.svelte`)
- Pull indicator with rotation arrow
- Spinner phase (continuous rotation)
- Checkmark phase (pop-in animation)
- Resistance factor and threshold values
- Phase transitions (idle, pulling, settling, loading, done, leaving)

### 3.15 Theme Picker (`ThemePicker.svelte` + `ThemeSwatch.svelte` + `ModeToggle.svelte` + `AccentPicker.svelte`)
- Theme swatch grid (5 columns)
- Theme icons per swatch (TreeEvergreen, MoonStars, Fire, etc.)
- Selected state indicator (check overlay, accent border + glow)
- Light/Dark mode toggle (pill radio group)
- Accent color preset swatches (8 presets: Rose, Tangerine, Gold, etc.)
- Custom hex color input
- Section headings ("Theme", "Appearance", "Accent color")

### 3.16 Event Form / Create Flow (`EventForm.svelte` + create route)
- Title input (headline size, focusLift action)
- Date/time picker inputs (2-column grid)
- Location fields (venue name, address)
- Description textarea
- Theme picker integration
- Settings card (max attendees, location hidden toggle, show guest list toggle)
- Event type selector (Free/Ticketed toggle buttons)
- Ticket price input (conditional)
- Slug preview display
- Submit button ("Create Event")
- All form input styling (rounded-xl, border, focus ring)

### 3.17 Edit Event Flow (edit route)
- Back button with ArrowLeft icon
- Title/description/venue/address input fields
- Theme picker integration
- Save button ("Save Changes")
- Error display

### 3.18 Ticket Confirmed Page (ticket-confirmed route)
- Success icon (CheckCircle in accent background circle)
- "You're in!" heading
- "Your ticket has been confirmed" subtext
- Back to event link
- Ticket loading/error states

### 3.19 Co-host Invite Page (cohost route)
- Crown icon in accent circle
- "Co-host Invite" heading
- "Accept Invite" button
- Success state ("You're a co-host!", redirect)
- Error state (XCircle icon, error message, "View Event" link)

### 3.20 Setup Ticketing Page (setup-ticketing route)
- Stripe Explainer modal (full-screen dialog)
  - Logo animation zone (Ephemeral + dots + Stripe)
  - Value prop cards (3-minute setup, data stays with Stripe, first 50 free)
  - "Begin setup" CTA
  - Dot wave animation
- Stripe Onboarding component
  - Loading state with spinner
  - Error state with retry button
  - Incomplete state with continue button
  - Active state (Stripe Connect embedded)
- Event context card (title, date, venue, price)

### 3.21 Cost Summary (`CostSummary.svelte`)
- Line items display
- Total amount
- Per-person share calculation
- Venmo/CashApp payment links
- Card container styling

### 3.22 Text Blast Form (`TextBlastForm.svelte`)
- Megaphone icon heading
- Message textarea (300 char limit)
- Send button
- Remaining blast count display (3 per event)

### 3.23 Host Guest Manager (`HostGuestManager.svelte`)
- Guest sections (Going/Maybe/Declined collapsible)
- Remove guest button (Trash icon)
- Confirmation dialog for removal
- Checked-in indicator badge

### 3.24 Reminder Sheet (`RsvpReminderSheet.svelte`)
- BellRinging icon
- Horizontally scrollable day pills
- Cancel/Set reminder buttons
- Loading spinner state

### 3.25 Dashboard Event Card (`EventCard.svelte`)
- Card with event title, date, going count
- "Host" badge (pill-shaped, accent colored)
- Shared element transition

### 3.26 Generative Cover Fallback (`GenerativeCover.svelte`)
- Seed-based radial gradient generation
- 8 warm color palettes
- Geometric ring decorations
- Drift animation (25s ease-in-out)

### 3.27 Ephemeral Events Logo (`EphemeralEventsLogo.svelte`)
- Logo image with light-mode inversion filter
- Size variants (sm/md/lg)

### 3.28 NavBar (`NavBar.svelte`)
- Fixed top navigation
- Frosted glass background (`backdrop-filter: blur(20px)`)
- Back button (CaretLeft icon)
- Centered title
- Action slot (right side)
- Safe area inset handling

### 3.29 Stripe Payment Elements Appearance
- `TicketPurchase.svelte` builds a Stripe appearance object reading CSS variables
- `StripeOnboarding.svelte` builds a Stripe Connect appearance with hardcoded Ephemeral palette values
- Neither adapts to aesthetic/palette changes

### 3.30 Collapsible Header (`CollapsibleHeader.svelte`)
- Referenced in file list but not imported in main event page

### 3.31 Debug Panel (`DebugPanel.svelte`)
- Development-only component (not user-facing, can be excluded from specs)

---

## 4. States & Interactions Not Covered

These are UI states, transitions, and interaction patterns that exist in code but have no aesthetic specification.

### 4.1 Loading States
- **Skeleton/spinner patterns**: Components use `CircleNotch` spinning icon or "Loading..." text. No spec defines loading state aesthetics per category.
- **Ticket loading**: "Loading your ticket..." text
- **Photo grid loading**: "Loading photos..." text
- **Comment loading**: "Loading..." text
- **Guest list loading**: "Loading guest list..." text

### 4.2 Error States
- **Network error messages**: "Network error. Please try again." -- no per-aesthetic treatment
- **Form validation errors**: Displayed as `text-body-sm text-[var(--feedback-error)]` -- no per-aesthetic error styling
- **Payment failure**: "Payment failed. Please try again." -- no per-aesthetic treatment
- **QR code generation failure**: Thin QrCode icon + error text -- no per-aesthetic treatment

### 4.3 Empty States
- Simple spec addresses empty states (hide empty sections). Fun says comments/photos appear "After RSVP."
- **No spec addresses**: Empty guest list, empty check-in list, no tickets, no cost items
- **"Be the first to share!"** (photos empty state) -- not specified per aesthetic
- **"No comments yet"** -- not specified per aesthetic

### 4.4 Disabled Button States
- All buttons use `disabled:opacity-50` -- no per-aesthetic disabled treatment
- No spec defines disabled opacity, cursor, or visual treatment

### 4.5 Form Input Focus States
- Code uses `focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--accent-glow)]`
- Fun spec mentions `--ring` token but does not specify focus ring width or glow
- Simple, Warm, Elegant do not specify form focus treatment

### 4.6 Scroll Behaviors
- **Content overlap on hero**: Code uses `-mt-6 rounded-t-2xl` to overlap hero. Fun specifies this. Others do not.
- **RSVP bar position transition**: Code transitions between `11dvh` (hero) and `safe-bottom` (scrolled). Only Fun specifies.
- **Frosted glass on scroll**: Only Fun specifies the frosted RSVP bar.

### 4.7 Haptic Feedback Patterns
- Code uses `hapticLight()`, `hapticSuccess()`, `hapticError()` from a haptics utility
- No spec mentions haptic feedback at all
- Used on: RSVP selection, payment flow, confetti trigger, theme swatch selection

### 4.8 Swipe Gestures
- Bottom sheet: swipe-down-to-dismiss with drag resistance
- Photo viewer: horizontal swipe for navigation, vertical swipe to close
- Toast: swipe-to-dismiss
- No spec defines swipe thresholds, resistance, or animation curves per aesthetic

### 4.9 Tombstone Page (`TombstonePage.svelte`)
- Post-deletion page with Hourglass icon, title, deletion date, removal message
- No spec addresses deleted event state per aesthetic

### 4.10 "Powered by Ephemeral" Branding
- Appears at bottom of hero in `HeroCover.svelte`
- No spec addresses this element's styling per aesthetic

### 4.11 Ticketing Banners on Event Page
- "Stripe verification in progress" banner
- "Ready to sell tickets -- set up Stripe" banner with setup link
- "Ticketing not set up" banner
- No spec addresses these banners

### 4.12 Calendar/Share Action Buttons Row
- Code has "Add to Calendar" and "Share" pill buttons below content
- Fun spec mentions these as "Secondary Action Buttons (Calendar, Share)" with spec
- Simple mentions a share ghost button. Warm and Elegant do not address these buttons.

### 4.13 Plus-One Display in RSVP Status
- When user has plus-ones, shows "+1 guest" or "+N guests" in RSVP status bar
- Not specified in any aesthetic

---

## 5. Cross-Category Consistency Issues

### 5.1 Token Naming Mismatch

The 4 specs use different CSS custom property naming conventions:

| Spec | Surface tokens | Text tokens | Accent tokens |
|------|---------------|-------------|---------------|
| Simple | `--color-bg`, `--color-surface`, `--color-fg` | `--color-fg-secondary`, `--color-fg-tertiary` | `--color-accent`, `--color-accent-fg` |
| Fun | `--background`, `--card`, `--foreground` | `--muted-foreground` | `--primary`, `--primary-foreground` |
| Warm | `--color-bg`, `--color-surface`, `--color-fg` | `--color-fg-secondary`, `--color-fg-muted` | `--color-accent`, `--color-accent-fg` |
| Elegant | `--color-bg`, `--color-surface`, `--color-fg` | `--color-fg-secondary`, `--color-fg-muted` | `--color-accent`, `--color-accent-fg` |

**Issue**: Fun uses the shadcn-svelte token names (`--background`, `--primary`, etc.) while Simple, Warm, and Elegant use a `--color-*` prefix system. The current codebase uses NEITHER convention -- it uses `var(--surface-base)`, `var(--surface-card)`, `var(--text-primary)`, `var(--accent-primary)`, etc. All 4 specs will need a unified mapping to the actual codebase tokens.

### 5.2 Existing Codebase Token Names vs Spec Token Names

The codebase currently uses these CSS variable names (found across all components):

| Codebase Token | Used In | Closest Spec Token |
|---------------|---------|-------------------|
| `--surface-base` | Background | Simple: `--color-bg`, Fun: `--background` |
| `--surface-card` | Card backgrounds | Simple: `--color-surface`, Fun: `--card` |
| `--surface-overlay` | Sheets, popovers | Fun: `--popover` |
| `--surface-input` | Form inputs | Not in any spec |
| `--surface-raised` | Elevated elements | Not in any spec |
| `--text-primary` | Primary text | Simple: `--color-fg`, Fun: `--foreground` |
| `--text-secondary` | Secondary text | Simple: `--color-fg-secondary`, Fun: `--muted-foreground` |
| `--text-muted` | Muted text | Simple: `--color-fg-tertiary` |
| `--accent-primary` | Accent color | Simple: `--color-accent`, Fun: `--primary` |
| `--accent-hover` | Accent hover | Simple: `--color-accent-hover` |
| `--accent-glow` | Focus glow | Fun: `--ring` |
| `--border-subtle` | Subtle borders | Fun: `--border` |
| `--border-default` | Default borders | Simple: `--color-border` |
| `--border-focus` | Focus border | Not in any spec |
| `--feedback-error` | Error states | Simple: `--color-error`, Fun: `--destructive` |
| `--feedback-success` | Success states | Simple: `--color-success` |
| `--feedback-warning` | Warning states | Not in any spec |
| `--feedback-info` | Info states | Not in any spec |
| `--backdrop-overlay` | Modal/sheet backdrop | Not in any spec |
| `--font-body` | Body font | All specs define this |
| `--chrome-bg` | NavBar background | Not in any spec |
| `--chrome-border` | NavBar border | Not in any spec |
| `--safe-bottom` | Safe area bottom | Not in any spec |
| `--shadow-sm/md/lg` | Shadow levels | Fun defines these |
| `--muted` | Muted background | Fun defines this |

**Issue**: Many codebase tokens (`--surface-input`, `--surface-raised`, `--feedback-warning`, `--feedback-info`, `--backdrop-overlay`, `--chrome-bg`, `--chrome-border`) have no spec equivalent in any aesthetic.

### 5.3 Phosphor Icon Usage Inconsistency

Simple spec provides a complete icon usage table (Appendix C). Fun spec does not provide an icon table. Warm and Elegant do not specify icon usage.

The codebase uses these icons that are not addressed in any spec's icon table:
- `Crown` (host status) -- used in RsvpStatus, cohost invite
- `Gear` (settings) -- used in RsvpStatus host mode
- `BellRinging` (reminder) -- used in RsvpReminderSheet
- `Megaphone` (text blast, host updates) -- used in TextBlastForm, EventFeed, CommentList
- `Ticket` (ticketing) -- used in TicketPurchase, TicketCard, setup-ticketing
- `ShieldCheck` (privacy, security) -- used in PrivacyDashboard, TicketPurchase, PhotoGrid
- `Camera` (photos) -- used in PrivacyDashboard, CheckinScanner
- `Image` (photos) -- used in PhotoGrid
- `Upload` (upload photos) -- used in PhotoGrid
- `PaperPlaneTilt` (send comment) -- used in CommentList
- `ChatCircle` (comments) -- used in CommentList
- `Trash`/`TrashSimple` (delete) -- used in HostGuestManager, CheckinLinkCard, PrivacyDashboard
- `Copy` (copy link) -- used in CheckinLinkCard
- `DownloadSimple` (download QR) -- used in QrCodeDisplay
- `Export` (share/iOS) -- used in InstallBanner
- `PlusSquare` (add to home) -- used in InstallBanner
- `Warning` (warnings) -- used in CapacityWarning, CheckinScanner, StripeOnboarding
- `CircleNotch`/`SpinnerGap` (loading spinners) -- used throughout
- `VideoCameraSlash` (camera error) -- used in CheckinScanner
- `MagnifyingGlass` (search) -- used in CheckinScanner
- `ArrowLeft`/`CaretLeft` (back navigation) -- used in multiple route pages, NavBar
- `X` (close/dismiss) -- used in multiple components
- `Tag` (event type) -- used in EventForm, StripeExplainer
- `Timer` (setup time) -- used in StripeExplainer
- `CurrencyDollar` (price) -- used in EventForm, setup-ticketing
- `TextT` (title) -- used in EventForm
- `ArrowClockwise` (refresh) -- used in PullToRefresh
- `Check` (selected/done) -- used in ThemeSwatch, AccentPicker, PullToRefresh

### 5.4 Warm and Elegant Specs Are Less Detailed Than Simple and Fun

| Section | Simple | Fun | Warm | Elegant |
|---------|--------|-----|------|---------|
| Type scale table | Complete with all tokens | Complete | Complete | Complete |
| Spacing scale table | Complete with page layout | Complete | Complete | Complete |
| Button spec | Complete (4 button types) | Complete (5 button types) | Complete (4 types) | Complete (3 types, no Maybe) |
| Color palettes | Complete (4 palettes, L/D) | Complete (4 palettes, L/D) | Complete (4 palettes, L/D) | Complete (4 palettes, L/D) |
| Border radius table | Complete | Complete | Complete | Complete |
| Divider spec | Complete | Complete | Complete | Complete |
| Shadow spec | Complete | Complete | Complete | Complete |
| Copy/language table | Complete | Complete | Complete | Complete |
| Layout spec | Complete with ASCII diagram | Complete with ASCII diagram | Complete with ASCII diagram | Complete with ASCII diagram |
| Animation spec | Complete (what exists, what doesn't) | Complete (existing + refinements) | Complete | Complete |
| Icon usage table | Complete (Appendix C) | Missing | Missing | Missing |
| Component visibility table | Complete | Complete | Complete | Complete |
| Integration/migration section | Complete | Complete | Complete | Complete |

The 4 specs are actually quite consistent in structure. The main gap is that Fun is the only one that explicitly addresses existing codebase elements by file name (Section 3: "Relationship to Current Codebase"). Simple, Warm, and Elegant define the system in abstract but do not map to specific component files.

### 5.5 Default Mode Conflict

| Aesthetic | Default Mode |
|-----------|-------------|
| Simple | Light |
| Fun | Dark |
| Warm | Depends on palette (hearth: light, others vary) |
| Elegant | Depends on palette (ivory: light, midnight: dark) |

The current codebase defaults to dark mode for all themes. The aesthetic system needs clear logic for setting initial mode based on aesthetic + palette.

---

## 6. Recommendations

### 6.1 High Priority (Block Implementation)

1. **Unify CSS token naming**: Create a mapping document that translates between the 3 naming conventions (spec `--color-*`, spec `--background/--primary`, codebase `--surface-*/--text-*/--accent-*`). Each aesthetic must produce values for the ACTUAL codebase tokens. This is the single biggest blocker.

2. **Specify missing codebase tokens**: The specs need to define values for tokens the codebase uses but specs ignore:
   - `--surface-input` (form input background)
   - `--surface-raised` (elevated elements like toast, install banner)
   - `--feedback-warning` (warning states, used in CapacityWarning, check-in)
   - `--feedback-info` (info states, used in Toast)
   - `--backdrop-overlay` (modal/sheet backdrop)
   - `--chrome-bg` and `--chrome-border` (NavBar)
   - `--text-inverse` (used in InstallBanner)

3. **Specify the Auth Modal per aesthetic**: This is a gating interaction for all RSVPs and purchases. It needs typography, spacing, and styling per aesthetic. Currently hardcoded.

4. **Specify form elements per aesthetic**: The RSVP form (plus-one stepper, checkboxes), create/edit forms, and ticket purchase stepper exist in code with hardcoded styling. Each aesthetic needs form element specifications.

### 6.2 Medium Priority (Should Specify Before Implementation)

5. **Specify the Bottom Sheet per aesthetic**: All aesthetics use bottom sheets. Need: corner radius, background, drag handle appearance, backdrop treatment, animation timing.

6. **Specify the Ticket Purchase flow per aesthetic**: This is a revenue-critical flow. Need: stage transitions, Stripe appearance per aesthetic, success state, quantity stepper styling.

7. **Specify loading/error/empty states per aesthetic**: Every component has these states. Define a pattern per aesthetic (e.g., Simple: text-only, no spinner; Fun: spinning icon + text; Warm: organic fade; Elegant: refined text).

8. **Specify the Guest List per aesthetic**: Tab bar styling, guest row layout, payment badges, check-in indicators.

9. **Specify Toast styling per aesthetic**: Toast variants (success/error/info), animation, positioning.

10. **Specify the Photo Grid and Photo Viewer per aesthetic**: Grid layout, upload UX, viewer overlay, navigation.

### 6.3 Lower Priority (Can Be Derived From Design System Tokens)

11. **Specify ticketing-related pages**: Check-in scanner, ticket confirmed, setup-ticketing -- these are secondary flows that can inherit from the base aesthetic tokens if the token system is complete.

12. **Specify the Stripe Explainer per aesthetic**: This is a one-time onboarding screen. Lower priority but should eventually match the aesthetic.

13. **Specify the Theme Picker per aesthetic**: The picker itself needs to adapt when previewing different aesthetics (especially since Simple uses different fonts).

14. **Specify Action Sheet per aesthetic**: iOS-style action sheets are used for host guest management (remove guest confirmation).

15. **Specify the NavBar per aesthetic**: Frosted glass treatment, font, back button style.

16. **Specify Pull-to-Refresh per aesthetic**: Indicator styling, spinner/checkmark appearance.

17. **Specify the Dashboard EventCard per aesthetic**: This appears in the my-events list and should inherit the event's aesthetic.

### 6.4 Not Needed (Can Skip)

18. **Debug Panel**: Development-only, not user-facing.
19. **Install Banner**: Currently disabled. Can be specified when re-enabled.
20. **Navigation Progress Bar**: A global UI element, not per-aesthetic. Uses accent-primary which adapts automatically.
21. **Haptic feedback**: Platform behavior, not visual -- no per-aesthetic specification needed.

### 6.5 Architectural Recommendations

22. **Add a "Common Elements" spec**: Create a shared document that defines the aesthetic treatment of elements common to ALL categories: Bottom Sheet, Auth Modal, Toast, Form Inputs (text, checkbox, stepper, textarea, date/time picker), Loading States, Error States, Empty States. Each aesthetic spec then references this common doc and overrides only what differs.

23. **Add an Icon Registry spec**: Create a single document mapping every Phosphor icon used in the codebase to its weight and size per aesthetic. Simple already has this (Appendix C). Extend it to all 4.

24. **Define a "token bridge" document**: Map the spec token names to the actual codebase CSS variable names. This is the implementation contract that developers reference. Without this, every aesthetic implementer will interpret the mapping differently.
