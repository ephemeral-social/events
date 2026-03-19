// @vitest-environment jsdom
/**
 * BEHAVIORAL tests for PullToRefresh safety timeout.
 *
 * Bug: PullToRefresh had no timeout. If invalidateAll() hung (backend
 * unreachable), the spinner spun forever.
 *
 * Fix: 8-second safety timeout force-completes. doComplete() guards
 * against double-execution via phase check.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';

// Mock invalidateAll BEFORE importing the wrapper
const mockInvalidateAll = vi.fn<() => Promise<void>>();
vi.mock('$app/navigation', () => ({
	invalidateAll: () => mockInvalidateAll()
}));

// Static import
import Wrapper from '../helpers/PullToRefreshWrapper.svelte';

/**
 * Helper: simulate a complete pull-to-refresh touch gesture.
 */
function simulatePullGesture(scrollRoot: Element): void {
	scrollRoot.dispatchEvent(
		new TouchEvent('touchstart', {
			touches: [{ clientX: 100, clientY: 0 } as Touch]
		})
	);
	scrollRoot.dispatchEvent(
		new TouchEvent('touchmove', {
			cancelable: true,
			touches: [{ clientX: 100, clientY: 200 } as Touch]
		})
	);
	scrollRoot.dispatchEvent(new TouchEvent('touchend'));
}

describe('PullToRefresh safety timeout', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	it('renders #scroll-root container with child content', () => {
		const { container } = render(Wrapper);

		const scrollRoot = container.querySelector('#scroll-root');
		expect(scrollRoot).toBeTruthy();

		const content = container.querySelector('[data-testid="content"]');
		expect(content).toBeTruthy();
		expect(content!.textContent).toBe('Content');
	});

	it('calls invalidateAll after settle animation (280ms)', async () => {
		mockInvalidateAll.mockReturnValue(new Promise(() => {}));
		const { container } = render(Wrapper);
		const scrollRoot = container.querySelector('#scroll-root')!;

		simulatePullGesture(scrollRoot);

		// Not called during settle
		expect(mockInvalidateAll).not.toHaveBeenCalled();

		// After settle animation (280ms) → loading phase begins
		vi.advanceTimersByTime(280);
		await tick();

		expect(mockInvalidateAll).toHaveBeenCalledTimes(1);
	});

	it('force-completes after 8 seconds when invalidateAll hangs forever', async () => {
		// invalidateAll never resolves — simulates unreachable backend
		mockInvalidateAll.mockReturnValue(new Promise(() => {}));

		const { container } = render(Wrapper);
		const scrollRoot = container.querySelector('#scroll-root')!;

		simulatePullGesture(scrollRoot);

		// Settle → loading
		vi.advanceTimersByTime(280);
		await tick();
		expect(mockInvalidateAll).toHaveBeenCalledTimes(1);

		// Loading indicator should be visible
		expect(container.querySelector('.ptr-indicator')).toBeTruthy();

		// Advance past 8-second safety timeout
		vi.advanceTimersByTime(8000);
		await tick();

		// doComplete fires: done (600ms hold) → leaving (350ms) → idle
		vi.advanceTimersByTime(600 + 350);
		await tick();

		// Indicator gone — refresh completed via safety timeout
		expect(container.querySelector('.ptr-indicator')).toBeNull();
	});

	it('completes normally when invalidateAll resolves', async () => {
		mockInvalidateAll.mockResolvedValue(undefined);

		const { container } = render(Wrapper);
		const scrollRoot = container.querySelector('#scroll-root')!;

		simulatePullGesture(scrollRoot);

		vi.advanceTimersByTime(280);
		await tick();

		// Flush resolved promise
		await vi.advanceTimersByTimeAsync(0);
		await tick();

		// done → leaving → idle
		vi.advanceTimersByTime(600 + 350);
		await tick();

		expect(container.querySelector('.ptr-indicator')).toBeNull();
	});

	it('completes on invalidateAll rejection (error path)', async () => {
		mockInvalidateAll.mockRejectedValue(new Error('Backend unreachable'));

		const { container } = render(Wrapper);
		const scrollRoot = container.querySelector('#scroll-root')!;

		simulatePullGesture(scrollRoot);

		vi.advanceTimersByTime(280);
		await tick();

		// Flush rejected promise
		await vi.advanceTimersByTimeAsync(0);
		await tick();

		vi.advanceTimersByTime(600 + 350);
		await tick();

		expect(container.querySelector('.ptr-indicator')).toBeNull();
	});

	it('invalidateAll called only once per pull gesture', async () => {
		mockInvalidateAll.mockResolvedValue(undefined);

		const { container } = render(Wrapper);
		const scrollRoot = container.querySelector('#scroll-root')!;

		simulatePullGesture(scrollRoot);

		vi.advanceTimersByTime(280);
		await tick();
		await vi.advanceTimersByTimeAsync(0);
		await tick();

		vi.advanceTimersByTime(600 + 350);
		await tick();

		expect(mockInvalidateAll).toHaveBeenCalledTimes(1);
	});
});
