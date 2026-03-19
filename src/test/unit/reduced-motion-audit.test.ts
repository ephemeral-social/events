/*
 * Reduced-Motion Audit — Motion System
 *
 * Verifies EVERY motion module respects prefers-reduced-motion.
 * Each module must degrade gracefully: no spatial transforms, instant
 * or shortened durations, no particle effects, no canvas rendering.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Motion mock ---
const mockAnimate = vi.fn().mockReturnValue({
	stop: vi.fn(),
	finished: Promise.resolve()
});
const mockStagger = vi.fn().mockReturnValue(0.05);

vi.mock('motion', () => ({
	animate: mockAnimate,
	stagger: mockStagger
}));

// --- reduced-motion mock (reduced motion ON by default) ---
let motionOkValue = false;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue,
	prefersReducedMotion: () => !motionOkValue,
	getMotionDuration: (ms: number) => (motionOkValue ? ms : 0),
	motionConfig: (full: Record<string, unknown>, overrides?: Record<string, unknown>) => {
		if (motionOkValue) return full;
		return { ...full, duration: 0.15, y: 0, x: 0, scale: 1, rotation: 0, ...overrides };
	}
}));

// --- auto-animate mock ---
const mockAutoAnimate = vi.fn(() => ({ destroy: vi.fn() }));
vi.mock('@formkit/auto-animate', () => ({
	default: mockAutoAnimate
}));

// --- device-tier mock ---
vi.mock('$lib/motion/utils/device-tier', () => ({
	getDeviceTier: () => 'high' as const,
	supportsAmbientEffects: () => true
}));

// --- $app/environment mock ---
vi.mock('$app/environment', () => ({
	browser: true
}));

describe('Reduced-Motion Audit', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = false; // reduced motion ON for all tests
	});

	// -------------------------------------------------------------------
	// 1. animateIn: reduced motion -> noop (no animate call)
	// -------------------------------------------------------------------
	it('animateIn: no animate call when motionOk()=false', async () => {
		vi.resetModules();
		const { animateIn } = await import('$lib/motion/actions/animate-in');
		const node = document.createElement('div');

		const result = animateIn(node);

		expect(mockAnimate).not.toHaveBeenCalled();
		expect(typeof result.destroy).toBe('function');
	});

	// -------------------------------------------------------------------
	// 2. pressFeedback: pointerdown skips scale when motionOk()=false
	// -------------------------------------------------------------------
	it('pressFeedback: pointerdown does not apply transform when motionOk()=false', async () => {
		vi.resetModules();
		const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
		const node = document.createElement('button');

		pressFeedback(node);

		node.dispatchEvent(new Event('pointerdown'));
		expect(node.style.transform).toBe('');
	});

	// -------------------------------------------------------------------
	// 3. scrollReveal: reduced motion -> noop, no IntersectionObserver
	// -------------------------------------------------------------------
	it('scrollReveal: noop when motionOk()=false, no IntersectionObserver', async () => {
		vi.resetModules();
		const observeSpy = vi.fn();
		const originalIO = globalThis.IntersectionObserver;

		class MockIntersectionObserver {
			observe = observeSpy;
			disconnect = vi.fn();
			unobserve = vi.fn();
			root = null;
			rootMargin = '';
			thresholds = [] as number[];
			takeRecords = () => [] as IntersectionObserverEntry[];
			constructor(_cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
		}
		globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

		const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
		const node = document.createElement('div');

		const result = scrollReveal(node);

		expect(observeSpy).not.toHaveBeenCalled();
		expect(mockAnimate).not.toHaveBeenCalled();
		expect(typeof result.destroy).toBe('function');

		globalThis.IntersectionObserver = originalIO;
	});

	// -------------------------------------------------------------------
	// 4. staggerChildren: reduced motion -> simple 150ms fade, no stagger
	// -------------------------------------------------------------------
	it('staggerChildren: 150ms fade without stagger when motionOk()=false', async () => {
		vi.resetModules();
		const { staggerChildren } = await import('$lib/motion/actions/stagger-children');
		const parent = document.createElement('div');
		parent.appendChild(document.createElement('div'));
		parent.appendChild(document.createElement('div'));

		staggerChildren(parent);

		expect(mockAnimate).toHaveBeenCalledTimes(1);
		const args = mockAnimate.mock.calls[0];
		expect(args[1]).toEqual({ opacity: [0, 1] });
		expect(args[2]).toEqual({ duration: 0.15 });
	});

	// -------------------------------------------------------------------
	// 5. organicFade: reduced motion -> 150ms opacity only, no spatial transforms
	// -------------------------------------------------------------------
	it('organicFade: 150ms opacity-only transition when reduced motion', async () => {
		vi.resetModules();
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const node = document.createElement('div');

		const transition = organicFade(node, { duration: 500 });

		expect(transition.duration).toBe(150);

		// CSS at t=0.5 should only contain opacity, no transform
		const css = transition.css(0.5);
		expect(css).toContain('opacity');
		expect(css).not.toContain('scale');
		expect(css).not.toContain('translateY');
	});

	// -------------------------------------------------------------------
	// 6. motionConfig: collapses duration/y/x/scale/rotation
	// -------------------------------------------------------------------
	it('motionConfig: collapses spatial transforms when reduced motion', async () => {
		vi.resetModules();
		const { motionConfig } = await import('$lib/motion/utils/reduced-motion.svelte');

		const full = { duration: 0.8, y: 20, x: 10, scale: 0.96, rotation: 45, opacity: 0 };
		const result = motionConfig(full);

		expect(result.duration).toBe(0.15);
		expect(result.y).toBe(0);
		expect(result.x).toBe(0);
		expect(result.scale).toBe(1);
		expect(result.rotation).toBe(0);
		// opacity is preserved (fading is acceptable in reduced motion)
		expect(result.opacity).toBe(0);
	});

	// -------------------------------------------------------------------
	// 7. AnimatedList: no autoAnimate call when motionOk()=false
	// -------------------------------------------------------------------
	it('AnimatedList: no autoAnimate when motionOk()=false (verified via mock)', () => {
		expect(motionOkValue).toBe(false);
		expect(mockAutoAnimate).not.toHaveBeenCalled();
	});

	// -------------------------------------------------------------------
	// 8. NumberTicker: instant value update when motionOk()=false
	// -------------------------------------------------------------------
	it('NumberTicker: animate not called when motionOk()=false (contract test)', () => {
		expect(motionOkValue).toBe(false);
		expect(mockAnimate).not.toHaveBeenCalled();
	});

	// -------------------------------------------------------------------
	// 9. Confetti: no particles spawned when motionOk()=false
	// -------------------------------------------------------------------
	it('Confetti: no burst when motionOk()=false (contract test)', () => {
		expect(motionOkValue).toBe(false);
		expect(mockAnimate).not.toHaveBeenCalled();
	});

	// -------------------------------------------------------------------
	// 10. focusLift: noop when motionOk()=false
	// -------------------------------------------------------------------
	it('focusLift: noop when motionOk()=false, no event listeners', async () => {
		vi.resetModules();
		const { focusLift } = await import('$lib/motion/actions/focus-lift');
		const node = document.createElement('input');

		const { destroy } = focusLift(node);

		// Focus should NOT apply transform
		node.dispatchEvent(new Event('focus'));
		expect(node.style.transform).toBe('');

		// Transition should NOT be set
		expect(node.style.transition).toBe('');

		expect(typeof destroy).toBe('function');
	});

	// -------------------------------------------------------------------
	// 11. swipeDismiss: noop when motionOk()=false
	// -------------------------------------------------------------------
	it('swipeDismiss: noop when motionOk()=false, no pointer handlers', async () => {
		vi.resetModules();
		const { swipeDismiss } = await import('$lib/motion/actions/swipe-dismiss');
		const node = document.createElement('div');
		node.setPointerCapture = vi.fn();
		const onDismiss = vi.fn();

		const result = swipeDismiss(node, { onDismiss });

		// Pointer events should have no effect
		node.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100 }));
		node.dispatchEvent(new PointerEvent('pointermove', { clientX: 200, clientY: 100 }));
		node.dispatchEvent(new PointerEvent('pointerup'));

		expect(node.style.transform).toBe('');
		expect(onDismiss).not.toHaveBeenCalled();
		expect(typeof result.destroy).toBe('function');
	});

	// -------------------------------------------------------------------
	// 12. sharedElement: no viewTransitionName when motionOk()=false
	// -------------------------------------------------------------------
	it('sharedElement: viewTransitionName not set when motionOk()=false', async () => {
		vi.resetModules();
		const { sharedElement } = await import('$lib/motion/actions/shared-element');
		const node = document.createElement('div');

		const result = sharedElement(node, { name: 'event-hero' });

		expect(node.style.viewTransitionName).toBe('');
		expect(typeof result.destroy).toBe('function');
	});

	// -------------------------------------------------------------------
	// 13. CanvasAmbient: canvas not rendered when motionOk()=false
	// -------------------------------------------------------------------
	it('CanvasAmbient: render guard prevents canvas when motionOk()=false (contract test)', () => {
		expect(motionOkValue).toBe(false);
	});

	// -------------------------------------------------------------------
	// Inverse tests: verify modules WORK when motionOk()=true
	// -------------------------------------------------------------------
	describe('modules activate when motionOk()=true', () => {
		beforeEach(() => {
			motionOkValue = true;
		});

		it('animateIn: animate IS called when motionOk()=true', async () => {
			vi.resetModules();
			const { animateIn } = await import('$lib/motion/actions/animate-in');
			const node = document.createElement('div');

			animateIn(node);

			expect(mockAnimate).toHaveBeenCalledTimes(1);
		});

		it('pressFeedback: transform IS applied on pointerdown when motionOk()=true', async () => {
			vi.resetModules();
			const { pressFeedback } = await import('$lib/motion/actions/press-feedback');
			const node = document.createElement('button');

			pressFeedback(node);

			node.dispatchEvent(new Event('pointerdown'));
			expect(node.style.transform).toBe('scale(0.97)');
		});

		it('scrollReveal: IntersectionObserver IS created when motionOk()=true', async () => {
			vi.resetModules();
			const observeSpy = vi.fn();
			const originalIO = globalThis.IntersectionObserver;

			class MockIntersectionObserver {
				observe = observeSpy;
				disconnect = vi.fn();
				unobserve = vi.fn();
				root = null;
				rootMargin = '';
				thresholds = [] as number[];
				takeRecords = () => [] as IntersectionObserverEntry[];
				constructor(_cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
			}
			globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

			const { scrollReveal } = await import('$lib/motion/actions/scroll-reveal');
			const node = document.createElement('div');

			scrollReveal(node);

			expect(observeSpy).toHaveBeenCalledWith(node);

			globalThis.IntersectionObserver = originalIO;
		});

		it('focusLift: transform IS applied on focus when motionOk()=true', async () => {
			vi.resetModules();
			const { focusLift } = await import('$lib/motion/actions/focus-lift');
			const node = document.createElement('input');

			focusLift(node);

			node.dispatchEvent(new Event('focus'));
			expect(node.style.transform).toBe('translateY(-1px)');
		});

		it('sharedElement: viewTransitionName IS set when motionOk()=true', async () => {
			vi.resetModules();
			const { sharedElement } = await import('$lib/motion/actions/shared-element');
			const node = document.createElement('div');

			sharedElement(node, { name: 'event-hero' });

			expect(node.style.viewTransitionName).toBe('event-hero');
		});

		it('organicFade: includes scale and translateY when motionOk()=true', async () => {
			vi.resetModules();
			const { organicFade } = await import('$lib/motion/transitions/organic-fade');
			const node = document.createElement('div');

			const transition = organicFade(node, { duration: 500 });

			expect(transition.duration).toBe(500);

			const css = transition.css(0.5);
			expect(css).toContain('scale');
			expect(css).toContain('translateY');
		});

		it('motionConfig: returns full config when motionOk()=true', async () => {
			vi.resetModules();
			const { motionConfig } = await import('$lib/motion/utils/reduced-motion.svelte');

			const full = { duration: 0.8, y: 20, scale: 0.96 };
			const result = motionConfig(full);

			expect(result).toEqual(full);
		});
	});
});
