<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';

	type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive';

	interface Props {
		variant?: BadgeVariant;
		children: Snippet;
		class?: string;
	}

	let { variant = 'default', children, class: className }: Props = $props();

	const variantClasses: Record<BadgeVariant, string> = {
		default:
			'bg-[var(--accent-muted)] text-[var(--accent-primary)] border-[var(--accent-primary)]/20',
		secondary:
			'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-default)]',
		success:
			'bg-[var(--feedback-success)]/10 text-[var(--feedback-success)] border-[var(--feedback-success)]/20',
		warning:
			'bg-[var(--feedback-warning)]/10 text-[var(--feedback-warning)] border-[var(--feedback-warning)]/20',
		destructive:
			'bg-[var(--feedback-error)]/10 text-[var(--feedback-error)] border-[var(--feedback-error)]/20'
	};
</script>

<span
	class={cn(
		'inline-flex items-center rounded-full border px-2.5 py-0.5 text-label transition-colors',
		variantClasses[variant],
		className
	)}
>
	{@render children()}
</span>
