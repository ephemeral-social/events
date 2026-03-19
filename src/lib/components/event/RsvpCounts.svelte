<script lang="ts">
	import { Users } from 'phosphor-svelte';
	import type { RsvpCounts as RsvpCountsType } from '$lib/utils/event-helpers';
	import { getSpotsRemaining, type PublicEvent } from '$lib/utils/event-helpers';

	interface Props {
		counts: RsvpCountsType;
		event: PublicEvent;
	}

	let { counts, event }: Props = $props();

	const spotsLeft = $derived(getSpotsRemaining(event, counts));
</script>

<div class="flex items-center gap-4">
	<div class="flex items-center gap-2 text-[var(--text-secondary)]">
		<Users size={18} weight="regular" />
		<span class="text-body-md">
			<span class="font-medium text-[var(--text-primary)]">{counts.going}</span> going
		</span>
	</div>

	{#if counts.maybe > 0}
		<span class="text-body-md text-[var(--text-muted)]">
			{counts.maybe} maybe
		</span>
	{/if}

	{#if spotsLeft !== null && spotsLeft <= 10}
		<span class="text-body-sm font-medium text-[var(--feedback-warning)]">
			{spotsLeft === 0 ? 'Full' : `${spotsLeft} spots left`}
		</span>
	{/if}
</div>
