<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tick } from 'svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		children: Snippet;
		zIndex?: number;
		paddingBottom?: string;
		/** Lock the sheet height after first render so content changes don't collapse it */
		lockHeight?: boolean;
	}

	let { open, onClose, children, zIndex = 50, paddingBottom, lockHeight = false }: Props = $props();

	let sheetRef: HTMLDivElement | undefined = $state();
	let contentRef: HTMLDivElement | undefined = $state();
	let backdropRef: HTMLDivElement | undefined = $state();
	let dragY = $state(0);
	let isDragging = $state(false);
	let scrollLocked = $state(false);
	let lockedMinHeight = $state<string | undefined>(undefined);
	let startY = 0;

	const DISMISS_THRESHOLD = 120;
	const RESISTANCE = 0.5;

	// Capture and lock height after sheet opens and content renders
	$effect(() => {
		if (open && lockHeight && sheetRef) {
			// Wait for animation to finish (300ms) + one tick for layout
			const timer = setTimeout(async () => {
				await tick();
				if (sheetRef) {
					lockedMinHeight = `${sheetRef.offsetHeight}px`;
				}
			}, 350);
			return () => clearTimeout(timer);
		} else if (!open) {
			lockedMinHeight = undefined;
		}
	});

	function handleTouchStart(e: TouchEvent) {
		startY = e.touches[0].clientY;
		isDragging = true;
		scrollLocked = false;
		dragY = 0;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging) return;
		const delta = e.touches[0].clientY - startY;
		const scrollTop = contentRef?.scrollTop ?? 0;

		// If content is scrolled down and user swipes up, let native scroll handle it
		if (delta < 0 && scrollTop > 0) {
			dragY = 0;
			return;
		}

		// If content is scrolled down and user swipes down, let native scroll handle it
		// until content reaches the top
		if (delta > 0 && scrollTop > 0) {
			dragY = 0;
			return;
		}

		// Content is at top and user swipes down → drag to dismiss
		if (delta > 0 && scrollTop <= 0) {
			e.preventDefault();
			scrollLocked = true;
			dragY = delta * RESISTANCE;
		} else {
			dragY = 0;
		}
	}

	function handleTouchEnd() {
		isDragging = false;
		scrollLocked = false;
		if (dragY > DISMISS_THRESHOLD) {
			onClose();
		}
		dragY = 0;
	}

	// Block page scroll while sheet is open — but only on the backdrop itself,
	// not on events that bubble up from the sheet content.
	$effect(() => {
		const bd = backdropRef;
		if (!bd) return;

		function preventScroll(e: TouchEvent) {
			// Only block if the touch target is the backdrop (not sheet content)
			if (e.target === bd) {
				e.preventDefault();
			}
		}

		bd.addEventListener('touchmove', preventScroll, { passive: false });
		return () => bd.removeEventListener('touchmove', preventScroll);
	});

	// Attach sheet drag handler with { passive: false } so preventDefault works.
	$effect(() => {
		const el = sheetRef;
		if (!el) return;
		el.addEventListener('touchmove', handleTouchMove, { passive: false });
		return () => el.removeEventListener('touchmove', handleTouchMove);
	});
</script>

{#if open}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={backdropRef}
		class="fixed inset-0 touch-none"
		style="z-index: {zIndex}; background: var(--backdrop-overlay); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px)"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={sheetRef}
			class="absolute bottom-0 left-0 right-0 rounded-t-2xl"
			style="
				touch-action: pan-y;
				background: var(--surface-overlay);
				max-height: 92dvh;
				{lockedMinHeight ? `min-height: ${lockedMinHeight};` : ''}
				display: flex;
				flex-direction: column;
				transform: translateY({dragY}px);
				transition: {isDragging ? 'none' : 'transform 300ms cubic-bezier(0.25, 0.1, 0.25, 1)'};
				padding-bottom: {paddingBottom || 'max(var(--safe-bottom, 0px), 12px)'};
				animation: {isDragging ? 'none' : 'bottom-sheet-up 300ms cubic-bezier(0.25, 0.1, 0.25, 1) both'};
			"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && onClose()}
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
		>
			<!-- Drag handle -->
			<div class="flex justify-center pt-3 pb-2 shrink-0">
				<div class="h-1 w-9 rounded-full" style="background: var(--text-muted); opacity: 0.4"></div>
			</div>

			<div
				bind:this={contentRef}
				class="px-4 pb-4 overflow-y-auto overscroll-contain flex-1"
				style="touch-action: {scrollLocked ? 'none' : 'pan-y'}; -webkit-overflow-scrolling: touch"
			>
				{@render children()}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes bottom-sheet-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
