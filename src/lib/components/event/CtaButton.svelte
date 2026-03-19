<script lang="ts">
	import { type PublicEvent, type RsvpCounts } from '$lib/utils/event-helpers';
	import { getSpotsRemaining } from '$lib/utils/event-helpers';
	import { hapticLight } from '$lib/utils/haptics';

	interface Props {
		event: PublicEvent;
		rsvpCounts: RsvpCounts;
		onAction: () => void;
	}

	let { event, rsvpCounts, onAction }: Props = $props();

	function handleTap() {
		if (!isFull) hapticLight();
		onAction();
	}

	const spotsLeft = $derived(getSpotsRemaining(event, rsvpCounts));
	const isFull = $derived(spotsLeft !== null && spotsLeft === 0);
</script>

<button
	class="w-full rounded-full px-6 py-3 text-label-lg font-semibold transition-all duration-150
		{isFull
		? 'cursor-not-allowed bg-[var(--surface-overlay)] text-[var(--text-muted)]'
		: 'bg-[var(--accent-primary)] text-[var(--surface-base)] hover:bg-[var(--accent-hover)] active:scale-[0.98]'}"
	disabled={isFull}
	onclick={handleTap}
>
	{#if isFull}
		Event is full
	{:else}
		RSVP
	{/if}
</button>
