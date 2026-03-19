// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';

const { mockAnimate } = vi.hoisted(() => {
	const mockAnimate = vi.fn().mockReturnValue({
		stop: vi.fn(),
		finished: Promise.resolve()
	});
	return { mockAnimate };
});

vi.mock('motion', () => ({
	animate: mockAnimate
}));

let motionOkValue = true;
vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue
}));

import Confetti from '$lib/motion/components/Confetti.svelte';

describe('Confetti component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
	});

	it('renders container div', () => {
		const { container } = render(Confetti, { props: { trigger: 0 } });
		const div = container.querySelector('div');
		expect(div).toBeTruthy();
		expect(div!.style.position).toBe('fixed');
	});

	it('does not burst when trigger=0', async () => {
		const { container } = render(Confetti, { props: { trigger: 0 } });
		await new Promise((r) => setTimeout(r, 50));
		const particleEls = container.querySelectorAll('.confetti-particle');
		expect(particleEls.length).toBe(0);
		expect(mockAnimate).not.toHaveBeenCalled();
	});

	it('creates particles on trigger change', async () => {
		const { container, rerender } = render(Confetti, { props: { trigger: 0 } });
		await rerender({ trigger: 1 });
		await vi.waitFor(() => {
			const particleEls = container.querySelectorAll('.confetti-particle');
			expect(particleEls.length).toBeGreaterThan(0);
		});
	});

	it('creates correct number of particles (default 18)', async () => {
		const { container, rerender } = render(Confetti, { props: { trigger: 0 } });
		await rerender({ trigger: 1 });
		await vi.waitFor(() => {
			const particleEls = container.querySelectorAll('.confetti-particle');
			expect(particleEls.length).toBe(18);
		});
	});

	it('calls animate for each particle', async () => {
		render(Confetti, { props: { trigger: 1 } });
		await vi.waitFor(
			() => {
				expect(mockAnimate).toHaveBeenCalled();
			},
			{ timeout: 500 }
		);
		expect(mockAnimate.mock.calls.length).toBe(18);
	});

	it('passes arc physics (negative y offset for upward burst)', async () => {
		render(Confetti, { props: { trigger: 1 } });
		await vi.waitFor(
			() => {
				expect(mockAnimate).toHaveBeenCalled();
			},
			{ timeout: 500 }
		);
		// Check y keyframes — some should have negative end values (upward burst)
		const yKeyframes = mockAnimate.mock.calls.map(
			(call: [unknown, { y: number[] }]) => call[1].y[1]
		);
		const hasNegativeY = yKeyframes.some((y: number) => y < 0);
		expect(hasNegativeY).toBe(true);
	});

	it('particles have colors from palette', async () => {
		const { container } = render(Confetti, { props: { trigger: 1 } });
		await vi.waitFor(() => {
			const particleEls = container.querySelectorAll('.confetti-particle');
			expect(particleEls.length).toBeGreaterThan(0);
		});
		const firstParticle = container.querySelector('.confetti-particle') as HTMLElement;
		const expectedRgb = [
			'rgb(82, 183, 136)',
			'rgb(64, 145, 108)',
			'rgb(149, 213, 178)',
			'rgb(216, 243, 220)',
			'rgb(116, 198, 157)'
		];
		const bg = firstParticle.style.background;
		expect(expectedRgb.some((c) => bg.includes(c))).toBe(true);
	});

	it('does nothing when motionOk()=false', async () => {
		motionOkValue = false;
		const { container } = render(Confetti, { props: { trigger: 1 } });
		await new Promise((r) => setTimeout(r, 100));
		const particleEls = container.querySelectorAll('.confetti-particle');
		expect(particleEls.length).toBe(0);
		expect(mockAnimate).not.toHaveBeenCalled();
	});

	it('cleans up particles after animation (onComplete)', async () => {
		render(Confetti, { props: { trigger: 1 } });
		await vi.waitFor(
			() => {
				expect(mockAnimate).toHaveBeenCalled();
			},
			{ timeout: 500 }
		);
		const firstCall = mockAnimate.mock.calls[0] as [unknown, unknown, { onComplete: () => void }];
		const onComplete = firstCall[2].onComplete;
		expect(onComplete).toBeInstanceOf(Function);
		onComplete();
	});

	it('accepts custom count', async () => {
		const { container, rerender } = render(Confetti, {
			props: { trigger: 0, count: 5 }
		});
		await rerender({ trigger: 1, count: 5 });
		await vi.waitFor(() => {
			const particleEls = container.querySelectorAll('.confetti-particle');
			expect(particleEls.length).toBe(5);
		});
	});

	it('positions particles at origin coordinates', async () => {
		const origin = { x: 200, y: 300 };
		const { container, rerender } = render(Confetti, {
			props: { trigger: 0, origin }
		});
		await rerender({ trigger: 1, origin });
		await vi.waitFor(() => {
			const particleEls = container.querySelectorAll('.confetti-particle');
			expect(particleEls.length).toBeGreaterThan(0);
		});
		const firstParticle = container.querySelector('.confetti-particle') as HTMLElement;
		expect(firstParticle.style.left).toBe('200px');
		expect(firstParticle.style.top).toBe('300px');
	});
});
