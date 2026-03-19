<script lang="ts">
	import FaqItem from '$lib/components/landing/FaqItem.svelte';
	import WaitlistModal from '$lib/components/landing/WaitlistModal.svelte';
	import LandingFooter from '$lib/components/landing/LandingFooter.svelte';

	interface BlogPost {
		title: string;
		url: string;
		date: string;
		description: string;
		thumbnail: string | null;
	}

	let { data } = $props();

	let modalOpen = $state(false);
	let waitlistCount = $state(0);
	let navVisible = $state(false);
	let blogPosts = $state<BlogPost[]>([]);

	// Rotating hero words
	const words = ['mental health', 'attention', 'time', 'creativity', 'democracy'];
	let wordIndex = $state(0);

	$effect(() => {
		const interval = setInterval(() => {
			wordIndex = (wordIndex + 1) % words.length;
		}, 4000);
		return () => clearInterval(interval);
	});

	// Fetch waitlist stats
	$effect(() => {
		const apiUrl = data.waitlistApiUrl || 'https://ephemeral-waitlist.ephemeralsocial.workers.dev';
		fetch(`${apiUrl}/api/stats`)
			.then((r) => r.json() as Promise<{ total?: number }>)
			.then((d) => {
				if (d.total) waitlistCount = d.total;
			})
			.catch(() => {});
	});

	// Fetch blog posts
	$effect(() => {
		fetch('/api/blog-posts')
			.then((r) => r.json() as Promise<BlogPost[]>)
			.then((data) => {
				if (Array.isArray(data)) blogPosts = data;
			})
			.catch(() => {});
	});

	// Check returning user + update nav CTA
	let isReturning = $state(false);

	$effect(() => {
		const code = localStorage.getItem('ephemeral_referral_code');
		if (code) isReturning = true;
	});

	// Nav appears after scrolling past hero
	$effect(() => {
		const scrollRoot = document.getElementById('scroll-root');
		if (!scrollRoot) return;

		const handler = () => {
			const hero = document.getElementById('hero');
			if (hero) navVisible = scrollRoot.scrollTop > hero.offsetHeight - 100;
		};
		scrollRoot.addEventListener('scroll', handler, { passive: true });
		handler();
		return () => scrollRoot.removeEventListener('scroll', handler);
	});

	// Scroll reveal action
	function reveal(node: HTMLElement) {
		node.classList.add('reveal-hidden');
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('reveal-visible');
						// Stagger children
						const children = entry.target.querySelectorAll('.reveal-child');
						children.forEach((child, i) => {
							setTimeout(() => child.classList.add('reveal-visible'), i * 80);
						});
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
		);
		observer.observe(node);
		return { destroy: () => observer.disconnect() };
	}

	const faqItems = [
		{
			q: "Why should I pay when other social apps are free?",
			a: '"Free" apps make money by selling your attention to advertisers and your data to brokers. You\'re not the customer\u2014you\'re the product. We charge a fair subscription so our only job is making something you actually love, not maximizing your screen time.'
		},
		{
			q: "What if my friends aren't on Ephemeral?",
			a: "We're launching with invite-only access in specific communities to build density. You'll be able to invite friends, and Events let you include people who don't have accounts yet. Network effects start in tight communities, not broad audiences."
		},
		{
			q: 'How do the time windows actually work?',
			a: "You choose two 30-minute windows\u2014one during the day, one in the evening. During these windows, you can scroll your feed, post content, and engage. Outside windows, you still have full access to Messages, Events, and Notes. No hard lockouts for essential communication."
		},
		{
			q: 'Why does content delete? What if I want to keep something?',
			a: "Delete-by-default encourages authentic sharing and reduces digital clutter (and data center carbon emissions). Anything you want to keep, just save to Notes before it expires. Saved content stays as long as you want it."
		},
		{
			q: 'Is my data actually private?',
			a: "Messages are end-to-end encrypted\u2014we mathematically cannot read them. We don't sell data, don't show ads, and don't train AI on your content. When content deletes, it's truly gone from our servers."
		},
		{
			q: 'What about AI-generated content?',
			a: "Ephemeral is human-only. We use device attestation to verify content comes from real humans, not AI. Your posts and messages will never be used to train AI models. This is a space for genuine human connection."
		}
	];
