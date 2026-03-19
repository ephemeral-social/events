# Ephemeral Events — Motion & Animation Architecture

## Part 1: Screen-by-Screen Motion Map

This maps every screen, component, and interaction in the Ephemeral Events app to specific animations, organized by the three-layer architecture (CSS → GSAP → WebGL). Each entry specifies the animation type, implementation approach, and which layer handles it.

### Design Philosophy Translation

The Flutter spec defines seven lifecycle stages for animation: Birth/Emergence → Growth → Full Bloom → Maturity → Decay/Wilt → Dormancy → Regeneration. In the SvelteKit events app, we translate these to web primitives:

| Lifecycle Stage | Web Animation Pattern | When It Occurs |
|---|---|---|
| **Birth/Emergence** | `opacity: 0 → 1` + `scale(0.96) → scale(1)` + `translateY(12px) → 0` | Element enters DOM, route loads |
| **Growth** | Staggered children appearing, expanding sections | Lists populating, content loading |
| **Full Bloom** | Subtle 2-3% scale breathing (3-5s cycle) | Idle state on hero elements, logo |
| **Maturity** | Settled — no animation, stable presence | Normal interactive state |
| **Decay/Wilt** | `opacity: 1 → 0` + `scale(1) → scale(0.97)` + slight drift | Element exiting, content expiring |
| **Dormancy** | Complete removal from DOM | After exit animation completes |
| **Regeneration** | Same as Birth, triggered by new data | Pull-to-refresh, real-time updates |

Core easing curves (from the spec, converted to CSS/GSAP):

```
--ease-enter:     cubic-bezier(0, 0, 0.2, 1);      /* Decelerate / ease-out */
--ease-exit:      cubic-bezier(0.4, 0, 1, 1);       /* Accelerate / ease-in */
--ease-standard:  cubic-bezier(0.4, 0, 0.2, 1);     /* Ease-in-out */
--ease-spring:    linear(0, 0.36 7%, 0.71 14%, 0.94 21%, 1.02 28%, 1.01 42%, 1 56%, 1); /* Approximated spring */
```

Duration tokens:

```
--duration-instant:    100ms   /* Button feedback */
--duration-fast:       200ms   /* Micro-interactions */
--duration-standard:   300ms   /* Standard transitions */
--duration-emphasis:   500ms   /* Deliberate, visible motion */
--duration-lifecycle:  800ms   /* Content birth/death */
--duration-ambient:    3000ms+ /* Breathing, background */
```

Stagger tokens:

```
--stagger-fast:     30ms per item
--stagger-standard: 50ms per item
--stagger-slow:     80ms per item
```

---

### 1. Event Detail Page (`/e/{slug}`) — THE FIRST IMPRESSION

This is the most critical screen. It's what guests see when they tap an iMessage link. Every animation here must make a guest think "this is nicer than Partiful."

#### Page Load Sequence (GSAP Timeline)

The page should NOT pop in all at once. It should unfold like opening an invitation:

```
t=0ms     Cover image fades in (opacity 0→1, 600ms, ease-out)
t=100ms   Cover image subtle parallax scale (scale 1.03→1.0, 800ms)
t=200ms   Event title types or fades up (translateY 20px→0, opacity, 400ms)
t=350ms   Date/time/location stagger in (3 items, 50ms stagger, translateY 12→0)
t=500ms   Description fades in (opacity, 300ms)
t=600ms   Guest count pill slides in (translateX -20→0, opacity, 300ms)
t=700ms   RSVP buttons grow in (scale 0.9→1, opacity, 400ms, spring ease)
t=900ms   Secondary content (host info, share button) fades in
```

**Implementation**: GSAP timeline in `$effect` on the page component. Use `gsap.context()` scoped to the page container.

#### Cover Image

| Interaction | Animation | Layer |
|---|---|---|
| Initial load | Fade in + slight zoom out (1.03→1.0) | GSAP |
| Scroll down | Subtle parallax (moves 30% slower than scroll) | GSAP ScrollTrigger |
| Image loading | Blurred placeholder → sharp (progressive JPEG feel) | CSS `filter: blur()` transition |
| Theme-specific | Forest: vignette overlay. Sakura: soft pink gradient edge. Garden: warm amber edge | CSS `::after` gradient |

#### RSVP Buttons (Going / Maybe / Can't Make It)

| Interaction | Animation | Layer |
|---|---|---|
| Appear on load | Scale up from 0.9 with spring ease | GSAP (in page timeline) |
| Tap/press | `scale(0.97)` for 100ms, then spring back to 1.0 | CSS `:active` transition |
| Selection | Selected button: background color transition 200ms + subtle scale pulse (1.0→1.03→1.0). Unselected: fade to lower opacity | CSS transition + GSAP for pulse |
| State change | Smooth color morph between states (going=green→maybe=amber) | CSS `transition: background-color 300ms` |
| Success feedback | Brief checkmark icon that draws itself (SVG stroke-dashoffset) | CSS animation |
| Confetti burst on "Going" | 15-20 small shapes burst upward from button, arc with gravity, fade | GSAP with random positions |

