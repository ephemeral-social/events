<script lang="ts">
	import { onMount } from 'svelte';
	import { CheckCircle } from 'phosphor-svelte';

	interface Guest {
		display_name?: string;
		user_display_name?: string;
		username?: string;
		status: string;
		plus_ones?: number;
		payment_status?: string;
		checked_in?: boolean;
		checked_in_at?: string;
	}

	interface Props {
		eventId: string;
		isHost?: boolean;
		isTicketed?: boolean;
	}

	let { eventId, isHost = false, isTicketed = false }: Props = $props();

	let guests = $state<Guest[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let error = $state('');

	async function loadGuests() {
		if (loaded) return;
		loading = true;
		error = '';

		try {
			const res = await fetch(`/api/events/${eventId}/guest-list`);
			const data = (await res.json()) as {
				data?: Guest[];
				error?: string;
			};

			if (!res.ok) {
				error = data.error || 'Unable to load guest list';
				return;
			}

			guests = data.data || [];
		} catch {
			error = 'Network error';
		} finally {
			loaded = true;
			loading = false;
		}
	}

	function guestSortKey(g: Guest): number {
		if (g.checked_in) return 0;
		const isPaid = g.payment_status === 'paid' || g.payment_status === 'marked_paid';
		if (isPaid) return 1;
		return 2;
	}

	const goingGuests = $derived(
		guests
			.filter((g) => g.status === 'going')
			.toSorted((a, b) => (isHost && isTicketed ? guestSortKey(a) - guestSortKey(b) : 0))
	);
	const maybeGuests = $derived(guests.filter((g) => g.status === 'maybe'));
	const declinedGuests = $derived(guests.filter((g) => g.status === 'declined'));

	onMount(() => {
		loadGuests();
	});
</script>

<div class="space-y-4">
	{#if loading}
		<p class="text-body-sm text-[var(--text-muted)]">Loading...</p>
	{/if}

	{#if error}
		<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
	{/if}

	{#if loaded}
		{#if goingGuests.length > 0}
			<div class="space-y-2">
				<p class="text-label-sm text-[var(--text-muted)]">Going ({goingGuests.length})</p>
				{#each goingGuests as guest (guest.display_name || guest.user_display_name || guest.username)}
					<div class="flex items-center justify-between py-1">
						<span class="text-body-sm text-[var(--text-primary)]">
							{guest.display_name || guest.user_display_name || guest.username || 'Guest'}
							{#if guest.plus_ones && guest.plus_ones > 0}
								<span class="text-[var(--text-muted)]">+{guest.plus_ones}</span>
							{/if}
						</span>
						{#if isHost && isTicketed}
							{@const isPaid = guest.payment_status === 'paid' || guest.payment_status === 'marked_paid'}
							{@const isRefunded = guest.payment_status === 'refunded'}
							<div class="flex items-center gap-2">
								{#if guest.checked_in}
									<span class="flex items-center gap-1 text-caption text-[var(--accent-primary)]">
										<CheckCircle size={14} weight="bold" />
										Checked in
									</span>
								{/if}
								{#if guest.payment_status}
									<span
										class="text-caption {isPaid
											? guest.checked_in ? 'text-[var(--text-muted)]' : 'text-[var(--accent-primary)]'
											: isRefunded
												? 'text-[var(--feedback-error)]'
												: 'text-[var(--text-muted)]'}"
									>
										{isPaid ? 'Paid' : isRefunded ? 'Refunded' : 'Unpaid'}
									</span>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if maybeGuests.length > 0}
			<div class="space-y-2">
				<p class="text-label-sm text-[var(--text-muted)]">Maybe ({maybeGuests.length})</p>
				{#each maybeGuests as guest (guest.display_name || guest.user_display_name || guest.username)}
					<div class="py-1">
						<span class="text-body-sm text-[var(--text-secondary)]">
							{guest.display_name || guest.user_display_name || guest.username || 'Guest'}
						</span>
					</div>
				{/each}
			</div>
		{/if}

		{#if isHost && declinedGuests.length > 0}
			<div class="space-y-2">
				<p class="text-label-sm text-[var(--text-muted)]">
					Can't make it ({declinedGuests.length})
				</p>
				{#each declinedGuests as guest (guest.display_name || guest.user_display_name || guest.username)}
					<div class="py-1">
						<span class="text-body-sm text-[var(--text-muted)]">
							{guest.display_name || guest.user_display_name || guest.username || 'Guest'}
						</span>
					</div>
				{/each}
			</div>
		{/if}

		{#if guests.length === 0}
			<p class="text-body-sm text-[var(--text-muted)]">No guests yet</p>
		{/if}
	{/if}
</div>
