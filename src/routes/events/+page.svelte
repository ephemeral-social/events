<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { CalendarBlank, Plus, Ticket, Palette, ShieldCheck, GearSix, Question } from 'phosphor-svelte';
	import { animateIn, scrollReveal, pressFeedback } from '$lib/motion';
	import { hapticLight } from '$lib/utils/haptics';
	import EphemeralEventsLogo from '$lib/components/landing/EphemeralEventsLogo.svelte';
	import { openTawkChat } from '$lib/utils/tawk';
	import AuthModal from '$lib/components/auth/AuthModal.svelte';
	import EventCard from '$lib/components/dashboard/EventCard.svelte';

	let { data } = $props();

	let showAuth = $state(false);
	let authProxyRef: HTMLInputElement | undefined = $state();
	let postAuthRedirect = $state<'dashboard' | 'create'>('dashboard');
	let tab = $state<'hosting' | 'attending'>('attending');
	let events = $state<
		Array<{
			event_id: string;
			title: string;
			start_time: string;
			timezone?: string;
			slug?: string;
			is_host?: number;
			my_rsvp?: string;
		}>
	>([]);
	let eventsLoading = $state(false);
	let eventsError = $state('');

	const isAuthenticated = $derived(!!data.user);

	const hostingEvents = $derived(events.filter((e) => e.is_host));
	const attendingEvents = $derived(
		events
			.filter((e) => !e.is_host && e.my_rsvp)
			.sort((a, b) => {
				// Invited events first
				if (a.my_rsvp === 'invited' && b.my_rsvp !== 'invited') return -1;
				if (b.my_rsvp === 'invited' && a.my_rsvp !== 'invited') return 1;
				// Then by start_time
				return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
			})
	);
	const currentEvents = $derived(tab === 'hosting' ? hostingEvents : attendingEvents);

	// Aesthetic showcase rotation
	const aestheticShowcase = [
		{
			id: 'simple',
			name: 'Simple',
			font: 'var(--font-body)',
			weight: '500',
			transform: 'none',
			tracking: '0em'
		},
		{
			id: 'fun',
			name: 'Fun',
			font: 'var(--font-body)',
			weight: '800',
			transform: 'none',
			tracking: '0em'
		},
		{
			id: 'warm',
			name: 'Warm',
			font: 'var(--font-heading)',
			weight: '300',
			transform: 'none',
			tracking: '0em'
		},
		{
			id: 'elegant',
			name: 'Elegant',
			font: 'var(--font-heading)',
			weight: '300',
			transform: 'uppercase',
			tracking: '0.08em'
		}
	];
	let activeAesthetic = $state(0);

	$effect(() => {
		if (isAuthenticated) loadEvents();
	});

	$effect(() => {
		if (isAuthenticated) return;
		const interval = setInterval(() => {
			activeAesthetic = (activeAesthetic + 1) % aestheticShowcase.length;
		}, 1200);
		return () => clearInterval(interval);
	});

	async function loadEvents() {
		eventsLoading = true;
		eventsError = '';
		try {
			const res = await fetch('/api/my-events');
			if (res.status === 401) {
				showAuth = true;
				return;
			}
			const json = (await res.json()) as { events?: typeof events; error?: string };
			if (!res.ok) {
				eventsError = json.error || 'Failed to load events';
				return;
			}
			events = json.events || [];
		} catch {
			eventsError = 'Network error';
		} finally {
			eventsLoading = false;
		}
	}

	async function handleAuthenticated() {
		showAuth = false;
		await invalidateAll();
		if (postAuthRedirect === 'create') {
			await goto('/create');
		} else {
			await loadEvents();
		}
	}

	function startCreate() {
		hapticLight();
		postAuthRedirect = 'create';
		authProxyRef?.focus();
		showAuth = true;
	}

	function startSignIn() {
		hapticLight();
		postAuthRedirect = 'dashboard';
		authProxyRef?.focus();
		showAuth = true;
	}

	function openSupport() {
		openTawkChat();
	}
</script>

