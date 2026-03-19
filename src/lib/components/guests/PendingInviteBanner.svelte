<script lang="ts">
	import { Envelope, CircleNotch } from 'phosphor-svelte';
	import { toastSuccess, toastError } from '$lib/stores/toast.svelte';

	let {
		eventId,
		pendingCount,
		ticketingReady = false
	}: {
		eventId: string;
		pendingCount: number;
		ticketingReady?: boolean;
	} = $props();

	let releasing = $state(false);

	async function releaseInvites() {
		releasing = true;
		try {
			const res = await fetch(`/api/events/${eventId}/invites/release`, {
				method: 'POST'
			});
			const data = await res.json();
			if (!res.ok) {
				toastError(data.error || 'Failed to release invites');
				return;
			}
			toastSuccess(`${data.released} invite${data.released !== 1 ? 's' : ''} sent!`);
			pendingCount = 0;
		} catch {
			toastError('Failed to release invites');
		} finally {
			releasing = false;
		}
	}
</script>

{#if pendingCount > 0}
	<div class="rounded-xl bg-[var(--surface-card)] border border-[var(--border-default)] p-4 flex flex-col gap-2">
		<div class="flex items-start gap-3">
			<div class="mt-0.5">
				<Envelope size={20} weight="duotone" class="text-[var(--accent-primary)]" />
			</div>
			<div class="flex-1">
				{#if ticketingReady}
					<p class="text-body-sm text-[var(--text-primary)]">
						Ticketing is ready! Release your {pendingCount} pending invite{pendingCount !== 1 ? 's' : ''}.
					</p>
				{:else}
					<p class="text-body-sm text-[var(--text-secondary)]">
						Your {pendingCount} invite{pendingCount !== 1 ? 's are' : ' is'} pending until ticketing is finalized.
					</p>
				{/if}
			</div>
		</div>
		{#if ticketingReady}
			<button
				onclick={releaseInvites}
				disabled={releasing}
				class="self-end flex items-center gap-1.5 rounded-full px-4 py-1.5 text-label-sm font-medium
					bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-colors
					disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{#if releasing}
					<CircleNotch size={14} class="animate-spin" />
				{/if}
				Release Invites
			</button>
		{/if}
	</div>
{/if}
