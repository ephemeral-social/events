export type InspoType = 'pinterest' | 'google-slides' | 'unknown';

const MAX_INSPO_URLS = 3;

/**
 * Structured Pinterest board entry stored in inspo_urls array.
 * Contains the numeric board_id (required by API), URL path, and display name.
 */
export interface PinterestBoardEntry {
	type: 'pinterest';
	board_id: string;
	url: string;
	name: string;
}

/** A single inspo item — either a plain URL string or a structured Pinterest board entry. */
export type InspoItem = string | PinterestBoardEntry;

/**
 * Type guard for structured Pinterest board entries.
 */
export function isPinterestBoardEntry(item: InspoItem): item is PinterestBoardEntry {
	return (
		typeof item === 'object' &&
		item !== null &&
		item.type === 'pinterest' &&
		typeof item.board_id === 'string'
	);
}

/**
 * Get the numeric board_id from a structured Pinterest entry.
 */
export function getPinterestBoardId(item: InspoItem): string | null {
	if (isPinterestBoardEntry(item)) return item.board_id;
	return null;
}

/**
 * Detect the type of an inspo item (Pinterest board, Google Slides, or unknown).
 * Handles both plain URL strings and structured Pinterest board entries.
 */
export function getInspoType(item: InspoItem): InspoType {
	// Structured Pinterest entry
	if (isPinterestBoardEntry(item)) return 'pinterest';

	// Plain URL string
	const url = item;
	if (!url) return 'unknown';

	try {
		const parsed = new URL(url);
		const host = parsed.hostname.replace(/^www\./, '');

		if (host === 'pinterest.com' || host === 'pin.it') {
			return 'pinterest';
		}

		if (host === 'docs.google.com' && parsed.pathname.startsWith('/presentation/')) {
			return 'google-slides';
		}
	} catch {
		return 'unknown';
	}

	return 'unknown';
}

/**
 * Convert a Google Slides URL to its embed form.
 * /d/{ID}/edit or /d/{ID}/pub → /d/{ID}/embed?start=false&loop=false&delayms=3000
 */
export function getGoogleSlidesEmbedUrl(url: string): string {
	try {
		const parsed = new URL(url);
		// Match /presentation/d/{ID}/{suffix}
		const match = parsed.pathname.match(/^\/presentation\/d\/([^/]+)\/(.*)/);
		if (match) {
			const id = match[1];
			const suffix = match[2];
			if (suffix === 'embed') return url;
			parsed.pathname = `/presentation/d/${id}/embed`;
			parsed.search = 'start=false&loop=false&delayms=3000';
			return parsed.toString();
		}
	} catch {
		// fall through
	}
	return url;
}

/**
 * Normalize a Pinterest board URL to end with /.
 */
export function getPinterestBoardUrl(url: string): string {
	if (!url.endsWith('/')) return url + '/';
	return url;
}

/**
 * Extract "username/board-name" from a Pinterest board URL.
 * Returns null if the URL doesn't contain a valid board path.
 */
export function getPinterestBoardPath(url: string): string | null {
	try {
		const parsed = new URL(url);
		const host = parsed.hostname.replace(/^www\./, '');
		if (host !== 'pinterest.com') return null;
		const parts = parsed.pathname.split('/').filter(Boolean);
		if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
		return null;
	} catch {
		return null;
	}
}

/**
 * Parse a JSON string or array of inspo items into an InspoItem array.
 * Handles mixed arrays of strings and structured objects.
 * Returns empty array for null/undefined/invalid. Caps at MAX_INSPO_URLS.
 */
export function parseInspoUrls(json: string | null | undefined | InspoItem[]): InspoItem[] {
	if (!json) return [];
	if (Array.isArray(json)) return json.slice(0, MAX_INSPO_URLS);
	try {
		const parsed = JSON.parse(json);
		if (!Array.isArray(parsed)) return [];
		return parsed.slice(0, MAX_INSPO_URLS);
	} catch {
		return [];
	}
}

/**
 * Serialize an InspoItem array to JSON for storage.
 * Returns null if the array is empty (after filtering blank strings).
 */
export function serializeInspoUrls(items: InspoItem[]): string | null {
	const filtered = items.filter((item) => {
		if (typeof item === 'string') return item.trim().length > 0;
		return isPinterestBoardEntry(item);
	});
	if (filtered.length === 0) return null;
	return JSON.stringify(filtered);
}

/**
 * Get display label for an inspo item (for tabs).
 */
export function getInspoLabel(item: InspoItem): string {
	if (isPinterestBoardEntry(item)) return item.name;
	const type = getInspoType(item);
	if (type === 'pinterest') return 'Pinterest';
	if (type === 'google-slides') return 'Slides';
	return 'Link';
}

/**
 * Get the URL string from an inspo item (for linking out).
 */
export function getInspoUrl(item: InspoItem): string {
	if (isPinterestBoardEntry(item)) {
		return `https://www.pinterest.com${item.url}`;
	}
	return item;
}

/**
 * Count non-Pinterest-board items for calculating remaining capacity.
 */
export function countNonPinterestItems(items: InspoItem[]): number {
	return items.filter((item) => !isPinterestBoardEntry(item)).length;
}
