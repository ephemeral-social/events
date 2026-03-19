<script lang="ts">
	import { animate } from 'motion';
	import { motionOk } from '../utils/reduced-motion.svelte';

	interface Props {
		trigger: number;
		count?: number;
		colors?: string[];
		origin?: { x: number; y: number };
		class?: string;
	}

	let {
		trigger,
		count = 18,
		colors = ['#52b788', '#40916c', '#95d5b2', '#d8f3dc', '#74c69d'],
		origin = { x: 0, y: 0 },
		class: className
	}: Props = $props();

	let particles: Array<{ id: number; color: string }> = $state([]);
	let container: HTMLElement | undefined = $state();
	let activeControls: ReturnType<typeof animate>[] = [];

	$effect(() => {
		if (!trigger || !motionOk() || !container) return;
		burst();
		return () => {
			activeControls.forEach((c) => c.stop());
			activeControls = [];
		};
	});

	function burst() {
		activeControls.forEach((c) => c.stop());
		activeControls = [];

		const newParticles = Array.from({ length: count }, (_, i) => ({
			id: Date.now() + i,
			color: colors[i % colors.length]
		}));

		particles = newParticles;

		requestAnimationFrame(() => {
			if (!container) return;
			newParticles.forEach((p, i) => {
				const el = container!.querySelector(`[data-particle="${p.id}"]`) as HTMLElement;
				if (!el) return;
				const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
				const velocity = 80 + Math.random() * 120;
				const controls = animate(el, {
					x: [0, Math.cos(angle) * velocity],
					y: [0, Math.sin(angle) * velocity - 60 + Math.random() * 40],
					rotate: [0, Math.random() * 360],
					opacity: [1, 0],
					scale: [1, 0.3]
				}, {
					duration: 0.8 + Math.random() * 0.4,
					ease: [0, 0, 0.2, 1],
					onComplete: () => {
						particles = particles.filter((pp) => pp.id !== p.id);
					}
				});
				activeControls.push(controls);
			});
		});
	}
</script>

<div
	bind:this={container}
	class={className}
	style="position:fixed;inset:0;pointer-events:none;z-index:9999;"
>
	{#each particles as p (p.id)}
		<span
			data-particle={p.id}
			class="confetti-particle"
			style="left:{origin.x}px;top:{origin.y}px;background:{p.color};"
		></span>
	{/each}
</div>

<style>
	.confetti-particle {
		position: fixed;
		width: 8px;
		height: 8px;
		border-radius: 2px;
		pointer-events: none;
		z-index: 9999;
	}
</style>
