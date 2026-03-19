<script lang="ts">
	import { CheckCircle, SpinnerGap } from 'phosphor-svelte';

	interface Ticket {
		ticket_id: string;
		display_name?: string;
		username?: string;
		status: string;
		checked_in?: boolean;
		checked_in_at?: string;
		ticket_number?: number;
	}

	interface Props {
		ticket: Ticket;
		onCheckIn: (ticketId: string) => void;
		checking: boolean;
	}

	let { ticket, onCheckIn, checking }: Props = $props();

	const initials = $derived(
		(ticket.display_name || ticket.username || '?').charAt(0).toUpperCase()
	);

	const displayName = $derived(ticket.display_name || ticket.username || 'Guest');

	const isCheckedIn = $derived(
		ticket.checked_in || ticket.status === 'used'
	);

	const isRefunded = $derived(ticket.status === 'refunded');
</script>

<div class="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3">
	<!-- Initials circle -->
	<div
		class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-label-md font-semibold
			{isCheckedIn
			? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
			: isRefunded
				? 'bg-[var(--feedback-error)]/15 text-[var(--feedback-error)]'
				: 'bg-[var(--surface-overlay)] text-[var(--text-secondary)]'}"
	>
		{initials}
	</div>

	<!-- Name + ticket number -->
	<div class="min-w-0 flex-1">
		<p class="truncate text-body-md font-medium text-[var(--text-primary)]">{displayName}</p>
		{#if ticket.ticket_number}
			<p class="text-caption text-[var(--text-muted)]">#{ticket.ticket_number}</p>
		{/if}
	</div>

	<!-- Status / action -->
	{#if isCheckedIn}
		<div class="flex items-center gap-1.5 text-[var(--accent-primary)]">
			<CheckCircle size={18} weight="bold" />
			<span class="text-label-sm font-medium">Checked In</span>
		</div>
	{:else if isRefunded}
		<span class="text-label-sm font-medium text-[var(--feedback-error)]">Refunded</span>
	{:else if checking}
		<div class="flex items-center gap-1.5 text-[var(--text-muted)]">
			<SpinnerGap size={18} weight="bold" class="animate-spin" />
		</div>
	{:else}
		<button
			class="rounded-full bg-[var(--accent-primary)] px-3.5 py-1.5 text-label-sm font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)]"
			onclick={() => onCheckIn(ticket.ticket_id)}
		>
			Check In
		</button>
	{/if}
</div>
