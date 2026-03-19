/**
 * Format first + last name into "First L." display format.
 * Used for the live preview in the auth modal.
 */
export function formatDisplayName(
	firstName: string | null | undefined,
	lastName: string | null | undefined
): string {
	const first = firstName?.trim();
	if (!first) return '';

	const tc = first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
	const last = lastName?.trim();
	if (!last) return tc;

	return `${tc} ${last.charAt(0).toUpperCase()}.`;
}
