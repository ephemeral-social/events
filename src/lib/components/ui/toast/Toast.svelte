<script lang="ts">
	import type { ToastVariant } from '$lib/stores/toast.svelte';
	import { dismissToast } from '$lib/stores/toast.svelte';
	import { X, CheckCircle, Warning, Info } from 'phosphor-svelte';
	import { swipeDismiss } from '$lib/motion/actions/swipe-dismiss';

	interface Props {
		id: string;
		message: string;
		variant: ToastVariant;
	}

	let { id, message, variant }: Props = $props();

	const icons = {
		success: CheckCircle,
		error: Warning,
		info: Info
	};

	const colors = {
		success: 'var(--feedback-success)',
		error: 'var(--feedback-error)',
		info: 'var(--feedback-info)'
	};

	const Icon = $derived(icons[variant]);
	const color = $derived(colors[variant]);
</script>

<div
	class="flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg"
	style="
		background: var(--surface-overlay);
		border-color: var(--border-subtle);
		animation: toast-slide-up 250ms cubic-bezier(0.25, 0.1, 0.25, 1) both;
	"
	role="alert"
	use:swipeDismiss={{ onDismiss: () => dismissToast(id), activationDelay: 300 }}
>
	<Icon size={20} weight="duotone" color={color} class="shrink-0" />
	<p class="text-body-sm text-[var(--text-primary)] flex-1">{message}</p>
	<button
		onclick={() => dismissToast(id)}
		class="shrink-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
		aria-label="Dismiss"
	>
		<X size={16} weight="bold" />
	</button>
</div>
