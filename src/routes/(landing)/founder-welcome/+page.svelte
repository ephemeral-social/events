<script lang="ts">
	let copied = $state(false);

	function shareOnX() {
		const text = encodeURIComponent(
			"Just became an Ephemeral founder -- betting on social that respects your time and privacy. $45/year locked in forever."
		);
		const url = encodeURIComponent("https://ephemeralsocial.com");
		window.open(
			`https://twitter.com/intent/tweet?text=${text}&url=${url}`,
			"_blank",
			"noopener,noreferrer"
		);
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText("https://ephemeralsocial.com");
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Fallback for older browsers
			const input = document.createElement("input");
			input.value = "https://ephemeralsocial.com";
			document.body.appendChild(input);
			input.select();
			document.execCommand("copy");
			document.body.removeChild(input);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}
</script>

<svelte:head>
	<title>Welcome, Founder - Ephemeral</title>
</svelte:head>

<div class="min-h-screen bg-[var(--surface-base)]">
	<!-- Nav -->
	<nav class="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
		<a href="/" class="flex items-center">
			<img src="/landing/logo-full-white.png" alt="Ephemeral" class="h-7" />
		</a>
		<a
			href="/"
			class="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
		>
			&larr; Back to home
		</a>
	</nav>

	<!-- Content -->
	<main class="mx-auto max-w-[700px] px-6 py-20">
		<div class="flex flex-col items-center text-center">
			<!-- Floating icon -->
			<div class="animate-float">
				<img
					src="/landing/favicon.png"
					alt="Ephemeral"
					class="h-20 w-20 rounded-2xl"
				/>
			</div>

			<!-- Title -->
			<h1 class="text-display-md mt-8 text-[var(--text-primary)]">Welcome, Founder</h1>
			<p class="mt-4 max-w-md text-body-lg text-[var(--text-secondary)]">
				You're one of the first to bet on something different.
			</p>

			<!-- Price lock card -->
			<div
				class="mt-10 w-full max-w-sm rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-6"
			>
				<div class="flex items-center justify-center gap-3">
					<span class="text-display-md text-[var(--text-primary)]">$45</span>
					<span class="text-body-md text-[var(--text-secondary)]">/year</span>
				</div>
				<div class="mt-3 inline-block rounded-full bg-[var(--accent-muted)] px-4 py-1.5">
					<span class="text-caption font-semibold tracking-wider text-[var(--accent-primary)]">
						LOCKED IN FOREVER
					</span>
				</div>
			</div>

			<!-- Benefits card -->
			<div
				class="mt-8 w-full rounded-xl border border-[var(--accent-primary)] bg-[var(--surface-raised)] p-6 text-left"
			>
				<h2 class="text-headline-lg text-[var(--accent-primary)]">What you've unlocked</h2>
				<ul class="mt-5 space-y-4">
					<li class="flex items-start gap-3">
						<span
							class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-primary)]"
						></span>
						<div>
							<p class="text-body-md font-semibold text-[var(--text-primary)]">
								Guaranteed first access
							</p>
							<p class="text-body-sm text-[var(--text-secondary)]">
								Skip the waitlist entirely
							</p>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span
							class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-primary)]"
						></span>
						<div>
							<p class="text-body-md font-semibold text-[var(--text-primary)]">
								$45/year forever
							</p>
							<p class="text-body-sm text-[var(--text-secondary)]">
								Even when regular pricing is $70/year
							</p>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span
							class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-primary)]"
						></span>
						<div>
							<p class="text-body-md font-semibold text-[var(--text-primary)]">
								Shape the product
							</p>
							<p class="text-body-sm text-[var(--text-secondary)]">
								Direct input on features and direction
							</p>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span
							class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent-primary)]"
						></span>
						<div>
							<p class="text-body-md font-semibold text-[var(--text-primary)]">
								Founder recognition
							</p>
							<p class="text-body-sm text-[var(--text-secondary)]">
								Special badge visible in-app
							</p>
						</div>
					</li>
				</ul>
			</div>

			<!-- What happens next card -->
			<div
				class="mt-8 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-6 text-left"
			>
				<h2 class="text-headline-lg text-[var(--text-primary)]">What happens next</h2>
				<ol class="mt-5 space-y-4">
					<li class="flex items-start gap-4">
						<span
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-overlay)] text-caption font-semibold text-[var(--text-primary)]"
						>
							1
						</span>
						<p class="text-body-md text-[var(--text-secondary)]">
							Check your email for your receipt and founder confirmation
						</p>
					</li>
					<li class="flex items-start gap-4">
						<span
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-overlay)] text-caption font-semibold text-[var(--text-primary)]"
						>
							2
						</span>
						<p class="text-body-md text-[var(--text-secondary)]">
							We'll send exclusive updates as we build
						</p>
					</li>
					<li class="flex items-start gap-4">
						<span
							class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--surface-overlay)] text-caption font-semibold text-[var(--text-primary)]"
						>
							3
						</span>
						<p class="text-body-md text-[var(--text-secondary)]">
							When we launch (early 2026), you'll be first in line
						</p>
					</li>
				</ol>
			</div>

			<!-- Share section -->
			<div class="mt-12 w-full">
				<p class="text-body-md text-[var(--text-secondary)]">Know someone who'd care?</p>
				<div class="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
					<button
						onclick={shareOnX}
						class="w-full cursor-pointer rounded-full border border-[var(--border-default)] bg-[var(--surface-raised)] px-6 py-3 text-button text-[var(--text-primary)] transition-all duration-150 hover:border-[var(--text-muted)] hover:bg-[var(--surface-overlay)] sm:w-auto"
					>
						Share on X
					</button>
					<button
						onclick={copyLink}
						class="w-full cursor-pointer rounded-full border border-[var(--border-default)] bg-[var(--surface-raised)] px-6 py-3 text-button text-[var(--text-primary)] transition-all duration-150 hover:border-[var(--text-muted)] hover:bg-[var(--surface-overlay)] sm:w-auto"
					>
						{copied ? "Copied!" : "Copy Link"}
					</button>
				</div>
			</div>

			<!-- Back to home -->
			<a
				href="/"
				class="mt-12 text-body-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]"
			>
				&larr; Back to home
			</a>
		</div>
	</main>

	<!-- Footer -->
	<footer
		class="flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] bg-[#0d0d0c] px-6 py-10 text-sm text-[var(--text-muted)] sm:flex-row sm:justify-between"
	>
		<div class="flex gap-6">
			<a
				href="/privacy"
				class="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>Privacy</a
			>
			<a
				href="/terms"
				class="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>Terms</a
			>
		</div>
		<div>&copy; 2026 Ephemeral Social PBC</div>
	</footer>
</div>

<style>
	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	.animate-float {
		animation: float 3s ease-in-out infinite;
	}
</style>
