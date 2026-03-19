import type { EventAesthetic } from '$lib/themes/types';

// ── Number-to-Words ──────────────────────────────────────────────────

const ONES = [
	'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
	'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
	'Seventeen', 'Eighteen', 'Nineteen'
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/** Convert 0-99 to capitalized English words. >=100 returns the numeral string. */
export function numberToWords(n: number): string {
	if (n < 0 || n >= 100) return String(n);
	if (n < 20) return ONES[n];
	const tens = TENS[Math.floor(n / 10)];
	const ones = n % 10;
	return ones === 0 ? tens : `${tens}-${ONES[ones].toLowerCase()}`;
}

// ── Ordinal Words ────────────────────────────────────────────────────

const ORDINAL_SPECIAL: Record<number, string> = {
	1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth',
	6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth',
	11: 'eleventh', 12: 'twelfth', 13: 'thirteenth', 14: 'fourteenth',
	15: 'fifteenth', 16: 'sixteenth', 17: 'seventeenth', 18: 'eighteenth',
	19: 'nineteenth', 20: 'twentieth', 30: 'thirtieth'
};

/** Convert 1-31 to lowercase ordinal word: 1→"first", 21→"twenty-first" */
export function ordinalWord(n: number): string {
	if (ORDINAL_SPECIAL[n]) return ORDINAL_SPECIAL[n];
	// Compound: 21→"twenty-first", 22→"twenty-second", etc.
	const tens = Math.floor(n / 10) * 10;
	const ones = n % 10;
	const tensWord = TENS[Math.floor(n / 10)].toLowerCase();
	const onesOrdinal = ORDINAL_SPECIAL[ones] ?? `${ONES[ones].toLowerCase()}th`;
	return `${tensWord}-${onesOrdinal}`;
}

/** Suffix ordinal: 1→"1st", 7→"7th", 21→"21st" */
function ordinalSuffix(n: number): string {
	const mod10 = n % 10;
	const mod100 = n % 100;
	if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
	if (mod10 === 1) return `${n}st`;
	if (mod10 === 2) return `${n}nd`;
	if (mod10 === 3) return `${n}rd`;
	return `${n}th`;
}

// ── Time of Day ──────────────────────────────────────────────────────

function timeOfDay(hour: number): string {
	if (hour >= 6 && hour < 12) return 'morning';
	if (hour >= 12 && hour < 17) return 'afternoon';
	return 'evening';
}

// ── Day/Month Names ──────────────────────────────────────────────────

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── formatDate ───────────────────────────────────────────────────────

export function formatDate(date: Date, aesthetic: EventAesthetic): string {
	const day = date.getDay();
	const month = date.getMonth();
	const dayOfMonth = date.getDate();

	switch (aesthetic) {
		case 'simple':
			// "Sat, Mar 7"
			return `${DAYS_SHORT[day]}, ${MONTHS_SHORT[month]} ${dayOfMonth}`;

		case 'fun':
			// "Sunday, March 15"
			return `${DAYS_FULL[day]}, ${MONTHS_FULL[month]} ${dayOfMonth}`;

		case 'warm':
			// "Saturday, March 7th"
			return `${DAYS_FULL[day]}, ${MONTHS_FULL[month]} ${ordinalSuffix(dayOfMonth)}`;

		case 'elegant':
			// "Saturday, the seventh of March"
			return `${DAYS_FULL[day]}, the ${ordinalWord(dayOfMonth)} of ${MONTHS_FULL[month]}`;
	}
}

// ── formatTime ───────────────────────────────────────────────────────

function format12h(date: Date): string {
	let hours = date.getHours();
	const minutes = date.getMinutes();
	const ampm = hours >= 12 ? 'PM' : 'AM';
	hours = hours % 12 || 12;
	const mins = minutes.toString().padStart(2, '0');
	return `${hours}:${mins} ${ampm}`;
}

export function formatTime(date: Date, aesthetic: EventAesthetic): string {
	const hours = date.getHours();
	const minutes = date.getMinutes();

	switch (aesthetic) {
		case 'simple':
		case 'fun':
			return format12h(date);

		case 'warm': {
			// "7:00 in the evening"
			const hours12 = hours % 12 || 12;
			const mins = minutes.toString().padStart(2, '0');
			return `${hours12}:${mins} in the ${timeOfDay(hours)}`;
		}

		case 'elegant': {
			// Special cases: :00, :15, :30, :45
			const hours12 = hours % 12 || 12;
			const nextHour = (hours12 % 12) + 1;
			const tod = timeOfDay(hours);

			if (minutes === 0) {
				return `${numberToWords(hours12)} o'clock in the ${tod}`;
			}
			if (minutes === 30) {
				return `Half past ${numberToWords(hours12).toLowerCase()} in the ${tod}`;
			}
			if (minutes === 15) {
				return `Quarter past ${numberToWords(hours12).toLowerCase()} in the ${tod}`;
			}
			if (minutes === 45) {
				return `Quarter to ${numberToWords(nextHour).toLowerCase()} in the ${tod}`;
			}
			// Non-special minutes: fall back to standard
			return format12h(date);
		}
	}
}

// ── formatGuestCount ─────────────────────────────────────────────────

export function formatGuestCount(
	going: number,
	maybe: number,
	aesthetic: EventAesthetic
): string {
	switch (aesthetic) {
		case 'simple':
			return maybe > 0 ? `${going} going, ${maybe} maybe` : `${going} going`;

		case 'fun':
			return maybe > 0 ? `${going} going \u00b7 ${maybe} maybe` : `${going} going`;

		case 'warm': {
			const noun = going >= 8 ? 'people' : 'friends';
			return `${going} ${noun} are joining`;
		}

		case 'elegant': {
			const word = numberToWords(going);
			const label = going === 1 ? 'guest' : 'guests';
			return `${word} ${label} attending`;
		}
	}
}
