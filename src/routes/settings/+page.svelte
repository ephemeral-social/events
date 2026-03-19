<script lang="ts">
	import { ArrowLeft, GearSix, Graph, ListBullets, Lock, ShieldCheck, Warning } from 'phosphor-svelte';
	import { onMount } from 'svelte';
	import PinInput from '$lib/components/connections/PinInput.svelte';
	import PinSetup from '$lib/components/connections/PinSetup.svelte';
	import SocialGraph from '$lib/components/connections/SocialGraph.svelte';
	import ConnectionList from '$lib/components/connections/ConnectionList.svelte';
	import ConnectionDetail from '$lib/components/connections/ConnectionDetail.svelte';
	import type { Connection } from '$lib/crypto/connections';
	import {
		getConnections,
		isUnlocked,
		isEnabled,
		updateEnabled,
		loadSettings,
		lock,
		extendLockTimer,
		fullReset,
		isLoading,
		getHasKeys,
		getNeedsRestore,
		getError,
		unlockWithPin,
		checkLocal
	} from '$lib/stores/connections.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let tab = $state<'graph' | 'list'>('graph');
	let selectedConnection = $state<Connection | null>(null);
	let detailOpen = $state(false);
	let showSetup = $state(false);
	let showResetConfirm = $state(false);
	let resetting = $state(false);
	let pinError = $state('');
	let pinInputRef: { clear: () => void } | undefined = $state();

	onMount(() => {
		loadSettings();
		checkLocal();
		return () => {
			// Defer lock() to avoid reactive state changes during Svelte's unmount cycle
			// (changing $state during unmount can interfere with SvelteKit navigation)
			setTimeout(() => lock(), 0);
		};
	});

	async function handlePinSubmit(pin: string) {
		pinError = '';
		const success = await unlockWithPin(pin);
		if (!success) {
			pinError = getError() || 'Incorrect PIN';
			pinInputRef?.clear();
		}
	}

	function handleSelect(connection: Connection) {
		extendLockTimer();
		selectedConnection = connection;
		detailOpen = true;
	}

	function handleDetailClose() {
		detailOpen = false;
		selectedConnection = null;
	}

	function handleSetupComplete() {
		showSetup = false;
	}

	async function handleConfirmReset() {
		resetting = true;
		await fullReset();
		resetting = false;
		showResetConfirm = false;
		showSetup = true;
	}
</script>

<svelte:head>
	<title>Settings — Ephemeral</title>
</svelte:head>

