# Ephemeral Events — Native Feel Implementation Spec

**Purpose**: Make the SvelteKit PWA feel indistinguishable from a native app for guests arriving from a shared link. iOS-first (primary audience), Android/Chrome as a progressive enhancement. This spec is the single source of truth for all UI polish, animation, and interaction work.

**Stack**: SvelteKit + Svelte 5 (runes) + Tailwind v4 + Cloudflare Pages
**Design**: Dark-mode-only. Vollkorn (serif display) + Manrope (sans body). Warm near-black `#111110` base. Gold accent `#c9a96e`.
**Primary target**: iOS 17+ Safari and standalone PWA.
**Secondary target**: Chrome Android (gets additional capabilities via progressive enhancement).
**Critical context**: Chrome/Firefox/Edge on iOS all use Apple's WebKit engine under the hood. They are functionally identical to Safari. All iOS-specific code in this spec applies to ALL iOS browsers, not just Safari.

---

## 1. Dependencies to Install

```bash
npm install konsta @vite-pwa/sveltekit svelte-gestures
```

- **Konsta UI v5** (`konsta/svelte`): iOS structural components (sheets, action sheets, dialogs, toasts, navbar). Svelte 5 Runes + Tailwind v4 compatible.
- **@vite-pwa/sveltekit**: Service worker, manifest, asset precaching. Replaces SvelteKit's built-in `$service-worker`.
- **svelte-gestures**: Pan/swipe/pinch recognition for bottom sheets and dismiss gestures. Use raw touch events for the Stories viewer (more control needed).

---

## 1b. Platform Detection Utility

