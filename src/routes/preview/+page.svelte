<script lang="ts">
	import AestheticRouter from '$lib/components/layouts/AestheticRouter.svelte';
	import type { EventAesthetic, EventPalette } from '$lib/themes/types';
	import { VALID_PALETTES, DEFAULT_PALETTES, DEFAULT_MODES } from '$lib/themes/types';
	import { page } from '$app/stores';

	// Read aesthetic/palette/mode from URL params: /preview?aesthetic=simple&palette=default&mode=dark
	const aesthetic = $derived(
		($page.url.searchParams.get('aesthetic') as EventAesthetic) || 'simple'
	);
	const palette = $derived(
		($page.url.searchParams.get('palette') as EventPalette) ||
			DEFAULT_PALETTES[aesthetic] ||
			'default'
	);
	const mode = $derived(
		($page.url.searchParams.get('mode') as 'light' | 'dark') ||
			DEFAULT_MODES[aesthetic] ||
			'dark'
	);
	// ?cover=true to show a sample cover image
	const showCover = $derived($page.url.searchParams.get('cover') === 'true');

	// Mock event data — realistic, not generic
	const mockEvent = {
		event_id: 'evt-preview-001',
		title: 'Rooftop Dinner with Friends',
		description:
			"We're taking over the rooftop at Ardor for an evening of good food, better company, and skyline views. Dress warm — it'll be outdoors.\n\nDinner starts at 7:30. Come hungry.",
		start_time: '2026-03-14T19:30:00-05:00',
		end_time: '2026-03-14T23:00:00-05:00',
		timezone: 'America/New_York',
		slug: 'rooftop-dinner-mar14',
		venue_name: 'Ardor Rooftop',
		venue_address: '447 W 18th St, New York, NY',
		cover_r2_key: null,
		cover_preview_url: showCover ? '/preview-cover.jpg' : null,
		aesthetic,
		palette,
		mode,
		web_event_type: 'free',
		max_attendees: null,
		show_guest_list: false,
		location_hidden: false
	};

	const mockHost = {
		user_id: 'host-preview-001',
		display_name: 'Priya Anand',
		avatar_r2_key: null
	};

	const mockRsvpCounts = { going: 14, maybe: 3 };

	// Set HTML attributes for CSS palette activation
	$effect(() => {
		document.documentElement.setAttribute('data-aesthetic', aesthetic);
		document.documentElement.setAttribute('data-palette', palette);
		document.documentElement.setAttribute('data-mode', mode);
		document.documentElement.setAttribute('data-theme', mode);
	});
</script>

<svelte:head>
	<!-- Conditional font loading per aesthetic -->
	{#if aesthetic === 'simple'}
		<link
			href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
			rel="stylesheet"
		/>
	{:else if aesthetic === 'warm'}
		<link
			href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Source+Sans+3:wght@300;400;500;600&display=swap"
			rel="stylesheet"
		/>
	{:else if aesthetic === 'elegant'}
		<link
			href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Raleway:wght@300;400;500;600&display=swap"
			rel="stylesheet"
		/>
	{/if}
	<title>Preview — {aesthetic} / {palette} / {mode}</title>
</svelte:head>

<!-- Nav bar for switching aesthetics during preview -->
<nav
	style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#1a1918;border-bottom:1px solid #2e2c2a;padding:8px 16px;display:flex;gap:8px;align-items:center;font-family:monospace;font-size:12px;color:#a39e96;"
>
	<span style="opacity:0.5;">PREVIEW</span>
	{#each (['simple', 'fun', 'warm', 'elegant'] as const) as a}
		<a
			href="/preview?aesthetic={a}&palette={VALID_PALETTES[a]?.[0] || 'default'}&mode={DEFAULT_MODES[a]}"
			style="padding:4px 10px;border-radius:4px;text-decoration:none;color:{aesthetic === a
				? '#ede9e3'
				: '#6b6560'};background:{aesthetic === a ? '#2e2c2a' : 'transparent'};"
		>
			{a}
		</a>
	{/each}
	<span style="opacity:0.3;margin:0 4px;">|</span>
	{#each VALID_PALETTES[aesthetic] || [] as p}
		<a
			href="/preview?aesthetic={aesthetic}&palette={p}&mode={mode}"
			style="padding:4px 10px;border-radius:4px;text-decoration:none;color:{palette === p
				? '#ede9e3'
				: '#6b6560'};background:{palette === p ? '#2e2c2a' : 'transparent'};"
		>
			{p}
		</a>
	{/each}
	<span style="opacity:0.3;margin:0 4px;">|</span>
	{#each ['dark', 'light'] as m}
		<a
			href="/preview?aesthetic={aesthetic}&palette={palette}&mode={m}"
			style="padding:4px 10px;border-radius:4px;text-decoration:none;color:{mode === m
				? '#ede9e3'
				: '#6b6560'};background:{mode === m ? '#2e2c2a' : 'transparent'};"
		>
			{m}
		</a>
	{/each}
</nav>

<!-- Spacer for the nav -->
<div style="height:40px;"></div>

<AestheticRouter
	{aesthetic}
	event={mockEvent}
	host={mockHost}
	rsvpCounts={mockRsvpCounts}
	editMode={false}
	showRsvpBar={true}
	rsvpScrolled={true}
	onRsvp={() => {}}
	onShare={() => {}}
	onDownloadCalendar={() => {}}
/>
