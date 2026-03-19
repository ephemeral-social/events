<script lang="ts">
	import { organicFade } from '$lib/motion/transitions/organic-fade';
	import { X, CaretLeft, CaretRight } from 'phosphor-svelte';

	interface Photo {
		url: string;
		id: string;
	}

	interface Props {
		photos: Photo[];
		initialIndex?: number;
		open: boolean;
		onClose: () => void;
	}

	let props = $props<Props>();
	let { photos, initialIndex = 0, open, onClose } = $derived(props);
	let currentIndex = $state(0);

	// Horizontal swipe state
	let touchStartX = $state(0);
	let touchDeltaX = $state(0);
	let isDraggingX = $state(false);

	// Vertical swipe-down-to-close state
	let touchStartY = $state(0);
	let touchDeltaY = $state(0);
	let isDraggingY = $state(false);

	let dialogEl: HTMLElement | undefined = $state();

	const currentPhoto = $derived(photos[currentIndex]);
	const hasNext = $derived(currentIndex < photos.length - 1);
	const hasPrev = $derived(currentIndex > 0);

	function next() {
		if (hasNext) currentIndex++;
	}
	function prev() {
		if (hasPrev) currentIndex--;
	}

	// Reset index when opening with new initialIndex
	$effect(() => {
		if (open) {
			currentIndex = initialIndex;
		}
	});

	// Focus trap: auto-focus dialog on open + scroll lock
	$effect(() => {
		if (open && dialogEl) {
			dialogEl.focus();
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.body.style.overflow = '';
		};
	});

	function onPointerDown(e: PointerEvent) {
		touchStartX = e.clientX;
		touchStartY = e.clientY;
		isDraggingX = false;
		isDraggingY = false;
	}

	function onPointerMove(e: PointerEvent) {
		const dx = e.clientX - touchStartX;
		const dy = e.clientY - touchStartY;

		if (!isDraggingX && !isDraggingY) {
			if (Math.abs(dx) > 10) isDraggingX = true;
			else if (dy > 10) isDraggingY = true;
			else return;
		}

		if (isDraggingX) touchDeltaX = dx;
		if (isDraggingY) touchDeltaY = Math.max(0, dy);
	}

	function onPointerUp() {
		if (isDraggingX && Math.abs(touchDeltaX) > 60) {
			if (touchDeltaX > 0 && hasPrev) prev();
			else if (touchDeltaX < 0 && hasNext) next();
		}
		if (isDraggingY && touchDeltaY > 100) {
			onClose();
		}
		touchDeltaX = 0;
		touchDeltaY = 0;
		isDraggingX = false;
		isDraggingY = false;
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		if (e.key === 'ArrowRight') next();
		if (e.key === 'ArrowLeft') prev();
		if (e.key === 'Tab') {
			const focusable = dialogEl?.querySelectorAll('button') ?? [];
			if (focusable.length === 0) return;
			const first = focusable[0] as HTMLElement;
			const last = focusable[focusable.length - 1] as HTMLElement;
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}
</script>

{#if open}
	<div
		bind:this={dialogEl}
		class="photo-viewer-overlay"
		transition:organicFade={{ duration: 300 }}
		role="dialog"
		aria-label="Photo viewer"
		aria-modal="true"
		onkeydown={onKeyDown}
		tabindex="-1"
		style="opacity: {isDraggingY ? 1 - touchDeltaY / 300 : 1}; transform: {isDraggingY
			? `translateY(${touchDeltaY}px) scale(${1 - touchDeltaY / 1000})`
			: 'none'}"
	>
		<button class="close-btn" onclick={onClose} aria-label="Close">
			<X size={24} weight="bold" />
		</button>

		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="photo-container"
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			style="transform: translateX({touchDeltaX}px)"
		>
			{#if currentPhoto}
				<img src={currentPhoto.url} alt="" class="photo-img" draggable="false" />
			{/if}
		</div>

		{#if hasPrev}
			<button class="nav-btn nav-prev" onclick={prev} aria-label="Previous photo">
				<CaretLeft size={32} weight="bold" />
			</button>
		{/if}
		{#if hasNext}
			<button class="nav-btn nav-next" onclick={next} aria-label="Next photo">
				<CaretRight size={32} weight="bold" />
			</button>
		{/if}

		<div class="photo-counter">{currentIndex + 1} / {photos.length}</div>
	</div>
{/if}

<style>
	.photo-viewer-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(0, 0, 0, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 51;
		color: var(--text-primary);
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
	}
	.photo-container {
		max-width: 100%;
		max-height: 100%;
		touch-action: none;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.photo-img {
		max-width: 90vw;
		max-height: 85vh;
		object-fit: contain;
		user-select: none;
	}
	.nav-btn {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-primary);
		background: none;
		border: none;
		padding: 0.75rem;
		cursor: pointer;
		opacity: 0.8;
		transition: opacity 150ms ease;
	}
	.nav-btn:hover {
		opacity: 1;
	}
	.nav-prev {
		left: 0.5rem;
	}
	.nav-next {
		right: 0.5rem;
	}
	.photo-counter {
		position: absolute;
		bottom: 1.5rem;
		left: 50%;
		transform: translateX(-50%);
		color: var(--text-secondary);
		font-size: 0.875rem;
		font-family: var(--font-body, 'Manrope', sans-serif);
	}
</style>
