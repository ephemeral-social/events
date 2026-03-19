<script lang="ts">
	import {
		CalendarBlank,
		MapPin,
		TextT,
		Clock,
		Users,
		Tag,
		CurrencyDollar,
		ClipboardText,
		X
	} from 'phosphor-svelte';
	import { generateSlugPreview } from '$lib/utils/slug';
	import { goto } from '$app/navigation';
	import ThemePicker from '$lib/components/theme/ThemePicker.svelte';
	import { computeAccentStyle } from '$lib/themes/accent';
	import type { EventTheme, EventMode } from '$lib/themes/types';
	import { getDefaultMode } from '$lib/themes/defaults';
	import { staggerChildren, focusLift } from '$lib/motion';
	import SurveyBuilder from '$lib/components/survey/SurveyBuilder.svelte';
	import type { SurveyQuestion } from '$lib/types/survey';

	let title = $state('');
	let description = $state('');
	let venueName = $state('');
	let venueAddress = $state('');
	let startDate = $state('');
	let startTime = $state('');
	let endDate = $state('');
	let endTime = $state('');
	let timezone = $state(Intl.DateTimeFormat().resolvedOptions().timeZone);
	let maxAttendees = $state('');
	let locationHidden = $state(false);
	let showGuestList = $state(false);
	let webEventType = $state<'simple' | 'ticketed'>('simple');
	let ticketPriceDollars = $state('');

	// Theme state
	let theme = $state<EventTheme>('forest');
	let mode = $state<EventMode>('dark');
	let accentHue = $state<number | null>(null);
	const accentStyle = $derived(computeAccentStyle(accentHue, mode));

	let loading = $state(false);
	let error = $state('');
	let surveyDialogOpen = $state(false);
	let surveyQuestions = $state<SurveyQuestion[]>([]);

	const slugPreview = $derived.by(() => {
		const date = startDate ? new Date(startDate) : undefined;
		return generateSlugPreview(title, date);
	});

	const startIso = $derived.by(() => {
		if (!startDate || !startTime) return null;
		return new Date(`${startDate}T${startTime}`).toISOString();
	});

	const endIso = $derived.by(() => {
		if (!endDate || !endTime) return null;
		return new Date(`${endDate}T${endTime}`).toISOString();
	});

	async function handleSubmit() {
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}
		if (!startIso) {
			error = 'Start date and time are required';
			return;
		}
		if (webEventType === 'ticketed' && (!ticketPriceDollars || parseFloat(ticketPriceDollars) < 1)) {
			error = 'Ticket price must be at least $1.00';
			return;
		}

		loading = true;
		error = '';

		const ticketCents =
			webEventType === 'ticketed' && ticketPriceDollars
				? Math.round(parseFloat(ticketPriceDollars) * 100)
				: null;

		try {
			const res = await fetch('/api/events/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || null,
					venue_name: venueName.trim() || null,
					venue_address: venueAddress.trim() || null,
					start_time: startIso,
					end_time: endIso,
					timezone,
					max_attendees: maxAttendees ? parseInt(maxAttendees) : null,
					slug: slugPreview || undefined,
					web_event_type: webEventType,
					ticket_price_cents: ticketCents,
					location_hidden: locationHidden,
					show_guest_list: showGuestList,
					theme,
					mode,
					accent_hue: accentHue
				})
			});

			const data = (await res.json()) as {
				event?: { slug?: string; event_id?: string; web_event_type?: string };
				error?: string;
			};

			if (!res.ok) {
				error = data.error || 'Failed to create event';
				return;
			}

			// Post survey questions if any were configured
			const createdEventId = data.event?.event_id;
			if (surveyQuestions.length > 0 && createdEventId) {
				try {
					await fetch(`/api/events/${createdEventId}/survey/questions`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							questions: surveyQuestions.map((q, i) => ({
								question_text: q.question_text,
								question_type: q.question_type,
								required: q.required,
								options: q.options,
								position: i + 1
							}))
						})
					});
				} catch {
					// Non-critical — event was created, survey can be added later
				}
			}

			const slug = data.event?.slug;
			if (slug) {
				// Always go to invite step first — for ticketed events,
				// invite SMS is deferred until Stripe setup completes
				goto(`/e/${slug}?invite=1`);
			}
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<form
	class="space-y-6"
	data-theme={theme}
	data-mode={mode}
	style={accentStyle || undefined}
	use:staggerChildren
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
>
	<!-- Title -->
	<div class="space-y-1.5">
		<label
			for="event-title"
			class="flex items-center gap-1.5 text-label-sm text-[var(--text-muted)]"
		>
			<TextT size={14} weight="regular" />
			Event name
		</label>
		<input
			id="event-title"
			type="text"
			bind:value={title}
			placeholder="What's the event?"
			maxlength={100}
			required
			use:focusLift
			class="flex h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-4 py-3 text-headline-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
		/>
		{#if slugPreview}
			<p class="text-caption text-[var(--text-muted)]">
				ephemeralsocial.com/e/<span class="text-[var(--accent-primary)]">{slugPreview}</span>
			</p>
		{/if}
	</div>

	<!-- Date & Time -->
	<div class="grid grid-cols-2 gap-3">
		<div class="space-y-1.5">
			<label
				for="start-date"
				class="flex items-center gap-1.5 text-label-sm text-[var(--text-muted)]"
			>
				<CalendarBlank size={14} weight="regular" />
				Start date
			</label>
			<input
				id="start-date"
				type="date"
				bind:value={startDate}
				required
				use:focusLift
				class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
			/>
		</div>
		<div class="space-y-1.5">
			<label
				for="start-time"
				class="flex items-center gap-1.5 text-label-sm text-[var(--text-muted)]"
			>
				<Clock size={14} weight="regular" />
				Start time
			</label>
			<input
				id="start-time"
				type="time"
				bind:value={startTime}
				required
				use:focusLift
				class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
			/>
		</div>
	</div>

	<div class="grid grid-cols-2 gap-3">
		<div class="space-y-1.5">
			<label for="end-date" class="text-label-sm text-[var(--text-muted)]">End date</label>
			<input
				id="end-date"
				type="date"
				bind:value={endDate}
				use:focusLift
				class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
			/>
		</div>
		<div class="space-y-1.5">
			<label for="end-time" class="text-label-sm text-[var(--text-muted)]">End time</label>
			<input
				id="end-time"
				type="time"
				bind:value={endTime}
				use:focusLift
				class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
			/>
		</div>
	</div>

	<!-- Location -->
	<div class="space-y-3">
		<div class="space-y-1.5">
			<label
				for="venue-name"
				class="flex items-center gap-1.5 text-label-sm text-[var(--text-muted)]"
			>
				<MapPin size={14} weight="regular" />
				Venue name
			</label>
			<input
				id="venue-name"
				type="text"
				bind:value={venueName}
				placeholder="Where's the event?"
				use:focusLift
				class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
			/>
		</div>
		<div class="space-y-1.5">
			<label for="venue-address" class="text-label-sm text-[var(--text-muted)]">Address</label>
			<input
				id="venue-address"
				type="text"
				bind:value={venueAddress}
				placeholder="Full address"
				use:focusLift
				class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
			/>
		</div>
	</div>

	<!-- Description -->
	<div class="space-y-1.5">
		<label for="event-description" class="text-label-sm text-[var(--text-muted)]">Description</label
		>
		<textarea
			id="event-description"
			bind:value={description}
			placeholder="What should guests know?"
			maxlength={2000}
			rows={4}
			use:focusLift
			class="flex w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)] resize-none"
		></textarea>
	</div>

	<!-- Theme Picker -->
	<ThemePicker
		{theme}
		{mode}
		{accentHue}
		onThemeChange={(t) => {
			theme = t;
			mode = getDefaultMode(t);
		}}
		onModeChange={(m) => { mode = m; }}
		onAccentChange={(h) => { accentHue = h; }}
	/>

	<!-- Settings -->
	<div
		class="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4"
	>
		<h3 class="text-label-md font-medium text-[var(--text-primary)]">Settings</h3>

		<div class="space-y-3">
			<!-- Max Attendees -->
			<div class="space-y-1.5">
				<label
					for="max-attendees"
					class="flex items-center gap-1.5 text-label-sm text-[var(--text-muted)]"
				>
					<Users size={14} weight="regular" />
					Max attendees (optional)
				</label>
				<input
					id="max-attendees"
					type="number"
					bind:value={maxAttendees}
					placeholder="No limit"
					min={1}
					max={500}
					use:focusLift
					class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
				/>
			</div>

			<!-- Location Hidden -->
			<label class="flex items-center justify-between cursor-pointer">
				<span class="text-body-sm text-[var(--text-secondary)]">Hide location until RSVP</span>
				<input
					type="checkbox"
					bind:checked={locationHidden}
					class="h-5 w-5 rounded border-[var(--border-default)] bg-[var(--surface-input)] accent-[var(--accent-primary)]"
				/>
			</label>

			<!-- Show Guest List -->
			<label class="flex items-center justify-between cursor-pointer">
				<span class="text-body-sm text-[var(--text-secondary)]">Show guest list to attendees</span>
				<input
					type="checkbox"
					bind:checked={showGuestList}
					class="h-5 w-5 rounded border-[var(--border-default)] bg-[var(--surface-input)] accent-[var(--accent-primary)]"
				/>
			</label>
		</div>
	</div>

	<!-- Guest Survey -->
	<button
		type="button"
		onclick={() => { surveyDialogOpen = true; }}
		class="flex items-center gap-2 text-body-sm text-[var(--accent-primary)] transition-colors duration-150 hover:text-[var(--accent-hover)]"
	>
		<ClipboardText size={16} weight="regular" />
		Add guest survey
		{#if surveyQuestions.length > 0}
			<span class="text-[var(--text-muted)]">({surveyQuestions.length} question{surveyQuestions.length !== 1 ? 's' : ''})</span>
		{/if}
	</button>

	<!-- Event Type -->
	<div
		class="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4"
	>
		<h3 class="flex items-center gap-1.5 text-label-md font-medium text-[var(--text-primary)]">
			<Tag size={16} weight="regular" />
			Event type
		</h3>

		<div class="flex gap-2">
			<button
				type="button"
				aria-pressed={webEventType === 'simple'}
				class="flex-1 rounded-full px-3 py-2 text-label-sm font-medium transition-all duration-150
					{webEventType === 'simple'
					? 'bg-[var(--accent-primary)] text-[var(--surface-base)]'
					: 'bg-[var(--surface-overlay)] text-[var(--text-muted)]'}"
				onclick={() => (webEventType = 'simple')}
			>
				Free
			</button>
			<button
				type="button"
				aria-pressed={webEventType === 'ticketed'}
				class="flex-1 rounded-full px-3 py-2 text-label-sm font-medium transition-all duration-150
					{webEventType === 'ticketed'
					? 'bg-[var(--accent-primary)] text-[var(--surface-base)]'
					: 'bg-[var(--surface-overlay)] text-[var(--text-muted)]'}"
				onclick={() => (webEventType = 'ticketed')}
			>
				Ticketed
			</button>
		</div>

		{#if webEventType === 'ticketed'}
			<div class="space-y-1.5">
				<label
					for="ticket-price"
					class="flex items-center gap-1.5 text-label-sm text-[var(--text-muted)]"
				>
					<CurrencyDollar size={14} weight="regular" />
					Ticket price
				</label>
				<input
					id="ticket-price"
					type="number"
					bind:value={ticketPriceDollars}
					placeholder="0.00"
					min={1}
					step={0.01}
					use:focusLift
					class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
				/>
				<p class="text-caption text-[var(--text-muted)]">
					You'll set up Stripe payments after creating the event.
				</p>
			</div>
		{/if}
	</div>

	<!-- Error -->
	{#if error}
		<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
	{/if}

	<!-- Submit -->
	<button
		type="submit"
		class="w-full rounded-full bg-[var(--accent-primary)] px-6 py-3 text-label-lg font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:opacity-50"
		disabled={loading}
	>
		{loading ? 'Creating...' : 'Create Event'}
	</button>
</form>

{#if surveyDialogOpen}
	<div class="fixed inset-0 z-[60] bg-[var(--surface-base)] overflow-y-auto">
		<div class="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]" style="background: var(--surface-base)">
			<h2 class="text-label-lg font-serif text-[var(--text-primary)]">Guest Survey</h2>
			<button type="button" onclick={() => { surveyDialogOpen = false; }} class="p-2 rounded-full hover:bg-[var(--surface-overlay)] transition-colors">
				<X size={20} weight="bold" class="text-[var(--text-secondary)]" />
			</button>
		</div>
		<div class="p-4 max-w-lg mx-auto">
			<SurveyBuilder
				questions={surveyQuestions}
				onSave={(qs) => { surveyQuestions = qs; surveyDialogOpen = false; }}
				saving={false}
			/>
		</div>
	</div>
{/if}