#### Guest Count Pill

| Interaction | Animation | Layer |
|---|---|---|
| Number updates | Old number slides up and out, new number slides up in (like an odometer) | Svelte `crossfade` or GSAP |
| "Going" count changes | Brief scale pulse (1.0→1.05→1.0, 300ms) on the count | CSS transition |
| Tap to expand guest list | Pill expands into guest list panel (FLIP animation) | GSAP Flip |

#### Share Button

| Interaction | Animation | Layer |
|---|---|---|
| Tap | Scale down 0.97 → spring back | CSS `:active` |
| Long press | Subtle rotation wiggle (±2deg, 2 cycles) indicating "hold for more" | GSAP |
| After sharing | Brief success state with check animation | SVG stroke animation |

#### Auto-Delete Countdown (Privacy Badge)

| Interaction | Animation | Layer |
|---|---|---|
| Appear | Fade in with the secondary content wave | GSAP timeline |
| Idle | Subtle breathing glow on the shield/lock icon (opacity 0.7→1.0, 4s cycle) | CSS animation |
| Countdown ticking | Numbers animate like clock digits (crossfade on each tick) | Svelte `transition:` |

---

### 2. Phone Verification Flow

#### SMS Code Input

| Interaction | Animation | Layer |
|---|---|---|
| Screen enter | Title fades down, input boxes stagger in (4 boxes, 50ms stagger) | GSAP |
| Focus a digit box | Box border brightens + slight scale up (1.02) | CSS transition |
| Digit entered | Box fills with color wash from bottom + digit fades in | CSS transition |
| Auto-advance | Focus ring slides smoothly to next box (not jump) | GSAP, animating a highlight element's `translateX` |
| Error (wrong code) | All boxes shake horizontally (±8px, 3 cycles, 400ms) + turn error color | GSAP `gsap.to(el, { x: 8, repeat: 5, yoyo: true, duration: 0.08 })` |
| Success | All boxes briefly pulse green, then the entire form morphs into the next screen | GSAP + View Transitions API |

---

### 3. Photo Gallery

This is the feature that brings guests back. The gallery must feel premium — like a curated photo album, not a grid dump.

#### Gallery Grid View

| Interaction | Animation | Layer |
|---|---|---|
| Grid load | Photos stagger in with masonry-style reveal (bottom-up, 30ms stagger per photo) | GSAP + ScrollTrigger |
| Each photo appears | `opacity 0→1` + `scale(0.95)→1` + slight random rotation (±1deg settling to 0) | GSAP with slight randomness |
| Scroll reveal | Photos below fold animate in when scrolled into view (IntersectionObserver trigger) | GSAP ScrollTrigger |
| Photo upload progress | Radial progress ring around photo thumbnail | CSS `conic-gradient` animation |
| New photo added by another guest | Photo materializes with organic growth pattern (scale from center) | Svelte `transition:scale` |
| EXIF stripping confirmation | Brief shield icon overlay that fades in then dissolves (1.5s total) | CSS animation with `@keyframes` |

#### Stories-Style Photo Viewer (Full Screen)

This should feel like Instagram Stories but more elegant:

| Interaction | Animation | Layer |
|---|---|---|
| Open from grid | Photo morphs from grid position to full-screen (shared element transition) | View Transitions API (Safari 18+) / GSAP Flip (fallback) |
| Progress bar | Thin line at top fills smoothly across the timer duration | CSS `transition: width` or GSAP |
| Swipe between photos | Horizontal slide with momentum + slight overshoot spring | svelte-gestures `swipe` + GSAP spring |
| Pinch to zoom | Smooth scale + transform-origin follows finger midpoint | svelte-gestures `pinch` + CSS transform |
| Close (swipe down) | Photo shrinks back to grid position with velocity-matched spring | GSAP Flip reverse / View Transitions |
| Photo caption | Slides up from bottom with blur backdrop (300ms) | CSS transition + `backdrop-filter` |
| Metadata removed badge | Slides in from bottom-right corner, stays 2s, slides out | GSAP |

---

### 4. Event Creation Form (`/create`)

This flow should feel like crafting something — intentional, not bureaucratic.

#### Form Entry

| Interaction | Animation | Layer |
|---|---|---|
| Screen load | Form sections stagger in top-to-bottom (80ms stagger per section) | GSAP |
| Input focus | Label floats up (if material-style) or border brightens + slight lift on the input (translateY -1px) | CSS transition |
| Section expansion | Accordion sections expand with height animation + content fade | Svelte `transition:slide` + `transition:fade` |
| Date/time picker open | Slides up from bottom as bottom sheet | CSS transform + Svelte `transition:fly` |

#### Cover Image Selection

