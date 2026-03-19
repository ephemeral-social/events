<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
	type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

	interface Props extends HTMLButtonAttributes {
		variant?: ButtonVariant;
		size?: ButtonSize;
		children: Snippet;
		class?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		children,
		class: className,
		...restProps
	}: Props = $props();

	const variantClasses: Record<ButtonVariant, string> = {
		primary:
			'bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)]',
		secondary:
			'bg-transparent border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-muted)]',
		ghost:
			'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)]',
		destructive:
			'bg-[var(--feedback-error)] text-[var(--text-primary)] hover:bg-[var(--feedback-error)]/90'
	};

	const sizeClasses: Record<ButtonSize, string> = {
		sm: 'h-8 px-4 text-body-sm',
		md: 'h-10 px-6 text-button',
		lg: 'h-12 px-8 text-button',
		icon: 'h-10 w-10'
	};
</script>

<button
	class={cn(
		'inline-flex cursor-pointer items-center justify-center rounded-full font-semibold transition-[transform,opacity,background-color] duration-100 ease-out will-change-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)] disabled:pointer-events-none disabled:opacity-50',
		variantClasses[variant],
		sizeClasses[size],
		className
	)}
	{...restProps}
>
	{@render children()}
</button>
