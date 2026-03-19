<script lang="ts">
	import { ArrowLeft } from 'phosphor-svelte';
	import CheckinScanner from '$lib/components/tickets/CheckinScanner.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Check In{data.eventTitle ? ` — ${data.eventTitle}` : ''} — Ephemeral</title>
</svelte:head>

<main class="mx-auto w-full max-w-lg px-4 py-6 space-y-6">
	<div class="flex items-center gap-3">
		{#if !data.isTokenAuth}
			<a
				href="/e/{data.slug}"
				class="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-overlay)]"
				aria-label="Back to event"
			>
				<ArrowLeft size={20} weight="regular" class="text-[var(--text-secondary)]" />
			</a>
		{/if}
		<div>
			<h1 class="text-headline-md text-[var(--text-primary)]">Check In</h1>
			<p class="text-body-sm text-[var(--text-muted)]">
				{data.eventTitle ? data.eventTitle : 'Scan tickets at the door'}
			</p>
		</div>
	</div>

	{#if data.eventId}
		<CheckinScanner eventId={data.eventId} eventTitle={data.eventTitle} />
	{:else}
		<p class="text-body-md text-[var(--text-muted)] text-center py-8">
			Could not load event. Please go back and try again.
		</p>
	{/if}
</main>
