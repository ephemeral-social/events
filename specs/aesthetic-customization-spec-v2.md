# Ephemeral Events — Aesthetic Customization System v2
## Production Specification for Claude Code

**Version**: 2.0  
**Date**: February 2026  
**Stack**: SvelteKit + Tailwind CSS v4 + shadcn-svelte + Cloudflare Pages  
**Color Space**: OKLCH (native to shadcn v4 and Tailwind v4)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Token System & Variable Contract](#2-token-system--variable-contract)
3. [Light/Dark Mode System](#3-lightdark-mode-system)
4. [Custom Accent Color Picker](#4-custom-accent-color-picker)
5. [Theme Definitions (10 Themes)](#5-theme-definitions)
6. [Typography System](#6-typography-system)
7. [Shadow & Elevation System](#7-shadow--elevation-system)
8. [Theme Picker UX](#8-theme-picker-ux)
9. [Theme-Aware OG Images](#9-theme-aware-og-images)
10. [Accessibility Verification](#10-accessibility-verification)
11. [Database & API](#11-database--api)
12. [File Structure](#12-file-structure)
13. [Implementation Sequence](#13-implementation-sequence)
14. [Success Metrics](#14-success-metrics)

---

## 1. Architecture Overview

### Design Philosophy

Each theme is a *complete micro-design-system*, not just a color swap. Themes differ across seven axes:

| Axis | What Changes | Example Difference |
|------|-------------|-------------------|
| **Neutral palette** | Surface, border, text tones | Warm stone vs cool slate |
| **Default accent** | Primary action color | Forest green vs electric blue |
| **Typography treatment** | Font weights, sizes, letter-spacing, line-height | Bold compressed vs light airy |
| **Border radius** | Corner rounding on all components | 0px sharp vs 1rem soft |
| **Shadow style** | Elevation expression | Crisp drop shadows vs diffused glow |
| **Border style** | Border weight, opacity, presence | Hairline vs none vs 2px solid |
| **Texture/pattern** | Optional CSS background pattern | Grain, noise, linen, none |

### How It Works (Zero-JS Rendering)

```
Guest taps link
  → SSR loads event from D1 (theme + mode + accent fields)
  → Server renders HTML with data-theme="forest" data-mode="dark"
  → CSS custom properties cascade via [data-theme][data-mode] selectors
  → If custom accent: inline style sets --accent-hue override
  → Page renders fully themed on first paint. No FOUC. No JS cost.
```

### Dual-Axis Theming Model

Theming has TWO independent axes:

1. **Theme** (aesthetic personality): forest, midnight, ember, slate, bloom, gilded, neon, dusk, sand, mono
2. **Mode** (surface lightness): `light` or `dark`

This means 10 themes × 2 modes = 20 distinct visual configurations, each with its own complete set of CSS custom properties.

The mode follows the **host's choice** set during event creation (default: dark). Guests cannot toggle mode — the host controls the aesthetic completely.

---

## 2. Token System & Variable Contract

### Required shadcn-svelte Variables (OKLCH format)

Every `[data-theme][data-mode]` combination MUST define ALL of these variables. This is the contract that ensures shadcn components render correctly:

```css
/* === Surface tokens === */
--background:           /* Page/body background */
--foreground:           /* Primary text on background */
--card:                 /* Card/container background */
--card-foreground:      /* Primary text on cards */
--popover:              /* Popover/dropdown background */
--popover-foreground:   /* Text in popovers */

/* === Interactive tokens === */
--primary:              /* Primary button background, key actions */
--primary-foreground:   /* Text on primary buttons */
--secondary:            /* Secondary button/container background */
--secondary-foreground: /* Text on secondary elements */
--muted:                /* Muted container background (disabled states, subtle areas) */
--muted-foreground:     /* Subdued text (captions, timestamps, placeholders) */
--accent:               /* Hover states, active item backgrounds */
--accent-foreground:    /* Text on accent backgrounds */
--destructive:          /* Delete/danger actions */
--destructive-foreground: /* Text on destructive buttons */

/* === Structural tokens === */
--border:               /* Default border color */
--input:                /* Form input borders */
--ring:                 /* Focus ring color */
--radius:               /* Default border-radius */

/* === Chart tokens (for any data viz) === */
--chart-1: through --chart-5:

/* === Ephemeral-custom tokens (beyond shadcn) === */
--shadow-color:         /* Base shadow color for elevation system */
--shadow-strength:      /* Shadow opacity multiplier (higher in light mode) */
--surface-grain:        /* URL or none — optional texture overlay */
--border-weight:        /* 1px or 2px — border thickness preference */
--font-heading:         /* Font-family for headings */
--font-body:            /* Font-family for body/UI */
--heading-weight:       /* Font weight for headings */
--heading-tracking:     /* Letter-spacing for headings */
--heading-transform:    /* text-transform for headings (none/uppercase) */
--body-line-height:     /* Line height for body text */
```

### OKLCH Primer for These Specs

All color values use `oklch(L C H)` where:
- **L** (Lightness): 0 = black, 1 = white. Perceptually uniform.
- **C** (Chroma): 0 = gray, ~0.37 = maximum saturation. Controls vividness.
- **H** (Hue): 0–360 degrees on the color wheel.

Key hue landmarks:
- 0–30: Red/warm
- 30–90: Orange/yellow/gold
- 90–150: Yellow-green/green
- 150–200: Teal/cyan
- 200–270: Blue
- 270–330: Purple/magenta
- 330–360: Pink/rose

**Contrast rule**: For WCAG AA (4.5:1), text and background need ≥0.40 lightness difference when chroma is low. Higher chroma can reduce perceived contrast slightly.

### @theme inline Registration

All custom properties must be registered with Tailwind v4 so utility classes work:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius: var(--radius);
}
```

---

## 3. Light/Dark Mode System

### Mode Architecture

Each theme defines BOTH a light and dark palette. The selector pattern:

```css
/* Dark mode for Forest theme */
[data-theme="forest"][data-mode="dark"] {
  --background: oklch(0.16 0.02 145);
  /* ... all variables ... */
}

/* Light mode for Forest theme */
[data-theme="forest"][data-mode="light"] {
  --background: oklch(0.97 0.01 145);
  /* ... all variables ... */
}
```

### Dark Mode Principles (Applied to Every Theme)

Based on Material Design dark mode guidelines and the research on perceptual contrast:

1. **Never use pure black** (`oklch(0 0 0)`) as background. Use `L: 0.14–0.18` with a slight chroma tint matching the theme's hue.
2. **Elevated surfaces get lighter**: Card surfaces should be L: 0.02–0.05 higher than background.
3. **Accent colors shift lighter**: In dark mode, accent colors need L ≥ 0.60 to be legible on dark surfaces. In light mode, L ≤ 0.55.
4. **Borders use white with low opacity** for dark mode: `oklch(1 0 0 / 10%)`. This creates subtle separation without harsh lines.
5. **Shadows are nearly invisible in dark mode**. Use `--shadow-strength: 0.15` in dark, `--shadow-strength: 0.35` in light.

### Light Mode Principles (Applied to Every Theme)

1. **Background**: L: 0.96–1.0, very low chroma, hue-tinted to match theme warmth.
2. **Foreground text**: L: 0.13–0.20, enough chroma to feel colored rather than pure black.
3. **Cards**: Same or slightly different from background. Use shadow for elevation instead of color.
4. **Accent colors darken**: Shift accent L down to maintain contrast on white surfaces.
5. **Borders use theme-hue gray**: Not pure gray — tint borders with the theme's hue family.

### Mode Default Per Theme

| Theme | Default Mode | Reasoning |
|-------|-------------|-----------|
| Forest | Dark | Warm forest night — the signature Ephemeral feel |
| Midnight | Dark | Nightlife. Light mode Midnight would be paradoxical |
| Ember | Dark | Candlelit warmth reads better dark |
| Slate | Light | Professional contexts often expect light |
| Bloom | Light | Garden parties, bridal showers — fresh, airy |
| Gilded | Dark | Black-tie galas, luxe events |
| Neon | Dark | Neon literally requires dark to glow |
| Dusk | Dark | Twilight, atmospheric |
| Sand | Light | Brunch, daytime wellness gatherings |
| Mono | Dark | Typography-forward, gallery aesthetic |

Host can always override the default.

---

## 4. Custom Accent Color Picker

### How It Works

The accent color is the theme's *action color* — buttons, links, focus rings, highlights. Each theme has a default accent, but hosts can override it.

**Architecture**: A custom accent is stored as an OKLCH hue angle (0–360). The system uses the theme's existing lightness/chroma curves but substitutes the hue, generating a full accent palette programmatically.

```typescript
// When a custom accent hue is set, override these variables:
function applyCustomAccent(hue: number, mode: 'light' | 'dark') {
  // The L and C values come from the theme's own accent curve
  // Only H changes. This preserves the theme's contrast guarantees.
  const accents = mode === 'dark' ? {
    primary:            `oklch(0.65 0.18 ${hue})`,
    primaryForeground:  `oklch(0.15 0.03 ${hue})`,
    ring:               `oklch(0.55 0.15 ${hue})`,
    // chart colors shift proportionally
  } : {
    primary:            `oklch(0.48 0.20 ${hue})`,
    primaryForeground:  `oklch(0.98 0.01 ${hue})`,
    ring:               `oklch(0.55 0.18 ${hue})`,
  };
  return accents;
}
```

**Server-side application** (no JS required on client):

```svelte
<!-- +page.svelte -->
<div
  class="event-page"
  data-theme={data.event.theme}
  data-mode={data.event.mode}
  style={data.event.accent_hue
    ? `--primary: oklch(${mode === 'dark' ? '0.65 0.18' : '0.48 0.20'} ${data.event.accent_hue}); --ring: oklch(0.55 0.15 ${data.event.accent_hue});`
    : ''}
>
```

### Picker UX

**Location**: Below the theme grid in the event creation form.

**Design**: A row of 10 curated accent swatches + a hex input field.

**Preset accent swatches** (hue angles that work across all themes):

| Swatch | Name | OKLCH Hue | Hex Approximation |
|--------|------|-----------|-------------------|
| 🔴 | Rose | 12 | ~#E05555 |
| 🟠 | Tangerine | 45 | ~#D47B2E |
| 🟡 | Gold | 85 | ~#B59A20 |
| 🟢 | Forest | 150 | ~#3B9B6A |
| 🔵 | Teal | 185 | ~#2E94A8 |
| 💙 | Azure | 245 | ~#4875E0 |
| 💜 | Violet | 290 | ~#7B55D4 |
| 🩷 | Orchid | 325 | ~#C455A8 |
| ⬛ | Default | — | Uses theme default |

**Hex input**: When host enters a hex code, convert to OKLCH and extract the hue angle. Store only the hue. The system generates the full palette.

```typescript
// Hex to OKLCH hue extraction (use culori library)
import { oklch, parse } from 'culori';

function hexToAccentHue(hex: string): number {
  const color = oklch(parse(hex));
  return color?.h ?? 150; // fallback to forest green
}
```

**Contrast safety**: The system owns L and C values, so the host can only change hue. This means contrast ratios are guaranteed by the theme, not by user choice. No accessibility failures possible from custom accents.

### Database Storage

```sql
ALTER TABLE events ADD COLUMN accent_hue REAL; -- NULL = use theme default, 0-360 = custom hue angle
```

---

## 5. Theme Definitions

### Theme 1: FOREST (Default)

**Personality**: Warm, grounded, nature-rooted. The Ephemeral signature. Think forest floor at golden hour — dappled light through canopy, moss on stone, rich earth.

**Best for**: Casual hangouts, dinner parties, outdoor gatherings, friendsgivings, game nights

**Neutral base hue**: 145 (green-shifted warm)
**Default accent hue**: 150 (forest green, the Ephemeral brand color)

#### Typography Treatment
- **Headings**: Vollkorn Variable, weight 600, normal tracking (0em), no transform
- **Body**: Manrope Variable, weight 400, line-height 1.65
- **Character**: Organic serif headlines feel literary and warm. The slightly generous body line-height creates breathing room.

#### Structural Properties
- `--radius`: `0.625rem` (10px — soft but not bubbly)
- `--border-weight`: `1px`
- `--heading-weight`: `600`
- `--heading-tracking`: `0em`
- `--heading-transform`: `none`
- `--body-line-height`: `1.65`
- `--surface-grain`: `url('/textures/grain-warm.svg')` (subtle organic noise, 3% opacity)

#### Shadow Style
Warm diffused shadows. In dark mode, minimal — rely on surface color shifts. In light mode, warm-tinted soft shadows.
```css
/* Dark mode shadow */
--shadow-color: oklch(0.05 0.02 145);
--shadow-strength: 0.15;

/* Light mode shadow */
--shadow-color: oklch(0.40 0.03 145);
--shadow-strength: 0.30;
```

#### Color Tokens — Dark Mode
```css
[data-theme="forest"][data-mode="dark"] {
  /* Surfaces — dark mossy green-tinted */
  --background:           oklch(0.16 0.02 145);
  --foreground:           oklch(0.93 0.01 90);
  --card:                 oklch(0.19 0.02 145);
  --card-foreground:      oklch(0.93 0.01 90);
  --popover:              oklch(0.22 0.02 145);
  --popover-foreground:   oklch(0.93 0.01 90);

  /* Interactive — forest green accent */
  --primary:              oklch(0.65 0.17 150);
  --primary-foreground:   oklch(0.15 0.03 150);
  --secondary:            oklch(0.24 0.02 145);
  --secondary-foreground: oklch(0.90 0.01 90);
  --muted:                oklch(0.24 0.02 145);
  --muted-foreground:     oklch(0.65 0.03 90);
  --accent:               oklch(0.28 0.03 145);
  --accent-foreground:    oklch(0.93 0.01 90);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0.01 90);

  /* Structural */
  --border:               oklch(1 0 0 / 10%);
  --input:                oklch(1 0 0 / 12%);
  --ring:                 oklch(0.55 0.14 150);

  /* Charts */
  --chart-1: oklch(0.65 0.17 150);
  --chart-2: oklch(0.72 0.15 85);
  --chart-3: oklch(0.55 0.12 200);
  --chart-4: oklch(0.68 0.18 40);
  --chart-5: oklch(0.60 0.14 300);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="forest"][data-mode="light"] {
  /* Surfaces — warm cream with green undertone */
  --background:           oklch(0.97 0.01 90);
  --foreground:           oklch(0.18 0.03 145);
  --card:                 oklch(0.99 0.005 90);
  --card-foreground:      oklch(0.18 0.03 145);
  --popover:              oklch(0.99 0.005 90);
  --popover-foreground:   oklch(0.18 0.03 145);

  /* Interactive — deeper forest green for contrast on white */
  --primary:              oklch(0.48 0.15 150);
  --primary-foreground:   oklch(0.98 0.01 90);
  --secondary:            oklch(0.94 0.01 145);
  --secondary-foreground: oklch(0.25 0.03 145);
  --muted:                oklch(0.94 0.01 145);
  --muted-foreground:     oklch(0.50 0.03 145);
  --accent:               oklch(0.94 0.02 145);
  --accent-foreground:    oklch(0.25 0.03 145);
  --destructive:          oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0.01 0);

  /* Structural */
  --border:               oklch(0.88 0.02 145);
  --input:                oklch(0.88 0.02 145);
  --ring:                 oklch(0.48 0.15 150);
}
```

---

### Theme 2: MIDNIGHT

**Personality**: Sleek, electric, nocturnal energy. The city at 2am — neon reflections on wet pavement, deep blue-black sky, electric accents that pulse. Unapologetically nightlife.

**Best for**: Club nights, concerts, launch parties, late-night gatherings, dance events, EDM shows

**Neutral base hue**: 260 (cool blue-purple)
**Default accent hue**: 245 (electric blue)

#### Typography Treatment
- **Headings**: Manrope Variable, weight 700, tight tracking (-0.02em), uppercase
- **Body**: Manrope Variable, weight 400, line-height 1.55
- **Character**: All sans-serif, heavy and compressed. The uppercase headings and tight tracking create urgency and modernity. No serif softness.

#### Structural Properties
- `--radius`: `0.375rem` (6px — sharp, angular)
- `--border-weight`: `1px`
- `--heading-weight`: `700`
- `--heading-tracking`: `-0.02em`
- `--heading-transform`: `uppercase`
- `--body-line-height`: `1.55`
- `--surface-grain`: `none`

#### Shadow Style
Cool glow effect on elevated elements. Accent-tinted shadows that suggest neon lighting.
```css
/* Dark mode — glow shadow */
--shadow-color: oklch(0.35 0.12 245);
--shadow-strength: 0.25;

/* Light mode — subtle cool shadow */
--shadow-color: oklch(0.45 0.06 260);
--shadow-strength: 0.20;
```

#### Color Tokens — Dark Mode
```css
[data-theme="midnight"][data-mode="dark"] {
  --background:           oklch(0.14 0.03 260);
  --foreground:           oklch(0.95 0.01 260);
  --card:                 oklch(0.17 0.03 260);
  --card-foreground:      oklch(0.95 0.01 260);
  --popover:              oklch(0.20 0.03 260);
  --popover-foreground:   oklch(0.95 0.01 260);

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

  --border:               oklch(1 0 0 / 10%);
  --input:                oklch(1 0 0 / 12%);
  --ring:                 oklch(0.60 0.16 245);

  --chart-1: oklch(0.68 0.19 245);
  --chart-2: oklch(0.72 0.16 195);
  --chart-3: oklch(0.60 0.20 310);
  --chart-4: oklch(0.75 0.14 160);
  --chart-5: oklch(0.65 0.18 30);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="midnight"][data-mode="light"] {
  --background:           oklch(0.97 0.005 260);
  --foreground:           oklch(0.15 0.04 260);
  --card:                 oklch(0.99 0.003 260);
  --card-foreground:      oklch(0.15 0.04 260);
  --popover:              oklch(0.99 0.003 260);
  --popover-foreground:   oklch(0.15 0.04 260);

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

  --border:               oklch(0.90 0.01 260);
  --input:                oklch(0.90 0.01 260);
  --ring:                 oklch(0.50 0.20 245);
}
```

---

### Theme 3: EMBER

**Personality**: Warm, moody, intimate. A candlelit dinner — amber glow, dark wood, brushed copper, the warmth of whiskey in a glass. Romantic without being saccharine.

**Best for**: Date nights, wine tastings, anniversary dinners, jazz nights, whiskey bars, intimate gathering

**Neutral base hue**: 45 (warm amber/brown)
**Default accent hue**: 45 (amber-gold)

#### Typography Treatment
- **Headings**: Vollkorn Variable, weight 500, italic, normal tracking
- **Body**: Manrope Variable, weight 400, line-height 1.70
- **Character**: Italic serif headings create literary intimacy. The generous line-height and lighter heading weight feel relaxed and conversational.

#### Structural Properties
- `--radius`: `0.5rem` (8px — warm, approachable)
- `--border-weight`: `1px`
- `--heading-weight`: `500`
- `--heading-tracking`: `0em`
- `--heading-transform`: `none`
- `--body-line-height`: `1.70`
- `--surface-grain`: `url('/textures/grain-warm.svg')` (warm grain, 4% opacity)

#### Shadow Style
Warm amber-tinted shadows, creating candlelit glow.
```css
--shadow-color: oklch(0.20 0.05 45);
--shadow-strength: 0.20; /* dark */
--shadow-strength: 0.28; /* light */
```

#### Color Tokens — Dark Mode
```css
[data-theme="ember"][data-mode="dark"] {
  --background:           oklch(0.15 0.02 45);
  --foreground:           oklch(0.92 0.02 70);
  --card:                 oklch(0.18 0.025 45);
  --card-foreground:      oklch(0.92 0.02 70);
  --popover:              oklch(0.21 0.025 45);
  --popover-foreground:   oklch(0.92 0.02 70);

  --primary:              oklch(0.72 0.15 45);
  --primary-foreground:   oklch(0.15 0.03 45);
  --secondary:            oklch(0.23 0.02 45);
  --secondary-foreground: oklch(0.90 0.02 70);
  --muted:                oklch(0.23 0.02 45);
  --muted-foreground:     oklch(0.62 0.04 45);
  --accent:               oklch(0.27 0.03 45);
  --accent-foreground:    oklch(0.92 0.02 70);
  --destructive:          oklch(0.65 0.20 20);
  --destructive-foreground: oklch(0.98 0.01 0);

  --border:               oklch(1 0 0 / 8%);
  --input:                oklch(1 0 0 / 10%);
  --ring:                 oklch(0.65 0.13 45);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="ember"][data-mode="light"] {
  --background:           oklch(0.97 0.01 60);
  --foreground:           oklch(0.18 0.03 45);
  --card:                 oklch(0.99 0.008 60);
  --card-foreground:      oklch(0.18 0.03 45);
  --popover:              oklch(0.99 0.008 60);
  --popover-foreground:   oklch(0.18 0.03 45);

  --primary:              oklch(0.52 0.14 45);
  --primary-foreground:   oklch(0.98 0.01 60);
  --secondary:            oklch(0.94 0.015 55);
  --secondary-foreground: oklch(0.22 0.03 45);
  --muted:                oklch(0.94 0.015 55);
  --muted-foreground:     oklch(0.48 0.04 45);
  --accent:               oklch(0.94 0.02 50);
  --accent-foreground:    oklch(0.22 0.03 45);
  --destructive:          oklch(0.55 0.22 20);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(0.88 0.02 50);
  --input:                oklch(0.88 0.02 50);
  --ring:                 oklch(0.52 0.14 45);
}
```

---

### Theme 4: SLATE

**Personality**: Clean, professional, trustworthy. The well-organized office — cool neutrals, clear hierarchy, no-nonsense. Competent without being cold.

**Best for**: Work offsites, networking events, conferences, fundraiser galas, professional meetups, panel discussions

**Neutral base hue**: 250 (cool blue-gray, like shadcn's Slate base)
**Default accent hue**: 185 (teal — professional but not boring)

#### Typography Treatment
- **Headings**: Manrope Variable, weight 600, slight negative tracking (-0.01em), no transform
- **Body**: Manrope Variable, weight 400, line-height 1.55
- **Character**: All sans-serif for maximum clarity. No decorative elements. The slight negative tracking on headings creates density and authority.

#### Structural Properties
- `--radius`: `0.5rem` (8px — professional standard)
- `--border-weight`: `1px`
- `--heading-weight`: `600`
- `--heading-tracking`: `-0.01em`
- `--heading-transform`: `none`
- `--body-line-height`: `1.55`
- `--surface-grain`: `none` (clean, no texture)

#### Shadow Style
Neutral, functional shadows. No color tint.
```css
--shadow-color: oklch(0.10 0 0);
--shadow-strength: 0.12; /* dark */
--shadow-strength: 0.25; /* light */
```

#### Color Tokens — Dark Mode
```css
[data-theme="slate"][data-mode="dark"] {
  --background:           oklch(0.14 0.02 250);
  --foreground:           oklch(0.96 0.005 250);
  --card:                 oklch(0.18 0.02 250);
  --card-foreground:      oklch(0.96 0.005 250);
  --popover:              oklch(0.21 0.02 250);
  --popover-foreground:   oklch(0.96 0.005 250);

  --primary:              oklch(0.70 0.12 185);
  --primary-foreground:   oklch(0.14 0.03 185);
  --secondary:            oklch(0.23 0.02 250);
  --secondary-foreground: oklch(0.93 0.005 250);
  --muted:                oklch(0.23 0.02 250);
  --muted-foreground:     oklch(0.63 0.02 250);
  --accent:               oklch(0.27 0.02 250);
  --accent-foreground:    oklch(0.96 0.005 250);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(1 0 0 / 10%);
  --input:                oklch(1 0 0 / 12%);
  --ring:                 oklch(0.60 0.10 185);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="slate"][data-mode="light"] {
  --background:           oklch(0.98 0.003 250);
  --foreground:           oklch(0.15 0.03 250);
  --card:                 oklch(1 0 0);
  --card-foreground:      oklch(0.15 0.03 250);
  --popover:              oklch(1 0 0);
  --popover-foreground:   oklch(0.15 0.03 250);

  --primary:              oklch(0.50 0.12 185);
  --primary-foreground:   oklch(0.98 0.005 185);
  --secondary:            oklch(0.95 0.005 250);
  --secondary-foreground: oklch(0.20 0.03 250);
  --muted:                oklch(0.95 0.005 250);
  --muted-foreground:     oklch(0.48 0.02 250);
  --accent:               oklch(0.95 0.008 250);
  --accent-foreground:    oklch(0.20 0.03 250);
  --destructive:          oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(0.90 0.008 250);
  --input:                oklch(0.90 0.008 250);
  --ring:                 oklch(0.50 0.12 185);
}
```

---

### Theme 5: BLOOM

**Personality**: Soft, botanical, romantic. A garden in late May — dusty rose petals, sage leaves, soft filtered light. Delicate without being fragile.

**Best for**: Weddings, bridal showers, baby showers, milestone birthdays, garden parties, engagement parties

**Neutral base hue**: 350 (warm rose-tinted neutral)
**Default accent hue**: 350 (dusty rose)

#### Typography Treatment
- **Headings**: Vollkorn Variable, weight 400 (light!), generous size, normal tracking
- **Body**: Manrope Variable, weight 400, line-height 1.70
- **Character**: The unusually light heading weight creates an airy, delicate feel. Combined with generous line-height, the whole page breathes.

#### Structural Properties
- `--radius`: `0.875rem` (14px — soft, rounded)
- `--border-weight`: `1px`
- `--heading-weight`: `400`
- `--heading-tracking`: `0.01em`
- `--heading-transform`: `none`
- `--body-line-height`: `1.70`
- `--surface-grain`: `url('/textures/grain-warm.svg')` (gentle noise, 2% opacity)

#### Shadow Style
Very soft, diffused, rose-tinted.
```css
--shadow-color: oklch(0.50 0.04 350);
--shadow-strength: 0.10; /* dark */
--shadow-strength: 0.20; /* light */
```

#### Color Tokens — Dark Mode
```css
[data-theme="bloom"][data-mode="dark"] {
  --background:           oklch(0.16 0.015 350);
  --foreground:           oklch(0.92 0.01 350);
  --card:                 oklch(0.19 0.015 350);
  --card-foreground:      oklch(0.92 0.01 350);
  --popover:              oklch(0.22 0.015 350);
  --popover-foreground:   oklch(0.92 0.01 350);

  --primary:              oklch(0.70 0.12 350);
  --primary-foreground:   oklch(0.16 0.03 350);
  --secondary:            oklch(0.24 0.015 350);
  --secondary-foreground: oklch(0.90 0.01 350);
  --muted:                oklch(0.24 0.015 350);
  --muted-foreground:     oklch(0.62 0.03 350);
  --accent:               oklch(0.28 0.02 350);
  --accent-foreground:    oklch(0.92 0.01 350);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(1 0 0 / 8%);
  --input:                oklch(1 0 0 / 10%);
  --ring:                 oklch(0.62 0.10 350);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="bloom"][data-mode="light"] {
  --background:           oklch(0.98 0.008 350);
  --foreground:           oklch(0.20 0.02 350);
  --card:                 oklch(0.99 0.005 350);
  --card-foreground:      oklch(0.20 0.02 350);
  --popover:              oklch(0.99 0.005 350);
  --popover-foreground:   oklch(0.20 0.02 350);

  --primary:              oklch(0.55 0.13 350);
  --primary-foreground:   oklch(0.98 0.005 350);
  --secondary:            oklch(0.95 0.01 350);
  --secondary-foreground: oklch(0.25 0.02 350);
  --muted:                oklch(0.95 0.01 350);
  --muted-foreground:     oklch(0.50 0.03 350);
  --accent:               oklch(0.95 0.015 350);
  --accent-foreground:    oklch(0.25 0.02 350);
  --destructive:          oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(0.90 0.01 350);
  --input:                oklch(0.90 0.01 350);
  --ring:                 oklch(0.55 0.13 350);
}
```

---

### Theme 6: GILDED

**Personality**: Opulent, luxurious, ceremonial. The Met Gala — deep blacks, true gold accents, metallic shimmer, architectural precision. Maximum drama.

**Best for**: Galas, black-tie dinners, NYE parties, award ceremonies, charity auctions, premiere events

**Neutral base hue**: 50 (warm gold-shifted neutral)
**Default accent hue**: 85 (true gold)

#### Typography Treatment
- **Headings**: Vollkorn Variable, weight 700, expanded tracking (0.06em), uppercase
- **Body**: Manrope Variable, weight 400, line-height 1.55
- **Character**: Bold uppercase serif with generous tracking creates a monumental, architectural feel. Think engraved invitations, brass plaques.

#### Structural Properties
- `--radius`: `0.25rem` (4px — architectural, precise)
- `--border-weight`: `1px`
- `--heading-weight`: `700`
- `--heading-tracking`: `0.06em`
- `--heading-transform`: `uppercase`
- `--body-line-height`: `1.55`
- `--surface-grain`: `none` (luxury is smooth)

#### Shadow Style
Minimal shadows — luxury relies on surface contrast, not depth. Thin gold border accents instead.
```css
--shadow-color: oklch(0.10 0.02 50);
--shadow-strength: 0.08; /* dark — almost flat */
--shadow-strength: 0.18; /* light */
```

#### Color Tokens — Dark Mode
```css
[data-theme="gilded"][data-mode="dark"] {
  --background:           oklch(0.13 0.01 50);
  --foreground:           oklch(0.90 0.03 85);
  --card:                 oklch(0.16 0.01 50);
  --card-foreground:      oklch(0.90 0.03 85);
  --popover:              oklch(0.19 0.01 50);
  --popover-foreground:   oklch(0.90 0.03 85);

  --primary:              oklch(0.75 0.13 85);
  --primary-foreground:   oklch(0.13 0.03 85);
  --secondary:            oklch(0.21 0.01 50);
  --secondary-foreground: oklch(0.88 0.03 85);
  --muted:                oklch(0.21 0.01 50);
  --muted-foreground:     oklch(0.58 0.04 60);
  --accent:               oklch(0.25 0.02 50);
  --accent-foreground:    oklch(0.90 0.03 85);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(0.35 0.05 85 / 30%);
  --input:                oklch(0.35 0.05 85 / 25%);
  --ring:                 oklch(0.70 0.11 85);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="gilded"][data-mode="light"] {
  --background:           oklch(0.97 0.008 60);
  --foreground:           oklch(0.17 0.02 50);
  --card:                 oklch(0.99 0.005 60);
  --card-foreground:      oklch(0.17 0.02 50);
  --popover:              oklch(0.99 0.005 60);
  --popover-foreground:   oklch(0.17 0.02 50);

  --primary:              oklch(0.50 0.12 85);
  --primary-foreground:   oklch(0.98 0.01 60);
  --secondary:            oklch(0.95 0.01 60);
  --secondary-foreground: oklch(0.22 0.02 50);
  --muted:                oklch(0.95 0.01 60);
  --muted-foreground:     oklch(0.50 0.03 50);
  --accent:               oklch(0.95 0.015 70);
  --accent-foreground:    oklch(0.22 0.02 50);
  --destructive:          oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(0.85 0.03 85);
  --input:                oklch(0.85 0.03 85);
  --ring:                 oklch(0.50 0.12 85);
}
```

---

### Theme 7: NEON

**Personality**: Bold, Gen Z, unapologetically fun. Energy drink meets house party — electric colors, bubbly shapes, zero pretension. The anti-formal.

**Best for**: House parties, birthday bashes, themed parties, karaoke nights, game tournaments, raves

**Neutral base hue**: 290 (purple-shifted, fun)
**Default accent hue**: 330 (hot magenta/pink)

#### Typography Treatment
- **Headings**: Manrope Variable, weight 800, tight tracking (-0.02em), no transform
- **Body**: Manrope Variable, weight 400, line-height 1.55
- **Character**: Extra-bold sans-serif headings are punchy and energetic. No serif, no subtlety.

#### Structural Properties
- `--radius`: `1rem` (16px — bubbly, playful)
- `--border-weight`: `2px`
- `--heading-weight`: `800`
- `--heading-tracking`: `-0.02em`
- `--heading-transform`: `none`
- `--body-line-height`: `1.55`
- `--surface-grain`: `none`

#### Shadow Style
Accent-colored glow shadows. More visible than other themes.
```css
--shadow-color: oklch(0.45 0.15 330);
--shadow-strength: 0.30; /* dark — intentionally visible glow */
--shadow-strength: 0.20; /* light */
```

#### Color Tokens — Dark Mode
```css
[data-theme="neon"][data-mode="dark"] {
  --background:           oklch(0.14 0.03 290);
  --foreground:           oklch(0.95 0.01 290);
  --card:                 oklch(0.17 0.03 290);
  --card-foreground:      oklch(0.95 0.01 290);
  --popover:              oklch(0.20 0.03 290);
  --popover-foreground:   oklch(0.95 0.01 290);

  --primary:              oklch(0.72 0.22 330);
  --primary-foreground:   oklch(0.13 0.04 330);
  --secondary:            oklch(0.22 0.03 290);
  --secondary-foreground: oklch(0.92 0.01 290);
  --muted:                oklch(0.22 0.03 290);
  --muted-foreground:     oklch(0.60 0.04 290);
  --accent:               oklch(0.26 0.04 290);
  --accent-foreground:    oklch(0.95 0.01 290);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(1 0 0 / 12%);
  --input:                oklch(1 0 0 / 14%);
  --ring:                 oklch(0.65 0.20 330);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="neon"][data-mode="light"] {
  --background:           oklch(0.97 0.008 290);
  --foreground:           oklch(0.16 0.04 290);
  --card:                 oklch(0.99 0.005 290);
  --card-foreground:      oklch(0.16 0.04 290);
  --popover:              oklch(0.99 0.005 290);
  --popover-foreground:   oklch(0.16 0.04 290);

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

  --border:               oklch(0.88 0.015 290);
  --input:                oklch(0.88 0.015 290);
  --ring:                 oklch(0.55 0.22 330);
}
```

---

### Theme 8: DUSK

**Personality**: Moody, atmospheric, contemplative. Twilight — the sky between day and night, lavender horizon, warm peach on cool purple. Artistic and introspective.

**Best for**: Art shows, poetry readings, listening parties, gallery openings, film screenings, book launches

**Neutral base hue**: 280 (cool purple)
**Default accent hue**: 290 (muted lavender)

#### Typography Treatment
- **Headings**: Vollkorn Variable, weight 500, generous size, expanded tracking (0.02em), no transform
- **Body**: Manrope Variable, weight 400, line-height 1.75
- **Character**: Medium-weight serif with expanded tracking creates an art-catalog feel. The generous body line-height creates a meditative reading pace.

#### Structural Properties
- `--radius`: `0.5rem` (8px — understated)
- `--border-weight`: `1px`
- `--heading-weight`: `500`
- `--heading-tracking`: `0.02em`
- `--heading-transform`: `none`
- `--body-line-height`: `1.75`
- `--surface-grain`: `url('/textures/grain-cool.svg')` (cool-tinted noise, 3% opacity)

#### Shadow Style
Purple-shifted diffused shadows. Atmospheric.
```css
--shadow-color: oklch(0.20 0.06 280);
--shadow-strength: 0.18; /* dark */
--shadow-strength: 0.22; /* light */
```

#### Color Tokens — Dark Mode
```css
[data-theme="dusk"][data-mode="dark"] {
  --background:           oklch(0.15 0.025 280);
  --foreground:           oklch(0.92 0.01 280);
  --card:                 oklch(0.18 0.025 280);
  --card-foreground:      oklch(0.92 0.01 280);
  --popover:              oklch(0.21 0.025 280);
  --popover-foreground:   oklch(0.92 0.01 280);

  --primary:              oklch(0.68 0.12 290);
  --primary-foreground:   oklch(0.15 0.03 290);
  --secondary:            oklch(0.23 0.025 280);
  --secondary-foreground: oklch(0.90 0.01 280);
  --muted:                oklch(0.23 0.025 280);
  --muted-foreground:     oklch(0.60 0.04 280);
  --accent:               oklch(0.27 0.03 280);
  --accent-foreground:    oklch(0.92 0.01 280);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(1 0 0 / 9%);
  --input:                oklch(1 0 0 / 11%);
  --ring:                 oklch(0.58 0.10 290);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="dusk"][data-mode="light"] {
  --background:           oklch(0.97 0.006 280);
  --foreground:           oklch(0.18 0.03 280);
  --card:                 oklch(0.99 0.003 280);
  --card-foreground:      oklch(0.18 0.03 280);
  --popover:              oklch(0.99 0.003 280);
  --popover-foreground:   oklch(0.18 0.03 280);

  --primary:              oklch(0.52 0.12 290);
  --primary-foreground:   oklch(0.98 0.005 290);
  --secondary:            oklch(0.94 0.008 280);
  --secondary-foreground: oklch(0.22 0.03 280);
  --muted:                oklch(0.94 0.008 280);
  --muted-foreground:     oklch(0.50 0.03 280);
  --accent:               oklch(0.94 0.012 280);
  --accent-foreground:    oklch(0.22 0.03 280);
  --destructive:          oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(0.89 0.01 280);
  --input:                oklch(0.89 0.01 280);
  --ring:                 oklch(0.52 0.12 290);
}
```

---

### Theme 9: SAND

**Personality**: Warm minimalism, quiet luxury. A desert retreat — terracotta, warm cream, linen texture, sunbleached materials. Calm, unhurried, grounded.

**Best for**: Brunch, wellness gatherings, yoga events, farm-to-table dinners, supper clubs, retreats

**Neutral base hue**: 55 (warm cream/sand)
**Default accent hue**: 30 (terracotta)

#### Typography Treatment
- **Headings**: Vollkorn Variable, weight 400 (light), normal tracking, no transform
- **Body**: Manrope Variable, weight 400, line-height 1.70
- **Character**: Minimal heading weight combined with warm surfaces creates "quiet luxury" — nothing is fighting for attention.

#### Structural Properties
- `--radius`: `0.75rem` (12px — soft, natural)
- `--border-weight`: `1px`
- `--heading-weight`: `400`
- `--heading-tracking`: `0em`
- `--heading-transform`: `none`
- `--body-line-height`: `1.70`
- `--surface-grain`: `url('/textures/linen.svg')` (linen texture, 4% opacity)

#### Shadow Style
Warm, barely visible. Surfaces differentiated primarily by color, not shadow.
```css
--shadow-color: oklch(0.30 0.04 40);
--shadow-strength: 0.10; /* dark */
--shadow-strength: 0.15; /* light */
```

#### Color Tokens — Dark Mode
```css
[data-theme="sand"][data-mode="dark"] {
  --background:           oklch(0.16 0.015 55);
  --foreground:           oklch(0.90 0.02 55);
  --card:                 oklch(0.19 0.015 55);
  --card-foreground:      oklch(0.90 0.02 55);
  --popover:              oklch(0.22 0.015 55);
  --popover-foreground:   oklch(0.90 0.02 55);

  --primary:              oklch(0.68 0.12 30);
  --primary-foreground:   oklch(0.15 0.03 30);
  --secondary:            oklch(0.23 0.015 55);
  --secondary-foreground: oklch(0.88 0.02 55);
  --muted:                oklch(0.23 0.015 55);
  --muted-foreground:     oklch(0.60 0.03 55);
  --accent:               oklch(0.27 0.02 55);
  --accent-foreground:    oklch(0.90 0.02 55);
  --destructive:          oklch(0.65 0.20 20);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(1 0 0 / 8%);
  --input:                oklch(1 0 0 / 10%);
  --ring:                 oklch(0.58 0.10 30);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="sand"][data-mode="light"] {
  --background:           oklch(0.96 0.015 55);
  --foreground:           oklch(0.20 0.02 45);
  --card:                 oklch(0.98 0.01 55);
  --card-foreground:      oklch(0.20 0.02 45);
  --popover:              oklch(0.98 0.01 55);
  --popover-foreground:   oklch(0.20 0.02 45);

  --primary:              oklch(0.52 0.12 30);
  --primary-foreground:   oklch(0.97 0.01 55);
  --secondary:            oklch(0.93 0.015 55);
  --secondary-foreground: oklch(0.25 0.02 45);
  --muted:                oklch(0.93 0.015 55);
  --muted-foreground:     oklch(0.50 0.03 45);
  --accent:               oklch(0.93 0.02 50);
  --accent-foreground:    oklch(0.25 0.02 45);
  --destructive:          oklch(0.55 0.22 20);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(0.88 0.02 50);
  --input:                oklch(0.88 0.02 50);
  --ring:                 oklch(0.52 0.12 30);
}
```

---

### Theme 10: MONO

**Personality**: Black and white. Maximum contrast. Typography-forward. The art print — no color, all composition. For hosts who want their content to speak without aesthetic distraction.

**Best for**: Minimalist hosts, fashion events, photography exhibitions, film screenings, literary events

**Neutral base hue**: 0 (achromatic — zero chroma throughout)
**Default accent hue**: 0 (achromatic — no accent color by default. Primary is pure light/dark.)

#### Typography Treatment
- **Headings**: Vollkorn Variable, weight 700, normal tracking, no transform
- **Body**: Manrope Variable, weight 400, line-height 1.60
- **Character**: Bold serif headings on a pure achromatic palette — the typography IS the design. Every word has visual weight.

#### Structural Properties
- `--radius`: `0rem` (0px — razor-sharp corners. Every edge is intentional.)
- `--border-weight`: `2px`
- `--heading-weight`: `700`
- `--heading-tracking`: `0em`
- `--heading-transform`: `none`
- `--body-line-height`: `1.60`
- `--surface-grain`: `none` (absolute purity)

#### Shadow Style
No decorative shadows. Elevation expressed through borders only.
```css
--shadow-color: oklch(0 0 0);
--shadow-strength: 0; /* No shadows. Zero. */
```

#### Color Tokens — Dark Mode
```css
[data-theme="mono"][data-mode="dark"] {
  --background:           oklch(0.13 0 0);
  --foreground:           oklch(0.93 0 0);
  --card:                 oklch(0.17 0 0);
  --card-foreground:      oklch(0.93 0 0);
  --popover:              oklch(0.20 0 0);
  --popover-foreground:   oklch(0.93 0 0);

  --primary:              oklch(0.93 0 0);
  --primary-foreground:   oklch(0.13 0 0);
  --secondary:            oklch(0.22 0 0);
  --secondary-foreground: oklch(0.90 0 0);
  --muted:                oklch(0.22 0 0);
  --muted-foreground:     oklch(0.60 0 0);
  --accent:               oklch(0.27 0 0);
  --accent-foreground:    oklch(0.93 0 0);
  --destructive:          oklch(0.65 0.20 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(0.35 0 0);
  --input:                oklch(0.35 0 0);
  --ring:                 oklch(0.70 0 0);
}
```

#### Color Tokens — Light Mode
```css
[data-theme="mono"][data-mode="light"] {
  --background:           oklch(0.99 0 0);
  --foreground:           oklch(0.13 0 0);
  --card:                 oklch(1 0 0);
  --card-foreground:      oklch(0.13 0 0);
  --popover:              oklch(1 0 0);
  --popover-foreground:   oklch(0.13 0 0);

  --primary:              oklch(0.13 0 0);
  --primary-foreground:   oklch(0.99 0 0);
  --secondary:            oklch(0.95 0 0);
  --secondary-foreground: oklch(0.18 0 0);
  --muted:                oklch(0.95 0 0);
  --muted-foreground:     oklch(0.45 0 0);
  --accent:               oklch(0.93 0 0);
  --accent-foreground:    oklch(0.18 0 0);
  --destructive:          oklch(0.55 0.22 25);
  --destructive-foreground: oklch(0.98 0 0);

  --border:               oklch(0.75 0 0);
  --input:                oklch(0.75 0 0);
  --ring:                 oklch(0.35 0 0);
}
```

**Note on Mono + Custom Accent**: When a host selects Mono but adds a custom accent color, the theme remains achromatic EXCEPT for the --primary and --ring variables, which adopt the accent hue. This creates a striking single-color-on-monochrome effect.

---

## 6. Typography System

### Font Loading

Both fonts are loaded as Google Fonts Variable, with `font-display: swap` for performance:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Vollkorn:ital,wght@0,400..900;1,400..900&family=Manrope:wght@200..800&display=swap" rel="stylesheet">
```

### CSS Custom Property Application

```css
/* Base font stacks */
:root {
  --font-serif: 'Vollkorn', Georgia, 'Times New Roman', serif;
  --font-sans: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Theme applies the font choice via custom properties */
body[data-theme] {
  font-family: var(--font-body);
  line-height: var(--body-line-height);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--heading-weight);
  letter-spacing: var(--heading-tracking);
  text-transform: var(--heading-transform);
}
```

### Per-Theme Font Assignment Summary

| Theme | Heading Font | Body Font | Key Difference |
|-------|-------------|-----------|---------------|
| Forest | Vollkorn (serif) | Manrope (sans) | Organic warmth |
| Midnight | Manrope (sans) | Manrope (sans) | All sans-serif, bold + uppercase |
| Ember | Vollkorn italic (serif) | Manrope (sans) | Italic creates intimacy |
| Slate | Manrope (sans) | Manrope (sans) | All sans-serif, professional clarity |
| Bloom | Vollkorn light (serif) | Manrope (sans) | Light weight = airy delicacy |
| Gilded | Vollkorn bold + uppercase (serif) | Manrope (sans) | Architectural, monumental |
| Neon | Manrope extra-bold (sans) | Manrope (sans) | Heavy + punchy |
| Dusk | Vollkorn medium (serif) | Manrope (sans) | Art-catalog lettering |
| Sand | Vollkorn light (serif) | Manrope (sans) | Quiet, minimal weight |
| Mono | Vollkorn bold (serif) | Manrope (sans) | Typography IS the design |

### Font Size Scale (Shared Across All Themes)

```css
:root {
  --text-xs:    0.75rem;   /* 12px — captions, timestamps */
  --text-sm:    0.875rem;  /* 14px — secondary text */
  --text-base:  1rem;      /* 16px — body */
  --text-lg:    1.125rem;  /* 18px — large body */
  --text-xl:    1.25rem;   /* 20px — h4 */
  --text-2xl:   1.5rem;    /* 24px — h3 */
  --text-3xl:   1.875rem;  /* 30px — h2 */
  --text-4xl:   2.25rem;   /* 36px — h1, event title */
}
```

---

## 7. Shadow & Elevation System

### Elevation Levels (4 Levels)

Each theme defines `--shadow-color` and `--shadow-strength`. The elevation system uses these to generate consistent depth:

```css
/* Shared elevation system — applied globally */
:root {
  --shadow-sm: 0 1px 2px oklch(from var(--shadow-color) l c h / calc(var(--shadow-strength) * 0.5));

  --shadow-md: 0 2px 4px oklch(from var(--shadow-color) l c h / calc(var(--shadow-strength) * 0.3)),
               0 4px 8px oklch(from var(--shadow-color) l c h / calc(var(--shadow-strength) * 0.2));

  --shadow-lg: 0 4px 8px oklch(from var(--shadow-color) l c h / calc(var(--shadow-strength) * 0.25)),
               0 8px 16px oklch(from var(--shadow-color) l c h / calc(var(--shadow-strength) * 0.15)),
               0 16px 32px oklch(from var(--shadow-color) l c h / calc(var(--shadow-strength) * 0.10));

  --shadow-xl: 0 8px 16px oklch(from var(--shadow-color) l c h / calc(var(--shadow-strength) * 0.20)),
               0 16px 32px oklch(from var(--shadow-color) l c h / calc(var(--shadow-strength) * 0.15)),
               0 32px 64px oklch(from var(--shadow-color) l c h / calc(var(--shadow-strength) * 0.10));
}
```

**Fallback note**: `oklch(from ...)` relative color syntax may not be supported in all target browsers. If needed, each theme can define concrete shadow values. Check browser support at implementation time and provide hex fallbacks if necessary.

### Alternative Concrete Shadow Definition Per Theme

If relative color syntax isn't viable, define shadows directly per theme:

```css
[data-theme="forest"][data-mode="dark"] {
  --shadow-sm: 0 1px 2px oklch(0.05 0.02 145 / 8%);
  --shadow-md: 0 2px 4px oklch(0.05 0.02 145 / 5%),
               0 4px 8px oklch(0.05 0.02 145 / 3%);
  --shadow-lg: 0 4px 8px oklch(0.05 0.02 145 / 4%),
               0 8px 16px oklch(0.05 0.02 145 / 2.5%),
               0 16px 32px oklch(0.05 0.02 145 / 1.5%);
}

[data-theme="forest"][data-mode="light"] {
  --shadow-sm: 0 1px 2px oklch(0.40 0.03 145 / 15%);
  --shadow-md: 0 2px 4px oklch(0.40 0.03 145 / 10%),
               0 4px 8px oklch(0.40 0.03 145 / 6%);
  --shadow-lg: 0 4px 8px oklch(0.40 0.03 145 / 8%),
               0 8px 16px oklch(0.40 0.03 145 / 5%),
               0 16px 32px oklch(0.40 0.03 145 / 3%);
}
```

### Component Elevation Mapping

| Component | Elevation Level | Token |
|-----------|----------------|-------|
| Page background | 0 (base) | --background |
| Cards, containers | 1 | --card + --shadow-sm |
| RSVP button | 1 | --primary + --shadow-sm |
| Popovers, dropdowns | 2 | --popover + --shadow-md |
| Modal dialogs | 3 | --popover + --shadow-lg |
| Floating actions | 4 | --primary + --shadow-xl |

---

## 8. Theme Picker UX

### Layout: 2×5 Grid

As requested, the theme picker uses a **2×5 grid** (2 rows, 5 columns) on mobile. Each cell is a square swatch.

### Swatch Design

Each swatch is a ~60×60px square containing:
1. **Background fill**: The theme's `--background` value (in its default mode)
2. **Accent indicator**: A 12px circle filled with `--primary`
3. **Theme name**: Below the swatch in `--muted-foreground`, `--text-xs` size
4. **Selected state**: 2px ring in `--primary` + checkmark icon overlay

### Phosphor Icons Per Theme

Each swatch includes a small Phosphor duotone icon in the accent color:

| Theme | Phosphor Icon | Rationale |
|-------|--------------|-----------|
| Forest | `TreeEvergreen` | Nature, the signature |
| Midnight | `MoonStars` | Nighttime |
| Ember | `Fire` | Warmth, candlelight |
| Slate | `Buildings` | Professional, structured |
| Bloom | `Flower` | Botanical |
| Gilded | `Crown` | Luxury, ceremony |
| Neon | `Lightning` | Energy, electricity |
| Dusk | `SunHorizon` | Twilight |
| Sand | `Cactus` | Desert, minimalism |
| Mono | `TextAa` | Typography-forward |

### Mode Toggle

Below the theme grid, a simple toggle:
- **Label**: "Appearance"
- **Options**: ☀️ Light / 🌙 Dark
- **Default**: Pre-selected based on theme's default mode (see Section 3 table)
- **Behavior**: Instantly re-themes the form via reactive `data-mode` binding

### Accent Color Picker

Below the mode toggle:
- **Label**: "Accent color"
- **Layout**: Row of 9 circular swatches (8 presets + 1 "Default" swatch) + hex input
- **Default swatch**: Shows the theme's default accent color, has "Default" label
- **Hex input**: Small text field, validates as hex, converts to hue on blur
- **Preview**: Changing accent instantly updates `--primary` and `--ring` in the live form

### Live Preview

The entire event creation form is wrapped in the `data-theme` / `data-mode` container. Every theme/mode/accent change applies instantly to the form itself, so the host sees exactly what guests will see.

### Smart Defaults by Event Type

When host selects an event type, auto-select the best theme:

| Event Type | Default Theme | Default Mode | Also Suggested |
|-----------|--------------|-------------|----------------|
| Hangout | Forest | Dark | Sand, Neon |
| Birthday | Neon | Dark | Ember, Bloom |
| Dinner Party | Ember | Dark | Forest, Sand |
| Wedding | Bloom | Light | Gilded, Mono |
| Bridal Shower | Bloom | Light | Sand, Forest |
| Baby Shower | Bloom | Light | Sand, Forest |
| Corporate | Slate | Light | Mono, Forest |
| Networking | Slate | Light | Forest, Midnight |
| Concert | Midnight | Dark | Neon, Dusk |
| Art Show | Dusk | Dark | Mono, Midnight |
| Fundraiser | Gilded | Dark | Slate, Ember |
| Holiday Party | Gilded | Dark | Neon, Ember |
| Game Night | Neon | Dark | Forest, Midnight |
| Brunch | Sand | Light | Bloom, Forest |
| Wellness | Sand | Light | Forest, Bloom |
| Watch Party | Midnight | Dark | Forest, Neon |
| Potluck | Forest | Dark | Sand, Ember |
| Book Club | Dusk | Dark | Forest, Ember |
| Other | Forest | Dark | — |

---

## 9. Theme-Aware OG Images

### Architecture

Dynamic Open Graph images must reflect the selected theme + mode + accent. Generated server-side using **satori** (SVG generation) + **resvg** (SVG → PNG):

```typescript
// /src/routes/og/[code]/+server.ts
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { getThemeTokens } from '$lib/themes/tokens';

export async function GET({ params }) {
  const event = await db.prepare('SELECT * FROM events WHERE short_code = ?').bind(params.code).first();
  const tokens = getThemeTokens(event.theme, event.mode);

  // If custom accent, override primary color
  const primaryColor = event.accent_hue != null
    ? `oklch(${event.mode === 'dark' ? '0.65 0.18' : '0.48 0.20'} ${event.accent_hue})`
    : tokens.primary;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          background: tokens.background,
          fontFamily: tokens.fontHeading,
        },
        children: [
          {
            type: 'h1',
            props: {
              style: {
                color: tokens.foreground,
                fontSize: '48px',
                fontWeight: tokens.headingWeight,
                letterSpacing: tokens.headingTracking,
                textTransform: tokens.headingTransform,
              },
              children: event.title,
            },
          },
          {
            type: 'p',
            props: {
              style: {
                color: primaryColor,
                fontSize: '24px',
                marginTop: '16px',
              },
              children: `${event.date_formatted} · ${event.location}`,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                marginTop: 'auto',
                color: tokens.mutedForeground,
                fontSize: '18px',
              },
              children: 'ephemeral.events',
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [/* loaded Vollkorn + Manrope font files */],
    }
  );

  const resvg = new Resvg(svg);
  const png = resvg.render().asPng();

  return new Response(png, {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
  });
}
```

### Theme Token Server Helper

```typescript
// $lib/themes/tokens.ts
export interface ThemeTokens {
  background: string;
  foreground: string;
  primary: string;
  mutedForeground: string;
  fontHeading: string;
  fontBody: string;
  headingWeight: string;
  headingTracking: string;
  headingTransform: string;
}

// Exports a plain object of resolved color values (hex or oklch strings)
// Used by OG image generation (satori) and email templates
export function getThemeTokens(theme: string, mode: string): ThemeTokens {
  return THEME_MAP[theme]?.[mode] ?? THEME_MAP.forest.dark;
}
```

---

## 10. Accessibility Verification

### Required Contrast Checks (Per Theme × Mode = 20 Configurations)

Every configuration must pass ALL of these before shipping:

| Check | Pair | Minimum Ratio | Standard |
|-------|------|---------------|----------|
| 1 | `--foreground` on `--background` | 4.5:1 | WCAG AA normal text |
| 2 | `--card-foreground` on `--card` | 4.5:1 | WCAG AA normal text |
| 3 | `--primary-foreground` on `--primary` | 4.5:1 | WCAG AA (button text) |
| 4 | `--muted-foreground` on `--background` | 4.5:1 | WCAG AA (captions) |
| 5 | `--muted-foreground` on `--card` | 4.5:1 | WCAG AA (card captions) |
| 6 | `--primary` on `--background` | 3:1 | WCAG AA UI components |
| 7 | `--destructive-foreground` on `--destructive` | 4.5:1 | WCAG AA (danger button) |
| 8 | `--border` visible on `--background` | — | Visual check (not a ratio) |

### Automated Verification Script

```typescript
// scripts/verify-theme-contrast.ts
import { wcagContrast } from 'culori';

const CHECKS = [
  { fg: 'foreground', bg: 'background', min: 4.5 },
  { fg: 'card-foreground', bg: 'card', min: 4.5 },
  { fg: 'primary-foreground', bg: 'primary', min: 4.5 },
  { fg: 'muted-foreground', bg: 'background', min: 4.5 },
  { fg: 'muted-foreground', bg: 'card', min: 4.5 },
  { fg: 'primary', bg: 'background', min: 3.0 },
  { fg: 'destructive-foreground', bg: 'destructive', min: 4.5 },
];

for (const theme of THEMES) {
  for (const mode of ['light', 'dark']) {
    const tokens = getThemeTokens(theme, mode);
    for (const check of CHECKS) {
      const ratio = wcagContrast(tokens[check.fg], tokens[check.bg]);
      if (ratio < check.min) {
        console.error(`FAIL: ${theme}/${mode} — ${check.fg} on ${check.bg}: ${ratio.toFixed(2)} < ${check.min}`);
        process.exit(1);
      }
    }
  }
}
```

### Color-Blind Safety

- No information conveyed by color alone. All interactive elements have icon + color.
- Destructive actions use icon (TrashSimple) + red, never red alone.
- RSVP states: Going ✓ (green + check), Maybe ~ (yellow + tilde), Can't ✗ (gray + x). The icon carries the meaning; color reinforces.

---

## 11. Database & API

### Schema Migration

```sql
-- Add theming columns to events table
ALTER TABLE events ADD COLUMN theme TEXT NOT NULL DEFAULT 'forest';
ALTER TABLE events ADD COLUMN mode TEXT NOT NULL DEFAULT 'dark';
ALTER TABLE events ADD COLUMN accent_hue REAL; -- NULL = use theme default

-- Validation: theme must be one of the 10
-- Validation: mode must be 'light' or 'dark'
-- Validation: accent_hue must be NULL or 0-360
```

### TypeScript Types

```typescript
export const VALID_THEMES = [
  'forest', 'midnight', 'ember', 'slate', 'bloom',
  'gilded', 'neon', 'dusk', 'sand', 'mono'
] as const;

export type EventTheme = typeof VALID_THEMES[number];
export type EventMode = 'light' | 'dark';

export interface EventTheming {
  theme: EventTheme;
  mode: EventMode;
  accent_hue: number | null;
}
```

### Server-Side Application

```typescript
// +page.server.ts
export async function load({ params }) {
  const event = await db.prepare(
    'SELECT * FROM events WHERE short_code = ?'
  ).bind(params.code).first();

  return {
    event,
    theme: event?.theme ?? 'forest',
    mode: event?.mode ?? 'dark',
    accent_hue: event?.accent_hue ?? null,
  };
}
```

```svelte
<!-- +page.svelte -->
<div
  class="event-page min-h-screen"
  data-theme={data.theme}
  data-mode={data.mode}
  style:--primary={data.accent_hue != null ? computeAccentPrimary(data.accent_hue, data.mode) : undefined}
  style:--ring={data.accent_hue != null ? computeAccentRing(data.accent_hue, data.mode) : undefined}
>
  <slot />
</div>
```

---

## 12. File Structure

```
src/
├── styles/
│   ├── app.css                    # Root imports, @theme inline, shared tokens
│   ├── typography.css             # Font loading, heading/body rules
│   ├── elevation.css              # Shared shadow system
│   └── themes/
│       ├── index.css              # Imports all theme files
│       ├── forest.css             # [data-theme="forest"][data-mode="dark"] + light
│       ├── midnight.css
│       ├── ember.css
│       ├── slate.css
│       ├── bloom.css
│       ├── gilded.css
│       ├── neon.css
│       ├── dusk.css
│       ├── sand.css
│       └── mono.css
├── lib/
│   ├── themes/
│   │   ├── types.ts               # EventTheme, VALID_THEMES, EventMode
│   │   ├── defaults.ts            # Event type → theme/mode mapping
│   │   ├── tokens.ts              # getThemeTokens() for server-side use (OG, email)
│   │   └── accent.ts              # computeAccentPrimary(), hexToHue()
│   └── components/
│       ├── ThemePicker.svelte     # 2×5 grid + mode toggle + accent picker
│       ├── ThemeSwatch.svelte     # Individual swatch component
│       ├── ModeToggle.svelte      # Light/dark toggle
│       └── AccentPicker.svelte    # Preset swatches + hex input
├── static/
│   └── textures/
│       ├── grain-warm.svg         # Warm-tinted organic noise pattern
│       ├── grain-cool.svg         # Cool-tinted noise pattern
│       └── linen.svg              # Linen textile pattern
└── routes/
    ├── create/
    │   └── +page.svelte           # Event creation with ThemePicker
    ├── e/[code]/
    │   ├── +page.server.ts        # Loads event with theme data
    │   └── +page.svelte           # Applies data-theme/data-mode
    └── og/[code]/
        └── +server.ts             # Theme-aware OG image generation
```

---

## 13. Implementation Sequence

### Phase 1: Foundation (Estimated: 3–4 days)

1. Create all 10 theme CSS files with both light and dark mode tokens
2. Create `typography.css` with font loading and per-theme font rules
3. Create `elevation.css` with shared shadow system
4. Add `theme`, `mode`, `accent_hue` columns to events D1 table
5. Create TypeScript types and token helpers
6. Apply `data-theme` + `data-mode` attributes in event page layout
7. Import theme CSS in `app.css` and register with `@theme inline`
8. Verify all themes render correctly with existing shadcn-svelte components

### Phase 2: Host Experience (Estimated: 2–3 days)

9. Build `ThemeSwatch.svelte` component
10. Build `ThemePicker.svelte` (2×5 grid)
11. Build `ModeToggle.svelte`
12. Build `AccentPicker.svelte` (preset swatches + hex input)
13. Add all picker components to event creation form with smart defaults
14. Implement live preview via reactive data attribute binding
15. Add to event edit form
16. Wire up form submission to save theme/mode/accent_hue to D1

### Phase 3: Guest Experience (Estimated: 1–2 days)

17. Theme-aware OG images (extend satori with theme token server helper)
18. Verify SSR renders correct theme on first paint (no flash, no CLS)
19. Test all 20 configurations (10 themes × 2 modes) end-to-end

### Phase 4: Polish (Estimated: 1–2 days)

20. Run automated accessibility verification across all 20 configurations
21. Create texture SVGs (grain-warm, grain-cool, linen)
22. Add `transition: color 150ms, background-color 150ms, border-color 150ms` to all themed elements for smooth theme picker transitions
23. Manual visual QA on iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari

### Total Estimated Build: 7–11 days

---

## 14. Success Metrics

Track after launch:

| Metric | Target | Why It Matters |
|--------|--------|---------------|
| % events using non-default theme | >40% in 4 weeks | Proves the feature has value |
| Theme distribution | No single theme >35% | Validates our range covers real needs |
| Light vs dark mode split | Track only | Validates our mode defaults |
| % events with custom accent | >15% | Justifies the accent picker investment |
| Theme selection time | <15s median | Picker UX is intuitive |
| OG image click-through by theme | Track by theme | Identifies which themes are most compelling in previews |
| Guest-to-host conversion by theme | Track by theme | Identifies which aesthetic drives viral adoption |

---

## Appendix A: Event Type → Theme Mapping (Complete)

```typescript
// $lib/themes/defaults.ts
export const EVENT_TYPE_DEFAULTS: Record<string, { theme: EventTheme; mode: EventMode }> = {
  hangout:        { theme: 'forest',   mode: 'dark'  },
  birthday:       { theme: 'neon',     mode: 'dark'  },
  dinner_party:   { theme: 'ember',    mode: 'dark'  },
  wedding:        { theme: 'bloom',    mode: 'light' },
  bridal_shower:  { theme: 'bloom',    mode: 'light' },
  baby_shower:    { theme: 'bloom',    mode: 'light' },
  corporate:      { theme: 'slate',    mode: 'light' },
  networking:     { theme: 'slate',    mode: 'light' },
  concert:        { theme: 'midnight', mode: 'dark'  },
  art_show:       { theme: 'dusk',     mode: 'dark'  },
  fundraiser:     { theme: 'gilded',   mode: 'dark'  },
  holiday_party:  { theme: 'gilded',   mode: 'dark'  },
  game_night:     { theme: 'neon',     mode: 'dark'  },
  brunch:         { theme: 'sand',     mode: 'light' },
  wellness:       { theme: 'sand',     mode: 'light' },
  watch_party:    { theme: 'midnight', mode: 'dark'  },
  potluck:        { theme: 'forest',   mode: 'dark'  },
  book_club:      { theme: 'dusk',     mode: 'dark'  },
  other:          { theme: 'forest',   mode: 'dark'  },
};
```

## Appendix B: OKLCH Quick Reference

```
Hue wheel:
  0° = Red       60° = Yellow    120° = Green
  180° = Cyan    240° = Blue     300° = Magenta

Lightness:
  0.00 = Pure black
  0.14 = Dark mode background range start
  0.20 = Dark mode card/elevated surface
  0.50 = Mid-tone (rarely used for surfaces)
  0.90 = Light mode borders
  0.95 = Light mode muted/secondary surfaces
  0.97 = Light mode background
  1.00 = Pure white

Chroma:
  0.00 = Pure gray (achromatic)
  0.01–0.03 = Barely tinted gray (surface colors)
  0.05–0.10 = Noticeable tint (muted accents)
  0.12–0.18 = Medium saturation (primary actions)
  0.20–0.25 = High saturation (bold accents)
  0.30+ = Maximum vivid (use sparingly, display-dependent)

Contrast rules (OKLCH lightness difference as rough guide):
  0.40+ L difference → likely passes 4.5:1 for low chroma
  0.50+ L difference → almost certainly passes 4.5:1
  0.60+ L difference → high contrast, always passes
```
