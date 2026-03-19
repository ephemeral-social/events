<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { CaretLeft } from 'phosphor-svelte';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';

	interface Props {
		title: string;
		backHref?: string;
		children?: Snippet;
		class?: string;
	}

	let { title, backHref, children, class: className }: Props = $props();
	let collapsed = $state(false);
	let sentinelRef: HTMLDivElement | undefined = $state();

	onMount(() => {
		if (!sentinelRef) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				collapsed = !entry.isIntersecting;
			},
			{ threshold: 0 }
		);
		observer.observe(sentinelRef);
		return () => observer.disconnect();
	});
</script>

<!-- Sentinel: when this scrolls out of view, header collapses -->
<div bind:this={sentinelRef} class="h-0" aria-hidden="true"></div>

<!-- Compact nav bar (always present, title fades in) -->
<nav
	class={cn(
		'fixed top-0 left-0 right-0 z-40 flex items-center justify-between transition-[background-color] duration-200',
		className
	)}
	style="
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		background: {collapsed ? 'var(--chrome-bg)' : 'transparent'};
		border-bottom: {collapsed ? '0.5px solid var(--chrome-border)' : 'none'};
		padding-top: max(env(safe-area-inset-top, 14px), 14px);
		padding-bottom: 10px;
		padding-left: max(env(safe-area-inset-left, 16px), 16px);
		padding-right: max(env(safe-area-inset-right, 16px), 16px);
	"
>
	<div class="flex items-center min-w-[44px]">
		{#if backHref}
			<a
				href={backHref}
				class="flex items-center text-[var(--accent-primary)] -ml-1"
				aria-label="Go back"
			>
				<CaretLeft size={20} weight="bold" />
			</a>
		{/if}
	</div>

	<h1
		class="text-label-lg font-semibold text-[var(--text-primary)] truncate text-center flex-1 mx-2 transition-opacity duration-200"
		style="opacity: {collapsed ? 1 : 0}"
	>
		{title}
	</h1>

	<div class="flex items-center min-w-[44px] justify-end">
		{#if children}
			{@render children()}
		{/if}
	</div>
</nav>

<!-- Large title (scrolls with content) -->
<div class="px-4 pt-2 pb-4" style="padding-top: calc(var(--nav-height) + 8px)">
	<h1 class="text-display-md text-[var(--text-primary)]">{title}</h1>
</div>
