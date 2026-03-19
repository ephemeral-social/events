<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { CircleNotch, Warning } from 'phosphor-svelte';
	import type { AccountSessionResponse, StripeStatusResponse } from '$lib/types/payments';

	let {
		publishableKey,
		onComplete,
		onRetry,
		eventId
	}: {
		publishableKey: string;
		onComplete: () => void;
		onRetry: () => void;
		eventId?: string;
	} = $props();

	let container: HTMLDivElement;
	let status = $state<'loading' | 'active' | 'incomplete' | 'complete' | 'error'>('loading');
	let errorMessage = $state('');
	let destroyed = false;

	onDestroy(() => {
		destroyed = true;
		if (container) container.innerHTML = '';
	});

	/** Stripe embedded onboarding appearance — Ephemeral warm dark palette */
	const appearance = {
		overlays: 'drawer' as const,
		variables: {
			// Typography — Stripe only supports ONE fontFamily
			fontFamily: "'Manrope Variable', sans-serif",
			fontSizeBase: '14px',
			bodyMdFontSize: '14px',
			bodyMdFontWeight: '400',
			bodySmFontSize: '13px',
			bodySmFontWeight: '400',
			headingXlFontSize: '20px',
			headingXlFontWeight: '600',
			headingLgFontSize: '18px',
			headingLgFontWeight: '600',
			headingMdFontSize: '16px',
			headingMdFontWeight: '500',
			labelMdFontSize: '13px',
			labelMdFontWeight: '500',

			// Colors — Ephemeral warm dark palette
			colorPrimary: '#52b788',
			colorBackground: '#1a1918',
			colorText: '#ede9e3',
			colorSecondaryText: '#a39e96',
			colorBorder: '#2e2c2a',
			colorDanger: '#e85d04',
			buttonPrimaryColorBackground: '#52b788',
			buttonPrimaryColorText: '#111110',
			buttonPrimaryColorBorder: '#52b788',
			buttonSecondaryColorBackground: '#232220',
			buttonSecondaryColorText: '#ede9e3',
			buttonSecondaryColorBorder: '#2e2c2a',

			// Form
			formBackgroundColor: '#1a1918',
			formHighlightColorBorder: '#52b788',
			formAccentColor: '#52b788',
			offsetBackgroundColor: '#111110',

			// Shape
			borderRadius: '12px',
			buttonBorderRadius: '9999px',
			spacingUnit: '8px'
		}
	};

	onMount(async () => {
		try {
			const { loadConnectAndInitialize } = await import('@stripe/connect-js/pure');

			// 1. Ensure Stripe Connect account exists
			const onboardOpts: RequestInit = { method: 'POST' };
			if (eventId) {
				onboardOpts.headers = { 'Content-Type': 'application/json' };
				onboardOpts.body = JSON.stringify({ event_id: eventId });
			}
			const onboardRes = await fetch('/api/payments/stripe-onboard', onboardOpts);
			if (!onboardRes.ok) {
				const errData = await onboardRes.json().catch(() => ({})) as { error?: string };
				status = 'error';
				errorMessage = errData.error || 'Failed to set up payment account. Please try again.';
				return;
			}

			if (destroyed) return;

		// 2. Initialize Connect.js
			const stripeInstance = loadConnectAndInitialize({
				publishableKey,
				fetchClientSecret: async () => {
					const res = await fetch('/api/payments/account-session', { method: 'POST' });
					if (!res.ok) throw new Error('Failed to create account session');
					const data: AccountSessionResponse = await res.json();
					return data.client_secret;
				},
				appearance,
				fonts: [
					{ cssSrc: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600' }
				]
			});

			// 3. Create and mount the onboarding component
			// Note: API uses underscores (account_onboarding), Connect.js uses hyphens
			const onboarding = stripeInstance.create('account-onboarding');
			onboarding.setOnExit(() => {
				if (!destroyed) checkStatus();
			});
			onboarding.setOnLoadError((error: { error: { message?: string } }) => {
				if (destroyed) return;
				status = 'error';
				errorMessage = error.error.message || 'Payment setup failed to load.';
			});
			container.appendChild(onboarding);
			status = 'active';
		} catch {
			if (destroyed) return;
			status = 'error';
			errorMessage = 'Failed to load payment setup. Please refresh and try again.';
		}
	});

	async function checkStatus(retries = 3, delayMs = 1000) {
		if (destroyed) return;
		for (let attempt = 0; attempt < retries; attempt++) {
			if (destroyed) return;
			try {
				const res = await fetch('/api/payments/stripe-status');
				if (!res.ok) {
					status = 'error';
					errorMessage = 'Could not verify payment setup status.';
					return;
				}
				const data: StripeStatusResponse = await res.json();
				if (data.charges_enabled) {
					status = 'complete';
					onComplete();
					return;
				}
				// If details were submitted but charges not yet enabled, Stripe is verifying.
				// Redirect to event page which shows the "verification in progress" banner.
				if (data.details_submitted) {
					status = 'complete';
					onComplete();
					return;
				}
				// Stripe's charges_enabled may not be instantly true after onboarding.
				// Retry with backoff before falling through to 'incomplete'.
				if (attempt < retries - 1) {
					await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
				}
			} catch {
				if (attempt === retries - 1) {
					status = 'error';
					errorMessage = 'Could not verify payment setup status.';
					return;
				}
				await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
			}
		}
		status = 'incomplete';
	}
</script>

{#if status === 'loading'}
	<div class="flex items-center justify-center py-8">
		<CircleNotch size={24} weight="bold" class="animate-spin text-[var(--accent-primary)]" />
		<span class="ml-3 text-body-sm text-[var(--text-secondary)]">Setting up payments...</span>
	</div>
{:else if status === 'error'}
	<div
		class="rounded-xl border border-[var(--feedback-error)]/30 bg-[var(--surface-card)] p-4 text-center"
	>
		<Warning size={24} weight="duotone" class="mx-auto mb-2 text-[var(--feedback-error)]" />
		<p class="text-body-sm text-[var(--text-secondary)]">{errorMessage}</p>
		<button
			type="button"
			onclick={onRetry}
			class="mt-3 rounded-full bg-[var(--surface-overlay)] px-4 py-2 text-label-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--border-default)]"
		>
			Try again
		</button>
	</div>
{:else if status === 'incomplete'}
	<div
		class="rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 text-center"
	>
		<p class="text-body-sm text-[var(--text-secondary)]">
			Payment setup isn't complete yet. You'll need to finish it before creating a ticketed event.
		</p>
		<button
			type="button"
			onclick={onRetry}
			class="mt-3 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-label-sm font-medium text-[var(--surface-base)] transition-colors hover:bg-[var(--accent-hover)]"
		>
			Continue setup
		</button>
	</div>
{/if}

<!-- Connect.js mounts the onboarding component here -->
<div bind:this={container} class:hidden={status !== 'active'}></div>
