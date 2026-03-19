// @vitest-environment jsdom
/**
 * BEHAVIORAL regression tests for ambient canvas visibility.
 *
 * Bug: Canvas had z-index:-1 which placed it below opaque backgrounds
 * on html, body, and #scroll-root. Particles rendered but were invisible.
 *
 * Fix: Canvas z-index:0 + opacity:0.4. Body and #scroll-root backgrounds
 * removed. #scroll-root gets position:relative + z-index:1.
 *
 * These tests render the actual CanvasAmbient component and verify the
 * computed z-index and opacity on the real DOM element. The CSS tests
 * parse the actual stylesheets to verify background removal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import fs from 'fs';
import path from 'path';

// --- Mocks for CanvasAmbient ---
vi.mock('$lib/motion/utils/device-tier', () => ({
	supportsAmbientEffects: () => true,
	getDeviceTier: () => 'high'
}));

vi.mock('$lib/motion/utils/reduced-motion.svelte', () => ({
	motionOk: () => true
}));

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$lib/motion/ambient/forest', () => ({
	createRenderer: () => ({
		update: vi.fn(),
		draw: vi.fn(),
		resize: vi.fn(),
		destroy: vi.fn()
	})
}));

vi.mock('$lib/motion/ambient/sakura', () => ({
	createRenderer: () => ({
		update: vi.fn(),
		draw: vi.fn(),
		resize: vi.fn(),
		destroy: vi.fn()
	})
}));

vi.mock('$lib/motion/ambient/garden', () => ({
	createRenderer: () => ({
		update: vi.fn(),
		draw: vi.fn(),
		resize: vi.fn(),
		destroy: vi.fn()
	})
}));

HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
	clearRect: vi.fn(),
	fillRect: vi.fn(),
	beginPath: vi.fn(),
	arc: vi.fn(),
	fill: vi.fn()
})) as unknown as typeof HTMLCanvasElement.prototype.getContext;

describe('CanvasAmbient: z-index stacking for visibility', () => {
	beforeEach(() => {
		vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
		vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(vi.fn());
	});

	it('canvas renders with z-index:0 (visible above html background)', async () => {
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		const canvas = container.querySelector('canvas') as HTMLCanvasElement;
		expect(canvas).toBeTruthy();

		// z-index:0 means the canvas sits in the normal stacking layer,
		// above the html root background. This is the fix — previously it
		// was -1, which placed it below all opaque backgrounds.
		expect(canvas.style.zIndex).toBe('0');
	});

	it('canvas z-index is NOT negative (which would hide it behind backgrounds)', async () => {
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		const canvas = container.querySelector('canvas') as HTMLCanvasElement;
		const zIndex = parseInt(canvas.style.zIndex, 10);
		expect(zIndex).toBeGreaterThanOrEqual(0);
	});

	it('canvas has reduced opacity (0.4) for subtle particle effect', async () => {
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		const canvas = container.querySelector('canvas') as HTMLCanvasElement;
		const opacity = parseFloat(canvas.style.opacity);
		expect(opacity).toBeGreaterThan(0);
		expect(opacity).toBeLessThanOrEqual(0.5);
		expect(canvas.style.opacity).toBe('0.4');
	});

	it('canvas covers full viewport (position:fixed, inset:0)', async () => {
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		const canvas = container.querySelector('canvas') as HTMLCanvasElement;
		expect(canvas.style.position).toBe('fixed');
		expect(canvas.style.inset).toBe('0px');
	});

	it('canvas does not block interactions (pointer-events:none)', async () => {
		const { container } = render(
			(await import('$lib/motion/components/CanvasAmbient.svelte')).default
		);
		const canvas = container.querySelector('canvas') as HTMLCanvasElement;
		expect(canvas.style.pointerEvents).toBe('none');
	});
});

describe('CSS stacking: body and #scroll-root must be transparent for canvas visibility', () => {
	const rootDir = path.resolve(__dirname, '../../');

	// Helper: extract all declarations for a given selector from a CSS file
	function getDeclarations(css: string, selector: string): Record<string, string> {
		const decls: Record<string, string> = {};
		const regex = new RegExp(
			`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`,
			'm'
		);
		const match = css.match(regex);
		if (match) {
			const block = match[1];
			for (const line of block.split('\n')) {
				// Skip comment lines
				if (line.trim().startsWith('/*') || line.trim().startsWith('*')) continue;
				const declMatch = line.match(/^\s*([\w-]+)\s*:\s*(.+?)\s*;/);
				if (declMatch) {
					decls[declMatch[1]] = declMatch[2];
				}
			}
		}
		return decls;
	}

	it('body does NOT have background-color (transparent for canvas visibility)', () => {
		const appCss = fs.readFileSync(path.join(rootDir, 'app.css'), 'utf-8');
		const bodyDecls = getDeclarations(appCss, 'body');
		// body should NOT set background-color (html handles it)
		expect(bodyDecls['background-color']).toBeUndefined();
	});

	it('html retains background-color as the base layer', () => {
		const appCss = fs.readFileSync(path.join(rootDir, 'app.css'), 'utf-8');
		const htmlDecls = getDeclarations(appCss, 'html');
		expect(htmlDecls['background-color']).toBeDefined();
		expect(htmlDecls['background-color']).toContain('--surface-base');
	});

	it('#scroll-root does NOT have background-color', () => {
		const nativeResetCss = fs.readFileSync(
			path.join(rootDir, 'lib/styles/native-reset.css'),
			'utf-8'
		);
		const scrollRootDecls = getDeclarations(nativeResetCss, '#scroll-root');
		expect(scrollRootDecls['background-color']).toBeUndefined();
	});

	it('#scroll-root has position:relative and z-index:1 (above canvas, below modals)', () => {
		const nativeResetCss = fs.readFileSync(
			path.join(rootDir, 'lib/styles/native-reset.css'),
			'utf-8'
		);
		const scrollRootDecls = getDeclarations(nativeResetCss, '#scroll-root');
		expect(scrollRootDecls['position']).toBe('relative');
		expect(scrollRootDecls['z-index']).toBe('1');
	});

	it('stacking order is correct: canvas(z:0) < #scroll-root(z:1)', () => {
		// This test verifies the stacking context relationship.
		// Canvas at z-index:0 with position:fixed sits in the viewport stacking context.
		// #scroll-root at z-index:1 with position:relative sits above the canvas.
		// Content inside #scroll-root (cards, text) renders above the canvas.
		// Particles are visible through transparent gaps between content elements.
		const nativeResetCss = fs.readFileSync(
			path.join(rootDir, 'lib/styles/native-reset.css'),
			'utf-8'
		);
		const scrollRootDecls = getDeclarations(nativeResetCss, '#scroll-root');
		const scrollRootZ = parseInt(scrollRootDecls['z-index'], 10);

		// Canvas z-index (from the inline style on the rendered component)
		const canvasZ = 0; // verified by the component render test above

		expect(scrollRootZ).toBeGreaterThan(canvasZ);
	});
});