Create `src/lib/utils/platform.ts`. Use feature detection, not user-agent sniffing — UA strings are unreliable (Chrome on iOS contains "CriOS" but has Safari's capabilities, Firefox on iPad pretends to be Safari entirely).

```typescript
/** Detect iOS (all browsers — they all use WebKit) */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad on iOS 13+
}

/** Detect Android */
export function isAndroid(): boolean {
  return /Android/.test(navigator.userAgent);
}

/** Detect standalone PWA mode (installed to home screen) */
export function isStandalone(): boolean {
  return (window.navigator as any).standalone === true || // iOS
    window.matchMedia('(display-mode: standalone)').matches; // Standard
}

/** Detect Chrome on Android (the only platform with enhanced PWA APIs) */
export function isChromeAndroid(): boolean {
  return isAndroid() && /Chrome/.test(navigator.userAgent) &&
    !/Edge|OPR|Samsung/.test(navigator.userAgent);
}

/** Check if beforeinstallprompt is available (Android Chrome only) */
export function supportsInstallPrompt(): boolean {
  return 'BeforeInstallPromptEvent' in window;
}

/** Check if Vibration API is available (Android only, blocked on iOS) */
export function supportsVibration(): boolean {
  return 'vibrate' in navigator;
}

/** Check if Badge API is available */
export function supportsBadge(): boolean {
  return 'setAppBadge' in navigator;
}
```

Use these throughout the app to progressively enhance for Android while maintaining iOS as the baseline.

---

## 2. Global CSS Reset — Apply First

Create `src/lib/styles/ios-reset.css`. Import in root layout.

```css
/* === iOS NATIVE FEEL RESET === */

/* Kill all browser-like tells */
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  box-sizing: border-box;
}

/* Disable selection on UI chrome, allow on content */
nav, header, footer, button, [role="button"],
.card-header, .nav-bar, .tab-bar, label {
  -webkit-user-select: none;
  user-select: none;
}
p, .event-description, .comment-text, .caption, article {
  -webkit-user-select: text;
  user-select: text;
}

/* Prevent whole-page rubber band bounce */
html, body {
  overscroll-behavior: none;
  overflow-x: hidden;
}

/* Responsive tap — belt-and-suspenders for 300ms delay */
a, button, input, select, textarea, [role="button"] {
  touch-action: manipulation;
}

/* Standalone PWA specific */
@media (display-mode: standalone) {
  html, body {
    overscroll-behavior: none;
    /* Prevent pull-to-refresh in standalone — implement custom */
    overscroll-behavior-y: contain;
  }
}

/* Enable :active states on iOS Safari — REQUIRED */
/* Without this, :active pseudo-class doesn't fire on touch */
/* Add companion JS: document.body.addEventListener('touchstart', () => {}, { passive: true }) */
```

**In `+layout.svelte` onMount:**
```javascript
document.body.addEventListener('touchstart', () => {}, { passive: true });
```

---

## 3. Button & Touch Feedback

Every interactive element uses iOS-style scale-down + opacity, never Material ripple.

```css
/* Universal interactive feedback */
button, .interactive, [role="button"], a.card {
  transition: transform 100ms ease, opacity 100ms ease;
  will-change: transform;
}
button:active, .interactive:active, [role="button"]:active, a.card:active {
  transform: scale(0.97);
  opacity: 0.7;
}

/* Primary CTA buttons — slightly larger scale response */
.btn-primary:active {
  transform: scale(0.95);
  opacity: 0.85;
}
```

---

## 4. Navigation Bar (Translucent Blur)

Use Konsta UI `Navbar` as the base, override with brand styles. If building custom:

```css
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  background: rgba(17, 17, 16, 0.72); /* #111110 @ 72% */
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.08); /* iOS hairline */
  padding: 14px 16px;
  padding-top: max(env(safe-area-inset-top, 14px), 14px);
}
```

**Critical meta tags in `app.html`:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#111110">
```

`viewport-fit=cover` is REQUIRED — without it, all `env(safe-area-inset-*)` values return zero.

---

## 5. Safe Area Handling

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}

/* Apply to fixed/sticky bottom elements */
.tab-bar, .bottom-action {
  padding-bottom: max(var(--safe-bottom), 12px);
}

/* Apply to fixed/sticky top elements */
.nav-bar, .stories-progress {
  padding-top: max(var(--safe-top), 12px);
}
```

---

## 6. Konsta UI Integration

### Setup in root layout

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { App } from 'konsta/svelte';
  import { onMount } from 'svelte';
  import { onNavigate } from '$app/navigation';

  // Enable :active states on iOS
  onMount(() => {
    document.body.addEventListener('touchstart', () => {}, { passive: true });
  });

  // View Transitions (see section 8)
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  let { children } = $props();
</script>

<App theme="ios" dark>
  {@render children()}
</App>
```

### Override Konsta theme colors

```css
/* In your global CSS or Tailwind theme */
:root {
  --k-ios-primary: #c9a96e;           /* gold accent */
  --k-ios-bars-bg-color: rgba(17, 17, 16, 0.72);
  --k-ios-surface-color: #111110;
  --k-ios-surface-1-color: #1a1a19;
  --k-ios-surface-2-color: #222221;
}
```

### Use Konsta for these components ONLY

- `ActionSheet` — RSVP options, share menu, "more" menus
- `Sheet` / bottom sheets — event details overflow, photo info
- `Dialog` — confirmation dialogs, error states
- `Toast` — RSVP confirmed, photo uploaded, link copied
- `Navbar` — sticky header with blur (override fonts)

### Build custom for these

- Event page layout and hero image
- RSVP button and confirmation animation
- Photo Stories viewer (section 9)
- Event wall / comments
- All typography (Vollkorn headers, Manrope body)

---

## 7. Spring Physics — Key Animations

Use Svelte 5 `Spring` class for interactive animations. These parameters match iOS UIKit dynamics.

```javascript
import { Spring } from 'svelte/motion';
```

### iOS-Matching Spring Parameters

| Pattern | Stiffness | Damping | Use Case |
|---|---|---|---|
| Button press | 0.35 | 0.65 | RSVP button, cards |
| Sheet presentation | 0.3 | 0.7 | Bottom sheets sliding up |
| Dismiss gesture | 0.4 | 0.75 | Swipe-to-dismiss on photos |
| Toggle / switch | 0.5 | 0.6 | State toggles |
| Overshoot bounce | 0.25 | 0.55 | Success confirmation |

### RSVP Button — Most Important Micro-Interaction

```svelte
<script>
  import { Spring } from 'svelte/motion';

  let rsvpStatus = $state('none');
  const scale = new Spring(1, { stiffness: 0.35, damping: 0.65 });
  const checkScale = new Spring(0, { stiffness: 0.25, damping: 0.55 });

  function handleRSVP() {
    rsvpStatus = 'going';
    scale.target = 1.05;
    checkScale.target = 1;
    setTimeout(() => scale.target = 1, 150);
    // Also: trigger haptic if available (see section 11)
  }
</script>

<button
  ontouchstart={() => scale.target = 0.95}
  ontouchend={() => scale.target = 1}
  onclick={handleRSVP}
  style:transform="scale({scale.current})"
  class="btn-primary"
>
  {#if rsvpStatus === 'going'}
    <span style:transform="scale({checkScale.current})" style:display="inline-block">
      ✓ Going
    </span>
  {:else}
    RSVP
  {/if}
</button>
```

---

## 8. Page Transitions — View Transitions API

The `onNavigate` hook in the root layout (section 6) enables this globally. Safari 18+ (iOS 18+) supports same-document view transitions.

### Default Push/Pop Navigation

```css
/* src/lib/styles/transitions.css */

/* iOS default easing: cubic-bezier(0.25, 0.1, 0.25, 1.0), 350ms */

@keyframes slide-from-right {
  from { transform: translateX(100%); }
}
@keyframes slide-to-left {
  to { transform: translateX(-30%); opacity: 0.7; }
}
@keyframes slide-from-left {
  from { transform: translateX(-30%); opacity: 0.7; }
}
@keyframes slide-to-right {
  to { transform: translateX(100%); }
}

/* Forward navigation */
::view-transition-old(root) {
  animation: 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0) both slide-to-left;
}
::view-transition-new(root) {
  animation: 350ms cubic-bezier(0.25, 0.1, 0.25, 1.0) both slide-from-right;
}
```

**Fallback**: View Transitions API degrades gracefully to instant navigation on older iOS. No polyfill needed or possible.

---

## 9. Photo Stories Viewer

The primary retention feature. Stories-first entry with grid escape hatch.

### Architecture

```
Event Page
  └─ "View Photos" card (overlapping avatar stack + play icon)
       └─ Stories Viewer (fullscreen overlay, no route change)
            ├─ Auto-advance: 4s per photo, tap to skip
            ├─ Progress bars at top (segmented, animated)
            ├─ Tap zones: left 30% = prev, right 70% = next (no center dead zone for tap-to-advance)
            ├─ Center tap = toggle info overlay
            ├─ Long press (200ms) = pause, release = resume
            ├─ Swipe left/right = prev/next with spring physics
            ├─ Swipe down = dismiss (spring with resistance curve)
            ├─ Header: uploader avatar + name + time + grid icon + close
            ├─ Footer: caption + "Save" + "Share" buttons
            └─ Grid icon → Grid View (slide-up overlay)
                 ├─ 3-column thumbnail grid
                 ├─ Tap thumbnail → re-enter Stories at that index
                 └─ "← Stories" back button
```

### Key Implementation Details

**Preloading**: Under 20 photos expected. Preload ALL images on Stories mount:
```javascript
onMount(() => {
  photos.forEach(p => {
    const img = new Image();
    img.src = p.fullUrl;
  });
});
```

**Timer with pause/resume**: Use `setInterval` with ~30ms tick updating a progress float (0→1). Clear on pause, photo change, or unmount.

**Swipe-to-dismiss with resistance curve**: Multiply downward drag delta by 0.5 for rubber-band feel. Scale image down proportional to drag distance. Dismiss threshold: 120-150px.

```javascript
// Resistance curve for swipe-down
const resistedY = deltaY * 0.5;
const dismissProgress = Math.min(resistedY / 200, 1);
const photoScale = 1 - (dismissProgress * 0.15);
```

**Use raw touch events** (touchstart/touchmove/touchend), not svelte-gestures. The Stories viewer needs precise control over:
- Axis locking (determine horizontal vs vertical on first 8px of movement)
- Tap zone detection (left/center/right by touch position)
- Long press timing (200ms, shorter than iOS default 500ms)
- Distinguishing tap vs swipe vs hold

**Edge flash feedback**: When user taps left on first photo, briefly flash a white gradient on the left edge (200ms, 8% opacity) to indicate boundary.

### Photos from R2

Photos are EXIF-stripped and served from Cloudflare R2 via Cloudflare Images for responsive sizing. The Stories viewer should request the full-res variant. Grid thumbnails use the smaller variant.

---

## 10. PWA Configuration

### Vite Config

```javascript
// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default {
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.js',
      manifest: {
        name: 'Ephemeral Events',
        short_name: 'Ephemeral',
        start_url: '/',
        display: 'standalone',
        background_color: '#111110',
        theme_color: '#111110',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
};
```

### SvelteKit Config

```javascript
// svelte.config.js
export default {
  kit: {
    serviceWorker: { register: false } // Let @vite-pwa handle registration
  }
};
```

### Splash Screens

iOS ignores the manifest for splash screens. Use `pwa-asset-generator` to create `apple-touch-startup-image` link tags for all device sizes (~25 images):

```bash
npx pwa-asset-generator logo.svg ./static/splash --splash-only --background "#111110" --dark-mode
```

### Standalone Mode Detection

```javascript
export function isStandalone() {
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}
```

---

## 11. iOS-Specific Enhancements

### Haptic Feedback (iOS 18+)

The `ios-haptics` library triggers native haptics by programmatically toggling a hidden `<input type="checkbox" switch>`. Use on: RSVP confirm, photo save, ticket scan success.

```bash
npm install ios-haptics
```

```javascript
import { haptics } from 'ios-haptics';
// haptics.light() | haptics.medium() | haptics.heavy()
```

### Collapsing Large Title Header

iOS "Large Title" pattern: 34px bold title at rest, collapses to centered 17px semibold on scroll. Implement with `IntersectionObserver` on a sentinel element.

```svelte
<script>
  let isCollapsed = $state(false);
  let sentinel;

  onMount(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { isCollapsed = !entry.isIntersecting; },
      { threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  });
</script>

<div bind:this={sentinel} class="h-0" />
<nav class="nav-bar">
  {#if isCollapsed}
    <span class="text-[17px] font-semibold font-manrope text-center w-full">
      {title}
    </span>
  {/if}
</nav>
{#if !isCollapsed}
  <h1 class="text-[34px] font-bold font-vollkorn tracking-tight px-4 pb-2">
    {title}
  </h1>
{/if}
```

### Hero Parallax

Subtle parallax on event cover image (15-20% slower scroll):

```javascript
let scrollY = $state(0);
// In template:
// style:transform="translateY({scrollY * 0.15}px)"
```

### Keyboard Viewport Bug Workaround

iOS doesn't resize the layout viewport when the keyboard opens. Fixed elements get pushed behind the keyboard. Workaround:

```javascript
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const offset = window.innerHeight - window.visualViewport.height;
    document.documentElement.style.setProperty('--keyboard-offset', `${offset}px`);
  });
}
```

```css
.bottom-fixed-element {
  bottom: calc(var(--keyboard-offset, 0px) + var(--safe-bottom));
}
```

---

## 12. Scroll Behavior

```css
/* Individual scroll containers — keep momentum but prevent chaining */
.scroll-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* redundant since iOS 13 but harmless */
  overscroll-behavior-y: contain;
}

