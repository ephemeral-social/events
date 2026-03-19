<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { CaretLeft } from 'phosphor-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		backHref?: string;
		children?: Snippet;
		class?: string;
	}

	let { title, backHref, children, class: className }: Props = $props();
</script>

<nav
	class={cn(
		'fixed top-0 left-0 right-0 z-40 flex items-center justify-between',
		className
	)}
	style="
		backdrop-filter: blur(20px) saturate(180%);
		-webkit-backdrop-filter: blur(20px) saturate(180%);
		background: var(--chrome-bg);
		border-bottom: 0.5px solid var(--chrome-border);
		padding-top: max(env(safe-area-inset-top, 14px), 14px);
		padding-bottom: 10px;
		padding-left: max(env(safe-area-inset-left, 16px), 16px);
		padding-right: max(env(safe-area-inset-right, 16px), 16px);
	"
>
	<!-- Left: back button or spacer -->
	<div class="flex items-center min-w-[44px]">
		{#if backHref}
			<a
				href={backHref}
				class="flex items-center gap-0.5 text-[var(--accent-primary)] text-body-sm font-medium -ml-1"
				aria-label="Go back"
			>
				<CaretLeft size={20} weight="bold" />
			</a>
		{/if}
	</div>

	<!-- Center: title -->
	<h1 class="text-label-lg font-semibold text-[var(--text-primary)] truncate text-center flex-1 mx-2">
		{title}
	</h1>

	<!-- Right: actions slot or spacer -->
	<div class="flex items-center min-w-[44px] justify-end">
		{#if children}
			{@render children()}
		{/if}
	</div>
</nav>
