export interface PublicEvent {
	event_id: string;
	title: string;
	description?: string;
	start_time: string;
	end_time?: string;
	timezone?: string;
	visibility: string;
	max_attendees?: number;
	allow_plus_ones?: boolean;
	cover_r2_key?: string;
	expires_at?: string;
	created_at: string;
	slug: string;
	short_code?: string;
	location_hidden?: boolean;
	show_guest_list?: boolean;
	web_event_type?: string;
	ticket_price_cents?: number;
	theme?: string;
	mode?: string;
	accent_hue?: number | null;
	aesthetic?: string;
	palette?: string;
	subtitle?: string;
	link_url?: string;
	link_title?: string;
	inspo_urls?: string[];
	// Location fields (only present if location_hidden is false)
	venue_name?: string;
	venue_address?: string;
	venue_lat?: number;
	venue_lng?: number;
}

export interface EventHost {
	user_id: string;
	username?: string;
	display_name?: string;
	avatar_r2_key?: string;
}

export interface RsvpCounts {
	going: number;
	maybe: number;
}

export interface PrivacyStats {
	photo_count: number;
	metadata_stripped: boolean;
	data_sharing: string;
	deletion_scheduled?: string;
}

export interface PublicEventData {
	event: PublicEvent;
	host: EventHost | null;
	rsvp_counts: RsvpCounts;
	privacy_stats: PrivacyStats;
	ticketing_ready?: boolean | null;
}

export interface TombstoneData {
	deleted: true;
	title: string;
	deleted_at: string;
}

export type EventPageData = PublicEventData | TombstoneData;

export function isTombstone(data: EventPageData): data is TombstoneData {
	return 'deleted' in data && data.deleted === true;
}

export function isTicketedEvent(event: PublicEvent): boolean {
	return event.web_event_type === 'ticketed' && (event.ticket_price_cents ?? 0) > 0;
}

export function formatPrice(cents: number): string {
	return `$${(cents / 100).toFixed(2)}`;
}

export function getSpotsRemaining(event: PublicEvent, rsvpCounts: RsvpCounts): number | null {
	if (!event.max_attendees) return null;
	return Math.max(0, event.max_attendees - rsvpCounts.going);
}

export function getCoverImageUrl(coverKey?: string): string | null {
	if (!coverKey) return null;
	return `/api/media/${coverKey}`;
}

export function isCoverVideo(coverKey?: string): boolean {
	if (!coverKey) return false;
	return /\.(mp4|webm|mov)$/i.test(coverKey) ||
		coverKey.includes('video/') ||
		coverKey.includes('.mp4');
}

export function getShareUrl(slug: string, shortCode?: string): string {
	if (shortCode) return `https://ephmr.al/e/${shortCode}`;
	return `https://ephemeralsocial.com/e/${slug}`;
}
