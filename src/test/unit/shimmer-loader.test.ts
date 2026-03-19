// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import ShimmerLoader from '$lib/motion/components/ShimmerLoader.svelte';

describe('ShimmerLoader component', () => {
	it('renders with shimmer-loader class', () => {
		const { container } = render(ShimmerLoader);
		expect(container.querySelector('.shimmer-loader')).toBeTruthy();
	});

	it('accepts custom width/height', () => {
		const { container } = render(ShimmerLoader, {
			props: { width: '200px', height: '2rem' }
		});
		const el = container.querySelector('.shimmer-loader') as HTMLElement;
		expect(el.style.width).toBe('200px');
		expect(el.style.height).toBe('2rem');
	});

	it('accepts border-radius', () => {
		const { container } = render(ShimmerLoader, {
			props: { borderRadius: '1rem' }
		});
		const el = container.querySelector('.shimmer-loader') as HTMLElement;
		expect(el.style.borderRadius).toBe('1rem');
	});

	it('renders as accessible (role="status", aria-label)', () => {
		const { container } = render(ShimmerLoader);
		const el = container.querySelector('.shimmer-loader') as HTMLElement;
		expect(el.getAttribute('role')).toBe('status');
		expect(el.getAttribute('aria-label')).toBe('Loading');
	});
});
