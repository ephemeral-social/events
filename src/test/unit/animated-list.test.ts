// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';

const { mockAutoAnimate, mockDestroy } = vi.hoisted(() => {
	const mockDestroy = vi.fn();
	const mockAutoAnimate = vi.fn(() => ({
		enable: vi.fn(),
		disable: vi.fn(),
		isEnabled: vi.fn(),
		destroy: mockDestroy
	}));
	return { mockAutoAnimate, mockDestroy };
});

vi.mock('@formkit/auto-animate', () => ({
	default: mockAutoAnimate
}));

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue
}));

import AnimatedList from '$lib/motion/components/AnimatedList.svelte';

describe('AnimatedList component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
	});

	it('renders a container div', () => {
		const { container } = render(AnimatedList);
		expect(container.querySelector('div')).toBeTruthy();
	});

	it('calls autoAnimate on the container element', async () => {
		render(AnimatedList);
		await vi.waitFor(() => {
			expect(mockAutoAnimate).toHaveBeenCalledWith(
				expect.any(HTMLElement),
				expect.any(Object)
			);
		});
	});

	it('passes duration option', async () => {
		render(AnimatedList, { props: { duration: 400 } });
		await vi.waitFor(() => {
			expect(mockAutoAnimate).toHaveBeenCalledWith(
				expect.any(HTMLElement),
				expect.objectContaining({ duration: 400 })
			);
		});
	});

	it('passes easing option', async () => {
		render(AnimatedList, { props: { easing: 'ease-out' } });
		await vi.waitFor(() => {
			expect(mockAutoAnimate).toHaveBeenCalledWith(
				expect.any(HTMLElement),
				expect.objectContaining({ easing: 'ease-out' })
			);
		});
	});

	it('does NOT call autoAnimate when motionOk()=false', async () => {
		motionOkValue = false;
		render(AnimatedList);
		await new Promise((r) => setTimeout(r, 50));
		expect(mockAutoAnimate).not.toHaveBeenCalled();
	});

	it('cleans up on destroy (calls controller.destroy())', async () => {
		const { unmount } = render(AnimatedList);
		await vi.waitFor(() => {
			expect(mockAutoAnimate).toHaveBeenCalled();
		});
		unmount();
		expect(mockDestroy).toHaveBeenCalled();
	});
});
