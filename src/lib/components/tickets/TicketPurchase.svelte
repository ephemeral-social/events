<script lang="ts">
	import { Ticket, Minus, Plus, CheckCircle, CircleNotch, ShieldCheck } from 'phosphor-svelte';
	import { onMount, onDestroy } from 'svelte';
	import { formatPrice } from '$lib/utils/event-helpers';
	import { organicFade } from '$lib/motion';
	import { hapticLight, hapticSuccess, hapticError } from '$lib/utils/haptics';
	import TicketCard from './TicketCard.svelte';
	import TicketActions from './TicketActions.svelte';

	interface TicketData {
		ticket_id: string;
		status: string;
		checked_in?: boolean;
		checked_in_at?: string;
	}

	interface Props {
		eventId: string;
		priceCents: number;
		eventTitle?: string;
		maxQuantity?: number;
		stripePublishableKey?: string;
		slug?: string;
		onTicketsConfirmed?: () => void;
	}

	let {
		eventId,
		priceCents,
		eventTitle = 'Event',
		maxQuantity = 10,
		stripePublishableKey = '',
		slug = '',
		onTicketsConfirmed
	}: Props = $props();

	type Stage = 'select' | 'payment' | 'success';

	let myTickets = $state<TicketData[]>([]);
	let ticketsLoading = $state(true);
	let quantity = $state(1);
	let stage = $state<Stage>('select');
	let error = $state('');
	let paymentAmount = $state(0);
	let confirming = $state(false);
	let paymentIntentId = $state('');

	// Stripe refs
	let paymentRef: HTMLDivElement | undefined = $state();
	let stripe: any = $state(null);
	let elements: any = $state(null);
	let stripeLoading = $state(false);

	const totalCents = $derived(priceCents * quantity);
	const hasTickets = $derived(myTickets.length > 0);

	onMount(async () => {
		try {
			const res = await fetch(`/api/events/${eventId}/tickets`);
			if (res.ok) {
				const data = (await res.json()) as { tickets?: TicketData[] };
				myTickets = data.tickets ?? [];
			}
		} catch {
			// Silently fail — show buy form as fallback
		} finally {
			ticketsLoading = false;
		}
	});

	function buildAppearance() {
		const style = getComputedStyle(document.documentElement);
		return {
			theme: 'night' as const,
			labels: 'floating' as const,
			variables: {
				colorPrimary: style.getPropertyValue('--accent-primary').trim() || '#52b788',
				colorBackground: style.getPropertyValue('--surface-card').trim() || '#1a1918',
				colorText: style.getPropertyValue('--text-primary').trim() || '#ede9e3',
				colorDanger: style.getPropertyValue('--feedback-error').trim() || '#e85d04',
				colorTextSecondary: style.getPropertyValue('--text-secondary').trim() || '#a39e96',
				colorTextPlaceholder: style.getPropertyValue('--text-muted').trim() || '#6b6560',
				fontFamily: 'Manrope, sans-serif',
				borderRadius: '10px',
				spacingUnit: '3px',
				spacingGridRow: '12px'
			},
			rules: {
				'.Input': {
					border: '1px solid var(--border-default, #2e2c2a)',
					backgroundColor: 'var(--surface-base, #111110)',
					padding: '8px 12px'
				},
				'.Input:focus': {
					border: '1px solid var(--accent-primary, #52b788)',
					boxShadow: '0 0 0 3px rgba(82,183,136,0.25)'
				},
				'.Tab': {
					border: '1px solid var(--border-default, #2e2c2a)',
					backgroundColor: 'var(--surface-base, #111110)',
					borderRadius: '10px',
					padding: '8px 10px'
				},
				'.Tab--selected': {
					backgroundColor: 'var(--surface-card, #1a1918)',
					borderColor: 'var(--accent-primary, #52b788)'
				},
				'.TabIcon': {
					width: '16px',
					height: '16px'
				},
				'.TabLabel': {
					fontSize: '13px'
				},
				'.Label': {
					fontSize: '13px'
				}
			}
		};
	}

	async function handleContinueToPayment() {
		hapticLight();
		error = '';
		stripeLoading = true;

		try {
			// 1. Create PaymentIntent server-side
			const res = await fetch(`/api/events/${eventId}/create-payment-intent`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ quantity })
			});

			const data = (await res.json()) as {
				client_secret?: string;
				payment_intent_id?: string;
				amount?: number;
				error?: string;
			};

			if (!res.ok) {
				error = data.error || 'Failed to start payment';
				stripeLoading = false;
				return;
			}

			if (!data.client_secret) {
				error = 'Payment setup failed. Please try again.';
				stripeLoading = false;
				return;
			}

			paymentAmount = data.amount || totalCents;
			paymentIntentId = data.payment_intent_id || '';

			// 2. Load Stripe.js dynamically
			const { loadStripe } = await import('@stripe/stripe-js');
			stripe = await loadStripe(stripePublishableKey);

			if (!stripe) {
				error = 'Failed to load payment processor. Please refresh and try again.';
				stripeLoading = false;
				return;
			}

			// 3. Create Elements with client secret
			elements = stripe.elements({
				clientSecret: data.client_secret,
				appearance: buildAppearance()
			});

			// 4. Switch to payment stage (element mounts after DOM update)
			stage = 'payment';

			// 5. Mount Payment Element after DOM renders
			await tick();
			if (paymentRef) {
				const paymentElement = elements.create('payment', {
					layout: {
						type: 'accordion',
						defaultCollapsed: true,
						radios: false,
						spacedAccordionItems: false
					}
				});
				paymentElement.mount(paymentRef);
			}

			stripeLoading = false;
		} catch {
			error = 'Network error. Please try again.';
			stripeLoading = false;
		}
	}

	async function handlePay() {
		if (!stripe || !elements || confirming) return;

		// Keep payment stage visible — Stripe needs the elements mounted
		confirming = true;
		error = '';

		try {
			const returnUrl = slug
				? `${window.location.origin}/e/${slug}/ticket-confirmed`
				: `${window.location.origin}${window.location.pathname}/ticket-confirmed`;

			const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
				elements,
				confirmParams: {
					return_url: returnUrl
				},
				redirect: 'if_required'
			});

			if (stripeError) {
				hapticError();
				console.error('[TicketPurchase] Stripe error:', stripeError.type, stripeError.message);
				error = stripeError.message || 'Payment failed. Please try again.';
				confirming = false;
				return;
			}

			if (paymentIntent && paymentIntent.status === 'succeeded') {
				hapticSuccess();
				stage = 'success';

				// Tell backend to verify PI and create tickets synchronously
				try {
					const confirmRes = await fetch(`/api/events/${eventId}/confirm-payment`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ payment_intent_id: paymentIntentId })
					});
					if (confirmRes.ok) {
						const confirmData = (await confirmRes.json()) as { tickets?: TicketData[] };
						if (confirmData.tickets && confirmData.tickets.length > 0) {
							myTickets = confirmData.tickets.map((t: any) => ({
								ticket_id: t.ticket_id,
								status: t.status,
								checked_in: false
							}));
							onTicketsConfirmed?.();
						}
					}
				} catch {
					// Fall back to polling if confirm-payment fails
					pollForTickets();
				}

				confirming = false;
			}
		} catch (e) {
			hapticError();
			console.error('[TicketPurchase] Payment error:', e);
			error = 'Payment failed. Please try again.';
			confirming = false;
		}
	}

	let pollTimer: ReturnType<typeof setInterval> | null = null;

	function pollForTickets() {
		// Clear any existing poll
		if (pollTimer) clearInterval(pollTimer);

		let attempts = 0;
		const MAX_ATTEMPTS = 20; // ~30s total

		const poll = async () => {
			attempts++;
			try {
				const res = await fetch(`/api/events/${eventId}/tickets`);
				if (res.ok) {
					const data = (await res.json()) as { tickets?: TicketData[] };
					if (data.tickets && data.tickets.length > 0) {
						myTickets = data.tickets;
						if (pollTimer) clearInterval(pollTimer);
						pollTimer = null;
						return;
					}
				}
			} catch {
				// keep polling
			}

			if (attempts >= MAX_ATTEMPTS && pollTimer) {
				clearInterval(pollTimer);
				pollTimer = null;
			}
		};

		// First attempt immediately, then every 1.5s
		poll();
		pollTimer = setInterval(poll, 1500);
	}

	// Cleanup on unmount
	onDestroy(() => {
		if (pollTimer) clearInterval(pollTimer);
	});

	function handleBackToSelect() {
		stage = 'select';
		error = '';
		confirming = false;
		elements = null;
		stripe = null;
	}

	// Svelte tick for DOM updates
	async function tick() {
		return new Promise((resolve) => setTimeout(resolve, 0));
	}
