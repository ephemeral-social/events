<script lang="ts">
	import { animate } from 'motion';
	import { motionOk } from '../utils/reduced-motion.svelte';
	import { duration as durationTokens, motionEase } from '../tokens';

	interface Props {
		value: number;
		duration?: number;
		format?: (n: number) => string;
		class?: string;
	}

	let {
		value,
		duration = durationTokens.standard,
		format = (n: number) => Math.round(n).toString(),
		class: className
	}: Props = $props();

	let displayValue = $state(value); // eslint-disable-line svelte/valid-compile -- intentionally captures initial value; $effect updates it
	let proxy = { value: value as number }; // eslint-disable-line svelte/valid-compile -- proxy object for motion interpolation
	let currentControls: ReturnType<typeof animate> | undefined;

	$effect(() => {
		if (!motionOk()) {
			displayValue = value;
			return;
		}

		currentControls = animate(proxy, { value }, {
			duration: duration / 1000,
			ease: motionEase.standard,
			onUpdate: (latest) => {
				displayValue = proxy.value;
			}
		});

		return () => currentControls?.stop();
	});
</script>

<span class={className}>{format(displayValue)}</span>