/* Scroll snap for horizontal carousels */
.horizontal-scroll {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.horizontal-scroll > * {
  scroll-snap-align: start;
}
```

---

## 13. Chrome & Android — Progressive Enhancements

iOS is the baseline. Everything above works identically on Chrome iOS because Chrome iOS IS WebKit. These enhancements layer on top for Android Chrome users only, using the platform detection from section 1b.

### 13a. Android Install Prompt (beforeinstallprompt)

Android Chrome fires `beforeinstallprompt` automatically when your PWA meets installability criteria. This is the one platform where you CAN programmatically trigger an install prompt. iOS has nothing equivalent.

```typescript
// src/lib/stores/install-prompt.ts
import { writable } from 'svelte/store';

export const installPromptEvent = writable<any>(null);
export const canInstall = writable(false);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Suppress Chrome's default mini-infobar
    installPromptEvent.set(e);
    canInstall.set(true);
  });

  window.addEventListener('appinstalled', () => {
    installPromptEvent.set(null);
    canInstall.set(false);
  });
}
```

```svelte
<!-- Android install button — show conditionally -->
<script>
  import { canInstall, installPromptEvent } from '$lib/stores/install-prompt';

  async function handleInstall() {
    const event = $installPromptEvent;
    if (!event) return;
    event.prompt();
    const result = await event.userChoice;
    if (result.outcome === 'accepted') {
      canInstall.set(false);
    }
  }
