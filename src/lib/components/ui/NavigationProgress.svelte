<!--
  Navigation progress bar — thin accent bar at the top of the viewport.
  Shows during SSR load (between click and page transition).
  150ms delay so fast navigations never flash it.
-->
<script lang="ts">
	import { navigating } from '$app/stores';

	let visible = $state(false);
	let completing = $state(false);
	let delayTimer: ReturnType<typeof setTimeout> | undefined;
	let fadeTimer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if ($navigating) {
			// Navigation started — wait 150ms before showing
			completing = false;
			delayTimer = setTimeout(() => {
				visible = true;
			}, 150);
		} else if (visible) {
			// Navigation finished while bar is visible — snap to 100% then fade
			clearTimeout(delayTimer);
			completing = true;
			fadeTimer = setTimeout(() => {
				visible = false;
				completing = false;
			}, 300);
		} else {
			// Navigation finished before 150ms delay — never show
			clearTimeout(delayTimer);
		}

		return () => {
			clearTimeout(delayTimer);
			clearTimeout(fadeTimer);
		};
	});
</script>

{#if visible}
	<div
		class="navigation-progress"
		class:completing
		aria-hidden="true"
	></div>
{/if}

<style>
	.navigation-progress {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 2px;
		z-index: 9999;
		background-color: var(--accent-primary);
		box-shadow: 0 0 8px var(--accent-glow);
		transform-origin: left;
		transform: scaleX(0);
		animation: progress-grow 8s cubic-bezier(0.1, 0.5, 0.1, 0.8) forwards;
	}

	.navigation-progress.completing {
		animation: none;
		transform: scaleX(1);
		opacity: 0;
		transition:
			transform 100ms ease-out,
			opacity 300ms ease-out;
	}

	@keyframes progress-grow {
		0% {
			transform: scaleX(0);
		}
		20% {
			transform: scaleX(0.5);
		}
		60% {
			transform: scaleX(0.7);
		}
		100% {
			transform: scaleX(0.8);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.navigation-progress {
			animation: none;
			transform: scaleX(1);
			opacity: 0.6;
		}

		.navigation-progress.completing {
			opacity: 0;
			transition: opacity 300ms ease-out;
		}
	}
</style>
