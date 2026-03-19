<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { supportsAmbientEffects } from '../utils/device-tier';
	import { motionOk } from '../utils/reduced-motion.svelte';
	import type { AmbientRenderer } from '../ambient/types';

	interface Props {
		theme?: string;
		class?: string;
		zIndex?: number;
		opacity?: number;
	}

	let { theme = 'forest', class: className, zIndex = 0, opacity = 0.4 }: Props = $props();

	let canvas: HTMLCanvasElement | undefined = $state();
	let renderer: AmbientRenderer | null = null;
	let animationId = 0;
	let currentCtx: CanvasRenderingContext2D | null = null;
	let mounted = false;

	// Static import map — no dynamic template literal import paths
	const rendererLoaders: Record<
		string,
		() => Promise<{
			createRenderer: (
				ctx: CanvasRenderingContext2D,
				w: number,
				h: number
			) => AmbientRenderer;
		}>
	> = {
		forest: () => import('../ambient/forest'),
		sakura: () => import('../ambient/sakura'),
		garden: () => import('../ambient/garden')
	};

	// Use onMount for initialization — avoids reactive dependency issues during
	// Svelte hydration that can crash iOS Safari.
	onMount(() => {
		if (!canvas || !supportsAmbientEffects() || !motionOk()) return;

		// Guard: iOS Safari can report 0 dimensions during initial load
		const w = window.innerWidth;
		const h = window.innerHeight;
		if (w === 0 || h === 0) return;

		canvas.width = w;
		canvas.height = h;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		currentCtx = ctx;
		mounted = true;
		loadRenderer(theme, ctx);

		function handleVisibility() {
			if (document.hidden) {
				cancelAnimationFrame(animationId);
				animationId = 0;
			} else if (renderer && mounted) {
				cancelAnimationFrame(animationId);
				animationId = 0;
				loop();
			}
		}
		document.addEventListener('visibilitychange', handleVisibility);

		return () => {
			mounted = false;
			cancelAnimationFrame(animationId);
			document.removeEventListener('visibilitychange', handleVisibility);
			renderer?.destroy?.();
			renderer = null;
		};
	});

	// React to theme prop changes AFTER mount.
	// `mounted` and `currentCtx` are plain variables (not $state), so this
	// $effect only re-runs when `theme` changes — not on mount.
	$effect(() => {
		const t = theme; // subscribe to theme prop
		if (!mounted || !currentCtx) return;
		loadRenderer(t, currentCtx);
	});

	async function loadRenderer(themeName: string, ctx: CanvasRenderingContext2D) {
		try {
			cancelAnimationFrame(animationId);
			renderer?.destroy?.();
			renderer = null;

			const loader = rendererLoaders[themeName] ?? rendererLoaders.forest;
			const mod = await loader();
			// Guard: canvas may have been removed during async load
			if (!canvas || !mounted) return;

			const w = canvas.width;
			const h = canvas.height;
			if (w === 0 || h === 0) return;

			renderer = mod.createRenderer(ctx, w, h);
			loop();
		} catch {
			// Ambient effects are decorative — fail silently
		}
	}

	function loop() {
		if (!renderer || !mounted) return;
		try {
			renderer.update();
			renderer.draw();
		} catch {
			// Renderer error — stop the loop to avoid repeated throws
			renderer = null;
			return;
		}
		animationId = requestAnimationFrame(loop);
	}

	// Handle resize
	function handleResize() {
		if (!canvas || !browser) return;
		const w = window.innerWidth;
		const h = window.innerHeight;
		if (w === 0 || h === 0) return;
		canvas.width = w;
		canvas.height = h;
		renderer?.resize?.(w, h);
	}
</script>

<svelte:window onresize={handleResize} />

{#if browser && supportsAmbientEffects() && motionOk()}
	<canvas
		bind:this={canvas}
		class={className}
		aria-hidden="true"
		style="position:fixed;inset:0;pointer-events:none;z-index:{zIndex};opacity:{opacity};"
	></canvas>
{/if}
