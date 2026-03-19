<script lang="ts">
	import PhoneInput from './PhoneInput.svelte';
	import CodeInput from './CodeInput.svelte';
	import { formatDisplayName } from '$lib/utils/name-format';

	interface Props {
		open: boolean;
		onClose: () => void;
		onAuthenticated: () => void;
		redirectTo?: string;
		/** Exposed so parents can focus it synchronously in click handlers to keep iOS keyboard open */
		proxyRef?: HTMLInputElement;
	}

	let { open, onClose, onAuthenticated, redirectTo, proxyRef = $bindable() }: Props = $props();

	let step = $state<'phone' | 'code' | 'name'>('phone');
	let phone = $state('');
	let verificationId = $state('');
	let loading = $state(false);
	let error = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let namePreview = $derived(formatDisplayName(firstName, lastName));
	// Detect iOS Safari vs other iOS browsers (Chrome, Firefox, Edge).
	// Safari's OTP autofill breaks when a hidden proxy input holds focus,
	// so we skip the proxy on Safari for the phone→code transition.
	// Chrome iOS works fine with the proxy.
	const isSafariIOS =
		typeof navigator !== 'undefined' &&
		/iPhone|iPad/.test(navigator.userAgent) &&
		!/CriOS|FxiOS|OPiOS|EdgiOS/.test(navigator.userAgent);

	// Proxy input keeps the iOS keyboard open across async transitions.
	// iOS Safari only opens the keyboard for focus() calls synchronous with a user gesture.
	// On Safari, we skip the proxy for the phone→code step (OTP autofill won't work otherwise).
	// On Chrome, we use the proxy to keep the keyboard open seamlessly.
	let proxyInputEl: HTMLInputElement | undefined = $state();

	// Sync the internal ref to the bindable prop so parents can access it
	$effect(() => {
		proxyRef = proxyInputEl;
	});

	async function handleSendCode(phoneNumber: string) {
		loading = true;
		error = '';

		// On Chrome iOS: focus the proxy to keep the keyboard open across the await.
		// On Safari iOS: skip the proxy — it breaks OTP autofill. The keyboard will
		// briefly dismiss but OTP "From Messages" suggestion will work when the
		// real code input mounts and the user taps it.
		if (!isSafariIOS) {
			proxyInputEl?.focus();
		}

		try {
			const res = await fetch('/api/auth/send-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone: phoneNumber })
			});
			const data = (await res.json()) as { error?: string; verification_id?: string };
			if (!res.ok) {
				error = data.error || 'Failed to send code';
				return;
			}
			phone = phoneNumber;
			verificationId = data.verification_id ?? '';
			step = 'code';
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleVerifyCode(code: string) {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/auth/verify-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					verification_id: verificationId,
					code,
					redirect_to: redirectTo
				})
			});
			const data = (await res.json()) as {
				error?: string;
				success?: boolean;
				user?: { display_name?: string | null };
			};
			if (!res.ok) {
				error = data.error || 'Invalid code';
				return;
			}
			// If user has no display name, prompt for one
			if (!data.user?.display_name) {
				step = 'name';
				return;
			}
			onAuthenticated();
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function handleSetName() {
		const first = firstName.trim();
		const last = lastName.trim();
		if (!first) {
			error = 'First name is required';
			return;
		}
		if (!last) {
			error = 'Last name is required';
			return;
		}
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/users/me', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ first_name: first, last_name: last })
			});
			if (!res.ok) {
				const data = (await res.json()) as { error?: string };
				error = data.error || 'Failed to save name';
				return;
			}
			onAuthenticated();
		} catch {
			error = 'Network error. Please try again.';
		} finally {
			loading = false;
		}
	}

	function handleBack() {
		step = 'phone';
		error = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
		if (e.key === 'Tab') trapFocus(e);
	}

	function trapFocus(e: KeyboardEvent) {
		const modal = document.querySelector('[role="dialog"]') as HTMLElement | null;
		if (!modal) return;
		const focusable = modal.querySelectorAll<HTMLElement>(
			'input, button, [tabindex]:not([tabindex="-1"])'
		);
		if (focusable.length === 0) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	// Transfer focus from proxy to the active input when modal opens or step changes.
	// If the parent focused the proxy synchronously, the keyboard is already open
	// and this swap preserves it. Falls back to rAF for desktop/non-proxy opens.
	$effect(() => {
		if (open && step === 'phone') {
			const tryFocus = () => {
				const modal = document.querySelector('[role="dialog"]') as HTMLElement | null;
				const phoneInput = modal?.querySelector<HTMLElement>('input#phone');
				phoneInput?.focus();
			};
			tryFocus();
			requestAnimationFrame(tryFocus);
		}
		if (open && step === 'name') {
			const tryFocus = () => {
				const modal = document.querySelector('[role="dialog"]') as HTMLElement | null;
				const nameInput = modal?.querySelector<HTMLElement>('input#auth-first-name');
				nameInput?.focus();
			};
			tryFocus();
			requestAnimationFrame(tryFocus);
		}
	});
</script>

<!-- Hidden proxy input — always in DOM so parents can focus it synchronously
     in click handlers BEFORE setting open=true, keeping the iOS keyboard open.
     Also used during phone→code transition. -->
<input
	bind:this={proxyInputEl}
	type="text"
	inputmode="tel"
	autocomplete="off"
	tabindex={-1}
	aria-hidden="true"
	style="position: fixed; top: -9999px; left: -9999px; width: 0; height: 0; opacity: 0; pointer-events: none;"
/>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-label="Sign in"
		tabindex="-1"
		onkeydown={handleKeydown}
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 backdrop-blur-sm cursor-default"
			style="background: var(--backdrop-overlay)"
			role="presentation"
			onclick={onClose}
		></div>

		<!-- Modal -->
		<div
			class="relative w-full max-w-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-6 shadow-[var(--shadow-lg)]"
		>
			<h2 class="text-headline-md text-[var(--text-primary)] mb-6 text-center">
				{step === 'name' ? "What's your name?" : 'Verify your phone'}
			</h2>

			{#if step === 'phone'}
				<PhoneInput onSubmit={handleSendCode} {loading} {error} />
			{:else if step === 'code'}
				<CodeInput {phone} onSubmit={handleVerifyCode} onBack={handleBack} {loading} {error} />
			{:else}
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<label for="auth-first-name" class="text-label-sm text-[var(--text-muted)]">First name</label>
							<input
								id="auth-first-name"
								type="text"
								bind:value={firstName}
								placeholder="First"
								maxlength={30}
								class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
							/>
						</div>
						<div class="space-y-1.5">
							<label for="auth-last-name" class="text-label-sm text-[var(--text-muted)]">Last name</label>
							<input
								id="auth-last-name"
								type="text"
								bind:value={lastName}
								placeholder="Last"
								maxlength={30}
								class="flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-input)] px-3 py-2 text-body-md text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors duration-150 focus:border-[var(--border-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-glow)]"
								onkeydown={(e) => { if (e.key === 'Enter') handleSetName(); }}
							/>
						</div>
					</div>
					{#if namePreview}
						<p class="text-body-sm text-[var(--text-secondary)] text-center">
							You'll appear as <span class="font-semibold text-[var(--text-primary)]">{namePreview}</span>
						</p>
					{/if}
					{#if error}
						<p class="text-body-sm text-[var(--feedback-error)]">{error}</p>
					{/if}
					<button
						class="w-full rounded-full px-6 py-3 text-label-lg font-semibold bg-[var(--accent-primary)] text-[var(--surface-base)] hover:bg-[var(--accent-hover)] transition-all duration-150 disabled:opacity-50"
						disabled={loading || !firstName.trim() || !lastName.trim()}
						onclick={handleSetName}
					>
						{loading ? 'Saving...' : 'Continue'}
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
