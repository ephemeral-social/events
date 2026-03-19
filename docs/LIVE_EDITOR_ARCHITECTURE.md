# Live Create/Edit/Save Architecture Plan (DRAFT)

> Status: DRAFT — pending layout redesign before implementation

## The Vision

Instead of a separate form page → redirect to event page, the create/edit experience **IS the event page**. You're editing the real rendered layout — HeroCover, info card, description — with clickable/editable regions. Choose a theme and watch it apply live. Upload a cover and see it fill the hero. Type a title and see it render in the actual display typography. Hit "Publish" (create) or "Done" (edit) and you're looking at the final page.

## What Changes vs What Stays

**Merged into the live editor:**
- Title, description, venue, date/time entry
- Theme/mode/accent picker
- Cover image upload
- Max attendees, guest list visibility, location hidden toggles
- Event type selection (simple vs ticketed)

**Stays as separate flows:**
- Stripe Connect onboarding (`/e/[slug]/setup-ticketing`)
- Auth modal
- Check-in scanner, text blasts, co-host invites (post-publish host tools)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  /create  OR  /e/[slug]/edit                        │
│                                                      │
│  EditableHero                                        │
│  ├── Cover: click-to-upload / drag-drop              │
│  ├── GenerativeCover fallback (live)                 │
│  ├── Title: inline text input (styled as h1)         │
│  ├── Host byline: auto from session                  │
│  └── Frosted info card (editable regions):           │
│      ├── Date/time → popover picker                  │
│      ├── Venue → inline inputs                       │
│      └── RSVP counts → shows "0 going"               │
│                                                      │
│  Content section                                     │
│  ├── Description: click-to-edit textarea             │
│  ├── Settings panel (expandable)                     │
│  └── Event type: simple/ticketed toggle              │
│                                                      │
│  EditorToolbar (fixed bottom bar)                    │
│  └── [Theme] [Settings] [Save status] [Publish]     │
└─────────────────────────────────────────────────────┘
```

## Technical Decisions

### State: Module-level `$state` deep proxy
- `src/lib/stores/event-draft.svelte.ts`
- Svelte 5 auto-proxies plain objects — `draft.title = 'x'` triggers fine-grained updates
- No Context API needed (single page session, `ssr = false`)
- No Superforms (designed for submit-validate, not live editing)

### Inline Editing: Styled inputs, NOT contenteditable
- Svelte 5 issue #11653: `bind:textContent` takes exclusive control
- Use transparent `<input>`/`<textarea>` styled to match display typography

### Autosave: `$effect` cleanup debounce + promise-chain queue
- Return cleanup from `$effect` to cancel timer on next change
- Promise chain prevents race conditions between concurrent saves

### Two-Phase Create: Local state → Publish
- Create mode: everything local until "Publish" → POST creates event
- Edit mode: load existing → autosave via PATCH (debounced 2s)
- No eager draft creation (avoids abandoned draft cleanup)

### Cover Image: Optimistic preview + background upload
- `URL.createObjectURL()` for instant preview
- Background POST to backend (EXIF stripping happens server-side)

### Theme: Same `$effect` pattern as current event page
- Draft theme/mode/accent drives `data-theme`/`data-mode` attributes
- Changes are instant on the actual layout

### Unsaved Changes: beforeNavigate + beforeunload
- Custom modal for internal navigation
- Native browser dialog for tab close
- SvelteKit Snapshots for browser back/forward

## File Structure

```
src/lib/
├── stores/
│   └── event-draft.svelte.ts          # Reactive draft state + autosave
└── components/
    └── editor/
        ├── EventEditor.svelte          # Shell: preview layout + toolbar
        ├── EditableHero.svelte         # Hero with inline title + cover
        ├── EditableInfoCard.svelte     # Date/time/venue popovers
        ├── EditableDescription.svelte  # Click-to-edit textarea
        ├── EditorToolbar.svelte        # Fixed bottom bar
        ├── EditorSettings.svelte       # Slide-up settings panel
        ├── InlineTextInput.svelte      # Reusable click-to-edit primitive
        ├── CoverUploader.svelte        # Drag-drop with preview
        ├── SaveStatusIndicator.svelte  # Saving/saved/error indicator
        └── ExitWarningModal.svelte     # Unsaved changes guard

src/routes/
├── create/+page.svelte               # Mounts EventEditor (create mode)
└── e/[slug]/edit/+page.svelte         # Mounts EventEditor (edit mode)
```

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Mobile keyboard pushes layout | `visualViewport` API; heavy iOS Safari testing |
| Abandoned drafts | Lazy creation (no backend until publish) |
| Two-tab conflicts | Last-write-wins with `updated_at`; "edited elsewhere" warning |
| Theme CSS flash | Same FOUC fix already in place |
| Cover upload failure | Error toast, keep local preview, retry option |
