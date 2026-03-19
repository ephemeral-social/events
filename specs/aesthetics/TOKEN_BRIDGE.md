# Aesthetic System Token Bridge

**Version**: 1.0
**Date**: February 2026
**Status**: Implementation contract -- SINGLE SOURCE OF TRUTH
**Purpose**: Definitive mapping between aesthetic spec token names and codebase CSS variable names

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Codebase Token Inventory](#2-codebase-token-inventory)
3. [Spec Token Inventory](#3-spec-token-inventory)
4. [Canonical Token System](#4-canonical-token-system)
5. [Master Bridge Table](#5-master-bridge-table)
6. [Missing Token Analysis](#6-missing-token-analysis)
7. [CSS Architecture](#7-css-architecture)
8. [shadcn-svelte Variable Mapping](#8-shadcn-svelte-variable-mapping)
9. [Migration Path](#9-migration-path)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Architecture Overview

### The Three-Layer Problem

The codebase currently has THREE overlapping naming systems for CSS custom properties:

| Layer | Example | Where Defined | Who Consumes |
|-------|---------|---------------|-------------|
| **shadcn-svelte primitives** | `--background`, `--primary`, `--border` | Theme CSS files (`forest.css`, etc.) | shadcn-svelte components (`Button`, `Card`, etc.) |
| **Ephemeral semantic tokens** | `--surface-base`, `--text-primary`, `--accent-primary` | `app.css` `:root` and `[data-theme]` block | All application components (Svelte files) |
| **Spec tokens** (4 conflicting conventions) | `--color-bg` / `--background` / `--color-fg` | Spec documents only (not in code) | Nothing yet -- these are proposed |

### Current Flow

```
Theme CSS file (e.g., forest.css)
  sets: --background, --primary, --card, --foreground, etc.
       --font-heading, --heading-weight, --shadow-sm, etc.
          |
          v
app.css [data-theme] block
  derives: --surface-base = var(--background)
           --text-primary = var(--foreground)
           --accent-primary = var(--primary)
           --border-default = var(--border)
           etc.
          |
          v
Application components
  consume: var(--surface-base), var(--text-primary), etc.
  via: Tailwind arbitrary values like text-[var(--text-primary)]
```

### The Solution

The canonical token system defined in this document serves as the APPLICATION-LEVEL API. Components consume these tokens. Each aesthetic's CSS defines the shadcn primitives AND these semantic tokens. The `[data-theme]` bridge in `app.css` becomes the `[data-aesthetic]` bridge.

---

## 2. Codebase Token Inventory

Every CSS custom property referenced via `var()` across all `.svelte`, `.css`, and `.ts` files in `src/`.

### 2.1 Surface/Background Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--surface-base` | `app.css` `:root` and `[data-theme]` | `html`, scrollbar track, shimmer animation | Page/body background |
| `--surface-raised` | `app.css` `:root` and `[data-theme]` | Shimmer animation gradient | Elevated surface (above base) |
| `--surface-overlay` | `app.css` `:root` and `[data-theme]` | Shimmer animation, reduced-motion fallback | Sheet/popover background |
| `--surface-input` | `app.css` `:root` | (available but lightly used) | Form input background |
| `--surface-subtle` | `app.css` `:root` | (available for muted backgrounds) | Subtle/muted surface |
| `--surface-card` | `app.css` `:root` and `[data-theme]` | Card containers throughout | Card background |

### 2.2 Text/Foreground Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--text-primary` | `app.css` `:root` and `[data-theme]` | Body text, headings, selection highlight, scrollbar hover | Primary text color |
| `--text-secondary` | `app.css` `:root` and `[data-theme]` | Metadata, timestamps, secondary labels | Secondary text color |
| `--text-muted` | `app.css` `:root` and `[data-theme]` | Disabled text, tertiary info, drag handles, scrollbar thumb | Muted/disabled text |
| `--text-inverse` | `app.css` `:root` | Inverse text (on accent backgrounds) | Light-on-dark or dark-on-light |

### 2.3 Accent/Brand Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--accent-primary` | `app.css` `:root` and `[data-theme]` | CTA buttons, focus rings, active indicators, icons | Primary accent color |
| `--accent-hover` | `app.css` `:root` and `[data-theme]` | Button hover states | Accent hover variant |
| `--accent-muted` | `app.css` `:root` and `[data-theme]` | Accent at low opacity (badges, tinted backgrounds) | Muted accent tint |
| `--accent-glow` | `app.css` `:root` and `[data-theme]` | Selection highlight bg, focus glow | Accent glow/ring |

### 2.4 Border Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--border-default` | `app.css` `:root` and `[data-theme]` | Card borders, dividers, scrollbar thumb | Default border color |
| `--border-subtle` | `app.css` `:root` and `[data-theme]` | Subtle/secondary borders | Lighter border variant |
| `--border-focus` | `app.css` `:root` | Focus state borders on inputs | Focus border color |

### 2.5 Feedback/Status Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--feedback-success` | `app.css` `:root` and `[data-theme]` | Success states, confirmation | Success color |
| `--feedback-error` | `app.css` `:root` | Error messages, destructive states | Error color |
| `--feedback-warning` | `app.css` `:root` | Warning banners (capacity, etc.) | Warning color |
| `--feedback-info` | `app.css` `:root` | Informational toasts | Info color |

### 2.6 Overlay/Chrome Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--backdrop-overlay` | `app.css` `:root` and `[data-theme]` | Modal/sheet backdrop | Semi-transparent backdrop |
| `--chrome-bg` | `app.css` `:root` and `[data-theme]` | NavBar frosted background | Navigation chrome background |
| `--chrome-border` | `app.css` `:root` and `[data-theme]` | NavBar border | Navigation chrome border |

### 2.7 Shadow Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--shadow-sm` | `:root` and theme CSS files | Cards, small elevations | Small shadow |
| `--shadow-md` | `:root` and theme CSS files | Popovers, dropdowns | Medium shadow |
| `--shadow-lg` | `:root` and theme CSS files | Modals, sheets | Large shadow |
| `--shadow-color` | `:root` and theme CSS files | Shadow computation base | Shadow base color |
| `--shadow-strength` | `:root` and theme CSS files | Shadow opacity multiplier | Shadow intensity |

### 2.8 Typography Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--font-heading` | `:root` and theme CSS files | All heading utility classes, `.font-display` | Heading font family |
| `--font-body` | `:root` and theme CSS files | All body utility classes, `.font-body` | Body font family |
| `--heading-weight` | `:root` and theme CSS files | All heading utility classes | Heading font weight |
| `--heading-tracking` | `:root` and theme CSS files | All heading utility classes | Heading letter-spacing |
| `--heading-transform` | `:root` and theme CSS files | All heading utility classes | Heading text-transform |
| `--body-line-height` | `:root` and theme CSS files | All body utility classes | Body line-height |
| `--font-serif` | `typography.css` `:root` | Reference only | Serif font stack |
| `--font-sans` | `typography.css` `:root` | Reference only | Sans font stack |

### 2.9 Typography Scale Tokens (Shared, Read-Only)

Defined in `typography.css`, consumed by type utility classes. These are FIXED and do NOT change per aesthetic (the aesthetic controls font-family/weight/tracking, not the size scale):

| Variable | Value | CSS Class |
|----------|-------|-----------|
| `--text-xs` | 0.75rem (12px) | `.text-caption`, `.text-label-sm` |
| `--text-sm` | 0.875rem (14px) | `.text-body-sm`, `.text-label-md` |
| `--text-base` | 1rem (16px) | `.text-body-md`, `.text-button`, `.text-label-lg` |
| `--text-lg` | 1.125rem (18px) | `.text-body-lg`, `.text-headline-sm` |
| `--text-xl` | 1.25rem (20px) | `.text-headline-md` |
| `--text-2xl` | 1.5rem (24px) | `.text-display-sm` |
| `--text-3xl` | 1.875rem (30px) | (approximately `.text-display-md`) |
| `--text-4xl` | 2.25rem (36px) | (approximately `.text-display-lg`) |

### 2.10 Structural/Decorative Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--radius` | `:root` and theme CSS files | shadcn components | Base border-radius |
| `--border-weight` | `:root` and theme CSS files | Card/container borders | Border thickness |
| `--surface-grain` | `:root` and theme CSS files | Background texture overlay | SVG texture URL or `none` |

### 2.11 Motion Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--motion-duration-instant` | `app.css` `:root` | (available) | 100ms (micro feedback) |
| `--motion-duration-fast` | `app.css` `:root` | (available) | 200ms (button transitions) |
| `--motion-duration-standard` | `app.css` `:root` | Shimmer keyframes | 300ms (standard transitions) |
| `--motion-duration-emphasis` | `app.css` `:root` | (available) | 500ms (emphasis animations) |
| `--motion-duration-lifecycle` | `app.css` `:root` | (available) | 800ms (birth/death of elements) |
| `--motion-duration-ambient` | `app.css` `:root` | Breathing animation | 3000ms (ambient loops) |
| `--motion-ease-enter` | `app.css` `:root` | (available) | Enter easing curve |
| `--motion-ease-exit` | `app.css` `:root` | (available) | Exit easing curve |
| `--motion-ease-standard` | `app.css` `:root` | View transitions CSS | Standard easing curve |
| `--motion-ease-spring` | `app.css` `:root` | (available) | Spring/bounce easing |

### 2.12 Layout/Chrome Tokens

| Variable | Where Defined | Where Consumed | Purpose |
|----------|---------------|----------------|---------|
| `--safe-top` | `app.css` `:root` | NavBar height calculation | Safe area inset top |
| `--safe-bottom` | `app.css` `:root` | RSVP bar positioning | Safe area inset bottom |
| `--safe-left` | `app.css` `:root` | (available) | Safe area inset left |
| `--safe-right` | `app.css` `:root` | (available) | Safe area inset right |
| `--nav-height` | `app.css` `:root` | Content offset below NavBar | NavBar height (44px + safe-top) |

### 2.13 shadcn-svelte Primitive Tokens

These are set by theme CSS files and consumed by shadcn-svelte components. They also feed the Ephemeral semantic tokens via the `[data-theme]` bridge:

| Variable | Purpose | Feeds Semantic Token |
|----------|---------|---------------------|
| `--background` | Page background | `--surface-base` |
| `--foreground` | Primary text | `--text-primary` |
| `--card` | Card background | `--surface-card`, `--surface-raised` |
| `--card-foreground` | Card text | (same as foreground) |
| `--popover` | Popover background | `--surface-overlay` |
| `--popover-foreground` | Popover text | (same as foreground) |
| `--primary` | Accent/action color | `--accent-primary` |
| `--primary-foreground` | Text on accent | `--text-inverse` |
| `--secondary` | Secondary surface | (used by shadcn only) |
| `--secondary-foreground` | Secondary surface text | (used by shadcn only) |
| `--muted` | Muted surface | `--surface-subtle` |
| `--muted-foreground` | Muted/secondary text | `--text-secondary`, `--text-muted` |
| `--accent` | Hover surface | (used by shadcn only) |
| `--accent-foreground` | Hover surface text | (used by shadcn only) |
| `--destructive` | Error/danger | `--feedback-error` |
| `--destructive-foreground` | Text on error | (used by shadcn only) |
| `--border` | Default border | `--border-default`, `--border-subtle` |
| `--input` | Input border | (used by shadcn only) |
| `--ring` | Focus ring | `--accent-hover`, `--accent-glow` |
| `--radius` | Base border-radius | (passthrough) |
| `--chart-1` through `--chart-5` | Chart colors | (chart components only) |

### 2.14 Component-Specific Tokens

| Variable | Where Used | Purpose |
|----------|-----------|---------|
| `--blur-amount` | `HeroCover.svelte` | Progressive blur on scroll (0-8px) |
| `--cooldown` | `CheckinScanner.svelte` | Scan cooldown ring animation |
| `--error` | (legacy reference) | Error color (replaced by `--feedback-error`) |

---

## 3. Spec Token Inventory

### 3.1 Simple Spec Token Names

The Simple spec uses a `--color-*` prefix convention with 4 palettes (default, blue, sage, violet):

**Color tokens** (set per palette per mode):
`--color-bg`, `--color-surface`, `--color-surface-hover`, `--color-fg`, `--color-fg-secondary`, `--color-fg-tertiary`, `--color-accent`, `--color-accent-hover`, `--color-accent-fg`, `--color-divider`, `--color-border`, `--color-error`, `--color-success`

**Typography tokens** (set per aesthetic):
`--font-heading`, `--font-body`, `--heading-weight`, `--heading-tracking`, `--heading-transform`, `--body-line-height`

**Type scale tokens** (Simple-specific):
`--text-title-size`, `--text-title-weight`, `--text-title-leading`, `--text-title-tracking`,
`--text-section-size`, `--text-section-weight`, `--text-section-leading`, `--text-section-tracking`,
`--text-body-size`, `--text-body-weight`, `--text-body-leading`, `--text-body-tracking`,
`--text-caption-size`, `--text-caption-weight`, `--text-caption-leading`, `--text-caption-tracking`,
`--text-label-size`, `--text-label-weight`, `--text-label-leading`, `--text-label-tracking`

**Spacing tokens**:
`--space-1` through `--space-12`, `--page-px`, `--page-max-w`, `--section-gap`, `--row-gap`, `--inner-padding`

**Radius tokens**:
`--radius-card`, `--radius-button`, `--radius-input`, `--radius-badge`, `--radius-avatar`, `--radius`

**Shadow tokens**:
`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`, `--shadow-sticky`, `--shadow-color`, `--shadow-strength`

**Motion tokens**:
`--duration-instant`, `--duration-fast`, `--duration-standard`, `--duration-emphasis`, `--duration-lifecycle`, `--duration-ambient`

**Structural tokens**:
`--border-weight`, `--surface-grain`

### 3.2 Fun Spec Token Names

The Fun spec uses the **shadcn-svelte primitive names directly** plus Ephemeral-custom structural tokens:

**Color tokens** (set per palette per mode):
`--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`

**Chart tokens**: `--chart-1` through `--chart-5`

**Structural tokens**:
`--shadow-color`, `--shadow-strength`, `--surface-grain`, `--border-weight`, `--font-heading`, `--font-body`, `--heading-weight`, `--heading-tracking`, `--heading-transform`, `--body-line-height`

**Shadow tokens**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`

### 3.3 Warm Spec Token Names

Same convention as Simple (`--color-*` prefix NOT used -- Warm actually uses shadcn primitives like Fun):

**Color tokens**: Same as Fun (shadcn primitives: `--background`, `--foreground`, `--primary`, etc.)

**Structural tokens**: Same set as Fun plus Warm-specific spacing tokens:
`--warm-page-px`, `--warm-section-gap`, `--warm-row-gap`, `--warm-inner-padding`, etc. (prefixed `--warm-*`)

**Typography tokens**: `--font-heading`, `--font-body`, `--heading-weight`, `--heading-tracking`, `--heading-transform`, `--body-line-height`

### 3.4 Elegant Spec Token Names

The Elegant spec uses a `--color-*` prefix:

**Color tokens** (set per palette per mode):
`--color-bg`, `--color-surface`, `--color-surface-hover`, `--color-fg`, `--color-fg-secondary`, `--color-fg-tertiary`, `--color-accent`, `--color-accent-hover`, `--color-accent-fg`, `--color-divider`, `--color-border`, `--color-error`, `--color-success`

**Structural tokens**:
`--radius`, `--radius-card`, `--radius-image`, `--font-heading`, `--font-body`, `--heading-weight`, `--heading-tracking`, `--heading-transform`, `--body-line-height`, `--border-weight`, `--surface-grain`, `--shadow-color`, `--shadow-strength`

**Shadow tokens**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`

**Motion tokens**:
`--duration-instant`, `--duration-fast`, `--duration-standard`, `--duration-emphasis`, `--duration-lifecycle`, `--duration-ambient`, `--ease-elegant`

### 3.5 Naming Convention Summary

| Token Category | Simple | Fun | Warm | Elegant | Codebase |
|---------------|--------|-----|------|---------|----------|
| Page background | `--color-bg` | `--background` | `--background` | `--color-bg` | `--surface-base` (via `--background`) |
| Card background | `--color-surface` | `--card` | `--card` | `--color-surface` | `--surface-card` (via `--card`) |
| Primary text | `--color-fg` | `--foreground` | `--foreground` | `--color-fg` | `--text-primary` (via `--foreground`) |
| Secondary text | `--color-fg-secondary` | `--muted-foreground` | `--muted-foreground` | `--color-fg-secondary` | `--text-secondary` (via `--muted-foreground`) |
| Muted text | `--color-fg-tertiary` | (not distinct) | (not distinct) | `--color-fg-tertiary` | `--text-muted` (via `--muted-foreground`) |
| Accent | `--color-accent` | `--primary` | `--primary` | `--color-accent` | `--accent-primary` (via `--primary`) |
| Accent foreground | `--color-accent-fg` | `--primary-foreground` | `--primary-foreground` | `--color-accent-fg` | `--text-inverse` (via `--primary-foreground`) |
| Border | `--color-border` | `--border` | `--border` | `--color-border` | `--border-default` (via `--border`) |
| Divider | `--color-divider` | (uses `--border`) | (uses `--border` at 50%) | `--color-divider` | `--border-default` |
| Error | `--color-error` | `--destructive` | `--destructive` | `--color-error` | `--feedback-error` (via `--destructive`) |
| Success | `--color-success` | (uses `--primary`) | (uses `--primary`) | `--color-success` | `--feedback-success` (via `--primary`) |

---

## 4. Canonical Token System

This is the unified, authoritative set of CSS custom property names. Every aesthetic MUST define values for all tokens in this system. Components consume ONLY these names.

### 4.1 Naming Convention

```
--{category}-{property}[-{variant}]
```

### 4.2 Surface Tokens

| Canonical Token | Type | Purpose | Default Derivation |
|----------------|------|---------|-------------------|
| `--surface-base` | color | Page/body background | From `--background` |
| `--surface-card` | color | Card/container background | From `--card` |
| `--surface-raised` | color | Elevated surface (toast, install banner) | From `--card` |
| `--surface-overlay` | color | Sheet/popover/dropdown background | From `--popover` |
| `--surface-input` | color | Form input background | From `--card` (slightly different) |
| `--surface-subtle` | color | Muted background (tags, badges) | From `--muted` |
| `--surface-hover` | color | Interactive surface on hover | Derived: +0.04L from `--surface-card` |
| `--surface-grain` | url/none | Background texture SVG | Per-aesthetic choice |

### 4.3 Text Tokens

| Canonical Token | Type | Purpose | Default Derivation |
|----------------|------|---------|-------------------|
| `--text-primary` | color | Primary text, headings | From `--foreground` |
| `--text-secondary` | color | Secondary text, metadata, timestamps | From `--muted-foreground` |
| `--text-muted` | color | Disabled text, placeholder, tertiary | Derived from `--muted-foreground` or darker |
| `--text-inverse` | color | Text on accent-colored backgrounds | From `--primary-foreground` |

### 4.4 Accent Tokens

| Canonical Token | Type | Purpose | Default Derivation |
|----------------|------|---------|-------------------|
| `--accent-primary` | color | Primary accent (buttons, links, active) | From `--primary` |
| `--accent-hover` | color | Accent hover state | From `--ring` |
| `--accent-muted` | color | Accent at ~10% opacity (tinted bg, badges) | `color-mix(--primary, 10%, transparent)` |
| `--accent-glow` | color | Focus glow, selection bg (~20% opacity) | `color-mix(--primary, 20%, transparent)` |

### 4.5 Border Tokens

| Canonical Token | Type | Purpose | Default Derivation |
|----------------|------|---------|-------------------|
| `--border-default` | color | Standard border color | From `--border` |
| `--border-subtle` | color | Lighter border | From `--border` |
| `--border-focus` | color | Input focus border | From `--primary` |
| `--border-weight` | length | Border thickness | `1px` (Simple/Warm/Elegant), `2px` (Fun) |

### 4.6 Feedback Tokens

| Canonical Token | Type | Purpose | Default Derivation |
|----------------|------|---------|-------------------|
| `--feedback-success` | color | Success states | From `--primary` or explicit green |
| `--feedback-error` | color | Error states, destructive | From `--destructive` |
| `--feedback-warning` | color | Warning states | Explicit warm orange |
| `--feedback-info` | color | Informational states | Explicit blue |

### 4.7 Overlay/Chrome Tokens

| Canonical Token | Type | Purpose | Default Derivation |
|----------------|------|---------|-------------------|
| `--backdrop-overlay` | color | Modal/sheet semi-transparent backdrop | `color-mix(--background, 50%, transparent)` |
| `--chrome-bg` | color | NavBar frosted glass background | `color-mix(--background, 72%, transparent)` |
| `--chrome-border` | color | NavBar border | `color-mix(--foreground, 8%, transparent)` |

### 4.8 Shadow Tokens

| Canonical Token | Type | Purpose |
|----------------|------|---------|
| `--shadow-sm` | shadow | Cards, small elevations |
| `--shadow-md` | shadow | Popovers, dropdowns |
| `--shadow-lg` | shadow | Modals, sheets |
| `--shadow-color` | color | Shadow base color for computation |
| `--shadow-strength` | number | Shadow opacity multiplier |

### 4.9 Typography Tokens

| Canonical Token | Type | Purpose |
|----------------|------|---------|
| `--font-heading` | font-family | Heading/display font stack |
| `--font-body` | font-family | Body/UI font stack |
| `--heading-weight` | number | Heading font weight |
| `--heading-tracking` | length | Heading letter-spacing |
| `--heading-transform` | keyword | Heading text-transform (`none` or `uppercase`) |
| `--body-line-height` | number | Body text line-height |

### 4.10 Radius Tokens

| Canonical Token | Type | Purpose | Notes |
|----------------|------|---------|-------|
| `--radius` | length | Base radius (shadcn) | Per-aesthetic |
| `--radius-card` | length | Card/container radius | Defaults to `--radius` + 2px or explicit |
| `--radius-button` | length | Button radius | Per-aesthetic |
| `--radius-input` | length | Input field radius | Per-aesthetic |
| `--radius-badge` | length | Badge/chip radius | Per-aesthetic |

### 4.11 Motion Tokens

| Canonical Token | Type | Purpose |
|----------------|------|---------|
| `--motion-duration-instant` | time | Micro feedback (100ms base) |
| `--motion-duration-fast` | time | Button hover (200ms base) |
| `--motion-duration-standard` | time | Standard transitions (300ms base) |
| `--motion-duration-emphasis` | time | Emphasis animations (500ms base) |
| `--motion-duration-lifecycle` | time | Element birth/death (800ms base) |
| `--motion-duration-ambient` | time | Ambient loops (3000ms base) |
| `--motion-ease-enter` | easing | Enter transitions |
| `--motion-ease-exit` | easing | Exit transitions |
| `--motion-ease-standard` | easing | Standard transitions |
| `--motion-ease-spring` | easing | Bouncy transitions |

### 4.12 Layout/Chrome Tokens

| Canonical Token | Type | Purpose | Notes |
|----------------|------|---------|-------|
| `--safe-top` | length | Safe area inset top | From `env(safe-area-inset-top)` |
| `--safe-bottom` | length | Safe area inset bottom | From `env(safe-area-inset-bottom)` |
| `--safe-left` | length | Safe area inset left | From `env(safe-area-inset-left)` |
| `--safe-right` | length | Safe area inset right | From `env(safe-area-inset-right)` |
| `--nav-height` | length | NavBar total height | `calc(44px + var(--safe-top))` |

---

## 5. Master Bridge Table

The definitive mapping from canonical tokens to what each spec defines. Read this as: "To implement token X, use this value from each spec."

### 5.1 Surface Tokens

| Canonical Token | Simple Spec Source | Fun Spec Source | Warm Spec Source | Elegant Spec Source |
|----------------|-------------------|-----------------|------------------|---------------------|
| `--surface-base` | `--color-bg` | `--background` | `--background` | `--color-bg` |
| `--surface-card` | `--color-surface` | `--card` | `--card` | `--color-surface` |
| `--surface-raised` | `--color-surface` | `--card` | `--card` | `--color-surface` |
| `--surface-overlay` | `--color-surface` | `--popover` | `--popover` | `--color-surface` |
| `--surface-input` | `--color-surface` | `--card` | `--card` | `--color-surface` |
| `--surface-subtle` | `--color-surface` | `--muted` | `--muted` | `--color-surface` |
| `--surface-hover` | `--color-surface-hover` | `--accent` (shadcn) | `--accent` (shadcn) | `--color-surface-hover` |
| `--surface-grain` | `none` | `none` | `url('/textures/linen-warm.svg')` | `none` |

### 5.2 Text Tokens

| Canonical Token | Simple Spec Source | Fun Spec Source | Warm Spec Source | Elegant Spec Source |
|----------------|-------------------|-----------------|------------------|---------------------|
| `--text-primary` | `--color-fg` | `--foreground` | `--foreground` | `--color-fg` |
| `--text-secondary` | `--color-fg-secondary` | `--muted-foreground` | `--muted-foreground` | `--color-fg-secondary` |
| `--text-muted` | `--color-fg-tertiary` | `--muted-foreground` | `--muted-foreground` | `--color-fg-tertiary` |
| `--text-inverse` | `--color-accent-fg` | `--primary-foreground` | `--primary-foreground` | `--color-accent-fg` |

**Note**: Simple and Elegant distinguish `--color-fg-secondary` from `--color-fg-tertiary`. Fun and Warm have only `--muted-foreground`. For Fun/Warm, `--text-muted` should be derived as a dimmer variant of `--muted-foreground` (reduce L by ~0.10).

### 5.3 Accent Tokens

| Canonical Token | Simple Spec Source | Fun Spec Source | Warm Spec Source | Elegant Spec Source |
|----------------|-------------------|-----------------|------------------|---------------------|
| `--accent-primary` | `--color-accent` | `--primary` | `--primary` | `--color-accent` |
| `--accent-hover` | `--color-accent-hover` | `--ring` | `--ring` | `--color-accent-hover` |
| `--accent-muted` | Derive: `--color-accent` at 10% | `color-mix(--primary, 10%)` | `color-mix(--primary, 10%)` | Derive: `--color-accent` at 10% |
| `--accent-glow` | Derive: `--color-accent` at 20% | `color-mix(--ring, 30%)` | `color-mix(--ring, 20%)` | Derive: `--color-accent` at 20% |

### 5.4 Border Tokens

| Canonical Token | Simple Spec Source | Fun Spec Source | Warm Spec Source | Elegant Spec Source |
|----------------|-------------------|-----------------|------------------|---------------------|
| `--border-default` | `--color-border` | `--border` | `--border` | `--color-border` |
| `--border-subtle` | `--color-border` | `--border` | `--border` | `--color-border` |
| `--border-focus` | `--color-accent` | `--primary` | `--primary` | `--color-accent` |
| `--border-weight` | `1px` | `2px` | `1px` | `1px` |

### 5.5 Feedback Tokens

| Canonical Token | Simple Spec Source | Fun Spec Source | Warm Spec Source | Elegant Spec Source |
|----------------|-------------------|-----------------|------------------|---------------------|
| `--feedback-success` | `--color-success` | `--primary` | `--primary` | `--color-success` |
| `--feedback-error` | `--color-error` | `--destructive` | `--destructive` | `--color-error` |
| `--feedback-warning` | NOT DEFINED | NOT DEFINED | NOT DEFINED | NOT DEFINED |
| `--feedback-info` | NOT DEFINED | NOT DEFINED | NOT DEFINED | NOT DEFINED |

### 5.6 Shadow Tokens

| Canonical Token | Simple | Fun | Warm | Elegant |
|----------------|--------|-----|------|---------|
| `--shadow-sm` | `none` | Accent-hued, 15% | Warm-hued, 6-10% | `none` |
| `--shadow-md` | `none` | Accent-hued, 9%+6% | Warm-hued, 4-6% | `0 1px 3px oklch(0 0 0 / 4%)` |
| `--shadow-lg` | `none` | Accent-hued, 7.5%+4.5%+3% | Warm-hued, 3-5% | `0 2px 8px oklch(0 0 0 / 5%)` |
| `--shadow-color` | `oklch(0 0 0)` | Accent-hued | Warm base-hued | `oklch(0 0 0)` |
| `--shadow-strength` | `0` | `0.20-0.30` | `0.12-0.20` | `0.04` |

### 5.7 Typography Tokens

| Canonical Token | Simple | Fun | Warm | Elegant |
|----------------|--------|-----|------|---------|
| `--font-heading` | Inter | Manrope | Cormorant Garamond | Cormorant Garamond |
| `--font-body` | Inter | Manrope | Source Sans 3 | Raleway |
| `--heading-weight` | 600 | 800 | 300 | 300 |
| `--heading-tracking` | -0.02em | -0.02em | 0.01em | 0.08em |
| `--heading-transform` | none | none | none | uppercase |
| `--body-line-height` | 1.50 | 1.55 | 1.75 | 1.70 |

### 5.8 Radius Tokens

| Canonical Token | Simple | Fun | Warm | Elegant |
|----------------|--------|-----|------|---------|
| `--radius` | 0.5rem (8px) | 1rem (16px) | 0.625rem (10px) | 3px |
| `--radius-card` | 0.75rem (12px) | 1rem (16px) | 0.625rem (10px) | 6px |
| `--radius-button` | 0.5rem (8px) | 1rem (16px) | 0.5rem (8px) | 3px |
| `--radius-input` | 0.5rem (8px) | 0.75rem (12px) | 0.5rem (8px) | 3px |
| `--radius-badge` | 0.375rem (6px) | 9999px | 0.375rem (6px) | 3px |

### 5.9 Motion Tokens

| Canonical Token | Simple | Fun | Warm | Elegant |
|----------------|--------|-----|------|---------|
| `--motion-duration-instant` | 100ms | 100ms (default) | 120ms | 120ms |
| `--motion-duration-fast` | 150ms | 200ms (default) | 280ms | 250ms |
| `--motion-duration-standard` | 200ms | 300ms (default) | 400ms | 400ms |
| `--motion-duration-emphasis` | 0ms | 500ms (default) | 700ms | 600ms |
| `--motion-duration-lifecycle` | 0ms | 800ms (default) | 1000ms | 1000ms |
| `--motion-duration-ambient` | 0ms | 3000ms (default) | 4000ms | 4000ms |

---

## 6. Missing Token Analysis

### 6.1 Tokens the Codebase Uses but NO Spec Defines

These MUST be added to every aesthetic spec or derived via the bridge:

| Canonical Token | Status | Recommended Derivation |
|----------------|--------|----------------------|
| `--feedback-warning` | Missing from ALL 4 specs | Use `oklch(0.72 0.15 70)` dark / `oklch(0.52 0.18 70)` light (warm amber) across all aesthetics |
| `--feedback-info` | Missing from ALL 4 specs | Use `oklch(0.70 0.12 240)` dark / `oklch(0.50 0.14 240)` light (utility blue) across all aesthetics |
| `--backdrop-overlay` | Missing from ALL 4 specs | Derive: `color-mix(in srgb, var(--surface-base) 50%, transparent)` |
| `--chrome-bg` | Missing from ALL 4 specs | Derive: `color-mix(in srgb, var(--surface-base) 72%, transparent)` |
| `--chrome-border` | Missing from ALL 4 specs | Derive: `color-mix(in srgb, var(--text-primary) 8%, transparent)` |
| `--surface-hover` | Missing from Fun and Warm | Fun: use `--accent` (shadcn). Warm: derive from `--card` +0.04L |
| `--surface-input` | Missing from ALL 4 specs | Derive: same as `--surface-card` or slightly different L |
| `--surface-raised` | Missing from ALL 4 specs | Derive: same as `--surface-card` |
| `--accent-muted` | Missing from ALL 4 specs (explicit) | Derive: `color-mix(in srgb, var(--accent-primary) 10%, transparent)` |
| `--accent-glow` | Missing from ALL 4 specs (explicit) | Derive: `color-mix(in srgb, var(--accent-primary) 20%, transparent)` |
| `--text-muted` (distinct from secondary) | Missing from Fun and Warm | Derive: reduce L by 0.12 from `--text-secondary` |
| `--nav-height` | Not per-aesthetic (structural) | Keep global: `calc(44px + var(--safe-top))` |

### 6.2 Tokens That Specs Define but Codebase Does Not Use

These exist in specs but have no codebase consumer. They should be defined for future use but are NOT blocking:

| Spec Token | Which Spec | Status |
|-----------|-----------|--------|
| `--color-surface-hover` | Simple, Elegant | Mapped to `--surface-hover` above |
| `--color-divider` | Simple, Elegant | Can be mapped to `--border-default` with opacity modifier |
| `--color-fg-tertiary` | Simple, Elegant | Mapped to `--text-muted` above |
| `--shadow-xl` | Simple | Not used in codebase -- skip |
| `--shadow-sticky` | Simple | Special case -- only Simple's sticky bar uses this |
| `--radius-avatar` | Simple | Not currently tokenized (always `9999px` via Tailwind) |
| `--space-1` through `--space-12` | Simple, Elegant | Not used as CSS vars (Tailwind spacing utilities used instead) |
| `--page-px`, `--page-max-w`, `--section-gap`, `--row-gap`, `--inner-padding` | Simple | Not yet consumed (potential future per-aesthetic layout tokens) |
| `--ease-elegant`, `--ease-warm` | Elegant, Warm | Not yet in codebase; add when implementing aesthetic motion |
| Type scale tokens (`--text-title-size`, etc.) | Simple | Not consumed; codebase uses utility classes |

### 6.3 Divider Token Gap

Simple and Elegant define `--color-divider` as a dedicated token. Fun and Warm use `--border` (at different opacities). The canonical approach:

- **Add `--divider-color`** to the canonical system
- Simple: maps to `--color-divider` value
- Fun: maps to `--border` value
- Warm: maps to `--border` value at 50% opacity
- Elegant: maps to `--color-divider` value at 60% opacity

---

## 7. CSS Architecture

### 7.1 Layer Structure

```css
/* ═══════════════════════════════════════════════════
   LAYER 1: Global constants (shared by ALL aesthetics)
   Set once, never overridden by aesthetic or palette.
   ═══════════════════════════════════════════════════ */
:root {
  /* Safe areas */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --nav-height: calc(44px + var(--safe-top));

  /* Typography size scale (shared, immutable) */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  /* Base font stacks (reference) */
  --font-serif: 'Vollkorn', Georgia, 'Times New Roman', serif;
  --font-sans: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ═══════════════════════════════════════════════════
   LAYER 2: Aesthetic + Palette + Mode tokens
   Each combination defines ALL shadcn primitives AND
   ALL Ephemeral semantic tokens.
   ═══════════════════════════════════════════════════ */
[data-aesthetic="fun"][data-palette="party"][data-mode="dark"] {
  /* shadcn primitives */
  --background: oklch(0.14 0.03 290);
  --foreground: oklch(0.95 0.01 290);
  --card: oklch(0.17 0.03 290);
  /* ... all shadcn primitives ... */

  /* Ephemeral semantic tokens (directly set, not derived) */
  --surface-base: oklch(0.14 0.03 290);
  --surface-card: oklch(0.17 0.03 290);
  --surface-raised: oklch(0.17 0.03 290);
  --surface-overlay: oklch(0.20 0.03 290);
  --surface-input: oklch(0.17 0.03 290);
  --surface-subtle: oklch(0.22 0.03 290);
  --surface-hover: oklch(0.26 0.04 290);
  --text-primary: oklch(0.95 0.01 290);
  --text-secondary: oklch(0.60 0.04 290);
  --text-muted: oklch(0.48 0.04 290);
  --text-inverse: oklch(0.13 0.04 330);
  --accent-primary: oklch(0.72 0.22 330);
  --accent-hover: oklch(0.65 0.20 330);
  --accent-muted: color-mix(in srgb, oklch(0.72 0.22 330) 10%, transparent);
  --accent-glow: color-mix(in srgb, oklch(0.72 0.22 330) 20%, transparent);
  --border-default: oklch(1 0 0 / 12%);
  --border-subtle: oklch(1 0 0 / 8%);
  --border-focus: oklch(0.72 0.22 330);
  /* ... etc ... */

  /* Structural */
  --font-heading: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight: 800;
  --heading-tracking: -0.02em;
  --heading-transform: none;
  --body-line-height: 1.55;
  --radius: 1rem;
  --border-weight: 2px;
  --surface-grain: none;

  /* Shadows */
  --shadow-sm: 0 1px 2px oklch(0.45 0.15 330 / 15%);
  --shadow-md: ...;
  --shadow-lg: ...;

  /* Motion */
  --motion-duration-instant: 100ms;
  --motion-duration-fast: 200ms;
  --motion-duration-standard: 300ms;
  --motion-duration-emphasis: 500ms;
  --motion-duration-lifecycle: 800ms;
  --motion-duration-ambient: 3000ms;
  --motion-ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);
  --motion-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --motion-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ═══════════════════════════════════════════════════
   LAYER 3: Accent hue override (optional)
   Only overrides the 3 accent-related primitives.
   Applied via inline style from TypeScript.
   ═══════════════════════════════════════════════════ */
/* Applied inline: style="--primary: ...; --primary-foreground: ...; --ring: ...;"
   The semantic tokens (--accent-primary, etc.) pick up the change
   because they alias the primitives in Layer 2. */

/* ═══════════════════════════════════════════════════
   LAYER 4: Derived tokens (auto-computed)
   Tokens that are algorithmically derived from Layer 2
   values. These use color-mix() or calc() and do NOT
   need to be defined in each palette CSS file.
   ═══════════════════════════════════════════════════ */
[data-aesthetic] {
  --backdrop-overlay: color-mix(in srgb, var(--surface-base) 50%, transparent);
  --chrome-bg: color-mix(in srgb, var(--surface-base) 72%, transparent);
  --chrome-border: color-mix(in srgb, var(--text-primary) 8%, transparent);

  /* Feedback colors (shared across aesthetics) */
  --feedback-success: var(--accent-primary);
  --feedback-error: var(--destructive, oklch(0.65 0.20 25));
  --feedback-warning: oklch(0.72 0.15 70);
  --feedback-info: oklch(0.70 0.12 240);
}
```

### 7.2 Data Attribute Placement

```html
<!-- On the outermost content wrapper element -->
<div
  data-aesthetic="fun"
  data-palette="party"
  data-mode="dark"
  style="--primary: oklch(0.72 0.22 330); ..."
>
```

| Attribute | Element | Values | Set By |
|-----------|---------|--------|--------|
| `data-aesthetic` | Content wrapper | `simple`, `fun`, `warm`, `elegant` | Server (from DB) |
| `data-palette` | Content wrapper | Aesthetic-specific palette name | Server (from DB) |
| `data-mode` | Content wrapper | `light`, `dark` | Server (from DB) |
| `style` (inline) | Content wrapper | Accent hue overrides only | TypeScript (`computeAccentStyle()`) |

### 7.3 SSR Strategy (Avoiding Flash of Wrong Theme)

1. The `+page.server.ts` load function fetches the event's `aesthetic`, `palette`, `mode`, and `accent_hue` from the backend API.
2. The `+page.svelte` applies these as data attributes on the wrapper element.
3. The CSS for all aesthetics/palettes is bundled in the main CSS file (not lazy-loaded). This is important -- the styles must be available before first paint.
4. Font loading for non-default fonts (Inter, Cormorant Garamond, Source Sans 3, Raleway) is conditional via `<link>` tags in the page `<svelte:head>`, driven by the `aesthetic` value from the server.

```svelte
<svelte:head>
  {#if aesthetic === 'simple'}
    <link href="...Inter..." rel="stylesheet">
  {:else if aesthetic === 'warm'}
    <link href="...Cormorant+Garamond...Source+Sans+3..." rel="stylesheet">
  {:else if aesthetic === 'elegant'}
    <link href="...Cormorant+Garamond...Raleway..." rel="stylesheet">
  {/if}
  <!-- Fun uses Manrope which is already loaded globally -->
</svelte:head>
```

### 7.4 Conditional Font Loading

| Aesthetic | Heading Font | Body Font | Needs Additional Load |
|-----------|-------------|-----------|----------------------|
| Simple | Inter | Inter | YES -- load Inter |
| Fun | Manrope (existing) | Manrope (existing) | NO |
| Warm | Cormorant Garamond | Source Sans 3 | YES -- load both |
| Elegant | Cormorant Garamond | Raleway | YES -- load both |

The global font load (in `app.html`) provides Vollkorn and Manrope for the default/Fun aesthetic. Additional fonts are loaded per-page when the aesthetic requires them.

### 7.5 CSS File Organization

```
src/lib/styles/
  themes/               # LEGACY -- kept during transition
    forest.css          # [data-theme="forest"][data-mode="dark/light"]
    ...
  aesthetics/           # NEW
    simple/
      default.css       # [data-aesthetic="simple"][data-palette="default"][data-mode="dark/light"]
      blue.css
      sage.css
      violet.css
    fun/
      party.css         # [data-aesthetic="fun"][data-palette="party"][data-mode="dark/light"]
      neon.css
      sunset.css
      cosmic.css
    warm/
      hearth.css
      clay.css
      sage.css
      wine.css
    elegant/
      ivory.css
      champagne.css
      midnight.css
      rose.css
    index.css           # Imports all aesthetic CSS files
  bridge.css            # [data-aesthetic] derived tokens (Layer 4)
  typography.css        # Shared type scale and utility classes
  elevation.css         # Shadow utility classes
  transitions.css       # View Transition animations
  native-reset.css      # Mobile resets
```

---

## 8. shadcn-svelte Variable Mapping

shadcn-svelte components consume a fixed set of CSS custom properties. Each aesthetic palette MUST define all of these. This table shows how to populate each shadcn primitive from the spec's token values.

### 8.1 shadcn Primitive -> Spec Value Mapping

| shadcn Primitive | Simple Source | Fun Source | Warm Source | Elegant Source |
|-----------------|--------------|-----------|------------|---------------|
| `--background` | `--color-bg` | `--background` (direct) | `--background` (direct) | `--color-bg` |
| `--foreground` | `--color-fg` | `--foreground` (direct) | `--foreground` (direct) | `--color-fg` |
| `--card` | `--color-surface` | `--card` (direct) | `--card` (direct) | `--color-surface` |
| `--card-foreground` | `--color-fg` | `--card-foreground` (direct) | `--card-foreground` (direct) | `--color-fg` |
| `--popover` | `--color-surface` | `--popover` (direct) | `--popover` (direct) | `--color-surface` |
| `--popover-foreground` | `--color-fg` | `--popover-foreground` (direct) | `--popover-foreground` (direct) | `--color-fg` |
| `--primary` | `--color-accent` | `--primary` (direct) | `--primary` (direct) | `--color-accent` |
| `--primary-foreground` | `--color-accent-fg` | `--primary-foreground` (direct) | `--primary-foreground` (direct) | `--color-accent-fg` |
| `--secondary` | `--color-surface` | `--secondary` (direct) | `--secondary` (direct) | `--color-surface` |
| `--secondary-foreground` | `--color-fg` | `--secondary-foreground` (direct) | `--secondary-foreground` (direct) | `--color-fg` |
| `--muted` | `--color-surface` | `--muted` (direct) | `--muted` (direct) | `--color-surface` |
| `--muted-foreground` | `--color-fg-secondary` | `--muted-foreground` (direct) | `--muted-foreground` (direct) | `--color-fg-secondary` |
| `--accent` | `--color-surface-hover` | `--accent` (direct) | `--accent` (direct) | `--color-surface-hover` |
| `--accent-foreground` | `--color-fg` | `--accent-foreground` (direct) | `--accent-foreground` (direct) | `--color-fg` |
| `--destructive` | `--color-error` | `--destructive` (direct) | `--destructive` (direct) | `--color-error` |
| `--destructive-foreground` | `--color-accent-fg` | `--destructive-foreground` (direct) | `--destructive-foreground` (direct) | `--color-accent-fg` |
| `--border` | `--color-border` | `--border` (direct) | `--border` (direct) | `--color-border` |
| `--input` | `--color-border` | `--input` (direct) | `--input` (direct) | `--color-border` |
| `--ring` | `--color-accent` | `--ring` (direct) | `--ring` (direct) | `--color-accent` |
| `--radius` | `0.5rem` | `1rem` | `0.625rem` | `3px` |

### 8.2 Tailwind v4 Theme Registration

The `@theme inline` block in `app.css` maps shadcn primitives to Tailwind color utilities. This does NOT change -- it already uses `var()` references that will pick up whatever values are set by the active aesthetic:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  /* ... same mappings, no changes needed ... */
}
```

---

## 9. Migration Path

### 9.1 Current System

```
Database:     events.theme = 'forest' | 'midnight' | ... (10 values)
              events.mode = 'light' | 'dark'
              events.accent_hue = 0-360 | NULL

DOM:          <div data-theme="forest" data-mode="dark" style="--primary:...">

CSS:          [data-theme="forest"][data-mode="dark"] { --background: ...; }
              [data-theme] { --surface-base: var(--background); }

TypeScript:   EventTheming { theme: EventTheme; mode: EventMode; accent_hue: number | null }
              VALID_THEMES = ['forest', 'midnight', 'ember', ...] as const
```

### 9.2 New System

```
Database:     events.aesthetic = 'simple' | 'fun' | 'warm' | 'elegant' | NULL
              events.palette = 'party' | 'hearth' | 'ivory' | ... | NULL
              events.mode = 'light' | 'dark'
              events.accent_hue = 0-360 | NULL
              events.theme = 'forest' | ... (KEPT for backwards compatibility)

DOM:          <div data-aesthetic="fun" data-palette="party" data-mode="dark" style="--primary:...">

CSS:          [data-aesthetic="fun"][data-palette="party"][data-mode="dark"] { ... }
              [data-aesthetic] { --backdrop-overlay: ...; }

TypeScript:   EventTheming { aesthetic: EventAesthetic; palette: string; mode: EventMode; accent_hue: number | null }
              VALID_AESTHETICS = ['simple', 'fun', 'warm', 'elegant'] as const
```

### 9.3 Database Migration

```sql
-- Step 1: Add new columns (nullable, backwards compatible)
ALTER TABLE events ADD COLUMN aesthetic TEXT DEFAULT NULL;
ALTER TABLE events ADD COLUMN palette TEXT DEFAULT NULL;

-- Step 2: Backfill existing events
-- NULL aesthetic = use legacy theme system (during transition)
-- After all events are migrated, aesthetic becomes NOT NULL

-- Mapping:
UPDATE events SET aesthetic = 'fun', palette = 'party'    WHERE theme = 'neon';
UPDATE events SET aesthetic = 'fun', palette = 'neon'     WHERE theme = 'midnight';
UPDATE events SET aesthetic = 'warm', palette = 'hearth'  WHERE theme = 'forest' AND event_type IN ('dinner_party', 'potluck', 'supper_club');
UPDATE events SET aesthetic = 'fun', palette = 'party'    WHERE theme = 'forest' AND event_type NOT IN ('dinner_party', 'potluck', 'supper_club');
UPDATE events SET aesthetic = 'warm', palette = 'clay'    WHERE theme = 'ember';
UPDATE events SET aesthetic = 'warm', palette = 'sage'    WHERE theme = 'sand';
UPDATE events SET aesthetic = 'simple', palette = 'default' WHERE theme = 'slate';
UPDATE events SET aesthetic = 'simple', palette = 'default' WHERE theme = 'mono';
UPDATE events SET aesthetic = 'elegant', palette = 'rose'   WHERE theme = 'bloom';
UPDATE events SET aesthetic = 'elegant', palette = 'champagne' WHERE theme = 'gilded';
UPDATE events SET aesthetic = 'warm', palette = 'wine'    WHERE theme = 'dusk';

-- Step 3: (future) Drop theme column once migration is complete and verified
-- ALTER TABLE events DROP COLUMN theme;
```

### 9.4 Backwards Compatibility Period

During migration, BOTH systems coexist:

1. If `event.aesthetic` is NOT NULL -- use new system (`data-aesthetic` + `data-palette`)
2. If `event.aesthetic` IS NULL -- use legacy system (`data-theme`)
3. The `app.css` keeps BOTH bridge blocks:
   - `[data-theme] { --surface-base: var(--background); ... }` (legacy)
   - `[data-aesthetic] { --backdrop-overlay: ...; ... }` (new, derived tokens)
4. New aesthetic CSS files set BOTH shadcn primitives AND Ephemeral semantic tokens directly (no dependency on the bridge block)

### 9.5 TypeScript Migration

```typescript
// New types (coexist with old during transition)
export const VALID_AESTHETICS = ['simple', 'fun', 'warm', 'elegant'] as const;
export type EventAesthetic = (typeof VALID_AESTHETICS)[number];

export const PALETTE_MAP: Record<EventAesthetic, readonly string[]> = {
  simple: ['default', 'blue', 'sage', 'violet'],
  fun: ['party', 'neon', 'sunset', 'cosmic'],
  warm: ['hearth', 'clay', 'sage', 'wine'],
  elegant: ['ivory', 'champagne', 'midnight', 'rose'],
} as const;

export interface EventTheming {
  // New system
  aesthetic: EventAesthetic | null;
  palette: string | null;
  // Shared
  mode: EventMode;
  accent_hue: number | null;
  // Legacy (kept during transition)
  theme: EventTheme;
}

// Updated accent computation for Fun aesthetics (higher chroma)
export function computeAccentPrimary(
  hue: number,
  mode: EventMode,
  aesthetic: EventAesthetic | null
): string {
  if (aesthetic === 'fun') {
    return mode === 'dark'
      ? `oklch(0.70 0.20 ${hue})`
      : `oklch(0.52 0.20 ${hue})`;
  }
  // Default (all other aesthetics)
  return mode === 'dark'
    ? `oklch(0.65 0.18 ${hue})`
    : `oklch(0.48 0.20 ${hue})`;
}
```

### 9.6 Legacy Theme -> Aesthetic Palette Mapping (Complete)

| Legacy Theme | Aesthetic | Palette | Notes |
|-------------|-----------|---------|-------|
| `forest` | `fun` | `party` | Default mapping; override to `warm`/`hearth` for dinner/intimate types |
| `midnight` | `fun` | `neon` | Electric blue energy matches |
| `ember` | `warm` | `clay` | Warm earth tones match |
| `slate` | `simple` | `default` | Utility-first achromatic matches |
| `bloom` | `elegant` | `rose` | Soft blush matches |
| `gilded` | `elegant` | `champagne` | Gold/brass matches |
| `neon` | `fun` | `party` | Almost identical tokens (neon was the prototype for Fun/Party) |
| `dusk` | `warm` | `wine` | Purple-warm matches burgundy |
| `sand` | `warm` | `sage` | Warm natural matches |
| `mono` | `simple` | `default` | Achromatic matches |

---

## 10. Implementation Checklist

### Phase 1: CSS Files (No Component Changes)

- [ ] Create `src/lib/styles/aesthetics/` directory structure
- [ ] For each aesthetic (4) x palette (4) x mode (2) = 32 CSS files:
  - [ ] Define ALL shadcn primitives
  - [ ] Define ALL Ephemeral semantic tokens directly (not via bridge)
  - [ ] Define structural tokens (font, weight, tracking, radius, shadow, motion)
- [ ] Create `src/lib/styles/aesthetics/bridge.css` for derived tokens (`[data-aesthetic]` block)
- [ ] Create `src/lib/styles/aesthetics/index.css` importing all aesthetic CSS files
- [ ] Import new index from `app.css`
- [ ] Keep legacy theme imports during transition

### Phase 2: Data Layer

- [ ] Add `aesthetic` and `palette` columns to events table
- [ ] Update `EventTheming` TypeScript type
- [ ] Update `defaults.ts` with aesthetic/palette defaults per event type
- [ ] Update `tokens.ts` with palette-aware token lookup
- [ ] Update `accent.ts` with aesthetic-aware accent computation
- [ ] Update `meta-colors.ts` with aesthetic/palette meta colors

### Phase 3: Page Rendering

- [ ] Update `+page.server.ts` to fetch `aesthetic`/`palette` alongside `theme`/`mode`
- [ ] Update `+page.svelte` to apply `data-aesthetic`/`data-palette` attributes
- [ ] Add conditional font loading via `<svelte:head>`
- [ ] Test that all existing components render correctly with new data attributes

### Phase 4: Theme Picker Update

- [ ] Redesign theme picker: Aesthetic selector -> Palette selector -> Mode toggle
- [ ] Wire new picker to save `aesthetic`/`palette` to backend
- [ ] Keep legacy theme picker as fallback during transition

### Phase 5: Cleanup

- [ ] Run migration script to backfill `aesthetic`/`palette` for all existing events
- [ ] Verify all events render correctly post-migration
- [ ] Remove `[data-theme]` bridge block from `app.css`
- [ ] Remove legacy theme CSS files
- [ ] Drop `theme` column from events table (after full verification)

---

## Appendix A: Complete Token Enumeration

Every CSS custom property that a fully-specified aesthetic palette file must define:

```css
[data-aesthetic="X"][data-palette="Y"][data-mode="Z"] {
  /* ── shadcn primitives (18 properties) ── */
  --background: ...;
  --foreground: ...;
  --card: ...;
  --card-foreground: ...;
  --popover: ...;
  --popover-foreground: ...;
  --primary: ...;
  --primary-foreground: ...;
  --secondary: ...;
  --secondary-foreground: ...;
  --muted: ...;
  --muted-foreground: ...;
  --accent: ...;
  --accent-foreground: ...;
  --destructive: ...;
  --destructive-foreground: ...;
  --border: ...;
  --input: ...;
  --ring: ...;
  --radius: ...;

  /* ── Chart colors (5 properties) ── */
  --chart-1: ...;
  --chart-2: ...;
  --chart-3: ...;
  --chart-4: ...;
  --chart-5: ...;

  /* ── Ephemeral surface tokens (8 properties) ── */
  --surface-base: ...;
  --surface-card: ...;
  --surface-raised: ...;
  --surface-overlay: ...;
  --surface-input: ...;
  --surface-subtle: ...;
  --surface-hover: ...;
  --surface-grain: ...;

  /* ── Ephemeral text tokens (4 properties) ── */
  --text-primary: ...;
  --text-secondary: ...;
  --text-muted: ...;
  --text-inverse: ...;

  /* ── Ephemeral accent tokens (4 properties) ── */
  --accent-primary: ...;
  --accent-hover: ...;
  --accent-muted: ...;
  --accent-glow: ...;

  /* ── Ephemeral border tokens (3 properties + 1 length) ── */
  --border-default: ...;
  --border-subtle: ...;
  --border-focus: ...;
  --border-weight: ...;

  /* ── Feedback tokens (2 properties; warning/info are global) ── */
  --feedback-success: ...;
  --feedback-error: ...;

  /* ── Shadow tokens (5 properties) ── */
  --shadow-sm: ...;
  --shadow-md: ...;
  --shadow-lg: ...;
  --shadow-color: ...;
  --shadow-strength: ...;

  /* ── Typography tokens (6 properties) ── */
  --font-heading: ...;
  --font-body: ...;
  --heading-weight: ...;
  --heading-tracking: ...;
  --heading-transform: ...;
  --body-line-height: ...;

  /* ── Motion tokens (10 properties) ── */
  --motion-duration-instant: ...;
  --motion-duration-fast: ...;
  --motion-duration-standard: ...;
  --motion-duration-emphasis: ...;
  --motion-duration-lifecycle: ...;
  --motion-duration-ambient: ...;
  --motion-ease-enter: ...;
  --motion-ease-exit: ...;
  --motion-ease-standard: ...;
  --motion-ease-spring: ...;
}
/* TOTAL: 72 properties per palette/mode combination */
/* 4 aesthetics x 4 palettes x 2 modes = 32 combinations */
/* 32 x 72 = 2,304 total property definitions */
```

## Appendix B: Derivation Formulas for Computed Tokens

These tokens are set in the `[data-aesthetic]` block (Layer 4) and computed from Layer 2 values. Implementers do NOT need to specify these in each palette file:

```css
[data-aesthetic] {
  /* Overlay / chrome (derived from surface-base and text-primary) */
  --backdrop-overlay: color-mix(in srgb, var(--surface-base) 50%, transparent);
  --chrome-bg: color-mix(in srgb, var(--surface-base) 72%, transparent);
  --chrome-border: color-mix(in srgb, var(--text-primary) 8%, transparent);

  /* Feedback status colors (global, not per-palette) */
  --feedback-warning: oklch(0.72 0.15 70);
  --feedback-info: oklch(0.70 0.12 240);
}

/* Dark mode feedback color adjustments */
[data-aesthetic][data-mode="light"] {
  --feedback-warning: oklch(0.52 0.18 70);
  --feedback-info: oklch(0.50 0.14 240);
}
```

## Appendix C: CSS Selector Specificity

| Selector | Specificity | Purpose |
|----------|-------------|---------|
| `:root` | 0-1-0 | Global constants (Layer 1) |
| `[data-aesthetic="X"][data-palette="Y"][data-mode="Z"]` | 0-3-0 | Aesthetic tokens (Layer 2) |
| `[data-aesthetic]` | 0-1-0 | Derived tokens (Layer 4) |
| `[data-theme="X"][data-mode="Y"]` | 0-2-0 | Legacy theme (keep during transition) |
| `[data-theme]` | 0-1-0 | Legacy bridge (keep during transition) |
| Inline `style=""` | 1-0-0 | Accent hue overrides (Layer 3) |

The new aesthetic selectors (0-3-0) have HIGHER specificity than legacy theme selectors (0-2-0). This means:
- If both `data-aesthetic` and `data-theme` are present, the aesthetic wins.
- During the transition period, events with `data-aesthetic` use the new system, events with only `data-theme` use the legacy system.
- Inline accent overrides (specificity 1-0-0) always win, which is correct.

## Appendix D: Quick Reference Card

```
TOKEN BRIDGE QUICK REFERENCE
═══════════════════════════════════════════

WHAT COMPONENTS CONSUME:
  Colors:     var(--surface-*), var(--text-*), var(--accent-*), var(--border-*), var(--feedback-*)
  Chrome:     var(--backdrop-overlay), var(--chrome-bg), var(--chrome-border)
  Typography: var(--font-heading), var(--font-body), var(--heading-weight), etc.
  Shadows:    var(--shadow-sm/md/lg)
  Motion:     var(--motion-duration-*), var(--motion-ease-*)
  Layout:     var(--safe-*), var(--nav-height)

WHAT PALETTE CSS FILES DEFINE:
  72 properties total (see Appendix A)
  shadcn primitives + Ephemeral semantic tokens + structural + motion

WHAT IS AUTO-DERIVED (Layer 4):
  --backdrop-overlay, --chrome-bg, --chrome-border
  --feedback-warning, --feedback-info

SELECTOR:
  [data-aesthetic="fun"][data-palette="party"][data-mode="dark"]

FILE LOCATION:
  src/lib/styles/aesthetics/{aesthetic}/{palette}.css

TOTAL COMBINATIONS:
  4 aesthetics x 4 palettes x 2 modes = 32
```
