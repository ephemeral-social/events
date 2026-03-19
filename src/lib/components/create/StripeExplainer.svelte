<script lang="ts">
	import { X, Timer, ShieldCheck, Tag } from 'phosphor-svelte';
	import { animate, stagger } from 'motion';
	import { organicFade } from '$lib/motion/transitions/organic-fade';
	import { createAnimationScope } from '$lib/motion/utils/animation-scope.svelte';
	import { motionOk } from '$lib/motion/utils/reduced-motion.svelte';
	import { motionEase } from '$lib/motion/tokens';

	interface Props {
		open: boolean;
		onBegin: () => void;
	}

	let { open, onBegin }: Props = $props();

	let containerEl: HTMLElement | undefined = $state();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onBegin();
	}

	$effect(() => {
		if (!open || !containerEl || !motionOk()) return;

		const cleanup = createAnimationScope(containerEl, (scope) => {
			const controls = animate([
				[scope.container.querySelector('[data-anim="logo-ephemeral"]')!, { x: [-30, 0], opacity: [0, 1] }, { duration: 0.7, at: 0 }],
				[scope.container.querySelector('[data-anim="logo-stripe"]')!, { x: [30, 0], opacity: [0, 1] }, { duration: 0.7, at: 0 }],
				[scope.container.querySelectorAll('[data-anim="dot"]'), { scale: [0, 1], opacity: [0, 1] }, { duration: 0.4, delay: stagger(0.06), ease: motionEase.spring, at: 0.4 }],
				[scope.container.querySelector('[data-anim="headline"]')!, { y: [16, 0], opacity: [0, 1] }, { duration: 0.5, at: 0.6 }],
				[scope.container.querySelectorAll('[data-anim="card"]'), { y: [16, 0], opacity: [0, 1], scale: [0.97, 1] }, { duration: 0.5, delay: stagger(0.08), at: 0.75 }],
				[scope.container.querySelector('[data-anim="cta"]')!, { scale: [0.9, 1], opacity: [0, 1] }, { duration: 0.6, ease: motionEase.spring, at: 1.15 }],
			] as any, { defaultOptions: { ease: motionEase.enter } });
			scope.add(controls);
		});

		return cleanup;
	});
</script>

