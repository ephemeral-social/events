<script lang="ts">
	import EventEditor from '$lib/components/editor/EventEditor.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Edit Event — Ephemeral</title>
	<!-- Load ALL aesthetic fonts since user can switch freely -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300&family=Source+Sans+3:wght@400;500;600&family=Raleway:wght@300;400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<EventEditor mode="edit" event={data.event} slug={data.slug} />
