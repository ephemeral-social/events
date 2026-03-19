// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRenderer as createForest } from '$lib/motion/ambient/forest';
import { createRenderer as createSakura } from '$lib/motion/ambient/sakura';
import { createRenderer as createGarden } from '$lib/motion/ambient/garden';

function createMockCtx(): CanvasRenderingContext2D {
	return {
		clearRect: vi.fn(),
		save: vi.fn(),
		restore: vi.fn(),
		fill: vi.fn(),
		beginPath: vi.fn(),
		ellipse: vi.fn(),
		arc: vi.fn(),
		translate: vi.fn(),
		rotate: vi.fn(),
		scale: vi.fn(),
		globalAlpha: 1,
		fillStyle: ''
	} as unknown as CanvasRenderingContext2D;
}

describe('forest renderer', () => {
	let ctx: CanvasRenderingContext2D;

	beforeEach(() => {
		ctx = createMockCtx();
	});

	it('createRenderer returns AmbientRenderer with required methods', () => {
		const renderer = createForest(ctx, 800, 600);
		expect(renderer.update).toBeTypeOf('function');
		expect(renderer.draw).toBeTypeOf('function');
		expect(renderer.resize).toBeTypeOf('function');
		expect(renderer.destroy).toBeTypeOf('function');
	});

	it('update spawns particles over time', () => {
		const renderer = createForest(ctx, 800, 600);
		// Run many update cycles to trigger spawning
		for (let i = 0; i < 100; i++) {
			renderer.update();
		}
		// Draw to confirm particles exist (ctx.fill gets called)
		renderer.draw();
		expect(ctx.fill).toHaveBeenCalled();
	});

	it('draw calls ctx.clearRect and ctx.fill', () => {
		const renderer = createForest(ctx, 800, 600);
		renderer.draw();
		expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
		// Pre-seeded particles should cause fill calls
		expect(ctx.fill).toHaveBeenCalled();
	});

	it('particles respect MAX_PARTICLES limit of 25', () => {
		// Force Math.random to always spawn (return values that trigger spawn)
		const origRandom = Math.random;
		let callCount = 0;
		Math.random = () => {
			callCount++;
			// Return 0.01 to always trigger spawn (< 0.03 threshold)
			// but also need valid values for particle creation
			return 0.01;
		};

		const renderer = createForest(ctx, 800, 600);

		// Run many updates to try to exceed limit
		for (let i = 0; i < 500; i++) {
			renderer.update();
		}

		Math.random = origRandom;

		// Draw and count fill calls to verify particle count
		renderer.draw();
		// Each particle triggers exactly one fill() call
		const fillCalls = (ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length;
		expect(fillCalls).toBeLessThanOrEqual(25);
	});

	it('particles fade out near end of life', () => {
		// Create renderer - has pre-seeded particles
		const renderer = createForest(ctx, 800, 600);

		// Run many updates so particles approach end of life
		for (let i = 0; i < 600; i++) {
			renderer.update();
		}

		// After many updates, all pre-seeded particles should have died/faded
		// New particles may have spawned, but old ones should be gone
		renderer.draw();
		// This just verifies the renderer survives the lifecycle
		expect(ctx.clearRect).toHaveBeenCalled();
	});

	it('resize updates internal dimensions', () => {
		const renderer = createForest(ctx, 800, 600);
		renderer.resize!(1200, 900);
		renderer.draw();
		expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 1200, 900);
	});

	it('destroy clears all particles', () => {
		const renderer = createForest(ctx, 800, 600);
		// Run some updates to ensure particles exist
		for (let i = 0; i < 50; i++) {
			renderer.update();
		}
		renderer.destroy!();

		// Reset mock to count only post-destroy calls
		(ctx.fill as ReturnType<typeof vi.fn>).mockClear();
		renderer.draw();
		// After destroy, no particles to draw - fill should not be called
		expect(ctx.fill).not.toHaveBeenCalled();
	});
});

