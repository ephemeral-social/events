<script lang="ts">
	import type { EventAesthetic } from '$lib/themes/types';
	import type { Snippet } from 'svelte';
	import SimpleLayout from './SimpleLayout.svelte';
	import FunLayout from './FunLayout.svelte';
	import WarmLayout from './WarmLayout.svelte';
	import ElegantLayout from './ElegantLayout.svelte';

	interface Props {
		aesthetic: EventAesthetic;
		event: Record<string, any>;
		host: { user_id: string; username?: string; display_name?: string; avatar_r2_key?: string | null } | null;
		rsvpCounts: { going: number; maybe: number };
		editMode?: boolean;
		showRsvpBar?: boolean;
		rsvpScrolled?: boolean;
		onRsvp?: (status: string) => void;
		onViewGuests?: () => void;
		onShare?: () => void;
		onDownloadCalendar?: () => void;
		onUpdateField?: (field: string, value: any) => void;
		onUploadCover?: (file: File) => void;
		ctaSlot?: Snippet;
	}

	let {
		aesthetic,
		event,
		host,
		rsvpCounts,
		editMode = false,
		showRsvpBar = true,
		rsvpScrolled = false,
		onRsvp,
		onViewGuests,
		onShare,
		onDownloadCalendar,
		onUpdateField,
		onUploadCover,
		ctaSlot
	}: Props = $props();
</script>

{#key aesthetic}
	{#if aesthetic === 'simple'}
		<SimpleLayout
			{event}
			{host}
			{rsvpCounts}
			{editMode}
			{showRsvpBar}
			{rsvpScrolled}
			{onRsvp}
			{onViewGuests}
			{onShare}
			{onDownloadCalendar}
			{onUpdateField}
			{onUploadCover}
			{ctaSlot}
		/>
	{:else if aesthetic === 'fun'}
		<FunLayout
			{event}
			{host}
			{rsvpCounts}
			{editMode}
			{showRsvpBar}
			{rsvpScrolled}
			{onRsvp}
			{onViewGuests}
			{onShare}
			{onDownloadCalendar}
			{onUpdateField}
			{onUploadCover}
			{ctaSlot}
		/>
	{:else if aesthetic === 'warm'}
		<WarmLayout
			{event}
			{host}
			{rsvpCounts}
			{editMode}
			{showRsvpBar}
			{onRsvp}
			{onViewGuests}
			{onShare}
			{onDownloadCalendar}
			{onUpdateField}
			{onUploadCover}
			{ctaSlot}
		/>
	{:else}
		<ElegantLayout
			{event}
			{host}
			{rsvpCounts}
			{editMode}
			{showRsvpBar}
			{onRsvp}
			{onViewGuests}
			{onShare}
			{onDownloadCalendar}
			{onUpdateField}
			{onUploadCover}
			{ctaSlot}
		/>
	{/if}
{/key}
