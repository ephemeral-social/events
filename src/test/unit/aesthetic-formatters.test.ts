import { describe, it, expect } from 'vitest';
import {
	formatDate,
	formatTime,
	formatGuestCount,
	numberToWords,
	ordinalWord
} from '$lib/utils/aesthetic-formatters';

describe('aesthetic-formatters', () => {
	// ── formatDate ───────────────────────────────────────────────────

	describe('formatDate', () => {
		// Saturday, March 7, 2026
		const mar7 = new Date('2026-03-07T19:00:00');
		// Sunday, March 15, 2026
		const mar15 = new Date('2026-03-15T19:00:00');

		it('Simple: abbreviated weekday + abbreviated month + day', () => {
			expect(formatDate(mar7, 'simple')).toBe('Sat, Mar 7');
		});

		it('Fun: full weekday + full month + day', () => {
			expect(formatDate(mar15, 'fun')).toBe('Sunday, March 15');
		});

		it('Warm: full weekday + full month + ordinal day', () => {
			expect(formatDate(mar7, 'warm')).toBe('Saturday, March 7th');
		});

		it('Elegant: formal ordinal — "Saturday, the seventh of March"', () => {
			expect(formatDate(mar7, 'elegant')).toBe('Saturday, the seventh of March');
		});

		it('Elegant: handles 1st correctly', () => {
			const mar1 = new Date('2026-03-01T19:00:00');
			expect(formatDate(mar1, 'elegant')).toBe('Sunday, the first of March');
		});

		it('Elegant: handles 21st correctly', () => {
			const mar21 = new Date('2026-03-21T19:00:00');
			expect(formatDate(mar21, 'elegant')).toBe('Saturday, the twenty-first of March');
		});
	});

	// ── formatTime ───────────────────────────────────────────────────

	describe('formatTime', () => {
		it('Simple: standard 12h format', () => {
			const d = new Date('2026-03-07T19:00:00');
			expect(formatTime(d, 'simple')).toBe('7:00 PM');
		});

		it('Fun: standard 12h format', () => {
			const d = new Date('2026-03-07T19:00:00');
			expect(formatTime(d, 'fun')).toBe('7:00 PM');
		});

		it('Warm: 7:00 in the evening', () => {
			const d = new Date('2026-03-07T19:00:00');
			expect(formatTime(d, 'warm')).toBe('7:00 in the evening');
		});

		it('Warm: 10:30 in the morning', () => {
			const d = new Date('2026-03-07T10:30:00');
			expect(formatTime(d, 'warm')).toBe('10:30 in the morning');
		});

		it('Warm: 2:00 in the afternoon', () => {
			const d = new Date('2026-03-07T14:00:00');
			expect(formatTime(d, 'warm')).toBe('2:00 in the afternoon');
		});

		it('Elegant: 7:00 PM → "Seven o\'clock in the evening"', () => {
			const d = new Date('2026-03-07T19:00:00');
			expect(formatTime(d, 'elegant')).toBe("Seven o'clock in the evening");
		});

		it('Elegant: 7:30 PM → "Half past seven in the evening"', () => {
			const d = new Date('2026-03-07T19:30:00');
			expect(formatTime(d, 'elegant')).toBe('Half past seven in the evening');
		});

		it('Elegant: 7:15 PM → "Quarter past seven in the evening"', () => {
			const d = new Date('2026-03-07T19:15:00');
			expect(formatTime(d, 'elegant')).toBe('Quarter past seven in the evening');
		});

		it('Elegant: 7:45 PM → "Quarter to eight in the evening"', () => {
			const d = new Date('2026-03-07T19:45:00');
			expect(formatTime(d, 'elegant')).toBe('Quarter to eight in the evening');
		});

		it('Elegant: non-special minute falls back to standard', () => {
			const d = new Date('2026-03-07T19:20:00');
			expect(formatTime(d, 'elegant')).toBe('7:20 PM');
		});
	});

	// ── formatGuestCount ─────────────────────────────────────────────

	describe('formatGuestCount', () => {
		it('Simple: "5 going, 2 maybe"', () => {
			expect(formatGuestCount(5, 2, 'simple')).toBe('5 going, 2 maybe');
		});

		it('Simple: 0 maybe omitted', () => {
			expect(formatGuestCount(5, 0, 'simple')).toBe('5 going');
		});

		it('Fun: "5 going · 2 maybe"', () => {
			expect(formatGuestCount(5, 2, 'fun')).toBe('5 going · 2 maybe');
		});

		it('Fun: 0 maybe omitted', () => {
			expect(formatGuestCount(5, 0, 'fun')).toBe('5 going');
		});

		it('Warm: small count uses "friends"', () => {
			expect(formatGuestCount(5, 0, 'warm')).toBe('5 friends are joining');
		});

		it('Warm: 8+ uses "people"', () => {
			expect(formatGuestCount(10, 0, 'warm')).toBe('10 people are joining');
		});

		it('Elegant: uses words for count', () => {
			expect(formatGuestCount(12, 0, 'elegant')).toBe('Twelve guests attending');
		});

		it('Elegant: 1 guest singular', () => {
			expect(formatGuestCount(1, 0, 'elegant')).toBe('One guest attending');
		});
	});

	// ── numberToWords ────────────────────────────────────────────────

	describe('numberToWords', () => {
		it('0 → "Zero"', () => expect(numberToWords(0)).toBe('Zero'));
		it('1 → "One"', () => expect(numberToWords(1)).toBe('One'));
		it('12 → "Twelve"', () => expect(numberToWords(12)).toBe('Twelve'));
		it('21 → "Twenty-one"', () => expect(numberToWords(21)).toBe('Twenty-one'));
		it('99 → "Ninety-nine"', () => expect(numberToWords(99)).toBe('Ninety-nine'));
		it('20 → "Twenty"', () => expect(numberToWords(20)).toBe('Twenty'));
		it('100 → "100" (fallback to numeral)', () => expect(numberToWords(100)).toBe('100'));
	});

	// ── ordinalWord ──────────────────────────────────────────────────

	describe('ordinalWord', () => {
		it('1 → "first"', () => expect(ordinalWord(1)).toBe('first'));
		it('2 → "second"', () => expect(ordinalWord(2)).toBe('second'));
		it('3 → "third"', () => expect(ordinalWord(3)).toBe('third'));
		it('7 → "seventh"', () => expect(ordinalWord(7)).toBe('seventh'));
		it('12 → "twelfth"', () => expect(ordinalWord(12)).toBe('twelfth'));
		it('21 → "twenty-first"', () => expect(ordinalWord(21)).toBe('twenty-first'));
		it('31 → "thirty-first"', () => expect(ordinalWord(31)).toBe('thirty-first'));
	});
});
