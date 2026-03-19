import type { EventAesthetic, EventMode } from '$lib/themes/types';
import { DEFAULT_PALETTES, DEFAULT_MODES, THEME_TO_AESTHETIC } from '$lib/themes/types';
import { parseInspoUrls, type InspoItem, isPinterestBoardEntry } from '$lib/utils/inspo';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type CoverUploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface EventDraft {
	title: string;
	subtitle: string; // only used by Elegant
	description: string;
	venue_name: string;
	venue_address: string;
	start_time: string | null; // ISO string
	end_time: string | null;
	timezone: string;
	max_attendees: number | null;
	location_hidden: boolean;
	show_guest_list: boolean;
	web_event_type: 'simple' | 'ticketed';
	ticket_price_cents: number | null;
	aesthetic: EventAesthetic;
	palette: string;
	mode: EventMode;
	accent_hue: number | null;
	cover_key: string | null;
	cover_thumb_key: string | null;
	cover_preview_url: string | null;
	cover_is_video: boolean;
	link_url: string;
	link_title: string;
	inspo_urls: InspoItem[];
}

function isVideoKey(key: string | null | undefined): boolean {
	if (!key) return false;
	return /\.(mov|mp4|webm|avi|mkv)$/i.test(key);
}

function isVideoFile(file: File): boolean {
	return file.type.startsWith('video/');
}

function extractVideoFrame(file: File): Promise<File> {
	return new Promise((resolve, reject) => {
		const video = document.createElement('video');
		video.preload = 'auto';
		video.muted = true;
		video.playsInline = true;
		const objectUrl = URL.createObjectURL(file);
		video.src = objectUrl;

		video.addEventListener('error', () => {
			URL.revokeObjectURL(objectUrl);
			reject(new Error('Failed to load video for frame extraction'));
		});

		video.addEventListener('loadeddata', () => {
			// Seek slightly past 0 to avoid potential black first frame
			video.currentTime = 0.1;
		});

		video.addEventListener('seeked', () => {
			try {
				const canvas = document.createElement('canvas');
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				const ctx = canvas.getContext('2d');
				if (!ctx) {
					URL.revokeObjectURL(objectUrl);
					reject(new Error('Canvas 2D context unavailable'));
					return;
				}
				ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
				canvas.toBlob(
					(blob) => {
						URL.revokeObjectURL(objectUrl);
						if (!blob) {
							reject(new Error('Frame extraction produced no blob'));
							return;
						}
						const thumbFile = new File([blob], 'cover-thumb.jpg', { type: 'image/jpeg' });
						resolve(thumbFile);
					},
					'image/jpeg',
					0.85
				);
			} catch (err) {
				URL.revokeObjectURL(objectUrl);
				reject(err);
			}
		});
	});
}

function createDefaultDraft(): EventDraft {
	return {
		title: '',
		subtitle: '',
		description: '',
		venue_name: '',
		venue_address: '',
		start_time: null,
		end_time: null,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		max_attendees: null,
		location_hidden: false,
		show_guest_list: false,
		web_event_type: 'simple',
		ticket_price_cents: null,
		aesthetic: 'fun',
		palette: 'party',
		mode: 'dark',
		accent_hue: null,
		cover_key: null,
		cover_thumb_key: null,
		cover_preview_url: null,
		cover_is_video: false,
		link_url: '',
		link_title: '',
		inspo_urls: []
	};
}

// Module-level reactive state
let draft = $state<EventDraft>(createDefaultDraft());
let saveStatus = $state<SaveStatus>('idle');
let lastError = $state<string | null>(null);
let isDirty = $state(false);
let eventId = $state<string | null>(null); // null = create mode
let coverUploadStatus = $state<CoverUploadStatus>('idle');
let fieldErrors = $state<Record<string, string>>({});

// Getters
export function getDraft(): EventDraft {
	return draft;
}
export function getSaveStatus(): SaveStatus {
	return saveStatus;
}
export function getLastError(): string | null {
	return lastError;
}
export function getIsDirty(): boolean {
	return isDirty;
}
export function getEventId(): string | null {
	return eventId;
}
export function getCoverUploadStatus(): CoverUploadStatus {
	return coverUploadStatus;
}
export function getFieldErrors(): Record<string, string> {
	return fieldErrors;
}
export function clearFieldError(field: string) {
	if (fieldErrors[field]) {
		fieldErrors = { ...fieldErrors };
		delete fieldErrors[field];
	}
}

