<script lang="ts">
	import { MagnifyingGlass, UserCircle, CheckCircle, PaperPlaneTilt, CircleNotch, Gear } from 'phosphor-svelte';
	import { toastSuccess, toastError } from '$lib/stores/toast.svelte';
	import { hapticLight, hapticSuccess } from '$lib/utils/haptics';
	import UnlockGate from '$lib/components/connections/UnlockGate.svelte';
	import { getConnections } from '$lib/stores/connections.svelte';
	import type { Connection } from '$lib/crypto/connections';
	import { onMount } from 'svelte';

	let { eventId, onInvitesSent }: { eventId: string; onInvitesSent?: (count: number) => void } =
		$props();

	// All RSVPs for this event (any status) — used to disable already-invited connections
	let allRsvps = $state<Array<{ user_id: string; status: string }>>([]);
	let loadingRsvps = $state(true);
	let selected = $state(new Set<string>());
	let sending = $state(false);
	let search = $state('');

	// Build a map of user_id → status for fast lookup
	const rsvpMap = $derived(new Map(allRsvps.map((r) => [r.user_id, r.status])));

	const connections = $derived(getConnections());

	const filtered = $derived(
		search.trim()
			? connections.filter((c) =>
					c.display_name.toLowerCase().includes(search.trim().toLowerCase())
				)
			: connections
	);

	const canSend = $derived(selected.size > 0 && !sending);

	async function fetchAllRsvps() {
		loadingRsvps = true;
		try {
			const res = await fetch(`/api/events/${eventId}/invites`);
			if (res.ok) {
				const data = await res.json();
				allRsvps = (data as any).all_rsvps || [];
			}
		} catch {
			// Non-critical — just means we can't disable checkboxes
		} finally {
			loadingRsvps = false;
		}
	}

	onMount(() => {
		fetchAllRsvps();
	});

	function toggleSelection(userId: string) {
		hapticLight();
		const next = new Set(selected);
		if (next.has(userId)) {
			next.delete(userId);
		} else {
			next.add(userId);
		}
		selected = next;
	}

	function statusLabel(status: string): string {
		switch (status) {
			case 'going':
				return 'Going';
			case 'maybe':
				return 'Maybe';
			case 'declined':
			case 'not_going':
				return "Can't go";
			case 'invited':
				return 'Invited';
			default:
				return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
		}
	}

	async function sendInvites() {
		if (!canSend) return;
		sending = true;

		const invites = Array.from(selected).map((id) => ({ user_id: id }));

		try {
			const res = await fetch(`/api/events/${eventId}/invites`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ invites })
			});

			const data = await res.json();

			if (!res.ok) {
				toastError((data as any).error || 'Failed to send invites');
				return;
			}

			hapticSuccess();
			const created = (data as any).created;
			const msg =
				created > 0
					? `${created} invite${created > 1 ? 's' : ''} sent!`
					: 'All invitees were already invited.';
			const pendingSms = (data as any).pending_sms;
			if (pendingSms > 0) {
				toastSuccess(`${msg} (${pendingSms} pending until ticketing ready)`);
			} else {
				toastSuccess(msg);
			}

			// Clear selection and re-fetch RSVPs to update disabled states
			selected = new Set();
			onInvitesSent?.(created);
			await fetchAllRsvps();
		} catch {
			toastError('Failed to send invites');
		} finally {
			sending = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<h3 class="text-heading-sm font-serif text-[var(--text-primary)]">Invite Guests</h3>
	<p class="text-body-sm text-[var(--text-secondary)]">
		Select connections to invite to your event.
	</p>

	<UnlockGate>
		{#snippet nokeys()}
			<div class="flex flex-col items-center py-8 px-4 text-center">
				<Gear size={32} weight="regular" class="text-[var(--text-muted)] mb-3" />
				<p class="text-body-md text-[var(--text-secondary)] mb-1">
					Set up Connections first
				</p>
				<p class="text-body-sm text-[var(--text-muted)] mb-4 max-w-xs">
					Enable Connections in Settings to invite people you know.
				</p>
				<a
					href="/settings"
					class="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-body-sm font-medium bg-[var(--surface-overlay)] text-[var(--accent-primary)] hover:bg-[var(--border-default)] transition-colors"
				>
					Go to Settings
				</a>
			</div>
		{/snippet}
		{#snippet children()}
			<div class="flex flex-col">
				<!-- Sticky search bar -->
				<div class="sticky top-0 z-10 pb-3" style="background: var(--surface-overlay)">
					<div class="relative">
						<MagnifyingGlass
							size={18}
							weight="regular"
							class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
						/>
						<input
							type="text"
							placeholder="Search connections..."
							bind:value={search}
							style="font-size: 16px"
							class="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] py-2.5 pl-10 pr-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
						/>
					</div>
				</div>

				<!-- Connection list — no inner scroll, BottomSheet handles it -->
				{#if filtered.length === 0}
					<div class="py-8 text-center">
						<UserCircle size={40} weight="thin" class="mx-auto mb-2 text-[var(--text-muted)]" />
						<p class="text-body-sm text-[var(--text-muted)]">
							{search ? 'No matching connections' : 'No connections yet'}
						</p>
						{#if !search}
							<p class="text-body-sm text-[var(--text-muted)] mt-1">
								Attend events to build your network
							</p>
						{/if}
					</div>
				{:else}
					<div class="flex flex-col gap-1">
						{#each filtered as connection (connection.user_id)}
							{@const existingStatus = rsvpMap.get(connection.user_id)}
							{@const isDisabled = !!existingStatus}
							{@const isSelected = selected.has(connection.user_id)}

							<button
								class="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150
									{isDisabled
									? 'opacity-60 cursor-default'
									: isSelected
										? 'bg-[var(--accent-primary)]/10'
										: 'hover:bg-[var(--surface-overlay)] cursor-pointer'}"
								disabled={isDisabled}
								onclick={() => toggleSelection(connection.user_id)}
							>
								<!-- Checkbox / Status -->
								<div class="flex h-5 w-5 shrink-0 items-center justify-center">
									{#if isDisabled}
										<CheckCircle size={20} weight="fill" class="text-[var(--text-muted)]" />
									{:else if isSelected}
										<div class="h-5 w-5 rounded-md bg-[var(--accent-primary)] flex items-center justify-center">
											<svg width="12" height="12" viewBox="0 0 12 12" fill="none">
												<path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
											</svg>
										</div>
									{:else}
										<div class="h-5 w-5 rounded-md border-2 border-[var(--border-default)]"></div>
									{/if}
								</div>

								<!-- Avatar -->
								<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-overlay)]">
									{#if connection.avatar_r2_key}
										<img
											src="/api/media/{connection.avatar_r2_key}"
											alt={connection.display_name}
											class="h-10 w-10 rounded-full object-cover"
										/>
									{:else}
										<UserCircle size={24} weight="regular" class="text-[var(--text-muted)]" />
									{/if}
								</div>

								<!-- Info -->
								<div class="flex-1 min-w-0">
									<p class="text-body-md text-[var(--text-primary)] font-medium truncate">
										{connection.display_name}
									</p>
									<p class="text-body-sm text-[var(--text-muted)]">
										{connection.shared_events} shared event{connection.shared_events !== 1 ? 's' : ''}
									</p>
								</div>

								<!-- Status badge for already-invited -->
								{#if existingStatus}
									<span class="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium bg-[var(--surface-overlay)] text-[var(--text-muted)]">
										{statusLabel(existingStatus)}
									</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}

				<!-- Sticky send button -->
				<div class="sticky bottom-0 z-10 pt-3" style="background: linear-gradient(to bottom, transparent, var(--surface-overlay) 8px)">
					<button
						onclick={sendInvites}
						disabled={!canSend}
						class="flex items-center justify-center gap-2 w-full rounded-full py-3 px-6 font-medium text-body-sm transition-all duration-150
							{canSend
							? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)]'
							: 'bg-[var(--surface-overlay)] text-[var(--text-muted)] cursor-not-allowed'}"
					>
						{#if sending}
							<CircleNotch size={18} class="animate-spin" />
							Sending...
						{:else}
							<PaperPlaneTilt size={18} weight="bold" />
							Send {selected.size > 0 ? `${selected.size} ` : ''}Invite{selected.size !== 1 ? 's' : ''}
						{/if}
					</button>
				</div>
			</div>
		{/snippet}
	</UnlockGate>
</div>
