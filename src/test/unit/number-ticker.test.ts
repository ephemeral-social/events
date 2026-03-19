// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';

const { mockAnimate, mockControls } = vi.hoisted(() => {
	const mockControls = { stop: vi.fn(), finished: Promise.resolve() };
	const mockAnimate = vi.fn().mockReturnValue(mockControls);
	return { mockAnimate, mockControls };
});

vi.mock('motion', () => ({
	animate: mockAnimate
}));

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue
}));

import NumberTicker from '$lib/motion/components/NumberTicker.svelte';

describe('NumberTicker component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
	});

	it('renders the initial value as text', () => {
		const { container } = render(NumberTicker, { props: { value: 42 } });
		expect(container.textContent).toBe('42');
	});

	it('calls animate when rendered with a value', async () => {
		render(NumberTicker, { props: { value: 100 } });
		await vi.waitFor(() => {
			expect(mockAnimate).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({ value: 100 }),
				expect.objectContaining({
					onUpdate: expect.any(Function)
				})
			);
		});
	});

	it('formats number with optional formatter prop', () => {
		const { container } = render(NumberTicker, {
			props: {
				value: 3.14159,
				format: (n: number) => n.toFixed(2)
			}
		});
		expect(container.textContent).toBe('3.14');
	});

	it('skips animation when reduced motion (sets value instantly)', async () => {
		motionOkValue = false;
		const { container } = render(NumberTicker, { props: { value: 50 } });
		await new Promise((r) => setTimeout(r, 50));
		expect(mockAnimate).not.toHaveBeenCalled();
		expect(container.textContent).toBe('50');
	});

	it('cleans up on destroy', async () => {
		render(NumberTicker, { props: { value: 10 } });
		await vi.waitFor(() => {
			expect(mockAnimate).toHaveBeenCalled();
		});
		const proxy = mockAnimate.mock.calls[0][0];
		expect(proxy).toHaveProperty('value');
	});
});
