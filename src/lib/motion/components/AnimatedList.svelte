<script lang="ts">
	import autoAnimate from '@formkit/auto-animate';
	import { motionOk } from '../utils/reduced-motion.svelte';
	import { duration as durationTokens, cssEase } from '../tokens';
	import type { Snippet } from 'svelte';

	interface Props {
		duration?: number;
		easing?: string;
		class?: string;
		children?: Snippet;
	}

	let {
		duration = durationTokens.standard,
		easing = cssEase.standard,
		class: className,
		children
	}: Props = $props();

	let container: HTMLElement | undefined = $state();

	$effect(() => {
		if (!container || !motionOk()) return;
		const controller = autoAnimate(container, { duration, easing });
		return () => {
			if (controller && typeof controller.destroy === 'function') {
				controller.destroy();
			}
		};
	});
</script>

<div bind:this={container} class={className}>
	{#if children}
		{@render children()}
	{/if}
</div>
