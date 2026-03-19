import { describe, it, expect } from 'vitest';
import {
	getInspoType,
	getGoogleSlidesEmbedUrl,
	getPinterestBoardUrl,
	getPinterestBoardPath,
	parseInspoUrls,
	serializeInspoUrls,
	isPinterestBoardEntry,
	getPinterestBoardId,
	getInspoLabel,
	getInspoUrl,
	countNonPinterestItems,
	type PinterestBoardEntry,
	type InspoItem
} from '$lib/utils/inspo';

const sampleBoard: PinterestBoardEntry = {
	type: 'pinterest',
	board_id: '483292672452275421',
	url: '/testuser/patrick/',
	name: 'Patrick'
};

describe('getInspoType', () => {
	it('returns "pinterest" for pinterest.com board URL', () => {
		expect(getInspoType('https://pinterest.com/user/my-board')).toBe('pinterest');
	});

	it('returns "pinterest" for www.pinterest.com board URL', () => {
		expect(getInspoType('https://www.pinterest.com/user/board-name')).toBe('pinterest');
	});

	it('returns "pinterest" for pin.it short URL', () => {
		expect(getInspoType('https://pin.it/abc123')).toBe('pinterest');
	});

	it('returns "pinterest" for structured PinterestBoardEntry', () => {
		expect(getInspoType(sampleBoard)).toBe('pinterest');
	});

	it('returns "google-slides" for docs.google.com/presentation URL', () => {
		expect(
			getInspoType('https://docs.google.com/presentation/d/1ABC123/edit')
		).toBe('google-slides');
	});

	it('returns "unknown" for random URL', () => {
		expect(getInspoType('https://example.com/some-page')).toBe('unknown');
	});

	it('returns "unknown" for empty string', () => {
		expect(getInspoType('')).toBe('unknown');
	});
});

describe('isPinterestBoardEntry', () => {
	it('returns true for valid PinterestBoardEntry', () => {
		expect(isPinterestBoardEntry(sampleBoard)).toBe(true);
	});

	it('returns false for plain URL string', () => {
		expect(isPinterestBoardEntry('https://pinterest.com/user/board')).toBe(false);
	});

	it('returns false for object without type field', () => {
		expect(isPinterestBoardEntry({ board_id: '123', url: '/a/', name: 'A' } as any)).toBe(false);
	});

	it('returns false for object without board_id', () => {
		expect(isPinterestBoardEntry({ type: 'pinterest', url: '/a/', name: 'A' } as any)).toBe(false);
	});
});

describe('getPinterestBoardId', () => {
	it('returns board_id from structured entry', () => {
		expect(getPinterestBoardId(sampleBoard)).toBe('483292672452275421');
	});

	it('returns null for plain URL string', () => {
		expect(getPinterestBoardId('https://pinterest.com/user/board')).toBeNull();
	});
});

describe('getGoogleSlidesEmbedUrl', () => {
	it('converts /d/{ID}/edit URL to /d/{ID}/embed', () => {
		const result = getGoogleSlidesEmbedUrl('https://docs.google.com/presentation/d/1ABC123/edit');
		expect(result).toContain('/presentation/d/1ABC123/embed');
	});

	it('converts /d/{ID}/pub URL to /d/{ID}/embed', () => {
		const result = getGoogleSlidesEmbedUrl('https://docs.google.com/presentation/d/1ABC123/pub');
		expect(result).toContain('/presentation/d/1ABC123/embed');
	});

	it('handles URL already containing /embed (returns as-is)', () => {
		const url = 'https://docs.google.com/presentation/d/1ABC123/embed';
		expect(getGoogleSlidesEmbedUrl(url)).toBe(url);
	});

	it('preserves presentation ID correctly', () => {
		const id = '1BxTnXFn_abc-XYZ_123';
		const url = `https://docs.google.com/presentation/d/${id}/edit?usp=sharing`;
		expect(getGoogleSlidesEmbedUrl(url)).toContain(`/presentation/d/${id}/embed`);
	});
});

describe('getPinterestBoardUrl', () => {
	it('normalizes URL to end with /', () => {
		expect(getPinterestBoardUrl('https://pinterest.com/user/board')).toBe(
			'https://pinterest.com/user/board/'
		);
	});

	it('returns URL unchanged if already ends with /', () => {
		const url = 'https://pinterest.com/user/board/';
		expect(getPinterestBoardUrl(url)).toBe(url);
	});
});

