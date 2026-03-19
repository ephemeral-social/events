<script lang="ts">
	import type { EventHost } from '$lib/utils/event-helpers';

	interface Props {
		title: string;
		host: EventHost | null;
	}

	let { title, host }: Props = $props();
</script>

<div class="space-y-3">
	<h1 class="text-display-md text-[var(--text-primary)]">{title}</h1>

	{#if host}
		<p class="text-body-md text-[var(--text-secondary)]">
			Hosted by
			<span class="font-medium text-[var(--text-primary)]">
				{host.display_name || host.username || 'Someone'}
			</span>
		</p>
	{/if}
</div>