// Validate all draft fields; returns true if valid
export function validateDraft(): boolean {
	const errors: Record<string, string> = {};
	const isCreate = eventId === null;

	// Title: required, 1-100 chars
	if (!draft.title || draft.title.trim().length === 0) {
		errors.title = 'Title is required';
	} else if (draft.title.length > 100) {
		errors.title = 'Title must be 100 characters or less';
	}

	// Start time: required
	if (!draft.start_time) {
		errors.start_time = 'Start time is required';
	} else {
		const startDate = new Date(draft.start_time);
		if (isNaN(startDate.getTime())) {
			errors.start_time = 'Invalid start time';
		} else if (isCreate && startDate < new Date()) {
			errors.start_time = 'Start time must be in the future';
		}
	}

	// End time: optional, but must be after start if provided
	if (draft.end_time) {
		const endDate = new Date(draft.end_time);
		if (isNaN(endDate.getTime())) {
			errors.end_time = 'Invalid end time';
		} else if (draft.start_time) {
			const startDate = new Date(draft.start_time);
			if (!isNaN(startDate.getTime()) && endDate <= startDate) {
				errors.end_time = 'End time must be after start time';
			}
		}
	}

	// Description: max 2000 chars
	if (draft.description && draft.description.length > 2000) {
		errors.description = `Description too long (${draft.description.length}/2000)`;
	}

	// Max attendees: 1-500 if set
	if (draft.max_attendees !== null && draft.max_attendees !== undefined) {
		if (draft.max_attendees < 1 || draft.max_attendees > 500) {
			errors.max_attendees = 'Must be between 1 and 500';
		}
	}

	// Ticket price: required if ticketed
	if (draft.web_event_type === 'ticketed') {
		if (!draft.ticket_price_cents || draft.ticket_price_cents <= 0) {
			errors.ticket_price_cents = 'Ticket price is required for ticketed events';
		}
	}

	fieldErrors = errors;
	return Object.keys(errors).length === 0;
}

// Initialize from existing event (edit mode)
export function initFromEvent(event: Record<string, any>) {
	// Handle backwards compat: if event has theme but no aesthetic, convert
	let aesthetic = event.aesthetic as EventAesthetic;
	let palette = event.palette as string;
	if (!aesthetic && event.theme) {
		const mapped = THEME_TO_AESTHETIC[event.theme];
		if (mapped) {
			aesthetic = mapped.aesthetic;
			palette = mapped.palette;
		}
	}

	draft = {
		title: event.title || '',
		subtitle: event.subtitle || '',
		description: event.description || '',
		venue_name: event.venue_name || '',
		venue_address: event.venue_address || '',
		start_time: event.start_time || null,
		end_time: event.end_time || null,
		timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
		max_attendees: event.max_attendees ?? null,
		location_hidden: Boolean(event.location_hidden),
		show_guest_list: Boolean(event.show_guest_list),
		web_event_type: event.web_event_type || 'simple',
		ticket_price_cents: event.ticket_price_cents ?? null,
		aesthetic: aesthetic || 'fun',
		palette: palette || 'party',
		mode: (event.mode as EventMode) || 'dark',
		accent_hue: event.accent_hue ?? null,
		cover_key: event.cover_r2_key || null,
		cover_thumb_key: event.cover_thumb_r2_key || null,
		cover_preview_url: event.cover_r2_key ? `/api/media/${event.cover_r2_key}` : null,
		cover_is_video: isVideoKey(event.cover_r2_key),
		link_url: event.link_url || '',
		link_title: event.link_title || '',
		inspo_urls: Array.isArray(event.inspo_urls)
			? event.inspo_urls
			: parseInspoUrls(event.inspo_urls)
	};
	eventId = event.event_id || null;
	isDirty = false;
	saveStatus = 'idle';
	lastError = null;
	coverUploadStatus = 'idle';
	fieldErrors = {};
}

