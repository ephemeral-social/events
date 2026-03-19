<script lang="ts">
	import { Check, Minus, X, PencilSimple, Crown, GearSix, CheckCircle } from 'phosphor-svelte';
	import { hapticLight } from '$lib/utils/haptics';
	import { pressFeedback } from '$lib/motion';
	import type { Snippet } from 'svelte';

	interface RsvpData {
		status: string;
		display_name: string;
		plus_ones: number;
		payment_status?: string;
	}

	interface Props {
		rsvp: RsvpData;
		onEdit?: () => void;
		onDone?: () => void;
		sheetOpen?: boolean;
		isHost?: boolean;
		ticketAction?: Snippet;
		onSettings?: () => void;
	}

	let { rsvp, onEdit, onDone, sheetOpen = false, isHost = false, ticketAction, onSettings }: Props = $props();

	const statusConfig = $derived(
		rsvp.status === 'going'
			? { label: 'Going', icon: Check, color: 'text-[var(--accent-primary)]' }
			: rsvp.status === 'maybe'
				? { label: 'Maybe', icon: Minus, color: 'text-[var(--text-secondary)]' }
				: { label: "Can't make it", icon: X, color: 'text-[var(--text-muted)]' }
	);
</script>

<div
	class="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-card)] px-4 py-3"
>
	<div class="flex items-center gap-3">
		<div
			class="flex h-8 w-8 items-center justify-center rounded-full
				{rsvp.status === 'going' ? 'bg-[var(--accent-primary)]/15' : 'bg-[var(--surface-overlay)]'}"
		>
			{#if isHost}
				<Crown size={18} weight="duotone" class="text-[var(--accent-primary)]" />
			{:else if rsvp.status === 'going'}
				<Check size={18} weight="bold" class={statusConfig.color} />
			{:else if rsvp.status === 'maybe'}
				<Minus size={18} weight="bold" class={statusConfig.color} />
			{:else}
				<X size={18} weight="bold" class={statusConfig.color} />
			{/if}
		</div>
		<div>
			<p class="text-body-md font-medium {statusConfig.color}">
				{isHost ? 'Hosting' : statusConfig.label}
			</p>
			{#if rsvp.display_name}
				<p class="text-body-sm text-[var(--text-muted)]">
					{rsvp.display_name}
					{#if rsvp.plus_ones > 0}
						+{rsvp.plus_ones}
					{/if}
				</p>
			{/if}
		</div>
	</div>

	{#if isHost}
		<div class="flex items-center -mr-1">
			<button
				class="flex items-center gap-0.5 rounded-full px-1.5 py-1 text-caption font-medium text-[var(--text-primary)] transition-all duration-150 hover:bg-[var(--surface-overlay)] active:scale-[0.97]"
				use:pressFeedback
				onclick={() => { hapticLight(); onEdit?.(); }}
			>
				<PencilSimple size={12} weight="regular" />
				Edit
			</button>
			<button
				class="flex items-center gap-0.5 rounded-full px-1.5 py-1 text-caption font-medium text-[var(--text-primary)] transition-all duration-150 hover:bg-[var(--surface-overlay)] active:scale-[0.97]"
				use:pressFeedback
				onclick={() => { hapticLight(); onSettings?.(); }}
			>
				<GearSix size={12} weight="regular" class="text-[var(--accent-primary)]" />
				Settings
			</button>
		</div>
	{:else if onEdit}
		<div class="flex flex-col items-end gap-1">
			<button
				class="rsvp-toggle-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm transition-all duration-200"
				class:rsvp-toggle-done={sheetOpen}
				class:rsvp-toggle-change={!sheetOpen}
				onclick={() => {
					hapticLight();
					if (sheetOpen) {
						onDone?.();
					} else {
						onEdit?.();
					}
				}}
			>
				<span class="rsvp-toggle-icon" class:rsvp-toggle-icon-active={sheetOpen}>
					{#if sheetOpen}
						<CheckCircle size={14} weight="fill" />
					{:else}
						<PencilSimple size={14} weight="regular" />
					{/if}
				</span>
				<span class="rsvp-toggle-label">
					{sheetOpen ? 'Done' : 'Change'}
				</span>
			</button>
			{#if ticketAction}
				{@render ticketAction()}
			{/if}
		</div>
	{/if}
</div>

<style>
	.rsvp-toggle-btn {
		position: relative;
		overflow: hidden;
	}

	.rsvp-toggle-change {
		color: var(--text-secondary);
	}

	.rsvp-toggle-change:hover {
		background: var(--surface-overlay);
	}

	.rsvp-toggle-done {
		color: var(--accent-primary);
	}

	.rsvp-toggle-done:hover {
		background: color-mix(in srgb, var(--accent-primary) 10%, transparent);
	}

	.rsvp-toggle-icon {
		display: flex;
		transition: transform 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	.rsvp-toggle-icon-active {
		animation: rsvp-icon-pop 300ms cubic-bezier(0.25, 0.1, 0.25, 1);
	}

	@keyframes rsvp-icon-pop {
		0% {
			transform: scale(0.5) rotate(-90deg);
			opacity: 0;
		}
		60% {
			transform: scale(1.15) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: scale(1) rotate(0deg);
			opacity: 1;
		}
	}

	.rsvp-toggle-label {
		transition: opacity 150ms ease;
	}
</style>
