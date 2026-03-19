// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue,
	prefersReducedMotion: () => !motionOkValue
}));

describe('focusLift action', () => {
	let node: HTMLElement;

	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
		node = document.createElement('input');
		document.body.appendChild(node);
	});

	it('returns { destroy }', async () => {
		const { focusLift } = await import('$lib/motion/actions/focus-lift');
		const result = focusLift(node);
		expect(typeof result.destroy).toBe('function');
	});

	it('sets translateY on focus', async () => {
		const { focusLift } = await import('$lib/motion/actions/focus-lift');
		focusLift(node);
		node.dispatchEvent(new FocusEvent('focus'));
		expect(node.style.transform).toContain('translateY(-1px)');
	});

	it('resets transform on blur', async () => {
		const { focusLift } = await import('$lib/motion/actions/focus-lift');
		focusLift(node);
		node.dispatchEvent(new FocusEvent('focus'));
		node.dispatchEvent(new FocusEvent('blur'));
		expect(node.style.transform).toBe('');
	});

	it('uses custom lift value', async () => {
		const { focusLift } = await import('$lib/motion/actions/focus-lift');
		focusLift(node, { lift: 2 });
		node.dispatchEvent(new FocusEvent('focus'));
		expect(node.style.transform).toContain('translateY(-2px)');
	});

	it('adds transition CSS without trailing comma', async () => {
		const { focusLift } = await import('$lib/motion/actions/focus-lift');
		focusLift(node);
		expect(node.style.transition).toContain('transform 150ms');
		expect(node.style.transition).not.toMatch(/,\s*$/);
	});

	it('noop when motionOk()=false', async () => {
		motionOkValue = false;
		const { focusLift } = await import('$lib/motion/actions/focus-lift');
		focusLift(node);
		node.dispatchEvent(new FocusEvent('focus'));
		expect(node.style.transform).toBe('');
	});

	it('destroy removes listeners', async () => {
		const { focusLift } = await import('$lib/motion/actions/focus-lift');
		const { destroy } = focusLift(node);
		destroy();
		node.dispatchEvent(new FocusEvent('focus'));
		expect(node.style.transform).toBe('');
	});
});
