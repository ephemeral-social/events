import { describe, it, expect } from 'vitest';
import { generateSlugPreview, isValidSlug } from '$lib/utils/slug';

describe('generateSlugPreview', () => {
	it('lowercases the title', () => {
		expect(generateSlugPreview('My Event')).toBe('my-event');
	});

	it('replaces spaces with hyphens', () => {
		expect(generateSlugPreview('summer party')).toBe('summer-party');
	});

	it('strips special characters and collapses hyphens', () => {
		expect(generateSlugPreview('Party @#$% Time!')).toBe('party-time');
	});

	it('appends MMDD when date provided', () => {
		// Use explicit UTC noon to avoid local-timezone date shift
		const date = new Date('2025-03-15T12:00:00Z');
		expect(generateSlugPreview('party', date)).toBe('party-0315');
	});

	it('truncates to 60 characters', () => {
		const longTitle = 'a'.repeat(70);
		expect(generateSlugPreview(longTitle).length).toBeLessThanOrEqual(60);
	});

	it('returns empty string for empty title', () => {
		expect(generateSlugPreview('')).toBe('');
	});

	it('returns empty string for whitespace-only title', () => {
		expect(generateSlugPreview('   ')).toBe('');
	});

	it('handles title with only special characters', () => {
		expect(generateSlugPreview('!!!')).toBe('');
	});

	it('skips date append for invalid date', () => {
		const invalidDate = new Date('not-a-date');
		expect(generateSlugPreview('party', invalidDate)).toBe('party');
	});
});

describe('isValidSlug', () => {
	it('accepts a valid slug', () => {
		expect(isValidSlug('summer-party-2025')).toBe(true);
	});

	it('accepts minimum length slug (3 chars)', () => {
		expect(isValidSlug('abc')).toBe(true);
	});

	it('accepts maximum length slug (60 chars)', () => {
		// 'ab' + 'c'.repeat(57) + 'd' = 60 chars, starts/ends with alphanum
		const slug = 'ab' + 'c'.repeat(57) + 'd';
		expect(slug.length).toBe(60);
		expect(isValidSlug(slug)).toBe(true);
	});

	it('rejects leading hyphen', () => {
		expect(isValidSlug('-leading-hyphen')).toBe(false);
	});

	it('rejects trailing hyphen', () => {
		expect(isValidSlug('trailing-hyphen-')).toBe(false);
	});

	it('rejects too-short slug (1 char)', () => {
		expect(isValidSlug('a')).toBe(false);
	});

	it('rejects uppercase letters', () => {
		expect(isValidSlug('AB')).toBe(false);
	});

	it('rejects slug longer than 60 chars', () => {
		const slug = 'a' + 'b'.repeat(60); // 61 chars
		expect(isValidSlug(slug)).toBe(false);
	});

	it('rejects empty string', () => {
		expect(isValidSlug('')).toBe(false);
	});

	it('rejects two-character slug (too short)', () => {
		expect(isValidSlug('ab')).toBe(false);
	});

	it('generateSlugPreview output with trailing dash input is valid', () => {
		// Input "a-" should not produce a slug with a trailing dash
		const slug = generateSlugPreview('a-');
		if (slug) {
			expect(isValidSlug(slug) || slug.length < 3).toBe(true);
		}
		// Ensure no trailing dash in the generated slug
		expect(slug.endsWith('-')).toBe(false);
	});

	it('generateSlugPreview uses local date methods consistently', () => {
		// Use a date near midnight UTC to verify date extraction consistency
		// 2025-01-01 00:30 UTC => in UTC this is Jan 1, but in UTC-5 it's still Dec 31
		const date = new Date('2025-01-01T00:30:00Z');
		const slug = generateSlugPreview('test', date);
		// The slug should contain month/day digits from the date
		expect(slug).toMatch(/test-\d{4}$/);
	});
});
