<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
		class?: string;
	}

	let { children, class: className, ...restProps }: Props = $props();
</script>

<div
	class={cn(
		'rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] shadow-[var(--shadow-sm)]',
		className
	)}
	{...restProps}
>
	{@render children()}
</div>
