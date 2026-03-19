import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	VALID_AESTHETICS,
	VALID_PALETTES,
	VALID_THEMES,
	THEME_TO_AESTHETIC,
	DEFAULT_PALETTES,
	DEFAULT_MODES,
	isValidAesthetic,
	isValidPaletteForAesthetic
} from '$lib/themes/types';
import {
	getDraft,
	resetDraft,
	updateDraft,
	initFromEvent,
	publishEvent
} from '$lib/stores/event-draft.svelte';
import { mockFetch, mockFetchJsonResponse } from '../mocks/fetch';
import { createMockRequestEvent } from '../mocks/request-event';
import { createMockSession, createMockEventData, createMockPlatform } from '../helpers';
import { createMockKV } from '../mocks/kv';
import { createMockCookies } from '../mocks/cookies';

describe('Aesthetic System Integration', () => {
	beforeEach(() => {
		resetDraft();
		vi.restoreAllMocks();
	});

	// ── Type validation ──────────────────────────────────────────────

	describe('Type validation', () => {
		it('isValidAesthetic accepts valid aesthetics', () => {
			expect(isValidAesthetic('simple')).toBe(true);
			expect(isValidAesthetic('fun')).toBe(true);
			expect(isValidAesthetic('warm')).toBe(true);
			expect(isValidAesthetic('elegant')).toBe(true);
		});

		it('isValidAesthetic rejects invalid values', () => {
			expect(isValidAesthetic('fancy')).toBe(false);
			expect(isValidAesthetic('forest')).toBe(false);
			expect(isValidAesthetic('')).toBe(false);
			expect(isValidAesthetic('SIMPLE')).toBe(false);
		});

		it('isValidPaletteForAesthetic accepts matching palette', () => {
			expect(isValidPaletteForAesthetic('simple', 'default')).toBe(true);
			expect(isValidPaletteForAesthetic('simple', 'blue')).toBe(true);
			expect(isValidPaletteForAesthetic('fun', 'party')).toBe(true);
			expect(isValidPaletteForAesthetic('fun', 'neon')).toBe(true);
			expect(isValidPaletteForAesthetic('warm', 'hearth')).toBe(true);
			expect(isValidPaletteForAesthetic('elegant', 'ivory')).toBe(true);
		});

		it('isValidPaletteForAesthetic rejects mismatched palette', () => {
			expect(isValidPaletteForAesthetic('simple', 'party')).toBe(false);
			expect(isValidPaletteForAesthetic('fun', 'default')).toBe(false);
			expect(isValidPaletteForAesthetic('elegant', 'party')).toBe(false);
			expect(isValidPaletteForAesthetic('warm', 'ivory')).toBe(false);
		});

		it('DEFAULT_PALETTES has correct defaults for each aesthetic', () => {
			expect(DEFAULT_PALETTES.simple).toBe('default');
			expect(DEFAULT_PALETTES.fun).toBe('party');
			expect(DEFAULT_PALETTES.warm).toBe('hearth');
			expect(DEFAULT_PALETTES.elegant).toBe('ivory');
		});

		it('DEFAULT_MODES has correct defaults for each aesthetic', () => {
			expect(DEFAULT_MODES.simple).toBe('light');
			expect(DEFAULT_MODES.fun).toBe('dark');
			expect(DEFAULT_MODES.warm).toBe('dark');
			expect(DEFAULT_MODES.elegant).toBe('dark');
		});
	});

	// ── THEME_TO_AESTHETIC backwards compatibility ───────────────────

	describe('THEME_TO_AESTHETIC backwards compatibility', () => {
		it('maps forest to fun/party', () => {
			expect(THEME_TO_AESTHETIC['forest']).toEqual({ aesthetic: 'fun', palette: 'party' });
		});

		it('maps midnight to fun/party', () => {
			expect(THEME_TO_AESTHETIC['midnight']).toEqual({ aesthetic: 'fun', palette: 'party' });
		});

		it('maps ember to fun/party', () => {
			expect(THEME_TO_AESTHETIC['ember']).toEqual({ aesthetic: 'fun', palette: 'party' });
		});

		it('maps slate to fun/party', () => {
			expect(THEME_TO_AESTHETIC['slate']).toEqual({ aesthetic: 'fun', palette: 'party' });
		});

		it('maps bloom to fun/party', () => {
			expect(THEME_TO_AESTHETIC['bloom']).toEqual({ aesthetic: 'fun', palette: 'party' });
		});

		it('maps gilded to fun/party', () => {
			expect(THEME_TO_AESTHETIC['gilded']).toEqual({
				aesthetic: 'fun',
				palette: 'party'
			});
		});

		it('maps neon to fun/party', () => {
			expect(THEME_TO_AESTHETIC['neon']).toEqual({ aesthetic: 'fun', palette: 'party' });
		});

		it('maps dusk to fun/party', () => {
			expect(THEME_TO_AESTHETIC['dusk']).toEqual({ aesthetic: 'fun', palette: 'party' });
		});

		it('maps sand to fun/party', () => {
			expect(THEME_TO_AESTHETIC['sand']).toEqual({ aesthetic: 'fun', palette: 'party' });
		});

		it('maps mono to fun/party', () => {
			expect(THEME_TO_AESTHETIC['mono']).toEqual({ aesthetic: 'fun', palette: 'party' });
		});

		it('all 10 legacy themes have mappings', () => {
			const mappedThemes = Object.keys(THEME_TO_AESTHETIC);
			for (const theme of VALID_THEMES) {
				expect(mappedThemes).toContain(theme);
			}
			expect(mappedThemes).toHaveLength(VALID_THEMES.length);
		});
	});

	// ── Draft store aesthetic cascading ──────────────────────────────

	describe('Draft store aesthetic cascading', () => {
		it('resetDraft sets aesthetic=fun, palette=party, mode=dark', () => {
			const draft = getDraft();
			expect(draft.aesthetic).toBe('fun');
			expect(draft.palette).toBe('party');
			expect(draft.mode).toBe('dark');
		});

		it('updateDraft aesthetic cascades palette and mode to simple', () => {
			updateDraft('aesthetic', 'simple');
			const draft = getDraft();
			expect(draft.aesthetic).toBe('simple');
			expect(draft.palette).toBe('default');
			expect(draft.mode).toBe('light');
		});

		it('updateDraft aesthetic cascades palette and mode to elegant', () => {
			updateDraft('aesthetic', 'elegant');
			const draft = getDraft();
			expect(draft.aesthetic).toBe('elegant');
			expect(draft.palette).toBe('ivory');
			expect(draft.mode).toBe('dark');
		});

		it('updateDraft aesthetic cascades palette and mode to warm', () => {
			updateDraft('aesthetic', 'warm');
			const draft = getDraft();
			expect(draft.aesthetic).toBe('warm');
			expect(draft.palette).toBe('hearth');
			expect(draft.mode).toBe('dark');
		});

		it('initFromEvent with legacy theme maps correctly', () => {
			initFromEvent({
				event_id: 'evt-legacy',
				title: 'Ember Event',
				theme: 'ember'
				// no aesthetic field
			});
			const draft = getDraft();
			expect(draft.aesthetic).toBe('fun');
			expect(draft.palette).toBe('party');
		});

		it('initFromEvent with aesthetic field preserves it', () => {
			initFromEvent({
				event_id: 'evt-modern',
				title: 'Modern Event',
				aesthetic: 'elegant',
				palette: 'midnight',
				mode: 'dark'
			});
			const draft = getDraft();
			expect(draft.aesthetic).toBe('elegant');
			expect(draft.palette).toBe('midnight');
			expect(draft.mode).toBe('dark');
		});
	});

	// ── Publish payload structure ───────────────────────────────────

	describe('Publish payload structure', () => {
		it('publishEvent sends aesthetic fields in POST body', async () => {
			updateDraft('title', 'Integration Test Event');
			updateDraft('aesthetic', 'warm');
			updateDraft('accent_hue', 180);

			const spy = mockFetch(
				mockFetchJsonResponse(200, {
					event: { event_id: 'evt-int', slug: 'integration-test-event' }
				})
			);

			await publishEvent();

			expect(spy).toHaveBeenCalledOnce();
			const [url, opts] = spy.mock.calls[0];
			expect(url).toBe('/api/events/create');
			expect(opts.method).toBe('POST');

			const body = JSON.parse(opts.body as string);
			expect(body.aesthetic).toBe('warm');
			expect(body.palette).toBe('hearth');
			expect(body.mode).toBe('dark');
			expect(body.accent_hue).toBe(180);
		});

		it('publishEvent includes subtitle only for elegant', async () => {
			// Elegant with subtitle -- should be included
			updateDraft('title', 'Gala');
			updateDraft('aesthetic', 'elegant');
			updateDraft('subtitle', 'An Evening of Wonder');

			const spy = mockFetch(
				mockFetchJsonResponse(200, {
					event: { event_id: 'evt-e', slug: 'gala' }
				})
			);

			await publishEvent();

			const elegantBody = JSON.parse(spy.mock.calls[0][1].body as string);
			expect(elegantBody.subtitle).toBe('An Evening of Wonder');

			// Reset and test non-elegant
			resetDraft();
			vi.restoreAllMocks();

			updateDraft('title', 'Fun Party');
			updateDraft('subtitle', 'Should be ignored');
			// aesthetic defaults to 'fun'

			const spy2 = mockFetch(
				mockFetchJsonResponse(200, {
					event: { event_id: 'evt-f', slug: 'fun-party' }
				})
			);

			await publishEvent();

			const funBody = JSON.parse(spy2.mock.calls[0][1].body as string);
			expect(funBody.subtitle).toBeNull();
		});
	});

	// ── VALID_PALETTES structure ────────────────────────────────────

	describe('VALID_PALETTES structure', () => {
		it('each aesthetic has exactly 4 palettes', () => {
			for (const aesthetic of VALID_AESTHETICS) {
				expect(VALID_PALETTES[aesthetic]).toHaveLength(4);
			}
		});

		it('all palettes are unique strings within each aesthetic', () => {
			for (const aesthetic of VALID_AESTHETICS) {
				const palettes = VALID_PALETTES[aesthetic];
				const unique = new Set(palettes);
				expect(unique.size).toBe(palettes.length);
			}
		});
	});

	// ── API proxy: Create flow ──────────────────────────────────────

	describe('API proxy: POST /api/events/create sends aesthetic fields', () => {
		let createHandler: typeof import('../../routes/api/events/create/+server').POST;

		beforeEach(async () => {
			const mod = await import('../../routes/api/events/create/+server');
			createHandler = mod.POST;
		});

		it('forwards aesthetic, palette, mode, accent_hue to backend', async () => {
			const eventBody = {
				title: 'Aesthetic Party',
				aesthetic: 'warm',
				palette: 'clay',
				mode: 'dark',
				accent_hue: 30
			};

			const spy = mockFetch(
				mockFetchJsonResponse(201, { event_id: 'evt-aes', ...eventBody })
			);

			const kv = createMockKV();
			const cookies = createMockCookies();
			const session = createMockSession();
			await kv.put('session:test-sid', JSON.stringify(session));
			cookies.set('eph_session', 'test-sid');

			const reqEvent = createMockRequestEvent({
				method: 'POST',
				body: eventBody,
				cookies,
				platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
			});

			const response = await createHandler(reqEvent as any);
			expect(response.status).toBe(201);

			expect(spy).toHaveBeenCalled();
			const [, opts] = spy.mock.calls[0];
			const sentBody = JSON.parse(opts.body);
			expect(sentBody.aesthetic).toBe('warm');
			expect(sentBody.palette).toBe('clay');
			expect(sentBody.mode).toBe('dark');
			expect(sentBody.accent_hue).toBe(30);
		});

		it('forwards elegant aesthetic with subtitle', async () => {
			const eventBody = {
				title: 'Elegant Gala',
				aesthetic: 'elegant',
				palette: 'midnight',
				mode: 'dark',
				accent_hue: null,
				subtitle: 'An Evening of Splendor'
			};

			const spy = mockFetch(
				mockFetchJsonResponse(201, { event_id: 'evt-elg', ...eventBody })
			);

			const kv = createMockKV();
			const cookies = createMockCookies();
			const session = createMockSession();
			await kv.put('session:test-sid', JSON.stringify(session));
			cookies.set('eph_session', 'test-sid');

			const reqEvent = createMockRequestEvent({
				method: 'POST',
				body: eventBody,
				cookies,
				platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
			});

			const response = await createHandler(reqEvent as any);
			expect(response.status).toBe(201);

			const [, opts] = spy.mock.calls[0];
			const sentBody = JSON.parse(opts.body);
			expect(sentBody.aesthetic).toBe('elegant');
			expect(sentBody.palette).toBe('midnight');
			expect(sentBody.subtitle).toBe('An Evening of Splendor');
		});
	});

	// ── API proxy: Edit flow ────────────────────────────────────────

	describe('API proxy: PUT /api/events/:id sends aesthetic fields', () => {
		let putHandler: typeof import('../../routes/api/events/[eventId]/+server').PUT;

		beforeEach(async () => {
			const mod = await import('../../routes/api/events/[eventId]/+server');
			putHandler = mod.PUT;
		});

		it('forwards aesthetic, palette, mode, accent_hue to backend on edit', async () => {
			const updateBody = {
				title: 'Updated Event',
				aesthetic: 'simple',
				palette: 'blue',
				mode: 'light',
				accent_hue: 210
			};

			const spy = mockFetch(
				mockFetchJsonResponse(200, { event_id: 'evt-edit', ...updateBody })
			);

			const kv = createMockKV();
			const cookies = createMockCookies();
			const session = createMockSession();
			await kv.put('session:test-sid', JSON.stringify(session));
			cookies.set('eph_session', 'test-sid');

			const reqEvent = createMockRequestEvent({
				method: 'PUT',
				body: updateBody,
				params: { eventId: 'evt-edit' },
				cookies,
				platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
			});

			const response = await putHandler(reqEvent as any);
			expect(response.status).toBe(200);

			expect(spy).toHaveBeenCalled();
			const [url, opts] = spy.mock.calls[0];
			expect(url).toContain('/v1/events/evt-edit');
			expect(opts.method).toBe('PUT');

			const sentBody = JSON.parse(opts.body);
			expect(sentBody.aesthetic).toBe('simple');
			expect(sentBody.palette).toBe('blue');
			expect(sentBody.mode).toBe('light');
			expect(sentBody.accent_hue).toBe(210);
		});

		it('forwards subtitle change on edit', async () => {
			const updateBody = {
				title: 'Updated Gala',
				aesthetic: 'elegant',
				palette: 'rose',
				mode: 'dark',
				subtitle: 'A Night to Remember'
			};

			const spy = mockFetch(
				mockFetchJsonResponse(200, { event_id: 'evt-sub', ...updateBody })
			);

			const kv = createMockKV();
			const cookies = createMockCookies();
			const session = createMockSession();
			await kv.put('session:test-sid', JSON.stringify(session));
			cookies.set('eph_session', 'test-sid');

			const reqEvent = createMockRequestEvent({
				method: 'PUT',
				body: updateBody,
				params: { eventId: 'evt-sub' },
				cookies,
				platform: { env: { SESSIONS: kv, BACKEND_URL: 'http://127.0.0.1:8787' } }
			});

			const response = await putHandler(reqEvent as any);
			expect(response.status).toBe(200);

			const [, opts] = spy.mock.calls[0];
			const sentBody = JSON.parse(opts.body);
			expect(sentBody.subtitle).toBe('A Night to Remember');
			expect(sentBody.aesthetic).toBe('elegant');
			expect(sentBody.palette).toBe('rose');
		});
	});

	// ── View flow: page.server.ts passes aesthetic fields ───────────

	describe('View flow: +page.server.ts passes aesthetic/palette/mode to page', () => {
		it('returns aesthetic fields from backend response in page data', async () => {
			const { load } = await import('../../routes/e/[slug]/+page.server');

			const eventData = createMockEventData({
				event: {
					event_id: 'evt-view',
					title: 'Aesthetic Event',
					aesthetic: 'warm',
					palette: 'hearth',
					mode: 'dark',
					accent_hue: 45
				} as any
			});
			mockFetch(mockFetchJsonResponse(200, eventData));

			const cookies = createMockCookies();
			const result = await load({
				params: { slug: 'aesthetic-event' },
				platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } },
				cookies
			} as any);

			const data = result as any;
			expect(data.eventData.event.aesthetic).toBe('warm');
			expect(data.eventData.event.palette).toBe('hearth');
			expect(data.eventData.event.mode).toBe('dark');
			expect(data.eventData.event.accent_hue).toBe(45);
		});

		it('returns event with legacy theme and no aesthetic field', async () => {
			const { load } = await import('../../routes/e/[slug]/+page.server');

			const eventData = createMockEventData({
				event: {
					event_id: 'evt-legacy-view',
					title: 'Legacy Forest Event',
					theme: 'forest'
					// no aesthetic, palette, or mode
				} as any
			});
			mockFetch(mockFetchJsonResponse(200, eventData));

			const cookies = createMockCookies();
			const result = await load({
				params: { slug: 'legacy-forest' },
				platform: { env: { BACKEND_URL: 'http://127.0.0.1:8787' } },
				cookies
			} as any);

			// The page server passes through whatever the backend returns.
			// THEME_TO_AESTHETIC mapping happens client-side in the draft store.
			// Verify the theme field is preserved in the response.
			const data = result as any;
			expect(data.eventData.event.theme).toBe('forest');
			expect(data.slug).toBe('legacy-forest');

			// Verify the mapping works if we feed it to initFromEvent
			initFromEvent(data.eventData.event);
			const draft = getDraft();
			expect(draft.aesthetic).toBe('fun');
			expect(draft.palette).toBe('party');
		});

		it('returns aesthetic fields for authenticated user page load', async () => {
			const { load } = await import('../../routes/e/[slug]/+page.server');

			const eventData = createMockEventData({
				event: {
					event_id: 'evt-auth-view',
					title: 'Auth Aesthetic',
					aesthetic: 'elegant',
					palette: 'champagne',
					mode: 'dark',
					subtitle: 'Formal Evening'
				} as any
			});

			const spy = vi.spyOn(globalThis, 'fetch');
			spy.mockImplementation(async (input) => {
				const url = typeof input === 'string' ? input : (input as Request).url;
				if (url.includes('/v1/events/by-slug/')) {
					return mockFetchJsonResponse(200, eventData);
				}
				// my-rsvp returns 404 (no RSVP)
				return mockFetchJsonResponse(404, {
					error: { code: 'NOT_FOUND', message: 'No RSVP' }
				});
			});

			const kv = createMockKV();
			const cookies = createMockCookies();
			const session = createMockSession();
			await kv.put('session:sid-aes', JSON.stringify(session));
			cookies.set('eph_session', 'sid-aes');
			const platform = createMockPlatform({ kv });

			const result = await load({
				params: { slug: 'auth-aesthetic' },
				platform,
				cookies
			} as any);

			const data = result as any;
			expect(data.eventData.event.aesthetic).toBe('elegant');
			expect(data.eventData.event.palette).toBe('champagne');
			expect(data.eventData.event.subtitle).toBe('Formal Evening');
			expect(data.isAuthenticated).toBe(true);
		});
	});
});
