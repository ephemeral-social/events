// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

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

// IntersectionObserver mock
let observerCallback: IntersectionObserverCallback;
let observerInstance: { observe: Mock; disconnect: Mock; unobserve: Mock };
let observerOptions: IntersectionObserverInit | undefined;

class MockIntersectionObserver {
	constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
		observerCallback = cb;
		observerOptions = options;
		observerInstance = { observe: vi.fn(), disconnect: vi.fn(), unobserve: vi.fn() };
		return observerInstance as unknown as IntersectionObserver;
	}
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

describe('scrollReveal action', () => {
	let node: HTMLDivElement;

	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
		node = document.createElement('div');
		observerOptions = undefined;
		observerInstance = undefined as unknown as typeof observerInstance;
	});

	it('returns { destroy } (valid Svelte action)', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		const result = scrollReveal(node);
		expect(result).toHaveProperty('destroy');
		expect(typeof result.destroy).toBe('function');
	});

	it('sets initial hidden state via animate with duration:0', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		scrollReveal(node);

		expect(mockAnimate).toHaveBeenCalledWith(node, { opacity: 0, y: 20 }, { duration: 0 });
	});

	it('creates IntersectionObserver with threshold 0.15', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		scrollReveal(node);

		expect(observerOptions).toEqual({
			threshold: 0.15,
			rootMargin: '0px 0px -120px 0px'
		});
	});

	it('observes the node', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		scrollReveal(node);

		expect(observerInstance.observe).toHaveBeenCalledWith(node);
	});

	it('triggers animate on intersection', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		scrollReveal(node);

		observerCallback(
			[{ isIntersecting: true, target: node } as IntersectionObserverEntry],
			observerInstance as unknown as IntersectionObserver
		);

		// Second call is the reveal animation (first is the initial set)
		expect(mockAnimate).toHaveBeenCalledWith(
			node,
			expect.objectContaining({ opacity: 1, y: 0 }),
			expect.objectContaining({
				ease: [0, 0, 0.2, 1]
			})
		);
	});

	it('uses custom y value', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		scrollReveal(node, { y: 30 });

		expect(mockAnimate).toHaveBeenCalledWith(node, { opacity: 0, y: 30 }, { duration: 0 });

		observerCallback(
			[{ isIntersecting: true, target: node } as IntersectionObserverEntry],
			observerInstance as unknown as IntersectionObserver
		);

		expect(mockAnimate).toHaveBeenCalledWith(node, expect.objectContaining({ y: 0 }), expect.any(Object));
	});

	it('uses custom delay (ms to seconds conversion)', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		scrollReveal(node, { delay: 200 });

		observerCallback(
			[{ isIntersecting: true, target: node } as IntersectionObserverEntry],
			observerInstance as unknown as IntersectionObserver
		);

		expect(mockAnimate).toHaveBeenCalledWith(node, expect.any(Object), expect.objectContaining({ delay: 0.2 }));
	});

	it('disconnects observer after first trigger (once=true default)', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		scrollReveal(node);

		observerCallback(
			[{ isIntersecting: true, target: node } as IntersectionObserverEntry],
			observerInstance as unknown as IntersectionObserver
		);

		expect(observerInstance.disconnect).toHaveBeenCalled();
	});

	it('does NOT disconnect when once=false', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		scrollReveal(node, { once: false });

		observerCallback(
			[{ isIntersecting: true, target: node } as IntersectionObserverEntry],
			observerInstance as unknown as IntersectionObserver
		);

		expect(observerInstance.disconnect).not.toHaveBeenCalled();
	});

	it('skips everything when motionOk()=false', async () => {
		motionOkValue = false;
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		scrollReveal(node);

		expect(mockAnimate).not.toHaveBeenCalled();
		expect(observerInstance).toBeUndefined();
	});

	it('returns { destroy } even when motionOk()=false', async () => {
		motionOkValue = false;
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		const result = scrollReveal(node);
		expect(result).toHaveProperty('destroy');
		expect(typeof result.destroy).toBe('function');
	});

	it('destroy() disconnects observer + stops animation', async () => {
		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		const { destroy } = scrollReveal(node);

		// Trigger animation so controls exist
		observerCallback(
			[{ isIntersecting: true, target: node } as IntersectionObserverEntry],
			observerInstance as unknown as IntersectionObserver
		);

		destroy();

		expect(observerInstance.disconnect).toHaveBeenCalled();
		expect(mockControls.stop).toHaveBeenCalled();
	});
});
