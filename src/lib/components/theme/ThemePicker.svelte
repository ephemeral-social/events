<script lang="ts">
	import type { EventTheme, EventMode } from '$lib/themes/types';
	import { VALID_THEMES } from '$lib/themes/types';
	import { getDefaultMode } from '$lib/themes/defaults';
	import ThemeSwatch from './ThemeSwatch.svelte';
	import ModeToggle from './ModeToggle.svelte';
	import AccentPicker from './AccentPicker.svelte';

	interface Props {
		theme: EventTheme;
		mode: EventMode;
		accentHue: number | null;
		onThemeChange: (theme: EventTheme) => void;
		onModeChange: (mode: EventMode) => void;
		onAccentChange: (hue: number | null) => void;
	}

	let { theme, mode, accentHue, onThemeChange, onModeChange, onAccentChange }: Props = $props();

	function handleThemeChange(newTheme: EventTheme) {
		onThemeChange(newTheme);
		// Auto-select the theme's default mode
		const defaultMode = getDefaultMode(newTheme);
		onModeChange(defaultMode);
	}
</script>

<div class="theme-picker">
	<!-- Theme Section -->
	<div class="section">
		<h3 class="section-heading">Theme</h3>
		<div class="theme-grid">
			{#each VALID_THEMES as t (t)}
				<ThemeSwatch
					theme={t}
					selected={theme === t}
					{mode}
					onclick={() => handleThemeChange(t)}
				/>
			{/each}
		</div>
	</div>

	<!-- Appearance Section -->
	<div class="section">
		<h3 class="section-heading">Appearance</h3>
		<ModeToggle {mode} onchange={onModeChange} />
	</div>

	<!-- Accent Color Section -->
	<div class="section">
		<h3 class="section-heading">Accent color</h3>
		<AccentPicker {accentHue} {theme} {mode} onchange={onAccentChange} />
	</div>
</div>

<style>
	.theme-picker {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.section-heading {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-muted);
		font-family: var(--font-body);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0;
	}

	.theme-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 12px;
	}
</style>
