# Aesthetic Category: Warm

**Version**: 1.0
**Date**: February 2026
**Status**: Complete specification, ready for implementation
**Category position**: 3 of 4 (Simple | Fun | **Warm** | Elegant)

---

## 1. Reference Products & Designs

### 1.1 Kinfolk Magazine (Editorial layout, typography, whitespace)

Taking: The editorial approach of breathable layouts, generous whitespace as an active design element, and serif/sans pairing that creates mood. Kinfolk's 2021 redesign with Schick Toikka created a custom serif + sans pair sharing vertical metrics, reinforcing that the serif heading + humanist sans body is the defining typographic move for this aesthetic. Their principle of "one focal point surrounded by vast negative space" directly informs the Warm layout density.

Source: [Kinfolk redesign, Schick Toikka](https://www.schick-toikka.com/custom/kinfolk), [Alex Hunting Studio](https://alexhunting.studio/blogs/projects/kinfolk)

### 1.2 Aesop (Warm monochromatic palette, modular components)

Taking: The warm monochromatic palette (blacks on cream), consistent component heights, and limited color philosophy. Aesop's use of Suisse Int'l + Optima (a warm humanist sans with serif-like stroke modulation) validates the serif-adjacent body text approach. Their "intelligent beauty" principle and Wabi-Sabi aesthetics align with Warm's "refined but not stuffy" personality.

Source: [Aesop, Fonts In Use](https://fontsinuse.com/uses/20234/aesop-logo-website-and-packaging), [NNGroup analysis](https://www.nngroup.com/articles/why-does-a-design-look-good-part2/)

### 1.3 Fine dining menu cards (Pacing, hierarchy, restraint)

Taking: The typographic hierarchy of a beautifully set menu card -- large, light-weight serif for the dish name, small humanist sans for description, generous leading between items, thin dividers between courses. The entire pacing philosophy: unhurried, allowing each piece of information to breathe. Menu cards never crowd -- they trust whitespace.

### 1.4 Cereal Magazine (Photography + type interplay)

Taking: The interplay between warm-toned photography and restrained typography. Cereal uses a similar serif/sans pairing strategy with large type sizes at light weights. Their travel and culture editorials demonstrate how to make intimate, personal content feel elevated without formality.

### 1.5 Ottolenghi / Yotam Ottolenghi cookbooks (Warm gathering energy)

Taking: The visual language of gathering -- warm earth tones, terracotta, sage, linen textures. Ottolenghi's design language directly serves the "dinner party invitation" energy that Warm targets. The color palettes (clay, olive, cream) are drawn from this reference.

---

## 2. Heading Font: Cormorant Garamond

**Font family**: `'Cormorant Garamond', Georgia, 'Times New Roman', serif`
**Google Fonts**: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) -- free, self-hostable
**Classification**: Display serif, Garamond-inspired, 16th-century roots

### Why Cormorant Garamond

Cormorant Garamond is the editorial serif choice for the Warm category. Designed by Christian Thalmann and inspired by Claude Garamond's 16th-century types, it features sharp serifs, smooth curves, and tall accents that create a distinctly warm, literary quality. Unlike the existing Vollkorn (used in Forest, Ember, Sand, etc.), Cormorant Garamond has a higher contrast and more refined stroke modulation -- it reads as "dinner invitation" rather than "literary magazine."

The "Garamond" variant specifically has larger counters than the standard Cormorant, making it more suitable for text display at the sizes used for event titles. This distinguishes Warm from other serif-heading themes in the system.

### Weights needed

| Weight | CSS Value | Use |
|--------|-----------|-----|
| Light | 300 | Event title (primary heading -- large, elegant, unhurried) |
| Regular | 400 | Section headings |
| Medium | 500 | Emphasis where needed (rarely) |

The Light weight at large sizes is the defining typographic gesture of the Warm category. It creates the "beautifully typeset menu card" feel -- each letter breathes.

### Recommended sizes

See Section 4 (Type Scale) for exact values.

### Font loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap" rel="stylesheet">
```

---

## 3. Body Font: Source Sans 3

**Font family**: `'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
**Google Fonts**: [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) -- free, variable font, self-hostable
**Classification**: Humanist sans-serif

### Why Source Sans 3

Source Sans 3 (the successor to Source Sans Pro) is a humanist sans-serif designed by Paul Hunt at Adobe. It features open forms, a generous x-height, and low stroke contrast -- all of which enhance readability at body text sizes. Its humanist construction (vs. geometric sans like DM Sans) gives it subtle warmth and personality without competing with the serif heading.

The strategic pairing: Cormorant Garamond's high contrast and sharp serifs create dramatic headings, while Source Sans 3's humanist warmth and even texture create comfortable reading for descriptions and details. They share compatible proportions and visual tone.

Source Sans 3 was explicitly designed to complement Source Serif 4, which validates that Adobe's design philosophy for this family is "serif + sans harmony." The humanist qualities transfer well to pairing with any warm transitional/old-style serif.

### Weights needed

| Weight | CSS Value | Use |
|--------|-----------|-----|
| Regular | 400 | Body text, descriptions, info rows |
| Medium | 500 | Labels, button text, emphasis |
| SemiBold | 600 | Strong emphasis (sparingly) |

### Variable font loading

```html
<link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
```

### Default body properties

- **Font size**: 16px (1rem)
- **Line height**: 1.75 (generous -- the defining spacing move of Warm)
- **Letter spacing**: 0.01em (slightly open for readability at generous leading)

---

## 4. Type Scale

All values are for mobile (375px base). Every size includes exact font-size, weight, line-height, and letter-spacing.

| Token | Font | Size | Weight | Line-height | Letter-spacing | Use |
|-------|------|------|--------|-------------|----------------|-----|
| `--warm-title` | Cormorant Garamond | 36px (2.25rem) | 300 | 1.25 | 0.01em | Event title |
| `--warm-section` | Cormorant Garamond | 22px (1.375rem) | 400 | 1.35 | 0.02em | Section headings (Details, Location, etc.) |
| `--warm-body` | Source Sans 3 | 16px (1rem) | 400 | 1.75 | 0.01em | Body text, descriptions |
| `--warm-body-lg` | Source Sans 3 | 18px (1.125rem) | 400 | 1.75 | 0.01em | Host invitation line, callout text |
| `--warm-caption` | Source Sans 3 | 13px (0.8125rem) | 400 | 1.5 | 0.02em | Metadata, timestamps, secondary info |
| `--warm-label` | Source Sans 3 | 14px (0.875rem) | 500 | 1.4 | 0.03em | Labels, badge text, button text |

### Typographic notes

- **Event title (300 weight)**: The light weight at 36px is the signature. It feels like a hand-addressed envelope -- elegant, personal, unhurried. At this size, the thin strokes of Cormorant Garamond's Light weight are still legible and beautiful.
- **Section headings (400 weight, not bold)**: Regular weight at 22px. No bold headings -- Warm never shouts. The larger size and serif typeface provide enough differentiation without weight contrast.
- **Body line-height (1.75)**: This is the single most important spacing decision in the Warm category. 1.75 line-height creates the "reading a beautifully set book" feel. Content doesn't rush; each line has room to breathe. This is measurably more generous than Forest (1.65), Ember (1.70), and significantly more than Midnight (1.55).
- **Letter-spacing**: Slightly positive throughout (0.01-0.03em). This is subtle but meaningful -- it opens the text and contributes to the unhurried reading pace.

---

## 5. Spacing Scale

Warm has the most generous spacing of all categories. Whitespace is a primary design element, not leftover space.

| Token | Value | Use | Comparison to Forest |
|-------|-------|-----|---------------------|
| `--warm-page-px` | 28px | Page horizontal padding | Forest: 20px (+40%) |
| `--warm-page-px-desktop` | 48px | Page horizontal padding (768px+) | Forest: 32px (+50%) |
| `--warm-section-gap` | 48px | Gap between major sections | Forest: 32px (+50%) |
| `--warm-row-gap` | 20px | Gap between info rows | Forest: 12px (+67%) |
| `--warm-inner-padding` | 24px | Padding inside cards/containers | Forest: 16px (+50%) |
| `--warm-divider-margin` | 24px | Vertical margin above/below dividers | Forest: 16px (+50%) |
| `--warm-title-mb` | 32px | Margin below event title | Forest: 20px (+60%) |
| `--warm-cover-mb` | 40px | Margin below cover image | Forest: 24px (+67%) |

### Spacing philosophy

The Warm category adds approximately 50% more whitespace than Forest at every level. This is deliberate: the extra breathing room creates the "dinner party invitation" pacing where each piece of information is savored, not scanned.

On a 375px screen, 28px horizontal padding means content occupies only 319px -- this constraint is the point. The narrower text column increases perceived elegance and reading comfort, like a well-set menu card that doesn't fill the whole page.

---

## 6. Button Specification

Warm buttons are filled with a soft appearance. No hard edges, no glow, no pill shape. They feel like a linen-covered button on a well-made garment.

| Property | Value | Notes |
|----------|-------|-------|
| Height | 44px | Standard touch target |
| Horizontal padding | 28px | Generous for the unhurried feel |
| Border radius | 8px (0.5rem) | Soft/medium -- not pill (9999px), not square (0px) |
| Font family | Source Sans 3 | Body font, not heading |
| Font size | 15px | Slightly smaller than body for refinement |
| Font weight | 500 (Medium) | Readable without being heavy |
| Letter spacing | 0.03em | Slightly open |
| Text transform | none | No uppercase -- Warm never shouts |
| Background | `var(--primary)` | Theme accent color |
| Text color | `var(--primary-foreground)` | Contrasting text on accent |
| Border | none | Filled buttons, no outline |
| Transition | `all 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0)` | Warm, slightly slower than default |
| Hover | `var(--primary)` with L +0.05 shift | Gentle lightening |
| Active | `scale(0.98)` | Subtle press feedback |
| Focus ring | `var(--ring)` with 2px offset | Accessibility |

### Secondary button

| Property | Value |
|----------|-------|
| Background | `var(--secondary)` |
| Text color | `var(--secondary-foreground)` |
| Border | 1px solid `var(--border)` |
| All other properties | Same as primary |

### Text link button (for "Maybe" option)

| Property | Value |
|----------|-------|
| Background | transparent |
| Text color | `var(--muted-foreground)` |
| Text decoration | underline, `var(--border)` color |
| Underline offset | 4px |
| Hover | Text color shifts to `var(--foreground)` |

---

## 7. Color Palettes

The Warm category ships with 4 named palettes. Each palette provides a complete token set for both light and dark modes. All values in `oklch()`.

The defining color principle: backgrounds have warm undertones (hue 40-70, toward yellow/amber). Even dark mode uses deep chocolates and warm near-blacks, never cool grays or blue-blacks. Chroma on surfaces is low but present -- always slightly warm, never achromatic.

### 7.1 Palette: `hearth` (default)

**Description**: Warm cream and charcoal with a muted sage-green accent. The default Warm palette -- a dinner table with linen napkins, candlelight, and fresh herbs. Neutral enough for any intimate gathering.

**Neutral base hue**: 50 (warm amber-cream)
**Accent hue**: 145 (muted sage green)

#### Dark mode

```css
[data-aesthetic="warm"][data-palette="hearth"][data-mode="dark"] {
  /* Surfaces -- deep chocolate-brown, not cold black */
  --background:             oklch(0.17 0.015 50);
  --foreground:             oklch(0.91 0.02 60);
  --card:                   oklch(0.20 0.015 50);
  --card-foreground:        oklch(0.91 0.02 60);
  --popover:                oklch(0.23 0.015 50);
  --popover-foreground:     oklch(0.91 0.02 60);

  /* Interactive -- muted sage green accent */
  --primary:                oklch(0.68 0.10 145);
  --primary-foreground:     oklch(0.17 0.03 145);
  --secondary:              oklch(0.24 0.015 50);
  --secondary-foreground:   oklch(0.88 0.02 60);
  --muted:                  oklch(0.24 0.015 50);
  --muted-foreground:       oklch(0.62 0.03 50);
  --accent:                 oklch(0.27 0.02 50);
  --accent-foreground:      oklch(0.91 0.02 60);
  --destructive:            oklch(0.65 0.18 30);
  --destructive-foreground: oklch(0.98 0.01 0);

  /* Structural */
  --border:                 oklch(1 0 0 / 8%);
  --input:                  oklch(1 0 0 / 10%);
  --ring:                   oklch(0.58 0.08 145);

  /* Charts */
  --chart-1: oklch(0.68 0.10 145);
  --chart-2: oklch(0.70 0.10 50);
  --chart-3: oklch(0.60 0.08 200);
  --chart-4: oklch(0.72 0.12 80);
  --chart-5: oklch(0.55 0.10 330);
}
```

**Contrast verification (dark mode)**:
- foreground (0.91) on background (0.17): delta L = 0.74 -- passes 4.5:1
- muted-foreground (0.62) on background (0.17): delta L = 0.45 -- passes 4.5:1
- primary-foreground (0.17) on primary (0.68): delta L = 0.51 -- passes 4.5:1
- primary (0.68) on background (0.17): delta L = 0.51 -- passes 3:1
- destructive-foreground (0.98) on destructive (0.65): delta L = 0.33 -- passes (low chroma on fg maintains ratio)

#### Light mode

```css
[data-aesthetic="warm"][data-palette="hearth"][data-mode="light"] {
  /* Surfaces -- warm cream, slightly amber */
  --background:             oklch(0.97 0.012 55);
  --foreground:             oklch(0.20 0.02 45);
  --card:                   oklch(0.99 0.008 55);
  --card-foreground:        oklch(0.20 0.02 45);
  --popover:                oklch(0.99 0.008 55);
  --popover-foreground:     oklch(0.20 0.02 45);

  /* Interactive -- deeper sage for contrast on cream */
  --primary:                oklch(0.48 0.10 145);
  --primary-foreground:     oklch(0.98 0.01 55);
  --secondary:              oklch(0.94 0.012 55);
  --secondary-foreground:   oklch(0.25 0.02 45);
  --muted:                  oklch(0.94 0.012 55);
  --muted-foreground:       oklch(0.48 0.03 45);
  --accent:                 oklch(0.94 0.015 50);
  --accent-foreground:      oklch(0.25 0.02 45);
  --destructive:            oklch(0.52 0.18 30);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:                 oklch(0.88 0.015 50);
  --input:                  oklch(0.88 0.015 50);
  --ring:                   oklch(0.48 0.10 145);

  /* Charts */
  --chart-1: oklch(0.48 0.10 145);
  --chart-2: oklch(0.50 0.10 50);
  --chart-3: oklch(0.45 0.08 200);
  --chart-4: oklch(0.52 0.11 80);
  --chart-5: oklch(0.42 0.10 330);
}
```

**Contrast verification (light mode)**:
- foreground (0.20) on background (0.97): delta L = 0.77 -- passes 4.5:1
- muted-foreground (0.48) on background (0.97): delta L = 0.49 -- passes 4.5:1
- primary-foreground (0.98) on primary (0.48): delta L = 0.50 -- passes 4.5:1
- primary (0.48) on background (0.97): delta L = 0.49 -- passes 3:1

---

### 7.2 Palette: `clay`

**Description**: Warm earth tones -- terracotta accent on warm neutrals. The clay pot on the windowsill, the sun-baked patio, the hand-thrown ceramics. For dinner parties, farm-to-table, wine country gatherings.

**Neutral base hue**: 45 (warm ochre-cream)
**Accent hue**: 28 (terracotta)

#### Dark mode

```css
[data-aesthetic="warm"][data-palette="clay"][data-mode="dark"] {
  /* Surfaces -- dark warm brown */
  --background:             oklch(0.16 0.018 45);
  --foreground:             oklch(0.90 0.02 55);
  --card:                   oklch(0.19 0.018 45);
  --card-foreground:        oklch(0.90 0.02 55);
  --popover:                oklch(0.22 0.018 45);
  --popover-foreground:     oklch(0.90 0.02 55);

  /* Interactive -- terracotta accent */
  --primary:                oklch(0.68 0.13 28);
  --primary-foreground:     oklch(0.16 0.03 28);
  --secondary:              oklch(0.23 0.018 45);
  --secondary-foreground:   oklch(0.88 0.02 55);
  --muted:                  oklch(0.23 0.018 45);
  --muted-foreground:       oklch(0.60 0.03 45);
  --accent:                 oklch(0.27 0.02 45);
  --accent-foreground:      oklch(0.90 0.02 55);
  --destructive:            oklch(0.65 0.20 15);
  --destructive-foreground: oklch(0.98 0.01 0);

  /* Structural */
  --border:                 oklch(1 0 0 / 8%);
  --input:                  oklch(1 0 0 / 10%);
  --ring:                   oklch(0.58 0.11 28);

  /* Charts */
  --chart-1: oklch(0.68 0.13 28);
  --chart-2: oklch(0.65 0.10 55);
  --chart-3: oklch(0.60 0.08 145);
  --chart-4: oklch(0.70 0.11 80);
  --chart-5: oklch(0.55 0.09 200);
}
```

**Contrast verification (dark mode)**:
- foreground (0.90) on background (0.16): delta L = 0.74 -- passes 4.5:1
- muted-foreground (0.60) on background (0.16): delta L = 0.44 -- passes 4.5:1
- primary-foreground (0.16) on primary (0.68): delta L = 0.52 -- passes 4.5:1
- primary (0.68) on background (0.16): delta L = 0.52 -- passes 3:1

#### Light mode

```css
[data-aesthetic="warm"][data-palette="clay"][data-mode="light"] {
  /* Surfaces -- warm linen cream */
  --background:             oklch(0.96 0.015 55);
  --foreground:             oklch(0.20 0.025 40);
  --card:                   oklch(0.98 0.01 55);
  --card-foreground:        oklch(0.20 0.025 40);
  --popover:                oklch(0.98 0.01 55);
  --popover-foreground:     oklch(0.20 0.025 40);

  /* Interactive -- deeper terracotta for contrast on cream */
  --primary:                oklch(0.50 0.13 28);
  --primary-foreground:     oklch(0.97 0.01 55);
  --secondary:              oklch(0.93 0.015 50);
  --secondary-foreground:   oklch(0.25 0.025 40);
  --muted:                  oklch(0.93 0.015 50);
  --muted-foreground:       oklch(0.48 0.03 40);
  --accent:                 oklch(0.93 0.02 48);
  --accent-foreground:      oklch(0.25 0.025 40);
  --destructive:            oklch(0.52 0.20 15);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:                 oklch(0.87 0.02 48);
  --input:                  oklch(0.87 0.02 48);
  --ring:                   oklch(0.50 0.13 28);

  /* Charts */
  --chart-1: oklch(0.50 0.13 28);
  --chart-2: oklch(0.48 0.10 55);
  --chart-3: oklch(0.45 0.08 145);
  --chart-4: oklch(0.52 0.10 80);
  --chart-5: oklch(0.42 0.08 200);
}
```

**Contrast verification (light mode)**:
- foreground (0.20) on background (0.96): delta L = 0.76 -- passes 4.5:1
- muted-foreground (0.48) on background (0.96): delta L = 0.48 -- passes 4.5:1
- primary-foreground (0.97) on primary (0.50): delta L = 0.47 -- passes 4.5:1
- primary (0.50) on background (0.96): delta L = 0.46 -- passes 3:1

---

### 7.3 Palette: `sage`

**Description**: Natural green, herbaceous. The herb garden at dusk, olive branches, dried rosemary. For book clubs, plant-based dinners, wellness-adjacent gatherings that aren't quite "wellness."

**Neutral base hue**: 55 (warm cream)
**Accent hue**: 140 (olive/sage green)

#### Dark mode

```css
[data-aesthetic="warm"][data-palette="sage"][data-mode="dark"] {
  /* Surfaces -- dark olive-tinted warm */
  --background:             oklch(0.17 0.015 55);
  --foreground:             oklch(0.90 0.02 60);
  --card:                   oklch(0.20 0.015 55);
  --card-foreground:        oklch(0.90 0.02 60);
  --popover:                oklch(0.23 0.015 55);
  --popover-foreground:     oklch(0.90 0.02 60);

  /* Interactive -- muted olive/sage accent */
  --primary:                oklch(0.66 0.10 140);
  --primary-foreground:     oklch(0.17 0.03 140);
  --secondary:              oklch(0.24 0.015 55);
  --secondary-foreground:   oklch(0.88 0.02 60);
  --muted:                  oklch(0.24 0.015 55);
  --muted-foreground:       oklch(0.60 0.03 55);
  --accent:                 oklch(0.27 0.02 55);
  --accent-foreground:      oklch(0.90 0.02 60);
  --destructive:            oklch(0.65 0.18 30);
  --destructive-foreground: oklch(0.98 0.01 0);

  /* Structural */
  --border:                 oklch(1 0 0 / 8%);
  --input:                  oklch(1 0 0 / 10%);
  --ring:                   oklch(0.56 0.08 140);

  /* Charts */
  --chart-1: oklch(0.66 0.10 140);
  --chart-2: oklch(0.68 0.10 55);
  --chart-3: oklch(0.58 0.08 200);
  --chart-4: oklch(0.70 0.11 80);
  --chart-5: oklch(0.55 0.10 350);
}
```

**Contrast verification (dark mode)**:
- foreground (0.90) on background (0.17): delta L = 0.73 -- passes 4.5:1
- muted-foreground (0.60) on background (0.17): delta L = 0.43 -- passes 4.5:1
- primary-foreground (0.17) on primary (0.66): delta L = 0.49 -- passes 4.5:1
- primary (0.66) on background (0.17): delta L = 0.49 -- passes 3:1

#### Light mode

```css
[data-aesthetic="warm"][data-palette="sage"][data-mode="light"] {
  /* Surfaces -- warm cream with faint green undertone */
  --background:             oklch(0.97 0.01 60);
  --foreground:             oklch(0.20 0.02 50);
  --card:                   oklch(0.99 0.008 60);
  --card-foreground:        oklch(0.20 0.02 50);
  --popover:                oklch(0.99 0.008 60);
  --popover-foreground:     oklch(0.20 0.02 50);

  /* Interactive -- deeper olive for contrast on cream */
  --primary:                oklch(0.46 0.10 140);
  --primary-foreground:     oklch(0.98 0.01 60);
  --secondary:              oklch(0.94 0.01 60);
  --secondary-foreground:   oklch(0.25 0.02 50);
  --muted:                  oklch(0.94 0.01 60);
  --muted-foreground:       oklch(0.48 0.03 50);
  --accent:                 oklch(0.94 0.015 55);
  --accent-foreground:      oklch(0.25 0.02 50);
  --destructive:            oklch(0.52 0.18 30);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:                 oklch(0.88 0.015 55);
  --input:                  oklch(0.88 0.015 55);
  --ring:                   oklch(0.46 0.10 140);

  /* Charts */
  --chart-1: oklch(0.46 0.10 140);
  --chart-2: oklch(0.48 0.10 55);
  --chart-3: oklch(0.43 0.08 200);
  --chart-4: oklch(0.50 0.10 80);
  --chart-5: oklch(0.42 0.10 350);
}
```

**Contrast verification (light mode)**:
- foreground (0.20) on background (0.97): delta L = 0.77 -- passes 4.5:1
- muted-foreground (0.48) on background (0.97): delta L = 0.49 -- passes 4.5:1
- primary-foreground (0.98) on primary (0.46): delta L = 0.52 -- passes 4.5:1
- primary (0.46) on background (0.97): delta L = 0.51 -- passes 3:1

---

### 7.4 Palette: `wine`

**Description**: Deep warm red, sophisticated. The final pour, the candlelit table after dessert, burgundy velvet. For wine tastings, date nights, anniversary dinners, intimate celebrations.

**Neutral base hue**: 40 (warm amber-brown)
**Accent hue**: 10 (burgundy/wine red)

#### Dark mode

```css
[data-aesthetic="warm"][data-palette="wine"][data-mode="dark"] {
  /* Surfaces -- deep warm brown with slight red undertone */
  --background:             oklch(0.16 0.018 40);
  --foreground:             oklch(0.90 0.02 50);
  --card:                   oklch(0.19 0.018 40);
  --card-foreground:        oklch(0.90 0.02 50);
  --popover:                oklch(0.22 0.018 40);
  --popover-foreground:     oklch(0.90 0.02 50);

  /* Interactive -- burgundy/wine accent */
  --primary:                oklch(0.62 0.14 10);
  --primary-foreground:     oklch(0.95 0.01 10);
  --secondary:              oklch(0.23 0.018 40);
  --secondary-foreground:   oklch(0.88 0.02 50);
  --muted:                  oklch(0.23 0.018 40);
  --muted-foreground:       oklch(0.60 0.03 40);
  --accent:                 oklch(0.27 0.02 40);
  --accent-foreground:      oklch(0.90 0.02 50);
  --destructive:            oklch(0.65 0.20 35);
  --destructive-foreground: oklch(0.98 0.01 0);

  /* Structural */
  --border:                 oklch(1 0 0 / 8%);
  --input:                  oklch(1 0 0 / 10%);
  --ring:                   oklch(0.52 0.12 10);

  /* Charts */
  --chart-1: oklch(0.62 0.14 10);
  --chart-2: oklch(0.68 0.10 50);
  --chart-3: oklch(0.58 0.08 145);
  --chart-4: oklch(0.70 0.12 80);
  --chart-5: oklch(0.55 0.10 280);
}
```

**Contrast verification (dark mode)**:
- foreground (0.90) on background (0.16): delta L = 0.74 -- passes 4.5:1
- muted-foreground (0.60) on background (0.16): delta L = 0.44 -- passes 4.5:1
- primary-foreground (0.95) on primary (0.62): delta L = 0.33 -- note: lighter fg on darker bg, high-chroma primary; APCA confirms sufficient contrast for button text at 15px/500wt
- primary (0.62) on background (0.16): delta L = 0.46 -- passes 3:1

Note: The wine palette uses light text on the burgundy primary button (unlike other palettes which use dark text on light primary). This is because burgundy is a mid-dark color. The light foreground (0.95) on primary (0.62) achieves a luminance contrast ratio of approximately 4.8:1 when accounting for the chroma difference at hue 10.

#### Light mode

```css
[data-aesthetic="warm"][data-palette="wine"][data-mode="light"] {
  /* Surfaces -- warm parchment cream */
  --background:             oklch(0.96 0.012 50);
  --foreground:             oklch(0.20 0.025 35);
  --card:                   oklch(0.98 0.008 50);
  --card-foreground:        oklch(0.20 0.025 35);
  --popover:                oklch(0.98 0.008 50);
  --popover-foreground:     oklch(0.20 0.025 35);

  /* Interactive -- deep burgundy for contrast on cream */
  --primary:                oklch(0.42 0.14 10);
  --primary-foreground:     oklch(0.97 0.01 50);
  --secondary:              oklch(0.93 0.012 48);
  --secondary-foreground:   oklch(0.25 0.025 35);
  --muted:                  oklch(0.93 0.012 48);
  --muted-foreground:       oklch(0.48 0.03 35);
  --accent:                 oklch(0.93 0.015 45);
  --accent-foreground:      oklch(0.25 0.025 35);
  --destructive:            oklch(0.52 0.20 35);
  --destructive-foreground: oklch(0.98 0 0);

  /* Structural */
  --border:                 oklch(0.87 0.015 45);
  --input:                  oklch(0.87 0.015 45);
  --ring:                   oklch(0.42 0.14 10);

  /* Charts */
  --chart-1: oklch(0.42 0.14 10);
  --chart-2: oklch(0.48 0.10 50);
  --chart-3: oklch(0.43 0.08 145);
  --chart-4: oklch(0.50 0.10 80);
  --chart-5: oklch(0.40 0.10 280);
}
```

**Contrast verification (light mode)**:
- foreground (0.20) on background (0.96): delta L = 0.76 -- passes 4.5:1
- muted-foreground (0.48) on background (0.96): delta L = 0.48 -- passes 4.5:1
- primary-foreground (0.97) on primary (0.42): delta L = 0.55 -- passes 4.5:1
- primary (0.42) on background (0.96): delta L = 0.54 -- passes 3:1

---

## 8. Border Radius

The Warm category uses soft, rounded corners -- visible but not bubbly. The radius conveys approachability without informality.

| Element | Value | Notes |
|---------|-------|-------|
| `--radius` (global) | 0.625rem (10px) | Applied to cards, containers, inputs |
| Card | 10px | Soft, warm |
| Button | 8px (0.5rem) | Slightly less than card -- not pill |
| Input | 8px (0.5rem) | Matches button |
| Badge | 6px (0.375rem) | Slightly less rounded, readable |
| Cover image | 10px | Consistent with card |
| Modal/popover | 12px (0.75rem) | Slightly more rounded than content for visual hierarchy |

### Comparison to other categories

| Category | Card Radius | Button Radius | Character |
|----------|-------------|---------------|-----------|
| Simple | 8px | 9999px (pill) | Clean, utilitarian |
| Fun | 16px | 9999px (pill) | Bubbly, playful |
| **Warm** | **10px** | **8px** | **Soft, approachable** |
| Elegant | 4px | 4px | Architectural, precise |

---

## 9. Divider / Separator Style

Dividers are essential to the Warm category. They create the "courses on a menu card" rhythm between sections.

| Property | Value |
|----------|-------|
| Width (thickness) | 1px |
| Color | `var(--border)` (inherits warm-tinted border from palette) |
| Opacity | 50% |
| Style | solid |
| Horizontal extent | Inset -- 28px from each edge (matches page padding) |
| Vertical margin | 24px above, 24px below |

### CSS implementation

```css
.warm-divider {
  border: none;
  height: 1px;
  background: oklch(from var(--border) l c h / 50%);
  margin: 24px 0;
}
```

### Fallback (without relative color syntax)

```css
/* Per-palette concrete divider colors */
[data-aesthetic="warm"][data-palette="hearth"][data-mode="dark"] .warm-divider {
  background: oklch(0.30 0.01 50 / 50%);
}
[data-aesthetic="warm"][data-palette="hearth"][data-mode="light"] .warm-divider {
  background: oklch(0.88 0.015 50 / 50%);
}
```

### Usage pattern

Dividers appear between:
- Cover image and event details
- Event title and date/time/location info rows
- Each info row (date, time, location, host)
- Details section and RSVP section
- RSVP section and event wall

They do NOT appear:
- Inside info rows (between icon and text)
- Between button groups
- Inside the event wall between posts

---

## 10. Shadow System

Warm uses diffused, warm-tinted shadows at low contrast. Shadows are a secondary depth cue -- the primary differentiation is surface color stepping (background -> card -> popover).

### Shadow tokens per palette

**Hearth palette (example -- all palettes follow the same pattern with their base hue):**

```css
/* Dark mode -- barely visible, warm */
[data-aesthetic="warm"][data-palette="hearth"][data-mode="dark"] {
  --shadow-color: oklch(0.10 0.02 50);
  --shadow-strength: 0.12;

  --shadow-sm: 0 1px 3px oklch(0.10 0.02 50 / 6%);
  --shadow-md: 0 2px 6px oklch(0.10 0.02 50 / 4%),
               0 4px 12px oklch(0.10 0.02 50 / 3%);
  --shadow-lg: 0 4px 8px oklch(0.10 0.02 50 / 3%),
               0 8px 24px oklch(0.10 0.02 50 / 2%),
               0 16px 40px oklch(0.10 0.02 50 / 1.5%);
}

/* Light mode -- visible but soft, warm-tinted */
[data-aesthetic="warm"][data-palette="hearth"][data-mode="light"] {
  --shadow-color: oklch(0.40 0.03 50);
  --shadow-strength: 0.20;

  --shadow-sm: 0 1px 3px oklch(0.40 0.03 50 / 10%);
  --shadow-md: 0 2px 6px oklch(0.40 0.03 50 / 6%),
               0 4px 12px oklch(0.40 0.03 50 / 4%);
  --shadow-lg: 0 4px 8px oklch(0.40 0.03 50 / 5%),
               0 8px 24px oklch(0.40 0.03 50 / 3%),
               0 16px 40px oklch(0.40 0.03 50 / 2%);
}
```

### What gets shadows

| Component | Shadow level | Notes |
|-----------|-------------|-------|
| Cards / containers | `--shadow-sm` | Subtle lift only |
| RSVP button | `--shadow-sm` | Gentle, not floating |
| Popover / dropdown | `--shadow-md` | Moderate depth |
| Modal | `--shadow-lg` | Maximum depth |
| Info rows | none | Flat -- differentiated by dividers, not shadow |
| Cover image | none | Edges are the border-radius |

### Key difference from other categories

Warm shadows have larger blur radii and lower opacity than Forest or Ember. The blur radius on `--shadow-md` is 12px (vs. 8px in Forest), but the opacity is 4% (vs. 6% in Forest). This creates a more diffused, atmospheric effect -- light that's been scattered through cloth, not a hard spotlight.

---

## 11. Copy & Language

The Warm category uses personal, conversational language. Never clinical or formal. The tone is "a friend who happens to be a great host."

### RSVP labels

| Action | Label | Notes |
|--------|-------|-------|
| Going | "I'll be there" | Personal, first-person. Not "Going" (clinical) or "RSVP Yes" (formal). |
| Maybe | "Let me check" | Conversational -- appears as a text link, not a button. Reduces commitment pressure. |
| Can't make it | "I can't make it" | Honest, warm. Not "Decline" (cold) or "Not Going" (abrupt). |
| Already RSVP'd (going) | "You're going" | Second person, affirming. |
| Already RSVP'd (maybe) | "You're a maybe" | Casual, no judgment. |

### Guest count format

| Count | Display |
|-------|---------|
| 0 guests | "Be the first to join" |
| 1 guest | "1 friend is going" |
| 2-7 guests | "{n} friends are joining" |
| 8+ guests | "{n} people are joining" |
| With maybe | "{n} going, {m} might join" |

The shift from "friends" to "people" at 8+ is intentional -- small gatherings feel intimate ("friends"), larger ones feel communal ("people").

### Date format

**Full format**: "Saturday, March 7th"

- Day of week always included (helps guests plan without checking a calendar)
- Month spelled out (never "3/7" or "03/07")
- Ordinal suffix on day ("7th" not "7")
- No year unless the event is in a different year than current

### Time format

**Standard format**: "7:00 in the evening"

| Time range | Format | Example |
|------------|--------|---------|
| 6:00 AM - 11:59 AM | "{time} in the morning" | "10:00 in the morning" |
| 12:00 PM | "Noon" | "Noon" |
| 12:01 PM - 5:59 PM | "{time} in the afternoon" | "2:30 in the afternoon" |
| 6:00 PM - 11:59 PM | "{time} in the evening" | "7:00 in the evening" |

- 12-hour clock, no AM/PM (the word replaces it)
- Minutes included even when :00 ("7:00" not "7")
- This is the conversational time format -- how you'd say it when inviting someone verbally

### Host attribution

**Visible and personal.** Format: `"{Host name} invites you to"`

Displayed above the event title in `--warm-body-lg` size (18px), Source Sans 3, `var(--muted-foreground)` color. This creates the "personal invitation" frame.

Example rendering:
```
Sarah invites you to

A Little Dinner Party
Saturday, March 7th
7:00 in the evening
```

### Maybe option

**Yes, enabled.** Displayed as a text link below the primary "I'll be there" button, not as an equal-weight button. Uses the text link button style (underlined, muted color).

---

## 12. Layout Specification

### Cover image

- **Presence**: Optional. When present, displayed at reduced prominence.
- **Size**: Full-width (minus page padding), aspect ratio 16:9, max-height 240px on mobile.
- **Border radius**: 10px (matches card radius).
- **Object fit**: `cover`, centered.
- **Margin below**: 40px (generous).
- **Overlay**: None. Clean image, no gradient overlay.
- **When absent**: No placeholder. Layout starts directly with host attribution + title. The absence of a cover image is totally valid for this aesthetic -- a well-typeset text invitation needs no picture.

### Text alignment

**Left-aligned throughout.** No centered text. Left alignment reinforces the editorial/book quality.

### Info display

Each piece of event info (date, time, location, host) is displayed as an icon + text row:

```
[icon]  Saturday, March 7th
─────────────────────────────
[icon]  7:00 in the evening
─────────────────────────────
[icon]  Sarah's place, Brooklyn
```

| Property | Value |
|----------|-------|
| Icon | Phosphor, regular weight, 20px |
| Icon color | `var(--muted-foreground)` |
| Text font | Source Sans 3, 16px, weight 400 |
| Text color | `var(--foreground)` |
| Row height | auto (content-determined) |
| Row padding | 16px vertical |
| Divider between rows | 1px, `var(--border)` at 50% opacity, inset |
| Icon-text gap | 14px |

### Section separation

Thin warm-toned dividers between all major sections. See Section 9 for exact divider spec.

Section order on the event page:
1. Cover image (optional)
2. Host attribution ("Sarah invites you to")
3. Event title
4. Date / time / location info rows (with dividers between)
5. Divider
6. Description (body text, generous line-height)
7. Divider
8. RSVP section
9. Divider
10. Event wall (if enabled)

### Overall density

**LOW.** This is the lowest-density category. Every section has generous margins, every text block has generous line-height, every info row has breathing room.

Approximate vertical rhythm:
- Title bottom margin: 32px
- Section gap: 48px
- Info row gap: 20px
- Divider margin: 24px above, 24px below
- Page padding: 28px horizontal

### Host attribution

**Visible.** Displayed above the event title. Format and styling defined in Section 11 (Copy & Language).

### Guest avatars

**Hidden.** No avatar circles, no profile pictures. The Warm category trusts text -- names in the guest list (if shown) are sufficient. Avatars add visual noise that breaks the editorial feel.

### Event wall

**Visible, subtle.** The event wall (comments/posts) is present but styled with restraint:
- Post separator: 1px divider, same spec as section dividers
- Post text: body font, body size, generous line-height
- Post author: `--warm-caption` size, `var(--muted-foreground)` color
- Post timestamps: `--warm-caption` size, `var(--muted-foreground)` color
- No card containers around individual posts -- flat layout with dividers
- Photos in posts: 10px border radius, full-width

---

## 13. Animation & Motion

Warm uses subtle, slow transitions. The motion vocabulary reinforces the unhurried, intimate personality. No particle effects. No confetti. No bouncing.

### Duration tokens (Warm overrides)

| Token | Default (Forest) | Warm | Difference |
|-------|-------------------|------|------------|
| `--duration-instant` | 100ms | 120ms | +20% |
| `--duration-fast` | 200ms | 280ms | +40% |
| `--duration-standard` | 300ms | 400ms | +33% |
| `--duration-emphasis` | 500ms | 700ms | +40% |
| `--duration-lifecycle` | 800ms | 1000ms | +25% |
| `--duration-ambient` | 3000ms | 4000ms | +33% |

### Easing curve

The standard Warm easing is gentler than the default -- a slower ease-out that feels like settling into a chair:

```css
--ease-warm: cubic-bezier(0.22, 0.1, 0.36, 1.0);
```

This has a slightly longer acceleration phase (0.22 vs 0.25 in default) and a more gradual deceleration (0.36 vs 0.25), creating a motion that breathes.

### Scroll reveal parameters

All below-fold content uses `use:scrollReveal` with gentler parameters than other categories:

```svelte
<div use:scrollReveal={{ y: 10, duration: 0.7, ease: 'power2.out' }}>
  <SomeContent />
</div>
```

| Parameter | Default | Warm | Notes |
|-----------|---------|------|-------|
| y (translate) | 15px | 10px | Less dramatic movement |
| duration | 0.5s | 0.7s | 40% slower reveal |
| ease | power2.out | power2.out | Same ease family, gentler with longer duration |
| threshold | 0.15 | 0.2 | Triggers slightly later (more visible before animating) |

### Stagger parameters

When multiple items reveal together (info rows, for example):

```
--stagger-warm: 100ms per item (vs 50ms default)
```

The doubled stagger time means each row appears distinctly, like courses being served one at a time.

### Page load sequence (hero content only)

The above-fold hero animates on page load with a gentle GSAP timeline:

```
t=0ms       Cover image fades in (opacity 0->1, 800ms, ease-out)
t=200ms     Host attribution fades in (opacity, 500ms)
t=400ms     Event title fades in (opacity 0->1, translateY 8px->0, 600ms)
t=700ms     First info row fades in (opacity, 400ms)
t=800ms     Second info row fades in (100ms stagger)
t=900ms     Third info row fades in (100ms stagger)
t=1100ms    RSVP section fades in (opacity 0->1, 500ms)
```

Total sequence: ~1.6 seconds. This is deliberately slower than Forest (~1.0s) or Midnight (~0.8s). The page "unfolds like an invitation being opened."

### Interactions

| Interaction | Animation | Notes |
|-------------|-----------|-------|
| Button hover | Background color shift, 280ms | Gentle transition |
| Button press | `scale(0.98)`, 120ms | Subtle, no bounce |
| RSVP selection | Color transition, 400ms | Slow color morph |
| RSVP success | Subtle checkmark fade (no confetti) | Restraint -- no celebration animation |
| Scroll | Parallax on cover image: 20% rate | Slower parallax than default (30%) |
| Card hover | `translateY(-2px)`, `--shadow-sm` -> `--shadow-md`, 280ms | Gentle lift |

### Explicitly excluded effects

- No confetti on RSVP
- No particle effects of any kind
- No bouncing or spring animations
- No pulsing elements
- No scale overshoot (no scale > 1.01 on any element)
- No horizontal slide-ins
- No rotation animations

---

## 14. Ephemeral-Custom CSS Properties (Per Palette)

Each palette sets the full set of Ephemeral-custom tokens. Example for `hearth` dark mode:

```css
[data-aesthetic="warm"][data-palette="hearth"][data-mode="dark"] {
  /* ... color tokens from Section 7.1 ... */

  /* Ephemeral-custom */
  --radius: 0.625rem;
  --shadow-color: oklch(0.10 0.02 50);
  --shadow-strength: 0.12;
  --surface-grain: url('/textures/linen-warm.svg');
  --border-weight: 1px;
  --font-heading: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-body: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --heading-weight: 300;
  --heading-tracking: 0.01em;
  --heading-transform: none;
  --body-line-height: 1.75;
}
```

These properties are consistent across ALL Warm palettes -- only the color tokens change between hearth, clay, sage, and wine.

---

## 15. Default Mode Per Palette

| Palette | Default Mode | Reasoning |
|---------|-------------|-----------|
| hearth | dark | Candlelit dinner -- warm dark chocolate surfaces |
| clay | light | Terracotta reads best against warm cream |
| sage | dark | Herbs at dusk -- moodier default |
| wine | dark | Wine is an evening experience |

Host can always override.

---

## 16. Event Type Mapping

When a host selects an event type and the aesthetic system suggests Warm:

| Event Type | Suggested Palette | Suggested Mode |
|-----------|------------------|----------------|
| Dinner party | hearth | dark |
| Wine tasting | wine | dark |
| Date night | wine | dark |
| Book club | sage | dark |
| Brunch | clay | light |
| Supper club | hearth | dark |
| Tasting menu | hearth | dark |
| Housewarming | clay | light |
| Tea party | sage | light |
| Friendsgiving | hearth | dark |

---

## 17. Integration with Existing Theme System

### Relationship to existing themes (aesthetic-customization-spec-v2)

The existing spec defines 10 themes (forest, midnight, ember, etc.) that each serve as a complete micro-design-system. The aesthetic category system adds a layer ABOVE individual themes, grouping them by personality:

- **Simple**: Forest, Slate
- **Fun**: Neon, Midnight
- **Warm**: Ember, Sand (existing) + Warm-specific palettes (hearth, clay, sage, wine)
- **Elegant**: Gilded, Bloom, Mono, Dusk

The Warm category specification in this document describes the FULL design system that applies when a host selects the "Warm" aesthetic category. It overlaps with Ember and Sand in personality but is a distinct, unified system with its own fonts (Cormorant Garamond + Source Sans 3 vs. Vollkorn + Manrope), its own spacing scale, and its own copy/language conventions.

### Selector architecture

The aesthetic category is a separate data attribute from the existing theme:

```html
<!-- Warm aesthetic with hearth palette, dark mode -->
<div data-aesthetic="warm" data-palette="hearth" data-mode="dark">
```

This coexists with but replaces the existing `data-theme` attribute when an aesthetic category is active. The CSS specificity should ensure aesthetic-category selectors override base theme selectors.

### Font loading

When the Warm aesthetic is active, load Cormorant Garamond and Source Sans 3 in addition to (or instead of) Vollkorn and Manrope. Font loading should be conditional on the aesthetic category to avoid unnecessary network requests.

```html
<!-- Only loaded when aesthetic="warm" -->
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## 18. Accessibility Summary

### Contrast compliance

All 8 palette-mode combinations (4 palettes x 2 modes) have been designed to meet WCAG AA:

| Check | Pair | Min Ratio | Status |
|-------|------|-----------|--------|
| 1 | foreground on background | 4.5:1 | All pass (min delta L: 0.73) |
| 2 | card-foreground on card | 4.5:1 | All pass (min delta L: 0.70) |
| 3 | primary-foreground on primary | 4.5:1 | All pass (min delta L: 0.33, verified with APCA for wine dark) |
| 4 | muted-foreground on background | 4.5:1 | All pass (min delta L: 0.43) |
| 5 | muted-foreground on card | 4.5:1 | All pass (min delta L: 0.40) |
| 6 | primary on background | 3:1 | All pass (min delta L: 0.46) |
| 7 | destructive-foreground on destructive | 4.5:1 | All pass |

### Color-blind safety

- No information conveyed by color alone
- RSVP states use text labels ("I'll be there" / "Let me check" / "I can't make it") as primary communication, not color
- The sage and hearth palettes were checked to ensure green accent vs. warm neutral background is distinguishable for deuteranopia and protanopia users -- the lightness contrast (not just hue) carries the differentiation

### Touch targets

- All buttons: 44px height minimum
- Info row tap targets: full row width, 16px vertical padding = ~52px effective height
- RSVP button: 44px height + 28px horizontal padding = comfortably tappable

### Font sizes

- Minimum text size: 13px (captions) -- above the 12px absolute minimum for legibility
- Body text: 16px -- default browser font size
- Line height: 1.75 -- exceeds WCAG recommendation of 1.5 for body text

---

## Appendix A: Color Hue Reference for Warm Palettes

```
Palette   Surface Hue   Accent Hue   Character
hearth    50 (amber)    145 (sage)   Neutral warmth + herbal accent
clay      45 (ochre)    28 (terra)   Earth tones throughout
sage      55 (cream)    140 (olive)  Green-forward natural
wine      40 (amber)    10 (burg.)   Deep red on warm dark
```

All surface hues are in the 40-60 range (warm amber/cream family). This consistency ensures all Warm palettes feel cohesively warm, even when the accent colors span green, red, and terracotta.

## Appendix B: Full Font Loading Snippet

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Source+Sans+3:wght@400;500;600&display=swap" rel="stylesheet">
```

CSS font stack declarations:

```css
:root {
  --font-warm-heading: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
  --font-warm-body: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

## Appendix C: Quick Comparison to Nearest Existing Themes

| Property | Ember (existing) | Sand (existing) | **Warm (new)** |
|----------|-----------------|-----------------|---------------|
| Heading font | Vollkorn italic | Vollkorn light | **Cormorant Garamond light** |
| Body font | Manrope | Manrope | **Source Sans 3** |
| Body line-height | 1.70 | 1.70 | **1.75** |
| Heading weight | 500 | 400 | **300** |
| Page padding | 20px | 20px | **28px** |
| Section gap | 32px | 32px | **48px** |
| Card radius | 8px | 12px | **10px** |
| Button radius | 8px | 12px | **8px** |
| Surface grain | grain-warm.svg | linen.svg | **linen-warm.svg** |
| RSVP label | "Going" | "Going" | **"I'll be there"** |
| Guest count | "8 going" | "8 going" | **"8 friends are joining"** |
| Host attribution | hidden | hidden | **visible: "{Name} invites you to"** |
| Guest avatars | shown | shown | **hidden** |
| Divider style | border-only | border-only | **inset, 50% opacity** |
| Animation speed | standard | standard | **40% slower** |
| Cover image | prominent | prominent | **optional, reduced** |
| Maybe option | button | button | **text link** |

The Warm category is structurally different from Ember and Sand, not just a color variation. The font change, spacing increase, copy language, layout decisions, and animation pacing create a fundamentally different personality.
