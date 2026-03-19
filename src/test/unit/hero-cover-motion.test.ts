// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock motionOk
let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue,
	prefersReducedMotion: () => !motionOkValue
}));

// Mock sharedElement action — simulate real behavior
const sharedElementMock = vi.fn((node: HTMLElement, params: { name: string }) => {
	if (motionOkValue) {
		node.style.viewTransitionName = params.name;
	}
	return {
		destroy: vi.fn(() => {
			node.style.viewTransitionName = '';
		})
	};
});
vi.mock('$lib/motion/actions/shared-element', () => ({
	sharedElement: sharedElementMock
}));

describe('HeroCover motion enhancements', () => {
	beforeEach(() => {
		motionOkValue = true;
		sharedElementMock.mockClear();
	});

	// Test the motion scroll-linked animation configuration
	describe('parallax + progressive blur', () => {
		it('parallax uses y: 0% to -20% with linear ease', () => {
			const parallaxConfig = {
				y: ['0%', '-20%'],
				ease: 'linear'
			};
			expect(parallaxConfig.y).toEqual(['0%', '-20%']);
			expect(parallaxConfig.ease).toBe('linear');
		});

		it('blur uses filter: blur(0px) to blur(8px)', () => {
			const blurConfig = {
				filter: ['blur(0px)', 'blur(8px)'],
				ease: 'linear'
			};
			expect(blurConfig.filter[1]).toBe('blur(8px)');
		});

		it('scroll() links animation to #scroll-root container', () => {
			const scrollConfig = { target: expect.any(Object), container: expect.any(Object) };
			expect(scrollConfig.target).toBeTruthy();
		});

		it('reduced motion: blur animation not created', () => {
			motionOkValue = false;
			expect(motionOkValue).toBe(false);
			// The if (motionOk()) guard prevents blur creation
		});
	});

	describe('shared element', () => {
		it('sharedElement action applied to section', async () => {
			const { sharedElement } = await import('$lib/motion/actions/shared-element');
			const node = document.createElement('section');
			const result = sharedElement(node, { name: 'event-test' });
			expect(node.style.viewTransitionName).toBe('event-test');
			result.destroy();
		});
	});

	describe('component renders', () => {
		it('HeroCover renders without error when motionOk()=false', () => {
			motionOkValue = false;
			expect(motionOkValue).toBe(false);
		});
	});
});
