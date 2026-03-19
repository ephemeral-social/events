<script lang="ts">
	import { cn } from '$lib/utils/cn';

	interface Props {
		seed: string;
		class?: string;
	}

	let { seed, class: className }: Props = $props();

	function hashString(str: string): number {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
		}
		return Math.abs(hash);
	}

	// Warm palettes that look beautiful on dark #111110 backgrounds
	const PALETTES = [
		['#52b788', '#2d6a4f', '#95d5b2'], // Forest canopy
		['#c9a96e', '#e8a520', '#deb887'], // Golden hour
		['#e85d04', '#f48c06', '#ffba08'], // Ember glow
		['#7b2cbf', '#4361ee', '#9d4edd'], // Twilight
		['#0096c7', '#48bfe3', '#023e8a'], // Ocean depths
		['#ff6b8a', '#e56b6f', '#b5838d'], // Rose garden
		['#2ec4b6', '#17c3b2', '#0f766e'], // Teal waters
		['#ffb703', '#fb8500', '#fca311'] // Citrus
	];

	const hash = $derived(hashString(seed));
	const palette = $derived(PALETTES[hash % PALETTES.length]);

	// Gradient positions — upper-biased so text at bottom stays readable
	const g1 = $derived({
		x: 10 + ((hash >> 4) % 45),
		y: 10 + ((hash >> 8) % 35),
		size: 55 + ((hash >> 3) % 30)
	});
	const g2 = $derived({
		x: 40 + ((hash >> 12) % 50),
		y: 5 + ((hash >> 16) % 30),
		size: 45 + ((hash >> 7) % 25)
	});
	const g3 = $derived({
		x: 15 + ((hash >> 20) % 55),
		y: 30 + ((hash >> 24) % 35),
		size: 40 + ((hash >> 11) % 30)
	});

	// Subtle ring positions for geometric interest
	const ring1 = $derived({
		x: 60 + ((hash >> 5) % 30),
		y: 15 + ((hash >> 9) % 25),
		r: 12 + ((hash >> 13) % 10)
	});
	const ring2 = $derived({
		x: 20 + ((hash >> 17) % 30),
		y: 50 + ((hash >> 21) % 25),
		r: 16 + ((hash >> 25) % 12)
	});

	const bgStyle = $derived(
		`background: ` +
			`radial-gradient(ellipse ${g1.size}% ${g1.size}% at ${g1.x}% ${g1.y}%, ${palette[0]}60 0%, transparent 70%), ` +
			`radial-gradient(ellipse ${g2.size}% ${g2.size}% at ${g2.x}% ${g2.y}%, ${palette[1]}50 0%, transparent 65%), ` +
			`radial-gradient(ellipse ${g3.size}% ${g3.size}% at ${g3.x}% ${g3.y}%, ${palette[2]}40 0%, transparent 60%), ` +
			`radial-gradient(circle at ${ring1.x}% ${ring1.y}%, transparent ${ring1.r - 0.5}%, rgba(255,255,255,0.03) ${ring1.r}%, transparent ${ring1.r + 0.5}%), ` +
			`radial-gradient(circle at ${ring2.x}% ${ring2.y}%, transparent ${ring2.r - 0.5}%, rgba(255,255,255,0.025) ${ring2.r}%, transparent ${ring2.r + 0.5}%), ` +
			`radial-gradient(ellipse 120% 80% at 50% 30%, rgba(200, 180, 150, 0.04) 0%, transparent 70%), ` +
			`var(--surface-base, #111110)`
	);
</script>

<div class={cn('absolute inset-0', className)} aria-hidden="true">
	<div class="generative-bg absolute inset-0" style={bgStyle}></div>
</div>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.generative-bg {
			animation: drift 25s ease-in-out infinite;
		}
	}

	@keyframes drift {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(1.5%, -1%) scale(1.02);
		}
		66% {
			transform: translate(-1%, 1%) scale(0.98);
		}
	}
</style>