</script>

{#if ticketsLoading}
	<!-- Don't flash buy form while checking for existing tickets -->
{:else if hasTickets && stage !== 'success'}
	<div class="space-y-4">
		<h3 class="flex items-center gap-2 text-label-md font-medium text-[var(--text-primary)]">
			<Ticket size={18} weight="duotone" class="text-[var(--accent-primary)]" />
			Your Tickets
		</h3>
		{#each myTickets as ticket (ticket.ticket_id)}
			<div class="space-y-3">
				<TicketCard {ticket} {eventTitle} />
				<TicketActions
					{ticket}
					{eventId}
				/>
			</div>
		{/each}
	</div>
{:else if stage === 'select'}
	<div
		class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 space-y-4"
	>
		<h3 class="flex items-center gap-2 text-label-md font-medium text-[var(--text-primary)]">
			<Ticket size={18} weight="duotone" class="text-[var(--accent-primary)]" />
			Get Tickets
		</h3>

		<div class="flex items-center justify-between">
			<span class="text-body-md text-[var(--text-secondary)]"
				>{formatPrice(priceCents)} per ticket</span
			>

			<div class="flex items-center gap-3">
				<button
					type="button"
					aria-label="Decrease quantity"
					class="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-overlay)] disabled:opacity-40"
					disabled={quantity <= 1}
					onclick={() => quantity--}
				>
					<Minus size={14} weight="bold" />
				</button>
				<span class="w-6 text-center text-body-md font-medium text-[var(--text-primary)]"
					>{quantity}</span
				>
				<button
					type="button"
					aria-label="Increase quantity"
					class="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-overlay)] disabled:opacity-40"
					disabled={quantity >= maxQuantity}
					onclick={() => quantity++}
				>
					<Plus size={14} weight="bold" />
				</button>
			</div>
		</div>

		<div class="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
			<span class="text-body-sm text-[var(--text-muted)]">Total</span>
			<span class="text-body-md font-bold text-[var(--text-primary)]"
				>{formatPrice(totalCents)}</span
			>
		</div>

		{#if error}
			<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
		{/if}

		<button
			class="w-full rounded-full bg-[var(--accent-primary)] px-6 py-3 text-label-md font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:opacity-50"
			disabled={stripeLoading}
			onclick={handleContinueToPayment}
		>
			{#if stripeLoading}
				<span class="flex items-center justify-center gap-2">
					<CircleNotch size={16} weight="bold" class="animate-spin" />
					Loading payment...
				</span>
			{:else}
				Continue to Payment
			{/if}
		</button>

		<p class="text-caption text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
			<ShieldCheck size={12} weight="duotone" class="text-[var(--accent-primary)]" />
			Secure payment via Stripe
		</p>
	</div>
{:else if stage === 'payment'}
	<div
		class="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-5 space-y-3"
		in:organicFade
	>
		<div class="flex items-center justify-between">
			<h3 class="flex items-center gap-2 text-label-md font-medium text-[var(--text-primary)]">
				<Ticket size={18} weight="duotone" class="text-[var(--accent-primary)]" />
				Payment
			</h3>
			<button
				type="button"
				class="text-body-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
				disabled={confirming}
				onclick={handleBackToSelect}
			>
				Back
			</button>
		</div>

		<p class="text-body-sm text-[var(--text-secondary)]">
			{quantity} ticket{quantity > 1 ? 's' : ''} &middot; {formatPrice(paymentAmount)}
		</p>

		<!-- Stripe Payment Element mounts here -->
		<div bind:this={paymentRef} class="stripe-payment-element min-h-[80px]"></div>

		{#if error}
			<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
		{/if}

		<button
			class="w-full rounded-full bg-[var(--accent-primary)] px-6 py-3 text-label-md font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.98] disabled:opacity-50"
			disabled={confirming}
			onclick={handlePay}
		>
			{#if confirming}
				<span class="flex items-center justify-center gap-2">
					<CircleNotch size={16} weight="bold" class="animate-spin" />
					Processing...
				</span>
			{:else}
				Pay {formatPrice(paymentAmount)}
			{/if}
		</button>

		<p class="text-caption text-[var(--text-muted)] text-center flex items-center justify-center gap-1">
			<ShieldCheck size={12} weight="duotone" class="text-[var(--accent-primary)]" />
			Secure payment via Stripe
		</p>
	</div>
{:else if stage === 'success'}
	<div class="space-y-4" in:organicFade>
		<div class="flex flex-col items-center gap-3 py-4">
			<div
				class="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-primary)]/15"
			>
				<CheckCircle size={36} weight="duotone" class="text-[var(--accent-primary)]" />
			</div>
			<h3 class="text-display-sm text-[var(--text-primary)]">You're in!</h3>
			<p class="text-body-sm text-[var(--text-secondary)]">Your ticket has been confirmed.</p>
		</div>

		{#if myTickets.length > 0}
			{#each myTickets as ticket (ticket.ticket_id)}
				<div class="space-y-3">
					<TicketCard {ticket} {eventTitle} />
					<TicketActions
						{ticket}
						{eventId}
					/>
				</div>
			{/each}
		{:else}
			<p class="text-body-sm text-[var(--text-muted)] text-center">
				Your ticket is being processed. It will appear here shortly.
			</p>
		{/if}
	</div>
{/if}
