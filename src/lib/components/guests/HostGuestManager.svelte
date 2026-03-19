<script lang="ts">
	import { onMount } from 'svelte';
	import { Trash, CheckCircle } from 'phosphor-svelte';
	import { toastSuccess, toastError } from '$lib/stores/toast.svelte';

	interface Guest {
		user_id?: string;
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
	}

	let { eventId }: Props = $props();

	let guests = $state<Guest[]>([]);
	let loading = $state(false);
	let loaded = $state(false);
	let error = $state('');
	let removingId = $state<string | null>(null);

	function guestName(g: Guest): string {
		return g.display_name || g.user_display_name || g.username || 'Guest';
	}

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

	async function removeGuest(guest: Guest) {
		const name = guestName(guest);
		const confirmed = confirm(`Remove ${name} from this event?\n\nThis is irreversible and they won't be notified.`);
		if (!confirmed) return;

		const userId = guest.user_id;
		if (!userId) return;

		removingId = userId;
		try {
			const res = await fetch(`/api/events/${eventId}/guests/${userId}`, {
				method: 'DELETE'
			});

			if (res.ok) {
				guests = guests.filter((g) => g.user_id !== userId);
				toastSuccess('Guest removed');
			} else {
				const data = (await res.json()) as { error?: string };
				toastError(data.error || 'Failed to remove guest');
			}
		} catch {
			toastError('Network error');
		} finally {
			removingId = null;
		}
	}

	const goingGuests = $derived(guests.filter((g) => g.status === 'going'));
	const maybeGuests = $derived(guests.filter((g) => g.status === 'maybe'));
	const declinedGuests = $derived(guests.filter((g) => g.status === 'declined'));

	onMount(() => {
		loadGuests();
	});
</script>

<div class="space-y-4">
	<h3 class="text-label-md font-medium text-[var(--text-primary)]">Manage Guests</h3>

	{#if loading}
		<p class="text-body-sm text-[var(--text-muted)]">Loading...</p>
	{/if}

	{#if error}
		<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
	{/if}

	{#if loaded}
		{#snippet guestRow(guest: Guest)}
			<div class="flex items-center justify-between py-1.5">
				<span class="text-body-sm text-[var(--text-primary)]">
					{guestName(guest)}
					{#if guest.plus_ones && guest.plus_ones > 0}
						<span class="text-[var(--text-muted)]">+{guest.plus_ones}</span>
					{/if}
				</span>
				<div class="flex items-center gap-2">
					{#if guest.checked_in}
						<span class="flex items-center gap-1 text-caption text-[var(--accent-primary)]">
							<CheckCircle size={14} weight="bold" />
						</span>
					{/if}
					{#if guest.user_id}
						<button
							class="rounded-full p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--feedback-error)]/10 hover:text-[var(--feedback-error)] disabled:opacity-40"
							onclick={() => removeGuest(guest)}
							disabled={removingId === guest.user_id}
							aria-label="Remove {guestName(guest)}"
						>
							<Trash size={16} weight="regular" />
						</button>
					{/if}
				</div>
			</div>
		{/snippet}

		{#if goingGuests.length > 0}
			<div class="space-y-1">
				<p class="text-label-sm text-[var(--text-muted)]">Going ({goingGuests.length})</p>
				{#each goingGuests as guest (guest.user_id || guestName(guest))}
					{@render guestRow(guest)}
				{/each}
			</div>
		{/if}

		{#if maybeGuests.length > 0}
			<div class="space-y-1">
				<p class="text-label-sm text-[var(--text-muted)]">Maybe ({maybeGuests.length})</p>
				{#each maybeGuests as guest (guest.user_id || guestName(guest))}
					{@render guestRow(guest)}
				{/each}
			</div>
		{/if}

		{#if declinedGuests.length > 0}
			<div class="space-y-1">
				<p class="text-label-sm text-[var(--text-muted)]">Can't make it ({declinedGuests.length})</p>
				{#each declinedGuests as guest (guest.user_id || guestName(guest))}
					{@render guestRow(guest)}
				{/each}
			</div>
		{/if}

		{#if guests.length === 0}
			<p class="text-body-sm text-[var(--text-muted)]">No guests yet</p>
		{/if}
	{/if}
</div>