| Interaction | Animation | Layer |
|---|---|---|
| Image upload area idle | Dashed border with subtle pulse animation (opacity 0.5→0.8, 2s) | CSS animation |
| Drag over | Border solidifies + area scales slightly (1.01) + color tint | CSS `:hover` / drag state |
| Image selected | Thumbnail fades in with slight zoom from center | CSS transition |
| Image processing | Shimmer loading effect across thumbnail | CSS `@keyframes shimmer` with gradient |

#### Theme/Aesthetic Selector (2×5 Grid)

| Interaction | Animation | Layer |
|---|---|---|
| Grid appears | Theme tiles stagger in (30ms stagger, 10 tiles = 300ms total) | GSAP |
| Tile hover/focus | Slight scale up (1.03) + shadow deepens | CSS `transition: transform, box-shadow` |
| Selection | Selected tile gets ring + brief pulse. Page background cross-fades to preview theme colors over 600ms | CSS transition for ring, GSAP for background color morph |
| Theme preview | All semantic colors transition smoothly (surface, text, accent — 600ms) | CSS custom property transitions via GSAP |

#### "Create" Button

| Interaction | Animation | Layer |
|---|---|---|
| Form incomplete | Button at 50% opacity, no interaction animation | CSS |
| Form valid | Button fades to full opacity + brief attention pulse | CSS transition + `@keyframes` |
| Tap to create | Button morphs into loading spinner (width shrinks to circle, spinner appears) | GSAP |
| Success | Spinner morphs into checkmark → page transitions to the new event detail | GSAP + View Transitions |

---

### 5. Host Dashboard

#### RSVP Management / Guest List

