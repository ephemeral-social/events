import type { EventAesthetic } from '$lib/themes/types';

// ── RSVP Copy per Aesthetic ─────────────────────────────────────────

interface RsvpCopy {
	going: string;
	maybe: string;
	decline: string;
	afterGoing: string;
	hasMaybe: boolean;
	maybeIsLink: boolean;
}

// ── Auth Copy ───────────────────────────────────────────────────────

interface AuthCopy {
	heading: string;
	subheading: string;
}

// ── Host Attribution Copy ───────────────────────────────────────────

interface HostCopy {
	format: (name: string) => string;
	visible: boolean;
}

// ── Guest Label Copy ────────────────────────────────────────────────

interface GuestLabel {
	singular: string;
	plural: string;
	pluralLarge?: string;
	threshold?: number;
}

// ── Aesthetic Copy Map ──────────────────────────────────────────────

export const AESTHETIC_COPY: {
	rsvp: Record<EventAesthetic, RsvpCopy>;
	auth: Record<EventAesthetic, AuthCopy>;
	host: Record<EventAesthetic, HostCopy>;
	afterRsvpGoing: Record<EventAesthetic, string>;
	guestLabel: Record<EventAesthetic, GuestLabel>;
	venueLabel: Record<EventAesthetic, string>;
	dateLabel: Record<EventAesthetic, string>;
} = {
	rsvp: {
		simple: {
			going: 'Going',
			maybe: 'Maybe',
			decline: "Can't go",
			afterGoing: "You're going",
			hasMaybe: true,
			maybeIsLink: false
		},
		fun: {
			going: 'Going',
			maybe: 'Maybe',
			decline: "Can't Make It",
			afterGoing: "You're going!",
			hasMaybe: true,
			maybeIsLink: false
		},
		warm: {
			going: "I'll be there",
			maybe: 'Let me check',
			decline: "I can't make it",
			afterGoing: "You're going",
			hasMaybe: true,
			maybeIsLink: true
		},
		elegant: {
			going: 'Accept with Pleasure',
			maybe: '',
			decline: 'Regretfully Decline',
			afterGoing: 'Your attendance is confirmed',
			hasMaybe: false,
			maybeIsLink: false
		}
	},
	auth: {
		simple: { heading: 'Sign in', subheading: 'Verify your phone to continue' },
		fun: { heading: "Let's get you in", subheading: "Quick phone check and you're set" },
		warm: { heading: 'Welcome', subheading: "Let's get started \u2014 verify your phone" },
		elegant: {
			heading: 'Kindly Identify Yourself',
			subheading: 'Phone verification is required to proceed'
		}
	},
	host: {
		simple: {
			format: (name: string) => `Hosted by ${name}`,
			visible: false
		},
		fun: {
			format: (name: string) => `Hosted by ${name}`,
			visible: true
		},
		warm: {
			format: (name: string) => `${name} invites you to`,
			visible: true
		},
		elegant: {
			format: (name: string) => `${name} cordially invites you to`,
			visible: true
		}
	},
	afterRsvpGoing: {
		simple: "You're going",
		fun: "You're going!",
		warm: "You're going",
		elegant: 'Your attendance is confirmed'
	},
	guestLabel: {
		simple: { singular: 'guest', plural: 'guests' },
		fun: { singular: 'guest', plural: 'guests' },
		warm: { singular: 'friend', plural: 'friends', pluralLarge: 'people', threshold: 8 },
		elegant: { singular: 'guest', plural: 'guests' }
	},
	venueLabel: {
		simple: 'Location',
		fun: 'Location',
		warm: 'Location',
		elegant: 'Venue'
	},
	dateLabel: {
		simple: 'Date & Time',
		fun: 'When',
		warm: 'When',
		elegant: 'Date & Time'
	}
};

// ── Accessor Functions ──────────────────────────────────────────────

export type { RsvpCopy, AuthCopy, HostCopy, GuestLabel };

export function getRsvpCopy(aesthetic: EventAesthetic): RsvpCopy {
	return AESTHETIC_COPY.rsvp[aesthetic];
}

export function getAuthCopy(aesthetic: EventAesthetic): AuthCopy {
	return AESTHETIC_COPY.auth[aesthetic];
}

export function getHostCopy(aesthetic: EventAesthetic): HostCopy {
	return AESTHETIC_COPY.host[aesthetic];
}
