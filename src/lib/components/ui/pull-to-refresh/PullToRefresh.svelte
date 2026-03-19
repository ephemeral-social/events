<script lang="ts">
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { ArrowClockwise, Check } from 'phosphor-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Pull-to-refresh phases:
	//   idle     → not active, indicator hidden
	//   pulling  → finger down, tracking drag (no CSS transitions)
	//   settling → released past threshold, animating to loading position
	//   loading  → waiting for invalidateAll(), spinner spinning
	//   done     → data loaded, checkmark flash
	//   leaving  → collapsing indicator back to 0

	type Phase = 'idle' | 'pulling' | 'settling' | 'loading' | 'done' | 'leaving';

	let phase = $state<Phase>('idle');
	let pullDistance = $state(0);

	const THRESHOLD = 64;
	const MAX_PULL = 128;
	const RESISTANCE = 0.4;
	const SETTLED_HEIGHT = 52;

	let startY = 0;
	let scrollEl: HTMLElement;

	onMount(() => {
		function isInsideOverlay(e: TouchEvent): boolean {
			const target = e.target as HTMLElement | null;
			return !!target?.closest('[role="dialog"], [data-overlay]');
		}

		function onTouchStart(e: TouchEvent) {
			if (isInsideOverlay(e)) return;
			if (scrollEl.scrollTop <= 0 && phase === 'idle') {
				startY = e.touches[0].clientY;
			}
		}

		function onTouchMove(e: TouchEvent) {
			if (isInsideOverlay(e)) return;
			if (phase !== 'idle' && phase !== 'pulling') return;

			if (scrollEl.scrollTop > 0) {
				if (phase === 'pulling') {
					phase = 'idle';
					pullDistance = 0;
				}
				return;
			}

			const delta = e.touches[0].clientY - startY;

			if (delta > 0) {
				phase = 'pulling';
				pullDistance = Math.min(delta * RESISTANCE, MAX_PULL);
				if (pullDistance > 5) {
					e.preventDefault();
				}
			} else if (phase === 'pulling') {
				phase = 'idle';
				pullDistance = 0;
			}
		}

		function onTouchEnd() {
			if (phase !== 'pulling') return;

			if (pullDistance >= THRESHOLD) {
				// Phase: settling → smoothly animate to loading position
				phase = 'settling';
				pullDistance = SETTLED_HEIGHT;

				// After settle animation completes, start loading
				setTimeout(() => {
					phase = 'loading';

					// Safety timeout — force-complete if invalidateAll() hangs
					const safetyTimer = setTimeout(() => doComplete(), 8000);

					invalidateAll()
						.then(() => { clearTimeout(safetyTimer); doComplete(); })
						.catch(() => { clearTimeout(safetyTimer); doComplete(); });
				}, 280);
			} else {
				// Didn't reach threshold — snap back
				phase = 'leaving';
				pullDistance = 0;
				setTimeout(() => (phase = 'idle'), 300);
			}
		}

		function doComplete() {
			// Guard: doComplete can be called by both the safety timer and
			// invalidateAll resolve/reject — only execute the first call.
			if (phase !== 'loading') return;

			// Phase: done → checkmark flash
			phase = 'done';

			// Hold checkmark briefly, then collapse
			setTimeout(() => {
				phase = 'leaving';
				pullDistance = 0;

				// After collapse animation, fully reset
				setTimeout(() => (phase = 'idle'), 350);
			}, 600);
		}

		scrollEl.addEventListener('touchstart', onTouchStart, { passive: true });
		scrollEl.addEventListener('touchmove', onTouchMove, { passive: false });
		scrollEl.addEventListener('touchend', onTouchEnd, { passive: true });

		return () => {
			scrollEl.removeEventListener('touchstart', onTouchStart);
			scrollEl.removeEventListener('touchmove', onTouchMove);
			scrollEl.removeEventListener('touchend', onTouchEnd);
		};
	});

	const indicatorOpacity = $derived(
		phase === 'pulling'
			? Math.min(pullDistance / THRESHOLD, 1)
			: phase === 'leaving'
				? 0
				: 1
	);
	const indicatorRotation = $derived((pullDistance / THRESHOLD) * 360);
	const showIndicator = $derived(phase !== 'idle');
	const animate = $derived(phase !== 'pulling');
</script>

<div id="scroll-root" bind:this={scrollEl}>
	{#if showIndicator}
		<div
			class="ptr-indicator"
			class:ptr-animate={animate}
			style="height: {pullDistance}px; opacity: {indicatorOpacity}"
		>
			<div class="ptr-icon-wrap">
				{#if phase === 'done'}
					<!-- Checkmark with pop-in -->
					<div class="ptr-icon ptr-done">
						<Check size={20} weight="bold" />
					</div>
				{:else if phase === 'loading' || phase === 'settling'}
					<!-- Spinner -->
					<div class="ptr-icon ptr-spinning">
						<ArrowClockwise size={20} weight="bold" />
					</div>
				{:else}
					<!-- Pull arrow — rotates with drag -->
					<div
						class="ptr-icon"
						style="transform: rotate({indicatorRotation}deg)"
					>
						<ArrowClockwise size={20} weight="bold" />
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{@render children()}
</div>

<style>
	.ptr-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		overflow: hidden;
		color: var(--text-secondary);
	}

	.ptr-indicator.ptr-animate {
		transition:
			height 320ms cubic-bezier(0.25, 0.1, 0.25, 1),
			opacity 320ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.ptr-icon-wrap {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
	}

	.ptr-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--surface-raised);
		border: 1px solid var(--border-default);
		box-shadow: var(--shadow-sm);
	}

	/* Spinner: continuous rotation */
	.ptr-icon.ptr-spinning {
		animation: ptr-spin 700ms linear infinite;
	}

	/* Checkmark: pop-in scale */
	.ptr-icon.ptr-done {
		color: var(--accent-primary);
		border-color: var(--accent-primary);
		animation: ptr-pop 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes ptr-spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes ptr-pop {
		0% {
			transform: scale(0.6);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ptr-indicator {
			transition: none !important;
		}
		.ptr-icon.ptr-spinning {
			animation: none;
		}
		.ptr-icon.ptr-done {
			animation: none;
		}
	}
</style>