// Reset to defaults (create mode)
export function resetDraft() {
	draft = createDefaultDraft();
	eventId = null;
	isDirty = false;
	saveStatus = 'idle';
	lastError = null;
	coverUploadStatus = 'idle';
	fieldErrors = {};
}

// Update a single field
export function updateDraft<K extends keyof EventDraft>(key: K, value: EventDraft[K]) {
	draft = { ...draft, [key]: value };
	isDirty = true;

	// Clear validation error for this field as user edits
	if (fieldErrors[key]) {
		fieldErrors = { ...fieldErrors };
		delete fieldErrors[key];
	}

	// Cross-field: clear end_time error when start_time changes (and vice versa)
	if (key === 'start_time' && fieldErrors.end_time) {
		fieldErrors = { ...fieldErrors };
		delete fieldErrors.end_time;
	}
	if (key === 'end_time' && fieldErrors.start_time) {
		// Don't clear start_time error — it's independent
	}
	// Clear ticket price error when switching to free
	if (key === 'web_event_type' && value === 'simple' && fieldErrors.ticket_price_cents) {
		fieldErrors = { ...fieldErrors };
		delete fieldErrors.ticket_price_cents;
	}

	// When aesthetic changes, update palette to default for new aesthetic
	if (key === 'aesthetic') {
		const newAesthetic = value as EventAesthetic;
		draft = {
			...draft,
			palette: DEFAULT_PALETTES[newAesthetic],
			mode: DEFAULT_MODES[newAesthetic]
		};
	}

}

// Autosave (debounced) -- returns cleanup function
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let savePromise: Promise<void> | null = null;

export function setupAutosave(): () => void {
	// Cleanup function
	return () => {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = null;
	};
}

export async function saveEvent(): Promise<void> {
	return doSave();
}

