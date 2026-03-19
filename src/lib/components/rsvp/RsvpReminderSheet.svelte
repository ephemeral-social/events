<script lang="ts">
	import { CircleNotch, BellRinging } from 'phosphor-svelte';
	import { hapticLight } from '$lib/utils/haptics';

	interface Props {
		eventId: string;
		eventStartTime: string;
		eventTimezone: string;
		onComplete: (date: string) => void;
		onCancel: () => void;
	}

	let { eventId, eventStartTime, eventTimezone, onComplete, onCancel }: Props = $props();

	let selectedDate = $state<string | null>(null);
	let submitting = $state(false);
	let error = $state<string | null>(null);

	// Generate array of dates from tomorrow through event day (inclusive)
	const dayOptions = $derived.by(() => {
		const days: { date: string; label: string; sublabel: string }[] = [];
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);

		const eventDay = new Date(eventStartTime);
		eventDay.setHours(23, 59, 59, 999);

		const current = new Date(tomorrow);
		while (current <= eventDay && days.length < 30) {
			const dateStr = current.toISOString().split('T')[0];
			const dayName = current.toLocaleDateString('en-US', { weekday: 'short' });
			const monthDay = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
			days.push({ date: dateStr, label: dayName, sublabel: monthDay });
			current.setDate(current.getDate() + 1);
		}
		return days;
	});

	async function submit() {
		if (!selectedDate || submitting) return;
		submitting = true;
		error = null;

		try {
			const res = await fetch(`/api/events/${eventId}/rsvp-reminder`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ remind_date: selectedDate })
			});

			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				error = data.error || 'Something went wrong';
				submitting = false;
				return;
			}

			onComplete(selectedDate);
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex flex-col gap-4 px-1 py-2">
	<!-- Header -->
	<div class="text-center">
		<div class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-primary)]/15">
			<BellRinging size={20} weight="duotone" class="text-[var(--accent-primary)]" />
		</div>
		<h3 class="font-display text-lg font-semibold text-[var(--text-primary)]">
			Pick a day to be reminded
		</h3>
		<p class="mt-1 text-label-sm text-[var(--text-muted)]">
			We'll send a text message reminder from Ephemeral
		</p>
	</div>

	<!-- Day pills — horizontally scrollable -->
	<div class="scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
		{#each dayOptions as day (day.date)}
			<button
				class="day-pill flex min-w-[4rem] shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-2.5 text-center transition-all duration-150
					{selectedDate === day.date
						? 'bg-[var(--accent-primary)] text-[var(--surface-base)] shadow-md'
						: 'bg-[var(--surface-card)] text-[var(--text-secondary)] hover:bg-[var(--surface-overlay)]'}"
				onclick={() => { hapticLight(); selectedDate = day.date; }}
			>
				<span class="text-[0.65rem] font-medium uppercase tracking-wider opacity-70">{day.label}</span>
				<span class="text-label-sm font-semibold whitespace-nowrap">{day.sublabel}</span>
			</button>
		{/each}
	</div>

	<!-- Error -->
	{#if error}
		<p class="text-center text-label-sm text-[var(--error)]">{error}</p>
	{/if}

	<!-- Consent disclosure -->
	<p class="text-caption text-[var(--text-muted)] text-center">
		Msg &amp; data rates may apply. Reply STOP to cancel.
		<a href="/terms" target="_blank" class="text-[var(--accent-primary)] transition-colors duration-150 hover:text-[var(--accent-hover)]">Terms</a>
		<span>&middot;</span>
		<a href="/privacy" target="_blank" class="text-[var(--accent-primary)] transition-colors duration-150 hover:text-[var(--accent-hover)]">Privacy</a>
	</p>

	<!-- Actions -->
	<div class="flex gap-2">
		<button
			class="flex-1 rounded-full border border-[var(--border-default)] bg-transparent px-4 py-2.5 text-label-sm font-medium text-[var(--text-secondary)] transition-all duration-150 hover:bg-[var(--surface-card)]"
			onclick={onCancel}
		>
			Cancel
		</button>
		<button
			class="flex-1 rounded-full bg-[var(--accent-primary)] px-4 py-2.5 text-label-sm font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed"
			disabled={!selectedDate || submitting}
			onclick={submit}
		>
			{#if submitting}
				<CircleNotch size={16} class="mx-auto animate-spin" />
			{:else}
				Set reminder
			{/if}
		</button>
	</div>
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
