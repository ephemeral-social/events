<script lang="ts">
	import { onMount } from 'svelte';
	import { CurrencyDollar, ArrowSquareOut } from 'phosphor-svelte';

	interface CostItem {
		id: string;
		description: string;
		amount_cents: number;
	}

	interface Props {
		eventId: string;
		isRsvpd: boolean;
	}

	let { eventId, isRsvpd }: Props = $props();

	let costs = $state<CostItem[]>([]);
	let perPersonCents = $state(0);
	let paymentHandle = $state('');
	let paymentPlatform = $state('');
	let loading = $state(false);
	let loaded = $state(false);
	let error = $state('');

	async function loadCosts() {
		if (loaded || !isRsvpd) return;
		loading = true;
		error = '';

		try {
			const res = await fetch(`/api/events/${eventId}/costs`);
			const data = (await res.json()) as {
				costs?: CostItem[];
				cached_per_person_cents?: number;
				payment_handle?: string;
				payment_platform?: string;
				error?: string;
			};

			if (!res.ok) {
				error = data.error || 'Unable to load costs';
				return;
			}

			costs = data.costs || [];
			perPersonCents = data.cached_per_person_cents || 0;
			paymentHandle = data.payment_handle || '';
			paymentPlatform = data.payment_platform || '';
		} catch {
			error = 'Network error';
		} finally {
			loaded = true;
			loading = false;
		}
	}

	const totalCents = $derived(costs.reduce((sum, c) => sum + c.amount_cents, 0));

	function formatCents(cents: number): string {
		return `$${(cents / 100).toFixed(2)}`;
	}

	function getPaymentUrl(): string | null {
		if (!paymentHandle) return null;
		const amount = (perPersonCents / 100).toFixed(2);
		if (paymentPlatform === 'venmo') {
			return `venmo://paycharge?txn=pay&recipients=${paymentHandle}&amount=${amount}`;
		}
		if (paymentPlatform === 'cashapp') {
			return `https://cash.app/$${paymentHandle}/${amount}`;
		}
		return null;
	}

	// Use onMount (not $effect) to load data exactly once — $effect can loop
	// when fetch errors leave `loaded` false and Svelte re-evaluates deps.
	onMount(() => {
		if (isRsvpd) loadCosts();
	});
</script>

{#if !isRsvpd}
	<!-- Cost details require RSVP — render nothing for non-RSVP'd users -->
{:else if loading}
	<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4">
		<p class="text-body-sm text-[var(--text-muted)]">Loading costs...</p>
	</div>
{:else if loaded && costs.length > 0}
	<div
		class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4 space-y-3"
	>
		<h3 class="flex items-center gap-2 text-label-md font-medium text-[var(--text-primary)]">
			<CurrencyDollar size={16} weight="regular" />
			Cost Sharing
		</h3>

		<div class="space-y-2">
			{#each costs as cost (cost.id)}
				<div class="flex items-center justify-between text-body-sm">
					<span class="text-[var(--text-secondary)]">{cost.description}</span>
					<span class="text-[var(--text-primary)]">{formatCents(cost.amount_cents)}</span>
				</div>
			{/each}
		</div>

		<div class="border-t border-[var(--border-subtle)] pt-2">
			<div class="flex items-center justify-between">
				<span class="text-body-sm text-[var(--text-muted)]">Total</span>
				<span class="text-body-md font-medium text-[var(--text-primary)]">
					{formatCents(totalCents)}
				</span>
			</div>
			{#if perPersonCents > 0}
				<div class="flex items-center justify-between mt-1">
					<span class="text-label-sm font-medium text-[var(--accent-primary)]">Your share</span>
					<span class="text-body-md font-bold text-[var(--accent-primary)]">
						{formatCents(perPersonCents)}
					</span>
				</div>
			{/if}
		</div>

		{#if paymentHandle}
			{@const payUrl = getPaymentUrl()}
			<div class="pt-1">
				{#if payUrl}
					<a
						href={payUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-primary)] px-4 py-2.5 text-label-md font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)]"
					>
						Pay via {paymentPlatform}
						<ArrowSquareOut size={16} weight="bold" />
					</a>
				{:else}
					<p class="text-body-sm text-[var(--text-secondary)]">
						Pay <span class="font-medium">@{paymentHandle}</span> on {paymentPlatform}
					</p>
				{/if}
			</div>
		{/if}
	</div>
{:else if error}
	<div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4">
		<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
	</div>
{/if}
