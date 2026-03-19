import { describe, it, expect } from 'vitest';
import {
	isTombstone,
	isTicketedEvent,
	formatPrice,
	getSpotsRemaining,
	getCoverImageUrl,
	getShareUrl
} from '$lib/utils/event-helpers';
import type { EventPageData } from '$lib/utils/event-helpers';
import { createMockEvent, createMockEventData, createMockTombstone } from '../helpers';

describe('isTombstone', () => {
	it('returns true for tombstone data', () => {
		const tombstone = createMockTombstone();
		expect(isTombstone(tombstone)).toBe(true);
	});

	it('returns false for normal PublicEventData', () => {
		const eventData = createMockEventData();
		expect(isTombstone(eventData)).toBe(false);
	});

	it('returns false when deleted is false', () => {
		const data = { deleted: false, title: 'x', deleted_at: 'x' } as unknown as EventPageData;
		expect(isTombstone(data)).toBe(false);
	});
});

describe('isTicketedEvent', () => {
	it('returns true when web_event_type is ticketed and price > 0', () => {
		const event = createMockEvent({ web_event_type: 'ticketed', ticket_price_cents: 1000 });
		expect(isTicketedEvent(event)).toBe(true);
	});

	it('returns false when web_event_type is not ticketed', () => {
		const event = createMockEvent({ web_event_type: 'free', ticket_price_cents: 1000 });
		expect(isTicketedEvent(event)).toBe(false);
	});

	it('returns false when ticket_price_cents is 0', () => {
		const event = createMockEvent({ web_event_type: 'ticketed', ticket_price_cents: 0 });
		expect(isTicketedEvent(event)).toBe(false);
	});

	it('returns false when ticket_price_cents is undefined', () => {
		const event = createMockEvent({ web_event_type: 'ticketed' });
		expect(isTicketedEvent(event)).toBe(false);
	});
});

describe('formatPrice', () => {
	it('formats 1000 cents as $10.00', () => {
		expect(formatPrice(1000)).toBe('$10.00');
	});

	it('formats 50 cents as $0.50', () => {
		expect(formatPrice(50)).toBe('$0.50');
	});

	it('formats 0 cents as $0.00', () => {
		expect(formatPrice(0)).toBe('$0.00');
	});

	it('formats 1999 cents as $19.99', () => {
		expect(formatPrice(1999)).toBe('$19.99');
	});

	it('formats 1 cent as $0.01', () => {
		expect(formatPrice(1)).toBe('$0.01');
	});

	it('handles negative values gracefully', () => {
		expect(formatPrice(-500)).toBe('$-5.00');
	});
});

describe('getSpotsRemaining', () => {
	it('returns max_attendees - going when max is set', () => {
		const event = createMockEvent({ max_attendees: 50 });
		expect(getSpotsRemaining(event, { going: 10, maybe: 3 })).toBe(40);
	});

	it('returns null when no max_attendees', () => {
		const event = createMockEvent();
		expect(getSpotsRemaining(event, { going: 10, maybe: 3 })).toBeNull();
	});

	it('returns 0 when going exceeds max (not negative)', () => {
		const event = createMockEvent({ max_attendees: 10 });
		expect(getSpotsRemaining(event, { going: 15, maybe: 0 })).toBe(0);
	});

	it('returns null when max_attendees is 0 (falsy)', () => {
		const event = createMockEvent({ max_attendees: 0 });
		expect(getSpotsRemaining(event, { going: 5, maybe: 0 })).toBeNull();
	});
});

describe('getCoverImageUrl', () => {
	it('returns URL for a valid cover key', () => {
		expect(getCoverImageUrl('events/cover-123.jpg')).toBe(
			'/api/media/events/cover-123.jpg'
		);
	});

	it('returns null for undefined', () => {
		expect(getCoverImageUrl(undefined)).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(getCoverImageUrl('')).toBeNull();
	});
});

describe('getShareUrl', () => {
	it('returns ephmr.al URL when shortCode is present', () => {
		expect(getShareUrl('my-event', 'abc123')).toBe('https://ephmr.al/e/abc123');
	});

	it('returns ephemeralsocial.com URL when no shortCode', () => {
		expect(getShareUrl('my-event')).toBe('https://ephemeralsocial.com/e/my-event');
	});
});
