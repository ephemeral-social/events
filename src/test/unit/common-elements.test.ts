import { describe, it, expect } from 'vitest';
import { AESTHETIC_COPY, getRsvpCopy, getAuthCopy, getHostCopy } from '$lib/utils/aesthetic-copy';

describe('aesthetic-copy', () => {
	// ── RSVP Copy ───────────────────────────────────────────────────

	it('AESTHETIC_COPY.rsvp.elegant.hasMaybe is false', () => {
		expect(AESTHETIC_COPY.rsvp.elegant.hasMaybe).toBe(false);
	});

	it('AESTHETIC_COPY.rsvp.warm.maybeIsLink is true', () => {
		expect(AESTHETIC_COPY.rsvp.warm.maybeIsLink).toBe(true);
	});

	it('AESTHETIC_COPY.rsvp.fun.going is "Going"', () => {
		expect(AESTHETIC_COPY.rsvp.fun.going).toBe('Going');
	});

	it('AESTHETIC_COPY.rsvp.elegant.going is "Accept with Pleasure"', () => {
		expect(AESTHETIC_COPY.rsvp.elegant.going).toBe('Accept with Pleasure');
	});

	it('AESTHETIC_COPY.rsvp.simple.hasMaybe is true', () => {
		expect(AESTHETIC_COPY.rsvp.simple.hasMaybe).toBe(true);
	});

	it('AESTHETIC_COPY.rsvp.simple.maybeIsLink is false', () => {
		expect(AESTHETIC_COPY.rsvp.simple.maybeIsLink).toBe(false);
	});

	it('AESTHETIC_COPY.rsvp.elegant.afterGoing is "Your attendance is confirmed"', () => {
		expect(AESTHETIC_COPY.rsvp.elegant.afterGoing).toBe('Your attendance is confirmed');
	});

	// ── Host Copy ───────────────────────────────────────────────────

	it('AESTHETIC_COPY.host.warm.format("Sarah") returns "Sarah invites you to"', () => {
		expect(AESTHETIC_COPY.host.warm.format('Sarah')).toBe('Sarah invites you to');
	});

	it('AESTHETIC_COPY.host.elegant.format("Sarah") returns formal invitation', () => {
		expect(AESTHETIC_COPY.host.elegant.format('Sarah')).toBe(
			'Sarah cordially invites you to'
		);
	});

	it('AESTHETIC_COPY.host.simple.format("Alex") returns "Hosted by Alex"', () => {
		expect(AESTHETIC_COPY.host.simple.format('Alex')).toBe('Hosted by Alex');
	});

	it('AESTHETIC_COPY.host.simple.visible is false', () => {
		expect(AESTHETIC_COPY.host.simple.visible).toBe(false);
	});

	it('AESTHETIC_COPY.host.elegant.visible is true', () => {
		expect(AESTHETIC_COPY.host.elegant.visible).toBe(true);
	});

	// ── Auth Copy ───────────────────────────────────────────────────

	it('AESTHETIC_COPY.auth.fun.heading is "Let\'s get you in"', () => {
		expect(AESTHETIC_COPY.auth.fun.heading).toBe("Let's get you in");
	});

	it('AESTHETIC_COPY.auth.elegant.heading is "Kindly Identify Yourself"', () => {
		expect(AESTHETIC_COPY.auth.elegant.heading).toBe('Kindly Identify Yourself');
	});

	// ── afterRsvpGoing ──────────────────────────────────────────────

	it('AESTHETIC_COPY.afterRsvpGoing matches rsvp.afterGoing for all aesthetics', () => {
		expect(AESTHETIC_COPY.afterRsvpGoing.simple).toBe("You're going");
		expect(AESTHETIC_COPY.afterRsvpGoing.fun).toBe("You're going!");
		expect(AESTHETIC_COPY.afterRsvpGoing.elegant).toBe('Your attendance is confirmed');
	});

	// ── Labels ──────────────────────────────────────────────────────

	it('venueLabel varies by aesthetic', () => {
		expect(AESTHETIC_COPY.venueLabel.simple).toBe('Location');
		expect(AESTHETIC_COPY.venueLabel.elegant).toBe('Venue');
	});

	it('dateLabel varies by aesthetic', () => {
		expect(AESTHETIC_COPY.dateLabel.fun).toBe('When');
		expect(AESTHETIC_COPY.dateLabel.elegant).toBe('Date & Time');
	});

	it('guestLabel warm uses threshold for pluralLarge', () => {
		expect(AESTHETIC_COPY.guestLabel.warm.singular).toBe('friend');
		expect(AESTHETIC_COPY.guestLabel.warm.plural).toBe('friends');
		expect(AESTHETIC_COPY.guestLabel.warm.pluralLarge).toBe('people');
		expect(AESTHETIC_COPY.guestLabel.warm.threshold).toBe(8);
	});

	// ── Accessor Functions ──────────────────────────────────────────

	it('getRsvpCopy returns correct copy for aesthetic', () => {
		const warmCopy = getRsvpCopy('warm');
		expect(warmCopy.going).toBe("I'll be there");
		expect(warmCopy.maybeIsLink).toBe(true);
	});

	it('getAuthCopy returns correct copy for aesthetic', () => {
		const simpleCopy = getAuthCopy('simple');
		expect(simpleCopy.heading).toBe('Sign in');
		expect(simpleCopy.subheading).toBe('Verify your phone to continue');
	});

	it('getHostCopy returns correct copy for aesthetic', () => {
		const funCopy = getHostCopy('fun');
		expect(funCopy.format('Max')).toBe('Hosted by Max');
		expect(funCopy.visible).toBe(true);
	});
});