async function doSave() {
	if (!eventId || !isDirty) return;

	// Queue behind any in-flight save
	if (savePromise) {
		await savePromise;
	}

	saveStatus = 'saving';
	try {
		savePromise = fetch(`/api/events/${eventId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: draft.title,
				description: draft.description || null,
				venue_name: draft.venue_name || null,
				venue_address: draft.venue_address || null,
				start_time: draft.start_time,
				end_time: draft.end_time,
				timezone: draft.timezone,
				max_attendees: draft.max_attendees,
				location_hidden: draft.location_hidden,
				show_guest_list: draft.show_guest_list,
				aesthetic: draft.aesthetic,
				palette: draft.palette,
				mode: draft.mode,
				accent_hue: draft.accent_hue,
				subtitle: draft.aesthetic === 'elegant' ? draft.subtitle : null,
				cover_r2_key: draft.cover_key,
				cover_thumb_r2_key: draft.cover_thumb_key,
				link_url: draft.link_url || null,
				link_title: draft.link_title || null,
				inspo_urls: draft.inspo_urls.filter((item) =>
					isPinterestBoardEntry(item) || (typeof item === 'string' && item.trim().length > 0)
				)
			})
		}).then(async (res) => {
			if (!res.ok) throw new Error(`Save failed: ${res.status}`);
		});
		await savePromise;
		saveStatus = 'saved';
		isDirty = false;
		lastError = null;
	} catch (e) {
		saveStatus = 'error';
		lastError = e instanceof Error ? e.message : 'Unknown error';
	} finally {
		savePromise = null;
	}
}

export function triggerAutosave() {
	if (saveTimer) clearTimeout(saveTimer);
	saveTimer = setTimeout(() => doSave(), 2000);
}

// Publish event (create mode)
export async function publishEvent(): Promise<{ event_id: string; slug: string } | null> {
	saveStatus = 'saving';
	try {
		const res = await fetch('/api/events/create', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				title: draft.title,
				description: draft.description || null,
				venue_name: draft.venue_name || null,
				venue_address: draft.venue_address || null,
				start_time: draft.start_time,
				end_time: draft.end_time,
				timezone: draft.timezone,
				max_attendees: draft.max_attendees,
				location_hidden: draft.location_hidden,
				show_guest_list: draft.show_guest_list,
				web_event_type: draft.web_event_type,
				ticket_price_cents: draft.web_event_type === 'ticketed' ? draft.ticket_price_cents : null,
				aesthetic: draft.aesthetic,
				palette: draft.palette,
				mode: draft.mode,
				accent_hue: draft.accent_hue,
				subtitle: draft.aesthetic === 'elegant' ? draft.subtitle : null,
				cover_r2_key: draft.cover_key,
				cover_thumb_r2_key: draft.cover_thumb_key,
				link_url: draft.link_url || null,
				link_title: draft.link_title || null,
				inspo_urls: draft.inspo_urls.filter((item) =>
					isPinterestBoardEntry(item) || (typeof item === 'string' && item.trim().length > 0)
				)
			})
		});
		if (!res.ok) {
			const err = await res.json().catch(() => ({}));
			throw new Error((err as any).error || `Create failed: ${res.status}`);
		}
		const data = (await res.json()) as any;
		saveStatus = 'saved';
		isDirty = false;
		return { event_id: data.event.event_id, slug: data.event.slug };
	} catch (e) {
		saveStatus = 'error';
		lastError = e instanceof Error ? e.message : 'Unknown error';
		return null;
	}
}

// Cover upload
export async function uploadCover(file: File): Promise<void> {
	// Optimistic: show preview immediately
	const previousUrl = draft.cover_preview_url;
	const previousKey = draft.cover_key;
	const previousThumbKey = draft.cover_thumb_key;
	const previousIsVideo = draft.cover_is_video;
	const fileIsVideo = isVideoFile(file);
	draft = { ...draft, cover_preview_url: URL.createObjectURL(file), cover_is_video: fileIsVideo };
	isDirty = true;
	coverUploadStatus = 'uploading';

	// Revoke previous objectURL to prevent memory leaks
	if (previousUrl && previousUrl.startsWith('blob:')) {
		URL.revokeObjectURL(previousUrl);
	}

	// Background upload
	try {
		// Upload the cover file (image or video)
		const formData = new FormData();
		formData.append('file', file);
		formData.append('type', 'event_cover');

		const res = await fetch('/api/media/upload', {
			method: 'POST',
			body: formData
		});
		if (!res.ok) throw new Error('Upload failed');
		const data = (await res.json()) as any;

		let thumbKey: string | null = null;

		// For video files, extract a frame and upload as thumbnail
		if (fileIsVideo) {
			try {
				const thumbFile = await extractVideoFrame(file);
				const thumbFormData = new FormData();
				thumbFormData.append('file', thumbFile);
				thumbFormData.append('type', 'event_cover');

				const thumbRes = await fetch('/api/media/upload', {
					method: 'POST',
					body: thumbFormData
				});
				if (thumbRes.ok) {
					const thumbData = (await thumbRes.json()) as any;
					thumbKey = thumbData.key;
				}
			} catch {
				// Thumbnail extraction failed — non-critical, OG will fall back to gradient
			}
		}

		// Switch preview to the server-served URL so user sees the real stored media
		const blobUrl = draft.cover_preview_url;
		const serverUrl = `/api/media/${data.key}`;
		draft = {
			...draft,
			cover_key: data.key,
			cover_thumb_key: thumbKey,
			cover_preview_url: serverUrl
		};
		coverUploadStatus = 'success';

		// Revoke the blob URL now that we have the server URL
		if (blobUrl && blobUrl.startsWith('blob:')) {
			setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
		}

		// Auto-clear success overlay after 3s (matches CSS animation timing)
		setTimeout(() => {
			if (coverUploadStatus === 'success') coverUploadStatus = 'idle';
		}, 3000);

		// Auto-save with the new cover key(s)
		triggerAutosave();
	} catch (e) {
		// Revert preview on failure
		if (draft.cover_preview_url?.startsWith('blob:')) {
			URL.revokeObjectURL(draft.cover_preview_url);
		}
		draft = {
			...draft,
			cover_preview_url: previousUrl,
			cover_key: previousKey,
			cover_thumb_key: previousThumbKey,
			cover_is_video: previousIsVideo
		};
		coverUploadStatus = 'error';
		lastError = 'Cover upload failed';
		saveStatus = 'error';

		// Auto-clear error overlay after 5s (matches CSS animation timing)
		setTimeout(() => {
			if (coverUploadStatus === 'error') coverUploadStatus = 'idle';
		}, 5000);
	}
}
