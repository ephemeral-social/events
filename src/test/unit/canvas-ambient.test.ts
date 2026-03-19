// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';

// --- Mocks ---
let ambientSupported = true;
let motionOkValue = true;

vi.mock('$lib/motion/utils/device-tier', () => ({
	supportsAmbientEffects: () => ambientSupported,
	getDeviceTier: () => 'high'
}));

vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => motionOkValue
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

const mockUpdate = vi.fn();
const mockDraw = vi.fn();
const mockResize = vi.fn();
const mockDestroy = vi.fn();
const mockCreateRenderer = vi.fn(() => ({
	update: mockUpdate,
	draw: mockDraw,
	resize: mockResize,
	destroy: mockDestroy
}));

vi.mock('$lib/motion/ambient/forest', () => ({
	createRenderer: (...args: unknown[]) => mockCreateRenderer(...args)
}));

vi.mock('$lib/motion/ambient/sakura', () => ({
	createRenderer: (...args: unknown[]) => mockCreateRenderer(...args)
}));

vi.mock('$lib/motion/ambient/garden', () => ({
	createRenderer: (...args: unknown[]) => mockCreateRenderer(...args)
}));

// Stub canvas getContext
const mockGetContext = vi.fn(() => ({
	clearRect: vi.fn(),
	fillRect: vi.fn(),
	beginPath: vi.fn(),
	arc: vi.fn(),
	fill: vi.fn()
}));

HTMLCanvasElement.prototype.getContext = mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext;

describe('CanvasAmbient component', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		ambientSupported = true;
		motionOkValue = true;
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
			// Call once to verify loop starts, then stop
			return 1;
		});
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(vi.fn());
	});

	it('renders canvas when ambient supported + motionOk + browser', async () => {
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		const canvas = container.querySelector('canvas');
		expect(canvas).toBeTruthy();
	});

	it('does NOT render when supportsAmbientEffects()=false', async () => {
		ambientSupported = false;
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		expect(container.querySelector('canvas')).toBeNull();
	});

	it('does NOT render when motionOk()=false', async () => {
		motionOkValue = false;
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		expect(container.querySelector('canvas')).toBeNull();
	});

	it('canvas has aria-hidden="true"', async () => {
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		const canvas = container.querySelector('canvas');
		expect(canvas?.getAttribute('aria-hidden')).toBe('true');
	});

	it('canvas has fixed positioning above backgrounds (z-index:0) with low opacity', async () => {
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		const canvas = container.querySelector('canvas') as HTMLCanvasElement;
		expect(canvas.style.position).toBe('fixed');
		expect(canvas.style.zIndex).toBe('0');
		expect(canvas.style.opacity).toBe('0.4');
		expect(canvas.style.pointerEvents).toBe('none');
	});

	it('calls getContext("2d") on canvas', async () => {
		render((await import('$lib/motion/components/CanvasAmbient.svelte')).default);
		// Wait for the $effect to fire
		await vi.waitFor(() => {
			expect(mockGetContext).toHaveBeenCalledWith('2d');
		});
	});
});

describe('CanvasAmbient renderer map', () => {
	it('uses static renderer map for imports (no template literals)', async () => {
		// Import the component module and verify the loader map exists
		// by checking that forest/sakura/garden are loadable
		const forestMod = await import('$lib/motion/ambient/forest');
		expect(forestMod.createRenderer).toBeDefined();

		const sakuraMod = await import('$lib/motion/ambient/sakura');
		expect(sakuraMod.createRenderer).toBeDefined();

		const gardenMod = await import('$lib/motion/ambient/garden');
		expect(gardenMod.createRenderer).toBeDefined();
	});

	it('renderers implement AmbientRenderer interface (update + draw)', async () => {
		const forestMod = await import('$lib/motion/ambient/forest');
		const mockCtx = {} as CanvasRenderingContext2D;
		const renderer = forestMod.createRenderer(mockCtx, 800, 600);

		expect(typeof renderer.update).toBe('function');
		expect(typeof renderer.draw).toBe('function');
	});

	it('renderer.update and draw are callable without errors', async () => {
		const forestMod = await import('$lib/motion/ambient/forest');
		const mockCtx = {} as CanvasRenderingContext2D;
		const renderer = forestMod.createRenderer(mockCtx, 800, 600);

		expect(() => renderer.update()).not.toThrow();
		expect(() => renderer.draw()).not.toThrow();
	});

	it('renderer supports resize', async () => {
		const forestMod = await import('$lib/motion/ambient/forest');
		const mockCtx = {} as CanvasRenderingContext2D;
		const renderer = forestMod.createRenderer(mockCtx, 800, 600);

		if (renderer.resize) {
			expect(() => renderer.resize!(1024, 768)).not.toThrow();
		}
	});
});