| Interaction | Animation | Layer |
|---|---|---|
| List load | Guest rows stagger in (30ms per row, `translateY 8→0` + opacity) | GSAP or AutoAnimate |
| Guest status change | Row background color smoothly transitions | CSS transition |
| Guest added (real-time) | New row slides in from top with spring ease | AutoAnimate handles this automatically |
| Guest removed | Row slides out left + height collapses smoothly | AutoAnimate |
| Status tab switching (Going/Maybe/Can't) | Content crossfades, count badges update with number animation | Svelte `transition:fade` + GSAP for count |
| Pull to refresh | Overscroll with rubber-band feel, spinner appears | CSS + JS overscroll handling |

#### Share Sheet

| Interaction | Animation | Layer |
|---|---|---|
| Open | Slides up from bottom (300ms, ease-out) with backdrop blur | Svelte `transition:fly={{ y: 300 }}` + CSS `backdrop-filter` |
| Short link row | Copy button → tap → morphs into "Copied!" with check, reverts after 2s | GSAP |
| OG preview card | Subtle entrance with slight rotation (like laying down a card) | GSAP |
| Close | Slides down with slightly faster ease-in (250ms) | Svelte `transition:fly` |

---

### 6. Ticketed Event Page

#### Ticket Tier Cards

| Interaction | Animation | Layer |
|---|---|---|
| Card entrance | Cards stagger in with slight upward drift + perspective tilt settling to flat | GSAP |
| Card hover/focus | Lift up (translateY -4px) + shadow deepens + border glows with accent color | CSS transition |
| Select tier | Selected card scales slightly (1.02) + accent border appears. Others dim to 80% opacity | CSS transition |
| Sold out tier | Grayscale filter fades in + "Sold Out" badge slides in | CSS transition + GSAP |
| Availability counter | Number animates down (odometer style) when tickets sell in real time | GSAP |

#### Payment Flow (Stripe)

| Interaction | Animation | Layer |
|---|---|---|
| Checkout opening | Current page fades slightly + Stripe overlay slides in | CSS transition |
| Processing | Pulsing progress indicator with organic breathing | CSS `@keyframes` |
| Success | Confetti burst + ticket slides in from bottom | GSAP + Svelte transition |

---

### 7. Ticket Confirmation / QR Code

| Interaction | Animation | Layer |
|---|---|---|
| Page load | Ticket "prints" in — slides down with slight paper-like physics | GSAP |
| QR code | Draws in with SVG animation (modules appear in cascade from center) | GSAP stagger on SVG rects |
| Add to Wallet button | Pulse to draw attention 3s after load | CSS `@keyframes` |
| Scan success (check-in) | QR code morphs into large checkmark + green confirmation wash | GSAP |

---

### 8. Check-in Scanner (Host)

| Interaction | Animation | Layer |
|---|---|---|
| Camera viewfinder | Scanning line animates top-to-bottom in the target area (continuous) | CSS `@keyframes` |
| Scan success | Green flash overlay (200ms) + haptic (Android only) + counter increments with spring | CSS animation + GSAP for counter |
| Scan failure | Red flash (200ms) + shake animation on the viewfinder frame | CSS + GSAP shake |
| Counter increment | Number does odometer-style flip up | GSAP |

---

### 9. Recurring Events View

| Interaction | Animation | Layer |
|---|---|---|
| Series timeline | Instances stagger in along a vertical timeline (50ms per instance) | GSAP ScrollTrigger |
| Current instance | Breathing glow/pulse on the "current" indicator dot | CSS animation |
| Expand instance | Instance card expands inline (height + content fade) | Svelte `transition:slide` |
| Navigate between instances | Horizontal swipe with momentum snap | svelte-gestures + GSAP |

---

### 10. Global Elements

#### Page Transitions (All Routes)

| Transition | Animation | Layer |
|---|---|---|
| Forward navigation (list→detail) | New page slides in from right (40% of width) + fades in. Old page shifts left (20%) + fades slightly | View Transitions API / GSAP |
| Back navigation | Reverse of forward — old page slides in from left | View Transitions API / GSAP |
| Modal/overlay open | Background dims + blurs. Content slides up with spring | CSS `backdrop-filter` + Svelte `transition:fly` |
| Modal close | Content slides down + background restores | Svelte `transition:fly` |

#### Toasts / Notifications

| Interaction | Animation | Layer |
|---|---|---|
| Appear | Slide down from top + fade in (300ms) | Svelte `transition:fly={{ y: -20 }}` |
| Dismiss (timeout) | Fade out + slide up (250ms, slightly faster) | Svelte `out:fly` |
| Dismiss (swipe) | Follows finger horizontally, velocity-based dismiss threshold | svelte-gestures + GSAP |
| Stack (multiple toasts) | Existing toasts shift down smoothly to make room | AutoAnimate on container |

#### Loading States

| State | Animation | Layer |
|---|---|---|
| Skeleton screens | Shimmer gradient sweeps left-to-right continuously | CSS `@keyframes` + `background-position` |
| Inline spinner | Organic rotation (not mechanical — uses ease-in-out, not linear) | CSS `@keyframes` with `ease-in-out` |
| Pull to refresh | Overscroll spring + spinner appears at threshold | JS + CSS |
| Progressive image load | Blur(20px)→blur(0) as image loads | CSS transition on `filter` |

#### Theme Transitions (Global)

When the user or host changes the event theme:

| Change | Animation | Layer |
|---|---|---|
| Color transition | All CSS custom properties interpolate over 600ms | GSAP `gsap.to(':root', { '--surface-primary': newColor, duration: 0.6 })` |
| WebGL ambient layer | Shader uniforms cross-fade to new theme parameters over 1500ms | twgl.js uniform interpolation via GSAP |

---

## Part 2: Claude Code Foundation System

This section defines the file structure, utilities, actions, and conventions that ensure every new component and page automatically participates in the motion system. Drop this into your project's `CLAUDE.md` or as a dedicated `MOTION.md` reference.

### File Structure

```
src/lib/
├── motion/
│   ├── tokens.ts              # Duration, easing, stagger constants
│   ├── spring.ts              # Spring physics presets
│   ├── actions/
│   │   ├── animate-in.ts      # use:animateIn action (GSAP-powered)
│   │   ├── scroll-reveal.ts   # use:scrollReveal action
│   │   ├── press-feedback.ts  # use:pressFeedback action (scale on tap)
│   │   ├── stagger-children.ts# use:staggerChildren action
│   │   └── parallax.ts        # use:parallax action
│   ├── transitions/
│   │   ├── page.ts            # SvelteKit page transition setup
│   │   ├── organic-fade.ts    # Custom Svelte transition: lifecycle fade+scale
│   │   ├── organic-fly.ts     # Custom Svelte transition: lifecycle fly
│   │   └── morph.ts           # GSAP Flip-based morph transition
│   ├── components/
│   │   ├── AnimatedList.svelte # AutoAnimate wrapper
│   │   ├── NumberTicker.svelte # Odometer-style number animation
│   │   ├── Confetti.svelte    # Burst effect for celebrations
│   │   ├── ShimmerLoader.svelte# Skeleton loading shimmer
│   │   └── WebGLAmbient.svelte# Persistent shader background
│   ├── shaders/
│   │   ├── forest.frag        # Forest theme fragment shader
│   │   ├── sakura.frag        # Sakura theme fragment shader
│   │   ├── garden.frag        # Garden theme fragment shader
│   │   └── noise.glsl         # Shared simplex noise function
│   ├── utils/
│   │   ├── device-tier.ts     # Detect device capability tier
│   │   ├── reduced-motion.ts  # Reactive prefers-reduced-motion
│   │   └── gsap-context.svelte.ts # Svelte 5 GSAP context helper
│   └── index.ts               # Re-exports everything
```

### Core: `tokens.ts`

```typescript
// src/lib/motion/tokens.ts
// ALL motion values in one place. Every animation references these.

export const duration = {
  instant:   100,   // Button feedback, toggles
  fast:      200,   // Micro-interactions, hover states
  standard:  300,   // Standard transitions, modals
  emphasis:  500,   // Deliberate visible motion
  lifecycle: 800,   // Content birth/death, page transitions
  ambient:   3000,  // Breathing, background loops
} as const;

export const ease = {
  // CSS format (for CSS transitions and Svelte transitions)
  css: {
    enter:    'cubic-bezier(0, 0, 0.2, 1)',
    exit:     'cubic-bezier(0.4, 0, 1, 1)',
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring:   'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  // GSAP format (for GSAP animations)
  gsap: {
    enter:    'power3.out',
    exit:     'power2.in',
    standard: 'power2.inOut',
    spring:   'back.out(1.7)',
    bounce:   'elastic.out(1, 0.5)',
  }
} as const;

export const stagger = {
  fast:     30,   // Dense lists
  standard: 50,   // Default stagger
  slow:     80,   // Deliberate sequential reveal
} as const;

// Lifecycle-specific presets
export const lifecycle = {
  birth: {
    from: { opacity: 0, y: 12, scale: 0.96 },
    duration: duration.lifecycle,
    ease: ease.gsap.enter,
  },
  death: {
    to: { opacity: 0, y: -8, scale: 0.97 },
    duration: duration.emphasis,
    ease: ease.gsap.exit,
  },
  breathing: {
    scale: 1.025,       // 2.5% oscillation
    duration: 4000,     // 4 seconds per cycle
  },
} as const;
```

### Core: `gsap-context.svelte.ts`

```typescript
// src/lib/motion/utils/gsap-context.svelte.ts
// THE standard way to use GSAP in any Svelte 5 component.
// Handles cleanup automatically. Every component should use this pattern.

import { gsap } from 'gsap';

/**
 * Creates a GSAP context scoped to a container element.
 * Use inside $effect() for automatic cleanup on unmount/re-run.
 *
 * Usage:
 *   let container: HTMLElement;
 *   $effect(() => {
 *     return createGsapContext(container, (self) => {
 *       gsap.from('.card', { ...lifecycle.birth, stagger: stagger.standard / 1000 });
 *     });
 *   });
 */
export function createGsapContext(
  container: HTMLElement | undefined,
  setup: (ctx: gsap.Context) => void
): (() => void) | undefined {
  if (!container) return;

  const ctx = gsap.context(() => {
    setup(ctx);
  }, container);

  return () => ctx.revert();
}
```

### Core: `reduced-motion.ts`

```typescript
// src/lib/motion/utils/reduced-motion.ts
// Reactive reduced-motion detection. Import and use everywhere.

import { browser } from '$app/environment';

/** Reactive state: true if user prefers reduced motion */
export const prefersReducedMotion = $state<boolean>(
  browser ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
);

if (browser) {
  window.matchMedia('(prefers-reduced-motion: reduce)')
    .addEventListener('change', (e) => {
      prefersReducedMotion = e.matches;
    });
}

/** Returns 0 if reduced motion, otherwise the given duration */
export function motionDuration(ms: number): number {
  return prefersReducedMotion ? 0 : ms;
}

/** Returns a simple fade config if reduced motion, otherwise the full config */
export function motionConfig<T extends Record<string, any>>(
  full: T,
  reduced?: Partial<T>
): T {
  if (!prefersReducedMotion) return full;
  return { ...full, duration: 0.15, y: 0, x: 0, scale: 1, rotation: 0, ...reduced } as T;
}
```

### Core: `device-tier.ts`

```typescript
// src/lib/motion/utils/device-tier.ts
// Detects device capability and sets the animation tier.

import { browser } from '$app/environment';

export type DeviceTier = 'high' | 'medium' | 'low';

let _tier: DeviceTier | null = null;

export function getDeviceTier(): DeviceTier {
  if (_tier) return _tier;
  if (!browser) return 'medium';

  const cores = navigator.hardwareConcurrency || 2;
  const connection = (navigator as any).connection;
  const saveData = connection?.saveData === true;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || saveData || cores <= 2) {
    _tier = 'low';
  } else if (cores >= 6) {
    _tier = 'high';
  } else {
    _tier = 'medium';
  }

  return _tier;
}

/** True if device supports WebGL ambient effects */
export function supportsAmbientEffects(): boolean {
  return getDeviceTier() === 'high' && !prefersReducedMotion;
}
```

### Action: `use:animateIn`

```typescript
// src/lib/motion/actions/animate-in.ts
// Drop-in action for any element that should animate when it enters.
// Usage: <div use:animateIn>  or  <div use:animateIn={{ delay: 0.2 }}>

import { gsap } from 'gsap';
import { lifecycle, ease, duration } from '../tokens';
import { prefersReducedMotion } from '../utils/reduced-motion';

interface AnimateInOptions {
  delay?: number;
  y?: number;
  scale?: number;
  duration?: number;
  ease?: string;
}

export function animateIn(node: HTMLElement, options: AnimateInOptions = {}) {
  if (prefersReducedMotion) {
    // Still do a brief fade for spatial awareness
    gsap.from(node, { opacity: 0, duration: 0.15 });
    return;
  }

  gsap.from(node, {
    opacity: 0,
    y: options.y ?? 12,
    scale: options.scale ?? 0.96,
    duration: (options.duration ?? duration.lifecycle) / 1000,
    delay: options.delay ?? 0,
    ease: options.ease ?? ease.gsap.enter,
    clearProps: 'all', // Remove inline styles after animation
  });

  return {
    destroy() {
      gsap.killTweensOf(node);
    }
  };
}
```

### Action: `use:pressFeedback`

```typescript
// src/lib/motion/actions/press-feedback.ts
// Makes any tappable element feel tactile with scale feedback.
// Usage: <button use:pressFeedback>  or  <button use:pressFeedback={{ scale: 0.95 }}>

interface PressOptions {
  scale?: number;
  duration?: number;
}

export function pressFeedback(node: HTMLElement, options: PressOptions = {}) {
  const scale = options.scale ?? 0.97;
  const dur = options.duration ?? 100;

  // Use CSS for press feedback — it's faster than GSAP for simple interactions
  node.style.transition = `transform ${dur}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  node.style.willChange = 'transform';

  function onDown() { node.style.transform = `scale(${scale})`; }
  function onUp()   { node.style.transform = 'scale(1)'; }

  node.addEventListener('pointerdown', onDown);
  node.addEventListener('pointerup', onUp);
  node.addEventListener('pointerleave', onUp);

  return {
    destroy() {
      node.removeEventListener('pointerdown', onDown);
      node.removeEventListener('pointerup', onUp);
      node.removeEventListener('pointerleave', onUp);
      node.style.willChange = '';
    }
  };
}
```

### Action: `use:scrollReveal`

```typescript
// src/lib/motion/actions/scroll-reveal.ts
// Elements animate in when scrolled into view.
// Usage: <section use:scrollReveal>  or  <section use:scrollReveal={{ threshold: 0.3 }}>

