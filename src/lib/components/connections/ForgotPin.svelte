<script lang="ts">
	import { Warning, ArrowLeft } from 'phosphor-svelte';
	import { Button } from '$lib/components/ui/button';
	import { resetAndReextract, isLoading, getError } from '$lib/stores/connections.svelte';

	interface Props {
		onBack: () => void;
		onReset: () => void;
	}

	let { onBack, onReset }: Props = $props();

	let confirmed = $state(false);

	async function handleReset() {
		await resetAndReextract();
		if (!getError()) {
			onReset();
		}
	}
</script>

<div class="flex flex-col items-center py-8 px-4">
	<div
		class="flex h-16 w-16 items-center justify-center rounded-2xl mb-6"
		style="background: rgba(232, 93, 4, 0.15)"
	>
		<Warning size={28} weight="regular" color="var(--feedback-error)" />
	</div>

	<h3 class="text-headline-sm text-[var(--text-primary)] mb-2 text-center">Forgot PIN?</h3>

	<p class="text-body-sm text-[var(--text-muted)] mb-6 text-center max-w-xs">
		Resetting your PIN will delete your current connection data and re-extract it from your event
		history. You will need to set up a new PIN.
	</p>

	<div
		class="w-full max-w-xs rounded-xl border border-[var(--feedback-error)]/30 p-4 mb-6"
		style="background: rgba(232, 93, 4, 0.06)"
	>
		<p class="text-body-sm text-[var(--feedback-error)] font-medium mb-1">
			This action cannot be undone
		</p>
		<p class="text-body-sm text-[var(--text-muted)]">
			Your encrypted connection data will be permanently deleted and rebuilt from scratch.
		</p>
	</div>

	{#if !confirmed}
		<div class="flex flex-col gap-3 w-full max-w-xs">
			<Button
				variant="destructive"
				onclick={() => (confirmed = true)}
			>
				I understand, reset my PIN
			</Button>
			<button
				class="flex items-center justify-center gap-2 text-body-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
				onclick={onBack}
			>
				<ArrowLeft size={16} weight="regular" />
				Go back
			</button>
		</div>
	{:else}
		<div class="flex flex-col gap-3 w-full max-w-xs">
			<Button
				variant="destructive"
				disabled={isLoading()}
				onclick={handleReset}
			>
				{isLoading() ? 'Resetting...' : 'Confirm reset'}
			</Button>
			{#if getError()}
				<p class="text-body-sm text-[var(--feedback-error)] text-center">{getError()}</p>
			{/if}
			<button
				class="text-body-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
				onclick={() => (confirmed = false)}
			>
				Cancel
			</button>
		</div>
	{/if}
</div>
