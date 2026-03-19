<script lang="ts">
	import type { PublicEvent, EventHost } from '$lib/utils/event-helpers';
	import { getCoverImageUrl } from '$lib/utils/event-helpers';
	import { formatEventDateShort } from '$lib/utils/date-format';

	interface Props {
		event: PublicEvent;
		host: EventHost | null;
	}

	let { event, host }: Props = $props();

	const coverUrl = $derived(getCoverImageUrl(event.cover_r2_key));
	const dateStr = $derived(formatEventDateShort(event.start_time, event.timezone));
	const hostName = $derived(host?.display_name || host?.username || 'Someone');
	const description = $derived(
		event.description
			? event.description.slice(0, 155) + (event.description.length > 155 ? '...' : '')
			: `${dateStr} - Hosted by ${hostName}`
	);
</script>

<svelte:head>
	<title>{event.title} — Ephemeral</title>
	<meta name="description" content={description} />

	<!-- Open Graph -->
	<meta property="og:title" content={event.title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://ephemeralsocial.com/e/{event.slug}" />
	{#if coverUrl}
		<meta property="og:image" content={coverUrl} />
	{/if}

	<!-- Twitter Card -->
	<meta name="twitter:card" content={coverUrl ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={event.title} />
	<meta name="twitter:description" content={description} />
	{#if coverUrl}
		<meta name="twitter:image" content={coverUrl} />
	{/if}
</svelte:head>