</script>

<svelte:head>
	<title>Ephemeral Social</title>
	<meta
		name="description"
		content="Ephemeral is a suite of social apps to counter the tech-dystopia. No ads, no algorithms, no infinite scroll. Just real human connection."
	/>
	<meta property="og:title" content="Ephemeral Social" />
	<meta
		property="og:description"
		content="No ads. No algorithms. No infinite scroll. No AI. Just humans, connecting on their own terms."
	/>
	<meta property="og:url" content="https://ephemeralsocial.com" />
	<meta property="og:type" content="website" />
	<link rel="icon" type="image/png" sizes="32x32" href="/landing/favicon-32.png" />
	<link rel="apple-touch-icon" href="/landing/favicon-180.png" />
</svelte:head>

<!-- Fixed nav (appears on scroll) -->
<nav
	class="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--surface-base)] px-6 py-4 transition-transform duration-300"
	class:translate-y-0={navVisible}
	class:-translate-y-full={!navVisible}
>
	<a href="/" class="flex items-center">
		<img src="/landing/logo-full-white.png" alt="Ephemeral" class="h-7" />
	</a>
	<div class="flex items-center gap-2">
		<span class="relative">
			<a
				href="/events"
				class="rounded-full border border-[var(--accent-primary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--accent-primary)] no-underline transition-all hover:bg-[var(--accent-primary)] hover:text-white"
			>
				Go to Events
			</a>
			<span class="absolute -right-1.5 -top-1.5 rounded-full bg-[var(--accent-primary)] px-1.5 py-px text-[0.55rem] font-bold text-[#111110]">Free</span>
		</span>
		<button
			class="cursor-pointer rounded-full border-none bg-[#FA7045] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_2px_8px_rgba(250,112,69,0.15)] transition-all hover:brightness-[0.92]"
			onclick={() => (modalOpen = true)}
		>
			{isReturning ? 'Your Status' : 'Join Waitlist'}
		</button>
	</div>
</nav>

<!-- Hero -->
<section
	id="hero"
	class="relative z-10 flex min-h-dvh items-center justify-center overflow-hidden px-6 py-16 text-center"