import { gsap } from 'gsap';
import { lifecycle, ease } from '../tokens';
import { prefersReducedMotion } from '../utils/reduced-motion';

interface ScrollRevealOptions {
  threshold?: number;
  y?: number;
  delay?: number;
  once?: boolean; // default true — only animate in once
}

export function scrollReveal(node: HTMLElement, options: ScrollRevealOptions = {}) {
  if (prefersReducedMotion) return;

  // Set initial state
  gsap.set(node, { opacity: 0, y: options.y ?? 20 });

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        gsap.to(node, {
          opacity: 1,
          y: 0,
          duration: lifecycle.birth.duration / 1000,
          delay: options.delay ?? 0,
          ease: ease.gsap.enter,
          clearProps: 'all',
        });
        if (options.once !== false) observer.disconnect();
      }
    },
    { threshold: options.threshold ?? 0.15, rootMargin: '0px 0px -50px 0px' }
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
      gsap.killTweensOf(node);
    }
  };
}
```

### Action: `use:staggerChildren`

```typescript
// src/lib/motion/actions/stagger-children.ts
// Automatically staggers the entrance of child elements.
// Usage: <ul use:staggerChildren>  or  <ul use:staggerChildren={{ stagger: 0.05 }}>

import { gsap } from 'gsap';
import { stagger as staggerTokens, lifecycle, ease } from '../tokens';
import { prefersReducedMotion } from '../utils/reduced-motion';

