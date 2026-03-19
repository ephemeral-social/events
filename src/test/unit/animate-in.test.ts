// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockControls = {
	stop: vi.fn(),
	finished: Promise.resolve()
};
const mockAnimate = vi.fn().mockReturnValue(mockControls);

vi.mock('motion', () => ({
	animate: mockAnimate
}));

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue
}));

describe('animate-in action', () => {
	let node: HTMLDivElement;

	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
		node = document.createElement('div');
	});

	it('returns { destroy } (valid Svelte action)', async () => {
		const { animateIn } = await import('$lib/motion/actions/animate-in');
		const result = animateIn(node);
		expect(result).toHaveProperty('destroy');
		expect(typeof result.destroy).toBe('function');
	});

	it('calls animate with lifecycle.birth defaults (keyframe arrays)', async () => {
		const { animateIn } = await import('$lib/motion/actions/animate-in');
		animateIn(node);

		expect(mockAnimate).toHaveBeenCalledWith(node, {
			opacity: [0, 1],
			y: [12, 0],
			scale: [0.96, 1]
		}, {
			duration: 0.8,
			delay: 0,
			ease: [0, 0, 0.2, 1]
		});
	});

	it('converts duration from ms to seconds', async () => {
		const { animateIn } = await import('$lib/motion/actions/animate-in');
		animateIn(node, { duration: 500 });

		expect(mockAnimate).toHaveBeenCalledWith(
			node,
			expect.any(Object),
			expect.objectContaining({ duration: 0.5 })
		);
	});

	it('converts delay from ms to seconds', async () => {
		const { animateIn } = await import('$lib/motion/actions/animate-in');
		animateIn(node, { delay: 200 });

		expect(mockAnimate).toHaveBeenCalledWith(
			node,
			expect.any(Object),
			expect.objectContaining({ delay: 0.2 })
		);
	});

	it('merges custom from-props over defaults', async () => {
		const { animateIn } = await import('$lib/motion/actions/animate-in');
		animateIn(node, { from: { y: 20 } });

		expect(mockAnimate).toHaveBeenCalledWith(
			node,
			expect.objectContaining({
				opacity: [0, 1],
				y: [20, 0],
				scale: [0.96, 1]
			}),
			expect.any(Object)
		);
	});

	it('skips animation when motionOk()=false', async () => {
		motionOkValue = false;
		const { animateIn } = await import('$lib/motion/actions/animate-in');
		animateIn(node);

		expect(mockAnimate).not.toHaveBeenCalled();
	});

	it('destroy() stops animation', async () => {
		const { animateIn } = await import('$lib/motion/actions/animate-in');
		const { destroy } = animateIn(node);
		destroy();

		expect(mockControls.stop).toHaveBeenCalled();
	});
});