>
	<!-- Ambient gradient -->
	<div
		class="pointer-events-none absolute left-1/2 top-[15%] -z-10 h-[600px] w-[min(900px,90vw)] -translate-x-1/2"
		style="background: radial-gradient(ellipse at center, rgba(82,183,136,0.06) 0%, rgba(250,112,69,0.02) 35%, transparent 65%)"
	></div>

	<div class="max-w-[900px]">
		<div class="fade-in-1 mb-5 flex items-center justify-center">
			<img src="/landing/logo-full-white.png" alt="Ephemeral" class="h-9" />
		</div>

		<div
			class="fade-in-2 mb-5 inline-block rounded-lg border border-[rgba(250,112,69,0.3)] bg-[rgba(250,112,69,0.1)] px-4 py-1.5 text-sm font-semibold tracking-wide text-[#FA7045]"
		>
			Launching Early 2026
		</div>

		<h1
			class="fade-in-3 mb-7 text-display-lg leading-[1.1] tracking-tight text-[var(--text-primary)]"
		>
			You don't have to sacrifice<br />
			{#key wordIndex}<span class="inline-block font-bold text-[#FA7045] word-swap">{words[wordIndex]}</span>{/key}<br />
			to stay connected.
		</h1>

		<p class="fade-in-4 mx-auto mb-5 max-w-[700px] text-body-lg text-[var(--text-secondary)]">
			A not-for-profit suite of social apps. No ads, no algorithms, no A.I., no infinite scroll.
		</p>

		<!-- Learn more toggle -->
		<div class="fade-in-4 mb-10 flex flex-col items-center">
			<button
				class="learn-more-btn cursor-pointer border-none bg-transparent font-sans text-base text-[var(--accent-primary)] underline decoration-1 underline-offset-4 transition-colors hover:text-[var(--text-primary)]"
				onclick={(e) => {
					const content = document.getElementById('learn-more');
					if (content) content.classList.toggle('open');
				}}
			>
				Learn more
			</button>
			<div id="learn-more" class="learn-more-content">
				<div
					class="mx-auto mt-5 max-w-[600px] rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-6 text-left shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
				>
					<ul class="flex list-none flex-col gap-3">
						{#each ['We don\'t keep your data\u2014everything deletes permanently', 'No ads. No algorithms. No infinite scroll', 'No AI content, no AI training on your data', 'Two 30-minute windows (day/evening) to protect your attention', 'End-to-end encrypted messaging'] as item}
							<li class="flex items-start gap-3 text-[0.95rem] text-[var(--text-secondary)]">
								<span class="shrink-0 text-[var(--accent-primary)]">&#10003;</span>
								{item}
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>

		<div class="fade-in-5 flex flex-wrap items-center justify-center gap-6">
			<button
				class="cursor-pointer rounded-full border-none bg-[#FA7045] px-12 py-5 text-lg font-bold text-white shadow-[0_2px_12px_rgba(250,112,69,0.15)] transition-all hover:shadow-[0_4px_20px_rgba(250,112,69,0.2)] hover:brightness-[0.92]"
				onclick={() => (modalOpen = true)}
			>
				Join the Waitlist
			</button>
			<span class="relative">
				<a
					href="/events"
					class="rounded-full border-2 border-[var(--accent-primary)] px-12 py-[18px] text-lg font-bold text-[var(--accent-primary)] no-underline transition-all hover:bg-[var(--accent-primary)] hover:text-white"
				>
					Go to Events
				</a>
				<span class="absolute -right-2 -top-2.5 rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[0.65rem] font-bold text-[#111110]">Free</span>
			</span>
		</div>

		<div class="fade-in-5 mt-6 text-sm text-[var(--text-muted)]">
			<strong class="text-[#FA7045]">{waitlistCount.toLocaleString()}</strong> people on the waitlist
		</div>
	</div>
</section>

<!-- Product Timeline -->
<section class="relative z-10 px-6 py-20" use:reveal>
	<h2 class="mb-4 text-center text-display-md tracking-tight text-[var(--text-primary)]">
		What's <span class="text-[var(--accent-primary)]">coming</span>
	</h2>
	<div class="section-line"></div>

	<div class="relative mx-auto mt-12 max-w-[600px]">
		<!-- Vertical line -->
		<div class="absolute bottom-0 left-[5px] top-0 w-[2px] bg-[var(--accent-primary)]/20"></div>

		<!-- Node 1: Events (Web) — Live -->
		<div class="reveal-child relative pb-10 pl-10">
			<div class="absolute left-0 top-[5px] h-3 w-3 rounded-full bg-[var(--accent-primary)]"></div>
			<div class="mb-1 text-sm font-semibold text-[var(--text-muted)]">March 2026</div>
			<div class="flex items-center gap-2.5">
				<span class="text-headline-md text-[var(--text-primary)]">Events (Web)</span>
				<span class="rounded-full bg-[var(--accent-primary)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--accent-primary)]">Live</span>
			</div>
		</div>

		<!-- Node 2: Events for iOS & Android -->
		<div class="reveal-child relative pb-10 pl-10">
			<div class="absolute left-0 top-[5px] h-3 w-3 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--surface-base)]"></div>
			<div class="mb-1 text-sm font-semibold text-[var(--text-muted)]">May 2026</div>
			<span class="text-headline-md text-[var(--text-secondary)]">Events for iOS & Android</span>
		</div>

		<!-- Node 3: Full platform -->
		<div class="reveal-child relative pl-10">
			<div class="absolute left-0 top-[5px] h-3 w-3 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--surface-base)]"></div>
			<div class="mb-1 text-sm font-semibold text-[var(--text-muted)]">Summer 2026</div>
			<div class="text-headline-md text-[var(--text-secondary)]">
				Timeline (photo & video) · Stories · E2EE Messaging · and more
			</div>
		</div>
	</div>
</section>

<!-- Blog -->
{#if blogPosts.length > 0}
<section class="relative z-10 bg-[var(--surface-raised)] px-6 py-20" use:reveal>
	<h2 class="mb-4 text-center text-display-md tracking-tight text-[var(--text-primary)]">
		From the <span class="text-[var(--accent-primary)]">blog</span>
	</h2>
	<div class="section-line"></div>

	<div class="mx-auto mt-12 max-w-[1000px]" class:blog-grid-single={blogPosts.length === 1} class:blog-grid-multi={blogPosts.length > 1}>
		{#each blogPosts as post, i}
			<a
				href={post.url}
				target="_blank"
				rel="noopener noreferrer"
				class="reveal-child blog-card group"
			>
				{#if post.thumbnail}
					<div class="blog-thumb overflow-hidden rounded-lg">
						<img
							src={post.thumbnail}
							alt=""
							class="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
							loading="lazy"
						/>
					</div>
				{:else}
					<div class="blog-thumb flex aspect-[16/9] items-center justify-center rounded-lg bg-[var(--surface-overlay)]">
						<div class="flex flex-col items-center gap-2 opacity-50">
							<svg class="h-7 w-7 text-[var(--accent-primary)]" viewBox="0 0 256 256" fill="currentColor">
								<path d="M208,24H72A32,32,0,0,0,40,56V224a8,8,0,0,0,8,8H192a8,8,0,0,0,0-16H56a16,16,0,0,1,16-16H208a8,8,0,0,0,8-8V32A8,8,0,0,0,208,24Zm-8,160H72a31.82,31.82,0,0,0-16,4.29V56A16,16,0,0,1,72,40H200Z" />
							</svg>
						</div>
					</div>
				{/if}
				<div class="blog-card-body">
					<div class="mb-2 text-xs font-medium tracking-wide text-[var(--text-muted)] uppercase">
						{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
					</div>
					<h3 class="mb-2 font-serif text-xl font-semibold leading-snug text-[var(--text-primary)] transition-colors duration-150 group-hover:text-[var(--accent-primary)]">
						{post.title}
					</h3>
					<p class="text-sm leading-relaxed text-[var(--text-muted)]">
						{post.description}
					</p>
					<span class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-primary)] opacity-0 transition-opacity duration-150 group-hover:opacity-100">
						Read
						<svg class="h-3 w-3" viewBox="0 0 256 256" fill="currentColor">
							<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
						</svg>
					</span>
				</div>
			</a>
		{/each}
	</div>

	<div class="mt-10 text-center">
		<a
			href="https://blog.ephemeralsocial.com"
			target="_blank"
			rel="noopener noreferrer"
			class="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] px-6 py-2.5 text-sm font-semibold text-[var(--text-secondary)] no-underline transition-all duration-150 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
		>
			Read more on the blog
			<svg class="h-3.5 w-3.5" viewBox="0 0 256 256" fill="currentColor">
				<path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
			</svg>
		</a>
	</div>
</section>
{/if}

<!-- Features -->
<section class="relative z-10 px-6 py-20" use:reveal>

	<h2 class="mb-4 text-center text-display-md tracking-tight text-[var(--text-primary)]">
		Built for <span class="text-[var(--accent-primary)]">humans</span>. Not bots.
	</h2>
	<div class="section-line"></div>
	<div class="mx-auto mt-12 grid max-w-[1000px] grid-cols-1 gap-6 md:grid-cols-3">
		<!-- Card 1 -->
		<div class="reveal-child feature-card border-t-2 border-t-[var(--accent-primary)]">
			<div class="mb-5 h-8 w-8 text-[var(--accent-primary)]">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M5 3h14" /><path d="M5 21h14" /><path d="M7 3C7 8 12 11 12 12C12 13 7 16 7 21" /><path d="M17 3C17 8 12 11 12 12C12 13 17 16 17 21" />
				</svg>
			</div>
			<h3 class="mb-3 text-headline-md text-[var(--text-primary)]">Two windows. That's it.</h3>
			<p class="text-[0.95rem] leading-relaxed text-[var(--text-muted)]">
				Morning and evening, 30 minutes each. Your feed ends &mdash; and so does the urge to keep scrolling.
			</p>
		</div>
		<!-- Card 2 -->
		<div class="reveal-child feature-card border-t-2 border-t-[#FA7045]">
			<div class="mb-5 h-8 w-8 text-[#FA7045]">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2Q4 12 12 22Q20 12 12 2" /><path d="M12 6v12" />
				</svg>
			</div>
			<h3 class="mb-3 text-headline-md text-[var(--text-primary)]">Everything disappears</h3>
			<p class="text-[0.95rem] leading-relaxed text-[var(--text-muted)]">
				Posts expire. Messages expire. Even your data expires. Less digital clutter, less carbon.
			</p>
		</div>
		<!-- Card 3 -->
		<div class="reveal-child feature-card border-t-2 border-t-[#6B0029]">
			<div class="mb-5 h-8 w-8 text-[#FFBABA]">
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2L4 6v6c0 5.5 3.5 10.7 8 12c4.5-1.3 8-6.5 8-12V6l-8-4z" />
				</svg>
			</div>
			<h3 class="mb-3 text-headline-md text-[var(--text-primary)]">Actually private</h3>
			<p class="text-[0.95rem] leading-relaxed text-[var(--text-muted)]">
				End-to-end encrypted messaging. No data selling. No AI training on your content. Ever.
			</p>
		</div>
	</div>
</section>

<!-- Products -->
<section class="relative z-10 px-6 py-20" use:reveal>
	<div
		class="mx-auto max-w-[900px] rounded-2xl border border-[var(--border-default)] p-8 sm:p-14"
		style="background: linear-gradient(135deg, rgba(82,183,136,0.04), rgba(250,112,69,0.03))"
	>
		<p class="mb-3 border-l-[3px] border-[#FA7045] pl-6 text-display-sm text-[var(--text-primary)]">
			When the product is free,<br /><strong class="text-[#FA7045]">you're the product.</strong>
		</p>
		<p class="mb-12 text-body-lg text-[var(--text-muted)]">
			We charge $7/month. No ads. No data selling. Ever.<br />Just five apps, built with care.
		</p>
		<div class="flex flex-wrap justify-start gap-4 border-t border-[var(--border-default)] pt-8">
			{#each [
				{ name: 'Events', icon: 'M3 8a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8zM16 2v4M8 2v4M3 10h18' },
				{ name: 'Messaging', icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' },
				{ name: 'Thoughts', icon: 'M9 18h6M10 22h4M15 14.5A5 5 0 0012 4a5 5 0 00-3 10.5V17h6v-2.5z' },
				{ name: 'Posts', icon: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 13a4 4 0 100-8 4 4 0 000 8z' },
				{ name: 'Stories', icon: 'M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z' }
			] as product}
				<div class="reveal-child flex flex-col items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] px-7 py-6 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
					<div class="h-7 w-7 text-[var(--accent-primary)]">
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d={product.icon} />
						</svg>
					</div>
					<span class="text-sm font-semibold text-[var(--text-secondary)]">{product.name}</span>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- How It Works -->
<section class="relative z-10 bg-[var(--surface-raised)] px-6 py-20" use:reveal>
	<h2 class="mb-4 text-center text-display-md tracking-tight text-[var(--text-primary)]">
		A day on <span class="text-[var(--accent-primary)]">Ephemeral</span>
	</h2>
	<div class="section-line"></div>
	<p class="mb-12 text-center text-[var(--text-muted)]">Social media redesigned around your wellbeing</p>

	<div class="mx-auto grid max-w-[1100px] grid-cols-1 gap-12 md:grid-cols-3">
		<!-- Step 1: Windows -->
		<div class="reveal-child text-center">
			<div class="mockup-frame mx-auto mb-6">
				<div class="mockup-screen flex flex-col items-center justify-center">
					<div class="mb-4 text-center">
						<div class="text-[0.7rem] uppercase tracking-wider text-[rgba(252,247,240,0.4)]">Morning Window</div>
						<div class="text-2xl font-semibold text-[var(--accent-primary)]">9:00 AM</div>
					</div>
					<div class="w-4/5 rounded-xl bg-[rgba(82,183,136,0.15)] p-3">
						<div class="flex justify-between text-xs text-[rgba(252,247,240,0.6)]">
							<span>8:00</span><span>10:00</span>
						</div>
						<div class="relative mt-2 h-1 rounded-full bg-[rgba(255,255,255,0.1)]">
							<div class="absolute left-1/2 top-[-4px] h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--accent-primary)]"></div>
						</div>
					</div>
					<div class="mt-4 text-center">
						<div class="text-[0.7rem] uppercase tracking-wider text-[rgba(252,247,240,0.4)]">Evening Window</div>
						<div class="text-2xl font-semibold text-[#FA7045]">7:00 PM</div>
					</div>
				</div>
			</div>
			<div class="mb-2 text-sm font-bold tracking-widest text-[var(--accent-primary)]">01</div>
			<h3 class="mb-2 text-left text-headline-md text-[var(--text-primary)] md:text-center">Two windowed sessions</h3>
			<p class="text-left text-sm text-[var(--text-muted)] md:text-center">
				Pick your window &mdash; morning or evening &mdash; and get 30 minutes of feed time.
			</p>
		</div>

		<!-- Step 2: Feed -->
		<div class="reveal-child text-center">
			<div class="mockup-frame mx-auto mb-6">
				<div class="mockup-screen p-3">
					<div class="mb-3 flex items-center justify-between px-1">
						<span class="text-[0.7rem] text-[var(--accent-primary)]">&#9679; 24:32 left</span>
						<span class="text-[0.65rem] text-[rgba(252,247,240,0.4)]">Morning</span>
					</div>
					{#each [{ name: 'Sarah', color: '#FA7045', h: 24 }, { name: 'Mike', color: '#52b788', h: 40 }, { name: 'Alex', color: '#FFBABA', h: 24 }] as post}
						<div class="mb-2 rounded-xl bg-[rgba(255,255,255,0.05)] p-2.5">
							<div class="mb-1.5 flex items-center gap-2">
								<div class="h-6 w-6 shrink-0 rounded-full" style="background: {post.color}"></div>
								<span class="text-[0.7rem] text-[rgba(252,247,240,0.7)]">{post.name}</span>
							</div>
							<div class="rounded-lg bg-[rgba(255,255,255,0.08)]" style="height: {post.h}px"></div>
						</div>
					{/each}
				</div>
			</div>
			<div class="mb-2 text-sm font-bold tracking-widest text-[#FA7045]">02</div>
			<h3 class="mb-2 text-left text-headline-md text-[var(--text-primary)] md:text-center">Connect with intention</h3>
			<p class="text-left text-sm text-[var(--text-muted)] md:text-center">
				A finite feed that ends. Events, messages, and posts from people you care about.
			</p>
		</div>

		<!-- Step 3: Done -->
		<div class="reveal-child text-center">
			<div class="mockup-frame mx-auto mb-6">
				<div class="mockup-screen flex flex-col items-center justify-center">
					<img src="/landing/favicon.png" alt="" class="mb-4 h-12 w-12 rounded-xl" />
					<div class="mb-2 text-base font-semibold text-[#ede9e3]">You're all caught up</div>
					<div class="mb-5 text-xs text-[rgba(252,247,240,0.5)]">See you this evening</div>
					<div class="rounded-full bg-[rgba(82,183,136,0.15)] px-4 py-2 text-[0.7rem] text-[var(--accent-primary)]">
						Next window: 7:00 PM
					</div>
				</div>
			</div>
			<div class="mb-2 text-sm font-bold tracking-widest text-[var(--accent-primary)]">03</div>
			<h3 class="mb-2 text-left text-headline-md text-[var(--text-primary)] md:text-center">Leave satisfied</h3>
			<p class="text-left text-sm text-[var(--text-muted)] md:text-center">
				A clear ending. No guilt, no "one more scroll." See you next window.
			</p>
		</div>
	</div>
</section>

<!-- Pricing -->
<section class="relative z-10 px-6 py-20" use:reveal>
	<h2 class="mb-4 text-center text-display-md tracking-tight text-[var(--text-primary)]">
		One price. No tricks.
	</h2>
	<div class="section-line"></div>
	<p class="mb-12 text-center text-[var(--text-muted)]">
		Your subscription pays to use and maintain the app features.<br />Simple. Straightforward. Nothing dystopian about it.
	</p>
	<div class="mx-auto grid max-w-[650px] grid-cols-1 gap-5 sm:grid-cols-2">
		<div class="reveal-child rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-9 text-center shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
			<h3 class="mb-2 font-sans text-base font-medium text-[var(--text-muted)]">Monthly</h3>
			<div class="text-display-lg text-[var(--accent-primary)]">$7</div>
			<div class="text-base text-[var(--text-muted)]">per month</div>
		</div>
		<div class="reveal-child relative rounded-xl border border-[#FA7045] p-9 text-center shadow-[0_4px_24px_rgba(250,112,69,0.08)]" style="background: linear-gradient(180deg, rgba(250,112,69,0.06) 0%, var(--surface-raised) 100%)">
			<div class="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-lg bg-[#FA7045] px-4 py-1.5 text-xs font-bold text-white">
				SAVE 17%
			</div>
			<h3 class="mb-2 font-sans text-base font-medium text-[var(--text-muted)]">Annual</h3>
			<div class="text-display-lg text-[#FA7045]">$70</div>
			<div class="text-base text-[var(--text-muted)]">per year</div>
		</div>
	</div>
</section>

<!-- FAQ -->
<section class="relative z-10 bg-[var(--surface-raised)] px-6 py-20" use:reveal>
	<h2 class="mb-4 text-center text-display-md tracking-tight text-[var(--text-primary)]">
		You might be <span class="text-[var(--accent-primary)]">wondering</span>
	</h2>
	<div class="section-line"></div>
	<div class="mx-auto mt-12 flex max-w-[700px] flex-col gap-3">
		{#each faqItems as faq}
			<div class="reveal-child">
				<FaqItem question={faq.q} answer={faq.a} />
			</div>
		{/each}
	</div>
</section>

<!-- Final CTA -->
<section class="relative z-10 px-6 py-28 text-center" style="background: linear-gradient(180deg, var(--surface-base) 0%, var(--surface-raised) 100%)">
	<h2 class="mb-8 text-display-md tracking-tight text-[var(--text-primary)] md:text-display-lg" use:reveal>
		The internet doesn't have to be like this.
	</h2>
	<div class="flex flex-wrap items-center justify-center gap-4" use:reveal>
		<button
			class="cursor-pointer rounded-full border-none bg-[#FA7045] px-12 py-5 text-lg font-bold text-white shadow-[0_2px_12px_rgba(250,112,69,0.15)] transition-all hover:shadow-[0_4px_20px_rgba(250,112,69,0.2)] hover:brightness-[0.92]"
			onclick={() => (modalOpen = true)}
		>
			Join the Waitlist
		</button>
		<span class="relative">
			<a
				href="/events"
				class="rounded-full border-2 border-[var(--accent-primary)] px-12 py-[18px] text-lg font-bold text-[var(--accent-primary)] no-underline transition-all hover:bg-[var(--accent-primary)] hover:text-white"
			>
				Go to Events
			</a>
			<span class="absolute -right-2 -top-2.5 rounded-full bg-[var(--accent-primary)] px-2 py-0.5 text-[0.65rem] font-bold text-[#111110]">Free</span>
		</span>
	</div>
	<div class="mt-6 text-sm text-[var(--text-muted)]">
		Join <strong class="text-[#FA7045]">{waitlistCount.toLocaleString()}</strong> others
	</div>
</section>

<LandingFooter />
<WaitlistModal bind:open={modalOpen} {waitlistCount} apiUrl={data.waitlistApiUrl} stripeLink={data.stripeFounderLink} />

<style>
	/* Staggered hero fade-in */
	@keyframes fade-up {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@keyframes word-swap {
		0%, 10% { opacity: 0; transform: translateY(6px); }
		15%, 85% { opacity: 1; transform: translateY(0); }
		90%, 100% { opacity: 0; transform: translateY(-6px); }
	}

	.fade-in-1 { animation: fade-up 0.6s ease forwards; }
	.fade-in-2 { animation: fade-up 0.6s ease 0.1s forwards; opacity: 0; }
	.fade-in-3 { animation: fade-up 0.6s ease 0.2s forwards; opacity: 0; }
	.fade-in-4 { animation: fade-up 0.6s ease 0.3s forwards; opacity: 0; }
	.fade-in-5 { animation: fade-up 0.6s ease 0.4s forwards; opacity: 0; }

	.word-swap {
		animation: word-swap 4s cubic-bezier(0.37, 0, 0.63, 1) infinite;
	}

	/* Learn more expand */
	.learn-more-content {
		max-height: 0;
		overflow: hidden;
		opacity: 0;
		transition: all 400ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	:global(.learn-more-content.open) {
		max-height: 300px;
		opacity: 1;
	}

	/* Scroll reveal */
	:global(.reveal-hidden) {
		opacity: 0;
		transform: translateY(24px);
		transition: opacity 0.7s cubic-bezier(0.25, 1, 0.5, 1),
		            transform 0.7s cubic-bezier(0.25, 1, 0.5, 1);
	}

	:global(.reveal-visible) {
		opacity: 1;
		transform: translateY(0);
	}

	:global(.reveal-child) {
		opacity: 0;
		transform: translateY(16px);
		transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1),
		            transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
	}

	:global(.reveal-child.reveal-visible) {
		opacity: 1;
		transform: translateY(0);
	}

	/* Section divider */
	.section-line {
		width: 48px;
		height: 2px;
		background: var(--accent-primary);
		margin: 16px auto 0;
		border-radius: 1px;
		opacity: 0.5;
	}

	/* Blog grid layouts */
	.blog-grid-multi {
		display: grid;
		grid-template-columns: repeat(1, 1fr);
		gap: 24px;
	}

	@media (min-width: 768px) {
		.blog-grid-multi {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.blog-grid-single {
		display: flex;
		justify-content: center;
	}

	.blog-grid-single .blog-card {
		max-width: 420px;
		width: 100%;
	}

	/* Blog cards */
	.blog-card {
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		background: var(--surface-base);
		border: 1px solid var(--border-default);
		text-decoration: none;
		overflow: hidden;
		transition: transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1),
		            box-shadow 200ms cubic-bezier(0.25, 0.1, 0.25, 1),
		            border-color 200ms ease;
	}

	.blog-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
		border-color: var(--accent-primary);
	}

	.blog-card .blog-thumb {
		margin: 0;
		border-radius: 0;
	}

	.blog-card .blog-card-body {
		padding: 20px;
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.blog-card .blog-card-body p {
		flex: 1;
	}

	/* Feature cards */
	.feature-card {
		padding: 36px 28px;
		border-radius: 12px;
		text-align: left;
		background: var(--surface-raised);
		border: 1px solid var(--border-default);
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
		transition: box-shadow 200ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.feature-card:hover {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
	}

	/* Phone mockups */
	.mockup-frame {
		background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
		border-radius: 16px;
		padding: 8px;
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
		width: 200px;
		position: relative;
	}

	.mockup-frame::after {
		content: '';
		position: absolute;
		bottom: -12px;
		left: 15%;
		right: 15%;
		height: 24px;
		background: radial-gradient(ellipse, rgba(82, 183, 136, 0.1), transparent);
		filter: blur(8px);
		pointer-events: none;
	}

	.mockup-screen {
		background: linear-gradient(180deg, #232220 0%, #1a1918 100%);
		border-radius: 12px;
		overflow: hidden;
		padding: 16px;
		height: 280px;
	}
</style>
