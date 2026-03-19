// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import PhotoViewer from '$lib/components/gallery/PhotoViewer.svelte';

// Mock the organic-fade transition to be a no-op in tests
vi.mock('$lib/motion/transitions/organic-fade', () => ({
	organicFade: () => ({ delay: 0, duration: 0, css: () => '' })
}));

const testPhotos = [
	{ url: '/api/media/photo-1.jpg', id: 'p1' },
	{ url: '/api/media/photo-2.jpg', id: 'p2' },
	{ url: '/api/media/photo-3.jpg', id: 'p3' }
];

describe('PhotoViewer component', () => {
	let onClose: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		onClose = vi.fn();
		document.body.style.overflow = '';
	});

	it('renders overlay when open=true', () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, onClose }
		});
		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toBeTruthy();
		expect(dialog?.getAttribute('aria-label')).toBe('Photo viewer');
		expect(dialog?.getAttribute('aria-modal')).toBe('true');
	});

	it('does not render when open=false', () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: false, onClose }
		});
		const dialog = container.querySelector('[role="dialog"]');
		expect(dialog).toBeNull();
	});

	it('displays current photo matching initialIndex', () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, initialIndex: 1, onClose }
		});
		const img = container.querySelector('img') as HTMLImageElement;
		expect(img).toBeTruthy();
		expect(img.src).toContain('photo-2.jpg');
	});

	it('shows counter "1 / N" for default initialIndex', () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, onClose }
		});
		const counter = container.querySelector('.photo-counter');
		expect(counter?.textContent).toBe('1 / 3');
	});

	it('next button advances index and updates counter', async () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, onClose }
		});
		const nextBtn = container.querySelector('[aria-label="Next photo"]') as HTMLElement;
		expect(nextBtn).toBeTruthy();

		await fireEvent.click(nextBtn);

		const counter = container.querySelector('.photo-counter');
		expect(counter?.textContent).toBe('2 / 3');
		const img = container.querySelector('img') as HTMLImageElement;
		expect(img.src).toContain('photo-2.jpg');
	});

	it('prev button goes back and updates counter', async () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, initialIndex: 2, onClose }
		});

		const prevBtn = container.querySelector('[aria-label="Previous photo"]') as HTMLElement;
		expect(prevBtn).toBeTruthy();

		await fireEvent.click(prevBtn);

		const counter = container.querySelector('.photo-counter');
		expect(counter?.textContent).toBe('2 / 3');
	});

	it('Escape key calls onClose', async () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, onClose }
		});
		const dialog = container.querySelector('[role="dialog"]') as HTMLElement;

		await fireEvent.keyDown(dialog, { key: 'Escape' });

		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('ArrowRight advances index', async () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, onClose }
		});
		const dialog = container.querySelector('[role="dialog"]') as HTMLElement;

		await fireEvent.keyDown(dialog, { key: 'ArrowRight' });

		const counter = container.querySelector('.photo-counter');
		expect(counter?.textContent).toBe('2 / 3');
	});

	it('ArrowLeft goes back', async () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, initialIndex: 1, onClose }
		});
		const dialog = container.querySelector('[role="dialog"]') as HTMLElement;

		await fireEvent.keyDown(dialog, { key: 'ArrowLeft' });

		const counter = container.querySelector('.photo-counter');
		expect(counter?.textContent).toBe('1 / 3');
	});

	it('nav buttons hidden at boundaries - no prev at 0, no next at last', async () => {
		// At index 0: no prev button
		const { container: c1 } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, initialIndex: 0, onClose }
		});
		expect(c1.querySelector('[aria-label="Previous photo"]')).toBeNull();
		expect(c1.querySelector('[aria-label="Next photo"]')).toBeTruthy();

		// At last index: no next button
		const { container: c2 } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, initialIndex: 2, onClose }
		});
		expect(c2.querySelector('[aria-label="Next photo"]')).toBeNull();
		expect(c2.querySelector('[aria-label="Previous photo"]')).toBeTruthy();
	});

	it('auto-focuses dialog on open', async () => {
		const { container } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, onClose }
		});
		const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
		// Svelte $effect runs synchronously in test render, dialog should have focus
		expect(document.activeElement).toBe(dialog);
	});

	it('locks body scroll on open', () => {
		render(PhotoViewer, {
			props: { photos: testPhotos, open: true, onClose }
		});
		expect(document.body.style.overflow).toBe('hidden');
	});

	it('restores body scroll on close', () => {
		const { unmount } = render(PhotoViewer, {
			props: { photos: testPhotos, open: true, onClose }
		});
		expect(document.body.style.overflow).toBe('hidden');

		unmount();
		expect(document.body.style.overflow).toBe('');
	});
});
