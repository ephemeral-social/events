/** Format: "Saturday, March 15" */
export function formatEventDate(isoString: string, timezone?: string): string {
	const date = new Date(isoString);
	if (isNaN(date.getTime())) return 'Invalid date';
	const opts: Intl.DateTimeFormatOptions = {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		timeZone: timezone || undefined
	};
	return date.toLocaleDateString('en-US', opts);
}

/** Format: "7:00 PM" */
export function formatEventTime(isoString: string, timezone?: string): string {
	const date = new Date(isoString);
	if (isNaN(date.getTime())) return 'Invalid date';
	const opts: Intl.DateTimeFormatOptions = {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true,
		timeZone: timezone || undefined
	};
	return date.toLocaleTimeString('en-US', opts);
}

/** Format: "7:00 PM - 10:00 PM" or "7:00 PM - 10:00 PM EST" */
export function formatTimeRange(
	startIso: string,
	endIso?: string | null,
	timezone?: string
): string {
	const startTime = formatEventTime(startIso, timezone);
	if (!endIso) return startTime;

	const endTime = formatEventTime(endIso, timezone);
	const tzAbbr = timezone ? getTimezoneAbbr(startIso, timezone) : '';
	return `${startTime} - ${endTime}${tzAbbr ? ` ${tzAbbr}` : ''}`;
}

/** Format: "Sat, Mar 15 at 7:00 PM" */
export function formatEventDateShort(isoString: string, timezone?: string): string {
	const date = new Date(isoString);
	if (isNaN(date.getTime())) return 'Invalid date';
	const opts: Intl.DateTimeFormatOptions = {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
		timeZone: timezone || undefined
	};
	const datePart = date.toLocaleDateString('en-US', opts);
	const timePart = formatEventTime(isoString, timezone);
	return `${datePart} at ${timePart}`;
}

function getTimezoneAbbr(isoString: string, timezone: string): string {
	try {
		const date = new Date(isoString);
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: timezone,
			timeZoneName: 'short'
		}).formatToParts(date);
		const tzPart = parts.find((p) => p.type === 'timeZoneName');
		return tzPart?.value || '';
	} catch {
		return '';
	}
}

/** "3 days left" or "Event has ended" */
export function formatCountdown(expiresAt: string): { text: string; urgent: boolean } {
	const now = Date.now();
	const expiresDate = new Date(expiresAt);
	if (isNaN(expiresDate.getTime())) return { text: 'Invalid date', urgent: false };
	const expires = expiresDate.getTime();
	const diff = expires - now;

	if (diff <= 0) return { text: 'Data deleted', urgent: false };

	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

	if (days > 1) return { text: `${days} days until deletion`, urgent: days <= 2 };
	if (days === 1) return { text: '1 day until deletion', urgent: true };
	return { text: `${hours} hours until deletion`, urgent: true };
}

/** Check if event has started */
export function hasEventStarted(startTime: string): boolean {
	const date = new Date(startTime);
	if (isNaN(date.getTime())) return false;
	return date.getTime() <= Date.now();
}

/** Check if event has ended */
export function hasEventEnded(endTime?: string | null): boolean {
	if (!endTime) return false;
	const date = new Date(endTime);
	if (isNaN(date.getTime())) return false;
	return date.getTime() <= Date.now();
}
