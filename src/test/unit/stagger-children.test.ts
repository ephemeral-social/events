// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockControls = {
	stop: vi.fn(),
	finished: Promise.resolve()
};
const mockAnimate = vi.fn().mockReturnValue(mockControls);
const mockStagger = vi.fn().mockReturnValue(0.05);

vi.mock('motion', () => ({
	animate: mockAnimate,
	stagger: mockStagger
}));

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue
}));

describe('staggerChildren action', () => {
	let node: HTMLDivElement;

	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
		node = document.createElement('div');
		node.appendChild(document.createElement('div'));
		node.appendChild(document.createElement('div'));
		node.appendChild(document.createElement('div'));
	});

	it('returns { destroy }', async () => {
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		const result = staggerChildren(node);
		expect(result).toHaveProperty('destroy');
		expect(typeof result.destroy).toBe('function');
	});

	it('calls animate on direct children by default', async () => {
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		staggerChildren(node);

		expect(mockAnimate).toHaveBeenCalledWith(node.children, expect.any(Object), expect.any(Object));
	});

	it('uses lifecycle.birth.from defaults with keyframe arrays', async () => {
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		staggerChildren(node);

		expect(mockAnimate).toHaveBeenCalledWith(
			node.children,
			expect.objectContaining({
				opacity: [0, 1],
				y: [12, 0],
				scale: [0.96, 1]
			}),
			expect.any(Object)
		);
	});

	it('uses stagger(0.05) by default', async () => {
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		staggerChildren(node);

		expect(mockStagger).toHaveBeenCalledWith(0.05);
	});

	it('uses custom stagger value (in seconds)', async () => {
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		staggerChildren(node, { stagger: 0.08 });

		expect(mockStagger).toHaveBeenCalledWith(0.08);
	});

	it('uses custom selector to target querySelectorAll', async () => {
		node.innerHTML = '<div class="item"></div><div class="item"></div><span>not-item</span>';
		const items = node.querySelectorAll('.item');

		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		staggerChildren(node, { selector: '.item' });

		expect(mockAnimate).toHaveBeenCalledWith(items, expect.any(Object), expect.any(Object));
	});

	it('uses custom y value', async () => {
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		staggerChildren(node, { y: 20 });

		expect(mockAnimate).toHaveBeenCalledWith(
			node.children,
			expect.objectContaining({ y: [20, 0] }),
			expect.any(Object)
		);
	});

	it('uses custom from direction (center)', async () => {
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		staggerChildren(node, { from: 'center' });

		expect(mockStagger).toHaveBeenCalledWith(0.05, { from: 'center' });
	});

	it('uses custom from direction (end → last)', async () => {
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		staggerChildren(node, { from: 'end' });

		expect(mockStagger).toHaveBeenCalledWith(0.05, { from: 'last' });
	});

	it('reduced motion: fades all children at once', async () => {
		motionOkValue = false;
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		staggerChildren(node);

		expect(mockAnimate).toHaveBeenCalledWith(node.children, { opacity: [0, 1] }, { duration: 0.15 });
	});

	it('returns { destroy } even when motionOk()=false', async () => {
		motionOkValue = false;
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		const result = staggerChildren(node);
		expect(result).toHaveProperty('destroy');
		expect(typeof result.destroy).toBe('function');
	});

	it('destroy() stops animation', async () => {
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		const { destroy } = staggerChildren(node);
		destroy();

		expect(mockControls.stop).toHaveBeenCalled();
	});
});
