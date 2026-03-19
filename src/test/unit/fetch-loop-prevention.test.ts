// @vitest-environment jsdom
/**
 * BEHAVIORAL regression tests for the infinite fetch loop bug.
 *
 * Bug: CommentList, PhotoGrid, CostSummary used $effect for data loading.
 * When fetch failed, `loaded` stayed false, causing $effect to re-fire
 * endlessly — producing 14,000+ failed requests and burning the rate limit.
 *
 * Fix: All three components now use onMount (fires once) and set
 * loaded=true in their finally blocks (even on error).
 *
 * These tests RENDER the actual components with a failing fetch mock and
 * verify that fetch is called exactly ONCE — not in an infinite loop.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';

// Static imports — avoids 9-second dynamic import penalty per test
import CommentList from '$lib/components/comments/CommentList.svelte';
import CostSummary from '$lib/components/costs/CostSummary.svelte';
import GuestList from '$lib/components/guests/GuestList.svelte';

// Mock external deps
vi.mock('$lib/utils/haptics', () => ({ hapticSuccess: vi.fn() }));
vi.mock('$lib/motion', () => ({ scrollReveal: () => ({ destroy: vi.fn() }) }));

describe('CommentList: no infinite fetch loop on error', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Mock fetch to return a 500 error — the trigger for the old loop bug
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ error: 'Server error' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			})
		);
	});

	afterEach(() => {
		cleanup();
		fetchSpy.mockRestore();
	});

	it('calls fetch exactly once even when the request fails (no loop)', async () => {
		render(CommentList, {
			props: { eventId: 'evt-test-001', isRsvpd: true }
		});

		// Wait for onMount → fetch to fire
		await vi.waitFor(() => {
			expect(fetchSpy).toHaveBeenCalled();
		});

		// Give Svelte multiple reactive cycles to detect any re-triggers
		for (let i = 0; i < 5; i++) await tick();
		await new Promise((r) => setTimeout(r, 200));

		// CRITICAL: fetch should have been called exactly ONCE.
		// Before the fix, $effect would re-fire causing an infinite loop.
		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(fetchSpy.mock.calls[0][0]).toContain('/api/events/evt-test-001/comments');
	});

	it('does NOT call fetch when isRsvpd is false', async () => {
		render(CommentList, {
			props: { eventId: 'evt-test-001', isRsvpd: false }
		});

		for (let i = 0; i < 3; i++) await tick();
		await new Promise((r) => setTimeout(r, 100));

		expect(fetchSpy).not.toHaveBeenCalled();
	});
});

describe('CostSummary: no infinite fetch loop on error', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ error: 'Server error' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			})
		);
	});

	afterEach(() => {
		cleanup();
		fetchSpy.mockRestore();
	});

	it('calls fetch exactly once even when the request fails (no loop)', async () => {
		render(CostSummary, {
			props: { eventId: 'evt-test-003', isRsvpd: true }
		});

		await vi.waitFor(() => {
			expect(fetchSpy).toHaveBeenCalled();
		});

		for (let i = 0; i < 5; i++) await tick();
		await new Promise((r) => setTimeout(r, 200));

		expect(fetchSpy).toHaveBeenCalledTimes(1);
		expect(fetchSpy.mock.calls[0][0]).toContain('/api/events/evt-test-003/costs');
	});
});

describe('GuestList: user-triggered only, no auto-fetch', () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
			new Response(JSON.stringify({ data: [] }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			})
		);
	});

	afterEach(() => {
		cleanup();
		fetchSpy.mockRestore();
	});

	it('does NOT auto-fetch on mount (requires button click)', async () => {
		render(GuestList, {
			props: {
				eventId: 'evt-test-004',
				showGuestList: true,
				isHost: false,
				isTicketed: false
			}
		});

		for (let i = 0; i < 3; i++) await tick();
		await new Promise((r) => setTimeout(r, 100));

		expect(fetchSpy).not.toHaveBeenCalled();
	});
});