</script>

{#if $canInstall}
  <button onclick={handleInstall} class="install-banner">
    Add Ephemeral to your home screen
  </button>
{/if}
```

**Timing strategy**: Don't show immediately. Show after a meaningful engagement signal — RSVP completion, second event visit, or photo gallery interaction. Post-conversion prompts achieve 20-40% higher install rates.

### 13b. iOS Install Education Banner

Since iOS has no programmatic install, show a custom educational overlay. Detect iOS + not-standalone, then show animated step-by-step instructions.

```svelte
<script>
  import { isIOS, isStandalone } from '$lib/utils/platform';
  import { browser } from '$app/environment';

  let showBanner = $state(false);

  $effect(() => {
    if (!browser) return;
    if (isIOS() && !isStandalone()) {
      const dismissed = localStorage.getItem('install-dismissed');
      const visits = parseInt(localStorage.getItem('visit-count') || '0') + 1;
      localStorage.setItem('visit-count', String(visits));
      // Show on 2nd+ visit, not dismissed in last 30 days
      if (visits >= 2 && !dismissed) {
        showBanner = true;
      }
    }
  });

  function dismiss() {
    showBanner = false;
    localStorage.setItem('install-dismissed', Date.now().toString());
  }
</script>

{#if showBanner}
  <div class="install-education-banner">
    <p>Add Ephemeral to your home screen for the best experience</p>
    <ol>
      <li>Tap the <strong>Share</strong> icon <span class="share-icon">↑</span></li>
      <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
    </ol>
    <button onclick={dismiss}>Got it</button>
  </div>
{/if}
```

**Works in Chrome iOS too** — since iOS 16.4, Chrome's Share button (in the URL bar) also offers "Add to Home Screen." The instructions are the same flow, just a different Share button location. Adjust the banner copy if you detect Chrome iOS: `navigator.userAgent.includes('CriOS')`.

### 13c. Android Haptic Feedback (Vibration API)

`navigator.vibrate()` works on Android, is completely blocked on iOS. Use as progressive enhancement alongside `ios-haptics` for iOS 18+:

```typescript
// src/lib/utils/haptics.ts
import { supportsVibration, isIOS } from './platform';

export async function hapticLight() {
  if (supportsVibration()) {
    navigator.vibrate(10); // Android — short buzz
  } else if (isIOS()) {
    // ios-haptics library (iOS 18+ only, fails silently otherwise)
    try {
      const { haptics } = await import('ios-haptics');
      haptics.light();
    } catch { /* not supported, fail silently */ }
  }
}

export async function hapticSuccess() {
  if (supportsVibration()) {
    navigator.vibrate([10, 50, 20]); // Android — double buzz pattern
  } else if (isIOS()) {
    try {
      const { haptics } = await import('ios-haptics');
      haptics.medium();
    } catch {}
  }
}
```

Use on: RSVP confirm, ticket scan success, photo save confirmation.

### 13d. Android Badge API

`navigator.setAppBadge()` works on Android Chrome, not iOS. Show unread notification count on home screen icon:

```typescript
export function updateBadge(count: number) {
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      (navigator as any).setAppBadge(count);
    } else {
      (navigator as any).clearAppBadge();
    }
  }
}
```

### 13e. Android Background Sync

Android Chrome supports `BackgroundSyncManager` — queue offline actions and sync when connectivity returns. iOS does NOT support this.

```typescript
// In service worker (Android only)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-rsvp') {
    event.waitUntil(syncPendingRSVPs());
  }
});

