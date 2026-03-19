// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStop = vi.fn();

describe('createAnimationScope', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns undefined when container is undefined', async () => {
		const { createAnimationScope } = await import('$lib/motion/utils/animation-scope.svelte');
		const result = createAnimationScope(undefined, () => {});
		expect(result).toBeUndefined();
	});

	it('invokes setup callback with scope object', async () => {
		const { createAnimationScope } = await import('$lib/motion/utils/animation-scope.svelte');
		const container = document.createElement('div');
		const setup = vi.fn();

		createAnimationScope(container, setup);
		expect(setup).toHaveBeenCalledWith(
			expect.objectContaining({
				add: expect.any(Function),
				container
			})
		);
	});

	it('returns cleanup function', async () => {
		const { createAnimationScope } = await import('$lib/motion/utils/animation-scope.svelte');
		const container = document.createElement('div');
		const cleanup = createAnimationScope(container, () => {});
		expect(typeof cleanup).toBe('function');
	});

	it('cleanup() stops all registered animations', async () => {
		const { createAnimationScope } = await import('$lib/motion/utils/animation-scope.svelte');
		const container = document.createElement('div');
		const mockControls = { stop: mockStop, cancel: vi.fn(), then: vi.fn(), play: vi.fn(), pause: vi.fn(), complete: vi.fn(), speed: 1, startTime: null, duration: 0, currentTime: 0, playState: 'running' as const, playbackRate: 1, state: 'running' as const, finished: Promise.resolve() as unknown as PromiseLike<void>, time: 0, attachTimeline: vi.fn(), flatten: vi.fn() };

		const cleanup = createAnimationScope(container, (scope) => {
			scope.add(mockControls as any);
		});
		cleanup!();
		expect(mockStop).toHaveBeenCalled();
	});
});