interface StaggerOptions {
  stagger?: number;      // seconds between each child
  selector?: string;     // CSS selector for children (default: direct children)
  y?: number;
  from?: 'start' | 'center' | 'end';
}

export function staggerChildren(node: HTMLElement, options: StaggerOptions = {}) {
  if (prefersReducedMotion) {
    // Just fade in all at once
    gsap.from(node.children, { opacity: 0, duration: 0.15 });
    return;
  }

  const targets = options.selector
    ? node.querySelectorAll(options.selector)
    : node.children;

  gsap.from(targets, {
    opacity: 0,
    y: options.y ?? 12,
    scale: 0.96,
    duration: lifecycle.birth.duration / 1000,
    stagger: {
      each: options.stagger ?? staggerTokens.standard / 1000,
      from: options.from ?? 'start',
    },
    ease: ease.gsap.enter,
    clearProps: 'all',
  });

  return {
    destroy() {
      gsap.killTweensOf(targets);
    }
  };
}
```

### Custom Svelte Transition: `organicFade`

```typescript
// src/lib/motion/transitions/organic-fade.ts
// A Svelte transition that uses lifecycle animation (fade + scale + slight drift).
// Usage: <div transition:organicFade>  or  <div in:organicFade out:organicFade>

import { cubicOut, cubicIn } from 'svelte/easing';
import { prefersReducedMotion } from '../utils/reduced-motion';

interface OrganicFadeParams {
  duration?: number;
  delay?: number;
}

