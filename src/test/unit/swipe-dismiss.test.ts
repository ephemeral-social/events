// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue,
	prefersReducedMotion: () => !motionOkValue
}));

function simulatePointerDown(node: HTMLElement, x: number, y: number, pointerId = 1) {
	node.dispatchEvent(
		new PointerEvent('pointerdown', { clientX: x, clientY: y, pointerId, bubbles: true })
	);
}

function simulatePointerMove(node: HTMLElement, x: number, y: number) {
	node.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
}

function simulatePointerUp(node: HTMLElement) {
	node.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
}

describe('swipeDismiss action', () => {
	let node: HTMLElement;
	let onDismiss: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		vi.useFakeTimers();
		motionOkValue = true;
		node = document.createElement('div');
		node.setPointerCapture = vi.fn();
		document.body.appendChild(node);
		onDismiss = vi.fn();
	});

	afterEach(() => {
		vi.useRealTimers();
		document.body.removeChild(node);
	});

	it('returns { destroy }', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss });
		expect(result).toHaveProperty('destroy');
		expect(typeof result.destroy).toBe('function');
		result.destroy();
	});

	it('does NOT respond to pointer events before activation delay', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss });

		// Before timer fires, pointerdown should not start dragging
		simulatePointerDown(node, 100, 100);
		simulatePointerMove(node, 200, 100);
		expect(node.style.transform).toBe('');

		result.destroy();
	});

	it('responds to pointer events after activation delay', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss });

		vi.advanceTimersByTime(300);

		simulatePointerDown(node, 100, 100);
		simulatePointerMove(node, 150, 100);
		expect(node.style.transform).toBe('translateX(50px)');

		result.destroy();
	});

	it('tracks pointer movement (horizontal)', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss });

		vi.advanceTimersByTime(300);

		simulatePointerDown(node, 100, 100);
		simulatePointerMove(node, 160, 100);
		expect(node.style.transform).toBe('translateX(60px)');

		simulatePointerMove(node, 40, 100);
		expect(node.style.transform).toBe('translateX(-60px)');

		result.destroy();
	});

	it('updates opacity during drag (clamped to 0 minimum)', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss, threshold: 80 });

		vi.advanceTimersByTime(300);

		simulatePointerDown(node, 100, 100);

		// Move 40px -> opacity = 1 - 40/160 = 0.75
		simulatePointerMove(node, 140, 100);
		expect(parseFloat(node.style.opacity)).toBeCloseTo(0.75);

		// Move far enough to clamp to 0
		simulatePointerMove(node, 300, 100);
		expect(parseFloat(node.style.opacity)).toBe(0);

		result.destroy();
	});

	it('calls onDismiss when swiped past threshold', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss, threshold: 80 });

		vi.advanceTimersByTime(300);

		simulatePointerDown(node, 100, 100);
		simulatePointerMove(node, 200, 100); // 100px > 80 threshold
		simulatePointerUp(node);

		// onDismiss fires after 200ms exit animation
		expect(onDismiss).not.toHaveBeenCalled();
		vi.advanceTimersByTime(200);
		expect(onDismiss).toHaveBeenCalledTimes(1);

		result.destroy();
	});

	it('snaps back when below threshold', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss, threshold: 80 });

		vi.advanceTimersByTime(300);

		simulatePointerDown(node, 100, 100);
		simulatePointerMove(node, 150, 100); // 50px < 80 threshold
		simulatePointerUp(node);

		expect(node.style.transform).toBe('');
		expect(node.style.opacity).toBe('1');
		expect(onDismiss).not.toHaveBeenCalled();

		result.destroy();
	});

	it('uses spring ease on snap back', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss, threshold: 80 });

		vi.advanceTimersByTime(300);

		simulatePointerDown(node, 100, 100);
		simulatePointerMove(node, 150, 100);
		simulatePointerUp(node);

		expect(node.style.transition).toContain('cubic-bezier(0.34, 1.56, 0.64, 1)');

		result.destroy();
	});

	it('handles vertical direction', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss, direction: 'vertical' });

		vi.advanceTimersByTime(300);

		simulatePointerDown(node, 100, 100);
		simulatePointerMove(node, 100, 160);
		expect(node.style.transform).toBe('translateY(60px)');

		result.destroy();
	});

	it('noop when motionOk()=false', async () => {
		motionOkValue = false;
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss });

		vi.advanceTimersByTime(300);

		simulatePointerDown(node, 100, 100);
		simulatePointerMove(node, 200, 100);
		expect(node.style.transform).toBe('');
		expect(onDismiss).not.toHaveBeenCalled();

		result.destroy();
	});

	it('destroy removes all listeners and clears timer', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss });

		result.destroy();

		vi.advanceTimersByTime(300);

		// After destroy, pointer events should have no effect
		simulatePointerDown(node, 100, 100);
		simulatePointerMove(node, 200, 100);
		expect(node.style.transform).toBe('');
		expect(node.style.opacity).toBe('');
	});

	it('sets pointer capture on pointerdown', async () => {
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const result = swipeDismiss(node, { onDismiss });

		vi.advanceTimersByTime(300);

		simulatePointerDown(node, 100, 100, 42);
		expect(node.setPointerCapture).toHaveBeenCalledWith(42);

		result.destroy();
	});
});
