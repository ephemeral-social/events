<script lang="ts">
	import { getSaveStatus } from '$lib/stores/event-draft.svelte';
	import { CircleNotch, CheckCircle, Warning } from 'phosphor-svelte';

	const status = $derived(getSaveStatus());
</script>

{#if status !== 'idle'}
	<div class="save-status save-status--{status}" data-testid="save-status">
		{#if status === 'saving'}
			<CircleNotch size={16} class="spin" />
			<span>Saving...</span>
		{:else if status === 'saved'}
			<CheckCircle size={16} />
			<span>Saved</span>
		{:else if status === 'error'}
			<Warning size={16} />
			<span>Error</span>
		{/if}
	</div>
{/if}

<style>
	.save-status {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem;
		color: #a39e96;
	}

	.save-status--saving {
		color: #a39e96;
	}

	.save-status--saved {
		color: #52b788;
	}

	.save-status--error {
		color: #e85d04;
	}

	:global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