export function organicFade(node: HTMLElement, params: OrganicFadeParams = {}) {
  const d = prefersReducedMotion ? 150 : (params.duration ?? 500);

  return {
    delay: params.delay ?? 0,
    duration: d,
    css: (t: number) => {
      const eased = cubicOut(t);
      if (prefersReducedMotion) {
        return `opacity: ${eased}`;
      }
      return `
        opacity: ${eased};
        transform: scale(${0.96 + 0.04 * eased}) translateY(${12 * (1 - eased)}px);
      `;
    }
  };
}
```

### Page Transitions: `+layout.svelte`

```svelte
<!-- src/routes/+layout.svelte -->
<!-- This is the root layout. It sets up View Transitions and the persistent WebGL layer. -->
<script lang="ts">
  import { onNavigate } from '$app/navigation';
  import { browser } from '$app/environment';
  import { getDeviceTier } from '$lib/motion/utils/device-tier';

  let { children } = $props();

  // View Transitions API (Safari 18+, Chrome 111+)
  // Falls back to instant navigation on older browsers
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  // Lazy-load WebGL ambient background only on high-tier devices
  let WebGLAmbient: any = $state(null);
  $effect(() => {
    if (browser && getDeviceTier() === 'high') {
      import('$lib/motion/components/WebGLAmbient.svelte')
        .then(mod => { WebGLAmbient = mod.default; });
    }
  });
</script>

