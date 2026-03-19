import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	getDraft,
	getSaveStatus,
	getLastError,
	getIsDirty,
	getEventId,
	initFromEvent,
	resetDraft,
	updateDraft,
	publishEvent,
	uploadCover,
	type EventDraft
} from '$lib/stores/event-draft.svelte';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';

describe('event-draft store', () => {
	beforeEach(() => {
		resetDraft();
		vi.restoreAllMocks();
	});

	// ── initFromEvent ───────────────────────────────────────────────

	it('initFromEvent: maps all fields correctly including aesthetic/palette/subtitle', () => {
		const event = {
			event_id: 'evt-123',
			title: 'Gala Night',
			subtitle: 'An Evening of Elegance',
			description: 'A grand event',
			venue_name: 'The Ritz',
			venue_address: '123 Main St',
			start_time: '2026-03-07T19:00:00Z',
			end_time: '2026-03-07T23:00:00Z',
			timezone: 'America/New_York',
			max_attendees: 100,
			location_hidden: true,
			show_guest_list: true,
			web_event_type: 'ticketed',
			ticket_price_cents: 5000,
			aesthetic: 'elegant',
			palette: 'champagne',
			mode: 'dark',
			accent_hue: 30,
			cover_r2_key: 'covers/abc.jpg'
		};

		initFromEvent(event);
		const draft = getDraft();

		expect(draft.title).toBe('Gala Night');
		expect(draft.subtitle).toBe('An Evening of Elegance');
		expect(draft.description).toBe('A grand event');
		expect(draft.venue_name).toBe('The Ritz');
		expect(draft.venue_address).toBe('123 Main St');
		expect(draft.start_time).toBe('2026-03-07T19:00:00Z');
		expect(draft.end_time).toBe('2026-03-07T23:00:00Z');
		expect(draft.timezone).toBe('America/New_York');
		expect(draft.max_attendees).toBe(100);
		expect(draft.location_hidden).toBe(true);
		expect(draft.show_guest_list).toBe(true);
		expect(draft.web_event_type).toBe('ticketed');
		expect(draft.ticket_price_cents).toBe(5000);
		expect(draft.aesthetic).toBe('elegant');
		expect(draft.palette).toBe('champagne');
		expect(draft.mode).toBe('dark');
		expect(draft.accent_hue).toBe(30);
		expect(draft.cover_key).toBe('covers/abc.jpg');
		expect(draft.cover_preview_url).toBe('/api/media/covers/abc.jpg');
		expect(getEventId()).toBe('evt-123');
		expect(getIsDirty()).toBe(false);
		expect(getSaveStatus()).toBe('idle');
	});

	it('initFromEvent: old events with theme but no aesthetic maps via THEME_TO_AESTHETIC', () => {
		const event = {
			event_id: 'evt-legacy',
			title: 'Retro Party',
			theme: 'ember' // legacy theme, no aesthetic field
		};

		initFromEvent(event);
		const draft = getDraft();

		// All legacy themes map to fun/party
		expect(draft.aesthetic).toBe('fun');
		expect(draft.palette).toBe('party');
	});

	it('initFromEvent: old events with unknown theme fall back to defaults', () => {
		const event = {
			event_id: 'evt-unknown',
			title: 'Mystery Event',
			theme: 'nonexistent_theme'
		};

		initFromEvent(event);
		const draft = getDraft();

		// No mapping found, falls through to default
		expect(draft.aesthetic).toBe('fun');
		expect(draft.palette).toBe('party');
	});

	// ── resetDraft ──────────────────────────────────────────────────

	it('resetDraft: resets all fields to defaults (aesthetic=fun, palette=party, mode=dark)', () => {
		// Set up non-default state first
		initFromEvent({
			event_id: 'evt-dirty',
			title: 'Some Event',
			aesthetic: 'elegant',
			palette: 'ivory',
			mode: 'dark'
		});
		updateDraft('title', 'Modified');

		// Reset
		resetDraft();
		const draft = getDraft();

		expect(draft.title).toBe('');
		expect(draft.subtitle).toBe('');
		expect(draft.description).toBe('');
		expect(draft.venue_name).toBe('');
		expect(draft.venue_address).toBe('');
		expect(draft.start_time).toBeNull();
		expect(draft.end_time).toBeNull();
		expect(draft.max_attendees).toBeNull();
		expect(draft.location_hidden).toBe(false);
		expect(draft.show_guest_list).toBe(false);
		expect(draft.web_event_type).toBe('simple');
		expect(draft.ticket_price_cents).toBeNull();
		expect(draft.aesthetic).toBe('fun');
		expect(draft.palette).toBe('party');
		expect(draft.mode).toBe('dark');
		expect(draft.accent_hue).toBeNull();
		expect(draft.cover_key).toBeNull();
		expect(draft.cover_preview_url).toBeNull();
		expect(getEventId()).toBeNull();
		expect(getIsDirty()).toBe(false);
		expect(getSaveStatus()).toBe('idle');
		expect(getLastError()).toBeNull();
	});

	// ── updateDraft ─────────────────────────────────────────────────

	it('updateDraft: aesthetic change triggers palette/mode defaults', () => {
		// Start with fun defaults
		expect(getDraft().aesthetic).toBe('fun');
		expect(getDraft().palette).toBe('party');
		expect(getDraft().mode).toBe('dark');

		// Switch to simple
		updateDraft('aesthetic', 'simple');
		expect(getDraft().aesthetic).toBe('simple');
		expect(getDraft().palette).toBe('default');
		expect(getDraft().mode).toBe('light');

		// Switch to elegant
		updateDraft('aesthetic', 'elegant');
		expect(getDraft().aesthetic).toBe('elegant');
		expect(getDraft().palette).toBe('ivory');
		expect(getDraft().mode).toBe('dark');

		// Switch to warm
		updateDraft('aesthetic', 'warm');
		expect(getDraft().aesthetic).toBe('warm');
		expect(getDraft().palette).toBe('hearth');
		expect(getDraft().mode).toBe('dark');
	});

	it('updateDraft: sets isDirty=true', () => {
		expect(getIsDirty()).toBe(false);
		updateDraft('title', 'New Title');
		expect(getIsDirty()).toBe(true);
	});

	it('updateDraft: updates individual fields correctly', () => {
		updateDraft('title', 'My Event');
		expect(getDraft().title).toBe('My Event');

		updateDraft('venue_name', 'Central Park');
		expect(getDraft().venue_name).toBe('Central Park');

		updateDraft('max_attendees', 50);
		expect(getDraft().max_attendees).toBe(50);

		updateDraft('location_hidden', true);
		expect(getDraft().location_hidden).toBe(true);
	});

	// ── publishEvent ────────────────────────────────────────────────

	it('publishEvent: POST payload includes aesthetic, palette, mode, accent_hue', async () => {
		updateDraft('title', 'Test Event');
		updateDraft('aesthetic', 'warm');
		updateDraft('accent_hue', 200);

		const spy = mockFetch(
			mockFetchJsonResponse(200, {
				event: { event_id: 'evt-new', slug: 'test-event' }
			})
		);

		const result = await publishEvent();

		expect(result).toEqual({ event_id: 'evt-new', slug: 'test-event' });
		expect(spy).toHaveBeenCalledOnce();

		const [url, opts] = spy.mock.calls[0];
		expect(url).toBe('/api/events/create');
		expect(opts.method).toBe('POST');

		const body = JSON.parse(opts.body as string);
		expect(body.aesthetic).toBe('warm');
		expect(body.palette).toBe('hearth');
		expect(body.mode).toBe('dark');
		expect(body.accent_hue).toBe(200);
	});

	it('publishEvent: elegant events include subtitle in payload', async () => {
		updateDraft('title', 'Elegant Gala');
		updateDraft('aesthetic', 'elegant');
		updateDraft('subtitle', 'An Evening to Remember');

		const spy = mockFetch(
			mockFetchJsonResponse(200, {
				event: { event_id: 'evt-gala', slug: 'elegant-gala' }
			})
		);

		await publishEvent();

		const body = JSON.parse(spy.mock.calls[0][1].body as string);
		expect(body.subtitle).toBe('An Evening to Remember');
	});

	it('publishEvent: non-elegant events send subtitle as null', async () => {
		updateDraft('title', 'Fun Party');
		updateDraft('subtitle', 'Should be ignored');
		// aesthetic defaults to 'fun'

		const spy = mockFetch(
			mockFetchJsonResponse(200, {
				event: { event_id: 'evt-fun', slug: 'fun-party' }
			})
		);

		await publishEvent();

		const body = JSON.parse(spy.mock.calls[0][1].body as string);
		expect(body.subtitle).toBeNull();
	});

	it('publishEvent: sets saveStatus to saved on success', async () => {
		updateDraft('title', 'Test');

		mockFetch(
			mockFetchJsonResponse(200, {
				event: { event_id: 'evt-1', slug: 'test' }
			})
		);

		await publishEvent();

		expect(getSaveStatus()).toBe('saved');
		expect(getIsDirty()).toBe(false);
	});

	it('publishEvent: sets saveStatus to error on failure', async () => {
		updateDraft('title', 'Test');

		mockFetch(
			mockFetchJsonResponse(500, { error: 'Internal server error' })
		);

		const result = await publishEvent();

		expect(result).toBeNull();
		expect(getSaveStatus()).toBe('error');
		expect(getLastError()).toBe('Internal server error');
	});

	// ── inspo_urls ─────────────────────────────────────────────────

	it('initFromEvent: maps inspo_urls from JSON string to array', () => {
		const event = {
			event_id: 'evt-inspo',
			title: 'Inspo Event',
			inspo_urls: '["https://pinterest.com/user/board","https://docs.google.com/presentation/d/1/edit"]'
		};

		initFromEvent(event);
		const draft = getDraft();

		expect(draft.inspo_urls).toEqual([
			'https://pinterest.com/user/board',
			'https://docs.google.com/presentation/d/1/edit'
		]);
	});

	it('initFromEvent: maps inspo_urls from array directly', () => {
		const event = {
			event_id: 'evt-inspo2',
			title: 'Inspo Event 2',
			inspo_urls: ['https://pinterest.com/user/board']
		};

		initFromEvent(event);
		const draft = getDraft();

		expect(draft.inspo_urls).toEqual(['https://pinterest.com/user/board']);
	});

	it('initFromEvent: defaults inspo_urls to empty array when null', () => {
		const event = {
			event_id: 'evt-no-inspo',
			title: 'No Inspo',
			inspo_urls: null
		};

		initFromEvent(event);
		const draft = getDraft();

		expect(draft.inspo_urls).toEqual([]);
	});

	it('resetDraft: inspo_urls defaults to empty array', () => {
		// Set up non-default state
		initFromEvent({
			event_id: 'evt-x',
			title: 'X',
			inspo_urls: '["https://pinterest.com/user/board"]'
		});
		expect(getDraft().inspo_urls).toHaveLength(1);

		resetDraft();
		expect(getDraft().inspo_urls).toEqual([]);
	});

	it('updateDraft: updates inspo_urls array', () => {
		const urls = ['https://pinterest.com/user/board', 'https://docs.google.com/presentation/d/1/edit'];
		updateDraft('inspo_urls', urls);
		expect(getDraft().inspo_urls).toEqual(urls);
		expect(getIsDirty()).toBe(true);
	});

	// ── uploadCover ─────────────────────────────────────────────────

	it('uploadCover: preview URL set immediately via createObjectURL', async () => {
		const blobUrl = 'blob:http://localhost/fake-blob';
		vi.spyOn(URL, 'createObjectURL').mockReturnValue(blobUrl);
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

		mockFetch(mockFetchJsonResponse(200, { key: 'covers/uploaded.jpg' }));

		const file = new File(['fake-image-data'], 'cover.jpg', { type: 'image/jpeg' });

		// Start the upload but check preview immediately
		const uploadPromise = uploadCover(file);

		// Preview URL should be set immediately (before await)
		expect(getDraft().cover_preview_url).toBe(blobUrl);
		expect(URL.createObjectURL).toHaveBeenCalledWith(file);

		await uploadPromise;

		// After upload completes, cover_key should be set
		expect(getDraft().cover_key).toBe('covers/uploaded.jpg');
		expect(getIsDirty()).toBe(true);
	});

	it('uploadCover: reverts preview on upload failure', async () => {
		const blobUrl = 'blob:http://localhost/fake-blob';
		vi.spyOn(URL, 'createObjectURL').mockReturnValue(blobUrl);
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

		mockFetch(mockFetchJsonResponse(500, { error: 'Upload failed' }));

		const file = new File(['fake-image-data'], 'cover.jpg', { type: 'image/jpeg' });

		await uploadCover(file);

		// Should revert to null (original value)
		expect(getDraft().cover_preview_url).toBeNull();
		expect(getDraft().cover_key).toBeNull();
		expect(getSaveStatus()).toBe('error');
		expect(getLastError()).toBe('Cover upload failed');
	});
});