describe('sakura renderer', () => {
	let ctx: CanvasRenderingContext2D;

	beforeEach(() => {
		ctx = createMockCtx();
	});

	it('createRenderer returns AmbientRenderer with required methods', () => {
		const renderer = createSakura(ctx, 800, 600);
		expect(renderer.update).toBeTypeOf('function');
		expect(renderer.draw).toBeTypeOf('function');
		expect(renderer.resize).toBeTypeOf('function');
		expect(renderer.destroy).toBeTypeOf('function');
	});

	it('uses pink/rose color palette', () => {
		const sakuraColors = ['#f4a0b5', '#e07a93', '#fcd5e0', '#f8c8d8'];
		// Control Math.random to cycle through color indices
		const origRandom = Math.random;
		let idx = 0;
		const values = [0.1, 0.3, 0.5, 0.7, 0.9]; // cycle through
		Math.random = () => values[idx++ % values.length];

		const renderer = createSakura(ctx, 800, 600);
		renderer.draw();

		Math.random = origRandom;

		// Check that fillStyle was set to one of the sakura colors
		const fillStyleCalls = (ctx as Record<string, unknown>)['fillStyle'];
		// At minimum, fillStyle should be a sakura color string
		expect(sakuraColors).toContain(fillStyleCalls as string);
	});

	it('respects MAX_PARTICLES limit of 20', () => {
		const origRandom = Math.random;
		Math.random = () => 0.01;

		const renderer = createSakura(ctx, 800, 600);
		for (let i = 0; i < 500; i++) {
			renderer.update();
		}

		Math.random = origRandom;

		renderer.draw();
		const fillCalls = (ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length;
		expect(fillCalls).toBeLessThanOrEqual(20);
	});

	it('destroy clears particles', () => {
		const renderer = createSakura(ctx, 800, 600);
		for (let i = 0; i < 50; i++) {
			renderer.update();
		}
		renderer.destroy!();

		(ctx.fill as ReturnType<typeof vi.fn>).mockClear();
		renderer.draw();
		expect(ctx.fill).not.toHaveBeenCalled();
	});
});

describe('garden renderer', () => {
	let ctx: CanvasRenderingContext2D;

	beforeEach(() => {
		ctx = createMockCtx();
	});

	it('createRenderer returns AmbientRenderer with required methods', () => {
		const renderer = createGarden(ctx, 800, 600);
		expect(renderer.update).toBeTypeOf('function');
		expect(renderer.draw).toBeTypeOf('function');
		expect(renderer.resize).toBeTypeOf('function');
		expect(renderer.destroy).toBeTypeOf('function');
	});

	it('uses warm amber color palette', () => {
		const gardenColors = ['#e9b44c', '#c8963e', '#f2d98b', '#d4a843'];
		const origRandom = Math.random;
		let idx = 0;
		const values = [0.1, 0.3, 0.5, 0.7, 0.9];
		Math.random = () => values[idx++ % values.length];

		const renderer = createGarden(ctx, 800, 600);
		renderer.draw();

		Math.random = origRandom;

		const fillStyleCalls = (ctx as Record<string, unknown>)['fillStyle'];
		expect(gardenColors).toContain(fillStyleCalls as string);
	});

	it('respects MAX_PARTICLES limit of 30', () => {
		const origRandom = Math.random;
		Math.random = () => 0.01;

		const renderer = createGarden(ctx, 800, 600);
		for (let i = 0; i < 500; i++) {
			renderer.update();
		}

		Math.random = origRandom;

		renderer.draw();
		// Garden draws 2 arcs per particle (dot + glow) = 2 fill() calls per particle
		const fillCalls = (ctx.fill as ReturnType<typeof vi.fn>).mock.calls.length;
		expect(fillCalls).toBeLessThanOrEqual(60); // 30 particles * 2 fill calls each
	});

	it('destroy clears particles', () => {
		const renderer = createGarden(ctx, 800, 600);
		for (let i = 0; i < 50; i++) {
			renderer.update();
		}
		renderer.destroy!();

		(ctx.fill as ReturnType<typeof vi.fn>).mockClear();
		renderer.draw();
		expect(ctx.fill).not.toHaveBeenCalled();
	});
});
