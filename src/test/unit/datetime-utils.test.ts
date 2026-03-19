import { describe, it, expect } from 'vitest';
import { toLocalDatetime, localDatetimeToIso } from '$lib/utils/datetime';

describe('toLocalDatetime', () => {
	it('returns YYYY-MM-DDThh:mm in browser-local time for a UTC ISO string', () => {
		// Use a known UTC time and check it matches the local interpretation
		const utcIso = '2026-03-15T17:30:00.000Z';
		const result = toLocalDatetime(utcIso);

		// Parse the UTC time as a local Date to get expected local values
		const d = new Date(utcIso);
		const expectedYear = d.getFullYear();
		const expectedMonth = String(d.getMonth() + 1).padStart(2, '0');
		const expectedDay = String(d.getDate()).padStart(2, '0');
		const expectedHours = String(d.getHours()).padStart(2, '0');
		const expectedMinutes = String(d.getMinutes()).padStart(2, '0');
		const expected = `${expectedYear}-${expectedMonth}-${expectedDay}T${expectedHours}:${expectedMinutes}`;

		expect(result).toBe(expected);
		// The result should be a valid datetime-local format
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
	});

	it('returns empty string for null', () => {
		expect(toLocalDatetime(null)).toBe('');
	});

	it('returns empty string for undefined', () => {
		expect(toLocalDatetime(undefined)).toBe('');
	});

	it('returns empty string for empty string', () => {
		expect(toLocalDatetime('')).toBe('');
	});

	it('handles invalid ISO string gracefully', () => {
		expect(toLocalDatetime('not-a-date')).toBe('');
	});

	it('does NOT return UTC time (the bug we are fixing)', () => {
		// This test verifies the fix: toLocalDatetime should NOT use .toISOString().slice()
		// which would return UTC. Instead it should use local getters.
		const utcIso = '2026-07-15T22:00:00.000Z'; // 10 PM UTC
		const result = toLocalDatetime(utcIso);

		// The old broken implementation would return '2026-07-15T22:00' regardless of timezone
		// The new correct implementation returns the local time
		const d = new Date(utcIso);
		const localHours = String(d.getHours()).padStart(2, '0');
		const localMinutes = String(d.getMinutes()).padStart(2, '0');

		// Extract hours:minutes from result
		const resultTime = result.split('T')[1];
		expect(resultTime).toBe(`${localHours}:${localMinutes}`);
	});
});

describe('localDatetimeToIso', () => {
	it('converts datetime-local string to UTC ISO string', () => {
		const result = localDatetimeToIso('2026-03-15T13:00');
		expect(result).toBeTruthy();
		// Should be a valid ISO string
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
		// Parse back and verify
		const d = new Date(result!);
		expect(d.getHours()).toBe(13);
		expect(d.getMinutes()).toBe(0);
	});

	it('returns null for empty string', () => {
		expect(localDatetimeToIso('')).toBeNull();
	});

	it('returns null for invalid string', () => {
		expect(localDatetimeToIso('not-a-date')).toBeNull();
	});
});
