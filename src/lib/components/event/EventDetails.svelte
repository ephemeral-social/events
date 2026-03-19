<script lang="ts">
	import { CalendarBlank, MapPin } from 'phosphor-svelte';
	import type { PublicEvent } from '$lib/utils/event-helpers';
	import { formatEventDate, formatTimeRange } from '$lib/utils/date-format';

	interface Props {
		event: PublicEvent;
	}

	let { event }: Props = $props();

	const dateStr = $derived(formatEventDate(event.start_time, event.timezone));
	const timeStr = $derived(formatTimeRange(event.start_time, event.end_time, event.timezone));
</script>

<div class="space-y-4">
	<!-- Date -->
	<div class="flex items-start gap-3">
		<div class="mt-0.5 flex-shrink-0 text-[var(--accent-primary)]">
			<CalendarBlank size={20} weight="regular" />
		</div>
		<div>
			<p class="text-body-md font-medium text-[var(--text-primary)]">{dateStr}</p>
			<p class="text-body-sm text-[var(--text-secondary)]">{timeStr}</p>
		</div>
	</div>

	<!-- Location -->
	{#if event.venue_name || event.venue_address}
		<div class="flex items-start gap-3">
			<div class="mt-0.5 flex-shrink-0 text-[var(--accent-primary)]">
				<MapPin size={20} weight="regular" />
			</div>
			<div>
				{#if event.venue_name}
					<p class="text-body-md font-medium text-[var(--text-primary)]">{event.venue_name}</p>
				{/if}
				{#if event.venue_address}
					<p class="text-body-sm text-[var(--text-secondary)]">{event.venue_address}</p>
				{/if}
			</div>
		</div>
	{:else if event.location_hidden}
		<div class="flex items-start gap-3">
			<div class="mt-0.5 flex-shrink-0 text-[var(--text-muted)]">
				<MapPin size={20} weight="regular" />
			</div>
			<p class="text-body-md text-[var(--text-muted)]">Location revealed after RSVP</p>
		</div>
	{/if}

	<!-- Description -->
	{#if event.description}
		<div class="pt-2">
			<p class="text-body-md whitespace-pre-wrap text-[var(--text-secondary)]">
				{event.description}
			</p>
		</div>
	{/if}
</div>
