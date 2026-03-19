<script lang="ts">
	import { Sun, Moon } from 'phosphor-svelte';
	import type { EventMode } from '$lib/themes/types';
	import { hapticLight } from '$lib/utils/haptics';

	interface Props {
		mode: EventMode;
		onchange: (mode: EventMode) => void;
	}

	let { mode, onchange }: Props = $props();

	function handleChange(m: EventMode) {
		hapticLight();
		onchange(m);
	}
</script>

<div class="toggle-track" role="radiogroup" aria-label="Appearance mode">
	<button
		class="toggle-option"
		class:active={mode === 'light'}
		type="button"
		role="radio"
		aria-checked={mode === 'light'}
		aria-label="Light mode"
		onclick={() => handleChange('light')}
	>
		<Sun size={16} weight={mode === 'light' ? 'bold' : 'regular'} />
		<span>Light</span>
	</button>

	<button
		class="toggle-option"
		class:active={mode === 'dark'}
		type="button"
		role="radio"
		aria-checked={mode === 'dark'}
		aria-label="Dark mode"
		onclick={() => handleChange('dark')}
	>
		<Moon size={16} weight={mode === 'dark' ? 'bold' : 'regular'} />
		<span>Dark</span>
	</button>
</div>

<style>
	.toggle-track {
		display: inline-flex;
		border-radius: 9999px;
		background: var(--surface-card);
		border: 1px solid var(--border-subtle);
		padding: 3px;
		gap: 2px;
	}

	.toggle-option {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border-radius: 9999px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease;
		line-height: 1;
	}

	.toggle-option:hover:not(.active) {
		color: var(--text-secondary);
	}

	.toggle-option.active {
		background: var(--accent-primary);
		color: var(--surface-base);
	}
</style>
