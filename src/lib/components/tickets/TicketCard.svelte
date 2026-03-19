<script lang="ts">
	import { Ticket, QrCode } from 'phosphor-svelte';
	import DOMPurify from 'dompurify';
	import QRCode from 'qrcode';

	interface TicketData {
		ticket_id: string;
		status: string;
		checked_in?: boolean;
		checked_in_at?: string;
	}

	interface Props {
		ticket: TicketData;
		eventTitle: string;
	}

	let { ticket, eventTitle }: Props = $props();

	let qrSvg = $state('');
	let qrError = $state(false);

	const statusLabel = $derived(
		ticket.status === 'active'
			? ticket.checked_in
				? 'Checked In'
				: 'Active'
			: ticket.status === 'used'
				? 'Used'
				: ticket.status === 'refunded'
					? 'Refunded'
					: ticket.status
	);

	const statusColor = $derived(
		ticket.status === 'active' && !ticket.checked_in
			? 'text-[var(--accent-primary)]'
			: ticket.status === 'refunded'
				? 'text-[var(--feedback-error)]'
				: 'text-[var(--text-muted)]'
	);

	$effect(() => {
		if (ticket.ticket_id && ticket.status === 'active' && !ticket.checked_in) {
			QRCode.toString(ticket.ticket_id, { type: 'svg', margin: 1, width: 200 })
				.then((svg) => {
					qrSvg = svg;
					qrError = false;
				})
				.catch(() => {
					qrError = true;
				});
		}
	});
</script>

<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Ticket size={18} weight="duotone" class="text-[var(--accent-primary)]" />
			<span class="text-label-md font-medium text-[var(--text-primary)]">{eventTitle}</span>
		</div>
		<span class="text-label-sm font-medium {statusColor}">{statusLabel}</span>
	</div>

	{#if ticket.status === 'active' && !ticket.checked_in}
		{#if qrSvg}
			<div class="flex justify-center rounded-lg bg-[var(--text-primary)] p-4">
				{@html DOMPurify.sanitize(qrSvg, {
					USE_PROFILES: { svg: true, svgFilters: true }
				})}
			</div>
			<p class="text-caption text-[var(--text-muted)] text-center">Show this QR code at the door</p>
		{:else if qrError}
			<div class="flex flex-col items-center gap-2 py-6 text-[var(--text-muted)]">
				<QrCode size={48} weight="thin" />
				<p class="text-body-sm">Could not generate QR code</p>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-2 py-6 text-[var(--text-muted)]">
				<QrCode size={48} weight="thin" />
				<p class="text-body-sm">Generating QR code...</p>
			</div>
		{/if}
	{/if}

	<p class="text-caption text-[var(--text-muted)]">
		Ticket ID: {ticket.ticket_id.slice(0, 8)}...
	</p>
</div>