// To register a sync (in main app code)
async function queueOfflineRSVP(rsvpData) {
  // Always save to IndexedDB first
  await saveToIndexedDB('pending-rsvps', rsvpData);

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    // Android — will sync automatically when online
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('sync-rsvp');
  } else {
    // iOS fallback — sync on visibilitychange or online event
    window.addEventListener('online', () => syncPendingRSVPs(), { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') syncPendingRSVPs();
    }, { once: true });
  }
}
```

### 13f. Android-Specific CSS Adjustments

```css
/* Android Chrome shows visible scrollbars — hide them for app feel */
@supports (overflow: overlay) {
  .scroll-container {
    overflow: overlay;
  }
}

/* Thin scrollbar fallback for Android */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}
*::-webkit-scrollbar {
  width: 4px;
}
*::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}

/* Android Chrome supports overscroll-behavior fully */
/* Pull-to-refresh suppression works natively (unlike iOS standalone) */
html {
  overscroll-behavior-y: contain;
}

/* Android status bar — theme-color meta tag already handles this */
/* But Android also supports dynamic theme-color per page: */
```

```svelte
<!-- Dynamic theme-color per route (Android Chrome only) -->
<svelte:head>
  <meta name="theme-color" content={pageThemeColor || '#111110'}>
</svelte:head>
```

Android Chrome also supports the `description` and `screenshots` fields in your manifest for a richer install dialog:

```javascript
// In the manifest (section 10 SvelteKitPWA config), add:
manifest: {
  // ... existing config ...
  description: 'Beautiful, private event planning. RSVP, share photos, and connect.',
  screenshots: [
    {
      src: '/screenshots/event-page.png',
      sizes: '1080x1920',
      type: 'image/png',
      form_factor: 'narrow',
      label: 'Event page with RSVP'
    },
    {
      src: '/screenshots/photo-stories.png',
      sizes: '1080x1920',
      type: 'image/png',
      form_factor: 'narrow',
      label: 'Photo Stories viewer'
    }
  ]
}
```

### 13g. Platform Capability Summary

| Capability | iOS Safari/Chrome | Android Chrome |
|---|---|---|
| Install prompt (programmatic) | ❌ Manual only | ✅ `beforeinstallprompt` |
| Haptic feedback | ⚠️ ios-haptics hack (18+) | ✅ `navigator.vibrate()` |
| Badge count on icon | ❌ | ✅ `setAppBadge()` |
| Background Sync | ❌ | ✅ `SyncManager` |
| Push notifications | ✅ Installed PWA only (16.4+) | ✅ Browser or installed |
| View Transitions API | ✅ Safari 18+ (iOS 18+) | ✅ Chrome 111+ |
| Fullscreen API | ⚠️ Standalone PWA only | ✅ Full support |
| Web Share API | ✅ | ✅ |
| Orientation lock | ❌ | ✅ `screen.orientation.lock()` |
| Wake Lock | ✅ Safari 18.4+ | ✅ |
| Persistent storage | ⚠️ 7-day eviction risk | ✅ `navigator.storage.persist()` |
| Contact Picker API | ❌ | ✅ `navigator.contacts.select()` |

---

## 14. Implementation Order

This is the build sequence, ordered by user-impact-per-hour-invested:

| Priority | Task | Time | Impact |
|---|---|---|---|
| 1 | CSS reset + meta tags (sections 2, 4) | 1-2hr | Every user, immediate |
| 2 | Platform detection utility (section 1b) | 1hr | Foundation for all branching |
| 3 | Button touch feedback (section 3) | 1hr | Every interaction feels right |
| 4 | Nav bar with blur + safe areas (sections 4, 5) | 2hr | First thing users see |
| 5 | Konsta UI setup + theme override (section 6) | 3hr | Sheets/dialogs/toasts feel native |
| 6 | RSVP spring animation (section 7) | 2hr | Most important single interaction |
| 7 | View Transitions for page nav (section 8) | 2hr | Multi-page flow feels native |
| 8 | Stories viewer — core (section 9) | 6-8hr | Retention feature |
| 9 | Stories viewer — grid escape hatch | 2hr | Findability |
| 10 | PWA manifest + service worker (section 10) | 3hr | Installability + offline |
| 11 | Install prompts — Android + iOS (section 13a-b) | 3hr | Drive home screen installs |
| 12 | Haptics — cross-platform (section 13c) | 1hr | Delight on both platforms |
| 13 | Collapsing header + parallax (section 11) | 3hr | Polish |
| 14 | Android scrollbar + CSS fixes (section 13f) | 1hr | Android visual polish |
| 15 | Keyboard workaround (section 11) | 1hr | Fixes comment/input flows |
| 16 | Badge + background sync (section 13d-e) | 2hr | Android retention features |

**Total: ~30-35 hours of focused work.**

---

## 14. What You CANNOT Achieve (Hard Platform Limits)

Do not waste time attempting these — they are iOS PWA hard limits:

- **Auto-fullscreen/auto-install**: No API exists. Users must manually Add to Home Screen.
- **Background sync**: Service workers are killed when backgrounded. Queue actions in IndexedDB, sync on `visibilitychange`.
- **Haptic vibration API**: `navigator.vibrate()` is blocked on iOS. Use the `ios-haptics` checkbox hack (iOS 18+ only).
- **Badge count**: `navigator.setAppBadge()` not supported on iOS.
- **Orientation lock**: Not available in iOS PWA.
- **Links opening in PWA**: Shared `ephmr.al` links always open in Safari, never in the installed PWA (no URL capture for web apps). Universal Links require a native app wrapper.
- **True fullscreen**: Status bar is always visible in standalone PWA mode. `element.requestFullscreen()` only works in standalone mode, not Safari.
- **IndexedDB persistence**: Apple purges after ~7 days of inactivity. Never use as sole data source.

---

## 15. Cross-Browser & Cross-Platform Adjustments

### The iOS Browser Reality

All browsers on iOS (Chrome, Firefox, Edge, Brave, Arc) are required by Apple to use WebKit — the same engine as Safari. This means:

- **CSS/JS behavior is identical** across all iOS browsers. No Chrome-specific CSS hacks needed.
- **PWA capabilities are identical.** Push notifications, service workers, storage limits, View Transitions — all gated by WebKit, not the browser brand.
- **The only differences are browser UI** — where the share button is, what the URL bar looks like, and the install flow UX.

Do NOT write browser-specific CSS for Chrome on iOS. It's the same renderer.

### Install Flow Differences by Platform

| Platform | Install Mechanism | Auto-Prompt? | How Users Find It |
|---|---|---|---|
| iOS Safari | Share → Add to Home Screen | No | Manual, buried in share sheet |
| iOS Chrome | Share → Add to Home Screen | No | Even more buried — share icon is in URL bar |
| iOS Firefox/Edge | Share → Add to Home Screen | No | Same pattern, different UI chrome |
| Android Chrome | `beforeinstallprompt` event | **Yes** | Native install banner + address bar icon |
| Android Samsung Internet | `beforeinstallprompt` event | **Yes** | Similar to Chrome |
| Android Firefox | Menu → Install | No auto-prompt | Manual but more discoverable |

### Custom Install Prompt — Platform-Aware

Detect platform and show appropriate install instructions:

```javascript
// src/lib/utils/platform.ts

