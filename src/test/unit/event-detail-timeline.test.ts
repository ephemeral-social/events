// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockControls = { stop: vi.fn(), finished: Promise.resolve() };
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

describe('createEventDetailTimeline', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		motionOkValue = true;
	});

	it('returns null when motionOk()=false', async () => {
		motionOkValue = false;
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const result = createEventDetailTimeline({});
		expect(result).toBeNull();
	});

	it('calls animate with a sequence array', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const cover = document.createElement('div');
		createEventDetailTimeline({ cover });
		expect(mockAnimate).toHaveBeenCalledWith(
			expect.any(Array),
			expect.objectContaining({ defaultOptions: expect.any(Object) })
		);
	});

	it('animates cover with fade + scale at correct times', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const cover = document.createElement('div');
		createEventDetailTimeline({ cover });

		const sequence = mockAnimate.mock.calls[0][0];
		// Cover has two entries: opacity at 0, scale at 0.1
		expect(sequence[0]).toEqual([cover, { opacity: [0, 1] }, { duration: 0.6, at: 0 }]);
		expect(sequence[1]).toEqual([cover, { scale: [1.03, 1] }, { duration: 0.8, at: 0.1 }]);
	});

	it('animates title with translateY at 0.2', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const title = document.createElement('h1');
		createEventDetailTimeline({ title });

		const sequence = mockAnimate.mock.calls[0][0];
		expect(sequence[0]).toEqual([title, { y: [20, 0], opacity: [0, 1] }, { duration: 0.4, at: 0.2 }]);
	});

	it('staggers info items at 50ms intervals starting at 0.35', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const infoItems = [document.createElement('div'), document.createElement('div')];
		createEventDetailTimeline({ infoItems });

		const sequence = mockAnimate.mock.calls[0][0];
		expect(sequence[0][2]).toMatchObject({ duration: 0.35, at: 0.35 });
		expect(mockStagger).toHaveBeenCalledWith(0.05);
	});

	it('animates description fade at 0.5', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const description = document.createElement('div');
		createEventDetailTimeline({ description });

		const sequence = mockAnimate.mock.calls[0][0];
		expect(sequence[0]).toEqual([description, { opacity: [0, 1] }, { duration: 0.3, at: 0.5 }]);
	});

	it('animates guest count slide at 0.6', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const guestCount = document.createElement('div');
		createEventDetailTimeline({ guestCount });

		const sequence = mockAnimate.mock.calls[0][0];
		expect(sequence[0]).toEqual([guestCount, { x: [-20, 0], opacity: [0, 1] }, { duration: 0.3, at: 0.6 }]);
	});

	it('animates CTA with spring ease at 0.7', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const ctaButtons = document.createElement('div');
		createEventDetailTimeline({ ctaButtons });

		const sequence = mockAnimate.mock.calls[0][0];
		expect(sequence[0][2]).toMatchObject({ duration: 0.4, at: 0.7, ease: [0.34, 1.56, 0.64, 1] });
	});

	it('animates secondary content at 0.9', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const secondary = document.createElement('div');
		createEventDetailTimeline({ secondary });

		const sequence = mockAnimate.mock.calls[0][0];
		expect(sequence[0]).toEqual([secondary, { opacity: [0, 1] }, { duration: 0.3, at: 0.9 }]);
	});

	it('handles missing elements gracefully', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const result = createEventDetailTimeline(
			{ cover: null, title: undefined, infoItems: null, description: null, guestCount: null, ctaButtons: null, secondary: null }
		);
		expect(result).toBeTruthy();
		// animate should NOT be called for empty sequence (we return stub controls)
		expect(mockAnimate).not.toHaveBeenCalled();
	});

	it('complete timeline has all position offsets', async () => {
		const { createEventDetailTimeline } = await import('$lib/motion/timelines/event-detail');
		const elements = {
			cover: document.createElement('div'),
			title: document.createElement('h1'),
			infoItems: [document.createElement('div')],
			description: document.createElement('div'),
			guestCount: document.createElement('div'),
			ctaButtons: document.createElement('div'),
			secondary: document.createElement('div')
		};
		createEventDetailTimeline(elements);

		const sequence = mockAnimate.mock.calls[0][0];
		const positions = sequence.map((seg: [unknown, unknown, { at: number }]) => seg[2].at);
		// cover has two calls at 0 and 0.1, then title at 0.2, etc.
		expect(positions).toEqual([0, 0.1, 0.2, 0.35, 0.5, 0.6, 0.7, 0.9]);
	});
});