<!-- Reset confirmation dialog -->
{#if showResetConfirm}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="reset-title"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute inset-0 bg-black/60 backdrop-blur-sm"
			onmousedown={() => (showResetConfirm = false)}
		></div>

		<div class="relative w-full max-w-sm rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-6 space-y-4 shadow-2xl">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
					style="background: rgba(232, 93, 4, 0.15)"
				>
					<Warning size={20} weight="bold" color="var(--feedback-error)" />
				</div>
				<h3 id="reset-title" class="text-headline-sm text-[var(--text-primary)]">Reset connection data?</h3>
			</div>

			<p class="text-body-sm text-[var(--text-muted)]">
				This will permanently delete your encrypted connection data and PIN. You'll need to set up a new PIN afterwards.
			</p>

			<div
				class="rounded-lg border border-[var(--feedback-error)]/20 p-3"
				style="background: rgba(232, 93, 4, 0.06)"
			>
				<p class="text-body-sm text-[var(--feedback-error)]">
					This action cannot be undone.
				</p>
			</div>

			<div class="flex gap-3 pt-2">
				<button
					class="flex-1 rounded-full px-4 py-2.5 text-label-md font-medium text-[var(--text-secondary)] bg-[var(--surface-overlay)] transition-colors duration-150 hover:bg-[var(--surface-overlay)]/80 cursor-pointer"
					onclick={() => (showResetConfirm = false)}
					disabled={resetting}
				>
					Cancel
				</button>
				<button
					class="flex-1 rounded-full px-4 py-2.5 text-label-md font-semibold text-white transition-colors duration-150 cursor-pointer disabled:opacity-50"
					style="background: var(--feedback-error)"
					onclick={handleConfirmReset}
					disabled={resetting}
				>
					{resetting ? 'Resetting...' : 'Reset'}
				</button>
			</div>
		</div>
	</div>
{/if}

<main class="mx-auto w-full max-w-lg px-4 py-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<button
			onclick={() => goto('/events')}
			class="flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-150 hover:bg-[var(--surface-overlay)] cursor-pointer"
			aria-label="Back to Events"
		>
			<ArrowLeft size={20} weight="regular" class="text-[var(--text-secondary)]" />
		</button>
		<h1 class="text-headline-md text-[var(--text-primary)]">Settings</h1>
	</div>

	{#if showSetup}
		<PinSetup onComplete={handleSetupComplete} />
	{:else}
		<!-- Connections Section -->
		<section>
			<div class="flex items-center gap-2 mb-4">
				<GearSix size={20} weight="regular" class="text-[var(--text-muted)]" />
				<h2 class="text-label-lg text-[var(--text-primary)] font-semibold">Connections</h2>
			</div>

			{#if isUnlocked()}
				<!-- Unlocked: show connections content -->
				<div class="flex gap-1 rounded-full bg-[var(--surface-card)] p-1 mb-4">
					<button
						class="flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-label-sm font-medium transition-all duration-150 cursor-pointer
							{tab === 'graph'
							? 'bg-[var(--surface-overlay)] text-[var(--text-primary)]'
							: 'text-[var(--text-muted)]'}"
						onclick={() => { tab = 'graph'; extendLockTimer(); }}
					>
						<Graph size={14} weight="regular" />
						Graph
					</button>
					<button
						class="flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-label-sm font-medium transition-all duration-150 cursor-pointer
							{tab === 'list'
							? 'bg-[var(--surface-overlay)] text-[var(--text-primary)]'
							: 'text-[var(--text-muted)]'}"
						onclick={() => { tab = 'list'; extendLockTimer(); }}
					>
						<ListBullets size={14} weight="regular" />
						List
					</button>
				</div>

				{#if tab === 'graph'}
					<SocialGraph connections={getConnections()} onselect={handleSelect} />
				{:else}
					<ConnectionList connections={getConnections()} onselect={handleSelect} />
				{/if}

				<ConnectionDetail
					connection={selectedConnection}
					open={detailOpen}
					onClose={handleDetailClose}
				/>
			{:else if !getHasKeys()}
				<!-- No keys: show setup prompt -->
				<div class="flex flex-col items-center py-8">
					<div
						class="flex h-16 w-16 items-center justify-center rounded-2xl mb-6"
						style="background: var(--accent-muted)"
					>
						<ShieldCheck size={28} weight="regular" color="var(--accent-primary)" />
					</div>
					<h3 class="text-headline-sm text-[var(--text-primary)] mb-2 text-center">
						Connections
					</h3>
					<p class="text-body-sm text-[var(--text-muted)] mb-6 text-center max-w-xs">
						See who you have been to events with. Your connection data is end-to-end encrypted
						with a PIN only you know.
					</p>
					<button
						class="rounded-full bg-[var(--accent-primary)] px-6 py-2.5 text-label-md font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] cursor-pointer"
						onclick={() => (showSetup = true)}
					>
						Get started
					</button>
				</div>
			{:else}
				<!-- Has keys but locked: show PIN prompt -->
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
		</section>

		<!-- Settings Section -->
		<section>
			<div
				class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-4"
			>
				<div class="flex items-center justify-between">
					<div>
						<p class="text-body-md text-[var(--text-primary)]">Enable connections</p>
						<p class="text-body-sm text-[var(--text-muted)]">
							Track who you attend events with
						</p>
					</div>
					<button
						role="switch"
						aria-checked={isEnabled()}
						aria-label="Enable connections"
						class="relative h-7 w-12 rounded-full transition-colors duration-200 cursor-pointer
							{isEnabled() ? 'bg-[var(--accent-primary)]' : 'bg-[var(--surface-overlay)]'}"
						onclick={() => updateEnabled(!isEnabled())}
					>
						<div
							class="absolute top-0.5 h-6 w-6 rounded-full bg-[var(--text-primary)] shadow transition-transform duration-200
								{isEnabled() ? 'translate-x-5.5' : 'translate-x-0.5'}"
						></div>
					</button>
				</div>
			</div>
		</section>

		<!-- Danger zone -->
		<section>
			<div
				class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4"
			>
				<p class="text-label-sm text-[var(--text-muted)] mb-3 uppercase tracking-wider">
					Danger zone
				</p>
				<button
					class="text-body-sm text-[var(--feedback-error)] hover:underline cursor-pointer"
					onclick={() => (showResetConfirm = true)}
				>
					Forgot PIN? Reset connection data
				</button>
			</div>
		</section>
	{/if}
</main>