<!-- Persistent ambient background (survives route changes) -->
{#if WebGLAmbient}
  <div class="fixed inset-0 -z-10 pointer-events-none">
    <svelte:component this={WebGLAmbient} />
  </div>
{/if}

<!-- Page content with view transition classes -->
<main class="relative z-10">
  {@render children()}
</main>

<style>
  /* View Transition customization */
  :root::view-transition-old(root) {
    animation: 300ms ease-in both fade-out,
               300ms ease-in both slide-to-left;
  }
  :root::view-transition-new(root) {
    animation: 300ms ease-out both fade-in,
               300ms ease-out both slide-from-right;
  }

  /* Reverse for back navigation (set via JS navigation direction detection) */
  :root.back-nav::view-transition-old(root) {
    animation: 300ms ease-in both fade-out,
               300ms ease-in both slide-to-right;
  }
  :root.back-nav::view-transition-new(root) {
    animation: 300ms ease-out both fade-in,
               300ms ease-out both slide-from-left;
  }

  @keyframes fade-in  { from { opacity: 0; } }
  @keyframes fade-out { to { opacity: 0; } }
  @keyframes slide-from-right { from { transform: translateX(15%); } }
  @keyframes slide-to-left    { to   { transform: translateX(-5%); } }
  @keyframes slide-from-left  { from { transform: translateX(-15%); } }
  @keyframes slide-to-right   { to   { transform: translateX(5%); } }
</style>
```

### Global CSS Motion Variables

```css
/* src/app.css — add to your existing Tailwind setup */

@layer base {
  :root {
    /* Motion tokens as CSS custom properties */
    --duration-instant:   100ms;
    --duration-fast:      200ms;
    --duration-standard:  300ms;
    --duration-emphasis:  500ms;
    --duration-lifecycle: 800ms;
    --duration-ambient:   3000ms;

    --ease-enter:    cubic-bezier(0, 0, 0.2, 1);
    --ease-exit:     cubic-bezier(0.4, 0, 1, 1);
    --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
    --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* Reduced motion: collapse all durations */
  @media (prefers-reduced-motion: reduce) {
    :root {
      --duration-instant:   0ms;
      --duration-fast:      0ms;
      --duration-standard:  0ms;
      --duration-emphasis:  100ms; /* Keep minimal fade */
      --duration-lifecycle: 150ms;
      --duration-ambient:   0ms;
    }
  }

  /* Default transition for interactive elements */
  button, a, [role="button"], input, select, textarea {
    transition:
      transform var(--duration-instant) var(--ease-standard),
      background-color var(--duration-fast) var(--ease-standard),
      border-color var(--duration-fast) var(--ease-standard),
      color var(--duration-fast) var(--ease-standard),
      opacity var(--duration-fast) var(--ease-standard),
      box-shadow var(--duration-fast) var(--ease-standard);
  }

  /* Press feedback for all tappable elements */
  button:active, [role="button"]:active {
    transform: scale(0.97);
  }

  /* Shimmer loading effect utility */
  .shimmer {
    background: linear-gradient(
      90deg,
      var(--surface-secondary) 0%,
      var(--surface-tertiary) 50%,
      var(--surface-secondary) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Breathing animation utility */
  .breathing {
    animation: breathe var(--duration-ambient) ease-in-out infinite alternate;
  }

  @keyframes breathe {
    from { transform: scale(1); }
    to   { transform: scale(1.025); }
  }
}
```

---

## Part 3: CLAUDE.md Motion Instructions

Add this section to your project's `CLAUDE.md` file so Claude Code automatically follows the motion system:

```markdown
## Motion & Animation System

### CRITICAL: Before writing ANY animation code
1. Import from `$lib/motion/` — never write raw GSAP or CSS animations inline
2. Use motion tokens from `$lib/motion/tokens.ts` — never hardcode durations or easings
3. Check `prefersReducedMotion` from `$lib/motion/utils/reduced-motion.ts`
4. Use `gsap.context()` via `createGsapContext()` helper — never raw GSAP without cleanup

### Animation Decision Tree
For any element that needs animation, choose in this order:

1. **CSS only?** If it's a hover state, focus state, color change, or simple opacity
   → Use CSS transitions with `var(--duration-*)` and `var(--ease-*)` custom properties
   → These are already set globally on buttons, inputs, and links

2. **Component lifecycle?** If an element enters or exits the DOM
   → Use Svelte transitions: `transition:organicFade` from `$lib/motion/transitions/`
   → For lists with dynamic items: wrap parent in `<AnimatedList>` component

3. **Scroll-triggered?** If it should animate when scrolled into view
   → Use `use:scrollReveal` action from `$lib/motion/actions/`

4. **Orchestrated timeline?** If multiple elements need coordinated sequencing
   → Use GSAP with `createGsapContext()` inside `$effect()`
   → Import lifecycle presets: `lifecycle.birth`, `lifecycle.death`

5. **Touch gesture?** If it responds to swipe, pinch, or drag
   → Use svelte-gestures for detection + GSAP for the animation response

### Standard Patterns

#### Page load animation (every page should have this):
```svelte
<script>
  import { createGsapContext } from '$lib/motion/utils/gsap-context.svelte';
  import { lifecycle, stagger } from '$lib/motion/tokens';

  let container: HTMLElement;

  $effect(() => {
    return createGsapContext(container, () => {
      gsap.from('[data-animate]', {
        ...lifecycle.birth,
        stagger: stagger.standard / 1000,
      });
    });
  });
</script>

<div bind:this={container}>
  <h1 data-animate>Title</h1>
  <p data-animate>Content</p>
  <div data-animate>More content</div>
</div>
```

#### Button with press feedback:
```svelte
<button use:pressFeedback>Click me</button>
```
Or just rely on the global CSS `button:active { transform: scale(0.97) }`.

#### List with automatic add/remove animations:
```svelte
<script>
  import AnimatedList from '$lib/motion/components/AnimatedList.svelte';
</script>
<AnimatedList>
  {#each items as item (item.id)}
    <div>{item.name}</div>
  {/each}
</AnimatedList>
```

#### Number that animates when it changes:
```svelte
<script>
  import NumberTicker from '$lib/motion/components/NumberTicker.svelte';
</script>
<NumberTicker value={guestCount} />
```

### Files to NEVER create
- Do not create animation utility files outside of `$lib/motion/`
- Do not import GSAP directly in page/component files — always go through the motion system
- Do not use `setTimeout` for animation timing — use GSAP timelines or Svelte transitions
- Do not use `element.animate()` directly — use Svelte transitions or GSAP

### Performance Rules
- Never animate `width`, `height`, `top`, `left`, `margin`, or `padding`
- Only animate `transform`, `opacity`, `filter`, `clip-path`
- Use `will-change` sparingly and remove after animation completes (GSAP's `clearProps: 'all'` does this)
- Limit to 3-4 simultaneous GSAP tweens on mobile
- Gate WebGL/ambient effects behind `getDeviceTier() === 'high'`
```

---

## Part 4: Implementation Priority

### Sprint 1 (Foundation — do this first)
1. Create `src/lib/motion/tokens.ts` with all constants
2. Create `src/lib/motion/utils/` (reduced-motion, device-tier, gsap-context)
3. Add CSS motion variables to `app.css`
4. Set up View Transitions in root `+layout.svelte`
5. Create `use:animateIn` and `use:pressFeedback` actions

### Sprint 2 (Core Interactions)
6. Create `use:scrollReveal` and `use:staggerChildren` actions
7. Create `organicFade` Svelte transition
8. Create `AnimatedList` wrapper (AutoAnimate)
9. Create `NumberTicker` component
10. Create `ShimmerLoader` component

### Sprint 3 (Page Animations)
11. Add page load timeline to event detail page (`/e/{slug}`)
12. Add RSVP button animations (selection, confetti)
13. Add photo gallery stagger + Stories viewer transitions
14. Add form animations to event creation

### Sprint 4 (Ambient Layer)
15. Create `WebGLAmbient.svelte` with twgl.js
16. Write Forest theme fragment shader
17. Write Sakura and Garden shaders
18. Integrate theme-reactive shader uniform transitions
19. Add device-tier gating + context loss recovery

### Sprint 5 (Polish)
20. Add shared element transitions (event card → detail page)
21. Add gesture-based dismissals (swipe toast, swipe photo viewer)
22. Add GSAP ScrollTrigger for cover image parallax
23. Performance audit on iPhone 13 (iOS 16 Safari)
24. Reduced motion audit — test every screen with `prefers-reduced-motion: reduce`