export function getPlatform() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isStandalone = window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
  
  // Chrome on iOS is still WebKit — detect by checking for 'CriOS'
  const isChromeIOS = /CriOS/.test(ua);
  const isFirefoxIOS = /FxiOS/.test(ua);
  const isSafari = isIOS && !isChromeIOS && !isFirefoxIOS && /Safari/.test(ua);
  const isChromeAndroid = isAndroid && /Chrome/.test(ua) && !/Edge/.test(ua);

  return { isIOS, isAndroid, isStandalone, isChromeIOS, isSafari, isChromeAndroid };
}
```

**iOS Safari install instructions UI:**
- Show Safari's Share icon (square with up arrow)
- "Tap Share → scroll down → Add to Home Screen"
- Show animated walkthrough with the 3 steps

**iOS Chrome install instructions UI:**
- Show Chrome's share icon (differs from Safari — it's in the address bar area)
- "Tap the Share icon in the address bar → Add to Home Screen"
- Different visual than Safari prompt — users get confused if you show Safari's icon

**Android Chrome — use `beforeinstallprompt`:**
```javascript
// src/lib/stores/install.ts
let deferredPrompt = $state(null);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Suppress default mini-infobar
    deferredPrompt = e;
  });
}

export function canPromptInstall() {
  return deferredPrompt !== null;
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}
```

On Android Chrome, you get a real native install dialog — no need for educational banners. Trigger it after a meaningful engagement signal (post-RSVP, after viewing photos).

### Android Chrome — Additional Capabilities to Enable

Android Chrome supports features that iOS blocks entirely. Feature-detect and progressively enhance:

```javascript
// Vibration API — works on Android, blocked on iOS
export function hapticFeedback(pattern = [10]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
  // On iOS 18+, fall back to ios-haptics checkbox hack (see section 11)
}

