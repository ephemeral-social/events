import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	formatEventDate,
	formatEventTime,
	formatTimeRange,
	formatEventDateShort,
	formatCountdown,
	hasEventStarted,
	hasEventEnded
} from '$lib/utils/date-format';

describe('formatEventDate', () => {
	it('returns "weekday, month day" format', () => {
		const result = formatEventDate('2025-03-15T19:00:00Z');
		expect(result).toContain('Saturday');
		expect(result).toContain('March');
		expect(result).toContain('15');
	});

	it('respects timezone parameter', () => {
		// Midnight UTC on March 15 is still March 14 in US Pacific
		const result = formatEventDate('2025-03-15T02:00:00Z', 'America/Los_Angeles');
		expect(result).toContain('Friday');
		expect(result).toContain('14');
	});
});

describe('formatEventTime', () => {
	it('returns time in "h:mm AM/PM" format', () => {
		const result = formatEventTime('2025-03-15T19:00:00Z', 'UTC');
		expect(result).toBe('7:00 PM');
	});

	it('respects timezone parameter', () => {
		// 19:00 UTC = 15:00 ET (EDT in March after DST)
		const result = formatEventTime('2025-03-15T19:00:00Z', 'America/New_York');
		expect(result).toBe('3:00 PM');
	});
});

describe('formatTimeRange', () => {
	it('returns "start - end" when both times provided', () => {
		const result = formatTimeRange('2025-03-15T19:00:00Z', '2025-03-15T22:00:00Z', 'UTC');
		expect(result).toContain('7:00 PM');
		expect(result).toContain('10:00 PM');
		expect(result).toContain(' - ');
	});

	it('returns just start time when end_time is null', () => {
		const result = formatTimeRange('2025-03-15T19:00:00Z', null, 'UTC');
		expect(result).toBe('7:00 PM');
	});

	it('returns just start time when end_time is undefined', () => {
		const result = formatTimeRange('2025-03-15T19:00:00Z', undefined, 'UTC');
		expect(result).toBe('7:00 PM');
	});

	it('appends timezone abbreviation when timezone provided', () => {
		const result = formatTimeRange(
			'2025-03-15T19:00:00Z',
			'2025-03-15T22:00:00Z',
			'America/New_York'
		);
		expect(result).toMatch(/EDT|EST/);
	});

	it('does not append timezone when timezone is not provided', () => {
		const result = formatTimeRange('2025-03-15T19:00:00Z', '2025-03-15T22:00:00Z');
		expect(result).not.toMatch(/EDT|EST|UTC|PST|PDT/);
	});

	it('throws on invalid timezone (formatEventTime does not catch)', () => {
		// getTimezoneAbbr has a try/catch, but formatEventTime does not —
		// the error happens in toLocaleTimeString before getTimezoneAbbr is called
		expect(() =>
			formatTimeRange('2025-03-15T19:00:00Z', '2025-03-15T22:00:00Z', 'Invalid/Timezone')
		).toThrow();
	});
});

describe('formatEventDateShort', () => {
	it('returns "Ddd, Mon DD at h:mm AM/PM" format', () => {
		const result = formatEventDateShort('2025-03-15T19:00:00Z', 'UTC');
		expect(result).toContain('Sat');
		expect(result).toContain('Mar');
		expect(result).toContain('15');
		expect(result).toContain('at');
		expect(result).toContain('7:00 PM');
	});
});

describe('formatCountdown', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-03-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns "3 days until deletion" with urgent: false for 3 days out', () => {
		const result = formatCountdown('2025-03-18T12:00:00Z');
		expect(result).toEqual({ text: '3 days until deletion', urgent: false });
	});

	it('returns "2 days until deletion" with urgent: true', () => {
		const result = formatCountdown('2025-03-17T12:00:00Z');
		expect(result).toEqual({ text: '2 days until deletion', urgent: true });
	});

	it('returns "1 day until deletion" with urgent: true', () => {
		const result = formatCountdown('2025-03-16T12:00:00Z');
		expect(result).toEqual({ text: '1 day until deletion', urgent: true });
	});

	it('returns hours until deletion with urgent: true when less than 1 day', () => {
		const result = formatCountdown('2025-03-15T17:00:00Z');
		expect(result).toEqual({ text: '5 hours until deletion', urgent: true });
	});

	it('returns "Data deleted" with urgent: false when expired', () => {
		const result = formatCountdown('2025-03-15T10:00:00Z');
		expect(result).toEqual({ text: 'Data deleted', urgent: false });
	});

	it('returns "Data deleted" when expiry is exactly now', () => {
		const result = formatCountdown('2025-03-15T12:00:00Z');
		expect(result).toEqual({ text: 'Data deleted', urgent: false });
	});

	it('returns "0 hours until deletion" when less than 1 hour remaining', () => {
		// 30 minutes from now
		const result = formatCountdown('2025-03-15T12:30:00Z');
		expect(result).toEqual({ text: '0 hours until deletion', urgent: true });
	});
});

describe('hasEventStarted', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-03-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns true for a past start time', () => {
		expect(hasEventStarted('2025-03-15T10:00:00Z')).toBe(true);
	});

	it('returns false for a future start time', () => {
		expect(hasEventStarted('2025-03-15T14:00:00Z')).toBe(false);
	});

	it('returns true when start time is exactly now', () => {
		expect(hasEventStarted('2025-03-15T12:00:00Z')).toBe(true);
	});
});

describe('hasEventEnded', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-03-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns true for a past end time', () => {
		expect(hasEventEnded('2025-03-15T10:00:00Z')).toBe(true);
	});

	it('returns false for a future end time', () => {
		expect(hasEventEnded('2025-03-15T14:00:00Z')).toBe(false);
	});

	it('returns false when end_time is null', () => {
		expect(hasEventEnded(null)).toBe(false);
	});

	it('returns false when end_time is undefined', () => {
		expect(hasEventEnded(undefined)).toBe(false);
	});

	it('returns true when end_time is exactly now (boundary)', () => {
		expect(hasEventEnded('2025-03-15T12:00:00Z')).toBe(true);
	});
});
