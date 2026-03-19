// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue,
	prefersReducedMotion: () => !motionOkValue
}));

describe('sharedElement', () => {
	let node: HTMLElement;

	beforeEach(() => {
		motionOkValue = true;
		node = document.createElement('div');
		document.body.appendChild(node);
	});

	it('returns { destroy }', async () => {
		const { sharedElement } = await import('$lib/motion/actions/shared-element');
		const result = sharedElement(node, { name: 'test-element' });
		expect(typeof result.destroy).toBe('function');
	});

	it('sets view-transition-name on element', async () => {
		const { sharedElement } = await import('$lib/motion/actions/shared-element');
		sharedElement(node, { name: 'event-123' });
		expect(node.style.viewTransitionName).toBe('event-123');
	});

	it('clears view-transition-name on destroy', async () => {
		const { sharedElement } = await import('$lib/motion/actions/shared-element');
		const { destroy } = sharedElement(node, { name: 'event-123' });
		destroy();
		expect(node.style.viewTransitionName).toBe('');
	});

	it('noop when motionOk()=false', async () => {
		motionOkValue = false;
		vi.resetModules();
		const { sharedElement } = await import('$lib/motion/actions/shared-element');
		sharedElement(node, { name: 'event-123' });
		expect(node.style.viewTransitionName).toBe('');
	});

	it('returns { destroy } even when motionOk()=false', async () => {
		motionOkValue = false;
		vi.resetModules();
		const { sharedElement } = await import('$lib/motion/actions/shared-element');
		const result = sharedElement(node, { name: 'event-123' });
		expect(typeof result.destroy).toBe('function');
	});
});
