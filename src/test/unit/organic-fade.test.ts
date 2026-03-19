// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	prefersReducedMotion: () => !motionOkValue
}));

describe('organicFade transition', () => {
	let node: HTMLDivElement;

	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
		node = document.createElement('div');
	});

	it('returns object with delay, duration, css', async () => {
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const result = organicFade(node);
		expect(result).toHaveProperty('delay');
		expect(result).toHaveProperty('duration');
		expect(result).toHaveProperty('css');
	});

	it('default duration is 500ms when motion OK', async () => {
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const result = organicFade(node);
		expect(result.duration).toBe(500);
	});

	it('accepts custom duration', async () => {
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const result = organicFade(node, { duration: 300 });
		expect(result.duration).toBe(300);
	});

	it('accepts custom delay', async () => {
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const result = organicFade(node, { delay: 100 });
		expect(result.delay).toBe(100);
	});

	it('css(0) returns fully hidden state', async () => {
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const result = organicFade(node);
		const css = result.css(0);
		expect(css).toContain('opacity: 0');
		expect(css).toContain('scale(0.96)');
		expect(css).toContain('translateY(12px)');
	});

	it('css(1) returns fully visible state', async () => {
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const result = organicFade(node);
		const css = result.css(1);
		expect(css).toContain('opacity: 1');
		expect(css).toContain('scale(1)');
		expect(css).toContain('translateY(0px)');
	});

	it('css(0.5) returns intermediate state', async () => {
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const result = organicFade(node);
		const css = result.css(0.5);
		// Should have intermediate opacity (cubicOut easing applied)
		expect(css).toContain('opacity:');
		expect(css).toContain('scale(');
		expect(css).toContain('translateY(');
		// Verify intermediate values are between extremes
		const opacityMatch = css.match(/opacity:\s*([\d.]+)/);
		expect(opacityMatch).toBeTruthy();
		const opacity = parseFloat(opacityMatch![1]);
		expect(opacity).toBeGreaterThan(0);
		expect(opacity).toBeLessThan(1);
	});

	it('reduced motion: duration is 150ms', async () => {
		motionOkValue = false;
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const result = organicFade(node);
		expect(result.duration).toBe(150);
	});

	it('reduced motion: css() only returns opacity (no transform)', async () => {
		motionOkValue = false;
		const { organicFade } = await import('$lib/motion/transitions/organic-fade');
		const result = organicFade(node);
		const css = result.css(0.5);
		expect(css).toContain('opacity:');
		expect(css).not.toContain('scale');
		expect(css).not.toContain('translateY');
	});
});