{#if open}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="fixed inset-0 z-50 bg-[var(--surface-base)]"
		role="dialog"
		aria-modal="true"
		aria-label="Stripe ticketing setup introduction"
		onkeydown={handleKeydown}
		bind:this={containerEl}
		transition:organicFade
	>
		<!-- Close button -->
		<button
			class="absolute right-4 top-4 rounded-full p-2 text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--text-primary)] hover:bg-[var(--surface-card)]"
			onclick={onBegin}
			aria-label="Close"
		>
			<X size={20} weight="bold" />
		</button>

		<!-- Centered content -->
		<div class="flex h-full w-full flex-col items-center justify-center px-6">
			<div class="flex w-full max-w-md flex-col items-center space-y-8">
				<!-- Logo animation zone -->
				<div class="flex items-center gap-3">
					<!-- Ephemeral logo -->
					<div data-anim="logo-ephemeral" style:opacity={motionOk() ? 0 : 1}>
						<img
							src="/landing/logo-full-white.png"
							alt="Ephemeral"
							class="h-10"
							aria-hidden="true"
						/>
					</div>

					<!-- Connection dots -->
					<div class="flex items-center gap-1.5">
						{#each Array(5) as _, i}
							<div
								data-anim="dot"
								class="dot-wave h-1.5 w-1.5 rounded-full bg-[var(--text-secondary)]"
								style:animation-delay="{i * 0.12}s"
								style:opacity={motionOk() ? 0 : 1}
							></div>
						{/each}
					</div>

					<!-- Stripe wordmark (official SVG from stripe.com brand assets) -->
					<div data-anim="logo-stripe" class="text-[var(--text-primary)]" style:opacity={motionOk() ? 0 : 1}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 120 60"
							class="h-10 w-auto"
							fill="currentColor"
							fill-rule="evenodd"
							aria-label="Stripe"
						>
							<path d="M101.547 30.94c0-5.885-2.85-10.53-8.3-10.53-5.47 0-8.782 4.644-8.782 10.483 0 6.92 3.908 10.414 9.517 10.414 2.736 0 4.805-.62 6.368-1.494v-4.598c-1.563.782-3.356 1.264-5.632 1.264-2.23 0-4.207-.782-4.46-3.494h11.24c0-.3.046-1.494.046-2.046zM90.2 28.757c0-2.598 1.586-3.678 3.035-3.678 1.402 0 2.897 1.08 2.897 3.678zm-14.597-8.345c-2.253 0-3.7 1.057-4.506 1.793l-.3-1.425H65.73v26.805l5.747-1.218.023-6.506c.828.598 2.046 1.448 4.07 1.448 4.115 0 7.862-3.3 7.862-10.598-.023-6.667-3.816-10.3-7.84-10.3zm-1.38 15.84c-1.356 0-2.16-.483-2.713-1.08l-.023-8.53c.598-.667 1.425-1.126 2.736-1.126 2.092 0 3.54 2.345 3.54 5.356 0 3.08-1.425 5.38-3.54 5.38zm-16.4-17.196l5.77-1.24V13.15l-5.77 1.218zm0 1.747h5.77v20.115h-5.77zm-6.185 1.7l-.368-1.7h-4.966V40.92h5.747V27.286c1.356-1.77 3.655-1.448 4.368-1.195v-5.287c-.736-.276-3.425-.782-4.782 1.7zm-11.494-6.7L34.535 17l-.023 18.414c0 3.402 2.552 5.908 5.954 5.908 1.885 0 3.264-.345 4.023-.76v-4.667c-.736.3-4.368 1.356-4.368-2.046V25.7h4.368v-4.897h-4.37zm-15.54 10.828c0-.897.736-1.24 1.954-1.24a12.85 12.85 0 0 1 5.7 1.47V21.47c-1.908-.76-3.793-1.057-5.7-1.057-4.667 0-7.77 2.437-7.77 6.506 0 6.345 8.736 5.333 8.736 8.07 0 1.057-.92 1.402-2.207 1.402-1.908 0-4.345-.782-6.276-1.84v5.47c2.138.92 4.3 1.3 6.276 1.3 4.782 0 8.07-2.368 8.07-6.483-.023-6.85-8.782-5.632-8.782-8.207z" />
						</svg>
					</div>
				</div>

				<!-- Headline -->
				<h1
					data-anim="headline"
					class="text-center text-headline-lg text-[var(--text-primary)]"
					style:opacity={motionOk() ? 0 : 1}
				>
					Ephemeral uses Stripe to handle ticketing
				</h1>

					<!-- Value prop cards -->
				<div class="w-full space-y-3">
					<div
						data-anim="card"
						class="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4"
						style:opacity={motionOk() ? 0 : 1}
					>
						<div class="shrink-0 rounded-lg bg-[var(--accent-primary)]/10 p-2">
							<Timer size={24} weight="duotone" class="text-[var(--accent-primary)]" />
						</div>
						<div>
							<p class="text-label-md text-[var(--text-primary)]">3-minute setup</p>
							<p class="text-body-sm text-[var(--text-secondary)]">
								Start selling tickets in minutes, not days.
							</p>
						</div>
					</div>

					<div
						data-anim="card"
						class="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4"
						style:opacity={motionOk() ? 0 : 1}
					>
						<div class="shrink-0 rounded-lg bg-[var(--accent-primary)]/10 p-2">
							<ShieldCheck size={24} weight="duotone" class="text-[var(--accent-primary)]" />
						</div>
						<div>
							<p class="text-label-md text-[var(--text-primary)]">Your data stays with Stripe</p>
							<p class="text-body-sm text-[var(--text-secondary)]">
								All payment data handled securely by Stripe — Ephemeral never sees or stores it.
							</p>
						</div>
					</div>

					<div
						data-anim="card"
						class="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] p-4"
						style:opacity={motionOk() ? 0 : 1}
					>
						<div class="shrink-0 rounded-lg bg-[var(--accent-primary)]/10 p-2">
							<Tag size={24} weight="duotone" class="text-[var(--accent-primary)]" />
						</div>
						<div>
							<p class="text-label-md text-[var(--text-primary)]">First 50 tickets are fee-free</p>
							<p class="text-body-sm text-[var(--text-secondary)]">
								$10 ticket = $10 flat to you. No platform fees on your first 50 sales.
							</p>
						</div>
					</div>
				</div>

				<!-- CTA button -->
				<button
					data-anim="cta"
					class="w-full max-w-sm rounded-full bg-[var(--accent-primary)] px-6 py-3.5 text-label-lg font-semibold text-[var(--surface-base)] transition-all duration-150 hover:bg-[var(--accent-hover)]"
					onclick={onBegin}
					style:opacity={motionOk() ? 0 : 1}
				>
					Begin setup
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes dot-wave {
		0%,
		60%,
		100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		30% {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	.dot-wave {
		animation: dot-wave 1.5s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.dot-wave {
			animation: none;
			opacity: 1 !important;
			transform: none;
		}
	}
</style>
