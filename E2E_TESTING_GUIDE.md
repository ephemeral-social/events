# Manual E2E Testing Guide - Production

**Production URL:** https://ephemeralsocial.com
**Backend API:** https://ephemeral-api.ephemeralsocial.workers.dev

> Auth uses Twilio Verify (real SMS). You'll need a real phone number that can receive texts.

---

## Pre-flight

1. Open https://ephemeralsocial.com in your browser
2. Open DevTools Network tab to watch API calls
3. Have your phone ready for SMS codes

---

## Test 1: Landing Page

1. Visit `/` (root URL)
2. Verify:
   - Dark background (warm near-black, not pure #000)
   - "Ephemeral" heading with Vollkorn serif font
   - Rotating hero words animation
   - "Join the Waitlist" CTA button
   - Footer with Privacy/Terms links

---

## Test 2: Create an Event (as Host)

1. Visit `/create`
2. You'll be redirected to auth -- enter your real phone number
3. Receive SMS code, enter it
4. Fill in the event form:
   - **Title:** "Test Dinner Party"
   - **Slug:** "test-dinner" (auto-suggested, you can customize)
   - **Date:** Pick a future date
   - **Time:** 7:00 PM
   - **Venue:** "My Place"
   - **Address:** "123 Main St"
   - **Description:** "Testing the event platform"
   - **Max attendees:** 10 (optional)
5. Click "Create Event"
6. Verify redirect to `/e/test-dinner`
7. Note the event URL for subsequent tests

---

## Test 3: Event Page (Public View)

1. Open the event URL in an **incognito window** (no auth)
2. Verify visible elements:
   - Event title as h1
   - "Hosted by [Your Name]" subtitle
   - Date/time with calendar icon
   - Venue and address with location icon
   - Description text
   - Green "RSVP" button
   - **Privacy Dashboard** section (always visible):
     - "0 photos uploaded"
     - "EXIF stripped"
     - "Data sharing: none"
     - Auto-delete countdown
   - Share section with copy link and calendar export
3. Verify hidden elements (should NOT show for unauthenticated):
   - No comment wall
   - No photo grid
   - No guest list details
   - No cost summary

---

## Test 4: RSVP Flow (as Guest)

1. Still in incognito, click the green "RSVP" button
2. Auth modal should appear with phone input focused
3. Enter a **different** real phone number
4. Click "Continue" or press Enter
5. Enter the SMS code
6. After auth, you should see the RSVP form:
   - Three buttons: "Going" / "Maybe" / "Can't make it"
   - Display name field
   - Plus-ones counter (start at 0)
7. Select "Going", enter a display name, click "I'm Going"
8. Verify:
   - Status shows "Going" with green checkmark
   - "Change" button appears
   - Going count increments (e.g., "2 going")
   - Event Wall (comments) section now visible
   - Photo grid now visible ("No photos yet")
   - Guest list section now visible

---

## Test 5: Change RSVP Status

1. Click "Change" on your RSVP status
2. Select "Maybe"
3. Verify status updates to "Maybe"
4. Change again to "Can't make it"
5. Verify status updates

---

## Test 6: Comments (Event Wall)

1. As the RSVP'd guest, scroll to "Event Wall"
2. Type a comment in the text box
3. Click the send button
4. Verify the comment appears with your display name
5. Verify "No comments yet" is gone

---

## Test 7: Keyboard & Accessibility

1. Visit the event page, press Tab repeatedly
2. Verify focus ring is visible on interactive elements
3. Click RSVP (on a new incognito window), then:
   - Press **Escape** -- modal should close
   - Re-open, press **Tab** -- focus should cycle within modal
   - Type phone number, press **Enter** -- should submit

---

## Test 8: Edit Event (as Host)

1. In your host session, visit `/e/test-dinner/edit`
2. Change the title to "Updated Dinner Party"
3. Update the description
4. Click Save
5. Verify redirect to event page with updated info

---

## Test 9: My Events Dashboard

1. Visit `/my-events`
2. Verify:
   - "Hosting" tab active by default
   - Your event card shows with "Host" badge
   - Going count is displayed
   - Click the event card -- navigates to event page
3. Click "Attending" tab
   - If you RSVP'd to your own event, it shows here too

---

## Test 10: Text Blast (Host Only)

1. As host, visit your event page
2. Scroll to "Text Blast" section (only visible to host)
3. Type a message
4. Click "Send Text Blast"
5. Accept the confirmation dialog
6. Verify "Message sent to all guests!" appears
7. Check remaining blast count (starts at 3)

---

## Test 11: Guest List

1. As host, the guest list shows by default
2. Click the "Guest List" accordion to expand
3. Verify guests are grouped by status (Going, Maybe)
4. Declined guests should NOT appear (unless you're the host)

---

## Test 12: Privacy Dashboard

Visible on EVERY event page (authenticated or not):
1. Check "Photos: 0 photos uploaded"
2. Check "Metadata: EXIF stripped"
3. Check "Data sharing: none"
4. Check "Auto-delete: X days until deletion"

---

## Test 13: Share Panel

1. Click "Copy event link" button
2. Paste somewhere -- should be an `ephmr.al/e/XXXXXX` short URL
3. Click "Add to Calendar" -- should download .ics file

---

## Test 14: Mobile Responsiveness

1. Open DevTools, toggle device toolbar (Cmd+Shift+M)
2. Select iPhone 14 (375x812)
3. Visit the event page:
   - Single column layout
   - RSVP button should be nearly full-width
   - No horizontal scrollbar
   - Auth modal should fit within viewport with padding
4. Switch to iPad (768x1024):
   - Content centered with max-width constraint
5. Switch to desktop (1280x720):
   - Content centered with whitespace on sides

---

## Test 15: Not Found / Tombstone

1. Visit `/e/does-not-exist`
2. Verify 404 page with "Event not found" message
3. Verify warm dark styling (not browser default error page)

---

## Test 16: Calendar Export

1. On any event page, click "Add to Calendar"
2. Verify the `.ics` file downloads
3. Open it -- should contain correct event title, date, venue

---

## Test 17: Co-host Flow

1. As host, the co-host invite section should be available
2. Generate an invite link
3. Open the invite link in a different browser/incognito
4. Authenticate with a third phone number
5. See the "Co-host Invite" page
6. Accept the invite
7. Verify redirect to the event page
8. Verify the co-host sees host-level features (edit, text blast)

---

## Quick Smoke Test Checklist

If you're short on time, just run through these:

- [ ] Landing page loads at `/`
- [ ] Create event at `/create` (requires auth)
- [ ] Event page renders at `/e/{slug}`
- [ ] RSVP flow works (auth + going)
- [ ] Privacy dashboard always visible
- [ ] Comments work for RSVP'd users
- [ ] Share link copies correctly
- [ ] My Events dashboard at `/my-events`
- [ ] Mobile layout looks good
- [ ] 404 page for bad slugs

---

## Troubleshooting

**"Unable to send verification code"**
- The backend needs valid Twilio credentials. Check that `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_VERIFY_SID` are set as secrets on the backend worker.

**Page loads but API calls fail**
- Check DevTools Network tab for 500 errors
- The `BACKEND_URL` env var must be set on the Pages project
- Verify the backend is deployed: `curl https://ephemeral-api.ephemeralsocial.workers.dev/v1/events/public`

**Blank page or SSR error**
- Check the Cloudflare Pages deployment logs in the dashboard
- Run `CF_PAGES=1 pnpm build` locally to test the build

**Session/cookie issues**
- Cookies are HttpOnly and server-side only
- Clear cookies and retry if session gets stale
- Check that the Pages domain matches cookie domain expectations
