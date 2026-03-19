<script lang="ts">
	import { page } from '$app/stores';
	import { invalidateAll } from '$app/navigation';
	import { Bug, SignOut, UserCircle, Check, Minus, X, ArrowCounterClockwise } from 'phosphor-svelte';

	let visible = $derived($page.url.searchParams.has('debug'));
	let loading = $state('');
	let message = $state('');

	// Detect if we're on an event page — read event ID and RSVP from page data
	const isEventPage = $derived($page.url.pathname.startsWith('/e/'));
	const eventId = $derived.by(() => {
		const ed = ($page.data as Record<string, unknown>)?.eventData as { event?: { event_id: string } } | undefined;
		return ed?.event?.event_id ?? null;
	});

	let rsvpLoading = $state('');
	let currentRsvpStatus = $state<string | null>(null);

	// Sync RSVP status from page data
	$effect(() => {
		if (!isEventPage || !visible) { currentRsvpStatus = null; return; }
		const myRsvp = ($page.data as Record<string, unknown>)?.myRsvp as { status: string } | null | undefined;
		currentRsvpStatus = myRsvp?.status ?? null;
	});

	async function setRsvpStatus(status: 'going' | 'maybe' | 'declined') {
		if (!eventId) return;
		rsvpLoading = status;
		message = '';
		try {
			const method = currentRsvpStatus ? 'PUT' : 'POST';
			const res = await fetch(`/api/events/${eventId}/rsvp`, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status, display_name: 'Debug User' })
			});
			if (res.ok) {
				currentRsvpStatus = status;
				message = `RSVP → ${status}`;
				await invalidateAll();
			} else {
				const data = (await res.json()) as { error?: string };
				message = data.error || 'RSVP failed';
			}
		} catch {
			message = 'Network error';
		} finally {
			rsvpLoading = '';
		}
	}

	async function clearRsvp() {
		if (!eventId) return;
		rsvpLoading = 'clear';
		message = '';
		try {
			const res = await fetch(`/api/events/${eventId}/rsvp`, { method: 'DELETE' });
			if (res.ok) {
				currentRsvpStatus = null;
				message = 'RSVP deleted';
				await invalidateAll();
			} else {
				const data = (await res.json()) as { error?: string };
				message = data.error || 'Failed to clear RSVP';
			}
		} catch {
			message = 'Network error';
		} finally {
			rsvpLoading = '';
		}
	}

	const debugUsers = [
		{ phone: '+15555550099', name: 'Debug Alice' },
		{ phone: '+15555550098', name: 'Debug Bob' }
	];

	async function loginAs(phone: string, displayName: string) {
		loading = phone;
		message = '';
		try {
			const res = await fetch('/api/auth/debug-login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone, display_name: displayName })
			});
			const data = (await res.json()) as { success?: boolean; error?: string; user?: { display_name?: string } };
			if (!res.ok) {
				message = data.error || 'Login failed';
				return;
			}
			message = `Logged in as ${data.user?.display_name || displayName}`;
			await invalidateAll();
		} catch {
			message = 'Network error';
		} finally {
			loading = '';
		}
	}

	async function logout() {
		loading = 'logout';
		message = '';
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			message = 'Logged out';
			await invalidateAll();
		} catch {
			message = 'Logout failed';
		} finally {
			loading = '';
		}
	}
</script>

{#if visible}
	<div class="fixed bottom-4 right-4 z-[9999] w-64 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-4 shadow-lg">
		<div class="flex items-center gap-2 mb-3">
			<Bug size={16} weight="duotone" class="text-[var(--accent-primary)]" />
			<span class="text-label-sm font-semibold text-[var(--text-primary)]">Debug Panel</span>
		</div>

		<div class="space-y-2">
			{#each debugUsers as user (user.phone)}
				<button
					class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-label-sm text-[var(--text-secondary)] bg-[var(--surface-card)] hover:bg-[var(--surface-overlay)] transition-colors duration-150 disabled:opacity-50"
					disabled={!!loading}
					onclick={() => loginAs(user.phone, user.name)}
				>
					<UserCircle size={16} weight="regular" />
					{loading === user.phone ? 'Logging in...' : `Login as ${user.name}`}
				</button>
			{/each}

			<button
				class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-label-sm text-[var(--feedback-error)] bg-[var(--surface-card)] hover:bg-[var(--surface-overlay)] transition-colors duration-150 disabled:opacity-50"
				disabled={!!loading}
				onclick={logout}
			>
				<SignOut size={16} weight="regular" />
				{loading === 'logout' ? 'Logging out...' : 'Logout'}
			</button>
		</div>

		{#if isEventPage}
			<div class="mt-3 pt-3 border-t border-[var(--border-subtle)]">
				<p class="text-caption font-semibold text-[var(--text-muted)] mb-2">
					RSVP {#if currentRsvpStatus}<span class="text-[var(--accent-primary)]">({currentRsvpStatus})</span>{:else}<span class="text-[var(--text-muted)]">(none)</span>{/if}
				</p>
				<div class="flex gap-1">
					<button
						class="flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors duration-150 disabled:opacity-50
							{currentRsvpStatus === 'going' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)]'}"
						disabled={!!rsvpLoading}
						onclick={() => setRsvpStatus('going')}
					>
						<Check size={12} weight="bold" />
						{rsvpLoading === 'going' ? '...' : 'Going'}
					</button>
					<button
						class="flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors duration-150 disabled:opacity-50
							{currentRsvpStatus === 'maybe' ? 'bg-[var(--text-secondary)]/20 text-[var(--text-secondary)]' : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)]'}"
						disabled={!!rsvpLoading}
						onclick={() => setRsvpStatus('maybe')}
					>
						<Minus size={12} weight="bold" />
						{rsvpLoading === 'maybe' ? '...' : 'Maybe'}
					</button>
					<button
						class="flex-1 flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-medium transition-colors duration-150 disabled:opacity-50
							{currentRsvpStatus === 'declined' ? 'bg-[var(--feedback-error)]/20 text-[var(--feedback-error)]' : 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)]'}"
						disabled={!!rsvpLoading}
						onclick={() => setRsvpStatus('declined')}
					>
						<X size={12} weight="bold" />
						{rsvpLoading === 'declined' ? '...' : 'Decline'}
					</button>
				</div>
				{#if currentRsvpStatus && currentRsvpStatus !== 'declined'}
					<button
						class="flex w-full items-center justify-center gap-1 mt-1 rounded-lg px-2 py-1.5 text-[0.65rem] font-medium text-[var(--feedback-error)] bg-[var(--surface-card)] hover:bg-[var(--surface-overlay)] transition-colors duration-150 disabled:opacity-50"
						disabled={!!rsvpLoading}
						onclick={clearRsvp}
					>
						<ArrowCounterClockwise size={12} weight="bold" />
						Clear RSVP
					</button>
				{/if}
			</div>
		{/if}

		{#if message}
			<p class="mt-2 text-body-sm text-[var(--text-muted)]">{message}</p>
		{/if}
	</div>
{/if}
