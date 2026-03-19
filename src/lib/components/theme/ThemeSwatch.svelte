<script lang="ts">
	import {
		TreeEvergreen,
		MoonStars,
		Fire,
		Buildings,
		Flower,
		Crown,
		Lightning,
		SunHorizon,
		Cactus,
		TextAa,
		Check
	} from 'phosphor-svelte';
	import type { EventTheme, EventMode } from '$lib/themes/types';
	import { getThemeTokens } from '$lib/themes/tokens';
	import { hapticLight } from '$lib/utils/haptics';

	interface Props {
		theme: EventTheme;
		selected: boolean;
		mode: EventMode;
		onclick: () => void;
	}

	let { theme, selected, mode, onclick }: Props = $props();

	function handleClick() {
		hapticLight();
		onclick();
	}

	const THEME_ICONS: Record<EventTheme, typeof TreeEvergreen> = {
		forest: TreeEvergreen,
		midnight: MoonStars,
		ember: Fire,
		slate: Buildings,
		bloom: Flower,
		gilded: Crown,
		neon: Lightning,
		dusk: SunHorizon,
		sand: Cactus,
		mono: TextAa
	};

	const THEME_LABELS: Record<EventTheme, string> = {
		forest: 'Forest',
		midnight: 'Midnight',
		ember: 'Ember',
		slate: 'Slate',
		bloom: 'Bloom',
		gilded: 'Gilded',
		neon: 'Neon',
		dusk: 'Dusk',
		sand: 'Sand',
		mono: 'Mono'
	};

	const tokens = $derived(getThemeTokens(theme, mode));
	const Icon = $derived(THEME_ICONS[theme]);
	const label = $derived(THEME_LABELS[theme]);
</script>

<button
	class="swatch-wrapper"
	class:selected
	aria-label="Select {label} theme"
	aria-pressed={selected}
	onclick={handleClick}
	type="button"
>
	<div
		class="swatch"
		class:selected
		style="background: {tokens.background};"
	>
		<!-- Accent circle -->
		<div
			class="accent-dot"
			style="background: {tokens.primary};"
		></div>

		<!-- Theme icon -->
		<Icon size={20} weight="duotone" color={tokens.primary} />

		<!-- Selected check overlay -->
		{#if selected}
			<div class="check-overlay">
				<Check size={16} weight="bold" color={tokens.primaryForeground} />
			</div>
		{/if}
	</div>

	<span class="swatch-label">{label}</span>
</button>

<style>
	.swatch-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.swatch {
		width: 60px;
		height: 60px;
		border-radius: 0.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		position: relative;
		border: 2px solid transparent;
		transition: all 150ms ease;
	}

	.swatch:hover {
		border-color: var(--border-default);
	}

	.swatch.selected {
		border-color: var(--accent-primary);
		box-shadow: 0 0 0 1px var(--accent-primary);
	}

	.accent-dot {
		width: 12px;
		height: 12px;
		border-radius: 9999px;
	}

	.check-overlay {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 18px;
		height: 18px;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent-primary);
	}

	.swatch-label {
		font-size: 0.6875rem;
		line-height: 1;
		color: var(--text-muted);
		font-family: var(--font-body);
		transition: color 150ms ease;
	}

	.swatch-wrapper:hover .swatch-label {
		color: var(--text-secondary);
	}

	.swatch-wrapper.selected .swatch-label {
		color: var(--text-primary);
	}
</style>
