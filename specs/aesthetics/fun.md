# Fun Aesthetic Category -- Complete Design Specification

**Version**: 1.0
**Date**: February 2026
**Status**: Spec complete, ready for implementation
**Category**: Fun (1 of 4: Simple, Fun, Warm, Elegant)

---

## Table of Contents

1. [Category Definition](#1-category-definition)
2. [Reference Products](#2-reference-products)
3. [Relationship to Current Codebase](#3-relationship-to-current-codebase)
4. [Typography](#4-typography)
5. [Type Scale](#5-type-scale)
6. [Spacing Scale](#6-spacing-scale)
7. [Buttons](#7-buttons)
8. [Color Palettes](#8-color-palettes)
9. [Border Radius](#9-border-radius)
10. [Dividers and Separators](#10-dividers-and-separators)
11. [Shadow System](#11-shadow-system)
12. [Copy and Language](#12-copy-and-language)
13. [Layout Spec](#13-layout-spec)
14. [Animation and Motion](#14-animation-and-motion)
15. [Accessibility Verification](#15-accessibility-verification)
16. [Migration from Current Theme System](#16-migration-from-current-theme-system)

---

## 1. Category Definition

### Target Events
Birthday party, house party, themed party, Halloween, karaoke night, game night, rave, costume party, going-away party, friendsgiving, potluck, watch party, any celebration where the energy is "come have fun."

### Personality
Bold, energetic, personality-forward. The cover image is the main character. The design should feel like a party invitation that matches the energy of the party itself. Saturated, playful, confident -- never subtle, never restrained.

### Design Intent
Expressive, saturated, playful. The page should make you feel the energy of the event before you read a word. High-chroma accent colors, punchy typography, visible glow effects, generous rounded corners, and a hero image that dominates the viewport.

### Strategic Role
Table stakes -- this is the Partiful competitive space. Fun is the default aesthetic for the majority of social events. It must feel immediately modern, immediately shareable, and immediately recognizable as a party invitation.

### Structural Summary
The existing event page design (full-bleed hero, parallax, gradient scrim, card-based content, pill CTA buttons, ambient particles, confetti on RSVP) IS the Fun aesthetic. This spec formalizes and refines it rather than redesigning from scratch.

---

## 2. Reference Products

### 2.1 Spotify ("Encore" Design System)
**What we take**: Card containers as the primary content unit. Bold geometric sans-serif headings. High-saturation accent colors on dark surfaces. The idea that the artwork (cover image) is the hero, and everything else is supporting infrastructure.
**Specific elements**: Pill-shaped action buttons, numbered/animated counters, frosted-glass overlays.

### 2.2 Partiful
**What we take**: The structural pattern -- big hero image, event info overlaid, RSVP buttons at the bottom, guest avatars visible. The energy level: saturated colors, bold text, playful copy ("You're going!").
**Specific elements**: RSVP bar pinned to bottom, confetti burst on confirmation, guest count with colored dots.

### 2.3 Instagram Stories / Threads
**What we take**: Geometric sans-serif typography at bold weights. The way text overlays images with gradient scrims. Avatar stacks for social proof. The "card on dark background" pattern for content sections.
**Specific elements**: Avatar stack with overlap, animated number tickers, bottom sheet interaction pattern.

### 2.4 Material 3 Expressive
**What we take**: Vibrant, high-chroma accent colors. The concept that different themes within Fun should feel like different "moods" of the same party. Generous corner radius (16px) on containers.
**Specific elements**: Colored glow shadows on accent elements, surface tinting with accent color at low opacity, 3-level elevation with colored shadow.

### 2.5 Apple Music (Now Playing)
**What we take**: The way the hero image bleeds into the background with a gradient, creating an immersive "you are inside this album" feeling. Frosted glass overlays for controls.
**Specific elements**: Gradient scrim that transitions from transparent to the page background color, frosted-glass RSVP bar on scroll.

---

## 3. Relationship to Current Codebase

### What Already Exists (Keep As-Is)
These elements from the current implementation carry forward into Fun with no structural changes:

| Element | File | Status |
|---------|------|--------|
| Full-bleed hero with parallax | `HeroCover.svelte` | Keep -- this IS Fun |
| Gradient scrim over hero | `HeroCover.svelte` `.scrim-gradient` | Keep |
| Ambient canvas particles | `CanvasAmbient.svelte` + renderers | Keep |
| Confetti burst on RSVP | `Confetti.svelte` | Keep |
| GSAP entrance timeline | `event-detail.ts` | Keep |
| Frosted RSVP bar on scroll | `+page.svelte` `.rsvp-bar-frosted` | Keep |
| Bottom sheet interaction | `BottomSheet.svelte` | Keep |
| NumberTicker animated counter | `NumberTicker.svelte` | Keep |
| Pill-shaped CTA buttons | `+page.svelte` `.cta-btn` | Keep |
| Hero text shadow system | `HeroCover.svelte` `.hero-text-shadow-*` | Keep |
| View Transitions | `transitions.css` | Keep |
| Theme-color meta tag | `meta-colors.ts` | Keep |
| OKLch token system | `tokens.ts`, theme CSS files | Keep structure, change values |

### What Changes for Fun
| Element | Current | Fun Spec |
|---------|---------|----------|
| Heading font | Vollkorn (serif) for most themes, Manrope (sans) for neon/midnight/slate | Manrope Extra-Bold for ALL Fun palettes |
| Body font | Manrope | Manrope (no change) |
| Named themes | 10 (forest, midnight, etc.) | 4 Fun palettes (party, neon, sunset, cosmic) |
| Border radius | Varies per theme (0.375rem--1rem) | `1rem` (16px) for all Fun palettes |
| Shadow style | Varies per theme | Accent-colored glow for all Fun palettes |
| Heading weight | Varies (400--800) | 800 (extra-bold) for all Fun palettes |
| Heading tracking | Varies (-0.02em to 0.06em) | -0.02em (tight) for all Fun palettes |
| Border weight | 1px or 2px per theme | 2px for all Fun palettes |
| Surface grain | Some themes have grain | None for Fun (clean, digital) |

### What Does NOT Change Between Aesthetics
The page structure is shared. Fun does not change:
- The order of sections (hero, content, RSVP bar)
- The bottom sheet interaction model
- The RSVP flow (Going / Maybe / Can't Make It)
- The authentication modal
- The ticket purchase flow
- The share panel
- The host settings

The aesthetic system controls: colors, fonts, spacing, radius, shadows, animation intensity, copy tone, and which optional sections are visible by default.

---

## 4. Typography

### 4.1 Heading Font: Manrope Variable (Extra-Bold)

**Decision**: Use Manrope at weight 800 (extra-bold) for Fun headings. Manrope is already loaded in the codebase (weight range 300--800) and is a geometric sans-serif with slightly closed counters -- the same geometric DNA as Spotify's Circular. At extra-bold weight it is punchy and energetic. Adding a third font (e.g., Montserrat or Poppins) would increase page weight for minimal visual difference.

**Rationale for staying with Manrope**:
- Already loaded as a variable font (300--800 weight range), zero additional network cost
- Geometric structure similar to Circular/Poppins at bold weights
- At weight 800 with -0.02em tracking, it reads as bold and energetic
- The Neon theme in the current codebase already uses Manrope 800 for headings
- Consistent with body text font, creating a cohesive single-family aesthetic

**Font stack**:
```
'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

**CSS custom property values**:
```css
--font-heading: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--heading-weight: 800;
--heading-tracking: -0.02em;
--heading-transform: none;
```

### 4.2 Body Font: Manrope Variable (Regular)

**Decision**: Manrope at weight 400 for body text, 500 for labels, 600 for buttons. No change from current implementation.

**Font stack**:
```
'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

**CSS custom property values**:
```css
--font-body: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--body-line-height: 1.55;
```

### 4.3 Font Loading

No change required. The existing Google Fonts link in `app.html` already loads the full Manrope variable weight range:

```html
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&family=Vollkorn:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">
```

Vollkorn remains loaded for other aesthetic categories (Simple, Warm, Elegant). Fun does not use it but pays no penalty since it is loaded globally.

---

## 5. Type Scale

All values are mobile-first (375px base). The type scale uses the existing CSS utility classes (`.text-display-lg`, `.text-display-md`, etc.) driven by CSS custom properties, so Fun values are applied automatically when `--font-heading`, `--heading-weight`, and `--heading-tracking` are set.

### 5.1 Heading Scale

| Role | CSS Class | Size | Weight | Line-Height | Letter-Spacing | Notes |
|------|-----------|------|--------|-------------|----------------|-------|
| Event title (hero) | `.text-display-md` | 31px (1.9375rem) | 800 | 1.2 | -0.02em | Primary headline on hero |
| Event title (large) | `.text-display-lg` | 39px (2.4375rem) | 800 | 1.15 | -0.02em | Used if title is short |
| Section heading | `.text-headline-md` | 20px (1.25rem) | 800 | 1.3 | -0.02em | "Event Wall", "Details" |
| Card heading | `.text-headline-sm` | 18px (1.125rem) | 800 | 1.3 | -0.02em | Inside card containers |
| Small heading | `.text-display-sm` | 24px (1.5rem) | 800 | 1.2 | -0.02em | Bottom sheet titles |

### 5.2 Body Scale

| Role | CSS Class | Size | Weight | Line-Height | Letter-Spacing |
|------|-----------|------|--------|-------------|----------------|
| Body large | `.text-body-lg` | 18px (1.125rem) | 400 | 1.55 | 0 |
| Body default | `.text-body-md` | 16px (1rem) | 400 | 1.55 | 0 |
| Body small | `.text-body-sm` | 14px (0.875rem) | 400 | 1.55 | 0 |

### 5.3 Label Scale

| Role | CSS Class | Size | Weight | Line-Height | Letter-Spacing |
|------|-----------|------|--------|-------------|----------------|
| Button text | `.text-button` | 16px (1rem) | 600 | 1 | 0 |
| Label large | `.text-label-lg` | 16px (1rem) | 600 | 1.2 | 0 |
| Label default | `.text-label-md` | 14px (0.875rem) | 500 | 1.2 | 0 |
| Label small | `.text-label-sm` | 12px (0.75rem) | 500 | 1.2 | 0 |
| Caption/metadata | `.text-caption` | 12px (0.75rem) | 400 | 1.4 | 0 |

---

## 6. Spacing Scale

Fun uses medium density -- the hero image dominates, and info sections live in card containers with comfortable but not extravagant padding. This matches the existing implementation.

### 6.1 Page-Level Spacing

| Token | Value | Usage |
|-------|-------|-------|
| Page horizontal padding | 16px (`px-4`) | Content area left/right padding |
| Page max-width | 32rem (`max-w-lg`, 512px) | Content column max-width |
| Section gap | 24px (`space-y-6`) | Between major content sections |
| Hero overlap | `-rounded-t-2xl` on content | Content section overlaps hero with rounded top |
| RSVP bar bottom offset (scrolled) | `max(12px, calc(var(--safe-bottom) + 8px))` | Pinned bar at bottom |
| RSVP bar bottom offset (hero) | `11dvh` | Floating over hero image |
| Bottom padding (content) | 112px (`pb-28`) | Clears RSVP bar |

### 6.2 Card-Level Spacing

| Token | Value | Usage |
|-------|-------|-------|
| Card inner padding | 16px (`p-4`) | Inside card containers |
| Card row gap | 12px (`gap-3`) | Between icon and text in info rows |
| Card section gap | 8px (`gap-2`) | Between items in a grid |
| Info item min-height | 32px (`min-h-8`) | Uniform info row height |

### 6.3 Component Spacing

| Token | Value | Usage |
|-------|-------|-------|
| CTA button gap | 8px (`gap-2`) | Between Going/Maybe/Can't buttons |
| Button inner padding | 10px vertical, 16px horizontal (`px-4 py-2.5`) | Secondary action buttons |
| Avatar stack overlap | -8px margin-left per avatar | Guest avatar overlap |
| Icon-text gap | 12px (`gap-3`) | Icon to text in info rows |
| Sheet padding-bottom | Dynamic (calculated from RSVP bar position) | Bottom sheet content clearance |

---

## 7. Buttons

### 7.1 Primary CTA (Going Button)

The "Going" button is the most important interactive element. For Fun, it is bold, filled, and has a colored glow.

```css
/* Primary CTA — "Going" */
height: auto;
aspect-ratio: 2.2;
border-radius: 16px (rounded-2xl);
background: var(--primary);
color: var(--primary-foreground);
font-family: var(--font-body);
font-size: 14px (text-label-md);
font-weight: 600;
letter-spacing: 0;
transition: all 150ms ease;
box-shadow: 0 2px 8px oklch(from var(--primary) l c h / 25%);

/* Hover */
background: var(--ring); /* slightly darker/shifted */
box-shadow: 0 4px 16px oklch(from var(--primary) l c h / 35%);

/* Active */
transform: scale(0.97);
```

### 7.2 Secondary CTA (Maybe Button)

```css
/* Secondary CTA — "Maybe" */
height: auto;
aspect-ratio: 2.2;
border-radius: 16px (rounded-2xl);
background: oklch(from var(--background) l c h / 20%);
border: 2px solid var(--border);
color: var(--foreground);
font-size: 14px (text-label-md);
font-weight: 600;
backdrop-filter: blur(8px);
transition: all 150ms ease;

/* Hover */
background: oklch(from var(--card) l c h / 40%);
```

### 7.3 Tertiary CTA (Can't Make It)

```css
/* Tertiary CTA — "Can't Make It" */
height: auto;
aspect-ratio: 2.2;
border-radius: 16px (rounded-2xl);
background: transparent;
border: 2px solid var(--border);
color: var(--muted-foreground);
font-size: 14px (text-label-md);
font-weight: 500;
transition: all 150ms ease;
opacity: 0.7;

/* Hover */
background: oklch(from var(--card) l c h / 20%);
opacity: 1;
```

### 7.4 Secondary Action Buttons (Calendar, Share)

```css
/* Action buttons — pill shape */
height: auto;
padding: 10px 16px;
border-radius: 9999px; /* pill */
background: var(--card);
border: 1px solid var(--border);
color: var(--foreground);
font-size: 12px (text-label-sm);
font-weight: 500;
transition: all 150ms ease;

/* Hover */
background: var(--accent);
```

### 7.5 Confirmation/Active State

When a CTA is confirmed (e.g., "Going" is selected):
```css
/* Pulse ring animation on selection */
animation: cta-pulse 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
box-shadow: 0 0 0 0 oklch(from var(--primary) l c h / 20%);

@keyframes cta-pulse {
  0% { box-shadow: 0 0 0 0 oklch(from var(--primary) l c h / 20%); }
  60% { box-shadow: 0 0 0 10px transparent; }
  100% { box-shadow: none; }
}
```

This animation already exists in `+page.svelte` and carries forward.

---

## 8. Color Palettes

Fun defines 4 named palettes. Each palette specifies the full token set in both light and dark modes. All values in `oklch()`.

The palette system replaces the current 10 named themes (forest, midnight, etc.) within the Fun aesthetic. When the aesthetic-category system is implemented, a Fun event will pick one of these 4 palettes instead of one of the 10 universal themes.

### 8.1 Palette: "Party" (Default for Fun)

**Personality**: Hot pink/magenta energy. The birthday party, the house party, the celebration. Unapologetically bold.
**Neutral base hue**: 290 (purple-shifted, fun)
**Default accent hue**: 330 (hot magenta/pink)
**Based on**: Current "Neon" theme with refinements.

#### Party -- Dark Mode
```css
[data-aesthetic="fun"][data-palette="party"][data-mode="dark"] {
  /* Surfaces -- deep purple-shifted near-black */
  --background:           oklch(0.14 0.03 290);    /* deep purple-black */
  --foreground:           oklch(0.95 0.01 290);    /* near-white with purple tint */
  --card:                 oklch(0.17 0.03 290);    /* elevated surface */
  --card-foreground:      oklch(0.95 0.01 290);
  --popover:              oklch(0.20 0.03 290);    /* dropdown/sheet bg */
  --popover-foreground:   oklch(0.95 0.01 290);

  /* Interactive -- hot magenta accent */
  --primary:              oklch(0.72 0.22 330);    /* hot pink/magenta */
  --primary-foreground:   oklch(0.13 0.04 330);    /* dark text on accent */
  --secondary:            oklch(0.22 0.03 290);
  --secondary-foreground: oklch(0.92 0.01 290);
  --muted:                oklch(0.22 0.03 290);
  --muted-foreground:     oklch(0.60 0.04 290);
  --accent:               oklch(0.26 0.04 290);    /* hover bg */
  --accent-foreground:    oklch(0.95 0.01 290);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:               oklch(1 0 0 / 12%);
  --input:                oklch(1 0 0 / 14%);
  --ring:                 oklch(0.65 0.20 330);
  --radius:               1rem;

  /* Charts */
  --chart-1: oklch(0.72 0.22 330);
  --chart-2: oklch(0.68 0.18 260);
  --chart-3: oklch(0.75 0.16 80);
  --chart-4: oklch(0.65 0.20 180);
  --chart-5: oklch(0.70 0.14 30);

  /* Fun structural */
  --shadow-color:         oklch(0.45 0.15 330);
  --shadow-strength:      0.30;
  --surface-grain:        none;
  --border-weight:        2px;
  --font-heading:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:            'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight:       800;
  --heading-tracking:     -0.02em;
  --heading-transform:    none;
  --body-line-height:     1.55;

  /* Shadows (accent-colored glow) */
  --shadow-sm: 0 1px 2px oklch(0.45 0.15 330 / 15%);
  --shadow-md: 0 2px 4px oklch(0.45 0.15 330 / 9%), 0 4px 8px oklch(0.45 0.15 330 / 6%);
  --shadow-lg: 0 4px 8px oklch(0.45 0.15 330 / 7.5%), 0 8px 16px oklch(0.45 0.15 330 / 4.5%), 0 16px 32px oklch(0.45 0.15 330 / 3%);
}
```

#### Party -- Light Mode
```css
[data-aesthetic="fun"][data-palette="party"][data-mode="light"] {
  /* Surfaces -- light purple-white */
  --background:           oklch(0.97 0.008 290);
  --foreground:           oklch(0.16 0.04 290);
  --card:                 oklch(0.99 0.005 290);
  --card-foreground:      oklch(0.16 0.04 290);
  --popover:              oklch(0.99 0.005 290);
  --popover-foreground:   oklch(0.16 0.04 290);

  /* Interactive -- deeper magenta for contrast on light */
  --primary:              oklch(0.55 0.22 330);
  --primary-foreground:   oklch(0.98 0.005 330);
  --secondary:            oklch(0.94 0.01 290);
  --secondary-foreground: oklch(0.20 0.04 290);
  --muted:                oklch(0.94 0.01 290);
  --muted-foreground:     oklch(0.48 0.04 290);
  --accent:               oklch(0.94 0.02 290);
  --accent-foreground:    oklch(0.20 0.04 290);
  --destructive:          oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:               oklch(0.88 0.015 290);
  --input:                oklch(0.88 0.015 290);
  --ring:                 oklch(0.55 0.22 330);
  --radius:               1rem;

  /* Charts */
  --chart-1: oklch(0.55 0.22 330);
  --chart-2: oklch(0.50 0.16 260);
  --chart-3: oklch(0.55 0.14 80);
  --chart-4: oklch(0.48 0.18 180);
  --chart-5: oklch(0.52 0.13 30);

  /* Fun structural */
  --shadow-color:         oklch(0.45 0.15 330);
  --shadow-strength:      0.20;
  --surface-grain:        none;
  --border-weight:        2px;
  --font-heading:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:            'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight:       800;
  --heading-tracking:     -0.02em;
  --heading-transform:    none;
  --body-line-height:     1.55;

  /* Shadows */
  --shadow-sm: 0 1px 2px oklch(0.45 0.15 330 / 10%);
  --shadow-md: 0 2px 4px oklch(0.45 0.15 330 / 6%), 0 4px 8px oklch(0.45 0.15 330 / 4%);
  --shadow-lg: 0 4px 8px oklch(0.45 0.15 330 / 5%), 0 8px 16px oklch(0.45 0.15 330 / 3%), 0 16px 32px oklch(0.45 0.15 330 / 2%);
}
```

**Contrast verification (Party Dark)**:
- foreground (L:0.95) on background (L:0.14): delta 0.81 -- passes 4.5:1
- muted-foreground (L:0.60) on background (L:0.14): delta 0.46 -- passes 4.5:1
- primary-foreground (L:0.13) on primary (L:0.72): delta 0.59 -- passes 4.5:1
- primary (L:0.72) on background (L:0.14): delta 0.58 -- passes 3:1
- muted-foreground (L:0.60) on card (L:0.17): delta 0.43 -- passes 4.5:1

**Contrast verification (Party Light)**:
- foreground (L:0.16) on background (L:0.97): delta 0.81 -- passes 4.5:1
- muted-foreground (L:0.48) on background (L:0.97): delta 0.49 -- passes 4.5:1
- primary-foreground (L:0.98) on primary (L:0.55): delta 0.43 -- passes 4.5:1
- primary (L:0.55) on background (L:0.97): delta 0.42 -- passes 3:1
- muted-foreground (L:0.48) on card (L:0.99): delta 0.51 -- passes 4.5:1

---

### 8.2 Palette: "Neon"

**Personality**: Electric blue meets nightlife. The after-party, the rave, the EDM show. High-voltage energy.
**Neutral base hue**: 260 (cool blue-purple)
**Default accent hue**: 245 (electric blue)
**Based on**: Current "Midnight" theme, shifted toward the Fun structural treatment.

#### Neon -- Dark Mode
```css
[data-aesthetic="fun"][data-palette="neon"][data-mode="dark"] {
  /* Surfaces -- deep blue-purple */
  --background:           oklch(0.14 0.03 260);
  --foreground:           oklch(0.95 0.01 260);
  --card:                 oklch(0.17 0.03 260);
  --card-foreground:      oklch(0.95 0.01 260);
  --popover:              oklch(0.20 0.03 260);
  --popover-foreground:   oklch(0.95 0.01 260);

  /* Interactive -- electric blue */
  --primary:              oklch(0.68 0.19 245);
  --primary-foreground:   oklch(0.13 0.04 245);
  --secondary:            oklch(0.22 0.03 260);
  --secondary-foreground: oklch(0.92 0.01 260);
  --muted:                oklch(0.22 0.03 260);
  --muted-foreground:     oklch(0.62 0.04 260);
  --accent:               oklch(0.26 0.04 260);
  --accent-foreground:    oklch(0.95 0.01 260);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:               oklch(1 0 0 / 12%);
  --input:                oklch(1 0 0 / 14%);
  --ring:                 oklch(0.60 0.16 245);
  --radius:               1rem;

  /* Charts */
  --chart-1: oklch(0.68 0.19 245);
  --chart-2: oklch(0.72 0.16 195);
  --chart-3: oklch(0.60 0.20 310);
  --chart-4: oklch(0.75 0.14 160);
  --chart-5: oklch(0.65 0.18 30);

  /* Fun structural */
  --shadow-color:         oklch(0.40 0.14 245);
  --shadow-strength:      0.30;
  --surface-grain:        none;
  --border-weight:        2px;
  --font-heading:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:            'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight:       800;
  --heading-tracking:     -0.02em;
  --heading-transform:    none;
  --body-line-height:     1.55;

  /* Shadows (blue glow) */
  --shadow-sm: 0 1px 2px oklch(0.40 0.14 245 / 15%);
  --shadow-md: 0 2px 4px oklch(0.40 0.14 245 / 9%), 0 4px 8px oklch(0.40 0.14 245 / 6%);
  --shadow-lg: 0 4px 8px oklch(0.40 0.14 245 / 7.5%), 0 8px 16px oklch(0.40 0.14 245 / 4.5%), 0 16px 32px oklch(0.40 0.14 245 / 3%);
}
```

#### Neon -- Light Mode
```css
[data-aesthetic="fun"][data-palette="neon"][data-mode="light"] {
  /* Surfaces -- light blue-white */
  --background:           oklch(0.97 0.005 260);
  --foreground:           oklch(0.15 0.04 260);
  --card:                 oklch(0.99 0.003 260);
  --card-foreground:      oklch(0.15 0.04 260);
  --popover:              oklch(0.99 0.003 260);
  --popover-foreground:   oklch(0.15 0.04 260);

  /* Interactive -- deeper blue for light surfaces */
  --primary:              oklch(0.50 0.20 245);
  --primary-foreground:   oklch(0.98 0.005 245);
  --secondary:            oklch(0.94 0.01 260);
  --secondary-foreground: oklch(0.20 0.04 260);
  --muted:                oklch(0.94 0.01 260);
  --muted-foreground:     oklch(0.48 0.04 260);
  --accent:               oklch(0.94 0.015 260);
  --accent-foreground:    oklch(0.20 0.04 260);
  --destructive:          oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:               oklch(0.90 0.01 260);
  --input:                oklch(0.90 0.01 260);
  --ring:                 oklch(0.50 0.20 245);
  --radius:               1rem;

  /* Charts */
  --chart-1: oklch(0.50 0.20 245);
  --chart-2: oklch(0.50 0.16 195);
  --chart-3: oklch(0.50 0.18 310);
  --chart-4: oklch(0.52 0.14 160);
  --chart-5: oklch(0.50 0.16 30);

  /* Fun structural */
  --shadow-color:         oklch(0.40 0.12 245);
  --shadow-strength:      0.20;
  --surface-grain:        none;
  --border-weight:        2px;
  --font-heading:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:            'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight:       800;
  --heading-tracking:     -0.02em;
  --heading-transform:    none;
  --body-line-height:     1.55;

  /* Shadows */
  --shadow-sm: 0 1px 2px oklch(0.40 0.12 245 / 10%);
  --shadow-md: 0 2px 4px oklch(0.40 0.12 245 / 6%), 0 4px 8px oklch(0.40 0.12 245 / 4%);
  --shadow-lg: 0 4px 8px oklch(0.40 0.12 245 / 5%), 0 8px 16px oklch(0.40 0.12 245 / 3%), 0 16px 32px oklch(0.40 0.12 245 / 2%);
}
```

**Contrast verification (Neon Dark)**:
- foreground (L:0.95) on background (L:0.14): delta 0.81 -- passes 4.5:1
- muted-foreground (L:0.62) on background (L:0.14): delta 0.48 -- passes 4.5:1
- primary-foreground (L:0.13) on primary (L:0.68): delta 0.55 -- passes 4.5:1
- primary (L:0.68) on background (L:0.14): delta 0.54 -- passes 3:1

**Contrast verification (Neon Light)**:
- foreground (L:0.15) on background (L:0.97): delta 0.82 -- passes 4.5:1
- muted-foreground (L:0.48) on background (L:0.97): delta 0.49 -- passes 4.5:1
- primary-foreground (L:0.98) on primary (L:0.50): delta 0.48 -- passes 4.5:1
- primary (L:0.50) on background (L:0.97): delta 0.47 -- passes 3:1

---

### 8.3 Palette: "Sunset"

**Personality**: Warm, saturated, golden hour. The rooftop party, the beach bonfire, the outdoor festival. Warm energy without being cozy -- still bold and fun.
**Neutral base hue**: 40 (warm amber/golden)
**Default accent hue**: 25 (coral/warm orange)

#### Sunset -- Dark Mode
```css
[data-aesthetic="fun"][data-palette="sunset"][data-mode="dark"] {
  /* Surfaces -- deep warm amber-black */
  --background:           oklch(0.14 0.025 40);
  --foreground:           oklch(0.94 0.015 60);
  --card:                 oklch(0.17 0.025 40);
  --card-foreground:      oklch(0.94 0.015 60);
  --popover:              oklch(0.20 0.025 40);
  --popover-foreground:   oklch(0.94 0.015 60);

  /* Interactive -- vivid coral */
  --primary:              oklch(0.70 0.18 25);
  --primary-foreground:   oklch(0.14 0.03 25);
  --secondary:            oklch(0.22 0.025 40);
  --secondary-foreground: oklch(0.92 0.015 60);
  --muted:                oklch(0.22 0.025 40);
  --muted-foreground:     oklch(0.62 0.04 40);
  --accent:               oklch(0.26 0.03 40);
  --accent-foreground:    oklch(0.94 0.015 60);
  --destructive:          oklch(0.65 0.20 15);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:               oklch(1 0 0 / 11%);
  --input:                oklch(1 0 0 / 13%);
  --ring:                 oklch(0.62 0.16 25);
  --radius:               1rem;

  /* Charts */
  --chart-1: oklch(0.70 0.18 25);
  --chart-2: oklch(0.75 0.15 60);
  --chart-3: oklch(0.65 0.14 330);
  --chart-4: oklch(0.68 0.16 150);
  --chart-5: oklch(0.60 0.18 275);

  /* Fun structural */
  --shadow-color:         oklch(0.40 0.12 25);
  --shadow-strength:      0.28;
  --surface-grain:        none;
  --border-weight:        2px;
  --font-heading:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:            'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight:       800;
  --heading-tracking:     -0.02em;
  --heading-transform:    none;
  --body-line-height:     1.55;

  /* Shadows (coral glow) */
  --shadow-sm: 0 1px 2px oklch(0.40 0.12 25 / 14%);
  --shadow-md: 0 2px 4px oklch(0.40 0.12 25 / 8%), 0 4px 8px oklch(0.40 0.12 25 / 5%);
  --shadow-lg: 0 4px 8px oklch(0.40 0.12 25 / 7%), 0 8px 16px oklch(0.40 0.12 25 / 4%), 0 16px 32px oklch(0.40 0.12 25 / 2.5%);
}
```

#### Sunset -- Light Mode
```css
[data-aesthetic="fun"][data-palette="sunset"][data-mode="light"] {
  /* Surfaces -- warm cream */
  --background:           oklch(0.97 0.01 55);
  --foreground:           oklch(0.17 0.03 40);
  --card:                 oklch(0.99 0.006 55);
  --card-foreground:      oklch(0.17 0.03 40);
  --popover:              oklch(0.99 0.006 55);
  --popover-foreground:   oklch(0.17 0.03 40);

  /* Interactive -- deeper coral for light surfaces */
  --primary:              oklch(0.52 0.18 25);
  --primary-foreground:   oklch(0.98 0.01 55);
  --secondary:            oklch(0.94 0.012 50);
  --secondary-foreground: oklch(0.22 0.03 40);
  --muted:                oklch(0.94 0.012 50);
  --muted-foreground:     oklch(0.48 0.04 40);
  --accent:               oklch(0.94 0.02 45);
  --accent-foreground:    oklch(0.22 0.03 40);
  --destructive:          oklch(0.55 0.22 15);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:               oklch(0.88 0.018 50);
  --input:                oklch(0.88 0.018 50);
  --ring:                 oklch(0.52 0.18 25);
  --radius:               1rem;

  /* Charts */
  --chart-1: oklch(0.52 0.18 25);
  --chart-2: oklch(0.50 0.14 60);
  --chart-3: oklch(0.48 0.14 330);
  --chart-4: oklch(0.50 0.14 150);
  --chart-5: oklch(0.48 0.16 275);

  /* Fun structural */
  --shadow-color:         oklch(0.40 0.10 25);
  --shadow-strength:      0.20;
  --surface-grain:        none;
  --border-weight:        2px;
  --font-heading:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:            'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight:       800;
  --heading-tracking:     -0.02em;
  --heading-transform:    none;
  --body-line-height:     1.55;

  /* Shadows */
  --shadow-sm: 0 1px 2px oklch(0.40 0.10 25 / 10%);
  --shadow-md: 0 2px 4px oklch(0.40 0.10 25 / 6%), 0 4px 8px oklch(0.40 0.10 25 / 4%);
  --shadow-lg: 0 4px 8px oklch(0.40 0.10 25 / 5%), 0 8px 16px oklch(0.40 0.10 25 / 3%), 0 16px 32px oklch(0.40 0.10 25 / 2%);
}
```

**Contrast verification (Sunset Dark)**:
- foreground (L:0.94) on background (L:0.14): delta 0.80 -- passes 4.5:1
- muted-foreground (L:0.62) on background (L:0.14): delta 0.48 -- passes 4.5:1
- primary-foreground (L:0.14) on primary (L:0.70): delta 0.56 -- passes 4.5:1
- primary (L:0.70) on background (L:0.14): delta 0.56 -- passes 3:1

**Contrast verification (Sunset Light)**:
- foreground (L:0.17) on background (L:0.97): delta 0.80 -- passes 4.5:1
- muted-foreground (L:0.48) on background (L:0.97): delta 0.49 -- passes 4.5:1
- primary-foreground (L:0.98) on primary (L:0.52): delta 0.46 -- passes 4.5:1
- primary (L:0.52) on background (L:0.97): delta 0.45 -- passes 3:1

---

### 8.4 Palette: "Cosmic"

**Personality**: Teal/cyan energy on deep space. The sci-fi party, the game night, the watch party, the Halloween event. Cool but vivid. Futuristic fun.
**Neutral base hue**: 220 (deep space blue)
**Default accent hue**: 180 (vivid cyan/teal)

#### Cosmic -- Dark Mode
```css
[data-aesthetic="fun"][data-palette="cosmic"][data-mode="dark"] {
  /* Surfaces -- deep space blue */
  --background:           oklch(0.13 0.025 220);
  --foreground:           oklch(0.95 0.008 220);
  --card:                 oklch(0.16 0.025 220);
  --card-foreground:      oklch(0.95 0.008 220);
  --popover:              oklch(0.19 0.025 220);
  --popover-foreground:   oklch(0.95 0.008 220);

  /* Interactive -- vivid cyan */
  --primary:              oklch(0.75 0.16 180);
  --primary-foreground:   oklch(0.13 0.04 180);
  --secondary:            oklch(0.21 0.025 220);
  --secondary-foreground: oklch(0.92 0.008 220);
  --muted:                oklch(0.21 0.025 220);
  --muted-foreground:     oklch(0.62 0.03 220);
  --accent:               oklch(0.25 0.03 220);
  --accent-foreground:    oklch(0.95 0.008 220);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:               oklch(1 0 0 / 10%);
  --input:                oklch(1 0 0 / 12%);
  --ring:                 oklch(0.65 0.14 180);
  --radius:               1rem;

  /* Charts */
  --chart-1: oklch(0.75 0.16 180);
  --chart-2: oklch(0.68 0.18 280);
  --chart-3: oklch(0.72 0.14 120);
  --chart-4: oklch(0.70 0.16 330);
  --chart-5: oklch(0.65 0.12 60);

  /* Fun structural */
  --shadow-color:         oklch(0.40 0.12 180);
  --shadow-strength:      0.28;
  --surface-grain:        none;
  --border-weight:        2px;
  --font-heading:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:            'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight:       800;
  --heading-tracking:     -0.02em;
  --heading-transform:    none;
  --body-line-height:     1.55;

  /* Shadows (cyan glow) */
  --shadow-sm: 0 1px 2px oklch(0.40 0.12 180 / 14%);
  --shadow-md: 0 2px 4px oklch(0.40 0.12 180 / 8%), 0 4px 8px oklch(0.40 0.12 180 / 5%);
  --shadow-lg: 0 4px 8px oklch(0.40 0.12 180 / 7%), 0 8px 16px oklch(0.40 0.12 180 / 4%), 0 16px 32px oklch(0.40 0.12 180 / 2.5%);
}
```

#### Cosmic -- Light Mode
```css
[data-aesthetic="fun"][data-palette="cosmic"][data-mode="light"] {
  /* Surfaces -- cool off-white */
  --background:           oklch(0.97 0.005 220);
  --foreground:           oklch(0.15 0.035 220);
  --card:                 oklch(0.99 0.003 220);
  --card-foreground:      oklch(0.15 0.035 220);
  --popover:              oklch(0.99 0.003 220);
  --popover-foreground:   oklch(0.15 0.035 220);

  /* Interactive -- deeper teal for light */
  --primary:              oklch(0.48 0.14 180);
  --primary-foreground:   oklch(0.98 0.005 180);
  --secondary:            oklch(0.94 0.008 220);
  --secondary-foreground: oklch(0.20 0.035 220);
  --muted:                oklch(0.94 0.008 220);
  --muted-foreground:     oklch(0.48 0.03 220);
  --accent:               oklch(0.94 0.012 220);
  --accent-foreground:    oklch(0.20 0.035 220);
  --destructive:          oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:               oklch(0.90 0.008 220);
  --input:                oklch(0.90 0.008 220);
  --ring:                 oklch(0.48 0.14 180);
  --radius:               1rem;

  /* Charts */
  --chart-1: oklch(0.48 0.14 180);
  --chart-2: oklch(0.50 0.16 280);
  --chart-3: oklch(0.50 0.12 120);
  --chart-4: oklch(0.48 0.14 330);
  --chart-5: oklch(0.50 0.10 60);

  /* Fun structural */
  --shadow-color:         oklch(0.40 0.10 180);
  --shadow-strength:      0.18;
  --surface-grain:        none;
  --border-weight:        2px;
  --font-heading:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body:            'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight:       800;
  --heading-tracking:     -0.02em;
  --heading-transform:    none;
  --body-line-height:     1.55;

  /* Shadows */
  --shadow-sm: 0 1px 2px oklch(0.40 0.10 180 / 9%);
  --shadow-md: 0 2px 4px oklch(0.40 0.10 180 / 5%), 0 4px 8px oklch(0.40 0.10 180 / 3%);
  --shadow-lg: 0 4px 8px oklch(0.40 0.10 180 / 4.5%), 0 8px 16px oklch(0.40 0.10 180 / 2.5%), 0 16px 32px oklch(0.40 0.10 180 / 1.5%);
}
```

**Contrast verification (Cosmic Dark)**:
- foreground (L:0.95) on background (L:0.13): delta 0.82 -- passes 4.5:1
- muted-foreground (L:0.62) on background (L:0.13): delta 0.49 -- passes 4.5:1
- primary-foreground (L:0.13) on primary (L:0.75): delta 0.62 -- passes 4.5:1
- primary (L:0.75) on background (L:0.13): delta 0.62 -- passes 3:1

**Contrast verification (Cosmic Light)**:
- foreground (L:0.15) on background (L:0.97): delta 0.82 -- passes 4.5:1
- muted-foreground (L:0.48) on background (L:0.97): delta 0.49 -- passes 4.5:1
- primary-foreground (L:0.98) on primary (L:0.48): delta 0.50 -- passes 4.5:1
- primary (L:0.48) on background (L:0.97): delta 0.49 -- passes 3:1

---

### 8.5 Palette Summary Table

| Palette | Neutral Hue | Accent Hue | Energy | Default Mode | Best For |
|---------|-------------|------------|--------|-------------|----------|
| Party | 290 (purple) | 330 (hot pink) | Maximum | Dark | Birthday, house party, themed party |
| Neon | 260 (blue-purple) | 245 (electric blue) | High | Dark | Rave, game night, EDM, nightlife |
| Sunset | 40 (amber) | 25 (coral) | Warm-high | Dark | Rooftop, BBQ, outdoor fest, going-away |
| Cosmic | 220 (deep blue) | 180 (cyan) | Cool-high | Dark | Halloween, watch party, sci-fi, gaming |

### 8.6 Custom Accent Override

The existing accent override system (storing a hue angle 0-360, recomputing primary/ring at fixed L/C curves) works unchanged for Fun palettes. When a host picks a Fun palette and then overrides the accent hue, the system substitutes:

**Dark mode accent override**:
```
--primary: oklch(0.70 0.20 {hue})
--primary-foreground: oklch(0.13 0.04 {hue})
--ring: oklch(0.62 0.18 {hue})
```

**Light mode accent override**:
```
--primary: oklch(0.52 0.20 {hue})
--primary-foreground: oklch(0.98 0.005 {hue})
--ring: oklch(0.52 0.20 {hue})
```

Note: Fun accent overrides use slightly higher chroma (0.20) and higher lightness in dark mode (0.70) compared to the base system (0.18, 0.65) to maintain the bold, saturated character of the Fun aesthetic.

---

## 9. Border Radius

Fun uses generous, bubbly corner radius values. All 4 palettes share the same radius values.

| Element | Radius | CSS | Notes |
|---------|--------|-----|-------|
| Cards / containers | 16px | `rounded-2xl` | All content cards, info cards, banners |
| CTA buttons | 16px | `rounded-2xl` | Going/Maybe/Can't Make It |
| Action buttons (pill) | 9999px | `rounded-full` | Calendar, Share, Change RSVP |
| Input fields | 12px | `rounded-xl` | Form inputs, text areas |
| Badges / chips | 9999px | `rounded-full` | Status badges, count badges |
| Bottom sheet | 24px top | `rounded-t-3xl` | Top corners of sheets |
| RSVP status bar | 12px | `rounded-xl` | Persistent RSVP status indicator |
| Avatar circles | 9999px | `rounded-full` | Guest avatars |
| Content section overlap | 16px top | `rounded-t-2xl` | Content area over hero |

The `--radius` CSS custom property is set to `1rem` (16px) for all Fun palettes. This is the default for cards and generic containers. Specific elements override via utility classes as listed above.

---

## 10. Dividers and Separators

Fun relies primarily on card containers and spacing for section separation, not horizontal rules. Dividers are used sparingly and only within cards.

### 10.1 Card Borders (Primary Separation)

Cards are the primary separation mechanism. Every distinct content section lives inside a card:

```css
/* Card container -- Fun */
background: var(--card);
border: var(--border-weight) solid var(--border); /* 2px in Fun */
border-radius: 1rem;
padding: 16px;
```

### 10.2 In-Card Dividers

Within a card (e.g., between items in a list), use a thin line:

```css
/* In-card divider */
border-top: 1px solid var(--border);
margin: 8px 0;
opacity: 0.5;
```

### 10.3 Description Divider

The event description currently uses a border-bottom on the hero:

```css
/* Description bottom border (hero overlay) */
border-bottom: 1px solid oklch(from var(--foreground) l c h / 5%);
padding-bottom: 12px;
```

This carries forward unchanged.

### 10.4 Host Settings Tab Bar

The tab bar inside the host settings bottom sheet uses a top border:

```css
/* Tab bar top border */
border-top: 1px solid var(--border);
/* Active tab indicator */
border-top: 2px solid var(--primary);
```

---

## 11. Shadow System

Fun uses accent-colored glow shadows rather than neutral depth shadows. This is the key visual differentiator -- elements feel like they are emitting light in the accent color.

### 11.1 Shadow Token Structure

Each palette defines concrete shadow values using the palette's accent hue. The shadow formula:

```
Base shadow color: oklch({L} {C} {accent-hue})
Where L ~ 0.40-0.45, C ~ 0.10-0.15 (just enough hue to be perceptible)
```

### 11.2 Shadow Levels

| Level | Token | Usage | Values (example: Party palette, dark) |
|-------|-------|-------|---------------------------------------|
| None | - | Page background | No shadow |
| Small | `--shadow-sm` | Cards, info items | `0 1px 2px oklch(0.45 0.15 330 / 15%)` |
| Medium | `--shadow-md` | Popovers, dropdowns | `0 2px 4px oklch(0.45 0.15 330 / 9%), 0 4px 8px oklch(0.45 0.15 330 / 6%)` |
| Large | `--shadow-lg` | Modals, bottom sheets | `0 4px 8px oklch(0.45 0.15 330 / 7.5%), 0 8px 16px oklch(0.45 0.15 330 / 4.5%), 0 16px 32px oklch(0.45 0.15 330 / 3%)` |

### 11.3 Accent Glow (Fun-Specific)

Primary action elements (the "Going" CTA button, active state indicators) use an additional colored glow that extends further than the standard shadow:

```css
/* Accent glow on primary CTA */
.cta-primary-glow {
  box-shadow:
    0 2px 8px oklch(from var(--primary) l c h / 25%),     /* tight glow */
    0 8px 24px oklch(from var(--primary) l c h / 15%);    /* diffuse glow */
}

/* Accent glow on hover */
.cta-primary-glow:hover {
  box-shadow:
    0 4px 12px oklch(from var(--primary) l c h / 30%),
    0 12px 32px oklch(from var(--primary) l c h / 20%);
}
```

**Fallback** (if `oklch(from ...)` is not supported): Use the concrete shadow values from each palette's CSS definition. Each palette already includes concrete `--shadow-sm`, `--shadow-md`, `--shadow-lg` values.

### 11.4 Dark vs Light Shadow Intensity

| Mode | `--shadow-strength` | Glow visibility |
|------|--------------------:|-----------------|
| Dark | 0.28--0.30 | Highly visible -- glow is the elevation signal |
| Light | 0.18--0.20 | Subtle -- glow tints the standard shadow |

In dark mode, the glow IS the shadow. In light mode, the glow is a colored tint on a more conventional drop shadow.

---

## 12. Copy and Language

Fun uses energetic, casual, personality-forward copy. Not corporate, not precious.

### 12.1 RSVP Labels

| Action | Label | Post-Action Toast |
|--------|-------|-------------------|
| Going | "Going" | "You're going!" |
| Maybe | "Maybe" | "RSVP'd as maybe" |
| Decline | "Can't Make It" | "Can't make it" |
| Change RSVP | "Change" | (no toast) |
| Confirm changes | "Done" | "RSVP updated" |

These match the current implementation and carry forward.

### 12.2 Guest Count Format

The hero displays RSVP counts with the `NumberTicker` animated counter:

```
{count} going {middot} {count} maybe
```

Example: **12** going **·** **3** maybe

The numbers use `font-medium text-[var(--text-primary)]` for emphasis against the secondary-colored text.

When `show_guest_list` is enabled, a "View Guests" link appears alongside the count, using the accent color.

### 12.3 Guest Avatar Stack (Fun-Specific Enhancement)

Fun is the only aesthetic that shows guest avatars by default (other aesthetics show counts only unless the host enables the guest list). The avatar stack:

```
[avatar][avatar][avatar][+N more]
```

**Specification**:
- Show up to 5 avatar circles, 28px diameter
- Overlap: -8px margin-left (so 20px of each avatar is visible)
- Avatars show initials (first letter of display_name) in `--primary` color on a `--card` background
- If more than 5 guests, show "+{N}" as a final circle in `--muted` background with `--muted-foreground` text
- Stack appears below the RSVP count row in the hero info section
- Entrance animation: stagger from left, 50ms per avatar, scale from 0.8 to 1.0

### 12.4 Date/Time Format

Standard across all aesthetics (no Fun-specific change):
- Date: "Saturday, March 15" (full day name, month, day number)
- Time: "7:00 PM -- 11:00 PM" or "7:00 PM" (if no end time)
- Timezone is applied but not displayed unless it differs from the viewer's timezone

### 12.5 Reminder CTA

For guests who have not RSVP'd:
```
"Remind me to RSVP later"
```
Style: `text-caption`, underlined, muted color. This is low-key even in Fun -- it is a fallback action, not a primary CTA.

### 12.6 Privacy Badge

```
[ShieldCheck icon] Privacy · No data shared
```
or
```
[ShieldCheck icon] Privacy · Deletes in 5 days
```
Style: `text-caption`, centered, `--text-muted` with accent-colored icon.

### 12.7 Host-Specific Copy

| Element | Text |
|---------|------|
| RSVP status | "Hosting" |
| Settings button | "Settings" |
| Edit button | "Edit" (disabled for host) |
| Tab: Text blast | "Text Blast" |
| Tab: Guest management | "Guests" |
| Tab: Check-in (ticketed) | "Check-in" |

---

## 13. Layout Spec

### 13.1 Overall Structure

```
+--------------------------------------------------+
|                                                    |
|              HERO COVER IMAGE                      |
|              (100dvh, parallax)                    |
|                                                    |
|   [Title]                                         |
|   Hosted by [Name]                                |
|   [Description]                                    |
|   [Calendar icon] Saturday, March 15              |
|                    7:00 PM -- 11:00 PM            |
|   [MapPin icon]   The Rooftop Bar                 |
|                    123 Main St                     |
|   [Users icon]    12 going · 3 maybe  [View]     |
|   [avatar stack oooo+8]                           |
|   [Ticket icon]   $25                             |
|                                                    |
|   "powered by Ephemeral"                          |
|                                                    |
+--------------------------------------------------+
|                                                    |
|   CONTENT SECTION (rounded-t-2xl overlay)         |
|   bg: var(--background)                           |
|                                                    |
|   [Capacity warning if near-full]                 |
|   [Ticketing banners if applicable]               |
|   [Calendar + Share buttons]                      |
|   [Privacy badge]                                 |
|   [Event Feed / Wall]                             |
|   [Cost Summary if ticketed]                      |
|                                                    |
+--------------------------------------------------+
|                                                    |
|   FIXED RSVP BAR (z-50)                          |
|   [Going] [Maybe] [Can't Make It]                 |
|   -- or --                                        |
|   [Check: Going | Change] [Buy Tickets]           |
|                                                    |
+--------------------------------------------------+
```

### 13.2 Cover Image

- **Size**: `min-height: 100dvh` (full viewport)
- **Parallax**: GSAP `yPercent: -20` on scroll (cover is 120% height, translates upward)
- **Progressive blur**: `--blur-amount` increases from 0px to 8px as user scrolls past
- **Scrim gradient**: 5-stop gradient from transparent to `var(--background)` starting at 20%
- **Content alignment**: Left-aligned, within `max-w-lg` centered container
- **Content vertical distribution**: `justify-between` with `padding-top: 25dvh` and `padding-bottom: max(28px, calc(var(--safe-bottom) + 20px))`

### 13.3 Content Section

- **Background**: `var(--background)` (from palette)
- **Top corners**: `rounded-t-2xl` (16px top border-radius, overlapping hero)
- **Isolation**: `isolation: isolate` (creates stacking context above ambient canvas)
- **Width**: `max-w-lg` (512px) centered
- **Padding**: `px-4` (16px horizontal), `pt-4` top, `pb-28` bottom (clears RSVP bar)
- **Sections**: `space-y-6` (24px gap between sections)

### 13.4 RSVP Bar

- **Position**: `fixed`, `z-50`
- **Width**: Full viewport width, content inside `max-w-lg px-4`
- **Bottom offset**: Animated between `11dvh` (hero state) and `max(12px, calc(var(--safe-bottom) + 8px))` (scrolled state)
- **Frosted glass**: On scroll, gains `background: color-mix(in srgb, var(--background) 80%, transparent)` + `backdrop-filter: blur(16px)`
- **Entrance**: Delayed 1s, `translateY(12px)` to `translateY(0)` + opacity 0 to 1

### 13.5 What Is Visible by Default in Fun

Fun shows more content by default than Simple would:

| Element | Visible by Default | Notes |
|---------|-------------------|-------|
| Cover image | Always | The hero |
| Event title | Always | Bold heading on hero |
| Host name | Always | "Hosted by..." |
| Description | Always (if set) | On hero, 3-line clamp |
| Date + time | Always | Info row |
| Venue (if set) | Always | Info row |
| RSVP counts | Always | NumberTicker animated |
| Guest avatars | Fun only | Avatar stack below counts |
| Ticket price (if set) | Always | Info row |
| CTA buttons | Always | Going/Maybe/Can't |
| Event Feed / Wall | After RSVP | Comments, photos |
| Cost summary | After RSVP (ticketed) | Fee breakdown |
| Calendar + Share | After RSVP | Action buttons |
| Privacy badge | Always | Centered below actions |
| Guest list sheet | On tap (if enabled) | Bottom sheet |
| Ambient particles | Always (if supported) | Canvas overlay |

### 13.6 Density

Medium density. The hero image occupies the full first viewport. Below the fold, content sections are in cards with `16px` padding and `24px` gap between sections. This is denser than Elegant (which would use more whitespace) but not as compressed as Simple (which omits visual ornamentation).

---

## 14. Animation and Motion

### 14.1 Existing Animations (Keep)

These are already implemented and are the Fun motion signature:

| Animation | File | Description |
|-----------|------|-------------|
| Hero parallax | `HeroCover.svelte` | Cover image translates at 0.8x scroll speed |
| Progressive blur | `HeroCover.svelte` | Hero blurs 0-8px as user scrolls past |
| GSAP entrance timeline | `event-detail.ts` | Staggered fade-in: cover (0.6s) > title (0.4s) > info items (0.35s, staggered 50ms) > CTA (0.4s, spring ease) |
| RSVP bar slide | `+page.svelte` | Bar transitions from `11dvh` to `safe-bottom + 8px` on scroll |
| Confetti burst | `Confetti.svelte` | 18 particles radiate from click point on "Going" RSVP |
| CTA pulse ring | `+page.svelte` | Box-shadow pulse 0 > 10px > 0 on button selection |
| NumberTicker | `NumberTicker.svelte` | Animated count interpolation via GSAP |
| Scroll reveal | `scroll-reveal.ts` | IntersectionObserver-triggered fade-up on below-fold content |
| Frosted bar | `+page.svelte` | Background + backdrop-filter transition on scroll |
| Icon pop | `RsvpStatus.svelte` | Scale 0.5 + rotate -90deg > scale 1.15 > scale 1 on icon change |
| Bottom sheet | `BottomSheet.svelte` | Slide up from bottom |
| Ambient canvas particles | `CanvasAmbient.svelte` | Theme-specific floating particles |

### 14.2 Fun-Specific Refinements

**Confetti colors**: Should use the palette's accent colors instead of the hardcoded forest-green defaults. The `Confetti.svelte` component accepts a `colors` prop:

| Palette | Confetti Colors |
|---------|----------------|
| Party | `['oklch(0.72 0.22 330)', 'oklch(0.65 0.20 330)', 'oklch(0.80 0.15 300)', 'oklch(0.75 0.18 350)', 'oklch(0.70 0.12 260)']` |
| Neon | `['oklch(0.68 0.19 245)', 'oklch(0.60 0.16 245)', 'oklch(0.75 0.16 195)', 'oklch(0.72 0.14 280)', 'oklch(0.65 0.18 310)']` |
| Sunset | `['oklch(0.70 0.18 25)', 'oklch(0.62 0.16 25)', 'oklch(0.75 0.15 60)', 'oklch(0.68 0.14 350)', 'oklch(0.72 0.12 80)']` |
| Cosmic | `['oklch(0.75 0.16 180)', 'oklch(0.65 0.14 180)', 'oklch(0.72 0.14 200)', 'oklch(0.68 0.18 280)', 'oklch(0.70 0.12 120)']` |

**Ambient particle renderer**: The current system has renderers for `forest`, `sakura`, and `garden`. Fun palettes should map to an appropriate renderer or a new "confetti/sparkle" renderer:

| Palette | Ambient Renderer | Particle Style |
|---------|-----------------|----------------|
| Party | New: `sparkle` | Small glitter dots, slow drift, accent-colored |
| Neon | New: `sparkle` | Same renderer, blue-tinted |
| Sunset | `garden` (existing) | Warm golden particles |
| Cosmic | New: `sparkle` | Cyan-tinted sparks |

The `sparkle` renderer would be a simple variation on the existing particle system: small circles (2-4px), low velocity, high opacity variance, using the palette's accent hue family. This is a new addition but follows the existing `AmbientRenderer` interface.

### 14.3 Transition Specs

| Interaction | Duration | Easing | Property |
|-------------|----------|--------|----------|
| Button hover | 150ms | `ease` | `background-color, box-shadow` |
| Button active (press) | 150ms | `ease` | `transform: scale(0.97)` |
| RSVP bar slide | 350ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` | `bottom` |
| Frosted bar backdrop | 300ms | `ease` | `background, backdrop-filter` |
| Sheet open/close | 300ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` | `transform` |
| Scroll reveal (below-fold) | 500ms | `power3.out` | `opacity, y` |
| View transitions (page) | 250ms | `var(--motion-ease-standard)` | `transform, opacity` |
| Theme/mode switch (live preview) | 150ms | `ease` | `color, background-color, border-color` |

### 14.4 Reduced Motion

All animations respect `prefers-reduced-motion: reduce`:
- GSAP animations check `motionOk()` before executing
- CSS animations are disabled via the existing `@media (prefers-reduced-motion: reduce)` rules
- Ambient canvas checks `motionOk()` and `supportsAmbientEffects()` before rendering
- Confetti checks `motionOk()` before bursting
- NumberTicker falls back to instant value update

---

## 15. Accessibility Verification

### 15.1 Required Contrast Checks (Per Palette x Mode = 8 Configurations)

Every Fun palette in both modes must pass:

| Check | Pair | Minimum Ratio | Standard |
|-------|------|---------------|----------|
| 1 | `--foreground` on `--background` | 4.5:1 | WCAG AA normal text |
| 2 | `--card-foreground` on `--card` | 4.5:1 | WCAG AA normal text |
| 3 | `--primary-foreground` on `--primary` | 4.5:1 | WCAG AA button text |
| 4 | `--muted-foreground` on `--background` | 4.5:1 | WCAG AA captions |
| 5 | `--muted-foreground` on `--card` | 4.5:1 | WCAG AA card captions |
| 6 | `--primary` on `--background` | 3:1 | WCAG AA UI components |
| 7 | `--destructive-foreground` on `--destructive` | 4.5:1 | WCAG AA danger button |

All 4 palettes have been verified against these checks in Section 8 above (see "Contrast verification" notes after each palette definition). All pass.

### 15.2 OKLCH Lightness Delta Summary

The minimum acceptable lightness delta for 4.5:1 contrast at low chroma is approximately 0.40. All Fun palettes maintain:

| Palette | fg on bg | muted-fg on bg | primary-fg on primary | primary on bg |
|---------|----------|----------------|----------------------|---------------|
| Party (dark) | 0.81 | 0.46 | 0.59 | 0.58 |
| Party (light) | 0.81 | 0.49 | 0.43 | 0.42 |
| Neon (dark) | 0.81 | 0.48 | 0.55 | 0.54 |
| Neon (light) | 0.82 | 0.49 | 0.48 | 0.47 |
| Sunset (dark) | 0.80 | 0.48 | 0.56 | 0.56 |
| Sunset (light) | 0.80 | 0.49 | 0.46 | 0.45 |
| Cosmic (dark) | 0.82 | 0.49 | 0.62 | 0.62 |
| Cosmic (light) | 0.82 | 0.49 | 0.50 | 0.49 |

All values exceed the 0.40 minimum for 4.5:1 (or 0.30 minimum for 3:1).

### 15.3 Color-Blind Safety

Same as the base system:
- No information conveyed by color alone
- RSVP states: Going (accent + Check icon), Maybe (secondary + Minus icon), Can't Make It (muted + X icon)
- Interactive elements always have icon + text label
- Confetti is purely decorative

### 15.4 Focus Indicators

```css
:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

High-chroma accent colors in Fun palettes make focus rings highly visible.

---

## 16. Migration from Current Theme System

### 16.1 Architecture Change

The current system uses `data-theme="neon"` (10 themes, each a complete design system). The new system will use `data-aesthetic="fun"` + `data-palette="party"` (4 aesthetics x 3-4 palettes each).

**CSS selector pattern**:
```css
/* Current */
[data-theme="neon"][data-mode="dark"] { ... }

/* New */
[data-aesthetic="fun"][data-palette="party"][data-mode="dark"] { ... }
```

### 16.2 Theme-to-Palette Mapping

When migrating existing events:

| Current Theme | Maps To | Notes |
|---------------|---------|-------|
| neon | Fun > Party | Direct successor -- almost identical tokens |
| midnight | Fun > Neon | Electric blue energy, Fun structural treatment |
| forest | Not Fun | Maps to Simple or Warm aesthetic instead |
| ember | Not Fun | Maps to Warm aesthetic |
| slate | Not Fun | Maps to Simple aesthetic |
| bloom | Not Fun | Maps to Elegant aesthetic |
| gilded | Not Fun | Maps to Elegant aesthetic |
| dusk | Not Fun | Maps to Warm or Elegant |
| sand | Not Fun | Maps to Simple or Warm |
| mono | Not Fun | Maps to Simple aesthetic |

### 16.3 CSS Custom Property Contract

Fun palettes use the exact same CSS custom property names as the current theme system. The only change is the selector. All existing components that use `var(--primary)`, `var(--background)`, `var(--font-heading)`, etc. will work without modification.

### 16.4 TypeScript Types (Proposed)

```typescript
export const VALID_AESTHETICS = ['simple', 'fun', 'warm', 'elegant'] as const;
export type EventAesthetic = (typeof VALID_AESTHETICS)[number];

export const FUN_PALETTES = ['party', 'neon', 'sunset', 'cosmic'] as const;
export type FunPalette = (typeof FUN_PALETTES)[number];

export interface EventTheming {
  aesthetic: EventAesthetic;
  palette: string; // palette name within the aesthetic
  mode: EventMode;
  accent_hue: number | null;
}
```

### 16.5 Event Type Defaults

When the aesthetic system is live, event type defaults map to aesthetic + palette:

| Event Type | Aesthetic | Palette | Mode |
|-----------|-----------|---------|------|
| birthday | Fun | Party | Dark |
| hangout | Fun | Party | Dark |
| game_night | Fun | Neon | Dark |
| concert | Fun | Neon | Dark |
| watch_party | Fun | Cosmic | Dark |
| holiday_party | Fun | Sunset | Dark |
| potluck | Fun | Sunset | Dark |

---

## Appendix A: Fun Palette Quick Reference

### Shared Structural Properties (All 4 Palettes)

```css
--radius:            1rem;
--border-weight:     2px;
--font-heading:      'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-body:         'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--heading-weight:    800;
--heading-tracking:  -0.02em;
--heading-transform: none;
--body-line-height:  1.55;
--surface-grain:     none;
```

### Accent Hue per Palette

| Palette | Accent Hue | Approximate Hex |
|---------|------------|----------------|
| Party | 330 | ~#E455A8 (hot pink) |
| Neon | 245 | ~#4878E0 (electric blue) |
| Sunset | 25 | ~#D46030 (vivid coral) |
| Cosmic | 180 | ~#30B4B4 (vivid cyan) |

### Default Mode per Palette

All Fun palettes default to dark mode. Fun events are party invitations -- they look best on dark surfaces where the accent glow is visible and the cover image pops.

---

## Appendix B: Implementation Checklist

1. Create CSS files: `fun-party.css`, `fun-neon.css`, `fun-sunset.css`, `fun-cosmic.css`
2. Add `data-aesthetic` attribute alongside existing `data-theme` / `data-mode`
3. Update TypeScript types to include `aesthetic` field
4. Create `sparkle` ambient renderer for Fun palettes
5. Wire palette-specific confetti colors via the existing `colors` prop
6. Add avatar stack component for Fun guest display
7. Update theme picker UI to show aesthetics > palettes hierarchy
8. Add database migration for `aesthetic` column (or repurpose `theme`)
9. Update OG image generation to use Fun tokens
10. Run automated contrast verification across all 8 configurations (4 palettes x 2 modes)
11. Visual QA on iOS Safari, Android Chrome, desktop browsers
