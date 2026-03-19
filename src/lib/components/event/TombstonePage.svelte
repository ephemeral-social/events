<script lang="ts">
	import { Hourglass } from 'phosphor-svelte';
	import type { TombstoneData } from '$lib/utils/event-helpers';

	interface Props {
		data: TombstoneData;
	}

	let { data }: Props = $props();

	const deletedDate = $derived(
		new Date(data.deleted_at).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		})
	);
</script>

<main class="flex min-h-dvh items-center justify-center px-4">
	<div class="w-full max-w-md text-center space-y-6">
		<div
			class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-overlay)]"
		>
			<Hourglass size={32} weight="duotone" class="text-[var(--text-muted)]" />
		</div>

		<div class="space-y-2">
			<h1 class="text-headline-md text-[var(--text-primary)]">{data.title}</h1>
			<p class="text-body-md text-[var(--text-secondary)]">This event has been deleted.</p>
		</div>

		<p class="text-body-sm text-[var(--text-muted)]">
			Deleted on {deletedDate}. All event data, photos, and comments have been permanently removed.
		</p>
	</div>
</main>