// Badge API — works on Android Chrome, not iOS
export async function setBadge(count) {
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else {
      await navigator.clearAppBadge();
    }
  }
}

// Background Sync — Android only
export async function registerSync(tag) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register(tag);
  }
}
```

| Feature | Android Chrome | iOS (all browsers) | Action |
|---|---|---|---|
| `beforeinstallprompt` | ✅ Native dialog | ❌ Manual only | Show platform-specific prompt |
| `navigator.vibrate()` | ✅ Works | ❌ Blocked | Feature-detect, use ios-haptics fallback |
| `navigator.setAppBadge()` | ✅ Works | ❌ Not supported | Feature-detect, skip gracefully |
| Background Sync | ✅ Works | ❌ Not supported | Queue in IndexedDB, sync on visibilitychange |
| `navigator.share()` (with files) | ✅ Full support | ✅ iOS 15+ | Works cross-platform |
| `navigator.contacts.select()` | ✅ Android Chrome only | ❌ Not supported | Feature-detect, show manual input fallback |
| Orientation lock | ✅ Works | ❌ Not supported | Feature-detect, skip |
| Persistent storage | ✅ `navigator.storage.persist()` | ⚠️ Requires notification permission | Always re-cache on launch |

### Android Material Design vs iOS — Auto-Theme with Konsta

Konsta UI supports both iOS and Material themes. Auto-detect the platform:

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import { App } from 'konsta/svelte';
  import { getPlatform } from '$lib/utils/platform';
  
  const { isIOS } = getPlatform();
  const theme = isIOS ? 'ios' : 'material';
</script>

<App {theme} dark>
  {@render children()}
</App>
```

