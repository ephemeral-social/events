<script lang="ts">
	import type { Component } from 'svelte';

	interface ActionItem {
		label: string;
		icon?: Component;
		destructive?: boolean;
		handler: () => void;
	}

	interface Props {
		open: boolean;
		onClose: () => void;
		actions: ActionItem[];
	}

	let { open, onClose, actions }: Props = $props();

	function handleAction(action: ActionItem) {
		action.handler();
		onClose();
	}
</script>

{#if open}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50"
		style="background: var(--backdrop-overlay); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px)"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute bottom-0 left-0 right-0 flex flex-col gap-2 px-3"
			style="
				padding-bottom: max(var(--safe-bottom, 0px), 12px);
				animation: action-sheet-up 300ms cubic-bezier(0.25, 0.1, 0.25, 1) both;
			"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && onClose()}
		>
			<!-- Actions group -->
			<div class="rounded-2xl overflow-hidden" style="background: var(--surface-overlay)">
				{#each actions as action, i}
					{#if i > 0}
						<div class="h-px" style="background: var(--border-subtle)"></div>
					{/if}
					<button
						class="w-full px-4 py-3.5 text-center text-body-md font-medium transition-colors active:bg-[var(--surface-subtle)]"
						style="color: {action.destructive ? 'var(--feedback-error)' : 'var(--accent-primary)'}"
						onclick={() => handleAction(action)}
					>
						{action.label}
					</button>
				{/each}
			</div>

			<!-- Cancel -->
			<button
				class="w-full rounded-2xl px-4 py-3.5 text-center text-body-md font-semibold transition-colors active:opacity-80"
				style="background: var(--surface-raised); color: var(--text-primary)"
				onclick={onClose}
			>
				Cancel
			</button>
		</div>
	</div>
{/if}

<style>
	@keyframes action-sheet-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
</style>
