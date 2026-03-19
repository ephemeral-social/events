<script lang="ts">
	import { Crown, CheckCircle, XCircle } from 'phosphor-svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let status = $state<'pending' | 'accepting' | 'accepted' | 'error'>('pending');
	let error = $state('');

	async function acceptInvite() {
		status = 'accepting';

		try {
			const res = await fetch(`/api/events/cohost-accept`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: data.token, event_id: data.eventId })
			});

			const result = (await res.json()) as { error?: string };
			if (!res.ok) {
				error = result.error || 'Failed to accept invite';
				status = 'error';
				return;
			}

			status = 'accepted';
			setTimeout(() => goto(`/e/${data.slug}`), 2000);
		} catch {
			error = 'Network error';
			status = 'error';
		}
	}
</script>

<svelte:head>
	<title>Co-host Invite — Ephemeral</title>
</svelte:head>

<main class="flex min-h-dvh items-center justify-center px-4">
	<div class="w-full max-w-sm text-center space-y-6">
		{#if status === 'accepted'}
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary)]/15"
			>
				<CheckCircle size={40} weight="duotone" class="text-[var(--accent-primary)]" />
			</div>
			<h1 class="text-headline-md text-[var(--text-primary)]">You're a co-host!</h1>
			<p class="text-body-md text-[var(--text-secondary)]">Redirecting to event...</p>
		{:else if status === 'error'}
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--feedback-error)]/15"
			>
				<XCircle size={40} weight="duotone" class="text-[var(--feedback-error)]" />
			</div>
			<h1 class="text-headline-md text-[var(--text-primary)]">Unable to accept</h1>
			<p class="text-body-md text-[var(--text-secondary)]">{error}</p>
			<a
				href="/e/{data.slug}"
				class="inline-block rounded-full bg-[var(--surface-overlay)] px-6 py-2.5 text-label-md text-[var(--text-primary)] transition-colors hover:bg-[var(--border-default)]"
			>
				View Event
			</a>
		{:else}
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-primary)]/15"
			>
				<Crown size={40} weight="duotone" class="text-[var(--accent-primary)]" />
			</div>
			<h1 class="text-headline-md text-[var(--text-primary)]">Co-host Invite</h1>
			<p class="text-body-md text-[var(--text-secondary)]">
				You've been invited to co-host this event.
			</p>
			<button
				class="w-full rounded-full bg-[var(--accent-primary)] px-6 py-3 text-label-lg font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-50"
				disabled={status === 'accepting'}
				onclick={acceptInvite}
			>
				{status === 'accepting' ? 'Accepting...' : 'Accept Invite'}
			</button>
		{/if}
	</div>
</main>