This means Android users get Material-style sheets, dialogs, and nav patterns that feel native to THEIR platform, while iOS users get the iOS patterns. Same codebase, platform-appropriate UX.

### Android-Specific CSS Adjustments

```css
/* Android Chrome supports these — iOS doesn't */

/* Orientation lock hint */
@media (orientation: landscape) and (max-height: 500px) {
  .landscape-warning {
    display: flex; /* Show "rotate your device" hint */
  }
}

/* Android overscroll glow — prevent on scroll containers */
.scroll-container {
  overscroll-behavior-y: contain; /* Works on Android + iOS */
}

/* Android Chrome address bar auto-hide — account for 
   dynamic viewport changes with dvh units */
.full-height {
  height: 100dvh; /* Dynamic viewport height — shrinks when address bar shows */
}

/* Fallback for older browsers that don't support dvh */
@supports not (height: 100dvh) {
  .full-height {
    height: 100vh;
    height: -webkit-fill-available;
  }
}
```

### Web App Manifest — Android Extras

Android Chrome reads manifest fields that iOS ignores. Include them — they're free:

```json
{
  "name": "Ephemeral Events",
  "short_name": "Ephemeral",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111110",
  "theme_color": "#111110",
  "description": "Beautiful, private event planning",
  "orientation": "portrait",
  "categories": ["social", "entertainment"],
  "screenshots": [
    {
      "src": "/screenshots/event-page.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Event page with RSVP"
    }
  ],
  "shortcuts": [
    {
      "name": "Create Event",
      "short_name": "Create",
      "url": "/create",
      "icons": [{ "src": "/icons/create-96.png", "sizes": "96x96" }]
    }
  ],
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

Android-only manifest benefits:
- `screenshots` — shown in the install dialog, makes it look professional
- `shortcuts` — long-press the app icon for quick actions (like "Create Event")
- `categories` — helps Android categorize the app
- `orientation` — locks to portrait on Android (ignored on iOS)
- `description` — shown in Android install prompt

---

## 16. Testing Checklist

### Core UX (test on all platforms)

- [ ] No grey tap highlight flash on any interactive element
- [ ] No text selection handles appearing on buttons/nav
- [ ] No rubber-band bounce on the page body
- [ ] `:active` states fire on first touch (not second)
- [ ] Blur nav bar is translucent (content scrolls behind it)
- [ ] Springs feel snappy, not bouncy or sluggish
- [ ] Stories: auto-advance pauses on hold, resumes on release
- [ ] Stories: swipe-down dismiss has resistance curve, not linear
- [ ] Stories: edge tap on first/last photo gives feedback, doesn't break
- [ ] Page transitions play on forward navigation (iOS 18+ / all Android)
- [ ] No layout shift when keyboard opens on input focus
- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] `100dvh` renders correctly (no content behind address bar)

### iOS-Specific

- [ ] Safe areas respected on iPhone with notch/Dynamic Island
- [ ] Splash screens render on all device sizes (check with pwa-asset-generator)
- [ ] Install instructions show Safari share icon when in Safari
- [ ] Install instructions show Chrome share icon when in Chrome iOS
- [ ] Standalone mode: custom back navigation works (no browser back button)
- [ ] ios-haptics fires on RSVP (iOS 18+ devices only)

### Android Chrome-Specific

- [ ] `beforeinstallprompt` fires and custom prompt appears
- [ ] Install dialog shows screenshots from manifest
- [ ] App shortcuts appear on long-press of installed icon
- [ ] `navigator.vibrate()` fires on RSVP confirmation
- [ ] Badge count updates on new notifications
- [ ] Konsta auto-detects Material theme on Android
- [ ] Address bar auto-hides on scroll (content uses `100dvh`)