describe('getPinterestBoardPath', () => {
	it('extracts "username/board-name" from https://www.pinterest.com/username/board-name/', () => {
		expect(getPinterestBoardPath('https://www.pinterest.com/username/board-name/')).toBe(
			'username/board-name'
		);
	});

	it('extracts "username/board-name" from https://pinterest.com/username/board-name', () => {
		expect(getPinterestBoardPath('https://pinterest.com/username/board-name')).toBe(
			'username/board-name'
		);
	});

	it('handles URL with trailing slash', () => {
		expect(getPinterestBoardPath('https://www.pinterest.com/janedoe/mood-board/')).toBe(
			'janedoe/mood-board'
		);
	});

	it('handles URL without trailing slash', () => {
		expect(getPinterestBoardPath('https://www.pinterest.com/janedoe/mood-board')).toBe(
			'janedoe/mood-board'
		);
	});

	it('returns null for pin.it short URLs (cannot extract board path)', () => {
		expect(getPinterestBoardPath('https://pin.it/abc123')).toBeNull();
	});

	it('returns null for invalid Pinterest URLs (e.g. just pinterest.com)', () => {
		expect(getPinterestBoardPath('https://pinterest.com/')).toBeNull();
	});

	it('returns null for Pinterest URLs with only username (no board)', () => {
		expect(getPinterestBoardPath('https://pinterest.com/username')).toBeNull();
	});

	it('returns null for non-Pinterest URLs', () => {
		expect(getPinterestBoardPath('https://example.com/user/board')).toBeNull();
	});

	it('returns null for invalid URLs', () => {
		expect(getPinterestBoardPath('not-a-url')).toBeNull();
	});
});

describe('parseInspoUrls', () => {
	it('parses valid JSON array string to InspoItem[]', () => {
		const json = '["https://pinterest.com/user/board","https://docs.google.com/presentation/d/1/edit"]';
		expect(parseInspoUrls(json)).toEqual([
			'https://pinterest.com/user/board',
			'https://docs.google.com/presentation/d/1/edit'
		]);
	});

	it('parses mixed array with structured Pinterest entries', () => {
		const json = JSON.stringify([sampleBoard, 'https://docs.google.com/presentation/d/1/edit']);
		const result = parseInspoUrls(json);
		expect(result).toHaveLength(2);
		expect(isPinterestBoardEntry(result[0])).toBe(true);
		expect(result[1]).toBe('https://docs.google.com/presentation/d/1/edit');
	});

	it('accepts already-parsed array directly', () => {
		const items: InspoItem[] = [sampleBoard, 'https://docs.google.com/presentation/d/1/edit'];
		expect(parseInspoUrls(items)).toEqual(items);
	});

	it('returns empty array for null', () => {
		expect(parseInspoUrls(null)).toEqual([]);
	});

	it('returns empty array for undefined', () => {
		expect(parseInspoUrls(undefined)).toEqual([]);
	});

	it('returns empty array for invalid JSON', () => {
		expect(parseInspoUrls('not-json')).toEqual([]);
	});

	it('caps at 3 items (drops extras)', () => {
		const json = '["a","b","c","d","e"]';
		expect(parseInspoUrls(json)).toEqual(['a', 'b', 'c']);
	});
});

describe('serializeInspoUrls', () => {
	it('converts string[] to JSON string', () => {
		const urls = ['https://pinterest.com/user/board', 'https://docs.google.com/presentation/d/1/edit'];
		expect(serializeInspoUrls(urls)).toBe(JSON.stringify(urls));
	});

	it('serializes mixed InspoItem[] to JSON string', () => {
		const items: InspoItem[] = [sampleBoard, 'https://docs.google.com/presentation/d/1/edit'];
		const result = serializeInspoUrls(items);
		expect(result).toBeTruthy();
		const parsed = JSON.parse(result!);
		expect(parsed).toHaveLength(2);
		expect(parsed[0].type).toBe('pinterest');
		expect(parsed[0].board_id).toBe('483292672452275421');
	});

	it('returns null for empty array', () => {
		expect(serializeInspoUrls([])).toBeNull();
	});

	it('filters out empty strings but keeps structured entries', () => {
		const items: InspoItem[] = ['', sampleBoard, ''];
		const result = serializeInspoUrls(items);
		expect(result).toBeTruthy();
		const parsed = JSON.parse(result!);
		expect(parsed).toHaveLength(1);
		expect(parsed[0].type).toBe('pinterest');
	});
});

describe('getInspoLabel', () => {
	it('returns board name for structured Pinterest entry', () => {
		expect(getInspoLabel(sampleBoard)).toBe('Patrick');
	});

	it('returns "Pinterest" for plain Pinterest URL', () => {
		expect(getInspoLabel('https://pinterest.com/user/board')).toBe('Pinterest');
	});

	it('returns "Slides" for Google Slides URL', () => {
		expect(getInspoLabel('https://docs.google.com/presentation/d/1/edit')).toBe('Slides');
	});

	it('returns "Link" for unknown URL', () => {
		expect(getInspoLabel('https://example.com')).toBe('Link');
	});
});

describe('getInspoUrl', () => {
	it('returns full Pinterest URL for structured entry', () => {
		expect(getInspoUrl(sampleBoard)).toBe('https://www.pinterest.com/testuser/patrick/');
	});

	it('returns URL as-is for plain string', () => {
		const url = 'https://docs.google.com/presentation/d/1/edit';
		expect(getInspoUrl(url)).toBe(url);
	});
});

describe('countNonPinterestItems', () => {
	it('counts only non-Pinterest-board items', () => {
		const items: InspoItem[] = [
			sampleBoard,
			'https://docs.google.com/presentation/d/1/edit',
			'https://example.com'
		];
		expect(countNonPinterestItems(items)).toBe(2);
	});

	it('returns 0 for all Pinterest boards', () => {
		expect(countNonPinterestItems([sampleBoard])).toBe(0);
	});
});
