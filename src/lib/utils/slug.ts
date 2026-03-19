/** Generate a slug preview from title and date */
export function generateSlugPreview(title: string, startDate?: Date): string {
	if (!title.trim()) return '';

	// Convert to lowercase, replace spaces and special chars with hyphens
	let slug = title
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/[\s]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

	// Append month-day if date provided
	if (startDate && !isNaN(startDate.getTime())) {
		const month = String(startDate.getUTCMonth() + 1).padStart(2, '0');
		const day = String(startDate.getUTCDate()).padStart(2, '0');
		slug = `${slug}-${month}${day}`;
	}

	// Truncate to 60 chars
	return slug.slice(0, 60);
}

/** Validate a slug format */
export function isValidSlug(slug: string): boolean {
	return /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug);
}
