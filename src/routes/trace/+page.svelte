<script lang="ts">
	import { tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { animateIn, scrollReveal } from '$lib/motion';
	import BreachCard from './components/BreachCard.svelte';
	import PlatformComparison from './components/PlatformComparison.svelte';
	import PipelineVisualization from './components/PipelineVisualization.svelte';
	import ShareCard from './components/ShareCard.svelte';
	import type { Breach } from './types';
	import { calculateScore, calculatePercentile, getRiskLabel, getTopDataClasses } from './utils';

	let emailValue = $state('');
	let phoneValue = $state('');
	let scanning = $state(false);
	let showResults = $state(false);
	let error = $state<string | null>(null);
	let breaches = $state<Breach[]>([]);
	let breachCount = $state(0);
	let emailBreachCount = $state(0);
	let phoneBreachCount = $state(0);
	let resultsEl = $state<HTMLElement | undefined>(undefined);

	const emailValid = $derived(emailValue.includes('@'));
	const phoneValid = $derived(phoneValue.replace(/\D/g, '').length >= 10);
	const isValid = $derived(emailValid && phoneValid);

	const score = $derived(
		breachCount > 0 ? calculateScore(breaches) : Math.floor(Math.random() * 7) + 12
	);
	const percentile = $derived(calculatePercentile(score));
	const riskLabel = $derived(getRiskLabel(score));
	const topDataClasses = $derived(getTopDataClasses(breaches));

	async function handleScan() {
		if (!isValid || scanning || showResults) return;
		scanning = true;
		error = null;

		try {
			const response = await fetch('/trace', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: emailValue,
					phone: phoneValue
				})
			});

			if (response.status === 429) {
				error = 'Too many requests. Please wait a moment and try again.';
				scanning = false;
				return;
			}

			const data = (await response.json()) as {
				error?: string;
				breaches?: Breach[];
				count?: number;
				emailBreaches?: number;
				phoneBreaches?: number;
			};

			if (data.error) {
				error = data.error;
				scanning = false;
				return;
			}

			breaches = data.breaches ?? [];
			breachCount = data.count ?? 0;
			emailBreachCount = data.emailBreaches ?? 0;
			phoneBreachCount = data.phoneBreaches ?? 0;
			scanning = false;
			showResults = true;

			await tick();
			resultsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} catch {
			error = 'Something went wrong. Please try again.';
			scanning = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleScan();
	}

	function resetScan() {
		emailValue = '';
		phoneValue = '';
		scanning = false;
		showResults = false;
		error = null;
		breaches = [];
		breachCount = 0;
		emailBreachCount = 0;
		phoneBreachCount = 0;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>Ephemeral Trace — Where does your data go?</title>
	<meta
		name="description"
		content="See what's been stolen, what's being collected, and where it all leads."
	/>
	<meta property="og:title" content="Where does your data go?" />
	<meta
		property="og:description"
		content="See what the apps you trust already know about you. From party invites to government surveillance."
	/>
	<meta property="og:url" content="https://ephemeralsocial.com/trace" />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Where does your data go?" />
	<meta
		name="twitter:description"
		content="The event app you RSVPed on was built by surveillance engineers."
	/>
</svelte:head>

<div class="trace-page">
	<!-- NAV -->
	<nav class="nav">
		<a href="/" class="logo">
			<span class="logo-dot"></span>
			<span class="logo-text">ephemeral</span>
		</a>
		<span class="nav-path">/trace</span>
	</nav>

	<!-- HERO -->
	<section class="hero" use:animateIn>
		<div class="hero-tag">Follow the data</div>

		<h1 class="hero-title">
			The app you RSVPed on was built by
			<em class="hero-accent">surveillance engineers</em>
		</h1>

		<p class="hero-sub">
			Enter your email and phone number to see what's already been exposed. Then see where it
			leads.
		</p>

		<!-- PRIVACY NOTICE -->
		<div class="privacy-notice">
			<span class="privacy-dot"></span>
			<span
				>We don't store your data. Your info is checked against breach databases and immediately
				discarded.</span
			>
		</div>

		<!-- INPUTS -->
		<div class="input-fields">
			<div class="input-field">
				<label class="input-label" for="trace-email">Email</label>
				<input
					id="trace-email"
					name="email"
					type="email"
					autocomplete="email"
					placeholder="your@email.com"
					bind:value={emailValue}
					onkeydown={handleKeydown}
					disabled={scanning || showResults}
					class="scan-input"
					class:disabled={showResults}
				/>
			</div>
			<div class="input-field">
				<label class="input-label" for="trace-phone">Phone</label>
				<input
					id="trace-phone"
					name="phone"
					type="tel"
					autocomplete="tel"
					placeholder="+1 (555) 000-0000"
					bind:value={phoneValue}
					onkeydown={handleKeydown}
					disabled={scanning || showResults}
					class="scan-input"
					class:disabled={showResults}
				/>
			</div>
		</div>
		<button
			onclick={handleScan}
			disabled={scanning || showResults || !isValid}
			class="scan-btn"
			class:scanning
			class:done={showResults}
		>
			{#if scanning}Scanning...{:else if showResults}Done{:else}Check exposure{/if}
		</button>

		{#if error}
			<div class="error-message" transition:fade={{ duration: 200 }}>
				{error}
			</div>
		{/if}

		{#if scanning}
			<div class="scanning-indicator" transition:fade={{ duration: 200 }}>
				<div class="scan-bar-track">
					<div class="scan-bar-fill"></div>
				</div>
				<div class="scan-text">
					Searching email and phone across 900+ breach databases...
				</div>
			</div>
		{/if}
	</section>

	<!-- RESULTS -->
	{#if showResults}
		<section class="results" bind:this={resultsEl}>
			<!-- BREACH COUNT -->
			{#if breachCount > 0}
				<div class="breach-count" in:fade={{ duration: 400 }}>
					<span class="breach-number">{breachCount}</span>
					<span class="breach-label"
						>breach{breachCount !== 1 ? 'es' : ''} found across your email and phone</span
					>
					<span class="breach-breakdown">
						{emailBreachCount} via email, {phoneBreachCount} via phone
					</span>
				</div>
			{:else}
				<div class="breach-count good-news" in:fade={{ duration: 400 }}>
					<span class="good-news-text">
						Good news — neither your email nor phone was found in any known breach databases.
					</span>
					<span class="good-news-sub">
						But your data is still being collected. Here's what happens every time you RSVP.
					</span>
				</div>
			{/if}

			<!-- BREACH CARDS -->
			{#each breaches as breach, i}
				<BreachCard {breach} index={i} />
			{/each}

			<!-- DATA NOT STORED REMINDER -->
			{#if breachCount > 0}
				<div class="privacy-reminder" use:scrollReveal={{ y: 10 }}>
					<span class="privacy-dot"></span>
					<span
						>Your email and phone were not stored, logged, or transmitted to any third party. This
						scan is ephemeral.</span
					>
				</div>
			{/if}

			<!-- TRANSITION: COMPARISON -->
			<div class="section-transition" use:scrollReveal={{ y: 15 }}>
				<div class="transition-line amber"></div>
				<div class="section-tag amber">
					{breachCount > 0
						? "But that's only what was stolen"
						: "Here's what they're collecting"}
				</div>
				<h2 class="section-title">
					Here's what you're giving away <em class="amber">right now</em>
				</h2>
				<p class="section-sub">
					Every RSVP feeds a system. Here's what happens behind each platform — side by side.
				</p>
			</div>

			<!-- PLATFORM COMPARISON -->
			<PlatformComparison />

			<!-- TRANSITION: PIPELINE -->
			<div class="section-transition" use:scrollReveal={{ y: 15 }}>
				<div class="transition-line red"></div>
				<div class="section-tag red">Follow the pipeline</div>
				<h2 class="section-title">
					From party invite to <em class="red">government surveillance</em>
				</h2>
				<p class="section-sub">
					Every connection below is documented — from federal contracts, investigative journalism,
					and the companies' own press releases. Click each node.
				</p>
			</div>

			<!-- PIPELINE -->
			<PipelineVisualization />

			<!-- BLOCKQUOTE -->
			<blockquote class="trace-quote" use:scrollReveal={{ y: 15 }}>
				Partiful doesn't have to sell your data. They built a social graph using the same skills,
				the same techniques, and the same institutional knowledge as the people who build government
				surveillance infrastructure. The question isn't whether your party invite data ends up in a
				government database today. It's whether you trust a system designed by surveillance engineers
				to protect your social life.
			</blockquote>

			<!-- SCORE -->
			<div use:scrollReveal={{ y: 15 }}>
				<ShareCard {score} {breachCount} {percentile} {riskLabel} {topDataClasses} />
			</div>

			<!-- CTA -->
			<div class="cta-section" use:scrollReveal={{ y: 15 }}>
				<div class="cta-dot"></div>
				<h2 class="cta-title">Stop feeding the machine.</h2>
				<p class="cta-sub">
					You can't undo what's been collected. But every future event is a choice. Your data
					auto-deletes in 7 days. No social graph. No trackers. No exceptions.
				</p>
				<a href="/create" class="cta-btn">Create your first private event</a>

				<div class="referral">
					<p class="referral-text">Know someone who should see this?</p>
					<button class="referral-btn" onclick={resetScan}>
						Check if someone you care about is exposed
					</button>
				</div>
			</div>

			<!-- FOOTER -->
			<div class="trace-footer" use:scrollReveal={{ y: 10 }}>
				<p>
					Breach data via Have I Been Pwned (15B+ compromised records). Platform comparisons from
					published privacy policies and reporting by TechCrunch, Amnesty International, NBC News,
					and federal contract records. Ephemeral is a public benefit corporation. We collect zero
					social graph data.
				</p>
				<p class="footer-green">
					No data entered on this page is stored, logged, or shared. This tool is ephemeral — like
					everything we build.
				</p>
			</div>
		</section>
	{/if}
</div>

<style>
	/* ===== PAGE ===== */
	.trace-page {
		min-height: 100vh;
		background: var(--surface-base, #111110);
		color: var(--text-primary, #ede9e3);
		font-family: var(--font-sans);
	}

	/* ===== NAV ===== */
	.nav {
		padding: 18px 32px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--border-default, #2e2c2a);
	}
	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
	}
	.logo-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--accent-primary, #52b788);
	}
	.logo-text {
		font-family: var(--font-serif);
		font-size: 17px;
		color: var(--text-secondary, #a39e96);
	}
	.nav-path {
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.05em;
		font-size: 11px;
		color: var(--text-muted, #6b6560);
	}

	/* ===== HERO ===== */
	.hero {
		max-width: 760px;
		margin: 0 auto;
		padding: 100px 24px 60px;
		text-align: center;
	}
	.hero-tag {
		font-family: var(--font-sans);
		font-size: 11px;
		font-weight: 500;
		color: #dc2626;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		margin-bottom: 28px;
	}
	.hero-title {
		font-family: var(--font-serif);
		font-size: clamp(34px, 5vw, 56px);
		font-weight: 400;
		color: var(--text-primary, #ede9e3);
		line-height: 1.15;
		max-width: 680px;
		margin: 0 auto 24px;
	}
	.hero-accent {
		color: #dc2626;
		font-style: italic;
	}
	.hero-sub {
		font-family: var(--font-sans);
		color: var(--text-secondary, #a39e96);
		font-size: 16px;
		line-height: 1.7;
		max-width: 480px;
		margin: 0 auto 16px;
		font-weight: 300;
	}

	/* ===== PRIVACY NOTICE ===== */
	.privacy-notice,
	.privacy-reminder {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(82, 183, 136, 0.06);
		border: 1px solid rgba(82, 183, 136, 0.15);
		padding: 6px 14px;
		margin-bottom: 36px;
		font-family: var(--font-sans);
		font-weight: 500;
		font-size: 11px;
		color: var(--accent-primary, #52b788);
		letter-spacing: 0.02em;
	}
	.privacy-reminder {
		display: flex;
		padding: 12px 16px;
		margin-top: 16px;
		margin-bottom: 0;
	}
	.privacy-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--accent-primary, #52b788);
		flex-shrink: 0;
	}

	/* ===== INPUTS ===== */
	.input-fields {
		display: flex;
		gap: 12px;
		max-width: 520px;
		margin: 0 auto 16px;
	}
	.input-field {
		flex: 1;
		text-align: left;
	}
	.input-label {
		display: block;
		font-family: var(--font-sans);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-muted, #6b6560);
		margin-bottom: 6px;
	}
	.scan-input {
		width: 100%;
		padding: 15px 18px;
		font-size: 15px;
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.02em;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--border-default, #2e2c2a);
		color: var(--text-primary, #ede9e3);
		outline: none;
		transition: opacity 0.3s;
		box-sizing: border-box;
	}
	.scan-input.disabled {
		opacity: 0.4;
	}
	.scan-input::placeholder {
		color: var(--text-muted, #6b6560);
	}
	.scan-input:focus {
		border-color: rgba(255, 255, 255, 0.12);
	}
	.scan-btn {
		padding: 15px 36px;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.02em;
		background: #dc2626;
		color: #fff;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.3s;
	}
	.scan-btn.scanning {
		background: rgba(220, 38, 38, 0.15);
		color: #dc2626;
		cursor: default;
	}
	.scan-btn.done {
		background: rgba(255, 255, 255, 0.03);
		color: var(--text-muted, #6b6560);
		cursor: default;
	}
	.scan-btn:disabled:not(.scanning):not(.done) {
		opacity: 0.4;
		cursor: default;
	}

	/* ===== ERROR ===== */
	.error-message {
		margin-top: 12px;
		font-family: var(--font-sans);
		font-size: 13px;
		color: #e85d04;
	}

	/* ===== SCANNING ===== */
	.scanning-indicator {
		margin-top: 28px;
		text-align: center;
	}
	.scan-bar-track {
		width: 240px;
		height: 2px;
		background: rgba(255, 255, 255, 0.04);
		margin: 0 auto;
		overflow: hidden;
		position: relative;
	}
	.scan-bar-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 40%;
		background: linear-gradient(90deg, transparent, #dc2626, transparent);
		animation: scanBar 1.2s ease infinite;
	}
	.scan-text {
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.02em;
		font-size: 11px;
		color: var(--text-muted, #6b6560);
		margin-top: 12px;
		animation: scanPulse 1.5s ease infinite;
	}

	@keyframes scanBar {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(300%);
		}
	}
	@keyframes scanPulse {
		0%,
		100% {
			opacity: 0.4;
		}
		50% {
			opacity: 1;
		}
	}

	/* ===== RESULTS ===== */
	.results {
		max-width: 760px;
		margin: 0 auto;
		padding: 20px 24px 0;
	}

	/* ===== BREACH COUNT ===== */
	.breach-count {
		text-align: center;
		margin-bottom: 48px;
	}
	.breach-number {
		font-family: var(--font-serif);
		font-size: 72px;
		color: #dc2626;
		line-height: 1;
		display: block;
	}
	.breach-label {
		font-family: var(--font-sans);
		font-size: 15px;
		color: var(--text-secondary, #a39e96);
		margin-top: 8px;
		display: block;
	}
	.breach-breakdown {
		font-family: var(--font-sans);
		font-weight: 500;
		letter-spacing: 0.02em;
		font-size: 12px;
		color: var(--text-muted, #6b6560);
		margin-top: 4px;
		display: block;
	}

	/* ===== GOOD NEWS ===== */
	.good-news {
		padding: 32px 24px;
		background: rgba(82, 183, 136, 0.04);
		border: 1px solid rgba(82, 183, 136, 0.12);
	}
	.good-news-text {
		font-family: var(--font-serif);
		font-size: 24px;
		color: var(--accent-primary, #52b788);
		display: block;
		margin-bottom: 12px;
	}
	.good-news-sub {
		font-family: var(--font-sans);
		font-size: 14px;
		color: var(--text-secondary, #a39e96);
		line-height: 1.6;
		display: block;
	}

	/* ===== SECTION TRANSITIONS ===== */
	.section-transition {
		text-align: center;
		padding: 80px 0 48px;
	}
	.transition-line {
		width: 1px;
		height: 48px;
		margin: 0 auto 28px;
	}
	.transition-line.amber {
		background: linear-gradient(to bottom, transparent, rgba(217, 119, 6, 0.4));
	}
	.transition-line.red {
		background: linear-gradient(to bottom, transparent, rgba(220, 38, 38, 0.4));
	}
	.section-tag {
		font-family: var(--font-sans);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.15em;
		text-transform: uppercase;
		margin-bottom: 16px;
	}
	.section-tag.amber {
		color: #d97706;
	}
	.section-tag.red {
		color: #dc2626;
	}
	.section-title {
		font-family: var(--font-serif);
		font-size: 34px;
		font-weight: 400;
		color: var(--text-primary, #ede9e3);
		line-height: 1.2;
		margin-bottom: 14px;
	}
	.section-title em.amber {
		color: #d97706;
	}
	.section-title em.red {
		color: #dc2626;
	}
	.section-sub {
		font-family: var(--font-sans);
		color: var(--text-muted, #6b6560);
		font-size: 14px;
		max-width: 500px;
		margin: 0 auto;
		line-height: 1.7;
		font-weight: 300;
	}

	/* ===== BLOCKQUOTE ===== */
	.trace-quote {
		font-family: var(--font-serif);
		font-size: 20px;
		line-height: 1.7;
		color: var(--text-secondary, #a39e96);
		font-style: italic;
		border-left: 2px solid #dc2626;
		padding: 0 0 0 24px;
		margin: 48px auto;
		max-width: 600px;
	}

	/* ===== CTA ===== */
	.cta-section {
		text-align: center;
		padding: 80px 24px;
		margin: 60px -24px 0;
		background: linear-gradient(
			180deg,
			transparent,
			rgba(82, 183, 136, 0.03) 40%,
			rgba(82, 183, 136, 0.06)
		);
		border-top: 1px solid rgba(82, 183, 136, 0.08);
	}
	.cta-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-primary, #52b788);
		margin: 0 auto 28px;
	}
	.cta-title {
		font-family: var(--font-serif);
		font-size: 36px;
		font-weight: 400;
		color: var(--text-primary, #ede9e3);
		margin-bottom: 14px;
	}
	.cta-sub {
		font-family: var(--font-sans);
		color: var(--text-secondary, #a39e96);
		font-size: 15px;
		max-width: 420px;
		margin: 0 auto 32px;
		line-height: 1.7;
		font-weight: 300;
	}
	.cta-btn {
		display: inline-block;
		padding: 16px 40px;
		font-size: 15px;
		font-weight: 600;
		font-family: var(--font-sans);
		background: var(--accent-primary, #52b788);
		color: var(--surface-base, #111110);
		border: none;
		border-radius: 9999px;
		cursor: pointer;
		text-decoration: none;
		letter-spacing: 0.01em;
		transition: all 150ms ease;
	}
	.cta-btn:hover {
		background: #40916c;
		box-shadow: 0 6px 30px rgba(82, 183, 136, 0.2);
	}

	.referral {
		margin-top: 48px;
		padding-top: 28px;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
	}
	.referral-text {
		font-family: var(--font-sans);
		color: var(--text-muted, #6b6560);
		font-size: 13px;
		margin-bottom: 14px;
	}
	.referral-btn {
		padding: 10px 24px;
		font-size: 13px;
		font-weight: 500;
		font-family: var(--font-sans);
		background: transparent;
		color: var(--text-secondary, #a39e96);
		border: 1px solid var(--border-default, #2e2c2a);
		border-radius: 9999px;
		cursor: pointer;
		transition: all 150ms ease;
	}
	.referral-btn:hover {
		color: var(--text-primary, #ede9e3);
		border-color: rgba(255, 255, 255, 0.15);
	}

	/* ===== FOOTER ===== */
	.trace-footer {
		text-align: center;
		padding: 36px 24px;
	}
	.trace-footer p {
		font-family: var(--font-sans);
		color: var(--text-muted, #6b6560);
		font-size: 11px;
		line-height: 1.9;
		max-width: 560px;
		margin: 0 auto;
	}
	.footer-green {
		color: var(--accent-primary, #52b788) !important;
		margin-top: 8px;
	}

	/* ===== RESPONSIVE ===== */
	@media (max-width: 768px) {
		.input-fields {
			flex-direction: column;
			gap: 12px;
		}
		.hero {
			padding: 60px 20px 40px;
		}
		.section-title {
			font-size: 28px;
		}
		.cta-title {
			font-size: 28px;
		}
	}
</style>
