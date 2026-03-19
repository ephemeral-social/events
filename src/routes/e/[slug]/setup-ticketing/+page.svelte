<script lang="ts">
	import { ArrowLeft, Ticket, CalendarBlank, MapPin, CurrencyDollar } from 'phosphor-svelte';
	import { goto } from '$app/navigation';
	import { formatEventDateShort } from '$lib/utils/date-format';
	import { formatPrice } from '$lib/utils/event-helpers';
	import StripeOnboarding from '$lib/components/create/StripeOnboarding.svelte';
	import StripeExplainer from '$lib/components/create/StripeExplainer.svelte';

	let { data } = $props();

	let showExplainer = $state(true);
	let stripeRetryKey = $state(0);

	function handleBegin() {
		showExplainer = false;
	}

	function handleComplete() {
		goto(`/e/${data.slug}?ticketing=ready`);
	}

	function handleRetry() {
		stripeRetryKey++;
	}
</script>

<svelte:head>
	<title>Set Up Ticketing — Ephemeral</title>
</svelte:head>

<StripeExplainer open={showExplainer} onBegin={handleBegin} />

{#if !showExplainer}
<main class="mx-auto w-full max-w-lg px-4 py-6 space-y-6">
	<a
		href="/e/{data.slug}"
		class="flex items-center gap-2 text-body-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
	>
		<ArrowLeft size={16} weight="regular" />
		Back to event
	</a>

	<div class="space-y-2">
		<div class="flex items-center gap-2">
			<Ticket size={24} weight="duotone" class="text-[var(--accent-primary)]" />
			<h1 class="text-headline-md text-[var(--text-primary)]">Set up ticketing</h1>
		</div>
		<p class="text-body-sm text-[var(--text-secondary)]">
			Complete Stripe identity verification to start selling tickets. This is a one-time setup
			that carries over to future events.
		</p>
	</div>

	<!-- Event context card -->
	<div
		class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-3"
	>
		<h3 class="text-label-md font-medium text-[var(--text-primary)]">{data.event.title}</h3>
		<div class="flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-[var(--text-secondary)]">
			<span class="flex items-center gap-1.5">
				<CalendarBlank size={14} weight="regular" />
				{formatEventDateShort(data.event.start_time, data.event.timezone)}
			</span>
			{#if data.event.venue_name}
				<span class="flex items-center gap-1.5">
					<MapPin size={14} weight="regular" />
					{data.event.venue_name}
				</span>
			{/if}
			{#if data.event.ticket_price_cents}
				<span class="flex items-center gap-1.5">
					<CurrencyDollar size={14} weight="regular" />
					{formatPrice(data.event.ticket_price_cents)} per ticket
				</span>
			{/if}
		</div>
	</div>

	<!-- Stripe onboarding -->
	{#key stripeRetryKey}
		<StripeOnboarding
			publishableKey={data.stripePublishableKey}
			eventId={data.event.event_id}
			onComplete={handleComplete}
			onRetry={handleRetry}
		/>
	{/key}
</main>
{/if}
