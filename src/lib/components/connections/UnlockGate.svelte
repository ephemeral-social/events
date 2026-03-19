<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Lock } from 'phosphor-svelte';
	import PinInput from './PinInput.svelte';
	import {
		isUnlocked,
		isLoading,
		getHasKeys,
		getNeedsRestore,
		getError,
		unlockWithPin,
		checkLocal
	} from '$lib/stores/connections.svelte';
	import { onMount } from 'svelte';

	interface Props {
		children: Snippet;
		nokeys: Snippet;
	}

	let { children, nokeys }: Props = $props();

	let pinError = $state('');
	let pinInputRef: { clear: () => void } | undefined = $state();

	onMount(() => {
		checkLocal();
	});

	async function handlePinSubmit(pin: string) {
		pinError = '';
		const success = await unlockWithPin(pin);
		if (!success) {
			pinError = getError() || 'Incorrect PIN';
			pinInputRef?.clear();
		}
	}
</script>

{#if isUnlocked()}
	{@render children()}
{:else if !getHasKeys()}
	{@render nokeys()}
{:else}
	<!-- PIN unlock prompt -->
	<div class="flex flex-col items-center justify-center py-12 px-4">
		<div
			class="flex h-16 w-16 items-center justify-center rounded-2xl mb-6"
			style="background: var(--accent-muted)"
		>
			<Lock size={28} weight="regular" color="var(--accent-primary)" />
		</div>

		<h3 class="text-headline-sm text-[var(--text-primary)] mb-2 text-center">
			Unlock Connections
		</h3>
		<p class="text-body-sm text-[var(--text-muted)] mb-8 text-center max-w-xs">
			{#if getNeedsRestore()}
				Your session expired. Enter your PIN to restore access.
			{:else}
				Enter your 4-digit PIN to view your connections.
			{/if}
		</p>

		<PinInput
			bind:this={pinInputRef}
			onSubmit={handlePinSubmit}
			loading={isLoading()}
			error={pinError}
		/>
	</div>
{/if}
