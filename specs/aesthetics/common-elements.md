# Common Elements -- Cross-Aesthetic Component Specification

**Version**: 1.0
**Date**: February 2026
**Status**: Implementation-ready
**Scope**: Every shared UI component that must adapt its styling per aesthetic category

---

## Table of Contents

1. [Bottom Sheet](#1-bottom-sheet)
2. [Auth Modal](#2-auth-modal)
3. [Toast System](#3-toast-system)
4. [Form Inputs](#4-form-inputs)
5. [RSVP Form](#5-rsvp-form)
6. [Guest List](#6-guest-list)
7. [Ticket Purchase Flow](#7-ticket-purchase-flow)
8. [Share Panel](#8-share-panel)
9. [Event Feed / Wall](#9-event-feed--wall)
10. [Photo Grid & Viewer](#10-photo-grid--viewer)
11. [Capacity Warning](#11-capacity-warning)
12. [Ticket Card](#12-ticket-card)
13. [Host Settings Panel](#13-host-settings-panel)
14. [Reminder Sheet](#14-reminder-sheet)
15. [NavBar / Sticky Header](#15-navbar--sticky-header)
16. [Loading / Error / Empty States](#16-loading--error--empty-states)
17. [Tombstone Page](#17-tombstone-page)
18. [Action Sheet](#18-action-sheet)
19. [Confetti](#19-confetti)
20. [Ambient Canvas](#20-ambient-canvas)
21. ["Powered by Ephemeral" Footer](#21-powered-by-ephemeral-footer)
22. [Ticketing Banners](#22-ticketing-banners)
23. [Calendar & Share Buttons](#23-calendar--share-buttons)
24. [Generative Cover Fallback](#24-generative-cover-fallback)
25. [Phosphor Icon Registry](#25-phosphor-icon-registry)

---

## Token Naming Convention

This document references CSS custom properties from the individual aesthetic spec files. The token systems differ between specs:

| System | Spec Source | Example Tokens |
|--------|-----------|----------------|
| **Codebase (current)** | `src/` components | `--surface-base`, `--surface-card`, `--surface-overlay`, `--surface-input`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent-primary`, `--accent-hover`, `--border-subtle`, `--border-default`, `--border-focus`, `--accent-glow`, `--feedback-error`, `--feedback-warning`, `--feedback-success`, `--feedback-info`, `--chrome-bg`, `--chrome-border`, `--backdrop-overlay`, `--shadow-lg` |
| **Simple spec** | `simple.md` | `--color-bg`, `--color-surface`, `--color-fg`, `--color-fg-secondary`, `--color-fg-tertiary`, `--color-accent`, `--color-accent-fg`, `--color-divider`, `--color-border`, `--color-error` |
| **Fun spec** | `fun.md` | `--background`, `--foreground`, `--card`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--border`, `--ring`, `--destructive` |
| **Warm spec** | `warm.md` | Same as Fun (shadcn contract) |
| **Elegant spec** | `elegant.md` | Same as Simple (`--color-*` pattern) |

**Implementation requirement**: During the token migration, all four aesthetics MUST emit the codebase tokens (`--surface-base`, `--text-primary`, etc.) so that existing components work without modification. The per-spec tokens are an authoring convenience; the runtime output must match what components consume.

In the tables below, token references like `var(--surface-card)` refer to the **codebase tokens** (what components actually consume). Where an aesthetic requires a different underlying value, that is handled by the aesthetic's CSS custom property definitions in its own spec file.

---

## 1. Bottom Sheet

**Source file**: `src/lib/components/ui/bottom-sheet/BottomSheet.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Backdrop | `var(--backdrop-overlay)` with `backdrop-filter: blur(4px)` |
| Background | `var(--surface-overlay)` |
| Top radius | `rounded-t-2xl` (16px) |
| Drag handle | `h-1 w-9 rounded-full`, `var(--text-muted)` at 40% opacity |
| Dismiss threshold | 120px drag distance |
| Drag resistance | 0.5 |
| Max height | `92dvh` |
| Animation | 300ms `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Padding | `px-4 pb-4` |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Top border-radius** | `12px` (`rounded-xl`) | `24px` (`rounded-t-3xl`) | `12px` (`rounded-xl`) | `6px` |
| **Background** | `var(--surface-overlay)` | `var(--surface-overlay)` | `var(--surface-overlay)` | `var(--surface-overlay)` |
| **Backdrop blur** | `blur(4px)` | `blur(8px)` | `blur(4px)` | `blur(2px)` |
| **Backdrop color** | `oklch(0 0 0 / 30%)` | `var(--backdrop-overlay)` | `oklch(0 0 0 / 25%)` | `oklch(0 0 0 / 35%)` |
| **Drag handle width** | `36px` (w-9) | `36px` (w-9) | `40px` (w-10) | `32px` (w-8) |
| **Drag handle height** | `3px` | `4px` | `3px` | `2px` |
| **Drag handle color** | `var(--text-muted)` at 30% | `var(--text-muted)` at 50% | `var(--text-muted)` at 35% | `var(--text-muted)` at 25% |
| **Drag handle radius** | `9999px` | `9999px` | `9999px` | `1px` |
| **Border** | `1px solid var(--border-subtle)` | none | `1px solid var(--border-subtle)` at 50% opacity | `1px solid var(--border-default)` |
| **Shadow** | `--shadow-sticky` (hairline) | `--shadow-lg` (accent glow) | `--shadow-md` (warm diffused) | `--shadow-md` (minimal) |
| **Animation duration** | `200ms` | `300ms` | `400ms` | `350ms` |
| **Animation easing** | `ease` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | `cubic-bezier(0.22, 0.1, 0.36, 1.0)` | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| **Dismiss threshold** | `100px` | `120px` | `120px` | `100px` |
| **Max height** | `85dvh` | `92dvh` | `90dvh` | `88dvh` |
| **Inner padding** | `px-4 pb-4` | `px-4 pb-4` | `px-6 pb-6` (more breathing room) | `px-6 pb-6` |

### Simple-Specific Notes
- No shadow, no backdrop blur on desktop (only mobile gets blur).
- Sheet slides in from bottom with no bounce.
- Faster animation (200ms) to feel instant.

### Elegant-Specific Notes
- Near-square handle (2px height, 1px radius) matches the architectural precision.
- Thinner border visible at top edge.
- No frosted glass effect -- clean solid background.

---

## 2. Auth Modal

**Source files**: `src/lib/components/auth/AuthModal.svelte`, `src/lib/components/auth/PhoneInput.svelte`, `src/lib/components/auth/CodeInput.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Container | `max-w-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]` |
| Backdrop | `backdrop-blur-sm` with `var(--backdrop-overlay)` |
| Heading | `text-headline-md` |
| Input | `h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)]` |
| Submit button | `rounded-full bg-[var(--accent-primary)]` |
| Error text | `text-body-sm text-[var(--feedback-error)]` |
| Steps | 3-step flow: phone, verification code, display name |
| Code input | `text-center text-xl tracking-[0.3em]` |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Container radius** | `8px` | `16px` (`rounded-2xl`) | `10px` | `6px` |
| **Container border** | `1px solid var(--border-default)` | `2px solid var(--border-default)` | `1px solid var(--border-default)` | `1px solid var(--border-default)` |
| **Container shadow** | none | `--shadow-lg` (accent glow) | `--shadow-lg` (warm diffused) | `--shadow-lg` (minimal) |
| **Container padding** | `p-5` (20px) | `p-6` (24px) | `p-7` (28px) | `p-8` (32px) |
| **Heading font** | Inter 600 | Manrope 800 | Cormorant Garamond 400 | Cormorant Garamond 300 |
| **Heading text** | "Sign in" | "Let's get you in" | "Welcome" | "Kindly Identify Yourself" |
| **Phone label** | "Phone number" | "Your number" | "Phone number" | "Telephone" |
| **Send button text** | "Send code" | "Send verification code" | "Send verification code" | "Send Verification" |
| **Code label** | "Code" | "Verification code" | "Verification code" | "Verification Code" |
| **Code input tracking** | `0.3em` | `0.3em` | `0.3em` | `0.5em` |
| **Name prompt text** | "What's your name?" | "What should we call you?" | "What should we call you?" | "How Shall We Address You?" |
| **Helper text** | "We'll text you a code." | "We'll text you a code to verify your number." | "We'll send you a quick code." | "A verification code will be sent to your number." |
| **Input radius** | `8px` | `12px` (`rounded-xl`) | `8px` | `3px` |
| **Submit button radius** | `8px` | `9999px` (`rounded-full`) | `8px` | `3px` |
| **Submit button style** | Filled primary | Filled primary + accent glow | Filled primary | Ghost/outline primary |
| **Backdrop blur** | `blur(2px)` | `blur(4px)` | `blur(4px)` | `blur(2px)` |
| **Animation** | Instant appear (opacity only, 150ms) | Scale 0.95->1.0 + opacity, 250ms | Opacity + translateY 8px, 400ms | Opacity only, 350ms |
| **Back link text** | "Different number" | "Use a different number" | "Use a different number" | "Return to Previous Step" |

### Code Input Specifics

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| Font size | `text-lg` (18px) | `text-xl` (20px) | `text-xl` (20px) | `text-2xl` (24px) |
| Tracking | `0.25em` | `0.3em` | `0.3em` | `0.5em` |
| Input method | Single input, `inputmode="numeric"` | Same | Same | Same |
| Auto-submit | Yes, at 6 digits | Yes | Yes | Yes |
| Success feedback | Instant redirect | Confetti-style micro-animation on modal | Gentle checkmark fade | Subtle opacity pulse |

---

## 3. Toast System

**Source files**: `src/lib/components/ui/toast/Toast.svelte`, `src/lib/components/ui/toast/ToastContainer.svelte`, `src/lib/stores/toast.svelte.ts`

### Current Implementation

| Property | Value |
|----------|-------|
| Container | Fixed bottom, `z-[9999]`, `gap-2 px-4`, `max-w-md` |
| Toast card | `rounded-xl border var(--border-subtle) bg-[var(--surface-overlay)]` |
| Icons | CheckCircle (success/20/duotone), Warning (error/20/duotone), Info (info/20/duotone) |
| Icon colors | `var(--feedback-success)`, `var(--feedback-error)`, `var(--feedback-info)` |
| Text | `text-body-sm text-[var(--text-primary)]` |
| Dismiss | X icon size 16 bold `var(--text-muted)` |
| Enter animation | `toast-slide-up 250ms cubic-bezier(0.25, 0.1, 0.25, 1)` |
| Exit animation | `toast-fade-out 200ms ease-out` (opacity 0, translateY 10px) |
| Auto-dismiss | success: 1500ms, error: 5000ms, info: 3000ms |
| Max concurrent | 5 |
| Swipe dismiss | Yes (`use:swipeDismiss`) |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Toast radius** | `8px` | `16px` (`rounded-2xl`) | `10px` | `4px` |
| **Background** | `var(--surface-overlay)` | `var(--surface-overlay)` | `var(--surface-overlay)` | `var(--surface-overlay)` |
| **Border** | `1px solid var(--border-subtle)` | `2px solid var(--border-subtle)` | `1px solid var(--border-subtle)` at 50% | `1px solid var(--border-default)` |
| **Shadow** | none | `--shadow-sm` (accent tinted) | `--shadow-sm` (warm) | none |
| **Icon weight** | `regular` | `duotone` | `regular` | `regular` |
| **Icon size** | 18px | 20px | 18px | 16px |
| **Dismiss icon** | X, 14px, regular | X, 16px, bold | X, 14px, regular | X, 14px, regular |
| **Text style** | `text-body-sm` Inter 400 | `text-body-sm` Manrope 500 | `text-body-sm` Source Sans 3 400 | `text-body-sm` Raleway 400 |
| **Enter animation** | `opacity 0->1`, 150ms ease | `translateY(20px)->0 + opacity`, 250ms spring | `opacity + translateY(10px)`, 350ms ease-warm | `opacity 0->1`, 300ms ease |
| **Exit animation** | `opacity 1->0`, 100ms | `translateY(0)->10px + opacity`, 200ms | `opacity 1->0`, 250ms | `opacity 1->0`, 200ms |
| **Position** | Bottom-center | Bottom-center | Bottom-center | Top-center |
| **Auto-dismiss success** | 1200ms | 1500ms | 2000ms | 2500ms |
| **Auto-dismiss error** | 4000ms | 5000ms | 6000ms | 5000ms |
| **Auto-dismiss info** | 2000ms | 3000ms | 4000ms | 3000ms |
| **Swipe dismiss** | Yes | Yes | Yes | No (dismiss button only) |
| **Success text example** | "RSVP saved" | "You're going!" | "You're going" | "Your attendance is confirmed" |
| **Error text example** | "Error. Try again." | "Oops! Something went wrong." | "Something went wrong. Please try again." | "An error has occurred. Please try once more." |

### Elegant-Specific Notes
- Toasts appear at the TOP of the viewport (not bottom) to avoid disrupting the centered composition.
- No swipe dismiss -- users tap the X button. Formal interactions are deliberate.
- Longer auto-dismiss durations to allow reading the formal language.

---

## 4. Form Inputs

**Source files**: `src/lib/components/create/EventForm.svelte`, `src/routes/e/[slug]/edit/+page.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Text input | `h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2` |
| Title input | `h-12 rounded-xl` with `text-headline-sm` |
| Textarea | `rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] resize-none` |
| Label | `text-label-sm text-[var(--text-muted)]` with icon 14px regular |
| Focus state | `border-[var(--border-focus)] ring-2 ring-[var(--accent-glow)]` |
| Transition | `transition-colors duration-150` |
| Placeholder | `text-[var(--text-muted)]` |
| Error | `text-body-sm text-[var(--feedback-error)]` |
| Checkbox | `h-5 w-5 rounded border-[var(--border-default)] bg-[var(--surface-input)] accent-[var(--accent-primary)]` |
| Motion | `use:focusLift` on all inputs |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Input height** | `h-10` (40px) | `h-10` (40px) | `h-11` (44px) | `h-10` (40px) |
| **Title input height** | `h-11` (44px) | `h-12` (48px) | `h-14` (56px) | `h-12` (48px) |
| **Border radius** | `8px` | `12px` (`rounded-xl`) | `8px` | `3px` |
| **Border width** | `1px` | `2px` | `1px` | `1px` |
| **Border color (rest)** | `var(--border-subtle)` | `var(--border-subtle)` | `var(--border-subtle)` | `var(--border-default)` |
| **Border color (focus)** | `var(--border-focus)` | `var(--border-focus)` | `var(--border-focus)` | `var(--border-focus)` |
| **Focus ring** | none | `ring-2 ring-[var(--accent-glow)]` | `ring-1 ring-[var(--accent-glow)]` | none (border color change only) |
| **Focus lift** | No | Yes (`use:focusLift`) | Yes (gentler, 1px lift) | No |
| **Background** | `var(--surface-input)` | `var(--surface-input)` | `var(--surface-input)` | transparent (border only) |
| **Title input font** | Inter 600, 18px | Manrope 800, 20px | Cormorant Garamond 400, 24px | Cormorant Garamond 300, 28px |
| **Title input tracking** | `-0.02em` | `-0.02em` | `0.01em` | `0.08em` |
| **Label font** | Inter 500, 13px | Manrope 500, 13px | Source Sans 3 500, 14px | Raleway 400 UPPERCASE, 11px, `0.12em` tracking |
| **Label icon** | 14px regular | 14px regular | 16px regular | Hidden (no label icons) |
| **Placeholder** | `var(--text-muted)` | `var(--text-muted)` | `var(--text-muted)` | `var(--text-muted)`, italic |
| **Textarea rows** | 3 | 4 | 5 | 4 |
| **Checkbox size** | `h-4 w-4` | `h-5 w-5` | `h-5 w-5` | `h-4 w-4` |
| **Checkbox radius** | `3px` | `5px` | `4px` | `2px` |
| **Transition duration** | `100ms` | `150ms` | `280ms` | `200ms` |

### Elegant-Specific Notes
- Input backgrounds are transparent; only a bottom border or full border distinguishes the field.
- Labels are uppercase with wide tracking, positioned above the field.
- No focus ring -- the border color shifts from `--border-default` to `--border-focus` as the sole indicator.
- Placeholder text is set in italic to evoke handwritten form annotations.

---

## 5. RSVP Form

**Source files**: `src/lib/components/rsvp/RsvpForm.svelte`, `src/lib/components/rsvp/RsvpStatus.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Status buttons | Pill-shaped (`rounded-full`), Going/Maybe/Can't Make It |
| Status icons | Check (going), Minus (maybe), X (declined) -- all bold weight |
| Plus-one stepper | 24x24px circle buttons, 1px border, `rounded-9999px` |
| Counter | `text-label-sm font-medium tabular-nums` |
| SMS checkboxes | Custom 18x18px, 5px radius, 1.5px border, accent when checked |
| Transitions | All 150ms |
| RsvpStatus bar | `rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3` |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Status button shape** | `8px` rectangle | `9999px` pill | `8px` rounded rect | `3px` near-square |
| **Status button style** | Flat fill, no border | Filled + accent glow on Going | Filled, no glow | Ghost/outline, `1px solid` |
| **Going button text** | "Going" | "Going" | "I'll be there" | "Accept with Pleasure" |
| **Maybe button text** | "Maybe" | "Maybe" | "Let me check" | **HIDDEN** (no Maybe) |
| **Decline button text** | "Can't go" | "Can't Make It" | "I can't make it" | "Regretfully Decline" |
| **Going icon** | Check, regular, 16px | Check, bold, 18px | Check, regular, 16px | None (text only) |
| **Maybe icon** | Minus, regular, 16px | Minus, bold, 18px | None (text link) | N/A |
| **Decline icon** | X, regular, 16px | X, bold, 18px | None (text link) | None (text only) |
| **Plus-one stepper size** | 20x20px | 24x24px | 24x24px | 20x20px |
| **Plus-one stepper style** | `1px solid var(--border-default)` | `2px solid var(--border-subtle)` | `1px solid var(--border-default)` | `1px solid var(--border-default)` |
| **SMS checkbox** | Native browser checkbox | Custom 18x18px, accent fill | Custom 18x18px, accent fill | Custom 16x16px, accent border |
| **Status bar radius** | `8px` | `12px` (`rounded-xl`) | `10px` | `4px` |
| **Status bar shadow** | none | `--shadow-sm` | `--shadow-sm` | none |
| **Transition duration** | `100ms` | `150ms` | `280ms` | `200ms` |

### Warm-Specific Notes
- "Maybe" is shown as a text link below the primary button, not as an equal-weight button. Styled as underlined text in `var(--muted-foreground)`.
- RSVP labels use first-person conversational language.

### Elegant-Specific Notes
- No "Maybe" option at all. Only "Accept with Pleasure" and "Regretfully Decline".
- Buttons are ghost/outline style: `1px solid var(--border-default)`, `0.08em` letter-spacing, uppercase.
- Buttons stack vertically (not side-by-side), centered.
- Gap between buttons: `12px`.
- No icons inside buttons -- typography carries the design.

### CTA Buttons (Pre-RSVP, Hero Area)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Layout** | Single "RSVP" text button | Three side-by-side: Going / Maybe / Can't Make It | Single "I'll be there" + "Maybe" text link below | Stacked: "Accept with Pleasure" / "Regretfully Decline" |
| **Going button radius** | `8px` | `16px` (`rounded-2xl`) | `8px` | `3px` |
| **Going button fill** | `var(--accent-primary)` solid | `var(--accent-primary)` solid + glow | `var(--accent-primary)` solid | `transparent` with `1px solid var(--border-default)`, text in `var(--foreground)` |
| **Going button aspect** | Auto | `aspect-[2.2]` | Auto | Auto, `min-height: 48px` |
| **Maybe button** | Small text "Maybe" below | Equal-weight `rounded-2xl` | Underlined text link | N/A |
| **Decline button** | Small text "Can't go" | Equal-weight `rounded-2xl` subtle | Underlined text link | Ghost outline, lighter |
| **Animation on tap** | `scale(0.97)`, 100ms | `scale(0.97)`, 150ms + confetti burst | `scale(0.98)`, 120ms | `opacity: 0.8`, 200ms |

---

## 6. Guest List

**Source files**: `src/lib/components/guests/GuestList.svelte`, `src/lib/components/guests/HostGuestManager.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Section headers | `text-label-sm text-[var(--text-muted)]` (Going/Maybe/Declined with counts) |
| Guest name | `text-body-sm text-[var(--text-primary)]` |
| Plus-one display | `+N` in `text-[var(--text-muted)]` |
| Payment badges | Text-only: Paid=accent, Refunded=error, Unpaid=muted |
| Check-in indicator | CheckCircle icon 14px bold in accent |
| Host remove button | Trash 16px regular in muted, hover=error |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Section header font** | Inter 600, 13px, +0.01em | Manrope 700, 13px | Source Sans 3 500, 14px | Raleway 400, 11px, UPPERCASE, `0.12em` |
| **Guest name font** | Inter 400, 14px | Manrope 400, 14px | Source Sans 3 400, 16px | Raleway 400, 14px |
| **Row separator** | `1px solid var(--border-subtle)` (hairline inset) | None (spacing only, 8px gap) | `1px solid var(--border-subtle)` at 50% opacity | `1px solid var(--border-subtle)` at 60% (ornamental, centered 80% width) |
| **Row padding** | `py-1` (4px) | `py-1.5` (6px) | `py-2.5` (10px) | `py-2` (8px) |
| **Empty state** | "Be the first to RSVP" | "No one here yet -- be the first!" | "Be the first to join" | "No guests have replied" |
| **Tab labels** | Going / Maybe / Declined | Going / Maybe / Can't Make It | Going / Maybe / Can't make it | Attending / Declined (no Maybe tab) |
| **Payment badge style** | Text only, no decoration | Pill badge (`rounded-full px-2 py-0.5`) | Text only, parenthetical | Text only, italic |
| **Check-in icon** | CheckCircle, 12px, bold | CheckCircle, 14px, duotone | Check, 14px, regular | Check, 12px, regular |
| **Remove button** | Trash, 14px, muted | Trash, 16px, hover-glow | Trash, 14px, muted | Trash, 12px, muted, confirm dialog required |
| **Host manager heading** | "Manage Guests" | "Manage Guests" | "Guest Management" | "Manage Attendees" |
| **Max visible before scroll** | 10 rows | 8 rows | 6 rows (more spacing) | 8 rows |
| **Scroll area** | `max-h-72` | `max-h-80` | `max-h-96` | `max-h-80` |

---

## 7. Ticket Purchase Flow

**Source files**: `src/lib/components/tickets/TicketPurchase.svelte`, `src/lib/components/tickets/TicketCard.svelte`, `src/lib/components/tickets/TicketActions.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Stages | 3: select quantity, payment (Stripe), success |
| Quantity stepper | 32x32px circle buttons |
| Stripe appearance | Built from CSS variables |
| Success icon | CheckCircle 36px duotone in accent |
| Success heading | "You're in!" |
| Success subtext | "Your ticket has been confirmed." |
| Pay button | `rounded-full bg-[var(--accent-primary)]` |
| Security badge | ShieldCheck icon with "Secure payment via Stripe" |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Quantity stepper size** | 28x28px | 32x32px | 32x32px | 28x28px |
| **Stepper button radius** | `8px` | `9999px` (circle) | `8px` | `3px` |
| **Stepper border** | `1px` | `2px` | `1px` | `1px` |
| **Pay button radius** | `8px` | `9999px` (`rounded-full`) | `8px` | `3px` |
| **Pay button style** | Solid fill | Solid fill + glow | Solid fill | Ghost/outline |
| **Pay button text** | "Pay {price}" | "Pay {price}" | "Complete Purchase" | "Confirm Reservation -- {price}" |
| **Success icon** | CheckCircle, 28px, regular | CheckCircle, 36px, duotone | CheckCircle, 28px, regular | Check, 24px, regular |
| **Success heading** | "Confirmed" | "You're in!" | "You're all set" | "Your Reservation Is Confirmed" |
| **Success subtext** | "Ticket confirmed." | "Your ticket has been confirmed." | "Your ticket has been confirmed. We'll see you there." | "Your ticket has been secured. We look forward to welcoming you." |
| **Security badge icon** | ShieldCheck, 14px | ShieldCheck, 16px, duotone | ShieldCheck, 14px | ShieldCheck, 14px, regular |
| **Security badge text** | "Stripe" | "Secure payment via Stripe" | "Secure payment via Stripe" | "Payment secured via Stripe" |
| **Stage transition** | Instant (opacity 150ms) | Slide left 250ms | Crossfade 400ms | Crossfade 350ms |
| **Confetti on success** | No | Yes (burst from button) | No | No |

### Stripe Appearance Theme Mapping

The Stripe Elements appearance is built from CSS variables. Each aesthetic maps:

| Stripe Property | Simple | Fun | Warm | Elegant |
|-----------------|--------|-----|------|---------|
| `fontFamily` | Inter | Manrope | Source Sans 3 | Raleway |
| `colorPrimary` | `var(--accent-primary)` | `var(--accent-primary)` | `var(--accent-primary)` | `var(--accent-primary)` |
| `colorBackground` | `var(--surface-input)` | `var(--surface-input)` | `var(--surface-input)` | `transparent` |
| `borderRadius` | `8px` | `12px` | `8px` | `3px` |
| `colorText` | `var(--text-primary)` | `var(--text-primary)` | `var(--text-primary)` | `var(--text-primary)` |

---

## 8. Share Panel

**Source file**: `src/lib/components/share/SharePanel.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| QR toggle | `rounded-full bg-[var(--muted)]` |
| Share button | `rounded-full bg-[var(--accent-primary)]` |
| Copy link container | `rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)]` |
| Copy icons | Copy (resting) / Check (copied), 16px |
| Share icon | ShareNetwork, 16px |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Heading** | "Share" | "Share This Event" | "Share" | "Share This Invitation" |
| **QR toggle radius** | `8px` | `9999px` (`rounded-full`) | `8px` | `3px` |
| **Share button radius** | `8px` | `9999px` | `8px` | `3px` |
| **Share button style** | Solid fill | Solid fill + glow | Solid fill | Ghost/outline |
| **Link container radius** | `8px` | `12px` (`rounded-xl`) | `8px` | `3px` |
| **Link font** | Inter 400, 13px, monospace appearance | Manrope 400, 13px | Source Sans 3 400, 14px | Raleway 400, 13px |
| **Copy feedback** | Instant icon swap | Icon swap + green flash on container | Icon swap, gentle | Icon swap, 200ms transition |
| **QR code style** | White bg, 4px radius, no border | White bg, 8px radius, accent-tinted shadow | White bg, 6px radius, subtle warm shadow | White bg, no radius, 1px border |
| **QR code padding** | `p-3` | `p-4` | `p-4` | `p-4` with 6px inner "mat" |
| **Share via label** | Hidden | "Or share directly:" | "Share with friends:" | "Share This Invitation:" |
| **Share buttons layout** | Icon row (no labels) | Icon row with labels below | Icon row with labels | Text buttons, no icons |

---

## 9. Event Feed / Wall

**Source file**: `src/lib/components/event/EventFeed.svelte`, `src/lib/components/comments/CommentList.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Photo stories strip | 56x56px circles (`w-14 h-14`), `rounded-full` |
| Upload circle | Dashed border, Plus icon |
| Comment area | `max-h-80` scrollable |
| Host updates | `border-l-2 border-[var(--accent-primary)] pl-3` with Megaphone icon |
| Comment input | `h-10 rounded-xl` with PaperPlaneTilt send button (rounded-xl, 40x40px) |
| Comment text | `text-body-sm` |
| Author name | `text-body-sm font-medium` |
| Timestamp | `text-caption text-[var(--text-muted)]` |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Photo stories** | Hidden (no stories strip) | 56x56px circles, staggered entrance | 48x48px circles, no entrance animation | Hidden |
| **Upload button** | Text link "Add photo" | Dashed circle with Plus icon | Dashed circle, Plus icon, 48x48px | Text link "Add to Gallery" |
| **Host update border** | `border-l-1 var(--border-default)` | `border-l-2 var(--accent-primary)` | `border-l-1 var(--border-default)` at 50% | None (ornamental rule above instead) |
| **Host update icon** | None | Megaphone, 16px, duotone | None | None |
| **Comment input radius** | `8px` | `12px` (`rounded-xl`) | `8px` | `3px` |
| **Send button** | PaperPlaneTilt, 16px, `rounded-lg` | PaperPlaneTilt, 18px, `rounded-xl`, 40x40px | PaperPlaneTilt, 16px, `rounded-lg` | ArrowRight, 14px, `rounded-sm` |
| **Send button style** | Ghost, text-muted | Accent fill | Ghost, accent text | Ghost outline |
| **Comment separator** | Hairline divider, inset | `gap-3` (spacing only) | Hairline divider, centered 80% | Ornamental rule (40% width) |
| **Author name font** | Inter 500, 13px | Manrope 600, 13px | Source Sans 3 500, 14px | Raleway 500, 13px |
| **Section heading** | "Comments" | "The Wall" | "Conversation" | "Messages" |
| **Empty state** | Hidden entirely | "Be the first to post!" | Hidden entirely | Hidden entirely |
| **Max visible comments** | `max-h-72` | `max-h-80` | `max-h-96` | `max-h-80` |
| **Scroll reveal** | No | `use:scrollReveal={{ y: 15 }}` | `use:scrollReveal={{ y: 10, duration: 0.7 }}` | No |

### Warm-Specific Notes
- Individual posts are NOT wrapped in cards. They are separated by thin warm-tinted dividers.
- Post text uses the body font (Source Sans 3) at `1.75` line-height for generous readability.
- Photo attachments use `10px` border radius.

### Elegant-Specific Notes
- Section is labeled "Messages" (not "Comments" or "The Wall").
- Hidden by default -- host must explicitly enable it.
- When enabled, messages appear in centered blocks separated by ornamental rules.

---

## 10. Photo Grid & Viewer

**Source files**: `src/lib/components/gallery/PhotoGrid.svelte`, `src/lib/components/gallery/PhotoViewer.svelte`

### Current Implementation (PhotoGrid)

| Property | Value |
|----------|-------|
| Layout | 3-column grid, `gap-1.5` |
| Thumbnails | `aspect-square`, `rounded-lg` |
| Upload button | Pill-shaped |
| EXIF banner | Accent-colored with ShieldCheck icon |
| Scroll reveal | `use:scrollReveal` on thumbnails |

### Current Implementation (PhotoViewer)

| Property | Value |
|----------|-------|
| Overlay | `rgba(0,0,0,0.95)` fixed |
| Close | X, 24px, bold, top-right |
| Navigation | CaretLeft/CaretRight, 32px, bold |
| Counter | `text-body-sm` (0.875rem) at bottom center |
| Swipe horizontal | >60px threshold |
| Swipe vertical | >100px to close |

### Per-Aesthetic Overrides (PhotoGrid)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Columns** | 3 | 3 | 2 | 2 |
| **Gap** | `gap-1` (4px) | `gap-1.5` (6px) | `gap-2` (8px) | `gap-3` (12px) |
| **Thumbnail radius** | `8px` | `12px` (`rounded-lg`) | `10px` | `4px` |
| **Thumbnail border** | none | none | none | `1px solid var(--border-subtle)`, `padding: 3px` (framed) |
| **Upload button shape** | Text link "Add photos" | Pill button | Pill button, subtle | Ghost outline button |
| **Upload button text** | "Add photos" | "Upload Photos" | "Add Photos" | "Add to Gallery" |
| **EXIF banner** | Hidden (text-only note) | Full accent banner with ShieldCheck | Text note below grid | Italic text note, centered |
| **Section heading** | "Photos" | "Photos" | "Photos" | "Gallery" |
| **Scroll reveal** | No | `use:scrollReveal={{ y: 15 }}` | `use:scrollReveal={{ y: 10, duration: 0.7 }}` | No |
| **Max rows before "Show all"** | 3 (9 photos) | 3 (9 photos) | 3 (6 photos, 2-col) | 2 (4 photos, 2-col) |

### Per-Aesthetic Overrides (PhotoViewer)

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Overlay color** | `rgba(0,0,0,0.92)` | `rgba(0,0,0,0.95)` | `rgba(0,0,0,0.90)` | `rgba(0,0,0,0.95)` |
| **Close icon** | X, 20px, regular | X, 24px, bold | X, 20px, regular | X, 20px, regular |
| **Nav icons** | CaretLeft/CaretRight, 28px | CaretLeft/CaretRight, 32px, bold | CaretLeft/CaretRight, 28px | CaretLeft/CaretRight, 24px |
| **Counter style** | `text-caption` | `text-body-sm` with `tabular-nums` | `text-body-sm` | `text-caption`, Raleway, `0.08em` tracking |
| **Counter text** | "3 / 12" | "3 / 12" | "3 of 12" | "3 of 12" |
| **Swipe to close** | Yes (>80px) | Yes (>100px) | Yes (>100px) | No (button only) |
| **Image transition** | Instant swap | Crossfade 200ms | Crossfade 350ms | Crossfade 300ms |
| **Background transition** | None | Blur from page + darken | None | None |

### Elegant-Specific Notes
- Thumbnails have a `3px` padding + `1px` border creating a "matted photograph" effect.
- 2-column grid with generous `12px` gaps creates a gallery-like feel.
- Viewer has no swipe-to-close -- user must tap the X button.

---

## 11. Capacity Warning

**Source file**: `src/lib/components/rsvp/CapacityWarning.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Full (0 spots) | `bg-[var(--feedback-error)]/10 text-[var(--feedback-error)]` |
| Low (<=10 spots) | `bg-[var(--feedback-warning)]/10 text-[var(--feedback-warning)]` |
| Icon | Warning, 16px, bold |
| Container | `rounded-lg px-3 py-2` |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Container radius** | `8px` | `12px` (`rounded-xl`) | `10px` | `4px` |
| **Container padding** | `px-3 py-2` | `px-4 py-3` | `px-4 py-3` | `px-4 py-3` |
| **Container border** | `1px solid` (error/warning color at 20%) | none (bg fill only) | `1px solid` at 30% | `1px solid` (error/warning color at 40%) |
| **Icon** | Warning, 14px, regular | Warning, 16px, bold | Warning, 16px, regular | Warning, 14px, regular |
| **Full text** | "Full" | "This event is full" | "This gathering is full" | "Regretfully, this event has reached capacity" |
| **Low spots text** | "{n} spots left" | "Only {n} spots left!" | "{n} spots remaining" | "{n} places remain" |
| **Background opacity** | 8% | 12% | 8% | 5% |
| **Font** | Inter 500, 13px | Manrope 600, 14px | Source Sans 3 500, 14px | Raleway 400, 13px |

---

## 12. Ticket Card

**Source files**: `src/lib/components/tickets/TicketCard.svelte`, `src/lib/components/tickets/TicketActions.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Container | `rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5` |
| QR code background | White (`bg-[var(--text-primary)]`), `p-4`, `rounded-lg` |
| Status labels | Active=accent, Refunded=error, Used/CheckedIn=muted |
| Ticket ID | Truncated to 8 chars, `text-caption` |
| Caption | "Show this QR code at the door" |
| Apple Wallet | Official badge image, iOS only |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Container radius** | `8px` | `16px` (`rounded-2xl`) | `10px` | `6px` |
| **Container border** | `1px solid var(--border-default)` | `2px solid var(--border-subtle)` | `1px solid var(--border-default)` | `1px solid var(--border-default)` |
| **Container padding** | `p-4` | `p-5` | `p-5` | `p-6` |
| **Container shadow** | none | `--shadow-md` (accent glow) | `--shadow-sm` (warm) | none |
| **QR code radius** | `8px` | `12px` | `8px` | `2px` |
| **QR code padding** | `p-3` | `p-4` | `p-4` | `p-4` with `3px` border mat |
| **QR code border** | none | none | none | `1px solid var(--border-subtle)` |
| **Status font** | Inter 500, 13px | Manrope 700, 13px | Source Sans 3 500, 14px | Raleway 400, 11px, UPPERCASE, `0.08em` |
| **Status Active text** | "Active" | "Active" | "Active" | "Valid" |
| **Status Refunded text** | "Refunded" | "Refunded" | "Refunded" | "Refunded" |
| **Status Used text** | "Used" | "Checked In" | "Used" | "Redeemed" |
| **Caption font** | Inter 400, 13px | Manrope 400, 13px | Source Sans 3 400, 14px | Raleway 400, 13px, italic |
| **Caption text** | "Show at door" | "Show this QR code at the door" | "Show this QR code at the door" | "Please present this at the entrance" |
| **Ticket ID display** | 8 chars, monospace | 8 chars, monospace | 8 chars | Full ID, `text-caption`, `0.05em` tracking |
| **Apple Wallet button** | Standard badge | Standard badge | Standard badge | Standard badge |
| **Divider above actions** | `1px` hairline | `1px` at 50% opacity | `1px` at 50% opacity | `1px solid var(--border-default)` |

---

## 13. Host Settings Panel

**Source files**: `src/lib/components/dashboard/TextBlastForm.svelte`, `src/lib/components/guests/HostGuestManager.svelte`, `src/lib/components/tickets/CheckinLinkCard.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Container | `rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4` |
| Section heading | `text-label-md font-medium text-[var(--text-primary)]` with duotone icon |
| Tab bar | `border-t border-[var(--border-subtle)]`, active tab: `border-t-2 border-[var(--accent-primary)]` |
| Tab labels | "Text Blast", "Guests", "Check-in" |
| Textarea | `rounded-xl` with focus ring |
| Generate button | `rounded-full bg-[var(--accent-primary)]` |
| Loading spinner | SpinnerGap, 20px, bold, `animate-spin` |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Container radius** | `8px` | `16px` | `10px` | `6px` |
| **Section icon weight** | regular | duotone | regular | regular |
| **Section icon size** | 14px | 16px | 16px | 14px |
| **Tab bar position** | Bottom | Bottom | Bottom | Bottom |
| **Tab bar border** | `1px solid var(--border-subtle)` | `1px solid var(--border-subtle)` | `1px solid var(--border-subtle)` at 50% | `1px solid var(--border-default)` |
| **Active tab indicator** | `2px solid var(--accent-primary)` | `2px solid var(--accent-primary)` | `2px solid var(--accent-primary)` | `1px solid var(--accent-primary)` |
| **Tab label font** | Inter 500, 13px | Manrope 600, 13px | Source Sans 3 500, 14px | Raleway 400, 11px, UPPERCASE, `0.08em` |
| **Blast heading** | "Text Blast" | "Text Blast" | "Send a Message" | "Guest Notification" |
| **Blast helper text** | "3 per event." | "Send an SMS to all RSVP'd guests. 3 per event." | "Send a message to all your guests. 3 per event." | "Send a notification to all confirmed guests. Three per event." |
| **Blast button text** | "Send" | "Send Text Blast" | "Send Message" | "Send Notification" |
| **Check-in heading** | "Check-in Links" | "Check-In Links" | "Check-in" | "Guest Verification" |
| **Generate button** | `rounded-lg`, filled | `rounded-full`, filled + glow | `rounded-lg`, filled | `rounded-sm`, ghost/outline |
| **Loading spinner size** | 16px | 20px | 16px | 14px |
| **Token row radius** | `8px` | `12px` | `8px` | `4px` |

---

## 14. Reminder Sheet

**Source file**: `src/lib/components/rsvp/RsvpReminderSheet.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Icon | BellRinging, 20px, duotone, inside `h-10 w-10` accent/15 circle |
| Day pills | `min-w-[4rem] rounded-xl px-3 py-2.5` |
| Selected day | Accent bg, base text |
| Unselected day | Surface-card bg |
| Cancel button | `rounded-full border` ghost |
| Set button | `rounded-full bg-[var(--accent-primary)]` |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Icon circle** | Hidden (text heading only) | `h-10 w-10`, accent/15 bg, BellRinging duotone | `h-10 w-10`, muted bg, BellRinging regular | Hidden (text heading only) |
| **Heading** | "Set a reminder" | "Remind me later" | "Set a reminder" | "Request a Reminder" |
| **Day pill radius** | `8px` | `12px` (`rounded-xl`) | `8px` | `3px` |
| **Day pill size** | `min-w-[3.5rem] px-2.5 py-2` | `min-w-[4rem] px-3 py-2.5` | `min-w-[4rem] px-3 py-2.5` | `min-w-[4.5rem] px-3 py-2.5` |
| **Selected day style** | Accent bg, base text | Accent bg + glow, base text | Accent bg, base text | `1px solid var(--accent-primary)`, accent text, transparent bg |
| **Unselected day style** | `var(--surface-card)` bg | `var(--surface-card)` bg | `var(--surface-card)` bg | `1px solid var(--border-subtle)`, transparent bg |
| **Cancel button** | Ghost, no border | `rounded-full border` ghost | Ghost, no border | Ghost, `1px solid var(--border-default)` |
| **Set button radius** | `8px` | `9999px` (`rounded-full`) | `8px` | `3px` |
| **Set button text** | "Set" | "Set Reminder" | "Set reminder" | "Confirm Reminder" |
| **Success toast** | "Reminder set" | "Reminder set!" | "Reminder set" | "Your reminder has been confirmed" |

---

## 15. NavBar / Sticky Header

**Source file**: `src/lib/components/ui/nav-bar/NavBar.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Position | Fixed top, `z-40` |
| Glass effect | `backdrop-filter: blur(20px) saturate(180%)` |
| Background | `var(--chrome-bg)` |
| Border | `0.5px solid var(--chrome-border)` |
| Back icon | CaretLeft, 20px, bold, accent color |
| Title | `text-label-lg font-semibold`, centered |
| Safe area | Inset padding for notch |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Glass effect** | No blur, solid `var(--surface-base)` | `blur(20px) saturate(180%)` | `blur(16px) saturate(120%)` | No blur, solid `var(--surface-base)` |
| **Background** | `var(--surface-base)` at 100% | `var(--chrome-bg)` at 80% | `var(--chrome-bg)` at 85% | `var(--surface-base)` at 100% |
| **Border** | `1px solid var(--border-subtle)` (bottom only) | `0.5px solid var(--chrome-border)` | `1px solid var(--border-subtle)` at 50% | `1px solid var(--border-default)` (bottom only) |
| **Back icon** | CaretLeft, 18px, regular, `var(--text-secondary)` | CaretLeft, 20px, bold, `var(--accent-primary)` | ArrowLeft, 20px, regular, `var(--text-secondary)` | ArrowLeft, 18px, regular, `var(--text-secondary)` |
| **Title font** | Inter 600, 16px | Manrope 700, 16px | Source Sans 3 600, 16px | Raleway 500, 14px, UPPERCASE, `0.06em` |
| **Title alignment** | Left (next to back button) | Center | Center | Center |
| **Show/hide behavior** | Always visible | Shows on scroll, hides at top | Always visible | Always visible |
| **Transition** | none | `opacity + translateY(-10px)`, 200ms | none | none |
| **Shadow** | `--shadow-sticky` (1px line) | none (border sufficient) | none | `--shadow-sticky` (1px line) |

### Simple-Specific Notes
- NavBar is always visible (no show/hide on scroll).
- No frosted glass -- solid opaque background.
- Title is left-aligned next to the back button, not centered.

### Elegant-Specific Notes
- No frosted glass -- solid background matching the page.
- Title in uppercase Raleway with tracking.
- Thin bottom border only.

---

## 16. Loading / Error / Empty States

### Loading States

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Spinner component** | None (use native browser loading) | SpinnerGap, 20px, bold, `animate-spin` | SpinnerGap, 18px, regular, slow spin (1.5s) | CircleNotch, 16px, regular, slow spin (2s) |
| **Spinner color** | `var(--text-muted)` | `var(--accent-primary)` | `var(--text-muted)` | `var(--text-muted)` |
| **Loading text** | "Loading..." (13px, muted) | None (spinner only) | "Loading..." (14px, muted) | "One moment..." (13px, muted, italic) |
| **Skeleton screens** | Yes (gray bars matching content shape) | Yes (shimmer animation on skeleton) | Yes (no shimmer, static gray) | No (spinner + text only) |
| **Skeleton radius** | `4px` | `8px` | `6px` | `2px` |
| **Shimmer** | No | Yes (`@keyframes shimmer`, 1.5s, accent-tinted) | No | No |
| **Button loading text** | "Saving..." | "Creating..." | "Saving..." | "Please wait..." |

### Error States

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Error text color** | `var(--feedback-error)` | `var(--feedback-error)` | `var(--feedback-error)` | `var(--feedback-error)` |
| **Error text font** | Inter 400, 14px | Manrope 500, 14px | Source Sans 3 400, 14px | Raleway 400, 13px |
| **Error icon** | None | Warning, 16px, duotone | None | None |
| **Error container** | No container, inline text | `rounded-xl` card with error/10 bg | No container, inline text | No container, inline text, italic |
| **Error message style** | "Error. Try again." | "Oops! Something went wrong." | "Something went wrong. Please try again." | "An error has occurred." |
| **Retry button** | "Retry" (text link) | "Try Again" (pill button) | "Try again" (text link) | "Please Try Again" (text link) |
| **Network error** | "Network error" | "Can't reach the server. Check your connection." | "Network error. Please try again." | "Unable to connect. Please try once more." |

### Empty States

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Philosophy** | Hide empty sections entirely | Show placeholder with CTA | Hide empty sections entirely | Hide empty sections entirely |
| **No guests text** | "Be the first to RSVP" (if section shown) | "No one here yet -- be the first!" | "Be the first to join" | "No guests have replied" |
| **No comments** | Section hidden | "Start the conversation!" | Section hidden | Section hidden |
| **No photos** | Section hidden | "Be the first to share a photo!" | Section hidden | Section hidden |
| **Empty icon** | None | Themed icon (ChatCircle for comments, Image for photos) in `var(--text-muted)` at 40% | None | None |
| **Empty icon size** | N/A | 32px, thin weight | N/A | N/A |

---

## 17. Tombstone Page

**Source file**: `src/lib/components/event/TombstonePage.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Layout | Centered, `max-w-md` |
| Icon | Hourglass, 32px, duotone, `var(--text-muted)` |
| Icon container | 64x64px circle, `var(--surface-overlay)` bg |
| Title | `text-headline-md` |
| Body | "This event has been deleted." in `text-body-md text-[var(--text-secondary)]` |
| Deletion date | `text-body-sm text-[var(--text-muted)]` |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Icon** | None (text only) | Hourglass, 32px, duotone | Hourglass, 28px, regular | Hourglass, 24px, thin |
| **Icon container** | N/A | 64x64px circle, `var(--surface-overlay)` | 56x56px circle, `var(--surface-overlay)` | No container (icon floating) |
| **Title font** | Inter 600, 20px | Manrope 800, 24px | Cormorant Garamond 400, 28px | Cormorant Garamond 300, 32px |
| **Title text** | "Event deleted" | "This event has been deleted." | "This gathering has ended" | "This Event Has Concluded" |
| **Body text** | "It was automatically removed." | "This event has been deleted." | "All event data has been securely removed." | "In accordance with our privacy principles, all event data has been permanently removed." |
| **Body font** | Inter 400, 14px | Manrope 400, 16px | Source Sans 3 400, 16px | Raleway 400, 14px |
| **Deletion date font** | Inter 400, 13px, muted | Manrope 400, 14px, muted | Source Sans 3 400, 14px, muted | Raleway 400, 13px, italic, muted |
| **Alignment** | Left | Center | Center | Center |
| **Max width** | `400px` | `448px` (max-w-md) | `480px` | `560px` |
| **Vertical padding** | `py-10` (40px) | `py-16` (64px) | `py-20` (80px) | `py-24` (96px) |
| **Divider** | None | None | Warm-tinted divider below title | Ornamental rule with dot below title |
| **Home link** | "Back" (text link) | "Explore Ephemeral" (pill button) | "Return home" (text link) | "Return to Ephemeral" (ghost button) |

---

## 18. Action Sheet

**Source file**: `src/lib/components/ui/action-sheet/ActionSheet.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Style | iOS-style grouped actions |
| Actions group | `rounded-2xl`, `var(--surface-overlay)` bg |
| Separator | `var(--border-subtle)` |
| Action text | `text-body-md font-medium` |
| Destructive | `var(--feedback-error)` color |
| Normal | `var(--accent-primary)` color |
| Cancel | Separate `rounded-2xl` card, `var(--surface-raised)` bg |
| Animation | 300ms slide-up |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Actions group radius** | `8px` | `16px` (`rounded-2xl`) | `10px` | `6px` |
| **Cancel card radius** | `8px` | `16px` | `10px` | `6px` |
| **Cancel gap** | `gap-1` (4px) | `gap-2` (8px) | `gap-2` (8px) | `gap-2` (8px) |
| **Action text font** | Inter 500, 16px | Manrope 600, 16px | Source Sans 3 500, 16px | Raleway 400, 15px |
| **Action height** | 44px | 52px | 48px | 44px |
| **Destructive font weight** | 500 | 700 | 600 | 500 |
| **Cancel text** | "Cancel" | "Cancel" | "Cancel" | "Dismiss" |
| **Normal action color** | `var(--accent-primary)` | `var(--accent-primary)` | `var(--foreground)` | `var(--foreground)` |
| **Separator** | `1px solid var(--border-subtle)` | `1px solid var(--border-subtle)` at 50% | `1px solid var(--border-subtle)` at 50% | `1px solid var(--border-default)` at 60% |
| **Animation duration** | `200ms` | `300ms` | `400ms` | `300ms` |
| **Animation easing** | `ease` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | `cubic-bezier(0.22, 0.1, 0.36, 1.0)` | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| **Backdrop** | `oklch(0 0 0 / 30%)` | `var(--backdrop-overlay)` | `oklch(0 0 0 / 25%)` | `oklch(0 0 0 / 35%)` |

---

## 19. Confetti

**Source file**: `src/lib/motion/components/Confetti.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Particle count | 18 |
| Default colors | `['#52b788', '#40916c', '#95d5b2', '#d8f3dc', '#74c69d']` |
| Particle size | 8x8px, `border-radius: 2px` |
| Animation | GSAP, radial burst, 0.8-1.2s, `power2.out` |
| Trigger | On RSVP "Going" button press |
| Motion guard | `motionOk()` check |
| Z-index | 9999 |

### Per-Aesthetic Rules

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Enabled** | **NO** | **YES** | **NO** | **NO** |
| **Particle count** | N/A | 18 | N/A | N/A |
| **Colors** | N/A | Derived from active palette accent hues | N/A | N/A |
| **Particle size** | N/A | 8x8px | N/A | N/A |
| **Particle radius** | N/A | 2px (slightly rounded squares) | N/A | N/A |
| **Burst velocity** | N/A | 80-200px | N/A | N/A |
| **Duration** | N/A | 0.8-1.2s | N/A | N/A |
| **Trigger events** | N/A | RSVP "Going", ticket purchase success | N/A | N/A |

### Fun Palette Color Sets

| Palette | Confetti Colors |
|---------|-----------------|
| Party | `['#e879a8', '#c154c1', '#d68fd6', '#f0b0d0', '#b44db4']` (pink/purple) |
| Neon | `['#6c7bf7', '#9f6cfa', '#818cf8', '#b7a0ff', '#5c5cf7']` (blue/purple) |
| Sunset | `['#f09060', '#e86040', '#f0a880', '#f8c8a8', '#d85030']` (coral/amber) |
| Cosmic | `['#60d0c0', '#40b0a0', '#80e0d0', '#a0f0e0', '#30a090']` (cyan/teal) |

### Simple, Warm, Elegant Replacement
When confetti is disabled, RSVP confirmation feedback is:
- **Simple**: Toast notification only ("RSVP saved"), no visual celebration
- **Warm**: Gentle checkmark icon fade-in (opacity 0->1, 500ms) replacing the CTA button
- **Elegant**: Subtle border pulse on the "Accept" button (box-shadow 0->2px->0 of accent, 800ms)

---

## 20. Ambient Canvas

**Source file**: `src/lib/motion/components/CanvasAmbient.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Element | `<canvas>`, `position: fixed`, `inset: 0`, `pointer-events: none` |
| Default z-index | 0 (layered behind content) |
| Default opacity | 0.4 |
| Renderers | forest (green particles), sakura (pink petals), garden (golden fireflies) |
| Gate | `supportsAmbientEffects()` + `motionOk()` |
| Resize | Responsive to window resize |
| Theme switching | Re-creates renderer on theme prop change |

### Per-Aesthetic Rules

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Enabled** | **NO** | **YES** | **NO** | **NO** |
| **Renderers available** | N/A | forest, sakura, garden (+ palette-mapped) | N/A | N/A |
| **Opacity** | N/A | 0.5 (event page), 0.3 (other pages) | N/A | N/A |
| **Z-index** | N/A | 1 (behind content, above hero) | N/A | N/A |
| **Particle count** | N/A | Theme-dependent (30-60) | N/A | N/A |
| **Frame rate cap** | N/A | 30fps on mobile, 60fps on desktop | N/A | N/A |

### Fun Palette-to-Renderer Mapping

| Palette | Renderer | Visual |
|---------|----------|--------|
| Party | `sakura` | Floating pink petals / confetti shapes |
| Neon | `forest` (recolored) | Slow-drifting blue-purple particles |
| Sunset | `garden` | Warm amber firefly-like dots |
| Cosmic | `forest` (recolored) | Drifting cyan/teal motes |

### Why Disabled for Other Aesthetics

- **Simple**: Zero decorative elements. Canvas particles contradict the utility-first philosophy.
- **Warm**: "No particle effects of any kind" is explicitly stated in the Warm animation spec. Warmth comes from typography and color, not from ambient motion.
- **Elegant**: "No particle effects. No confetti, no sparkles, no parallax." Formal restraint requires stillness.

---

## 21. "Powered by Ephemeral" Footer

**Source file**: `src/lib/components/event/HeroCover.svelte` (lines 268-275)

### Current Implementation

| Property | Value |
|----------|-------|
| Position | Bottom of hero section, inside `hero-delayed-entrance` |
| Layout | `flex items-center justify-center gap-2` |
| Text | "powered by", `text-caption text-[var(--text-muted)]` |
| Logo | `/landing/logo-full-white.png`, `h-4 opacity-50` |
| Light mode | Logo inverted via `filter: invert(1)` |
| Entrance | Delayed 1s, translateY(12px)->0 + opacity, 500ms |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Position** | Bottom of page content (not hero -- no hero) | Bottom of hero section | Bottom of page content | Bottom of page content |
| **Text** | "Ephemeral" (no "powered by") | "powered by" + logo | "powered by" + logo | "An Ephemeral Invitation" |
| **Text font** | Inter 400, 11px | Inherited (Manrope), 11px | Source Sans 3 400, 12px | Raleway 400, 10px, UPPERCASE, `0.15em` |
| **Text color** | `var(--text-muted)` at 40% | `var(--text-muted)` | `var(--text-muted)` | `var(--text-muted)` at 60% |
| **Logo** | Hidden (text only) | Full white logo, `h-4`, 50% opacity | Full white logo, `h-3.5`, 40% opacity | Hidden (text only) |
| **Logo light-mode** | N/A | `filter: invert(1)` | `filter: invert(1)` | N/A |
| **Entrance animation** | None (instant) | Delayed 1s, translateY(12px)->0, 500ms | Delayed 1.2s, opacity only, 600ms | None (instant) |
| **Link** | `href="/"` | `href="/"` | `href="/"` | `href="/"` |
| **Link style** | `text-decoration: none` | `text-decoration: none` | `text-decoration: none` | `text-decoration: none` |
| **Vertical margin** | `mt-8 mb-4` | Inside hero (positioned by flex) | `mt-12 mb-6` | `mt-16 mb-8` |
| **Separator above** | None | None | Ornamental divider | Ornamental rule with dot |

---

## 22. Ticketing Banners

**Source file**: `src/routes/e/[slug]/+page.svelte` (lines 576-662)

### Current Implementation

Three banner types:
1. **Ticketing ready** (after Stripe setup): CheckCircle 24px duotone, accent border/bg
2. **Stripe pending**: CircleNotch 24px bold spinning, neutral card
3. **Setup needed**: CurrencyDollar 24px duotone, accent border/bg, arrow link

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Banner radius** | `8px` | `12px` (`rounded-xl`) | `10px` | `6px` |
| **Banner border** | `1px solid var(--border-default)` | `var(--accent-primary)` at 30% | `1px solid var(--border-default)` | `1px solid var(--border-default)` |
| **Banner bg** | `var(--surface-card)` | `var(--accent-primary)` at 10% | `var(--surface-card)` | `var(--surface-card)` |
| **Banner padding** | `p-3` | `p-4` | `p-4` | `p-5` |
| **Icon size** | 20px | 24px | 20px | 18px |
| **Icon weight** | regular | duotone | regular | regular |
| **Ready text** | "Ticketing ready." | "Ticketing setup complete! Guests can now purchase tickets." | "Ticketing is set up." | "Ticketing has been configured. Guests may now reserve their places." |
| **Pending text** | "Stripe verification in progress." | "Stripe verification in progress. This usually takes a few minutes." | "Payment verification in progress." | "Payment verification is underway." |
| **Setup text** | "Set up payments" | "Complete ticketing setup" | "Complete payment setup" | "Configure Ticketing" |
| **Setup arrow** | ArrowRight, 16px | ArrowRight, 20px | ArrowRight, 16px | ArrowRight, 16px |
| **Spinner** | SpinnerGap, 18px | CircleNotch, 24px, bold | SpinnerGap, 18px | CircleNotch, 16px |
| **Animation** | None | `use:scrollReveal` on below-fold banners | `use:scrollReveal` (y:10, 0.7s) | None |

---

## 23. Calendar & Share Buttons

**Source file**: `src/routes/e/[slug]/+page.svelte` (lines 625-641)

### Current Implementation

| Property | Value |
|----------|-------|
| Layout | `flex gap-3`, two equal-width buttons |
| Calendar button | CalendarPlus 16px regular + "Add to Calendar" |
| Share button | ShareNetwork 16px regular + "Share" |
| Style | `rounded-full border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-2.5 text-label-sm font-medium` |
| Hover | `hover:bg-[var(--border-default)]` |

### Per-Aesthetic Overrides

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Layout** | `flex gap-2`, compact | `flex gap-3`, equal width | `flex gap-3`, equal width | `flex flex-col gap-3`, stacked, centered |
| **Button radius** | `8px` | `9999px` (`rounded-full`) | `8px` | `3px` |
| **Button border** | `1px solid var(--border-default)` | `1px solid var(--border-subtle)` | `1px solid var(--border-default)` | `1px solid var(--border-default)` |
| **Button background** | `var(--surface-card)` | `var(--surface-card)` | `var(--surface-card)` | transparent |
| **Button padding** | `px-3 py-2` | `px-4 py-2.5` | `px-4 py-2.5` | `px-6 py-2.5` |
| **Icon size** | 14px | 16px | 16px | 14px |
| **Icon weight** | regular | regular | regular | thin |
| **Calendar text** | "Calendar" | "Add to Calendar" | "Add to Calendar" | "Save to Calendar" |
| **Share text** | "Share" | "Share" | "Share" | "Share This Invitation" |
| **Font** | Inter 500, 13px | Manrope 600, 13px | Source Sans 3 500, 14px | Raleway 400, 13px, UPPERCASE (if space), `0.04em` |
| **Hover effect** | bg color shift | bg color shift + slight scale(1.02) | bg color shift | border color -> accent |
| **Scroll reveal** | No | `use:scrollReveal={{ y: 15 }}` | `use:scrollReveal={{ y: 10 }}` | No |

### Elegant-Specific Notes
- Buttons stack vertically (not side-by-side) to maintain the centered composition.
- "Share" becomes "Share This Invitation" -- full formal label.
- "Add to Calendar" becomes "Save to Calendar".
- No hover scale -- just border color transition.

---

## 24. Generative Cover Fallback

**Source file**: `src/lib/components/event/GenerativeCover.svelte`

### Current Implementation

| Property | Value |
|----------|-------|
| Algorithm | Seed-based radial gradients from 8 warm color palettes |
| Decorations | Geometric ring elements |
| Animation | Drift: 25s ease-in-out infinite (translate + scale) |
| Base | `var(--surface-base)` |
| Gradient count | 4 per cover |

### Per-Aesthetic Rules

| Property | Simple | Fun | Warm | Elegant |
|----------|--------|-----|------|---------|
| **Enabled** | **NO** (show solid color bg) | **YES** | **YES** (gentler) | **YES** (subtle) |
| **Gradient style** | N/A | Bold radial gradients, high chroma | Soft radial gradients, muted chroma | Single linear gradient, minimal |
| **Color palette source** | N/A | Palette accent colors (saturated) | Palette warm tones (desaturated) | Palette neutral tones (near-achromatic) |
| **Geometric decorations** | N/A | Circles + rings (current) | None (gradients only) | Single thin border frame (8px inset) |
| **Drift animation** | N/A | 25s ease-in-out | 35s ease-in-out (40% slower) | None (static) |
| **Drift amplitude** | N/A | translate(20px, 15px) scale(1.05) | translate(10px, 8px) scale(1.02) | N/A |
| **Gradient chroma** | N/A | 0.12-0.20 (vivid) | 0.04-0.08 (muted) | 0.02-0.04 (near-gray) |
| **Gradient count** | N/A | 4 | 3 | 2 |
| **Opacity** | N/A | 1.0 | 0.8 | 0.6 |

### Simple Fallback
When no cover image is uploaded and the aesthetic is Simple, NO generative cover is shown. The page starts immediately with the event title on the base background color. The absence of a cover is intentional -- Simple events are text-first.

### Elegant Gradient
A single, subtle linear gradient from `var(--surface-base)` to a slightly warm-shifted variant:
```css
/* Example for Ivory palette */
background: linear-gradient(
  180deg,
  oklch(0.975 0.008 85),  /* --color-bg */
  oklch(0.955 0.012 85)   /* slightly deeper */
);
```
Plus an optional thin border frame:
```css
.elegant-cover-frame {
  position: absolute;
  inset: 8%;
  border: 1px solid oklch(from var(--color-divider) l c h / 40%);
  pointer-events: none;
}
```

---

## 25. Phosphor Icon Registry

Complete inventory of every Phosphor icon used across the codebase, with per-aesthetic weight and size specifications.

### Icon Catalog

| Icon Name | Current Usage | Current Weight | Current Size | Source Files |
|-----------|--------------|----------------|-------------|--------------|
| `ArrowClockwise` | Pull-to-refresh | regular | -- | PullToRefresh.svelte |
| `ArrowCounterClockwise` | Debug reset | regular | -- | DebugPanel.svelte |
| `ArrowLeft` | Back navigation | regular | 20 | edit/+page.svelte |
| `ArrowRight` | Ticketing link arrow | regular | 20 | +page.svelte |
| `ArrowSquareOut` | External link | regular | -- | CostSummary.svelte |
| `BellRinging` | RSVP reminder | duotone | 20 | RsvpReminderSheet.svelte |
| `BellSlash` | Notifications off | regular | -- | events/+page.svelte |
| `Bug` | Debug panel | regular | -- | DebugPanel.svelte |
| `CalendarBlank` | Date display | regular | 14-18 | EventForm, HeroCover, EventDetails, EventCard, setup-ticketing |
| `CalendarPlus` | Add to calendar | regular | 16 | +page.svelte |
| `Camera` | Photo counter, QR scanner | regular | 14 | PrivacyDashboard, CheckinScanner |
| `CaretLeft` | NavBar back | bold | 20 | NavBar, CollapsibleHeader |
| `CaretRight` | Photo viewer nav | bold | 32 | PhotoViewer.svelte |
| `ChatCircle` | Comments | regular | -- | CommentList.svelte |
| `Check` | RSVP going, checkmarks | bold / regular | 14-18 | RsvpForm, RsvpStatus, SharePanel, AccentPicker, DebugPanel, PullToRefresh |
| `CheckCircle` | Success states, check-in | duotone / bold / fill | 14-36 | Toast, TicketPurchase, GuestList, HostGuestManager, CheckinLinkCard, +page.svelte, ticket-confirmed, cohost |
| `CircleNotch` | Loading spinner | bold / regular | 16-24 | TicketActions, RsvpReminderSheet, StripeOnboarding, +page.svelte |
| `Clock` | Time display | regular | 12-14 | EventForm, CheckinLinkCard |
| `Copy` | Copy to clipboard | regular | 16 | SharePanel, CheckinLinkCard |
| `Crown` | Host indicator | duotone | 18 | RsvpStatus, cohost |
| `CurrencyDollar` | Ticket price, payment | duotone / regular | 14-24 | EventForm, +page.svelte, setup-ticketing |
| `DownloadSimple` | QR download | regular | -- | QrCodeDisplay.svelte |
| `Export` | iOS share | regular | -- | InstallBanner.svelte |
| `EyeSlash` | Hide tickets | bold | 14 | +page.svelte |
| `GearSix` | Settings | regular | 12 | RsvpStatus.svelte |
| `Hourglass` | Tombstone | duotone | 32 | TombstonePage.svelte |
| `Image` | Photo gallery | regular | -- | PhotoGrid.svelte |
| `Info` | Info toast | duotone | 20 | Toast.svelte |
| `MagnifyingGlass` | Search | regular | -- | CheckinScanner.svelte |
| `MapPin` | Location | regular | 14-18 | EventForm, HeroCover, EventDetails, setup-ticketing |
| `Megaphone` | Host updates, text blast | duotone | 16 | EventFeed, CommentList, TextBlastForm |
| `Minus` | RSVP maybe, quantity | bold | 14-18 | RsvpForm, RsvpStatus, TicketPurchase, DebugPanel |
| `Moon` | Dark mode toggle | regular | -- | ModeToggle.svelte |
| `PaperPlaneTilt` | Send comment | regular | -- | EventFeed, CommentList |
| `Palette` | Theme | regular | -- | events/+page.svelte |
| `PencilSimple` | Edit | regular | 12-14 | RsvpStatus.svelte |
| `Plus` | Add item | bold | 16 | EventFeed, CheckinLinkCard, my-events |
| `PlusSquare` | iOS install | regular | -- | InstallBanner.svelte |
| `QrCode` | QR display, check-in | duotone / regular | 16 | SharePanel, TicketCard, CheckinLinkCard, QrCodeDisplay |
| `ShareNetwork` | Share | regular | 16 | SharePanel, +page.svelte |
| `ShieldCheck` | Privacy, security | duotone | 13-18 | +page.svelte, TicketPurchase, PhotoGrid, PrivacyDashboard, StripeExplainer |
| `SignIn` | Auth | regular | -- | events/+page.svelte |
| `SignOut` | Logout | regular | -- | DebugPanel.svelte |
| `SpinnerGap` | Loading | bold | 16-20 | CheckinLinkCard, QrCodeDisplay, CheckinGuestRow |
| `Sun` | Light mode toggle | regular | -- | ModeToggle.svelte |
| `Tag` | Event type | regular | 16 | EventForm, StripeExplainer |
| `TextT` | Title | regular | 14 | EventForm.svelte |
| `Ticket` | Ticketing | regular | 14-18 | HeroCover, TicketCard, +page.svelte, TicketPurchase, events, my-events, setup-ticketing |
| `Timer` | Countdown | regular | -- | StripeExplainer.svelte |
| `Trash` | Delete/remove | regular | 16 | HostGuestManager, CheckinLinkCard |
| `TrashSimple` | Auto-delete | regular | 14 | PrivacyDashboard.svelte |
| `Upload` | Photo upload | regular | -- | PhotoGrid.svelte |
| `UserCircle` | Profile | regular | -- | DebugPanel.svelte |
| `UserPlus` | Add plus-one | regular | -- | RsvpForm.svelte |
| `Users` | Guest count | regular | 14-18 | EventForm, HeroCover, RsvpCounts, EventCard |
| `VideoCameraSlash` | No camera | regular | -- | CheckinScanner.svelte |
| `Warning` | Error, capacity | duotone / bold | 16-20 | Toast, CapacityWarning, StripeOnboarding |
| `X` | Close, dismiss, decline | bold / regular | 14-24 | Toast, PhotoViewer, RsvpForm, RsvpStatus, InstallBanner, StripeExplainer, DebugPanel |
| `XCircle` | Error state | regular | -- | cohost/+page.svelte |

### Per-Aesthetic Icon Weight Rules

| Context | Simple | Fun | Warm | Elegant |
|---------|--------|-----|------|---------|
| **Metadata icons** (date, location, guests) | `regular`, 16px | `regular`, 18px | `regular`, 20px | `thin`, 16px |
| **Action icons** (share, calendar, edit) | `regular`, 16px | `regular`, 16px | `regular`, 16px | `thin`, 14px |
| **Status icons** (check, warning, error) | `regular`, 16px | `duotone`, 18px | `regular`, 16px | `regular`, 14px |
| **CTA icons** (RSVP check, ticket) | `bold`, 16px | `bold`, 18px | `regular`, 16px | None (no icons in CTAs) |
| **Close/dismiss** | `regular`, 18px | `bold`, 20px | `regular`, 18px | `regular`, 16px |
| **Decorative** (tombstone, reminder) | None | `duotone`, 28-32px | `regular`, 24-28px | `thin`, 20-24px |
| **Section heading icons** | Hidden | `duotone`, 16px | `regular`, 16px | Hidden |

### Icon Color Rules

| Context | Simple | Fun | Warm | Elegant |
|---------|--------|-----|------|---------|
| **Metadata** | `var(--text-muted)` | `var(--accent-primary)` | `var(--text-muted)` | `var(--text-muted)` |
| **Active/interactive** | `var(--accent-primary)` | `var(--accent-primary)` | `var(--accent-primary)` | `var(--accent-primary)` |
| **Passive** | `var(--text-muted)` | `var(--text-muted)` | `var(--text-muted)` | `var(--text-muted)` |
| **Error** | `var(--feedback-error)` | `var(--feedback-error)` | `var(--feedback-error)` | `var(--feedback-error)` |
| **Success** | `var(--accent-primary)` | `var(--accent-primary)` | `var(--accent-primary)` | `var(--accent-primary)` |

### Elegant Icon Philosophy
Elegant uses icons minimally. Where other aesthetics use icons for visual interest, Elegant relies on typography. Specific omissions:
- No icons in RSVP buttons (text carries the design)
- No icons in section headings
- No decorative icons (hourglass, bell) in containers -- they float standalone if used at all
- Form label icons are hidden -- labels use uppercase tracking instead
- The `thin` weight is the default for any icon that does appear, reinforcing the delicate, restrained character

### Simple Icon Philosophy
Simple uses icons functionally -- never decoratively. Every icon conveys information that cannot be conveyed by layout alone (e.g., CalendarBlank next to a date disambiguates it from other text). The `regular` weight at 16px is the universal default. No duotone, no bold (except the RSVP confirmation checkmark).

---

## Appendix A: Motion Summary Table

A cross-reference of all animation behaviors by aesthetic.

| Element | Simple | Fun | Warm | Elegant |
|---------|--------|-----|------|---------|
| Page load timeline | None | GSAP 5-step sequence, ~1.0s | GSAP 6-step sequence, ~1.6s | None (instant render) |
| Hero parallax | N/A (no hero) | `yPercent: -20`, GSAP ScrollTrigger | `yPercent: -20`, 80% rate | N/A (no parallax) |
| Hero progressive blur | N/A | 0->8px on scroll | 0->6px on scroll | N/A |
| Scroll reveal | **Disabled** | `y: 15px`, 500ms | `y: 10px`, 700ms | **Disabled** |
| Stagger children | **Disabled** | 50ms per item | 100ms per item | **Disabled** |
| Confetti | **Disabled** | 18 particles, radial burst | **Disabled** | **Disabled** |
| Ambient canvas | **Disabled** | Active (theme-mapped) | **Disabled** | **Disabled** |
| Number ticker | **Disabled** (plain number) | Active (odometer roll) | Active (gentle, slower) | **Disabled** (plain number, written out) |
| Button hover | `bg-color`, 150ms | `bg-color + scale(1.02)`, 150ms | `bg-color`, 280ms | `border-color`, 200ms |
| Button press | `scale(0.97)`, 100ms | `scale(0.97)`, 150ms | `scale(0.98)`, 120ms | `opacity: 0.8`, 200ms |
| Sheet enter | Slide up, 200ms | Slide up, 300ms | Slide up, 400ms | Slide up, 350ms |
| Sheet exit | Slide down, 150ms | Slide down, 250ms | Slide down, 350ms | Slide down, 300ms |
| Toast enter | Opacity, 150ms | TranslateY + opacity, 250ms | TranslateY + opacity, 350ms | Opacity, 300ms |
| Toast exit | Opacity, 100ms | TranslateY + opacity, 200ms | Opacity, 250ms | Opacity, 200ms |
| Modal enter | Opacity, 150ms | Scale + opacity, 250ms | TranslateY + opacity, 400ms | Opacity, 350ms |
| View transitions | None | Shared element morph | Crossfade | None |
| `prefers-reduced-motion` | Already minimal | Disable all scroll reveals, confetti, ambient, parallax; keep opacity transitions | Disable scroll reveals; keep opacity transitions | Already minimal |

---

## Appendix B: Typography Class Mapping

How the existing Tailwind typography classes map to each aesthetic's font.

| Tailwind Class | Simple | Fun | Warm | Elegant |
|---------------|--------|-----|------|---------|
| `text-display-md` | Inter 600, 28px, -0.02em | Manrope 800, 32px, -0.02em | Cormorant Garamond 300, 36px, 0.01em | Cormorant Garamond 300, 40px, 0.08em |
| `text-headline-md` | Inter 600, 22px, -0.015em | Manrope 800, 24px, -0.02em | Cormorant Garamond 400, 28px, 0.01em | Cormorant Garamond 300, 28px, 0.08em, UPPERCASE |
| `text-headline-sm` | Inter 600, 18px, -0.01em | Manrope 700, 20px, -0.01em | Cormorant Garamond 400, 24px, 0em | Cormorant Garamond 300, 24px, 0.06em |
| `text-body-md` | Inter 400, 16px, 0em, lh 1.50 | Manrope 400, 16px, 0em, lh 1.55 | Source Sans 3 400, 16px, 0em, lh 1.75 | Raleway 400, 15px, 0.01em, lh 1.65 |
| `text-body-sm` | Inter 400, 14px, 0em | Manrope 400, 14px, 0em | Source Sans 3 400, 14px, 0em | Raleway 400, 13px, 0.01em |
| `text-label-lg` | Inter 500, 16px, 0.01em | Manrope 600, 16px, 0em | Source Sans 3 600, 16px, 0em | Raleway 500, 14px, 0.06em |
| `text-label-md` | Inter 500, 14px, 0.01em | Manrope 600, 14px, 0em | Source Sans 3 500, 14px, 0em | Raleway 500, 13px, 0.04em |
| `text-label-sm` | Inter 500, 13px, 0.01em | Manrope 500, 13px, 0em | Source Sans 3 500, 13px, 0em | Raleway 400, 11px, 0.12em, UPPERCASE |
| `text-caption` | Inter 400, 12px, 0.005em | Manrope 400, 12px, 0em | Source Sans 3 400, 13px, 0em | Raleway 400, 11px, 0.02em |

---

## Appendix C: Structural Differences Summary

| Axis | Simple | Fun | Warm | Elegant |
|------|--------|-----|------|---------|
| Cover image | Hidden/optional (200px max if present) | Full-bleed hero, 100dvh, parallax | Optional, 16:9, 240px max, no overlay | Optional, contained, framed with border + padding |
| Text alignment | Left always | Left | Left | Center always |
| Content max-width | 520px | 512px (max-w-lg) | 560px | 560px |
| Section separation | Hairline dividers | Cards + spacing | Warm-tinted dividers | Ornamental centered rules |
| Card containers | None (divider-only layout) | Yes (all sections in cards) | Selective (settings cards, not posts) | Selective (minimal use) |
| Overall density | HIGH (compact) | MEDIUM | LOW (spacious) | MEDIUM-LOW |
| Host attribution | Bottom, muted, caption | Hero area, visible | Top, above title ("Sarah invites you to") | Top, formal ("The pleasure of your company...") |
| Maybe RSVP | Yes (equal weight) | Yes (equal weight) | Yes (text link, subordinate) | **No** (hidden) |
| Guest avatars | No | Yes (avatar stack, up to 5) | No | No |
| RSVP bar | Sticky bottom, 3 buttons | Sticky bottom, animated entrance | Sticky bottom, 1 primary + text links | Inline (not sticky), stacked, centered |
| Privacy dashboard | Hidden (link only) | Inline badge + full panel | Inline badge + full panel | Inline badge only |
| Comments default | Hidden if empty | Visible, encourages posting | Hidden if empty | Hidden by default (host toggle) |
| Photos default | Hidden if empty | Visible, encourages uploads | Hidden if empty | Hidden by default (host toggle) |

---

## Appendix D: Copy & Language Quick Reference

| UI String | Simple | Fun | Warm | Elegant |
|-----------|--------|-----|------|---------|
| RSVP accept | "Going" | "Going" | "I'll be there" | "Accept with Pleasure" |
| RSVP maybe | "Maybe" | "Maybe" | "Let me check" | N/A |
| RSVP decline | "Can't go" | "Can't Make It" | "I can't make it" | "Regretfully Decline" |
| Post-accept toast | "RSVP saved" | "You're going!" | "You're going" | "Your attendance is confirmed" |
| Guest count | "{n} going" | "{n} going" | "{n} friends are joining" / "{n} people are joining" | "Twelve guests attending" |
| Date format | "Sat, Mar 7" | "Saturday, March 15" | "Saturday, March 7th" | "Saturday, the seventh of March" |
| Time format | "7:00 PM" | "7:00 PM -- 11:00 PM" | "7:00 in the evening" | "Seven o'clock in the evening" |
| Host line | "Hosted by Alex" (bottom) | "Hosted by Alex" (hero) | "Sarah invites you to" (above title) | "The pleasure of your company is requested by Sarah Chen" |
| Sections: location | "Where" | (no header, icon row) | (no header, icon row) | "Venue" |
| Sections: comments | "Comments" | "The Wall" | "Conversation" | "Messages" |
| Sections: photos | "Photos" | "Photos" | "Photos" | "Gallery" |
| Sections: guests | "Guests" | (no header, inline) | (no header, inline) | "Attendees" |
| Share button | "Share" | "Share" | "Share" | "Share This Invitation" |
| Calendar button | "Calendar" | "Add to Calendar" | "Add to Calendar" | "Save to Calendar" |
| Tickets CTA | "Buy Tickets" | "Buy Tickets" | "Get Tickets" | "Reserve Your Place" |
| Empty guests | "Be the first to RSVP" | "No one here yet -- be the first!" | "Be the first to join" | "No guests have replied" |
| Event deleted | "Event deleted" | "This event has been deleted." | "This gathering has ended" | "This Event Has Concluded" |
| Footer | "Ephemeral" | "powered by [logo]" | "powered by [logo]" | "An Ephemeral Invitation" |
