// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue
}));

describe('press-feedback action', () => {
	let node: HTMLDivElement;

	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
		node = document.createElement('div');
	});

	it('returns { destroy }', async () => {
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		const result = pressFeedback(node);
		expect(result).toHaveProperty('destroy');
		expect(typeof result.destroy).toBe('function');
	});

	it('sets transition style on node', async () => {
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		pressFeedback(node);
		expect(node.style.transition).toContain('transform');
	});

	it('pointerdown applies scale(0.97) transform', async () => {
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		pressFeedback(node);
		node.dispatchEvent(new PointerEvent('pointerdown'));
		expect(node.style.transform).toBe('scale(0.97)');
	});

	it('pointerup resets transform', async () => {
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		pressFeedback(node);
		node.dispatchEvent(new PointerEvent('pointerdown'));
		node.dispatchEvent(new PointerEvent('pointerup'));
		expect(node.style.transform).toBe('');
	});

	it('pointerleave resets transform', async () => {
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		pressFeedback(node);
		node.dispatchEvent(new PointerEvent('pointerdown'));
		node.dispatchEvent(new PointerEvent('pointerleave'));
		expect(node.style.transform).toBe('');
	});

	it('custom scale param', async () => {
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		pressFeedback(node, { scale: 0.93 });
		node.dispatchEvent(new PointerEvent('pointerdown'));
		expect(node.style.transform).toBe('scale(0.93)');
	});

	it('custom duration param', async () => {
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		pressFeedback(node, { duration: 200 });
		expect(node.style.transition).toContain('200ms');
	});

	it('skips transform when motionOk()=false', async () => {
		motionOkValue = false;
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		pressFeedback(node);
		node.dispatchEvent(new PointerEvent('pointerdown'));
		expect(node.style.transform).toBe('');
	});

	it('destroy() removes all listeners', async () => {
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		const spy = vi.spyOn(node, 'removeEventListener');
		const { destroy } = pressFeedback(node);
		destroy();
		expect(spy).toHaveBeenCalledTimes(3);
		expect(spy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
		expect(spy).toHaveBeenCalledWith('pointerup', expect.any(Function));
		expect(spy).toHaveBeenCalledWith('pointerleave', expect.any(Function));
	});
});
