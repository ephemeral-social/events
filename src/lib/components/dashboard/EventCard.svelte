<script lang="ts">
	import { CalendarBlank, Users } from 'phosphor-svelte';
	import { formatEventDateShort } from '$lib/utils/date-format';
	import { sharedElement } from '$lib/motion';

	interface EventSummary {
		event_id: string;
		title: string;
		start_time: string;
		timezone?: string;
		slug?: string;
		is_host?: boolean | number;
		my_rsvp?: string;
		going_count?: number;
	}

	interface Props {
		event: EventSummary;
	}

	let { event }: Props = $props();

	const dateStr = $derived(formatEventDateShort(event.start_time, event.timezone));
	const href = $derived(event.slug ? `/e/${event.slug}` : '#');
</script>

<a
	{href}
	class="block rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 transition-colors hover:border-[var(--border-default)] space-y-2"
	use:sharedElement={{ name: 'event-' + event.event_id }}
>
	<div class="flex items-start justify-between">
		<h3 class="text-body-md font-medium text-[var(--text-primary)] line-clamp-1">{event.title}</h3>
		{#if event.is_host}
			<span
				class="shrink-0 rounded-full bg-[var(--accent-primary)]/15 px-2 py-0.5 text-caption font-medium text-[var(--accent-primary)]"
			>
				Host
			</span>
		{:else if event.my_rsvp === 'invited'}
			<span
				class="shrink-0 rounded-full bg-[var(--feedback-warning,#e85d04)]/15 px-2 py-0.5 text-caption font-medium text-[var(--feedback-warning,#e85d04)]"
			>
				Invited
			</span>
		{/if}
	</div>

	<div class="flex items-center gap-3 text-body-sm text-[var(--text-muted)]">
		<span class="flex items-center gap-1">
			<CalendarBlank size={14} weight="regular" />
			{dateStr}
		</span>
		{#if event.going_count !== undefined}
			<span class="flex items-center gap-1">
				<Users size={14} weight="regular" />
				{event.going_count} going
			</span>
		{/if}
	</div>
</a>
