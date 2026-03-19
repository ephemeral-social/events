<script lang="ts">
	let {
		open = $bindable(false),
		waitlistCount = 0,
		apiUrl = 'https://ephemeral-waitlist.ephemeralsocial.workers.dev',
		stripeLink = ''
	}: {
		open: boolean;
		waitlistCount: number;
		apiUrl?: string;
		stripeLink?: string;
	} = $props();

	let email = $state('');
	let submitting = $state(false);
	let showSuccess = $state(false);
	let position = $state(0);
	let referralCount = $state(0);
	let referralCode = $state('');
	let subscriberEmail = $state('');
	let copyText = $state('Copy');

	function getReferrerCode(): string | null {
		if (typeof window === 'undefined') return null;
		return new URLSearchParams(window.location.search).get('ref');
	}

	$effect(() => {
		if (!open) return;
		// Check returning user
		const savedCode = localStorage.getItem('ephemeral_referral_code');
		if (!savedCode) return;

		fetch(`${apiUrl}/api/subscriber/${savedCode}`)
			.then((r) => {
				if (!r.ok) {
					localStorage.removeItem('ephemeral_referral_code');
					return null;
				}
				return r.json() as Promise<{ referralCode: string; position: number; referralCount: number }>;
			})
			.then((data) => {
				if (!data) return;
				referralCode = data.referralCode;
				position = data.position;
				referralCount = data.referralCount;
				showSuccess = true;
			})
			.catch(() => {});
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		submitting = true;
		try {
			const res = await fetch(`${apiUrl}/api/subscribe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, referrer: getReferrerCode() })
			});
			const data = (await res.json()) as {
				success?: boolean;
				referralCode?: string;
				position?: number;
				referralCount?: number;
				error?: string;
			};
			if (data.success) {
				subscriberEmail = email;
				referralCode = data.referralCode ?? '';
				position = data.position ?? 0;
				referralCount = data.referralCount ?? 0;
				localStorage.setItem('ephemeral_referral_code', referralCode);
				showSuccess = true;
			} else {
				throw new Error(data.error || 'Failed to join');
			}
		} catch {
			alert('Something went wrong. Please try again.');
		} finally {
			submitting = false;
		}
	}

	async function copyReferral() {
		const link = `https://ephemeralsocial.com/?ref=${referralCode}`;
		try {
			await navigator.clipboard.writeText(link);
		} catch {
			// fallback
		}
		copyText = 'Copied!';
		setTimeout(() => (copyText = 'Copy'), 2000);
	}

	function redirectToStripe() {
		const url = new URL(stripeLink);
		url.searchParams.set('prefilled_email', subscriberEmail);
		url.searchParams.set('client_reference_id', referralCode);
		window.location.href = url.toString();
	}

	function close() {
		open = false;
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-6"
		role="dialog"
		aria-modal="true"
		aria-label="Join the waitlist"
		tabindex="-1"
		onclick={(e) => { if (e.target === e.currentTarget) close(); }}
		onkeydown={(e) => { if (e.key === 'Escape') close(); }}
	>
		<div
			class="relative w-full max-w-[440px] rounded-2xl border border-[var(--border-default)] bg-[var(--surface-overlay)] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.4)]"
		>
			<button
				class="absolute right-5 top-5 flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent text-xl text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
				onclick={close}
			>
				&times;
			</button>

			{#if !showSuccess}
				<h3 class="mb-2 text-display-sm text-[var(--accent-primary)]">Join the waitlist</h3>
				<p class="mb-8 text-[var(--text-secondary)]">We'll let you know when it's your turn.</p>
				<form onsubmit={handleSubmit}>
					<input
						type="email"
						bind:value={email}
						placeholder="your@email.com"
						required
						class="mb-4 w-full rounded-xl border-2 border-[var(--border-default)] bg-[rgba(255,255,255,0.04)] px-5 py-4 font-sans text-base text-[var(--text-primary)] outline-none transition-colors focus:border-[#FA7045]"
					/>
					<button
						type="submit"
						disabled={submitting}
						class="w-full cursor-pointer rounded-xl border-none bg-[#FA7045] px-5 py-4 text-[1.05rem] font-semibold text-white shadow-[0_2px_12px_rgba(250,112,69,0.15)] transition-all hover:brightness-[0.92] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{submitting ? 'Joining...' : 'Join Waitlist'}
					</button>
				</form>
			{:else}
				<div class="text-center">
					<div class="mb-4">
						<img src="/landing/favicon.png" alt="" class="inline-block h-12 w-12 rounded-xl" />
					</div>
					<h3 class="mb-2 text-display-sm text-[var(--accent-primary)]">
						You're #{position}
					</h3>
					<p class="mb-8 text-[var(--text-secondary)]">
						{referralCount} referrals &middot; Share your link to move up!
					</p>
					<div class="mb-8 flex gap-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] p-4">
						<input
							type="text"
							value="ephemeralsocial.com/?ref={referralCode}"
							readonly
							class="flex-1 rounded-lg border-none bg-[rgba(255,255,255,0.04)] px-3 py-3 font-sans text-sm text-[var(--text-secondary)]"
						/>
						<button
							onclick={copyReferral}
							class="cursor-pointer rounded-lg border border-[rgba(250,112,69,0.3)] bg-[rgba(250,112,69,0.15)] px-4 py-3 font-sans font-semibold text-[#FA7045]"
						>
							{copyText}
						</button>
					</div>
					{#if stripeLink}
					<div class="mb-6 flex items-center gap-4">
						<div class="h-px flex-1 bg-[var(--border-default)]"></div>
						<span class="text-sm text-[var(--text-muted)]">or skip the line</span>
						<div class="h-px flex-1 bg-[var(--border-default)]"></div>
					</div>
					<div class="rounded-xl border border-[rgba(107,0,41,0.2)] bg-[linear-gradient(135deg,rgba(139,16,64,0.15),rgba(139,16,64,0.05))] p-6">
						<p class="mb-4 text-[var(--text-primary)]">
							Pre-order at a discount <strong class="text-[#FFBABA]">($45/year)</strong> and jump the waitlist.
						</p>
						<button
							onclick={redirectToStripe}
							class="w-full cursor-pointer rounded-xl border-none bg-[#6B0029] px-5 py-4 font-semibold text-white shadow-[0_2px_8px_rgba(107,0,41,0.2)] transition-all hover:brightness-[0.92]"
						>
							Become a Founder &mdash; $45
						</button>
						<p class="mt-3 text-xs text-[var(--text-muted)]">
							Normally $70/year. Lock in $45 forever.
						</p>
					</div>
				{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
