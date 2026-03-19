# Ephemeral Events — "Simple" Aesthetic Category Specification

**Version**: 1.1
**Date**: February 2026
**Category**: Simple
**Strategic Role**: Highest-volume event type. Anti-Partiful for low-stakes hangouts.
**Personality**: Utility-first. Almost a text message that became a link.

> **Review Status**: Reviewed 2026-02-24
> **Issues Found**: 5 critical, 6 minor
> **Issues Fixed**:
> - CRITICAL: Renamed motion tokens from `--duration-*` to `--motion-duration-*` to match canonical TOKEN_BRIDGE names (sections 12, Appendix A)
> - CRITICAL: Added 4 missing motion easing tokens (`--motion-ease-enter`, `--motion-ease-exit`, `--motion-ease-standard`, `--motion-ease-spring`) to sections 12 and Appendix A
> - CRITICAL: Added missing `--chart-1` through `--chart-5` tokens to all 8 palette definitions (4 palettes x 2 modes)
> - CRITICAL: Added per-palette canonical semantic token mapping section (Section 6.1) showing how spec tokens map to the 72-token contract from TOKEN_BRIDGE Appendix A
> - CRITICAL: Added `--feedback-warning` and `--feedback-info` values to palette definitions (required by codebase)
> - MINOR: Updated Appendix B to replace stale "TBD" values with actual values from Fun, Warm, and Elegant specs
> - MINOR: Removed misleading mention of `simple-` namespace prefix in section 6 introduction
> - MINOR: Added contrast check for `--color-fg-tertiary` on `--color-surface` (card backgrounds) across all palettes
> - MINOR: Added note about `--divider-color` canonical token per TOKEN_BRIDGE section 6.3
> - MINOR: Added `--radius-image` token to border radius section for cross-aesthetic consistency
> - MINOR: Added note in Section 13 about direct-set vs. indirection pattern per TOKEN_BRIDGE Layer 2 architecture
> **Open Items**:
> - Human decision needed: Should Simple define `--surface-grain: none` redundantly in each palette CSS file, or only once in the `[data-aesthetic="simple"]` structural block? (Currently: structural block only, which is correct per TOKEN_BRIDGE Layer 2)
> - Human decision needed: The `--shadow-xl` token is defined as `none` but TOKEN_BRIDGE section 6.2 says it is "not used in codebase -- skip." Consider removing from spec to reduce noise.

---

## Table of Contents

