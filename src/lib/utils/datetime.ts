/**
 * Convert a UTC ISO string to a `datetime-local` input value in the browser's local timezone.
 * Uses local getters (getFullYear, getMonth, etc.) instead of toISOString() which returns UTC.
 */
export function toLocalDatetime(iso: string | null | undefined): string {
	if (!iso) return '';
	try {
		const d = new Date(iso);
		if (isNaN(d.getTime())) return '';
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const hours = String(d.getHours()).padStart(2, '0');
		const minutes = String(d.getMinutes()).padStart(2, '0');
		return `${year}-${month}-${day}T${hours}:${minutes}`;
	} catch {
		return '';
	}
}

/**
 * Convert a `datetime-local` input value to a UTC ISO string for storage.
 * The browser parses datetime-local values as local time, so `new Date(value).toISOString()`
 * correctly converts to UTC.
 */
export function localDatetimeToIso(value: string): string | null {
	if (!value) return null;
	try {
		const d = new Date(value);
		if (isNaN(d.getTime())) return null;
		return d.toISOString();
	} catch {
		return null;
	}
}
