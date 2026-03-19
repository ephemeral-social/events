# Elegant Aesthetic Category -- Complete Design Specification

**Version**: 1.0
**Date**: February 2026
**Status**: Implementation-ready
**Category**: Elegant (1 of 4: Simple, Fun, Warm, Elegant)

---

## Table of Contents

1. [Category Definition](#1-category-definition)
2. [Reference Products & Designs](#2-reference-products--designs)
3. [Heading Font -- Display Serif](#3-heading-font----display-serif)
4. [Body Font -- Elegant Sans-Serif](#4-body-font----elegant-sans-serif)
5. [Type Scale](#5-type-scale)
6. [Spacing Scale](#6-spacing-scale)
7. [Button Specification -- Ghost/Outline Style](#7-button-specification----ghostoutline-style)
8. [Color Palettes](#8-color-palettes)
9. [Border Radius](#9-border-radius)
10. [Divider/Separator Style -- Ornamental Rules](#10-dividerseparator-style----ornamental-rules)
11. [Shadow System](#11-shadow-system)
12. [Copy & Language -- Formal](#12-copy--language----formal)
13. [Layout Specification](#13-layout-specification)
14. [Animation & Motion](#14-animation--motion)
15. [Implementation Notes](#15-implementation-notes)

---

## 1. Category Definition

### Events This Serves

Weddings, bridal showers, baby showers, birthday dinners (milestone/formal), gallery openings, graduation celebrations, cocktail parties, rehearsal dinners, engagement parties, christenings, retirement celebrations, charity galas, award ceremonies.

### Personality

Sophisticated, elevated, timeless. Formal stationery translated into digital form. Every design decision communicates restraint, intention, and quiet authority. This is the Paperless Post killer -- the same gravitas they charge $0.13-0.48 per guest for, given away free with better craft.

### Design Intent

Centered composition. Wide letter-spacing. Formal language. Ornamental elements used sparingly. Deliberate negative space. The page should feel like opening a heavy-stock envelope and finding a letterpress invitation inside.

### Strategic Role

The #1 differentiator for users 30+ who find Partiful's aesthetic juvenile. Research confirms: adults planning weddings, milestone birthdays, and formal dinners want an aesthetic that signals sophistication without requiring a graphic designer. Paperless Post's pricing model ($0.13-0.48 per guest) creates a massive opportunity -- we offer equivalent or superior design quality at zero cost.

### Key Design Principles

1. **Typography is the ornament.** No decorative illustrations needed -- the type treatment IS the decoration.
2. **Centered everything.** This is the single biggest structural difference from other categories.
3. **Restraint signals luxury.** Less color, less motion, less density = more elegance.
4. **Formality demands commitment.** No "Maybe" RSVP option. You accept or you decline.
5. **Wide tracking is the signature move.** Generous letter-spacing on display text is what makes this feel like real stationery.

---

## 2. Reference Products & Designs

### 2.1 Paperless Post -- Digital Stationery Leader

**What we take**: The principle that digital invitations can feel as premium as physical ones. Their typography-forward "Quiet Luxury" collection proves that centered serif type on restrained backgrounds communicates formality without illustration. Their 2026 wedding trends report confirms: pared-back serif fonts, ample negative space, blind embossing effects, "quiet luxury" as the dominant aesthetic.

**What we improve**: They charge per guest. We don't. Their interactivity is limited -- ours includes RSVP, ticketing, gallery, comments. Their dark mode options are nonexistent.

### 2.2 Bella Figura -- Letterpress Stationery

**What we take**: Their signature use of centered composition, generous negative space, and the interplay between serif headlines and clean informational text. Their letterpress designs feature minimal layouts where typography and paper quality carry the entire design -- no clipart, no patterns, just craft. The concept that deliberate spacing creates sophistication.

**What we improve**: Physical stationery can't be edited after printing, can't collect RSVPs, can't update guest counts in real-time.

### 2.3 Traditional Engraved Stationery (Crane & Co., Smythson)

**What we take**: The visual language of all-caps with generous letter-spacing (the "engraved" look). The convention of formal language ("The pleasure of your company is requested"). The restrained use of 1-2 colors maximum. The near-square proportions of formal reply cards (informing our button border-radius). The concept that a border or rule, however thin, elevates the presentation.

### 2.4 Vogue / Harper's Bazaar Editorial Typography

**What we take**: The high-contrast Didone serifs (Bodoni, Didot) at large scale with extreme tracking. Fashion editorial proves that serif type with generous letter-spacing reads as luxurious on screens, not just paper. The restraint of black-on-white (or white-on-black) as a power statement.

### 2.5 The Standard Hotels / Aman Resorts -- Digital Luxury

**What we take**: How luxury hospitality brands translate formality to screens. Light font weights (300-400), generous padding (40px+), centered layouts, muted color palettes with a single accent. Their web presence proves that "formal" and "digital" are not contradictions.

---

## 3. Heading Font -- Display Serif

### Font Selection: Cormorant Garamond

**Google Fonts URL**: `https://fonts.google.com/specimen/Cormorant+Garamond`

**Why Cormorant Garamond over alternatives**:

| Candidate | Verdict | Reason |
|-----------|---------|--------|
| **Cormorant Garamond** | **SELECTED** | High-contrast display serif inspired by Claude Garamond. Razor-sharp serifs, elegant proportions, excellent at large sizes. Looks stunning in CAPS with wide tracking. Light weights available (300) for the restrained feel we need. Variable font support. |
| Playfair Display | Rejected | Excellent high-contrast serif, but overused in the wedding space to the point of cliche. Every Canva wedding template uses Playfair. We need to feel premium, not templated. |
| Bodoni Moda | Rejected | Beautiful Didone, but the extreme stroke contrast can cause legibility issues at smaller sizes and on low-DPI screens. Hairline strokes disappear. Cormorant has enough contrast for elegance without the legibility risk. |
| EB Garamond | Rejected | Excellent text face, but designed for body copy, not display. Lacks the dramatic presence we need at large sizes. Too understated for hero treatment. |

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap" rel="stylesheet">
```

### Specification

```
font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif
```

| Property | Value | Usage |
|----------|-------|-------|
| Weight 300 (Light) | Event titles, hero display | The primary weight. Light weight with wide tracking = the signature Elegant look. |
| Weight 400 (Regular) | Section headings, subtitles | Slightly more presence for secondary headings. |
| Weight 500 (Medium) | Emphasis within headings (rare) | Sparingly, for moments needing more weight without going bold. |
| Weight 300 Italic | Occasion/subtitle field | "An Evening of..." or "Dinner Celebration" -- italic adds a calligraphic touch. |

**Recommended size range**: 20px minimum (this is a display face -- never use below 18px). Sweet spot for event titles: 36-44px on mobile, 48-56px on desktop.

**Critical CSS treatment for display text**:
```css
.elegant-display {
  font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  font-weight: 300;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
}
```

---

## 4. Body Font -- Elegant Sans-Serif

### Font Selection: Raleway

**Google Fonts URL**: `https://fonts.google.com/specimen/Raleway`

**Why Raleway over alternatives**:

| Candidate | Verdict | Reason |
|-----------|---------|--------|
| **Raleway** | **SELECTED** | Geometric sans-serif with elegant proportions. Originally designed as a single Thin weight -- elegance is in its DNA. The Light (300) and Regular (400) weights feel airy and refined. Pairs classically with Cormorant Garamond (established, widely-recommended pairing). Wide character set, excellent readability at body sizes. |
| Montserrat | Rejected | More geometric and sturdy. Feels more "modern startup" than "formal stationery." Lacks the delicacy Raleway brings. |
| Work Sans | Rejected | Good utility sans, but too neutral. Doesn't elevate the design -- it recedes. We need the body font to carry some of the elegance. |
| Outfit | Rejected | Slightly rounded terminals feel too casual for the Elegant category. |

### Font Loading

```html
<link href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet">
```

### Specification

```
font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
```

| Property | Value | Usage |
|----------|-------|-------|
| Weight 300 (Light) | Metadata labels, captions, formal small text | The "stationery" weight for small informational text. |
| Weight 400 (Regular) | Body text, descriptions, general content | Primary body weight. |
| Weight 500 (Medium) | Button labels, emphasized body text | Slight emphasis without boldness. |
| Weight 600 (SemiBold) | Never used for body -- reserved for rare emphasis | Elegant avoids bold. If something needs emphasis, use tracking or size, not weight. |

**Default body size**: 16px
**Default line-height**: 1.70 (generous -- text should breathe)

---

## 5. Type Scale

Every value is exact. No ranges.

### Event Title (Hero Display)

```css
.elegant-event-title {
  font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  font-size: 40px;           /* Mobile: 375px base */
  font-weight: 300;
  line-height: 1.15;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
}

/* Desktop (640px+) */
@media (min-width: 640px) {
  .elegant-event-title {
    font-size: 52px;
  }
}
```

### Subtitle / Occasion ("An Evening of..." / "Dinner Celebration")

This field is UNIQUE to the Elegant category. Other categories do not display an occasion subtitle.

```css
.elegant-subtitle {
  font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  font-size: 20px;
  font-weight: 300;
  font-style: italic;
  line-height: 1.40;
  letter-spacing: 0.04em;
  text-transform: none;       /* Mixed case, NOT uppercase */
  text-align: center;
}

@media (min-width: 640px) {
  .elegant-subtitle {
    font-size: 24px;
  }
}
```

### Section Heading ("Details" / "Location" / "Guest List")

```css
.elegant-section-heading {
  font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.20;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-align: center;
}

@media (min-width: 640px) {
  .elegant-section-heading {
    font-size: 15px;
  }
}
```

### Body Text

```css
.elegant-body {
  font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.70;
  letter-spacing: 0.01em;
  text-transform: none;
  text-align: center;
}
```

### Caption / Metadata (timestamps, counts, secondary info)

```css
.elegant-caption {
  font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 300;
  line-height: 1.50;
  letter-spacing: 0.03em;
  text-transform: none;
  text-align: center;
}
```

### Label Text (form labels, small headings within sections)

```css
.elegant-label {
  font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.30;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  text-align: center;
}
```

### Host Attribution

```css
.elegant-host-attribution {
  font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  font-size: 16px;
  font-weight: 300;
  font-style: italic;
  line-height: 1.50;
  letter-spacing: 0.02em;
  text-transform: none;
  text-align: center;
}

@media (min-width: 640px) {
  .elegant-host-attribution {
    font-size: 18px;
  }
}
```

### Date & Time Display (Formal)

```css
.elegant-date {
  font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.40;
  letter-spacing: 0.06em;
  text-transform: none;       /* Mixed case: "Saturday, the seventh of March" */
  text-align: center;
}

@media (min-width: 640px) {
  .elegant-date {
    font-size: 20px;
  }
}
```

### Complete Type Scale Summary

| Role | Font | Size (mobile) | Size (desktop) | Weight | Line-Height | Letter-Spacing | Transform |
|------|------|---------------|----------------|--------|-------------|----------------|-----------|
| Event title | Cormorant Garamond | 40px | 52px | 300 | 1.15 | 0.08em | uppercase |
| Subtitle/occasion | Cormorant Garamond | 20px | 24px | 300 italic | 1.40 | 0.04em | none |
| Section heading | Cormorant Garamond | 14px | 15px | 400 | 1.20 | 0.12em | uppercase |
| Date/time | Cormorant Garamond | 18px | 20px | 400 | 1.40 | 0.06em | none |
| Host attribution | Cormorant Garamond | 16px | 18px | 300 italic | 1.50 | 0.02em | none |
| Body text | Raleway | 16px | 16px | 400 | 1.70 | 0.01em | none |
| Caption/metadata | Raleway | 13px | 13px | 300 | 1.50 | 0.03em | none |
| Label | Raleway | 11px | 11px | 500 | 1.30 | 0.10em | uppercase |
| Button label | Raleway | 13px | 13px | 500 | 1.00 | 0.10em | uppercase |

---

## 6. Spacing Scale

Elegant uses the MOST GENEROUS spacing of all four aesthetic categories. The negative space IS the design.

### Page Layout Spacing

| Token | Value (mobile 375px) | Value (desktop 640px+) | Purpose |
|-------|---------------------|----------------------|---------|
| `--page-padding-x` | 32px | 64px | Horizontal page padding. Creates the "frame" effect. MOST generous of all categories. |
| `--page-padding-top` | 48px | 72px | Top padding before first content. |
| `--page-max-width` | 100% | 560px | Content max-width. Narrow -- Elegant does NOT fill the screen. |
| `--section-gap` | 48px | 64px | Vertical space between major sections (title, details, RSVP, etc.). |
| `--row-gap` | 16px | 20px | Vertical space between items within a section (e.g., date row, location row). |
| `--element-gap` | 8px | 10px | Space between tightly related elements (icon + text, label + value). |
| `--card-padding` | 24px | 32px | Internal padding of card/container elements. |
| `--ornament-margin` | 32px | 40px | Vertical space above/below ornamental rule dividers. |

### Spacing Rationale

The key insight is that Elegant pages should feel like a printed invitation with generous margins. On a 375px mobile screen, 32px of left/right padding leaves only 311px of content width. This is intentional -- the content sits in a narrow, centered column with the "paper" framing it on both sides.

On desktop, the 560px max-width with 64px padding creates an even more dramatic centered column, as if the content is a single sheet of stationery centered on a desk.

### Spacing Scale (Exact Values)

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;
  --space-11: 80px;
  --space-12: 96px;
}
```

---

## 7. Button Specification -- Ghost/Outline Style

This is the MOST differentiated component in the Elegant category. While other categories use filled buttons, Elegant uses **ghost (outline) buttons** as the primary CTA. This is the single most recognizable visual signal of "formal" digital design.

### Primary CTA Button ("Accept with Pleasure")

```css
.elegant-btn-primary {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  min-width: 220px;
  padding: 0 32px;

  /* Typography */
  font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  text-align: center;

  /* Visual -- GHOST STYLE */
  background: transparent;
  color: var(--color-accent);
  border: 1.5px solid var(--color-accent);
  border-radius: 3px;        /* Near-square. NOT pill. NOT zero. */

  /* Interaction */
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0);
}

.elegant-btn-primary:hover {
  background: var(--color-accent);
  color: var(--color-accent-fg);
  border-color: var(--color-accent);
}

.elegant-btn-primary:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
}

.elegant-btn-primary:active {
  transform: scale(0.98);
  transition-duration: 100ms;
}
```

### Secondary Button ("Regretfully Decline")

```css
.elegant-btn-secondary {
  /* Layout */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  min-width: 200px;
  padding: 0 28px;

  /* Typography -- same as primary */
  font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.10em;
  text-transform: uppercase;
  text-align: center;

  /* Visual -- LIGHTER GHOST */
  background: transparent;
  color: var(--color-fg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 3px;

  /* Interaction */
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0);
}

.elegant-btn-secondary:hover {
  color: var(--color-fg);
  border-color: var(--color-fg-secondary);
}
```

### Button Design Notes

- **NO "Maybe" button.** The Elegant category demands a decision. Formality does not accommodate ambiguity.
- **NO pill border-radius.** Pill shapes signal casual/playful. The near-square 3px radius signals architectural precision.
- **NO filled primary.** The ghost/outline treatment is the defining visual move of the Elegant category. On hover, the fill appears -- this creates a satisfying "ink flooding" effect.
- **Button label tracking** (0.10em) matches section headings. This creates typographic cohesion.
- **Border width**: Primary = 1.5px (noticeable, intentional). Secondary = 1px (recedes slightly).

### Button Size Variants

| Variant | Height | Min-Width | Padding | Font Size |
|---------|--------|-----------|---------|-----------|
| Default | 48px | 220px | 0 32px | 13px |
| Small | 40px | 160px | 0 24px | 12px |
| Full-width (mobile) | 48px | 100% | 0 32px | 13px |

---

## 8. Color Palettes

The Elegant category ships with 4 named palettes. All colors are in OKLCH. Saturation is deliberately RESTRAINED -- muted, sophisticated, never vibrant.

### Color Token Contract

Every palette defines these tokens in both light and dark modes:

```
--color-bg            Page/body background
--color-surface       Card/container background
--color-surface-hover Hovered card/container
--color-fg            Primary text
--color-fg-secondary  Secondary text (dates, metadata)
--color-fg-tertiary   Tertiary text (fine print, disabled)
--color-accent        Primary action color (button borders, links)
--color-accent-hover  Accent on hover
--color-accent-fg     Text on filled accent backgrounds
--color-divider       Ornamental rule color
--color-border        Card/container borders
--color-error         Error states
--color-success       Success states (confirmation)
```

---

### 8.1 Palette: "Ivory" (Default)

**Character**: Classic wedding stationery. Cream paper in light mode, formal charcoal in dark mode. Muted sage-gold accent -- the color of aged brass on an heirloom picture frame.

**Default mode**: Light (formal stationery is traditionally light)

#### Ivory -- Light Mode

```css
[data-aesthetic="elegant"][data-palette="ivory"][data-mode="light"] {
  --color-bg:             oklch(0.975 0.008 85);   /* Warm ivory -- like cotton stationery paper */
  --color-surface:        oklch(0.99 0.005 85);    /* Slightly brighter card surface */
  --color-surface-hover:  oklch(0.96 0.010 85);    /* Hover: slightly deeper cream */
  --color-fg:             oklch(0.22 0.015 55);    /* Deep warm brown-black -- NOT pure black */
  --color-fg-secondary:   oklch(0.42 0.012 55);    /* Warm medium brown */
  --color-fg-tertiary:    oklch(0.58 0.010 55);    /* Muted warm brown */
  --color-accent:         oklch(0.52 0.06 145);    /* Muted sage green -- like dried eucalyptus */
  --color-accent-hover:   oklch(0.45 0.07 145);    /* Darker on hover */
  --color-accent-fg:      oklch(0.98 0.005 85);    /* Cream text on sage fill */
  --color-divider:        oklch(0.78 0.015 55);    /* Warm gray ornamental rules */
  --color-border:         oklch(0.88 0.010 55);    /* Subtle warm gray borders */
  --color-error:          oklch(0.55 0.14 25);     /* Warm muted red-orange */
  --color-success:        oklch(0.52 0.08 145);    /* Same sage as accent */
}
```

**Contrast verification (Light):**
- fg on bg: L diff = 0.755 (0.975 - 0.22) >> 4.5:1
- fg-secondary on bg: L diff = 0.555 (0.975 - 0.42) >> 4.5:1
- fg-tertiary on bg: L diff = 0.395 (0.975 - 0.58) >= 3:1
- accent on bg: L diff = 0.455 (0.975 - 0.52) >= 3:1
- accent-fg on accent: L diff = 0.46 (0.98 - 0.52) >= 4.5:1

#### Ivory -- Dark Mode

```css
[data-aesthetic="elegant"][data-palette="ivory"][data-mode="dark"] {
  --color-bg:             oklch(0.155 0.008 55);   /* Deep charcoal with warm undertone */
  --color-surface:        oklch(0.185 0.008 55);   /* Elevated surface */
  --color-surface-hover:  oklch(0.215 0.010 55);   /* Hover: slightly lighter */
  --color-fg:             oklch(0.92 0.012 70);    /* Warm off-white -- like parchment */
  --color-fg-secondary:   oklch(0.72 0.010 60);    /* Warm medium gray */
  --color-fg-tertiary:    oklch(0.55 0.008 60);    /* Muted warm gray */
  --color-accent:         oklch(0.68 0.06 145);    /* Sage green, lighter for dark bg */
  --color-accent-hover:   oklch(0.74 0.07 145);    /* Brighter on hover */
  --color-accent-fg:      oklch(0.15 0.015 145);   /* Dark text on sage fill */
  --color-divider:        oklch(0.35 0.010 55);    /* Subtle warm gray rules */
  --color-border:         oklch(0.28 0.008 55);    /* Warm dark gray borders */
  --color-error:          oklch(0.68 0.14 25);     /* Warm muted orange-red */
  --color-success:        oklch(0.68 0.08 145);    /* Same sage as accent */
}
```

**Contrast verification (Dark):**
- fg on bg: L diff = 0.765 (0.92 - 0.155) >> 4.5:1
- fg-secondary on bg: L diff = 0.565 (0.72 - 0.155) >> 4.5:1
- fg-tertiary on bg: L diff = 0.395 (0.55 - 0.155) >= 3:1
- accent on bg: L diff = 0.525 (0.68 - 0.155) >= 3:1
- accent-fg on accent: L diff = 0.53 (0.68 - 0.15) >= 4.5:1

---

### 8.2 Palette: "Champagne"

**Character**: Warm metallics, luxe celebration. Think champagne flutes catching candlelight, brushed gold leaf on a menu card. The warmest of the Elegant palettes.

**Default mode**: Dark (evening celebrations, candlelit warmth)

#### Champagne -- Light Mode

```css
[data-aesthetic="elegant"][data-palette="champagne"][data-mode="light"] {
  --color-bg:             oklch(0.97 0.010 75);    /* Warm cream with gold undertone */
  --color-surface:        oklch(0.985 0.007 75);   /* Brighter warm surface */
  --color-surface-hover:  oklch(0.955 0.012 75);   /* Deeper cream on hover */
  --color-fg:             oklch(0.20 0.015 50);    /* Deep warm sepia-brown */
  --color-fg-secondary:   oklch(0.40 0.015 50);    /* Medium sepia */
  --color-fg-tertiary:    oklch(0.56 0.012 50);    /* Muted sepia */
  --color-accent:         oklch(0.52 0.08 75);     /* Muted gold -- like brushed brass */
  --color-accent-hover:   oklch(0.46 0.09 75);     /* Deeper gold on hover */
  --color-accent-fg:      oklch(0.98 0.005 75);    /* Cream on gold fill */
  --color-divider:        oklch(0.76 0.020 65);    /* Warm gold-gray rule */
  --color-border:         oklch(0.86 0.015 65);    /* Warm golden border */
  --color-error:          oklch(0.55 0.14 25);     /* Warm orange-red */
  --color-success:        oklch(0.52 0.08 145);    /* Sage green success */
}
```

**Contrast verification (Light):**
- fg on bg: L diff = 0.77 (0.97 - 0.20) >> 4.5:1
- fg-secondary on bg: L diff = 0.57 (0.97 - 0.40) >> 4.5:1
- fg-tertiary on bg: L diff = 0.41 (0.97 - 0.56) >= 3:1
- accent on bg: L diff = 0.45 (0.97 - 0.52) >= 3:1
- accent-fg on accent: L diff = 0.46 (0.98 - 0.52) >= 4.5:1

#### Champagne -- Dark Mode

```css
[data-aesthetic="elegant"][data-palette="champagne"][data-mode="dark"] {
  --color-bg:             oklch(0.14 0.010 50);    /* Deep warm brown-black */
  --color-surface:        oklch(0.17 0.010 50);    /* Warmer elevated surface */
  --color-surface-hover:  oklch(0.20 0.012 50);    /* Lighter on hover */
  --color-fg:             oklch(0.91 0.015 70);    /* Warm parchment white */
  --color-fg-secondary:   oklch(0.70 0.012 60);    /* Warm medium tone */
  --color-fg-tertiary:    oklch(0.53 0.010 60);    /* Muted warm gray */
  --color-accent:         oklch(0.72 0.10 75);     /* Bright muted gold */
  --color-accent-hover:   oklch(0.78 0.11 75);     /* Lighter gold on hover */
  --color-accent-fg:      oklch(0.14 0.02 75);     /* Dark on gold fill */
  --color-divider:        oklch(0.34 0.015 55);    /* Subtle warm golden rule */
  --color-border:         oklch(0.27 0.010 55);    /* Deep warm border */
  --color-error:          oklch(0.68 0.14 25);     /* Warm orange-red */
  --color-success:        oklch(0.68 0.08 145);    /* Sage green */
}
```

**Contrast verification (Dark):**
- fg on bg: L diff = 0.77 (0.91 - 0.14) >> 4.5:1
- fg-secondary on bg: L diff = 0.56 (0.70 - 0.14) >> 4.5:1
- fg-tertiary on bg: L diff = 0.39 (0.53 - 0.14) >= 3:1
- accent on bg: L diff = 0.58 (0.72 - 0.14) >= 3:1
- accent-fg on accent: L diff = 0.58 (0.72 - 0.14) >= 4.5:1

---

### 8.3 Palette: "Midnight"

**Character**: Deep navy, classic formal. Think a black-tie dinner menu printed on midnight blue stock with silver foil lettering. The most traditionally "formal" of all four palettes.

**Default mode**: Dark (midnight is definitionally dark)

#### Midnight -- Light Mode

```css
[data-aesthetic="elegant"][data-palette="midnight"][data-mode="light"] {
  --color-bg:             oklch(0.97 0.006 250);   /* Cool blue-white -- like fine laid paper */
  --color-surface:        oklch(0.985 0.004 250);  /* Bright cool surface */
  --color-surface-hover:  oklch(0.955 0.008 250);  /* Slight blue tint on hover */
  --color-fg:             oklch(0.18 0.025 250);   /* Deep navy text */
  --color-fg-secondary:   oklch(0.40 0.018 250);   /* Medium navy */
  --color-fg-tertiary:    oklch(0.56 0.014 250);   /* Muted blue-gray */
  --color-accent:         oklch(0.48 0.04 250);    /* Muted navy-blue -- deeply restrained */
  --color-accent-hover:   oklch(0.42 0.05 250);    /* Darker navy on hover */
  --color-accent-fg:      oklch(0.97 0.004 250);   /* Cool white on navy fill */
  --color-divider:        oklch(0.78 0.010 250);   /* Cool gray-blue rule */
  --color-border:         oklch(0.88 0.008 250);   /* Subtle cool border */
  --color-error:          oklch(0.55 0.14 25);     /* Warm red-orange */
  --color-success:        oklch(0.52 0.06 145);    /* Muted sage */
}
```

**Contrast verification (Light):**
- fg on bg: L diff = 0.79 (0.97 - 0.18) >> 4.5:1
- fg-secondary on bg: L diff = 0.57 (0.97 - 0.40) >> 4.5:1
- fg-tertiary on bg: L diff = 0.41 (0.97 - 0.56) >= 3:1
- accent on bg: L diff = 0.49 (0.97 - 0.48) >= 3:1
- accent-fg on accent: L diff = 0.49 (0.97 - 0.48) >= 4.5:1

#### Midnight -- Dark Mode

```css
[data-aesthetic="elegant"][data-palette="midnight"][data-mode="dark"] {
  --color-bg:             oklch(0.145 0.020 250);  /* Deep midnight navy */
  --color-surface:        oklch(0.175 0.020 250);  /* Elevated navy surface */
  --color-surface-hover:  oklch(0.205 0.022 250);  /* Lighter navy on hover */
  --color-fg:             oklch(0.93 0.008 250);   /* Cool silver-white text */
  --color-fg-secondary:   oklch(0.72 0.008 250);   /* Muted silver */
  --color-fg-tertiary:    oklch(0.55 0.006 250);   /* Quiet blue-gray */
  --color-accent:         oklch(0.72 0.04 250);    /* Pale silver-blue accent */
  --color-accent-hover:   oklch(0.78 0.05 250);    /* Brighter silver on hover */
  --color-accent-fg:      oklch(0.145 0.02 250);   /* Deep navy on silver fill */
  --color-divider:        oklch(0.32 0.012 250);   /* Subtle navy-gray rule */
  --color-border:         oklch(0.26 0.014 250);   /* Deep navy border */
  --color-error:          oklch(0.68 0.14 25);     /* Warm orange-red */
  --color-success:        oklch(0.68 0.06 145);    /* Sage green */
}
```

**Contrast verification (Dark):**
- fg on bg: L diff = 0.785 (0.93 - 0.145) >> 4.5:1
- fg-secondary on bg: L diff = 0.575 (0.72 - 0.145) >> 4.5:1
- fg-tertiary on bg: L diff = 0.405 (0.55 - 0.145) >= 3:1
- accent on bg: L diff = 0.575 (0.72 - 0.145) >= 3:1
- accent-fg on accent: L diff = 0.575 (0.72 - 0.145) >= 4.5:1

---

### 8.4 Palette: "Rose"

**Character**: Soft blush pink. A bridal shower, a christening, a spring garden wedding. The most delicate and romantic palette. Restrained -- this is NOT hot pink. Think dried roses, not fresh ones.

**Default mode**: Light (blush reads best on light backgrounds, like pink-tinted stationery)

#### Rose -- Light Mode

```css
[data-aesthetic="elegant"][data-palette="rose"][data-mode="light"] {
  --color-bg:             oklch(0.975 0.008 10);   /* Warm blush-tinted white */
  --color-surface:        oklch(0.99 0.005 10);    /* Barely-there blush surface */
  --color-surface-hover:  oklch(0.955 0.012 10);   /* Slightly deeper blush on hover */
  --color-fg:             oklch(0.22 0.012 350);   /* Deep warm plum-brown */
  --color-fg-secondary:   oklch(0.42 0.010 350);   /* Medium plum */
  --color-fg-tertiary:    oklch(0.58 0.008 350);   /* Muted rose-gray */
  --color-accent:         oklch(0.55 0.06 350);    /* Muted dusty rose */
  --color-accent-hover:   oklch(0.48 0.07 350);    /* Deeper rose on hover */
  --color-accent-fg:      oklch(0.98 0.005 10);    /* Blush white on rose fill */
  --color-divider:        oklch(0.80 0.012 350);   /* Soft rose-gray rule */
  --color-border:         oklch(0.88 0.008 350);   /* Subtle warm-rose border */
  --color-error:          oklch(0.55 0.14 25);     /* Warm orange-red */
  --color-success:        oklch(0.52 0.06 145);    /* Sage green */
}
```

**Contrast verification (Light):**
- fg on bg: L diff = 0.755 (0.975 - 0.22) >> 4.5:1
- fg-secondary on bg: L diff = 0.555 (0.975 - 0.42) >> 4.5:1
- fg-tertiary on bg: L diff = 0.395 (0.975 - 0.58) >= 3:1
- accent on bg: L diff = 0.425 (0.975 - 0.55) >= 3:1
- accent-fg on accent: L diff = 0.43 (0.98 - 0.55) >= 4.5:1

#### Rose -- Dark Mode

```css
[data-aesthetic="elegant"][data-palette="rose"][data-mode="dark"] {
  --color-bg:             oklch(0.155 0.010 350);  /* Deep plum-tinted charcoal */
  --color-surface:        oklch(0.185 0.010 350);  /* Elevated plum surface */
  --color-surface-hover:  oklch(0.215 0.012 350);  /* Lighter on hover */
  --color-fg:             oklch(0.92 0.008 10);    /* Warm blush-white */
  --color-fg-secondary:   oklch(0.72 0.008 350);   /* Muted rose-gray */
  --color-fg-tertiary:    oklch(0.55 0.006 350);   /* Quiet plum-gray */
  --color-accent:         oklch(0.70 0.07 350);    /* Brighter dusty rose */
  --color-accent-hover:   oklch(0.76 0.08 350);    /* Lighter rose on hover */
  --color-accent-fg:      oklch(0.155 0.015 350);  /* Deep plum on rose fill */
  --color-divider:        oklch(0.34 0.010 350);   /* Subtle plum-gray rule */
  --color-border:         oklch(0.27 0.008 350);   /* Deep plum border */
  --color-error:          oklch(0.68 0.14 25);     /* Warm orange-red */
  --color-success:        oklch(0.68 0.06 145);    /* Sage green */
}
```

**Contrast verification (Dark):**
- fg on bg: L diff = 0.765 (0.92 - 0.155) >> 4.5:1
- fg-secondary on bg: L diff = 0.565 (0.72 - 0.155) >> 4.5:1
- fg-tertiary on bg: L diff = 0.395 (0.55 - 0.155) >= 3:1
- accent on bg: L diff = 0.545 (0.70 - 0.155) >= 3:1
- accent-fg on accent: L diff = 0.545 (0.70 - 0.155) >= 4.5:1

---

### 8.5 Palette Summary

| Palette | Light BG | Dark BG | Accent | Default Mode | Best For |
|---------|----------|---------|--------|-------------|----------|
| Ivory | Warm cream | Warm charcoal | Muted sage | Light | Weddings, showers, graduations |
| Champagne | Golden cream | Deep brown-black | Brushed gold | Dark | Anniversaries, galas, rehearsal dinners |
| Midnight | Cool blue-white | Deep navy | Silver-blue | Dark | Black-tie events, formal dinners |
| Rose | Blush-tinted white | Plum charcoal | Dusty rose | Light | Bridal showers, christenings, spring events |

### Color Design Principles

1. **Chroma is RESTRAINED.** Accent chromas range 0.04-0.10 (vs. 0.12-0.22 in other categories). This is how elegance differs from vibrancy.
2. **Hue-match neutrals.** Every palette tints its neutrals (bg, surface, borders) with the accent's hue family. Ivory uses hue 55-85 (warm), Midnight uses hue 250 (cool blue), Rose uses hue 350 (warm pink). This creates chromatic cohesion.
3. **Light mode = quality paper.** Light backgrounds are warm off-whites (L: 0.97-0.975), never blue-white or pure white. They should feel like cotton rag paper.
4. **Dark mode = formal evening.** Dark backgrounds are rich and deep (L: 0.14-0.155), never cold or flat. They should feel like walking into a candlelit ballroom.
5. **Error color is warm across all palettes.** Even in the Midnight (cool) palette, errors use warm orange-red. This ensures errors feel urgent but not harsh.

---

## 9. Border Radius

Elegant avoids roundness. Roundness signals informality, playfulness, approachability. The Elegant category signals precision, architecture, and formality.

| Component | Border Radius | Rationale |
|-----------|--------------|-----------|
| Primary button | 3px | Near-square. Evokes the proportion of a formal reply card. |
| Secondary button | 3px | Same as primary -- consistency signals intention. |
| Card/container | 6px | Slightly softer than buttons, but still restrained. |
| Input fields | 3px | Matches button radius -- the form should feel cohesive. |
| Image containers | 4px | Barely rounded. If the host provides a cover image, it should feel like a photograph placed on stationery. |
| Avatar (if shown) | 50% (circle) | Avatars are the ONE exception -- circles are universal for profile images. |
| Popover/dropdown | 4px | Matches card treatment. |
| Badge/pill | 3px | NOT pill-shaped (unlike other categories). Even small elements stay near-square. |

### CSS Custom Property

```css
[data-aesthetic="elegant"] {
  --radius: 3px;
  --radius-card: 6px;
  --radius-image: 4px;
}
```

---

## 10. Divider/Separator Style -- Ornamental Rules

This is a KEY differentiator. Other categories use full-width hairline `<hr>` dividers. Elegant uses **short, centered ornamental rules** -- the digital equivalent of the decorative rules found on printed stationery.

### Primary Ornamental Rule

```css
.elegant-rule {
  display: block;
  width: 40%;                  /* NOT full-width. Centered, restrained. */
  max-width: 200px;            /* Cap width on wide screens */
  height: 1px;                 /* Hairline thin */
  margin: 40px auto;           /* Centered with generous vertical space */
  background: var(--color-divider);
  border: none;
  opacity: 0.6;
}
```

### Ornamental Rule with Center Dot

For more formal sections (between host attribution and details, for example):

```css
.elegant-rule-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 40px auto;
  width: 40%;
  max-width: 200px;
}

.elegant-rule-dot::before,
.elegant-rule-dot::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-divider);
  opacity: 0.6;
}

.elegant-rule-dot-center {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-divider);
  opacity: 0.6;
  flex-shrink: 0;
}
```

### Ornamental Rule with Diamond

An alternative to the dot, for more formal events:

```css
.elegant-rule-diamond {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 40px auto;
  width: 40%;
  max-width: 200px;
}

.elegant-rule-diamond::before,
.elegant-rule-diamond::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-divider);
  opacity: 0.6;
}

.elegant-rule-diamond-center {
  width: 6px;
  height: 6px;
  background: var(--color-divider);
  opacity: 0.6;
  transform: rotate(45deg);
  flex-shrink: 0;
}
```

### Divider Specifications

| Property | Value |
|----------|-------|
| Width | 40% of container (max 200px) |
| Thickness | 1px |
| Color | `var(--color-divider)` |
| Opacity | 0.6 |
| Vertical margin | 40px (mobile), 48px (desktop) |
| Centering | `margin: 0 auto` |
| Center element (optional) | 4px circle dot OR 6px rotated diamond |

### When to Use Each Variant

| Variant | Usage |
|---------|-------|
| Plain rule | Between most sections (details/location, location/RSVP) |
| Rule with dot | Between host attribution and event details (the "premiere" divider) |
| Rule with diamond | At the very top of the page, below the event title (the most formal position) |

---

## 11. Shadow System

Elegant uses MINIMAL shadows. The design philosophy is: if you need a shadow to create hierarchy, your spacing and borders are not doing their job.

### Shadow Specification

```css
[data-aesthetic="elegant"] {
  --shadow-sm: none;
  --shadow-md: 0 1px 3px oklch(0 0 0 / 4%);
  --shadow-lg: 0 2px 8px oklch(0 0 0 / 5%), 0 1px 2px oklch(0 0 0 / 3%);
}
```

### Shadow Usage Rules

| Component | Shadow | Notes |
|-----------|--------|-------|
| Cards/containers | `none` | Use border + spacing for hierarchy. No shadow. |
| Buttons | `none` | Ghost buttons with borders need no shadow. |
| Popovers/dropdowns | `--shadow-md` | The ONLY component that gets a noticeable shadow. |
| Modals | `--shadow-lg` | Subtle depth to separate from page. |
| Images | `none` | Images sit flat, defined by their border/padding. |
| Floating actions | `none` | Elegant avoids floating actions. |

### Dark Mode Shadow Adjustment

In dark mode, even the minimal shadows become nearly invisible. This is correct behavior -- dark mode Elegant relies entirely on surface color differentiation and borders.

```css
[data-aesthetic="elegant"][data-mode="dark"] {
  --shadow-md: 0 1px 3px oklch(0 0 0 / 8%);
  --shadow-lg: 0 2px 8px oklch(0 0 0 / 10%), 0 1px 2px oklch(0 0 0 / 6%);
}
```

---

## 12. Copy & Language -- Formal

The Elegant category uses **formal, traditional event language**. This is NOT just different words -- it is a fundamentally different communication register. Every string in the UI should feel like it was written by a wedding stationery calligrapher.

### RSVP Actions

| UI Element | Other Categories | Elegant Category |
|------------|-----------------|------------------|
| Accept RSVP | "I'm Going" | **"Accept with Pleasure"** |
| Decline RSVP | "Can't Go" | **"Regretfully Decline"** |
| Maybe RSVP | "Maybe" | **HIDDEN. Does not exist.** Formality demands a decision. |
| After accepting | "You're Going!" | **"Your attendance is confirmed"** |
| After declining | "Maybe next time" | **"Your regrets have been noted"** |

### Host Attribution

| Context | Other Categories | Elegant Category |
|---------|-----------------|------------------|
| Hosted by | "Hosted by Sarah" | **"The pleasure of your company is requested by Sarah Chen"** |
| Co-hosted | "Sarah & Tom" | **"Sarah Chen and Thomas Wright request the pleasure of your company"** |
| Short form (if space constrained) | "By Sarah" | **"Hosted by Sarah Chen"** |

### Date & Time Format

Formal stationery spells out dates and times entirely. No numerals.

| Component | Standard Format | Elegant Format |
|-----------|----------------|----------------|
| Full date | "Sat, Mar 7, 2026" | **"Saturday, the seventh of March"** |
| Year (if needed) | "2026" | **"Two thousand twenty-six"** |
| Time | "7:30 PM" | **"Half past seven in the evening"** |
| Time (on the hour) | "7:00 PM" | **"Seven o'clock in the evening"** |
| Time (quarter past) | "7:15 PM" | **"Quarter past seven in the evening"** |
| Time period | "AM/PM" | **"in the morning" / "in the afternoon" / "in the evening"** |

### Date/Time Conversion Rules

```
Hours:
  6:00 AM   -> "Six o'clock in the morning"
  11:00 AM  -> "Eleven o'clock in the morning"
  12:00 PM  -> "Noon"
  12:30 PM  -> "Half past noon"
  5:00 PM   -> "Five o'clock in the afternoon"
  6:00 PM   -> "Six o'clock in the evening"
  7:15 PM   -> "Quarter past seven in the evening"
  7:30 PM   -> "Half past seven in the evening"
  7:45 PM   -> "Quarter to eight in the evening"
  8:00 PM   -> "Eight o'clock in the evening"
  12:00 AM  -> "Midnight"

Day of month (ordinal words):
  1 -> "first", 2 -> "second", 3 -> "third", 4 -> "fourth",
  5 -> "fifth", 6 -> "sixth", 7 -> "seventh", 8 -> "eighth",
  9 -> "ninth", 10 -> "tenth", 11 -> "eleventh", 12 -> "twelfth",
  13 -> "thirteenth", ... 20 -> "twentieth",
  21 -> "twenty-first", 22 -> "twenty-second", ...
  30 -> "thirtieth", 31 -> "thirty-first"

Times that don't fall on :00, :15, :30, or :45:
  Fall back to "Seven-ten in the evening" or use closest quarter.
  Implementation recommendation: round to nearest quarter-hour for display.
```

### Subtitle / Occasion Field

This field is UNIQUE to the Elegant category. It appears between the host attribution and the event title, providing a formal occasion description.

| Examples |
|----------|
| "An Evening of Music and Wine" |
| "A Dinner Celebration" |
| "A Reception in Honour of" |
| "An Intimate Gathering" |
| "A Celebration of New Beginnings" |
| "An Evening Under the Stars" |

**Implementation**: This is an optional text field in the event creation form, visible ONLY when the Elegant aesthetic is selected. It renders in italic Cormorant Garamond between the ornamental rule and the event title.

### Guest Count Language

| Other Categories | Elegant Category |
|-----------------|------------------|
| "12 going" | **"Twelve guests attending"** |
| "5 spots left" | **"Five places remain"** |
| "RSVP by Mar 7" | **"Kindly reply by the seventh of March"** |
| "Event full" | **"Regretfully, this event has reached capacity"** |
| "Waitlisted" | **"You have been placed on the waiting list"** |

### Miscellaneous UI Labels

| Standard | Elegant |
|----------|---------|
| "Details" | **"Details"** (unchanged -- already formal) |
| "Location" | **"Venue"** |
| "Share" | **"Share This Invitation"** |
| "Edit Event" | **"Edit Invitation"** |
| "Comments" | **"Messages"** |
| "Add to Calendar" | **"Save to Calendar"** |
| "Get Tickets" | **"Reserve Your Place"** |
| "Sold Out" | **"Fully Reserved"** |
| "Free" | **"Complimentary"** |
| "Photo Gallery" | **"Gallery"** |
| "Guest List" | **"Attendees"** |

---

## 13. Layout Specification

### Text Alignment: CENTERED

This is the single biggest structural difference between Elegant and every other aesthetic category. ALL text is center-aligned. There is no left-aligned text in the Elegant layout (with the narrow exception of multi-paragraph event descriptions, which may left-align for readability on mobile).

### Page Structure (Top to Bottom)

```
[  48px top padding  ]

"The pleasure of your company is requested by"
[Host Name]

--- ornamental rule with diamond ---

[SUBTITLE: "A Dinner Celebration"]

[EVENT TITLE]
[IN LARGE TRACKED CAPS]

--- ornamental rule with dot ---

[Date in formal words]
[Time in formal words]

[Venue Name]
[Address]

--- ornamental rule ---

[Event description, centered]

--- ornamental rule ---

[ ACCEPT WITH PLEASURE ]    (ghost button)
[ Regretfully Decline ]     (ghost button, lighter)

[12 guests attending]

--- ornamental rule ---

[Additional sections: Gallery, Messages, etc.]

[  48px bottom padding  ]
```

### Cover Image Treatment

```css
.elegant-cover-image {
  /* NOT full-bleed. Contained with padding and border. */
  width: calc(100% - 16px);  /* 8px padding on each side */
  max-width: 480px;
  margin: 0 auto 32px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  padding: 6px;              /* Inner "mat" effect -- like a photograph in a frame */
  background: var(--color-surface);
}

.elegant-cover-image img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 2px;        /* Inner image radius */
}
```

**Cover image is OPTIONAL in Elegant.** Many formal invitations are typography-only. When present, the image is contained (never full-bleed) and framed with a subtle border, like a photograph mounted on a card.

### Layout Specifications

| Property | Value | Notes |
|----------|-------|-------|
| Text alignment | `center` | ALL text. The defining structural choice. |
| Cover image | Optional, contained (NOT full-bleed) | Padded, bordered, centered. |
| Info display | Centered, formal formatting | Dates/times in formal words. |
| Section separation | Ornamental centered rules | 40% width, centered, 40px margin. |
| Overall density | LOW | Generous spacing, narrow content column. |
| Host attribution | VISIBLE, formal, positioned at TOP | Before the title, not after. |
| Subtitle/occasion field | VISIBLE, YES | Unique to Elegant. Between host and title. |
| Guest avatars | HIDDEN | Formal events don't display guest photos. |
| Event wall/comments | HIDDEN by default | Can be enabled, but hidden as default for formality. |
| Guest count display | Text only, no bar/progress | "Twelve guests attending" -- no visual indicator. |
| "Maybe" option | HIDDEN | Does not exist in Elegant. |

### Content Max-Width

```css
.elegant-content {
  max-width: 560px;
  margin: 0 auto;
  padding: 48px 32px;
  text-align: center;
}

@media (min-width: 640px) {
  .elegant-content {
    padding: 72px 64px;
  }
}
```

### RSVP Button Layout

The two RSVP buttons stack vertically, centered, with the accept button on top:

```css
.elegant-rsvp-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 32px 0;
}
```

---

## 14. Animation & Motion

Elegant uses the MOST RESTRAINED motion of all aesthetic categories. Animation should feel effortless -- like a page slowly being revealed, not like content flying in.

### Core Principles

1. **Slow.** Everything is slower than other categories. Base duration is 400ms (vs. 300ms standard).
2. **Subtle.** Maximum translate distance is 10px (vs. 15-20px in other categories).
3. **Opacity only when possible.** Prefer pure fade-in over translate+fade.
4. **No particle effects.** No confetti, no sparkles, no parallax. These signal energy; Elegant signals calm.
5. **No stagger on load.** Elements fade in as groups, not individually. Staggering creates visual "drumming" that disrupts the stillness.

### Duration Tokens (Elegant Overrides)

```css
[data-aesthetic="elegant"] {
  --duration-instant:    120ms;   /* Slightly slower than base */
  --duration-fast:       250ms;   /* Micro-interactions */
  --duration-standard:   400ms;   /* Standard transitions -- 33% slower than other categories */
  --duration-emphasis:   600ms;   /* Deliberate, visible motion */
  --duration-lifecycle:  1000ms;  /* Content birth/death -- slow, dignified */
  --duration-ambient:    4000ms;  /* Breathing (if used at all) */
}
```

### Easing Curve

```css
[data-aesthetic="elegant"] {
  --ease-elegant: cubic-bezier(0.25, 0.0, 0.15, 1.0);
  /* Very gentle deceleration. No spring, no bounce, no overshoot. */
}
```

### Page Load Sequence

Unlike other categories which use a staggered GSAP timeline, Elegant uses a simple two-phase reveal:

```
Phase 1 (t=0):   Entire page fades in from opacity 0 to 1
                  Duration: 800ms
                  Easing: var(--ease-elegant)
                  translateY: 6px -> 0 (barely perceptible upward drift)

Phase 2 (t=400):  RSVP buttons fade in separately
                  Duration: 600ms
                  Easing: var(--ease-elegant)
                  opacity: 0 -> 1 (no translate)
```

That's it. Two phases. The entire content column appears as one piece, then the call-to-action fades in. No element-by-element stagger, no scroll-triggered reveals, no micro-animations.

### Scroll Behavior

```css
.elegant-page {
  scroll-behavior: smooth;
}
```

NO scroll-triggered animations. Content below the fold is already visible as the user scrolls. No `use:scrollReveal` -- this is the ONE category that does not use it. Content is simply present, like printed stationery.

### Hover Transitions

```css
.elegant-interactive {
  transition: all 250ms cubic-bezier(0.25, 0.0, 0.15, 1.0);
}
```

Hover effects are limited to:
- Button ghost->fill transition (the most dramatic interaction)
- Link color shift (subtle, same hue, different lightness)
- Border color intensification on focus

### What Elegant Does NOT Have

| Animation | Present in Other Categories | Elegant |
|-----------|---------------------------|---------|
| Scroll reveal | Yes | **NO** |
| Stagger children | Yes | **NO** |
| Parallax | Yes (cover image) | **NO** |
| Particle effects | Fun category | **NO** |
| Spring easing | Yes | **NO** |
| Scale transforms | Yes (button press) | **Minimal** (0.98 on :active only) |
| Ambient breathing | Yes (hero) | **NO** |
| Content typing effect | Fun category | **NO** |

---

## 15. Implementation Notes

### Integration with Existing Theme System

The Elegant aesthetic operates as a LAYER ABOVE the existing 10-theme system defined in `aesthetic-customization-spec-v2.md`. The relationship is:

```
Aesthetic Category (Simple | Fun | Warm | Elegant)
  -> Controls: layout, typography, spacing, buttons, component visibility, language, motion
  -> INDEPENDENT of: color palette

Color Palette (Ivory | Champagne | Midnight | Rose)
  -> Controls: all color tokens
  -> Maps to existing theme system (or extends it)
```

### New Data Attributes

```html
<!-- The aesthetic category controls structural decisions -->
<div data-aesthetic="elegant" data-palette="ivory" data-mode="light">
  <!-- Content renders with Elegant layout, Ivory colors, light mode -->
</div>
```

### Font Loading Strategy

Since Elegant uses DIFFERENT fonts from the base app (Cormorant Garamond + Raleway instead of Vollkorn + Manrope), fonts should be loaded conditionally:

```html
<!-- Only load Elegant fonts when the aesthetic is "elegant" -->
{#if aesthetic === 'elegant'}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Raleway:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap" rel="stylesheet">
{/if}
```

### CSS Custom Property Mapping

The Elegant aesthetic sets the shared `--font-heading`, `--font-body`, etc. properties that shadcn components already consume:

```css
[data-aesthetic="elegant"] {
  /* Font overrides */
  --font-heading: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-body: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight: 300;
  --heading-tracking: 0.08em;
  --heading-transform: uppercase;
  --body-line-height: 1.70;

  /* Structural overrides */
  --radius: 3px;
  --border-weight: 1px;
  --surface-grain: none;

  /* Shadow overrides */
  --shadow-color: oklch(0 0 0);
  --shadow-strength: 0.04;
}
```

### Date/Time Formatting Utility

A TypeScript utility function is needed to convert standard dates to formal written-out format:

```typescript
// $lib/utils/formal-date.ts
// This function converts a Date object to formal invitation language.
// Example: formatFormalDate(new Date('2026-03-07T19:30:00'))
// Returns: { date: "Saturday, the seventh of March", time: "Half past seven in the evening" }

export function formatFormalDate(date: Date): { date: string; time: string } {
  // Implementation needed -- convert day/month to ordinal words,
  // convert time to formal phrases per the conversion rules in Section 12.
}
```

### Database Schema Addition

The events table needs an `aesthetic` column (or the existing `theme` column needs to accommodate aesthetic categories):

```sql
-- Option A: New column for aesthetic category
ALTER TABLE events ADD COLUMN aesthetic TEXT DEFAULT 'simple';
-- Valid values: 'simple', 'fun', 'warm', 'elegant'
-- The existing 'theme' column maps to a palette within the category.

-- Option B: Palette within aesthetic
ALTER TABLE events ADD COLUMN palette TEXT;
-- For elegant: 'ivory', 'champagne', 'midnight', 'rose'
-- For other aesthetics: their respective palettes
```

### OG Image Generation

OG images for Elegant events must use:
- Cormorant Garamond for the title (loaded as a font file for satori)
- Raleway for metadata
- Centered text alignment
- The selected palette's colors
- Wide letter-spacing on the title
- No cover image in the OG card (typography-only for maximum elegance)

### Accessibility Notes

1. **Ghost buttons pass contrast** because the border (accent color) is the visual indicator, not a filled background. The accent-on-bg contrast ratio meets the 3:1 WCAG AA requirement for UI components in all palettes.
2. **Small caps label text** (11px) is the smallest text in the system. At 11px with weight 500, it meets the minimum size for auxiliary labels. Critical information is never displayed at this size.
3. **Formal language increases cognitive load.** "Accept with Pleasure" is longer than "I'm Going." Ensure button touch targets are large enough (48px height, 220px min-width) to accommodate the longer text.
4. **Centered text and readability.** Centered text is harder to read than left-aligned for paragraphs longer than 3 lines. For event descriptions exceeding 3 lines, consider a left-align override on mobile (while maintaining centered section headings).

---

## Appendix A: Quick Reference Card

```
ELEGANT AESTHETIC -- CHEAT SHEET

Fonts:      Cormorant Garamond (heading) + Raleway (body)
Title:      40px, weight 300, 0.08em tracking, UPPERCASE, centered
Buttons:    GHOST (outline), 1.5px border, 3px radius, 0.10em tracking
Colors:     RESTRAINED chroma (0.04-0.10). Warm off-whites. Deep warm darks.
Spacing:    MOST generous. 32px side padding, 48px section gaps, 560px max-width.
Shadows:    MINIMAL TO NONE. Use borders and spacing for hierarchy.
Dividers:   SHORT CENTERED RULES (40% width, dot/diamond center ornament).
Language:   FORMAL. "Accept with Pleasure." Dates in words. No "Maybe."
Layout:     CENTERED. Everything. Host attribution at top. No guest avatars.
Motion:     MOST RESTRAINED. 400ms base duration. Simple fade-in. No stagger.
Radius:     NEAR-SQUARE. 3px buttons, 6px cards. No pill shapes.

NO: Bold weights, vibrant colors, particle effects, scroll animations,
    pill buttons, full-width dividers, "Maybe" RSVP, guest avatars,
    left-aligned text, pure black, pure white.

YES: Light font weights, wide tracking, uppercase display, ghost buttons,
     ornamental rules, formal language, centered everything, generous spacing,
     warm off-whites, deep warm darks, deliberate restraint.
```

## Appendix B: Event Type Mapping for Elegant

When a host selects one of these event types, the Elegant aesthetic should be suggested (not forced):

```typescript
const ELEGANT_EVENT_TYPES = [
  'wedding',
  'bridal_shower',
  'baby_shower',
  'graduation',
  'cocktail_party',
  'rehearsal_dinner',
  'engagement_party',
  'anniversary',
  'gallery_opening',
  'charity_gala',
  'formal_dinner',
  'christening',
  'retirement',
  'award_ceremony'
];

const ELEGANT_PALETTE_DEFAULTS: Record<string, string> = {
  wedding:          'ivory',
  bridal_shower:    'rose',
  baby_shower:      'rose',
  graduation:       'midnight',
  cocktail_party:   'champagne',
  rehearsal_dinner: 'champagne',
  engagement_party: 'ivory',
  anniversary:      'champagne',
  gallery_opening:  'midnight',
  charity_gala:     'midnight',
  formal_dinner:    'champagne',
  christening:      'ivory',
  retirement:       'ivory',
  award_ceremony:   'midnight',
};
```