<svelte:head>
	<title>Ephemeral Events — Event pages that auto-delete</title>
	<meta
		name="description"
		content="Create event pages with built-in ticketing. Zero fees on your first 50 tickets. Four design aesthetics. Everything auto-deletes after your event."
	/>
</svelte:head>

{#if !isAuthenticated}
	<!-- ═══════════════════════════ LANDING ═══════════════════════════ -->

	<div class="landing-bg" aria-hidden="true">
		<div class="landing-grain"></div>
		<div class="landing-glow landing-glow-1"></div>
		<div class="landing-glow landing-glow-2"></div>
		<div class="landing-glow landing-glow-3"></div>
	</div>

	<main class="landing">
		<!-- ── Hero ── -->
		<section class="hero">
			<div class="hero-inner">
				<div use:animateIn={{ delay: 0 }}>
					<EphemeralEventsLogo size="sm" />
				</div>

				<div use:animateIn={{ delay: 150 }}>
					<h1 class="hero-headline">
						Events that end<br />when they're over.
					</h1>
					<div class="hero-accent-line" aria-hidden="true"></div>
				</div>

				<div class="hero-manifesto">
					<span class="manifesto-line" use:animateIn={{ delay: 300 }}>No data sharing</span>
					<span class="manifesto-sep" use:animateIn={{ delay: 380 }} aria-hidden="true"></span>
					<span class="manifesto-line" use:animateIn={{ delay: 460 }}>No surveillance</span>
					<span class="manifesto-sep" use:animateIn={{ delay: 540 }} aria-hidden="true"></span>
					<span class="manifesto-line" use:animateIn={{ delay: 620 }}>No bullshit</span>
				</div>

				<p class="hero-sub" use:animateIn={{ delay: 720 }}>
					Event pages with built-in ticketing. No fees on your first 50.
					Everything auto-deletes after your event.
				</p>

				<div class="hero-actions" use:animateIn={{ delay: 850 }}>
					<button class="btn-primary" use:pressFeedback onclick={startCreate}>
						Create your first event
					</button>
					<button class="btn-text-link" use:pressFeedback onclick={startSignIn}>
						Already have an account? <span class="link-underline">Sign in</span>
					</button>
				</div>

				<a
					href="https://fuckpartiful.com"
					class="surveillance-link"
					target="_blank"
					rel="noopener noreferrer"
					use:animateIn={{ delay: 1000 }}
				>
					What do you mean "surveillance"?
				</a>
			</div>
		</section>

		<!-- ── Value Props ── -->
		<section class="props">
			<!-- ─ Ticketing ─ -->
			<div class="prop" use:scrollReveal={{ y: 18 }}>
				<div class="prop-icon-row">
					<Ticket size={20} weight="duotone" class="prop-icon" />
					<h3 class="prop-title">Ticketing built in, no fees.</h3>
				</div>
				<p class="prop-desc">
					No service charges. No "convenience" surcharges. Your first 50 tickets sold are
					completely free. Built for artists and independent hosts, not ad revenue.
				</p>
			</div>

			<!-- Ticket phone mockup -->
			<div class="mockup-container" use:scrollReveal={{ y: 20, delay: 60 }}>
				<div class="phone-frame">
					<div class="phone-island" aria-hidden="true"></div>
					<div class="phone-screen ticket-screen">
						<!-- Dimmed event page background -->
						<div class="ticket-backdrop">
							<div class="ticket-bg-title">Summer Gallery</div>
							<div class="ticket-bg-sub">Opening Night</div>
						</div>
						<!-- Bottomsheet -->
						<div class="ticket-sheet">
							<div class="ticket-handle" aria-hidden="true"></div>
							<div class="ticket-event-name">Summer Gallery Opening</div>
							<div class="ticket-event-date">Sat, Mar 15 &middot; 7:00 PM</div>
							<!-- QR Code -->
							<div class="ticket-qr-wrap">
								<svg class="ticket-qr" viewBox="0 0 25 25" aria-label="QR code">
									<!-- Top-left finder -->
									<rect x="0" y="0" width="7" height="7" fill="currentColor" />
									<rect x="1" y="1" width="5" height="5" fill="#ede9e3" />
									<rect x="2" y="2" width="3" height="3" fill="currentColor" />
									<!-- Top-right finder -->
									<rect x="18" y="0" width="7" height="7" fill="currentColor" />
									<rect x="19" y="1" width="5" height="5" fill="#ede9e3" />
									<rect x="20" y="2" width="3" height="3" fill="currentColor" />
									<!-- Bottom-left finder -->
									<rect x="0" y="18" width="7" height="7" fill="currentColor" />
									<rect x="1" y="19" width="5" height="5" fill="#ede9e3" />
									<rect x="2" y="20" width="3" height="3" fill="currentColor" />
									<!-- Timing -->
									<rect x="8" y="6" width="1" height="1" fill="currentColor" />
									<rect x="10" y="6" width="1" height="1" fill="currentColor" />
									<rect x="12" y="6" width="1" height="1" fill="currentColor" />
									<rect x="6" y="8" width="1" height="1" fill="currentColor" />
									<rect x="6" y="10" width="1" height="1" fill="currentColor" />
									<rect x="6" y="12" width="1" height="1" fill="currentColor" />
									<!-- Data -->
									<rect x="9" y="1" width="1" height="1" fill="currentColor" />
									<rect x="11" y="3" width="1" height="1" fill="currentColor" />
									<rect x="9" y="4" width="1" height="1" fill="currentColor" />
									<rect x="12" y="2" width="1" height="1" fill="currentColor" />
									<rect x="10" y="8" width="1" height="1" fill="currentColor" />
									<rect x="8" y="9" width="1" height="1" fill="currentColor" />
									<rect x="11" y="10" width="1" height="1" fill="currentColor" />
									<rect x="9" y="12" width="1" height="1" fill="currentColor" />
									<rect x="12" y="11" width="1" height="1" fill="currentColor" />
									<rect x="14" y="8" width="1" height="1" fill="currentColor" />
									<rect x="16" y="9" width="1" height="1" fill="currentColor" />
									<rect x="15" y="11" width="1" height="1" fill="currentColor" />
									<rect x="18" y="10" width="1" height="1" fill="currentColor" />
									<rect x="17" y="12" width="1" height="1" fill="currentColor" />
									<rect x="20" y="8" width="1" height="1" fill="currentColor" />
									<rect x="19" y="13" width="1" height="1" fill="currentColor" />
									<rect x="8" y="14" width="1" height="1" fill="currentColor" />
									<rect x="10" y="15" width="1" height="1" fill="currentColor" />
									<rect x="12" y="14" width="1" height="1" fill="currentColor" />
									<rect x="14" y="15" width="1" height="1" fill="currentColor" />
									<rect x="16" y="16" width="1" height="1" fill="currentColor" />
									<rect x="18" y="15" width="1" height="1" fill="currentColor" />
									<rect x="15" y="18" width="1" height="1" fill="currentColor" />
									<rect x="17" y="19" width="1" height="1" fill="currentColor" />
									<rect x="19" y="17" width="1" height="1" fill="currentColor" />
									<rect x="20" y="20" width="1" height="1" fill="currentColor" />
									<rect x="14" y="20" width="1" height="1" fill="currentColor" />
									<rect x="16" y="21" width="1" height="1" fill="currentColor" />
									<rect x="8" y="18" width="1" height="1" fill="currentColor" />
									<rect x="10" y="20" width="1" height="1" fill="currentColor" />
									<rect x="12" y="19" width="1" height="1" fill="currentColor" />
								</svg>
							</div>
							<!-- Apple Wallet -->
							<img
								src="/add-to-apple-wallet.svg"
								alt="Add to Apple Wallet"
								class="ticket-wallet-btn"
							/>
						</div>
					</div>
				</div>
			</div>

			<!-- Ornamental divider -->
			<div class="ornament" aria-hidden="true" use:scrollReveal={{ y: 8 }}>
				<span class="ornament-line"></span>
				<span class="ornament-diamond"></span>
				<span class="ornament-line"></span>
			</div>

			<!-- ─ Aesthetics ─ -->
			<div class="prop" use:scrollReveal={{ y: 18, delay: 80 }}>
				<div class="prop-icon-row">
					<Palette size={20} weight="duotone" class="prop-icon" />
					<h3 class="prop-title">4 aesthetics. Not one.</h3>
				</div>
				<p class="prop-desc">
					Gallery opening, backyard cookout, formal dinner, warehouse show. Your page matches
					your event, not a template.
				</p>
			</div>

			<!-- Aesthetic showcase rotator -->
			<div class="mockup-container" use:scrollReveal={{ y: 20, delay: 120 }}>
				<!-- Rotating label in each aesthetic's font -->
				<div class="showcase-label-wrap">
					{#each aestheticShowcase as a, i}
						<span
							class="showcase-label"
							class:showcase-label-active={activeAesthetic === i}
							style="font-family: {a.font}; font-weight: {a.weight}; text-transform: {a.transform}; letter-spacing: {a.tracking};"
						>
							{a.name}
						</span>
					{/each}
				</div>
				<!-- Phone with rotating screenshots -->
				<div class="phone-frame showcase-frame">
					<div class="phone-island" aria-hidden="true"></div>
					<div class="phone-screen showcase-screen">
						{#each aestheticShowcase as a, i}
							<img
								src="/landing/aesthetics/{a.id}.png"
								alt="{a.name} aesthetic preview"
								class="showcase-img"
								class:showcase-img-active={activeAesthetic === i}
								loading="lazy"
							/>
						{/each}
					</div>
				</div>
				<!-- Dot indicators -->
				<div class="showcase-dots">
					{#each aestheticShowcase as _, i}
						<button
							class="showcase-dot"
							class:showcase-dot-active={activeAesthetic === i}
							onclick={() => (activeAesthetic = i)}
							aria-label="Show {aestheticShowcase[i].name} aesthetic"
						></button>
					{/each}
				</div>
			</div>

			<!-- Ornamental divider -->
			<div class="ornament" aria-hidden="true" use:scrollReveal={{ y: 8 }}>
				<span class="ornament-line"></span>
				<span class="ornament-diamond"></span>
				<span class="ornament-line"></span>
			</div>

			<!-- ─ Disappearing ─ -->
			<div class="prop" use:scrollReveal={{ y: 18, delay: 160 }}>
				<div class="prop-icon-row">
					<ShieldCheck size={20} weight="duotone" class="prop-icon" />
					<h3 class="prop-title">Everything disappears.</h3>
				</div>
				<p class="prop-desc">
					7 days after your event, it's all gone. Guest data, event pages, photos. Deleted for
					good. Never shared. Never sold.
				</p>
			</div>
		</section>

		<!-- ── Final CTA ── -->
		<section class="cta-final" use:scrollReveal={{ y: 18 }}>
			<div class="ornament ornament-wide" aria-hidden="true">
				<span class="ornament-line"></span>
				<span class="ornament-dot"></span>
				<span class="ornament-line"></span>
			</div>

			<button class="btn-primary" use:pressFeedback onclick={startCreate}>
				Create your first event
			</button>
			<p class="trust-line">
				No account needed to view events. Phone verification to RSVP. No spam. No data sold.
			</p>
		</section>

		<!-- ── Footer ── -->
		<footer class="landing-footer">
			<nav class="footer-links">
				<a href="/privacy" class="footer-link">Privacy</a>
				<span class="footer-sep" aria-hidden="true"></span>
				<a href="/terms" class="footer-link">Terms</a>
				<span class="footer-sep" aria-hidden="true"></span>
				<a
					href="https://ephemeralsocial.com"
					class="footer-link"
					target="_blank"
					rel="noopener noreferrer">What is Ephemeral?</a
				>
			</nav>
		</footer>
	</main>
{:else}
	<!-- ═══════════════════════════ DASHBOARD ═══════════════════════════ -->

	<div class="ambient-glow" aria-hidden="true"></div>

	<main class="relative z-10 mx-auto w-full max-w-lg px-4 py-6 space-y-6">
		<div class="flex items-center justify-between" use:animateIn={{ delay: 0 }}>
			<EphemeralEventsLogo size="sm" />
			<div class="flex items-center gap-2">
				<a
					href="/settings"
					class="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-default)] transition-colors duration-150 hover:bg-[var(--surface-overlay)]"
					aria-label="Settings"
				>
					<GearSix size={22} weight="bold" class="text-[var(--text-primary)]" />
				</a>
				<a
					href="/create"
					class="flex items-center gap-1.5 rounded-full bg-[var(--accent-primary)] px-4 py-2 text-label-sm font-semibold text-[var(--surface-base)] no-underline transition-all duration-150 hover:bg-[var(--accent-hover)]"
					use:pressFeedback
				>
					<Plus size={16} weight="bold" />
					Create Event
				</a>
			</div>
		</div>

		<div
			class="flex gap-1 rounded-full bg-[var(--surface-card)] p-1"
			use:animateIn={{ delay: 100 }}
		>
			<button
				class="flex-1 rounded-full px-4 py-2 text-label-sm font-medium transition-all duration-150 border-none cursor-pointer
					{tab === 'hosting'
					? 'bg-[var(--surface-overlay)] text-[var(--text-primary)]'
					: 'bg-transparent text-[var(--text-muted)]'}"
				onclick={() => {
					hapticLight();
					tab = 'hosting';
				}}
			>
				<CalendarBlank size={14} weight="regular" class="inline mr-1" />
				Hosting
			</button>
			<button
				class="flex-1 rounded-full px-4 py-2 text-label-sm font-medium transition-all duration-150 border-none cursor-pointer
					{tab === 'attending'
					? 'bg-[var(--surface-overlay)] text-[var(--text-primary)]'
					: 'bg-transparent text-[var(--text-muted)]'}"
				onclick={() => {
					hapticLight();
					tab = 'attending';
				}}
			>
				<Ticket size={14} weight="regular" class="inline mr-1" />
				Attending
			</button>
		</div>

		{#if eventsLoading}
			<p class="text-body-sm text-[var(--text-muted)] text-center py-8">Loading...</p>
		{:else if eventsError}
			<p class="text-body-sm text-[var(--feedback-error)] text-center py-8">{eventsError}</p>
		{:else if currentEvents.length === 0}
			<div class="text-center py-12 space-y-3" use:animateIn={{ delay: 200 }}>
				<CalendarBlank size={48} weight="thin" class="mx-auto text-[var(--text-muted)]" />
				<p class="text-body-md text-[var(--text-muted)]">
					{tab === 'hosting' ? 'No events yet' : 'No upcoming events'}
				</p>
				{#if tab === 'hosting'}
					<a
						href="/create"
						class="inline-block rounded-full bg-[var(--accent-primary)] px-6 py-2.5 text-label-md font-semibold text-[var(--surface-base)] no-underline transition-all duration-150 hover:bg-[var(--accent-hover)]"
						use:pressFeedback
					>
						Create your first event
					</a>
				{/if}
			</div>
		{:else}
			<div class="space-y-3">
				{#each currentEvents as event (event.event_id)}
					<EventCard {event} />
				{/each}
			</div>
		{/if}
	</main>

	<!-- Floating support button -->
	<button
		class="support-fab"
		use:pressFeedback
		use:animateIn={{ delay: 400 }}
		onclick={openSupport}
		aria-label="Contact support"
	>
		<Question size={20} weight="bold" />
	</button>
{/if}

<AuthModal
	open={showAuth}
	onClose={() => (showAuth = false)}
	onAuthenticated={handleAuthenticated}
	bind:proxyRef={authProxyRef}
/>

<style>
	/* ═══════════════════════════════════════════════════════════════════
	   LANDING PAGE
	   ═══════════════════════════════════════════════════════════════════ */

	/* ── Layered Background ── */

	.landing-bg {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 0;
		overflow: hidden;
	}

	.landing-grain {
		position: absolute;
		inset: 0;
		background-image: url('/textures/grain-warm.svg');
		background-repeat: repeat;
		opacity: 0.025;
	}

	.landing-glow {
		position: absolute;
		border-radius: 50%;
	}

	.landing-glow-1 {
		top: -20%;
		right: -12%;
		width: min(700px, 110vw);
		height: 600px;
		background: radial-gradient(
			ellipse at center,
			rgba(82, 183, 136, 0.08) 0%,
			rgba(82, 183, 136, 0.03) 35%,
			transparent 70%
		);
		animation: glow-drift-1 10s ease-in-out infinite alternate;
	}

	.landing-glow-2 {
		bottom: -15%;
		left: -18%;
		width: min(500px, 80vw);
		height: 420px;
		background: radial-gradient(
			ellipse at center,
			rgba(178, 137, 104, 0.05) 0%,
			rgba(178, 137, 104, 0.02) 35%,
			transparent 70%
		);
		animation: glow-drift-2 12s ease-in-out infinite alternate;
	}

	.landing-glow-3 {
		top: 30%;
		left: 50%;
		transform: translateX(-50%);
		width: min(400px, 70vw);
		height: 300px;
		background: radial-gradient(
			ellipse at center,
			rgba(82, 183, 136, 0.035) 0%,
			transparent 60%
		);
		animation: glow-breathe 6s ease-in-out infinite alternate;
	}

	@keyframes glow-drift-1 {
		0% {
			transform: translate(0, 0);
			opacity: 1;
		}
		100% {
			transform: translate(-15px, 10px);
			opacity: 0.75;
		}
	}

	@keyframes glow-drift-2 {
		0% {
			transform: translate(0, 0);
			opacity: 1;
		}
		100% {
			transform: translate(10px, -8px);
			opacity: 0.7;
		}
	}

	@keyframes glow-breathe {
		0% {
			opacity: 0.6;
		}
		100% {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.landing-glow-1,
		.landing-glow-2,
		.landing-glow-3 {
			animation: none;
		}
	}

	/* ── Landing Layout ── */

	.landing {
		position: relative;
		z-index: 1;
	}

	/* ── Hero Section ── */

	.hero {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.hero-inner {
		max-width: 480px;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.hero-headline {
		font-family: var(--font-heading);
		font-size: clamp(2.5rem, 9vw, 3.75rem);
		font-weight: 500;
		line-height: 1.06;
		letter-spacing: -0.03em;
		color: var(--text-primary);
		margin: 32px 0 0;
	}

	.hero-accent-line {
		width: 0;
		height: 1px;
		margin: 20px auto 0;
		background: linear-gradient(90deg, transparent, var(--accent-primary), transparent);
		animation: accent-grow 0.7s var(--motion-ease-enter) 0.55s forwards;
	}

	@keyframes accent-grow {
		to {
			width: 56px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-accent-line {
			animation: none;
			width: 56px;
		}
	}

	/* ── Hero Manifesto ── */

	.hero-manifesto {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		margin: 28px 0 0;
		flex-wrap: wrap;
	}

	.manifesto-line {
		font-family: var(--font-body);
		font-size: clamp(0.8rem, 2.5vw, 0.875rem);
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		line-height: 1.3;
	}

	.manifesto-sep {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--accent-primary);
		opacity: 0.6;
		flex-shrink: 0;
	}

	.hero-sub {
		font-family: var(--font-body);
		font-size: clamp(0.875rem, 2.5vw, 1.05rem);
		color: var(--text-secondary);
		line-height: 1.65;
		margin: 20px 0 0;
		max-width: 380px;
	}

	.hero-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		margin-top: 40px;
		width: 100%;
		max-width: 300px;
	}

	/* ── Shared Buttons ── */

	.btn-primary {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 14px 28px;
		border: none;
		border-radius: 9999px;
		background: var(--accent-primary);
		color: var(--surface-base);
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			background 150ms ease,
			transform 150ms ease,
			box-shadow 300ms ease;
		box-shadow: 0 0 0 0 rgba(82, 183, 136, 0);
	}

	.btn-primary:hover {
		background: var(--accent-hover);
		box-shadow: 0 4px 24px rgba(82, 183, 136, 0.15);
	}

	.btn-text-link {
		background: none;
		border: none;
		padding: 0;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: var(--text-muted);
		cursor: pointer;
		transition: color 150ms ease;
	}

	.btn-text-link:hover {
		color: var(--text-secondary);
	}

	.link-underline {
		color: var(--text-secondary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* ── Value Props ── */

	.props {
		max-width: 440px;
		margin: 0 auto;
		padding: 0 24px 40px;
	}

	.prop {
		padding: 24px 0;
	}

	.prop-icon-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}

	:global(.prop-icon) {
		color: var(--accent-primary);
		flex-shrink: 0;
		opacity: 0.85;
	}

	.prop-title {
		font-family: var(--font-heading);
		font-size: 1.3rem;
		font-weight: var(--heading-weight, 600);
		color: var(--text-primary);
		margin: 0;
		line-height: 1.3;
	}

	.prop-desc {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.65;
		margin: 0;
		padding-left: 30px;
	}

	/* ── Ornamental Dividers ── */

	.ornament {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 2px 0;
	}

	.ornament-line {
		width: 24px;
		height: 1px;
		background: var(--border-subtle);
	}

	.ornament-wide .ornament-line {
		width: 32px;
	}

	.ornament-diamond {
		width: 5px;
		height: 5px;
		background: var(--border-default);
		transform: rotate(45deg);
		flex-shrink: 0;
	}

	.ornament-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--border-default);
		flex-shrink: 0;
	}

	/* ═══════════════════════════════════════════════════════════════════
	   PHONE MOCKUPS (shared)
	   ═══════════════════════════════════════════════════════════════════ */

	.mockup-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 20px 0 8px;
	}

	.phone-frame {
		width: 164px;
		background: #0a0a09;
		border-radius: 26px;
		border: 2px solid #2e2c2a;
		padding: 6px;
		position: relative;
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.35),
			0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.phone-island {
		position: absolute;
		top: 12px;
		left: 50%;
		transform: translateX(-50%);
		width: 40px;
		height: 12px;
		background: #0a0a09;
		border-radius: 6px;
		z-index: 5;
	}

	.phone-screen {
		border-radius: 22px;
		overflow: hidden;
		position: relative;
	}

	/* ═══════════════════════════════════════════════════════════════════
	   TICKET MOCKUP
	   ═══════════════════════════════════════════════════════════════════ */

	.ticket-screen {
		height: 300px;
		background: var(--surface-base);
	}

	/* Dimmed event page background */
	.ticket-backdrop {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			var(--surface-base) 0%,
			color-mix(in srgb, var(--surface-base) 60%, transparent) 60%,
			color-mix(in srgb, var(--surface-base) 85%, transparent) 100%
		);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 36px;
		gap: 4px;
	}

	.ticket-bg-title {
		font-family: var(--font-heading);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-muted);
		opacity: 0.5;
	}

	.ticket-bg-sub {
		font-family: var(--font-body);
		font-size: 0.625rem;
		color: var(--text-muted);
		opacity: 0.35;
	}

	/* Bottomsheet */
	.ticket-sheet {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: var(--surface-raised);
		border-radius: 14px 14px 0 0;
		padding: 10px 14px 14px;
		display: flex;
		flex-direction: column;
		align-items: center;
		border-top: 1px solid var(--border-subtle);
		animation: sheet-rise 0.6s var(--motion-ease-enter) 0.4s both;
	}

	@keyframes sheet-rise {
		from {
			transform: translateY(30px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.ticket-sheet {
			animation: none;
		}
	}

	.ticket-handle {
		width: 28px;
		height: 3px;
		border-radius: 2px;
		background: var(--border-default);
		margin-bottom: 10px;
	}

	.ticket-event-name {
		font-family: var(--font-heading);
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text-primary);
		text-align: center;
	}

	.ticket-event-date {
		font-family: var(--font-body);
		font-size: 0.5625rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.ticket-qr-wrap {
		width: 90px;
		height: 90px;
		background: #ede9e3;
		border-radius: 8px;
		padding: 8px;
		margin: 10px 0 8px;
	}

	.ticket-qr {
		width: 100%;
		height: 100%;
		color: #111110;
	}

	.ticket-wallet-btn {
		height: 28px;
		width: auto;
		border-radius: 4px;
	}

	/* ═══════════════════════════════════════════════════════════════════
	   AESTHETIC SHOWCASE
	   ═══════════════════════════════════════════════════════════════════ */

	.showcase-frame {
		width: 172px;
	}

	.showcase-screen {
		/* 393:852 aspect ratio at ~158px width = ~343px height */
		height: 340px;
		background: var(--surface-base);
	}

	.showcase-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top;
		opacity: 0;
		transition: opacity 0.35s ease;
	}

	.showcase-img-active {
		opacity: 1;
	}

	/* Label that changes font per aesthetic */
	.showcase-label-wrap {
		position: relative;
		height: 28px;
		margin-bottom: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.showcase-label {
		position: absolute;
		font-size: 1rem;
		color: var(--text-primary);
		opacity: 0;
		transition: opacity 0.25s ease;
		white-space: nowrap;
	}

	.showcase-label-active {
		opacity: 1;
	}

	/* Dot indicators */
	.showcase-dots {
		display: flex;
		gap: 8px;
		margin-top: 14px;
	}

	.showcase-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		border: none;
		padding: 0;
		background: var(--border-default);
		cursor: pointer;
		transition:
			background 200ms ease,
			transform 200ms ease;
	}

	.showcase-dot-active {
		background: var(--accent-primary);
		transform: scale(1.3);
	}

	/* ── Final CTA ── */

	.cta-final {
		max-width: 320px;
		margin: 0 auto;
		padding: 8px 24px 40px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		text-align: center;
	}

	.cta-final .ornament {
		margin-bottom: 8px;
	}

	.trust-line {
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: var(--text-muted);
		line-height: 1.55;
		margin: 0;
	}

	/* ── Surveillance Link ── */

	.surveillance-link {
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: var(--feedback-error);
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-thickness: 1px;
		opacity: 0.65;
		margin-top: 48px;
		transition: opacity 150ms ease;
	}

	.surveillance-link:hover {
		opacity: 1;
	}

	/* ── Footer ── */

	.landing-footer {
		padding: 32px 24px 48px;
		text-align: center;
	}

	.footer-links {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
	}

	.footer-link {
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: var(--text-muted);
		text-decoration: none;
		transition: color 150ms ease;
	}

	.footer-link:hover {
		color: var(--text-secondary);
	}

	.footer-sep {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: var(--border-subtle);
		flex-shrink: 0;
	}

	/* ═══════════════════════════════════════════════════════════════════
	   DASHBOARD (authenticated)
	   ═══════════════════════════════════════════════════════════════════ */

	.support-fab {
		position: fixed;
		bottom: max(20px, calc(env(safe-area-inset-bottom, 0px) + 12px));
		left: 16px;
		z-index: 40;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 9999px;
		background: var(--surface-card);
		border: 1px solid var(--border-default);
		color: var(--accent-primary);
		cursor: pointer;
		transition: all 150ms ease;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.support-fab:hover {
		color: var(--text-secondary);
		background: var(--surface-overlay);
	}

	.support-fab:focus-visible {
		outline: 2px solid var(--accent-primary);
		outline-offset: 2px;
	}

	.ambient-glow {
		position: fixed;
		top: -20%;
		left: 50%;
		transform: translateX(-50%);
		width: min(600px, 90vw);
		height: 500px;
		background: radial-gradient(
			ellipse at center,
			rgba(82, 183, 136, 0.06) 0%,
			rgba(82, 183, 136, 0.02) 40%,
			transparent 70%
		);
		pointer-events: none;
		z-index: 0;
	}
</style>
