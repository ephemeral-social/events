<script lang="ts">
	import { getCoverImageUrl } from '$lib/utils/event-helpers';

	interface Props {
		coverKey?: string;
		title: string;
	}

	let { coverKey, title }: Props = $props();

	const imageUrl = $derived(getCoverImageUrl(coverKey));
</script>

<div class="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
	{#if imageUrl}
		<img
			src={imageUrl}
			alt="Cover photo for {title}"
			class="h-full w-full object-cover"
			loading="eager"
		/>
	{:else}
		<!-- Gradient pattern fallback -->
		<div
			class="flex h-full w-full items-center justify-center"
			style="background: linear-gradient(135deg, var(--surface-card) 0%, var(--surface-overlay) 50%, var(--accent-primary) 150%)"
		>
			<span class="text-display-sm text-[var(--text-muted)] opacity-40 select-none">
				{title.charAt(0).toUpperCase()}
			</span>
		</div>
	{/if}
</div>