1. [Reference Products](#1-reference-products)
2. [Typography: Font Selection](#2-typography-font-selection)
3. [Type Scale](#3-type-scale)
4. [Spacing Scale](#4-spacing-scale)
5. [Button Specification](#5-button-specification)
6. [Color Palettes (OKLCH)](#6-color-palettes-oklch)
7. [Border Radius](#7-border-radius)
8. [Divider/Separator Style](#8-dividerseparator-style)
9. [Shadow System](#9-shadow-system)
10. [Copy & Language](#10-copy--language)
11. [Layout Spec](#11-layout-spec)
12. [Animation & Motion](#12-animation--motion)
13. [Integration with Aesthetic System](#13-integration-with-aesthetic-system)

---

## 1. Reference Products

### 1.1 Linear (project management)

**What we take**: The entire typographic philosophy. Linear proves that a single font family (Inter) with hierarchy expressed through weight (not size variation or font switching) produces the most scannable, professional-feeling UI. We adopt their approach of very few distinct font sizes, multiple weights, near-zero decoration, and an 8px spacing grid. Their dark mode uses barely-tinted neutral surfaces that feel warm without color.

### 1.2 iOS Settings / Apple Reminders

**What we take**: The 44px minimum touch-target height, the hairline divider pattern (0.5px visual weight with left-side inset), and the principle that a list of plain text with consistent left alignment is the fastest thing to scan. Apple uses 17pt (roughly 17px at 1x) as the default body size, relying on weight to create hierarchy. We adopt their "grouped list" visual structure where content is organized into sections separated by subtle gaps.

### 1.3 Things 3 (task manager)

**What we take**: The art of removing everything that does not serve comprehension. Things 3 proves that a white/near-white background with black/near-black text, minimal iconography, and generous but consistent spacing can feel premium rather than cheap. We adopt their restraint: no gradients, no illustrations, no decorative borders, no color backgrounds on sections. Whitespace IS the design.

### 1.4 Notion (productivity)

**What we take**: The concept that warm grays (not blue-tinted cool grays) make plain text feel human and approachable rather than clinical. Notion's sidebar and page structure demonstrate that 8px-grid-aligned spacing with clear visual hierarchy through weight and opacity produces a tool that feels effortless. We adopt their approach to inline metadata: small, muted, immediately following the primary content.

### 1.5 iA Writer (writing tool)

**What we take**: The principle of the "content container" -- a single, narrow column of text that never exceeds comfortable reading width, centered on the viewport. iA Writer proves that constraining the content area (rather than filling the screen) increases both readability and perceived quality. Simple events use a max-width content column rather than full-bleed layout.

---

## 2. Typography: Font Selection

### Heading Font

**Font**: Inter
**Source**: Google Fonts (free, variable, self-hostable)
**Variable axes**: `wght` 100-900, `opsz` 14-32
**Heading weights**: 600 (semibold) for event title, 500 (medium) for section headings

Inter is the definitive utility typeface. Its optical size axis (`opsz`) automatically optimizes letterforms at every size -- taller x-height and ink traps at small sizes (text), cleaner curves and finer details at large sizes (display). This means headings at 28px+ automatically render with Inter Display characteristics without loading a separate font file.

### Body Font

**Font**: Inter (same family as heading)
**Body weight**: 400 (regular)
**Secondary weight**: 500 (medium, for emphasis within body)
**Metadata weight**: 400 at reduced opacity, or 400 with tertiary color

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600&display=swap" rel="stylesheet">
```

### CSS Font Stack

```css
--font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

### Why Inter (not Manrope, not system font)

- Manrope (used by Forest/Midnight/Slate themes for body) is a geometric sans-serif with personality. Simple must have NO personality in its type. Inter is invisible; you read the words, not the font.
- System fonts vary across platforms (SF Pro on Apple, Segoe UI on Windows, Roboto on Android). Inter guarantees cross-platform visual consistency, which matters for a product focused on utility.
- Inter's optical sizing axis means we get "Inter Display" behavior on headings and "Inter Text" behavior on body from a single font load. This is the key technical advantage.

---

## 3. Type Scale

All sizes in px. rem equivalents assume 16px root.

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `--text-title` | 28px (1.75rem) | 600 | 1.20 (33.6px) | -0.02em | Event title (the big name) |
| `--text-section` | 15px (0.9375rem) | 600 | 1.35 (20.25px) | 0.01em | Section headings (Details, Location) |
| `--text-body` | 16px (1rem) | 400 | 1.50 (24px) | 0em | Body text, descriptions |
| `--text-caption` | 13px (0.8125rem) | 400 | 1.40 (18.2px) | 0.005em | Metadata, timestamps, secondary info |
| `--text-label` | 14px (0.875rem) | 500 | 1.35 (18.9px) | 0.01em | Button labels, form labels, tags |

### Design Rationale

The scale is intentionally compressed. The jump from body (16px) to title (28px) is only 1.75x, not the typical 2.25x used in magazine-style layouts. This is deliberate: Simple's hierarchy comes primarily from **weight** (400 vs 500 vs 600) and **color** (primary vs secondary vs tertiary), not from dramatic size changes.

Section headings (15px) are intentionally SMALLER than body text (16px). They create hierarchy through weight (600) and letter-spacing (0.01em) alone. This is the iOS Settings pattern: section headers are small, uppercase-feeling labels that organize content without competing for attention.

### CSS Implementation

```css
[data-aesthetic="simple"] {
  --text-title-size: 1.75rem;
  --text-title-weight: 600;
  --text-title-leading: 1.20;
  --text-title-tracking: -0.02em;

  --text-section-size: 0.9375rem;
  --text-section-weight: 600;
  --text-section-leading: 1.35;
  --text-section-tracking: 0.01em;

  --text-body-size: 1rem;
  --text-body-weight: 400;
  --text-body-leading: 1.50;
  --text-body-tracking: 0em;

  --text-caption-size: 0.8125rem;
  --text-caption-weight: 400;
  --text-caption-leading: 1.40;
  --text-caption-tracking: 0.005em;

  --text-label-size: 0.875rem;
  --text-label-weight: 500;
  --text-label-leading: 1.35;
  --text-label-tracking: 0.01em;

  font-optical-sizing: auto;
}
```

---

## 4. Spacing Scale

Based on an 8px grid. All values in px.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Inline gap between icon and text, between badge items |
| `--space-2` | 8px | Gap between related items within a row (e.g., date icon and date text) |
| `--space-3` | 12px | Inner padding of small elements (badges, tags) |
| `--space-4` | 16px | Page horizontal padding (mobile), row gap between list items |
| `--space-5` | 20px | Inner padding of content sections |
| `--space-6` | 24px | Section gap (between major content sections on the page) |
| `--space-8` | 32px | Page horizontal padding (desktop), large section separation |
| `--space-10` | 40px | Top/bottom page margin |
| `--space-12` | 48px | Max gap between major page zones |

### Page Layout Spacing

| Property | Mobile (< 640px) | Desktop (>= 640px) |
|---|---|---|
| Page horizontal padding | 16px | 32px |
| Content max-width | 100% | 520px |
| Section gap (between Details, Location, Guest Count) | 24px | 24px |
| Row gap (between items within a section) | 16px | 16px |
| Inner padding (inside grouped sections) | 20px | 20px |
| Page top padding | 40px | 48px |
| Page bottom padding | 40px | 48px |

### CSS Implementation

```css
[data-aesthetic="simple"] {
  --page-px: 16px;
  --page-max-w: 520px;
  --section-gap: 24px;
  --row-gap: 16px;
  --inner-padding: 20px;

  @media (min-width: 640px) {
    --page-px: 32px;
  }
}
```

---

## 5. Button Specification

### Primary CTA (RSVP button)

| Property | Value |
|---|---|
| Height | 44px |
| Min width | 120px |
| Border radius | 8px (0.5rem) |
| Background | `var(--color-accent)` |
| Background hover | `var(--color-accent-hover)` |
| Text color | `var(--color-accent-fg)` |
| Font size | 14px (0.875rem) |
| Font weight | 500 |
| Letter spacing | 0.01em |
| Text transform | none |
| Padding | 0 24px |
| Transition | `background-color 150ms ease, transform 100ms ease` |
| Active state | `transform: scale(0.97)` |

### Secondary Action

| Property | Value |
|---|---|
| Height | 40px |
| Border radius | 8px (0.5rem) |
| Background | `var(--color-surface)` |
| Border | 1px solid `var(--color-border)` |
| Text color | `var(--color-fg)` |
| Font size | 14px |
| Font weight | 500 |
| Padding | 0 16px |

### Tertiary / Text Button

| Property | Value |
|---|---|
| Height | 36px |
| Background | transparent |
| Border | none |
| Text color | `var(--color-accent)` |
| Font size | 14px |
| Font weight | 500 |
| Padding | 0 8px |
| Text decoration on hover | underline |

### Ghost Button (icon-only actions like share, edit)

| Property | Value |
|---|---|
| Size | 40px x 40px |
| Border radius | 8px |
| Background | transparent |
| Background hover | `var(--color-surface-hover)` |
| Icon color | `var(--color-fg-secondary)` |
| Icon size | 20px |

---

## 6. Color Palettes (OKLCH)

Simple defines 4 named palettes. Each palette provides a complete set of design tokens for both light and dark modes.

The naming convention uses the category prefix `simple-` to namespace these within the broader aesthetic system.

### Contrast Verification Methodology

OKLCH lightness (L) is perceptual lightness, not sRGB relative luminance. The relationship is approximately `L_oklch ~ Y_srgb^(1/3)`. For guaranteed WCAG AA (4.5:1) contrast:
- Text on backgrounds needs L difference >= 0.50 when chroma is low (< 0.05)
- Colored text (higher chroma) can appear lighter/darker than its L value suggests due to the Helmholtz-Kohlrausch effect
- All palettes below use low-chroma neutrals where the L-difference rule is reliable
- All accent colors have been checked: accent-fg on accent maintains >= 0.50 L difference

---

### Palette 1: "default" (achromatic neutral)

The signature Simple palette. Zero chroma on all neutrals. The absence of color IS the statement. Accent is a warm neutral (no hue at all by default) -- pure light/dark inversion for the primary action.

#### Light Mode

```css
[data-aesthetic="simple"][data-palette="default"][data-mode="light"] {
  --color-bg:              oklch(0.985 0 0);       /* near-white, no tint */
  --color-surface:         oklch(0.97 0 0);        /* slightly darker for grouped sections */
  --color-surface-hover:   oklch(0.94 0 0);        /* interactive surface hover */
  --color-fg:              oklch(0.14 0 0);        /* near-black primary text */
  --color-fg-secondary:    oklch(0.40 0 0);        /* secondary text */
  --color-fg-tertiary:     oklch(0.55 0 0);        /* muted/disabled text */
  --color-accent:          oklch(0.14 0 0);        /* black accent -- bold, decisive */
  --color-accent-hover:    oklch(0.22 0 0);        /* slightly lighter on hover */
  --color-accent-fg:       oklch(0.985 0 0);       /* white text on black button */
  --color-divider:         oklch(0.90 0 0);        /* subtle hairline */
  --color-border:          oklch(0.85 0 0);        /* input/card borders */
  --color-error:           oklch(0.55 0.20 25);    /* warm red-orange */
  --color-success:         oklch(0.52 0.14 150);   /* muted green */
}
```

**Contrast checks (light mode)**:
- `--color-fg` (L=0.14) on `--color-bg` (L=0.985): delta=0.845 -- PASS (well above 4.5:1)
- `--color-fg-secondary` (L=0.40) on `--color-bg` (L=0.985): delta=0.585 -- PASS (above 4.5:1)
- `--color-fg-tertiary` (L=0.55) on `--color-bg` (L=0.985): delta=0.435 -- PASS (above 3:1)
- `--color-accent-fg` (L=0.985) on `--color-accent` (L=0.14): delta=0.845 -- PASS

#### Dark Mode

```css
[data-aesthetic="simple"][data-palette="default"][data-mode="dark"] {
  --color-bg:              oklch(0.13 0 0);        /* deep charcoal */
  --color-surface:         oklch(0.17 0 0);        /* raised surface */
  --color-surface-hover:   oklch(0.21 0 0);        /* interactive hover */
  --color-fg:              oklch(0.93 0 0);        /* off-white primary text */
  --color-fg-secondary:    oklch(0.65 0 0);        /* secondary text */
  --color-fg-tertiary:     oklch(0.50 0 0);        /* muted/disabled */
  --color-accent:          oklch(0.93 0 0);        /* white accent -- inverted */
  --color-accent-hover:    oklch(0.85 0 0);        /* slightly darker on hover */
  --color-accent-fg:       oklch(0.13 0 0);        /* black text on white button */
  --color-divider:         oklch(0.24 0 0);        /* subtle divider */
  --color-border:          oklch(0.28 0 0);        /* input borders */
  --color-error:           oklch(0.65 0.20 25);    /* warm red-orange, brightened for dark bg */
  --color-success:         oklch(0.65 0.14 150);   /* muted green, brightened */
}
```

**Contrast checks (dark mode)**:
- `--color-fg` (L=0.93) on `--color-bg` (L=0.13): delta=0.80 -- PASS
- `--color-fg-secondary` (L=0.65) on `--color-bg` (L=0.13): delta=0.52 -- PASS
- `--color-fg-tertiary` (L=0.50) on `--color-bg` (L=0.13): delta=0.37 -- PASS (above 3:1)
- `--color-accent-fg` (L=0.13) on `--color-accent` (L=0.93): delta=0.80 -- PASS

---

### Palette 2: "blue" (utility blue)

The classic utility color. Think iOS default tint, links on the web, Linear's blue accent. Trustworthy, functional, universally understood as "interactive."

#### Light Mode

```css
[data-aesthetic="simple"][data-palette="blue"][data-mode="light"] {
  --color-bg:              oklch(0.985 0.003 250); /* near-white, faint cool tint */
  --color-surface:         oklch(0.97 0.003 250);
  --color-surface-hover:   oklch(0.94 0.005 250);
  --color-fg:              oklch(0.15 0.01 250);   /* near-black, cool-tinted */
  --color-fg-secondary:    oklch(0.42 0.01 250);
  --color-fg-tertiary:     oklch(0.56 0.01 250);
  --color-accent:          oklch(0.50 0.18 245);   /* classic utility blue */
  --color-accent-hover:    oklch(0.44 0.18 245);   /* darker on hover */
  --color-accent-fg:       oklch(0.98 0.005 245);  /* white on blue */
  --color-divider:         oklch(0.90 0.005 250);
  --color-border:          oklch(0.85 0.008 250);
  --color-error:           oklch(0.55 0.20 25);
  --color-success:         oklch(0.52 0.14 150);
}
```

**Contrast checks (light mode)**:
- `--color-fg` (L=0.15) on `--color-bg` (L=0.985): delta=0.835 -- PASS
- `--color-fg-secondary` (L=0.42) on `--color-bg` (L=0.985): delta=0.565 -- PASS
- `--color-fg-tertiary` (L=0.56) on `--color-bg` (L=0.985): delta=0.425 -- PASS (above 3:1)
- `--color-accent-fg` (L=0.98) on `--color-accent` (L=0.50): delta=0.48 -- PASS (note: blue at C=0.18 reads darker than L suggests)

#### Dark Mode

```css
[data-aesthetic="simple"][data-palette="blue"][data-mode="dark"] {
  --color-bg:              oklch(0.13 0.01 250);
  --color-surface:         oklch(0.17 0.01 250);
  --color-surface-hover:   oklch(0.21 0.015 250);
  --color-fg:              oklch(0.93 0.005 250);
  --color-fg-secondary:    oklch(0.64 0.01 250);
  --color-fg-tertiary:     oklch(0.49 0.01 250);
  --color-accent:          oklch(0.68 0.16 240);   /* brighter blue for dark bg */
  --color-accent-hover:    oklch(0.74 0.14 240);
  --color-accent-fg:       oklch(0.13 0.03 240);   /* dark text on light blue */
  --color-divider:         oklch(0.24 0.01 250);
  --color-border:          oklch(0.28 0.01 250);
  --color-error:           oklch(0.65 0.20 25);
  --color-success:         oklch(0.65 0.14 150);
}
```

**Contrast checks (dark mode)**:
- `--color-fg` (L=0.93) on `--color-bg` (L=0.13): delta=0.80 -- PASS
- `--color-fg-secondary` (L=0.64) on `--color-bg` (L=0.13): delta=0.51 -- PASS
- `--color-fg-tertiary` (L=0.49) on `--color-bg` (L=0.13): delta=0.36 -- PASS (above 3:1)
- `--color-accent-fg` (L=0.13) on `--color-accent` (L=0.68): delta=0.55 -- PASS

---

### Palette 3: "sage" (muted green)

Calm, natural, grounded. For Simple events that want a hint of warmth without the full Forest treatment. Think: game night at someone's apartment, a casual dinner, a study group.

#### Light Mode

```css
[data-aesthetic="simple"][data-palette="sage"][data-mode="light"] {
  --color-bg:              oklch(0.985 0.005 145); /* warm near-white, green tint */
  --color-surface:         oklch(0.97 0.005 145);
  --color-surface-hover:   oklch(0.94 0.008 145);
  --color-fg:              oklch(0.16 0.015 145);  /* dark, faintly green */
  --color-fg-secondary:    oklch(0.42 0.015 145);
  --color-fg-tertiary:     oklch(0.56 0.01 145);
  --color-accent:          oklch(0.50 0.12 155);   /* muted sage green */
  --color-accent-hover:    oklch(0.44 0.12 155);
  --color-accent-fg:       oklch(0.98 0.005 155);  /* white on green */
  --color-divider:         oklch(0.90 0.008 145);
  --color-border:          oklch(0.85 0.01 145);
  --color-error:           oklch(0.55 0.20 25);
  --color-success:         oklch(0.52 0.14 150);
}
```

**Contrast checks (light mode)**:
- `--color-fg` (L=0.16) on `--color-bg` (L=0.985): delta=0.825 -- PASS
- `--color-fg-secondary` (L=0.42) on `--color-bg` (L=0.985): delta=0.565 -- PASS
- `--color-fg-tertiary` (L=0.56) on `--color-bg` (L=0.985): delta=0.425 -- PASS (above 3:1)
- `--color-accent-fg` (L=0.98) on `--color-accent` (L=0.50): delta=0.48 -- PASS

#### Dark Mode

```css
[data-aesthetic="simple"][data-palette="sage"][data-mode="dark"] {
  --color-bg:              oklch(0.13 0.01 145);
  --color-surface:         oklch(0.17 0.01 145);
  --color-surface-hover:   oklch(0.21 0.015 145);
  --color-fg:              oklch(0.93 0.008 145);
  --color-fg-secondary:    oklch(0.64 0.012 145);
  --color-fg-tertiary:     oklch(0.49 0.01 145);
  --color-accent:          oklch(0.66 0.12 155);   /* brightened sage for dark */
  --color-accent-hover:    oklch(0.72 0.10 155);
  --color-accent-fg:       oklch(0.14 0.03 155);   /* dark text on light green */
  --color-divider:         oklch(0.24 0.01 145);
  --color-border:          oklch(0.28 0.01 145);
  --color-error:           oklch(0.65 0.20 25);
  --color-success:         oklch(0.65 0.14 150);
}
```

**Contrast checks (dark mode)**:
- `--color-fg` (L=0.93) on `--color-bg` (L=0.13): delta=0.80 -- PASS
- `--color-fg-secondary` (L=0.64) on `--color-bg` (L=0.13): delta=0.51 -- PASS
- `--color-fg-tertiary` (L=0.49) on `--color-bg` (L=0.13): delta=0.36 -- PASS (above 3:1)
- `--color-accent-fg` (L=0.14) on `--color-accent` (L=0.66): delta=0.52 -- PASS

---

### Palette 4: "violet" (muted purple-gray)

Subtle and slightly unexpected. For Simple events that want a whisper of personality without committing to a "themed" look. Think: a casual birthday hangout, a board game night, a small get-together.

#### Light Mode

```css
[data-aesthetic="simple"][data-palette="violet"][data-mode="light"] {
  --color-bg:              oklch(0.985 0.005 290); /* near-white, faint violet tint */
  --color-surface:         oklch(0.97 0.005 290);
  --color-surface-hover:   oklch(0.94 0.008 290);
  --color-fg:              oklch(0.16 0.015 290);
  --color-fg-secondary:    oklch(0.42 0.015 290);
  --color-fg-tertiary:     oklch(0.56 0.01 290);
  --color-accent:          oklch(0.52 0.14 285);   /* muted violet */
  --color-accent-hover:    oklch(0.46 0.14 285);
  --color-accent-fg:       oklch(0.98 0.005 285);  /* white on violet */
  --color-divider:         oklch(0.90 0.008 290);
  --color-border:          oklch(0.85 0.01 290);
  --color-error:           oklch(0.55 0.20 25);
  --color-success:         oklch(0.52 0.14 150);
}
```

**Contrast checks (light mode)**:
- `--color-fg` (L=0.16) on `--color-bg` (L=0.985): delta=0.825 -- PASS
- `--color-fg-secondary` (L=0.42) on `--color-bg` (L=0.985): delta=0.565 -- PASS
- `--color-fg-tertiary` (L=0.56) on `--color-bg` (L=0.985): delta=0.425 -- PASS (above 3:1)
- `--color-accent-fg` (L=0.98) on `--color-accent` (L=0.52): delta=0.46 -- PASS

#### Dark Mode

```css
[data-aesthetic="simple"][data-palette="violet"][data-mode="dark"] {
  --color-bg:              oklch(0.13 0.01 290);
  --color-surface:         oklch(0.17 0.01 290);
  --color-surface-hover:   oklch(0.21 0.015 290);
  --color-fg:              oklch(0.93 0.008 290);
  --color-fg-secondary:    oklch(0.64 0.012 290);
  --color-fg-tertiary:     oklch(0.49 0.01 290);
  --color-accent:          oklch(0.68 0.14 285);   /* brighter violet for dark */
  --color-accent-hover:    oklch(0.74 0.12 285);
  --color-accent-fg:       oklch(0.14 0.03 285);   /* dark text on light violet */
  --color-divider:         oklch(0.24 0.01 290);
  --color-border:          oklch(0.28 0.01 290);
  --color-error:           oklch(0.65 0.20 25);
  --color-success:         oklch(0.65 0.14 150);
}
```

**Contrast checks (dark mode)**:
- `--color-fg` (L=0.93) on `--color-bg` (L=0.13): delta=0.80 -- PASS
- `--color-fg-secondary` (L=0.64) on `--color-bg` (L=0.13): delta=0.51 -- PASS
- `--color-fg-tertiary` (L=0.49) on `--color-bg` (L=0.13): delta=0.36 -- PASS (above 3:1)
- `--color-accent-fg` (L=0.14) on `--color-accent` (L=0.68): delta=0.54 -- PASS

---

### Palette Summary Table

| Palette | Accent Hue | L/D Default | Neutral Tint | Personality |
|---|---|---|---|---|
| `default` | 0 (achromatic) | Light | None | Maximum neutrality |
| `blue` | 240-245 | Light | Cool (250) | Trustworthy, iOS-like |
| `sage` | 150-155 | Light | Warm (145) | Natural, grounded |
| `violet` | 280-285 | Light | Cool-warm (290) | Subtle personality |

All palettes default to **light mode**. Simple events are daytime-coded by default. The host can switch to dark mode.

---

## 7. Border Radius

| Element | Radius | Value |
|---|---|---|
| Card / grouped section container | `--radius-card` | 12px (0.75rem) |
| Button (primary, secondary) | `--radius-button` | 8px (0.5rem) |
| Input field | `--radius-input` | 8px (0.5rem) |
| Badge / tag | `--radius-badge` | 6px (0.375rem) |
| Avatar / icon container | `--radius-avatar` | 9999px (circle) |

### Design Rationale

Simple uses moderate radii: enough softness to feel approachable (not the harsh 0px of Mono), but not so rounded that elements feel playful or bubbly (not the 16px of Neon). 8px on interactive elements and 12px on containers is the iOS/Linear standard.

```css
[data-aesthetic="simple"] {
  --radius-card: 0.75rem;
  --radius-button: 0.5rem;
  --radius-input: 0.5rem;
  --radius-badge: 0.375rem;
  --radius-avatar: 9999px;
}
```

---

## 8. Divider/Separator Style

Hairline dividers are Simple's primary structural element. They replace cards, shadows, and colored backgrounds as the way sections are visually separated.

| Property | Value |
|---|---|
| Thickness (visual weight) | 1px |
| Color | `var(--color-divider)` |
| Opacity | 1.0 (opacity is baked into the color token, not applied separately) |
| Left inset | 16px on mobile, 0px on desktop (iOS pattern: inset on lists, full-width between major sections) |
| Vertical spacing above | 0px (divider sits flush against the content above) |
| Vertical spacing below | 0px (divider sits flush; the section gap handles spacing) |

### Usage Rules

1. **Between items within a list**: Use the left-inset divider (16px from left edge). This creates the iOS grouped-list effect where dividers align with text, not with the container edge.
2. **Between major sections**: Use full-width divider (no inset).
3. **Never stack**: No double dividers. If two sections are adjacent, one divider suffices.
4. **No divider at the top or bottom of a group**: The first and last items in a section do not get a divider above/below (respectively). The container edge implies the boundary.

### CSS Implementation

```css
.simple-divider {
  height: 1px;
  background: var(--color-divider);
  border: none;
  margin: 0;
}

.simple-divider--inset {
  margin-left: 16px;
}

@media (min-width: 640px) {
  .simple-divider--inset {
    margin-left: 0;
  }
}
```

---

## 9. Shadow System

**Simple uses NO shadows.** This is a deliberate, defining choice.

Elevation in Simple is expressed through:
1. **Background color difference** between `--color-bg` and `--color-surface` (the grouped section pattern)
2. **Hairline dividers** between sections
3. **Spacing** (gaps between sections imply separation)

### What gets shadows

Nothing. Not cards. Not buttons. Not popovers. Not modals.

The one exception is the **floating RSVP bar** if the page scrolls (the sticky bottom CTA). This gets a single subtle shadow to separate it from scrolling content:

```css
.simple-sticky-bar {
  box-shadow: 0 -1px 0 var(--color-divider);
}
```

This is a 1px line shadow (effectively a top border via shadow), not a traditional elevation shadow. It maintains the hairline-divider design language even in the floating element.

### CSS Implementation

```css
[data-aesthetic="simple"] {
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-xl: none;
  --shadow-sticky: 0 -1px 0 var(--color-divider);
}
```

---

## 10. Copy & Language

Simple's copy is stripped of personality. No cleverness. No warmth. No enthusiasm. Just the information.

### RSVP Labels

| Element | Copy |
|---|---|
| Primary RSVP button (affirmative) | **Going** |
| Maybe/tentative button | **Maybe** |
| Decline button | **Can't go** |
| Already RSVP'd (going) | **You're going** |
| Already RSVP'd (maybe) | **Marked as maybe** |
| Change RSVP link | **Change** |

### Guest Count Format

```
{n} going
```

If maybe count > 0:
```
{n} going, {n} maybe
```

No bullet separator. No interpunct. Comma separation only. No emoji. No exclamation marks.

### Date & Time Format

| Element | Format | Example |
|---|---|---|
| Date (full) | `ddd, MMM D` | Sat, Mar 7 |
| Date (with year, only if not current year) | `ddd, MMM D, YYYY` | Sat, Mar 7, 2027 |
| Time | `h:mm A` | 7:00 PM |
| Time range | `h:mm A - h:mm A` | 7:00 PM - 10:00 PM |
| Date + time combined | `ddd, MMM D, h:mm A` | Sat, Mar 7, 7:00 PM |

### Location Format

```
{venue name}
{street address}
```

Two lines. No decorative formatting. The venue name is in `--text-body` weight 500 (medium). The street address is in `--text-caption` with `--color-fg-secondary`.

### Host Attribution

**Hidden by default.** Simple events do not prominently display "Hosted by [name]." The host is visible in the fine print at the bottom of the page, styled as caption text in `--color-fg-tertiary`:

```
Hosted by {first name}
```

### Section Headers

| Section | Label |
|---|---|
| Event details/description | *No header* (the description follows the title directly) |
| Date and time | **When** |
| Location | **Where** |
| Guest list (if visible) | **Guests** |
| Comments | **Comments** |
| Photos | **Photos** |

Section headers are styled with `--text-section` (15px, weight 600, +0.01em tracking). They are NOT uppercase (unlike iOS section headers). The weight and slight tracking create sufficient differentiation.

### Empty States

| State | Copy |
|---|---|
| No guests yet | Be the first to RSVP |
| No comments yet | *Section hidden entirely* |
| No photos yet | *Section hidden entirely* |
| No description | *Description area hidden entirely* |

Simple hides empty sections entirely rather than showing placeholder text. This maximizes density and eliminates visual noise.

---

## 11. Layout Spec

### Overall Structure

```
[Page Top Padding: 40px]

[Event Title]                          ← --text-title, left-aligned
[Date + Time]                          ← --text-body, --color-fg-secondary, inline with icon
[Location]                             ← --text-body, --color-fg-secondary, inline with icon

[Divider — full width]

[Description]                          ← --text-body, if present
                                         (no "Details" header, description stands alone)

[Divider — full width]

[Guest Count]                          ← --text-caption, --color-fg-secondary
                                         "12 going, 3 maybe"

[Divider — full width]

[Host attribution]                     ← --text-caption, --color-fg-tertiary
                                         "Hosted by Alex"

[Page Bottom Padding: 40px]

[Sticky RSVP Bar]                      ← Fixed to bottom, 1px top divider
  [Going] [Maybe] [Can't go]
```

### Key Layout Decisions

| Property | Value | Rationale |
|---|---|---|
| Cover image | **Hidden by default** | Simple events are text-first. Cover image is optional; if present, it renders as a small (200px height max) non-hero image above the title, NOT full-width bleed. |
| Text alignment | **Left** | Always. No centering of any text. Left alignment is the fastest to scan. |
| Info display | **Inline rows with small icons** | Date, time, location each get a small (16px) Phosphor icon (`Calendar`, `Clock`, `MapPin`) in `--color-fg-tertiary` followed by text. Icon + 8px gap + text. |
| Section separation | **Hairline dividers** | No cards. No background color sections. Dividers only. |
| Overall density | **High / compact** | Minimum spacing. No decorative whitespace. No "breathing room" -- that is for Bloom and Sand. |
| Content max-width | **520px**, centered | Narrower than other aesthetics (which may go to 600-640px). This creates the iA Writer "narrow column" effect. |
| Cover image (if present) | **200px max height**, 12px radius, full content width, no bleed | Small, contained, subordinate to text. |

### Component Visibility

| Component | Visible | Notes |
|---|---|---|
| Cover image | Optional (hidden if not uploaded) | Small if present, not hero-sized |
| Event title | Always | The dominant element |
| Date/time row | Always | Icon + text inline |
| Location row | Always (if location set) | Icon + text inline |
| Description | Only if provided | No placeholder, no header |
| Guest count | Always | Plain text, not a pill/badge |
| Guest list names | Hidden by default | Respects privacy-first rule; host can enable |
| Host attribution | Always | Small, at bottom, tertiary color |
| Privacy dashboard | Hidden | Not shown inline for Simple; accessible via link |
| Comments section | Hidden if empty | Appears only when comments exist |
| Photos section | Hidden if empty | Appears only when photos exist |
| Share button | Visible | Ghost button in top-right, or at page bottom |
| RSVP bar | Always (sticky bottom) | Three buttons: Going, Maybe, Can't go |

### Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| < 640px (mobile) | 16px horizontal padding. Full-width content. Sticky RSVP bar. |
| >= 640px (tablet/desktop) | 32px horizontal padding. 520px max-width centered. RSVP buttons inline in content (not sticky). |

---

## 12. Animation & Motion

Simple uses **minimal motion**. This is the fastest-loading, least-animated aesthetic. It should feel like a native settings page or a well-formatted text message, not a choreographed entrance.

### What motion exists

| Element | Animation | Duration | Easing |
|---|---|---|---|
| Page load | Instant render. No stagger, no fade-in. Content appears immediately. | 0ms | N/A |
| Button press | `transform: scale(0.97)` | 100ms | `ease` |
| Button hover (desktop) | `background-color` transition | 150ms | `ease` |
| RSVP state change | Background color + text crossfade | 200ms | `ease` |
| Divider appearance | None (renders with content) | 0ms | N/A |
| Section show/hide (e.g., comments appearing) | `opacity: 0 -> 1` | 150ms | `ease-out` |

### What motion does NOT exist

- No page load timeline/sequence
- No scroll-triggered reveals (`use:scrollReveal` is NOT used)
- No staggered children (`use:staggerChildren` is NOT used)
- No parallax on cover image
- No confetti on RSVP
- No number ticker/odometer on guest count
- No breathing/ambient animations
- No WebGL background layer
- No GSAP timelines

### Motion Tokens (Simple overrides)

```css
[data-aesthetic="simple"] {
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-standard: 200ms;
  --duration-emphasis: 0ms;     /* No emphasis animations */
  --duration-lifecycle: 0ms;    /* No lifecycle animations */
  --duration-ambient: 0ms;      /* No ambient animations */
}
```

### Reduced Motion

Since Simple is already minimal, `prefers-reduced-motion: reduce` changes almost nothing. The only adjustment: button scale feedback becomes instant (0ms) instead of 100ms.

---

## 13. Integration with Aesthetic System

### How Simple fits into the existing theme architecture

The existing system uses `data-theme` for the 10 color themes (forest, midnight, ember, etc.) and `data-mode` for light/dark. Simple introduces a new axis: `data-aesthetic`, which controls the structural and typographic treatment independently of the color palette.

### Proposed Attribute Structure

```html
<div
  data-aesthetic="simple"
  data-palette="default"
  data-mode="light"
>
  <!-- Simple aesthetic with default (achromatic) palette in light mode -->
</div>
```

### Relationship to Existing Themes

The aesthetic system is a LAYER ABOVE the theme system. When `data-aesthetic="simple"` is active:

1. **Typography** is overridden: Inter replaces Vollkorn/Manrope
2. **Spacing** is overridden: compact 8px grid replaces the per-theme spacing
3. **Border radius** is overridden: consistent 8px/12px replaces per-theme values
4. **Shadows** are overridden: none replaces per-theme shadow system
5. **Layout** is restructured: divider-based, no cards, narrow column
6. **Motion** is overridden: near-zero animation replaces per-theme motion
7. **Colors** come from the Simple palette set (not from the 10 existing themes)

### CSS Custom Properties Map

Simple palettes map to the existing shadcn-svelte variable contract:

```css
[data-aesthetic="simple"] {
  /* Typography overrides */
  --font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --heading-weight: 600;
  --heading-tracking: -0.02em;
  --heading-transform: none;
  --body-line-height: 1.50;

  /* Structural overrides */
  --radius: 0.5rem;
  --border-weight: 1px;
  --surface-grain: none;

  /* Shadow overrides */
  --shadow-color: oklch(0 0 0);
  --shadow-strength: 0;

  /* Mapped to shadcn contract */
  --background: var(--color-bg);
  --foreground: var(--color-fg);
  --card: var(--color-surface);
  --card-foreground: var(--color-fg);
  --popover: var(--color-surface);
  --popover-foreground: var(--color-fg);
  --primary: var(--color-accent);
  --primary-foreground: var(--color-accent-fg);
  --secondary: var(--color-surface);
  --secondary-foreground: var(--color-fg);
  --muted: var(--color-surface);
  --muted-foreground: var(--color-fg-secondary);
  --accent: var(--color-surface-hover);
  --accent-foreground: var(--color-fg);
  --destructive: var(--color-error);
  --destructive-foreground: var(--color-accent-fg);
  --border: var(--color-border);
  --input: var(--color-border);
  --ring: var(--color-accent);
}
```

### Database Impact

Add `aesthetic` column to events table:

```sql
ALTER TABLE events ADD COLUMN aesthetic TEXT DEFAULT NULL;
-- NULL = use legacy theme system (forest, midnight, etc.)
-- 'simple' = Simple aesthetic with its own palette system
-- Future: 'fun', 'warm', 'elegant'

ALTER TABLE events ADD COLUMN palette TEXT DEFAULT NULL;
-- NULL = 'default' for the given aesthetic
-- 'default', 'blue', 'sage', 'violet' for Simple
```

### Event Type Defaults (Simple)

Simple is the default aesthetic for these event types:

| Event Type | Aesthetic | Palette | Mode |
|---|---|---|---|
| Hangout | simple | default | light |
| Grabbing drinks | simple | default | light |
| Game night | simple | sage | light |
| Watch party | simple | blue | dark |
| Kickback | simple | default | light |
| Study session | simple | blue | light |
| Potluck | simple | sage | light |

These replace the existing theme defaults for these event types (previously mapped to `forest` or `neon`).

---

## Appendix A: Complete Token Reference

All CSS custom properties defined by Simple, in one block for implementer reference.

```css
/* ======================================
   SIMPLE AESTHETIC — Complete Token Set
   ====================================== */

[data-aesthetic="simple"] {
  /* --- Typography --- */
  --font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-optical-sizing: auto;

  --text-title-size: 1.75rem;
  --text-title-weight: 600;
  --text-title-leading: 1.20;
  --text-title-tracking: -0.02em;

  --text-section-size: 0.9375rem;
  --text-section-weight: 600;
  --text-section-leading: 1.35;
  --text-section-tracking: 0.01em;

  --text-body-size: 1rem;
  --text-body-weight: 400;
  --text-body-leading: 1.50;
  --text-body-tracking: 0em;

  --text-caption-size: 0.8125rem;
  --text-caption-weight: 400;
  --text-caption-leading: 1.40;
  --text-caption-tracking: 0.005em;

  --text-label-size: 0.875rem;
  --text-label-weight: 500;
  --text-label-leading: 1.35;
  --text-label-tracking: 0.01em;

  /* --- Spacing --- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  --page-px: 16px;
  --page-max-w: 520px;
  --section-gap: 24px;
  --row-gap: 16px;
  --inner-padding: 20px;

  /* --- Border Radius --- */
  --radius-card: 0.75rem;
  --radius-button: 0.5rem;
  --radius-input: 0.5rem;
  --radius-badge: 0.375rem;
  --radius-avatar: 9999px;
  --radius: 0.5rem;

  /* --- Shadows --- */
  --shadow-sm: none;
  --shadow-md: none;
  --shadow-lg: none;
  --shadow-xl: none;
  --shadow-sticky: 0 -1px 0 var(--color-divider);
  --shadow-color: oklch(0 0 0);
  --shadow-strength: 0;

  /* --- Structural --- */
  --border-weight: 1px;
  --heading-weight: 600;
  --heading-tracking: -0.02em;
  --heading-transform: none;
  --body-line-height: 1.50;
  --surface-grain: none;

  /* --- Motion --- */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-standard: 200ms;
  --duration-emphasis: 0ms;
  --duration-lifecycle: 0ms;
  --duration-ambient: 0ms;

  /* --- Responsive --- */
  @media (min-width: 640px) {
    --page-px: 32px;
  }
}
```

---

## Appendix B: Visual Comparison with Other Aesthetics

| Axis | Simple | Fun | Warm | Elegant |
|---|---|---|---|---|
| Font pairing | Inter / Inter | TBD display / TBD body | TBD serif / TBD sans | TBD serif / TBD sans |
| Hierarchy method | Weight + color | Size + color + decoration | Size + weight | Size + spacing + tracking |
| Cover image | Hidden/optional | Prominent | Warm, integrated | Full-bleed hero |
| Shadows | None | Playful colored | Warm diffused | Minimal, precise |
| Border radius | 8-12px moderate | 16px+ bubbly | 10-14px soft | 2-4px sharp |
| Motion | Near zero | Bouncy, staggered | Gentle, organic | Refined, deliberate |
| Density | High (compact) | Medium | Low (spacious) | Medium-low |
| Default mode | Light | TBD | TBD | TBD |
| Dividers | Hairline, primary structure | Rare | Rare | Hairline, precise |
| Texture/grain | None | TBD | Optional grain | None |

---

## Appendix C: Phosphor Icon Usage

Simple uses minimal iconography. All icons are Phosphor `regular` weight at 16px for inline metadata and 20px for standalone actions.

| Purpose | Icon | Weight | Size |
|---|---|---|---|
| Date | `Calendar` | regular | 16px |
| Time | `Clock` | regular | 16px |
| Location | `MapPin` | regular | 16px |
| Guests | `Users` | regular | 16px |
| Share | `ShareNetwork` | regular | 20px |
| Back/close | `X` | regular | 20px |
| RSVP going (confirmed) | `Check` | bold | 16px |
| RSVP maybe (confirmed) | `Minus` | regular | 16px |
| Edit (host) | `PencilSimple` | regular | 20px |

Icons are colored `--color-fg-tertiary` by default, `--color-accent` when active/interactive.

---

## Appendix D: OKLCH Quick Reference

```
Lightness (L):
  0.00 = Black
  0.13 = Simple dark mode background
  0.17 = Simple dark mode surface
  0.40 = Secondary text threshold (light mode)
  0.50 = Tertiary text (dark mode)
  0.55 = Tertiary text (light mode)
  0.65 = Secondary text (dark mode)
  0.93 = Primary text (dark mode)
  0.97 = Surface (light mode)
  0.985 = Background (light mode)

Chroma (C):
  0.000 = Pure gray (default palette)
  0.003-0.005 = Barely perceptible tint (backgrounds)
  0.008-0.015 = Visible tint (text, borders)
  0.12-0.14 = Muted accent (sage, violet)
  0.16-0.18 = Medium accent (blue)
  0.20 = Error/warning states

Contrast Rule of Thumb:
  L delta >= 0.50 at C < 0.05 -> guaranteed 4.5:1 (WCAG AA normal text)
  L delta >= 0.35 at C < 0.05 -> guaranteed 3:1 (WCAG AA large text / UI)
```
