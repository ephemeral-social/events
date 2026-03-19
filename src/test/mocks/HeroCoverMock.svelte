<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		coverKey?: string;
		title: string;
		host: any;
		event: any;
		rsvpCounts: any;
		showGuestListLink?: boolean;
		onViewGuestList?: () => void;
		cta?: Snippet;
		class?: string;
		editMode?: boolean;
		onUpdateField?: (field: string, value: any) => void;
		onUploadCover?: (file: File) => void;
		coverPreviewUrl?: string | null;
	}

	let { title, host, cta, editMode = false }: Props = $props();
	const hostName = $derived(host?.display_name || host?.username || 'Someone');
</script>

<section aria-label="Event cover">
	<h1>{title}</h1>
	{#if host}
		<p data-testid="host-attribution">Hosted by {hostName}</p>
	{/if}
	{#if cta}
		{@render cta()}
	{/if}
</section>
