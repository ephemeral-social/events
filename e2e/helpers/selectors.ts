/**
 * Centralized selectors verified against actual component source code.
 * See plan Phase 2d for source file references.
 */
export const SEL = {
	// AuthModal
	AUTH_DIALOG: '[role="dialog"][aria-label="Sign in"]',
	PHONE_INPUT: '#phone',
	PHONE_SUBMIT: 'button:has-text("Send verification code")',
	CODE_INPUT: '#code',
	CODE_SUBMIT: 'button:has-text("Verify")',
	CODE_BACK: 'button:has-text("Use a different number")',

	// RsvpForm
	RSVP_GOING: 'button[aria-pressed]:has-text("Going")',
	RSVP_GOING_SELECTED: 'button[aria-pressed="true"]:has-text("Going")',
	RSVP_MAYBE: 'button[aria-pressed]:has-text("Maybe")',
	RSVP_MAYBE_SELECTED: 'button[aria-pressed="true"]:has-text("Maybe")',
	RSVP_DECLINED: "button[aria-pressed]:has-text(\"Can't make it\")",
	RSVP_DECLINED_SELECTED: "button[aria-pressed=\"true\"]:has-text(\"Can't make it\")",
	RSVP_NAME: '#rsvp-name',
	RSVP_SUBMIT_GOING: "button:has-text(\"I'm Going\")",
	RSVP_SUBMIT_MAYBE: 'button:has-text("Maybe")',
	RSVP_SUBMIT_DECLINED: "button:has-text(\"Can't Make It\")",
	PLUS_ONES_DEC: 'button[aria-label="Decrease plus ones"]',
	PLUS_ONES_INC: 'button[aria-label="Increase plus ones"]',

	// RsvpStatus
	RSVP_CHANGE: 'button:has-text("Change")',

	// CtaButton
	CTA_RSVP: 'button:has-text("RSVP")',
	CTA_TICKETS: 'button:has-text("Get Tickets")',
	CTA_FULL: 'button:has-text("Event is full")',

	// EventForm (create)
	CREATE_TITLE: '#event-title',
	CREATE_START_DATE: '#start-date',
	CREATE_START_TIME: '#start-time',
	CREATE_END_DATE: '#end-date',
	CREATE_END_TIME: '#end-time',
	CREATE_VENUE: '#venue-name',
	CREATE_ADDRESS: '#venue-address',
	CREATE_DESCRIPTION: '#event-description',
	CREATE_CAPACITY: '#max-attendees',
	CREATE_TYPE_FREE: 'button[aria-pressed]:has-text("Free")',
	CREATE_TYPE_TICKETED: 'button[aria-pressed]:has-text("Ticketed")',
	CREATE_PRICE: '#ticket-price',
	CREATE_SUBMIT: 'button:has-text("Create Event")',

	// Edit form
	EDIT_TITLE: '#edit-title',
	EDIT_DESCRIPTION: '#edit-description',
	EDIT_VENUE: '#edit-venue',
	EDIT_ADDRESS: '#edit-address',
	EDIT_SUBMIT: 'button:has-text("Save Changes")',

	// Co-host
	COHOST_ACCEPT: 'button:has-text("Accept Invite")',
	COHOST_SUCCESS: "h1:has-text(\"You're a co-host!\")",
	COHOST_ERROR: 'h1:has-text("Unable to accept")',

	// MyEvents
	MY_EVENTS_HOSTING: 'button:has-text("Hosting")',
	MY_EVENTS_ATTENDING: 'button:has-text("Attending")',
	MY_EVENTS_CREATE: 'a:has-text("Create")',

	// TicketPurchase
	TICKET_QTY_DEC: 'button[aria-label="Decrease quantity"]',
	TICKET_QTY_INC: 'button[aria-label="Increase quantity"]',

	// PhotoGrid
	PHOTO_UPLOAD_LABEL: 'label[aria-label="Upload photo"]',
	PHOTO_FILE_INPUT: 'input[type="file"][accept*="image"]',

	// SharePanel
	SHARE_COPY: 'button[aria-label="Copy event link"]',
	SHARE_CALENDAR: 'a:has-text("Add to Calendar")',

	// TextBlastForm
	TEXT_BLAST_MESSAGE: '#text-blast-message',
	TEXT_BLAST_SEND: 'button:has-text("Send Text Blast")',

	// CheckIn
	CHECKIN_MANUAL: '#manual-ticket',

	// Stripe onboarding
	STRIPE_ONBOARDING_LOADING: 'text=Setting up payments',
	STRIPE_ONBOARDING_ERROR: 'text=Failed to',
	STRIPE_ONBOARDING_INCOMPLETE: "text=Payment setup isn't complete",
	STRIPE_ONBOARDING_RETRY: 'button:has-text("Continue setup")',

	// Navigation
	BACK_ARROW: 'a[aria-label="Back"]'
} as const;
