<script lang="ts">
	import { Warning } from 'phosphor-svelte';

	interface Props {
		spotsLeft: number;
	}

	let { spotsLeft }: Props = $props();
</script>

{#if spotsLeft <= 10}
	<div
		class="flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm
			{spotsLeft === 0
			? 'bg-[var(--feedback-error)]/10 text-[var(--feedback-error)]'
			: 'bg-[var(--feedback-warning)]/10 text-[var(--feedback-warning)]'}"
	>
		<Warning size={16} weight="bold" />
		<span>
			{#if spotsLeft === 0}
				This event is full
			{:else}
				Only {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
			{/if}
		</span>
	</div>
{/if}
