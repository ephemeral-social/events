<script lang="ts">
	import { CheckCircle, ArrowLeft } from 'phosphor-svelte';
	import { onMount } from 'svelte';
	import TicketCard from '$lib/components/tickets/TicketCard.svelte';

	let { data } = $props();

	let tickets = $state<
		Array<{
			ticket_id: string;
			status: string;
			checked_in?: boolean;
			checked_in_at?: string;
		}>
	>([]);
	let loading = $state(true);
	let error = $state('');
	let eventTitle = $state('Event');

	onMount(loadTickets);

	async function loadTickets() {
		loading = true;
		try {
			const eventRes = await fetch(`/api/events/by-slug/${data.slug}`);
			if (!eventRes.ok) {
				error = 'Could not load event';
				return;
			}
			const eventData = (await eventRes.json()) as { event?: { event_id: string; title?: string } };
			const eventId = eventData.event?.event_id;
			if (eventData.event?.title) eventTitle = eventData.event.title;
			if (!eventId) {
				error = 'Event not found';
				return;
			}

			const ticketRes = await fetch(`/api/events/${eventId}/tickets`);
			const ticketData = (await ticketRes.json()) as {
				tickets?: typeof tickets;
				error?: string;
			};

			if (!ticketRes.ok) {
				error = ticketData.error || 'Could not load tickets';
				return;
			}

			tickets = ticketData.tickets || [];
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Ticket Confirmed — Ephemeral</title>
</svelte:head>

<main class="mx-auto w-full max-w-lg px-4 py-6 space-y-6">
	<a
		href="/e/{data.slug}"
		class="flex items-center gap-2 text-body-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
	>
		<ArrowLeft size={16} weight="regular" />
		Back to event
	</a>

	<div class="text-center space-y-3">
		<div
			class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary)]/15"
		>
			<CheckCircle size={40} weight="duotone" class="text-[var(--accent-primary)]" />
		</div>
		<h1 class="text-headline-md text-[var(--text-primary)]">You're in!</h1>
		<p class="text-body-md text-[var(--text-secondary)]">Your ticket has been confirmed.</p>
	</div>

	{#if loading}
		<p class="text-body-sm text-[var(--text-muted)] text-center">Loading your ticket...</p>
	{:else if error}
		<p class="text-body-sm text-[var(--feedback-error)] text-center">{error}</p>
	{:else if tickets.length === 0}
		<p class="text-body-sm text-[var(--text-muted)] text-center">
			Your ticket is being processed. This usually takes a few seconds — try refreshing.
		</p>
	{:else}
		{#each tickets as ticket (ticket.ticket_id)}
			<TicketCard {ticket} {eventTitle} />
		{/each}
	{/if}
</main>
